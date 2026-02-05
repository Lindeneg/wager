import type {ApiError} from "@/hooks/use-api";
import {cn} from "@/lib/utils";

interface ApiErrorDisplayProps {
    error: ApiError | null;
    className?: string;
}

export function ApiErrorDisplay({error, className}: ApiErrorDisplayProps) {
    if (!error) return null;

    // Check if error.error is a validation object (has nested {errors: string[]} structure)
    const isValidationError =
        error.error &&
        typeof error.error === "object" &&
        Object.values(error.error).every(
            (v) => v && typeof v === "object" && "errors" in v
        );

    // If error.error is a simple string, show it as the detail
    const simpleErrorDetail =
        error.error && typeof error.error === "string" ? error.error : null;

    return (
        <div
            className={cn(
                "rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50",
                className
            )}>
            {/* Main message */}
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {error.msg}
            </p>

            {/* Simple error detail (string) */}
            {simpleErrorDetail && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {simpleErrorDetail}
                </p>
            )}

            {/* Field-specific validation errors */}
            {isValidationError && (
                <ul className="mt-2 space-y-1">
                    {Object.entries(error.error!).map(([field, fieldError]) => (
                        <li key={field}>
                            <span className="text-sm font-medium capitalize text-red-700 dark:text-red-300">
                                {field}:
                            </span>
                            <ul className="ml-4 list-disc">
                                {(fieldError as {errors: string[]}).errors.map(
                                    (err, i) => (
                                        <li
                                            key={i}
                                            className="text-sm text-red-600 dark:text-red-400">
                                            {err}
                                        </li>
                                    )
                                )}
                            </ul>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
