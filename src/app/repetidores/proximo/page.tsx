'use client';

import { useRepeaters } from '../RepeatersProvider';
import NearestRepeater from '@/components/NearestRepeater';

export default function NearestRepeaterPage() {
  const { repeaters } = useRepeaters();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
      <NearestRepeater repeaters={repeaters} />
    </main>
  );
}
