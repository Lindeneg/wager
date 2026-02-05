import {PageLayout, PageContainer} from "@/components/layout";
import {SectionTitle} from "@/components/typography";
import {GameStatsTable} from "@/components/stats/game-stats-table";
import {HeadToHead} from "@/components/stats/head-to-head";
import {EvolutionChart} from "@/components/stats/evolution-chart";
import {db} from "@/lib/db";

export default async function StatsPage() {
    const users = await db.user.findMany({
        select: {id: true, name: true},
        orderBy: {name: "asc"},
    });

    return (
        <PageLayout>
            <PageContainer>
                <header className="mb-8">
                    <h1 className="text-2xl font-bold">Statistics</h1>
                </header>

                <main className="space-y-8">
                    <section>
                        <SectionTitle className="mb-4">
                            Game Overview
                        </SectionTitle>
                        <GameStatsTable />
                    </section>

                    <section>
                        <SectionTitle className="mb-4">
                            Head-to-Head
                        </SectionTitle>
                        <HeadToHead users={users} />
                    </section>

                    <section>
                        <SectionTitle className="mb-4">
                            Balance Evolution
                        </SectionTitle>
                        <EvolutionChart users={users} />
                    </section>
                </main>
            </PageContainer>
        </PageLayout>
    );
}
