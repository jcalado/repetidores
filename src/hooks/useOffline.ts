'use client';

import { useSyncExternalStore } from 'react';

function subscribe(onStoreChange: () => void) {
  window.addEventListener('online', onStoreChange);
  window.addEventListener('offline', onStoreChange);

  return () => {
    window.removeEventListener('online', onStoreChange);
    window.removeEventListener('offline', onStoreChange);
  };
}

const getSnapshot = () => !navigator.onLine;

// The server (and the static export) has no navigator; assume online so the
// first client render matches the pre-rendered HTML.
const getServerSnapshot = () => false;

export function useOffline() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
