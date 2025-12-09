'use client';

import { Popover, PopoverButton, PopoverPanel, CloseButton } from '@headlessui/react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { Loader2, Search, Navigation } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { qthToLatLon, isValidQth } from '@/lib/iss/qth-locator';
import { searchLocation, reverseGeocode, formatAddress, type GeocodingResult } from '@/lib/geolocation';
import type { UserLocation } from '@/contexts/UserLocationContext';
import LocationPickerDialog from './LocationPickerDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface LocationPickerPopoverProps {
  compact?: boolean;
}

export default function LocationPickerPopover({ compact = false }: LocationPickerPopoverProps) {
  const t = useTranslations();
  const { userLocation, isLocating, requestLocation, setLocation, clearLocation } = useUserLocation();

  // QTH input state
  const [qthInput, setQthInput] = React.useState('');
  const [qthError, setQthError] = React.useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showSearchResults, setShowSearchResults] = React.useState(false);

  // Address display
  const [locationAddress, setLocationAddress] = React.useState<string | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = React.useState(false);

  // Validate QTH as user types
  React.useEffect(() => {
    if (qthInput.length >= 4) {
      setQthError(!isValidQth(qthInput));
    } else {
      setQthError(false);
    }
  }, [qthInput]);

  // Debounced location search
  React.useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocation(searchQuery);
        setSearchResults(results.slice(0, 5));
        setShowSearchResults(true);
      } catch {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Reverse geocode user location to get address
  React.useEffect(() => {
    if (!userLocation) {
      setLocationAddress(null);
      return;
    }

    let cancelled = false;
    setIsLoadingAddress(true);

    reverseGeocode(userLocation.latitude, userLocation.longitude).then((result) => {
      if (cancelled) return;
      setIsLoadingAddress(false);
      if (result) {
        setLocationAddress(formatAddress(result));
      } else {
        setLocationAddress(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userLocation]);

  const handleQthSubmit = () => {
    if (!isValidQth(qthInput)) {
      setQthError(true);
      return;
    }

    const coords = qthToLatLon(qthInput);
    if (coords) {
      setLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: Date.now(),
        qthLocator: qthInput.toUpperCase(),
      });
      setQthInput('');
    }
  };

  const handleSearchSelect = (result: GeocodingResult) => {
    setLocation({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      timestamp: Date.now(),
    });
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleClear = () => {
    clearLocation();
    setQthInput('');
    setSearchQuery('');
    setLocationAddress(null);
  };

  if (compact) {
    return (
      <Popover className="relative">
        <PopoverButton
          className={cn(
            'flex items-center justify-center rounded-md p-2 transition-colors',
            'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800',
            userLocation && 'text-ship-cove-600 dark:text-ship-cove-400'
          )}
        >
          <MapPinIcon className="h-5 w-5" />
        </PopoverButton>

        <PopoverPanel
          transition
          className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/5 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[enter]:ease-out data-[leave]:duration-150 data-[leave]:ease-in dark:bg-slate-900 dark:ring-white/10"
        >
          <PopoverContent
            t={t}
            userLocation={userLocation}
            isLocating={isLocating}
            requestLocation={requestLocation}
            setLocation={setLocation}
            qthInput={qthInput}
            setQthInput={setQthInput}
            qthError={qthError}
            handleQthSubmit={handleQthSubmit}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            isSearching={isSearching}
            showSearchResults={showSearchResults}
            handleSearchSelect={handleSearchSelect}
            locationAddress={locationAddress}
            isLoadingAddress={isLoadingAddress}
            handleClear={handleClear}
          />
        </PopoverPanel>
      </Popover>
    );
  }

  return (
    <Popover className="relative">
      <PopoverButton
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
          userLocation && 'text-ship-cove-600 dark:text-ship-cove-400'
        )}
        title={userLocation?.qthLocator || t('locationPicker.setLocation')}
      >
        <MapPinIcon className="h-4 w-4" />
      </PopoverButton>

      <PopoverPanel
        transition
        className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/5 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[enter]:ease-out data-[leave]:duration-150 data-[leave]:ease-in dark:bg-slate-900 dark:ring-white/10"
      >
        <PopoverContent
          t={t}
          userLocation={userLocation}
          isLocating={isLocating}
          requestLocation={requestLocation}
          setLocation={setLocation}
          qthInput={qthInput}
          setQthInput={setQthInput}
          qthError={qthError}
          handleQthSubmit={handleQthSubmit}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          showSearchResults={showSearchResults}
          handleSearchSelect={handleSearchSelect}
          locationAddress={locationAddress}
          isLoadingAddress={isLoadingAddress}
          handleClear={handleClear}
        />
      </PopoverPanel>
    </Popover>
  );
}

// Extracted content component to avoid duplication
function PopoverContent({
  t,
  userLocation,
  isLocating,
  requestLocation,
  setLocation,
  qthInput,
  setQthInput,
  qthError,
  handleQthSubmit,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  showSearchResults,
  handleSearchSelect,
  locationAddress,
  isLoadingAddress,
  handleClear,
}: {
  t: ReturnType<typeof useTranslations>;
  userLocation: UserLocation | null;
  isLocating: boolean;
  requestLocation: (highAccuracy?: boolean) => void;
  setLocation: (location: UserLocation) => void;
  qthInput: string;
  setQthInput: (v: string) => void;
  qthError: boolean;
  handleQthSubmit: () => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  searchResults: GeocodingResult[];
  isSearching: boolean;
  showSearchResults: boolean;
  handleSearchSelect: (result: GeocodingResult) => void;
  locationAddress: string | null;
  isLoadingAddress: boolean;
  handleClear: () => void;
}) {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t('locationPicker.title')}
        </h3>
        {userLocation && (
          <button
            onClick={handleClear}
            className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
          >
            {t('locationPicker.clear')}
          </button>
        )}
      </div>

      {/* Current Location Display */}
      {userLocation && (
        <div className="rounded-lg bg-ship-cove-50 dark:bg-ship-cove-900/20 p-3 space-y-1">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-ship-cove-600 dark:text-ship-cove-400 shrink-0" />
            <span className="text-sm font-medium text-ship-cove-700 dark:text-ship-cove-300">
              {userLocation.qthLocator}
            </span>
          </div>
          {isLoadingAddress ? (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('location.loadingAddress')}
            </div>
          ) : locationAddress ? (
            <p className="text-xs text-gray-600 dark:text-gray-400 pl-6">
              {locationAddress}
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 pl-6">
              {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </p>
          )}
          {userLocation.isApproximate && (
            <p className="text-xs text-amber-600 dark:text-amber-400 pl-6">
              {t('location.approximate')}
            </p>
          )}
        </div>
      )}

      {/* QTH Locator Input */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {t('locationPicker.qthLabel')}
        </label>
        <div className="flex gap-2">
          <Input
            value={qthInput}
            onChange={(e) => setQthInput(e.target.value.toUpperCase())}
            placeholder={t('locationPicker.qthPlaceholder')}
            className={cn(
              'flex-1 font-mono uppercase',
              qthError && 'border-red-500 focus-visible:ring-red-500'
            )}
            maxLength={6}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleQthSubmit();
              }
            }}
          />
          <Button
            size="sm"
            onClick={handleQthSubmit}
            disabled={!qthInput || qthError}
          >
            {t('locationPicker.qthApply')}
          </Button>
        </div>
        {qthError && (
          <p className="text-xs text-red-500">{t('locationPicker.qthInvalid')}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
        <span className="text-xs text-gray-400">{t('location.or')}</span>
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
      </div>

      {/* Search by Name */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('location.searchPlaceholder')}
            className="pl-8 pr-8"
          />
          {isSearching && (
            <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        {showSearchResults && searchResults.length > 0 && (
          <div className="rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
            {searchResults.map((result) => (
              <CloseButton
                as="button"
                key={result.place_id}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => handleSearchSelect(result)}
              >
                <div className="font-medium">{result.display_name.split(',')[0]}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {result.display_name.split(',').slice(1, 3).join(',')}
                </div>
              </CloseButton>
            ))}
          </div>
        )}
        {showSearchResults && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            {t('location.noResults')}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
        <span className="text-xs text-gray-400">{t('location.or')}</span>
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
      </div>

      {/* GPS and Map buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => requestLocation(true)}
          disabled={isLocating}
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4 mr-2" />
          )}
          {isLocating ? t('location.locating') : t('locationPicker.gpsButton')}
        </Button>

      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
        <span className="text-xs text-gray-400">{t('location.or')}</span>
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
      </div>
      <LocationPickerDialog onLocationSelect={setLocation} />
    </div>
  );
}
