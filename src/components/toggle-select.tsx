"use client";

import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";

interface Item {
    id: number;
    name: string;
}

interface ToggleSelectProps {
    items: Item[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    /** For single selection mode, highlights the selected item with green */
    singleSelect?: boolean;
    className?: string;
    emptyMessage?: string;
}

export function ToggleSelect({
    items,
    selectedIds,
    onToggle,
    singleSelect,
    className,
    emptyMessage = "Nothing available",
}: ToggleSelectProps) {
    if (items.length === 0) {
        return <p className="text-sm text-zinc-500">{emptyMessage}</p>;
    }

    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {items.map((item) => {
                const isSelected = selectedIds.includes(item.id);

                return (
                    <Button
                        key={item.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => onToggle(item.id)}
                        className={cn(
                            singleSelect &&
                                isSelected &&
                                "bg-green-600 hover:bg-green-700"
                        )}>
                        {item.name}
                    </Button>
                );
            })}
        </div>
    );
}
