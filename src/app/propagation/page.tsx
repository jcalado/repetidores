'use client';

import dynamic from 'next/dynamic';

// Disable SSR for this page since it uses browser APIs (DOMParser for XML parsing)
const PropagationStatus = dynamic(
  () => import('@/components/propagation/PropagationStatus').then((mod) => ({ default: mod.PropagationStatus })),
  { ssr: false }
);

export default function PropagationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PropagationStatus />
    </div>
  );
}
