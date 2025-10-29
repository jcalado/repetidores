'use client';

import dynamic from 'next/dynamic';

// Disable SSR for this page since it uses browser APIs (localStorage, navigator.geolocation)
const ISSPassCalculator = dynamic(
  () => import('@/components/ISSPassCalculator').then((mod) => ({ default: mod.ISSPassCalculator })),
  { ssr: false }
);

export default function ISSPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ISSPassCalculator />
    </div>
  );
}
