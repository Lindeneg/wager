"use client";

import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";

interface User {
    id: number;
    name: string;
}

interface UserToggleSelectProps {
    users: User[];
    selectedIds: number[];
    onToggle: (userId: number) => void;
    /** For single selection mode, highlights the selected user with green */
    singleSelect?: boolean;
    className?: string;
    emptyMessage?: string;
}

export function UserToggleSelect({
    users,
    selectedIds,
    onToggle,
    singleSelect,
    className,
    emptyMessage = "No users available",
}: UserToggleSelectProps) {
    if (users.length === 0) {
        return <p className="text-sm text-zinc-500">{emptyMessage}</p>;
    }

    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {users.map((user) => {
                const isSelected = selectedIds.includes(user.id);

                return (
                    <Button
                        key={user.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => onToggle(user.id)}
                        className={cn(
                            singleSelect &&
                                isSelected &&
                                "bg-green-600 hover:bg-green-700"
                        )}>
                        {user.name}
                    </Button>
                );
            })}
        </div>
    );
}
