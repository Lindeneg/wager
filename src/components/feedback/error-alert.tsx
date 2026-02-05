import {cn} from "@/lib/utils";

interface ErrorAlertProps {
    message: string | null | undefined;
    className?: string;
}

export function ErrorAlert({message, className}: ErrorAlertProps) {
    if (!message) return null;

    return (
        <div
            className={cn(
                "rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400",
                className
            )}>
            {message}
        </div>
    );
}
