
'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const MapClient = () => {
  return <MapView />;
};

export default MapClient;
