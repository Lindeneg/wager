"use client";

import {useState, useEffect} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import {useApi} from "@/hooks/use-api";

interface User {
    id: number;
    name: string;
}

interface HeaderProps {
    username?: string;
}

export function Header({username}: HeaderProps) {
    const router = useRouter();
    const {get, post, loading} = useApi();

    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

    const [gameName, setGameName] = useState("");
    const [gameDialogOpen, setGameDialogOpen] = useState(false);

    useEffect(() => {
        if (sessionDialogOpen) {
            get<{users: User[]}>("/api/user").then((res) => {
                if (res.ok && res.data) {
                    setUsers(res.data.users);
                }
            });
        }
    }, [sessionDialogOpen, get]);

    async function handleSignOut() {
        await get("/api/signout");
        router.push("/login");
        router.refresh();
    }

    function toggleUser(userId: number) {
        setSelectedUserIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    }

    async function handleCreateSession() {
        if (selectedUserIds.length < 2) return;

        const res = await post<{id: number}>("/api/session", {
            userIds: selectedUserIds,
        });

        if (res.ok && res.data) {
            setSessionDialogOpen(false);
            setSelectedUserIds([]);
            router.push(`/session/${res.data.id}`);
            router.refresh();
        }
    }

    async function handleCreateGame() {
        if (!gameName.trim()) return;

        const res = await post("/api/game", {name: gameName.trim()});

        if (res.ok) {
            setGameDialogOpen(false);
            setGameName("");
            router.refresh();
        }
    }

    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
                <Dialog
                    open={sessionDialogOpen}
                    onOpenChange={setSessionDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>Begin Session</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Begin New Session</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Label>Select Participants (min 2)</Label>
                            <div className="flex flex-wrap gap-2">
                                {users.map((user) => (
                                    <Button
                                        key={user.id}
                                        type="button"
                                        variant={
                                            selectedUserIds.includes(user.id)
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() => toggleUser(user.id)}>
                                        {user.name}
                                    </Button>
                                ))}
                            </div>
                            {users.length === 0 && (
                                <p className="text-sm text-zinc-500">
                                    Loading users...
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handleCreateSession}
                                disabled={selectedUserIds.length < 2 || loading}>
                                {loading ? "Creating..." : "Start Session"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={gameDialogOpen} onOpenChange={setGameDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="secondary">Add New Game</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Game</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="gameName">Game Name</Label>
                                <Input
                                    id="gameName"
                                    value={gameName}
                                    onChange={(e) => setGameName(e.target.value)}
                                    placeholder="e.g. Poker, Blackjack"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handleCreateGame}
                                disabled={!gameName.trim() || loading}>
                                {loading ? "Adding..." : "Add Game"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Button variant="outline" asChild>
                    <Link href="/stats">Stats</Link>
                </Button>
            </div>
            <div className="flex items-center gap-4">
                {username && (
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Signed in as <strong>{username}</strong>
                    </span>
                )}
                <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                </Button>
            </div>
        </header>
    );
}
