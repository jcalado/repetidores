import { Suspense } from "react";
import RepetidoresProvider from "./RepeatersProvider";
import { fetchRepeaters } from "@/lib/repeaters";

function LoadingSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="rounded-xl border bg-card p-6">
        <div className="flex gap-2 mb-4">
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function RepetidoresContent({ children }: { children: React.ReactNode }) {
  const data = await fetchRepeaters();
  return <RepetidoresProvider initialData={data}>{children}</RepetidoresProvider>;
}

export default function RepetidoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      <Suspense fallback={<LoadingSkeleton />}>
        <RepetidoresContent>{children}</RepetidoresContent>
      </Suspense>
    </main>
  );
}
