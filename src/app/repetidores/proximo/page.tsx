'use client';

import { useRepeaters } from '../RepeatersProvider';
import NearestRepeater from '@/components/NearestRepeater';

export default function NearestRepeaterPage() {
  const { repeaters } = useRepeaters();

  return (
    <div className="min-h-screen bg-gradient-to-b from-ship-cove-50/50 via-background to-background dark:from-ship-cove-950/30 dark:via-background dark:to-background">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        <NearestRepeater repeaters={repeaters} />
      </div>
    </div>
  );
}
