'use client';

import Script from 'next/script';

const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const UMAMI_HOST = process.env.NEXT_PUBLIC_UMAMI_HOST || 'https://cloud.umami.is';

export default function UmamiAnalytics() {
  if (!UMAMI_WEBSITE_ID) return null;

  return (
    <Script
      src={`${UMAMI_HOST}/script.js`}
      data-website-id={UMAMI_WEBSITE_ID}
      strategy="afterInteractive"
    />
  );
}
