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
import { MapPinned } from 'lucide-react';
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

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        timestamp: Date.now(),
      });
      setOpen(false);
      setSelectedLocation(null);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedLocation(null);
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
          <p className="text-sm text-muted-foreground text-center">
            {t('location.selectedCoords')}: {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
          </p>
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
