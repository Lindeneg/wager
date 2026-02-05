"use client";

import {useEffect, useState} from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {useApi} from "@/hooks/use-api";
import {Card, CardContent} from "@/components/ui/card";
import {LoadingState, EmptyState} from "@/components/feedback";

interface User {
    id: number;
    name: string;
}

interface EvolutionDataPoint {
    timestamp: string;
    balances: Record<number, number>;
}

interface EvolutionChartProps {
    users: User[];
}

// Colors for different players
const COLORS = [
    "#2563eb", // blue
    "#dc2626", // red
    "#16a34a", // green
    "#9333ea", // purple
    "#ea580c", // orange
    "#0891b2", // cyan
    "#be185d", // pink
    "#65a30d", // lime
];

export function EvolutionChart({users}: EvolutionChartProps) {
    const {get, loading} = useApi();
    const [data, setData] = useState<EvolutionDataPoint[]>([]);

    useEffect(() => {
        get<{evolution: EvolutionDataPoint[]}>("/api/stats/evolution").then(
            (res) => {
                if (res.ok && res.data) {
                    setData(res.data.evolution);
                }
            }
        );
    }, [get]);

    if (loading && data.length === 0) {
        return <LoadingState />;
    }

    if (data.length === 0) {
        return <EmptyState message="No session data yet" />;
    }

    // Transform data for recharts
    const chartData = data.map((point, index) => {
        const date = new Date(point.timestamp);
        const formatted = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });

        const row: Record<string, number | string> = {
            name: formatted,
            index: index + 1,
        };

        for (const user of users) {
            row[user.name] = point.balances[user.id] || 0;
        }

        return row;
    });

    return (
        <Card>
            <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                            dataKey="name"
                            tick={{fontSize: 12}}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{fontSize: 12}}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "var(--background)",
                                border: "1px solid var(--border)",
                                borderRadius: "8px",
                            }}
                            isAnimationActive={false}
                        />
                        <Legend />
                        {users.map((user, index) => (
                            <Line
                                key={user.id}
                                type="monotone"
                                dataKey={user.name}
                                stroke={COLORS[index % COLORS.length]}
                                strokeWidth={2}
                                dot={{r: 4}}
                                activeDot={{r: 6}}
                                isAnimationActive={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
