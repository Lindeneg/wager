import { Suspense } from "react";
import { getAuthUser } from "@/lib/auth";
import { Header, ResultsSection, SessionsTable } from "@/components/home";

export default async function HomePage() {
  const user = await getAuthUser();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Header username={user?.name} />

        <main className="mt-8 space-y-8">
          <Suspense fallback={<ResultsSkeleton />}>
            <ResultsSection />
          </Suspense>

          <Suspense fallback={<TableSkeleton />}>
            <SessionsTable />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Current Results</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>
    </section>
  );
}

function TableSkeleton() {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Sessions</h2>
      <div className="h-64 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
    </section>
  );
}
