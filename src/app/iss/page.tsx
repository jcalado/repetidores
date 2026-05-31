'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect old /iss route to new /satelites route
export default function ISSPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/satelites');
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <p className="text-center text-muted-foreground">
        Redirecionando para /satelites...
      </p>
    </div>
  );
}
