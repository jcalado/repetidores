
"use client";

import dynamic from 'next/dynamic';
import type { Repeater } from "@/app/columns";

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

type Props = { repeaters: Repeater[] };

const MapClient = ({ repeaters }: Props) => {
  return <MapView repeaters={repeaters} />;
};

export default MapClient;
