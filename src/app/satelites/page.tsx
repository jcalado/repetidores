'use client';

import dynamic from 'next/dynamic';

// Disable SSR for this page since it uses browser APIs (localStorage, navigator.geolocation)
const SatelliteTracker = dynamic(
  () => import('@/components/satelites/SatelliteTracker').then((mod) => ({ default: mod.SatelliteTracker })),
  { ssr: false }
);

export default function SatelitesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SatelliteTracker />
    </div>
  );
}
