'use client';

import { QCodeReference } from '@/components/qcodes/QCodeReference';

export default function QCodesPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <QCodeReference />
    </main>
  );
}
