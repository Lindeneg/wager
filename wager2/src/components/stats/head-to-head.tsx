"use client";

import {useState} from "react";
import {useApi} from "@/hooks/use-api";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface User {
    id: number;
    name: string;
}

interface HeadToHeadStats {
    player1: {id: number; name: string};
    player2: {id: number; name: string};
    player1Wins: number;
    player2Wins: number;
    netAmount: number;
    moneyLeader: {id: number; name: string} | null;
}

interface HeadToHeadProps {
    users: User[];
}

export function HeadToHead({users}: HeadToHeadProps) {
    const {get, loading} = useApi();
    const [player1Id, setPlayer1Id] = useState<string>("");
    const [player2Id, setPlayer2Id] = useState<string>("");
    const [stats, setStats] = useState<HeadToHeadStats | null>(null);

    const samePlayerSelected = player1Id && player2Id && player1Id === player2Id;
    const canCompare = player1Id && player2Id && !samePlayerSelected;

    async function handleCompare() {
        if (!canCompare) return;

        const res = await get<HeadToHeadStats>(
            `/api/stats/head-to-head?player1=${player1Id}&player2=${player2Id}`
        );

        if (res.ok && res.data) {
            setStats(res.data);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1">
                    <label className="text-sm text-zinc-500">Player 1</label>
                    <Select value={player1Id} onValueChange={setPlayer1Id}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map((user) => (
                                <SelectItem
                                    key={user.id}
                                    value={user.id.toString()}>
                                    {user.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <span className="pb-2 text-zinc-400">vs</span>

                <div className="space-y-1">
                    <label className="text-sm text-zinc-500">Player 2</label>
                    <Select value={player2Id} onValueChange={setPlayer2Id}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map((user) => (
                                <SelectItem
                                    key={user.id}
                                    value={user.id.toString()}>
                                    {user.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    onClick={handleCompare}
                    disabled={!canCompare || loading}>
                    {loading ? "Loading..." : "Compare"}
                </Button>
            </div>

            {samePlayerSelected && (
                <p className="text-sm text-zinc-500">
                    Please select two different players to compare.
                </p>
            )}

            {stats && !samePlayerSelected && (
                <Card>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold">
                                    {stats.player1.name}
                                </p>
                                <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                                    {stats.player1Wins}
                                </p>
                                <p className="text-sm text-zinc-500">wins</p>
                            </div>

                            <div className="flex flex-col items-center justify-center">
                                <p className="text-sm text-zinc-400">
                                    Net Money
                                </p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {stats.netAmount}
                                </p>
                                <p className="text-xs text-zinc-400">
                                    {stats.moneyLeader
                                        ? `${stats.moneyLeader.name} ahead`
                                        : "Even"}
                                </p>
                            </div>

                            <div>
                                <p className="text-2xl font-bold">
                                    {stats.player2.name}
                                </p>
                                <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                                    {stats.player2Wins}
                                </p>
                                <p className="text-sm text-zinc-500">wins</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
