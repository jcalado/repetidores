'use client';

import { useRepeaters } from '../RepeatersProvider';
import NearestRepeater from '@/components/NearestRepeater';

export default function NearestRepeaterPage() {
  const { repeaters } = useRepeaters();

  return <NearestRepeater repeaters={repeaters} />;
}
