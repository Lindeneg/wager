import {cn} from "@/lib/utils";

interface LoadingStateProps {
    message?: string;
    className?: string;
}

export function LoadingState({
    message = "Loading...",
    className,
}: LoadingStateProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-center py-12 text-zinc-500 dark:text-zinc-400",
                className
            )}>
            {message}
        </div>
    );
}
