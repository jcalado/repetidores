'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { UserLocation } from '@/contexts/UserLocationContext';
import { formatAddress, reverseGeocode } from '@/lib/geolocation';
import { Loader2, MapPinned } from 'lucide-react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import * as React from 'react';

// Dynamically import the map component to avoid SSR issues with Leaflet
const LocationPickerMap = dynamic(() => import('./LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full flex items-center justify-center bg-muted rounded-lg">
      <span className="text-muted-foreground">A carregar mapa...</span>
    </div>
  ),
});

interface LocationPickerDialogProps {
  onLocationSelect: (location: UserLocation) => void;
  disabled?: boolean;
}

export default function LocationPickerDialog({
  onLocationSelect,
  disabled,
}: LocationPickerDialogProps) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);
  const [selectedLocation, setSelectedLocation] = React.useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [address, setAddress] = React.useState<string | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = React.useState(false);

  // Reverse geocode when location changes
  React.useEffect(() => {
    if (!selectedLocation) {
      setAddress(null);
      return;
    }

    let cancelled = false;
    setIsLoadingAddress(true);

    reverseGeocode(selectedLocation.lat, selectedLocation.lng).then((result) => {
      if (cancelled) return;
      setIsLoadingAddress(false);
      if (result) {
        setAddress(formatAddress(result));
      } else {
        setAddress(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedLocation]);

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        timestamp: Date.now(),
      });
      setOpen(false);
      setSelectedLocation(null);
      setAddress(null);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedLocation(null);
      setAddress(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <MapPinned className="mr-2 h-4 w-4" />
          {t('location.pickOnMap')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('location.pickOnMapTitle')}</DialogTitle>
          <DialogDescription>
            {t('location.pickOnMapDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="h-[400px] w-full rounded-lg overflow-hidden border">
          <LocationPickerMap
            selectedLocation={selectedLocation}
            onLocationSelect={setSelectedLocation}
          />
        </div>

        {selectedLocation && (
          <div className="text-center space-y-1">
            {isLoadingAddress ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('location.loadingAddress')}</span>
              </div>
            ) : address ? (
              <p className="text-sm font-medium">{address}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('location.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedLocation}>
            {t('location.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
