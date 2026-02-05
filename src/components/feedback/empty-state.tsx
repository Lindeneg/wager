import {cn} from "@/lib/utils";

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    title,
    description,
    icon,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-12 text-center",
                className
            )}>
            {icon && (
                <div className="mb-4 text-zinc-400 dark:text-zinc-600">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                {title}
            </h3>
            {description && (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
