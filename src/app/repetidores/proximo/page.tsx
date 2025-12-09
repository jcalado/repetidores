'use client';

import { useRepeaters } from '../RepeatersProvider';
import NearestRepeater from '@/components/NearestRepeater';

export default function NearestRepeaterPage() {
  const { repeaters } = useRepeaters();

  return (
    <div className="min-h-screen bg-background">
      <div className="px-3 py-3 sm:p-4 md:p-8 max-w-6xl mx-auto">
        <NearestRepeater repeaters={repeaters} />
      </div>
    </div>
  );
}
