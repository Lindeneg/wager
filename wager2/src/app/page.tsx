import {Suspense} from "react";
import {getAuthUser} from "@/lib/auth";
import {PageLayout, PageContainer} from "@/components/layout";
import {Header, ResultsSection, SessionsTable} from "@/components/home";

export default async function HomePage() {
    const user = await getAuthUser();

    return (
        <PageLayout>
            <PageContainer>
                <Header username={user?.name} />

                <main className="mt-8 space-y-8">
                    <Suspense fallback={<ResultsSkeleton />}>
                        <ResultsSection />
                    </Suspense>

                    <Suspense fallback={<TableSkeleton />}>
                        <SessionsTable />
                    </Suspense>
                </main>
            </PageContainer>
        </PageLayout>
    );
}

function ResultsSkeleton() {
    return (
        <section>
            <div className="mb-4 h-7 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
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
            <div className="mb-4 h-7 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-64 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </section>
    );
}
