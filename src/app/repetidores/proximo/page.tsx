'use client';

import { useRepeaters } from '../RepeatersProvider';
import NearestRepeater from '@/components/NearestRepeater';

export default function NearestRepeaterPage() {
  const { repeaters } = useRepeaters();

  return (
    <div className="min-h-screen bg-gradient-to-b from-ship-cove-50/50 via-background to-background dark:from-ship-cove-950/30 dark:via-background dark:to-background">
      <div className="px-3 py-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
        <NearestRepeater repeaters={repeaters} />
      </div>
    </div>
  );
}
