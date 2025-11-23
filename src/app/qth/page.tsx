'use client';

import dynamic from 'next/dynamic';

// Disable SSR for the calculator component due to Leaflet requirements
const QTHLocatorCalculator = dynamic(
  () => import('@/components/QTHLocatorCalculator'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-slate-600 dark:text-slate-300">A carregar calculadora QTH...</p>
        </div>
      </div>
    ),
  }
);

export default function QTHPage() {
  return <QTHLocatorCalculator />;
}
