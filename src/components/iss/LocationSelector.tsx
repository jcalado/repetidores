'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Loader2, Navigation, Globe } from 'lucide-react';
import { ObserverLocation } from '@/lib/iss/types';
import { qthToLatLon, isValidQth, latLonToQth } from '@/lib/iss/qth-locator';

interface LocationSelectorProps {
  location: ObserverLocation | null;
  onLocationChange: (location: ObserverLocation) => void;
}

export function LocationSelector({ location, onLocationChange }: LocationSelectorProps) {
  const [qthInput, setQthInput] = useState('');
  const [latInput, setLatInput] = useState('');
  const [lonInput, setLonInput] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeolocation = () => {
    setIsDetecting(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocalização não suportada neste navegador');
      setIsDetecting(false);
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
        onLocationChange(newLocation);
        setIsDetecting(false);
      },
      (err) => {
        // Handle rate limiting specifically
        let errorMessage = `Erro ao obter localização: ${err.message}`;

        if (err.message.includes('429') || err.message.includes('rate limit') || err.message.includes('Network location provider')) {
          errorMessage = 'Limite de requisições atingido. Por favor, use "QTH Locator" ou "Coordenadas" em vez disso, ou tente novamente mais tarde.';
        }

        setError(errorMessage);
        setIsDetecting(false);
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
      setError('Localizador QTH inválido. Use formato AA00 ou AA00aa (ex: IM58kr)');
      return;
    }

    const coords = qthToLatLon(qth);
    if (!coords) {
      setError('Não foi possível converter o localizador QTH');
      return;
    }

    const newLocation: ObserverLocation = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      altitude: 0,
      name: qth,
    };

    onLocationChange(newLocation);
    setQthInput('');
  };

  const handleCoordinatesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude inválida. Deve estar entre -90 e 90 graus.');
      return;
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError('Longitude inválida. Deve estar entre -180 e 180 graus.');
      return;
    }

    const newLocation: ObserverLocation = {
      latitude: lat,
      longitude: lon,
      altitude: 0,
      name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    };

    onLocationChange(newLocation);
    setLatInput('');
    setLonInput('');
  };

  const currentQth = location ? latLonToQth(location.latitude, location.longitude, 6) : null;

  return (
    <div className="space-y-4">
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
            Coordenadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auto" className="space-y-3 mt-4">
          <Button
            onClick={handleGeolocation}
            disabled={isDetecting}
            variant="outline"
            className="w-full"
          >
            {isDetecting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Navigation className="h-4 w-4 mr-2" />
            )}
            {isDetecting ? 'Detectando...' : 'Detectar Localização Automática'}
          </Button>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Usa GPS do dispositivo. Se não funcionar (limite de requisições), use as outras opções.
          </p>
        </TabsContent>

        <TabsContent value="qth" className="mt-4">
          <form onSubmit={handleQthSubmit} className="space-y-3">
            <div>
              <Label htmlFor="qth-input">Localizador QTH (Maidenhead)</Label>
              <Input
                id="qth-input"
                type="text"
                placeholder="IM58kr"
                value={qthInput}
                onChange={(e) => setQthInput(e.target.value.toUpperCase())}
                maxLength={6}
                className="font-mono mt-1"
              />
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Formato: AA00 (4 caracteres) ou AA00aa (6 caracteres). Ex: IM58, IM58kr
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
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Norte: positivo (+), Sul: negativo (-). Ex: Lisboa = 38.7223
              </p>
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
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Este: positivo (+), Oeste: negativo (-). Ex: Lisboa = -9.1393
              </p>
            </div>
            <Button type="submit" className="w-full">
              <Globe className="h-4 w-4 mr-2" />
              Usar Coordenadas
            </Button>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              💡 Encontre suas coordenadas em <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-900 dark:hover:text-slate-200">Google Maps</a> (clique direito → copiar coordenadas)
            </p>
          </form>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {location && (
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-slate-600 dark:text-slate-400" />
            <div className="flex-1 space-y-1">
              <div className="font-medium">
                {location.name || 'Localização Atual'}
              </div>
              <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
                <div>
                  Lat: {location.latitude.toFixed(4)}°,
                  Lon: {location.longitude.toFixed(4)}°
                </div>
                {currentQth && (
                  <div className="font-mono">
                    QTH: {currentQth}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
