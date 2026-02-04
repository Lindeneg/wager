"use client";

import {Button} from "@/components/ui/button";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPrev: () => void;
    onNext: () => void;
    hasPrev: boolean;
    hasNext: boolean;
    loading?: boolean;
}

export function Pagination({
    currentPage,
    totalPages,
    onPrev,
    onNext,
    hasPrev,
    hasNext,
    loading,
}: PaginationProps) {
    return (
        <div className="flex items-center justify-between">
            <Button
                variant="outline"
                onClick={onPrev}
                disabled={!hasPrev || loading}>
                Previous
            </Button>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Page {currentPage} / {totalPages}
            </span>
            <Button
                variant="outline"
                onClick={onNext}
                disabled={!hasNext || loading}>
                Next
            </Button>
        </div>
    );
}
