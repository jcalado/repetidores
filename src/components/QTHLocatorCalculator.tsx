'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Navigation, Map, Copy, Check } from 'lucide-react';
import { latLonToQth } from '@/lib/iss/qth-locator';

// Dynamically import map component to avoid SSR issues
const QTHMapClick = dynamic(() => import('@/components/QTHMapClick'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-lg bg-muted animate-pulse flex items-center justify-center">
      <p className="text-muted-foreground">A carregar mapa...</p>
    </div>
  ),
});

export default function QTHLocatorCalculator() {
  const t = useTranslations('qth');

  // Input states
  const [latInput, setLatInput] = useState('');
  const [lonInput, setLonInput] = useState('');

  // Location state
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  // UI states
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Calculate QTH from current location
  const qth4char = location ? latLonToQth(location.lat, location.lon, 4) : '';
  const qth6char = location ? latLonToQth(location.lat, location.lon, 6) : '';

  // Validate and set location from manual input
  const handleManualCalculate = () => {
    setError('');

    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);

    // Validate latitude
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError(t('manual.invalidLat'));
      return;
    }

    // Validate longitude
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError(t('manual.invalidLon'));
      return;
    }

    setLocation({ lat, lon });
  };

  // Handle geolocation
  const handleGeolocation = () => {
    setError('');

    if (!navigator.geolocation) {
      setError(t('geolocation.notSupported'));
      return;
    }

    setIsGeolocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        setLocation({ lat, lon });
        setLatInput(lat.toFixed(4));
        setLonInput(lon.toFixed(4));
        setIsGeolocating(false);
      },
      (error) => {
        setIsGeolocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setError(t('geolocation.denied'));
        } else {
          setError(t('geolocation.error'));
        }
      }
    );
  };

  // Handle map click
  const handleMapClick = (lat: number, lon: number) => {
    setError('');
    setLocation({ lat, lon });
    setLatInput(lat.toFixed(4));
    setLonInput(lon.toFixed(4));
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Methods Card */}
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Localização</CardTitle>
              <CardDescription>
                Escolha um dos métodos abaixo para definir a localização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="manual">
                    <MapPin className="h-4 w-4 mr-2" />
                    {t('tabs.manual')}
                  </TabsTrigger>
                  <TabsTrigger value="geolocation">
                    <Navigation className="h-4 w-4 mr-2" />
                    {t('tabs.geolocation')}
                  </TabsTrigger>
                  <TabsTrigger value="map">
                    <Map className="h-4 w-4 mr-2" />
                    {t('tabs.map')}
                  </TabsTrigger>
                </TabsList>

                {/* Manual Input Tab */}
                <TabsContent value="manual" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{t('manual.title')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('manual.description')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="lat-input">{t('manual.latitude')}</Label>
                      <Input
                        id="lat-input"
                        type="number"
                        step="0.0001"
                        placeholder={t('manual.latitudePlaceholder')}
                        value={latInput}
                        onChange={(e) => setLatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualCalculate()}
                      />
                    </div>

                    <div>
                      <Label htmlFor="lon-input">{t('manual.longitude')}</Label>
                      <Input
                        id="lon-input"
                        type="number"
                        step="0.0001"
                        placeholder={t('manual.longitudePlaceholder')}
                        value={lonInput}
                        onChange={(e) => setLonInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualCalculate()}
                      />
                    </div>

                    <Button onClick={handleManualCalculate} className="w-full">
                      {t('manual.calculate')}
                    </Button>
                  </div>
                </TabsContent>

                {/* Geolocation Tab */}
                <TabsContent value="geolocation" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{t('geolocation.title')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('geolocation.description')}
                    </p>
                  </div>

                  <Button
                    onClick={handleGeolocation}
                    disabled={isGeolocating}
                    className="w-full"
                    variant="outline"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    {isGeolocating ? t('geolocation.detecting') : t('geolocation.button')}
                  </Button>
                </TabsContent>

                {/* Map Click Tab */}
                <TabsContent value="map" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{t('mapClick.title')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('mapClick.description')}
                    </p>
                  </div>

                  <QTHMapClick
                    onLocationSelect={handleMapClick}
                    selectedLocation={location}
                  />
                </TabsContent>
              </Tabs>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('result.title')}</CardTitle>
              <CardDescription>
                {location
                  ? 'Localizador Maidenhead calculado'
                  : t('result.noLocation')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {location ? (
                <div className="space-y-6">
                  {/* Coordinates */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {t('result.coordinates')}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">
                          {t('manual.latitude')}
                        </div>
                        <div className="text-lg font-mono font-semibold">
                          {location.lat.toFixed(4)}°
                        </div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">
                          {t('manual.longitude')}
                        </div>
                        <div className="text-lg font-mono font-semibold">
                          {location.lon.toFixed(4)}°
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QTH 6-char (main) */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {t('result.qth6char')}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-6 bg-gradient-to-br from-ship-cove-500 to-ship-cove-600 rounded-lg text-white">
                        <div className="text-4xl font-bold font-mono tracking-wider">
                          {qth6char}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(qth6char, 'qth6')}
                      >
                        {copiedField === 'qth6' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* QTH 4-char */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {t('result.qth4char')}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold font-mono tracking-wider">
                          {qth4char}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(qth4char, 'qth4')}
                      >
                        {copiedField === 'qth4' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      O localizador QTH (Maidenhead Locator System) é um sistema de coordenadas
                      geográficas usado por radioamadores para identificar localizações de forma
                      compacta. O formato de 6 caracteres oferece precisão de aproximadamente 3×4 km.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {t('result.noLocation')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Selecione uma localização usando um dos métodos acima
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
    </div>
  );
}
