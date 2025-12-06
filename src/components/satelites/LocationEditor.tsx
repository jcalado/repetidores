'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, Navigation, Globe, X } from 'lucide-react';
import { ObserverLocation } from '@/lib/iss/types';
import { qthToLatLon, isValidQth, latLonToQth } from '@/lib/iss/qth-locator';
import { useUserLocation } from '@/contexts/UserLocationContext';

interface LocationEditorProps {
  initialLocation: ObserverLocation | null;
  onSave: (location: ObserverLocation) => void;
  onCancel: () => void;
}

export function LocationEditor({ initialLocation, onSave, onCancel }: LocationEditorProps) {
  const { isLocating } = useUserLocation();
  const [qthInput, setQthInput] = useState('');
  const [latInput, setLatInput] = useState(initialLocation?.latitude.toString() || '');
  const [lonInput, setLonInput] = useState(initialLocation?.longitude.toString() || '');
  const [error, setError] = useState<string | null>(null);

  const handleGeolocation = () => {
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocalizacao nao suportada neste navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: ObserverLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || 0,
          name: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
        };
        onSave(newLocation);
      },
      (err) => {
        let errorMessage = `Erro ao obter localizacao: ${err.message}`;

        if (err.message.includes('429') || err.message.includes('rate limit') || err.message.includes('Network location provider')) {
          errorMessage = 'Limite de requisicoes atingido. Por favor, use "QTH Locator" ou "Coordenadas" em vez disso.';
        }

        setError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleQthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qth = qthInput.trim().toUpperCase();

    if (!isValidQth(qth)) {
      setError('Localizador QTH invalido. Use formato AA00 ou AA00aa (ex: IM58kr)');
      return;
    }

    const coords = qthToLatLon(qth);
    if (!coords) {
      setError('Nao foi possivel converter o localizador QTH');
      return;
    }

    const newLocation: ObserverLocation = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      altitude: 0,
      name: qth,
    };

    onSave(newLocation);
  };

  const handleCoordinatesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude invalida. Deve estar entre -90 e 90 graus.');
      return;
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError('Longitude invalida. Deve estar entre -180 e 180 graus.');
      return;
    }

    const newLocation: ObserverLocation = {
      latitude: lat,
      longitude: lon,
      altitude: 0,
      name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    };

    onSave(newLocation);
  };

  const currentQth = initialLocation
    ? latLonToQth(initialLocation.latitude, initialLocation.longitude, 6)
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Alterar Localizacao
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="auto" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="auto">
              <Navigation className="h-4 w-4 mr-1" />
              Auto
            </TabsTrigger>
            <TabsTrigger value="qth">
              <MapPin className="h-4 w-4 mr-1" />
              QTH
            </TabsTrigger>
            <TabsTrigger value="coords">
              <Globe className="h-4 w-4 mr-1" />
              Coords
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auto" className="space-y-3 mt-4">
            <Button
              onClick={handleGeolocation}
              disabled={isLocating}
              variant="outline"
              className="w-full"
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              {isLocating ? 'Detectando...' : 'Detectar Localizacao Automatica'}
            </Button>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Usa GPS do dispositivo. Se nao funcionar, use as outras opcoes.
            </p>
          </TabsContent>

          <TabsContent value="qth" className="mt-4">
            <form onSubmit={handleQthSubmit} className="space-y-3">
              <div>
                <Label htmlFor="qth-input">Localizador QTH (Maidenhead)</Label>
                <Input
                  id="qth-input"
                  type="text"
                  placeholder={currentQth || 'IM58kr'}
                  value={qthInput}
                  onChange={(e) => setQthInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono mt-1"
                />
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Formato: AA00 ou AA00aa. Ex: IM58, IM58kr
                </p>
              </div>
              <Button type="submit" className="w-full">
                <MapPin className="h-4 w-4 mr-2" />
                Usar Localizador QTH
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="coords" className="mt-4">
            <form onSubmit={handleCoordinatesSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="lat-input">Latitude</Label>
                  <Input
                    id="lat-input"
                    type="number"
                    step="0.0001"
                    placeholder="38.7223"
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lon-input">Longitude</Label>
                  <Input
                    id="lon-input"
                    type="number"
                    step="0.0001"
                    placeholder="-9.1393"
                    value={lonInput}
                    onChange={(e) => setLonInput(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Copie do Google Maps (clique direito → copiar coordenadas)
              </p>
              <Button type="submit" className="w-full">
                <Globe className="h-4 w-4 mr-2" />
                Usar Coordenadas
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end mt-4 pt-3 border-t">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
