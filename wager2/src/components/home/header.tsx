"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";

interface HeaderProps {
  username?: string;
}

export function Header({ username }: HeaderProps) {
  const router = useRouter();
  const { get } = useApi();

  async function handleSignOut() {
    await get("/api/signout");
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Button>Begin Session</Button>
        <Button variant="secondary">Add New Game</Button>
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
