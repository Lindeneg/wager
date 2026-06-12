export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatDateShort(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatDateTime(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatCurrency(amount: number): string {
    return amount.toLocaleString();
}

// Intl.DurationFormat is missing from the bundled TypeScript lib
declare global {
    namespace Intl {
        interface DurationFormatOptions {
            style?: "long" | "short" | "narrow" | "digital";
        }

        interface DurationInput {
            days?: number;
            hours?: number;
            minutes?: number;
            seconds?: number;
        }

        class DurationFormat {
            constructor(
                locales?: string | string[],
                options?: DurationFormatOptions
            );
            format(duration: DurationInput): string;
        }
    }
}

export function formatDuration(
    start: string | Date,
    end: string | Date
): string {
    const startDate = typeof start === "string" ? new Date(start) : start;
    const endDate = typeof end === "string" ? new Date(end) : end;
    const diffSeconds = Math.max(
        0,
        Math.round((endDate.getTime() - startDate.getTime()) / 1000)
    );

    const days = Math.floor(diffSeconds / 86400);
    const hours = Math.floor((diffSeconds % 86400) / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);

    // Only show seconds for sub-minute durations
    const duration: Intl.DurationInput =
        diffSeconds < 60
            ? {seconds: diffSeconds}
            : {days, hours, minutes};

    if (typeof Intl.DurationFormat === "function") {
        return new Intl.DurationFormat("en", {style: "narrow"}).format(
            duration
        );
    }

    // Fallback for runtimes without Intl.DurationFormat (e.g. Node < 23)
    const parts: string[] = [];
    if (duration.days) parts.push(`${duration.days}d`);
    if (duration.hours) parts.push(`${duration.hours}h`);
    if (duration.minutes) parts.push(`${duration.minutes}m`);
    if (duration.seconds !== undefined) parts.push(`${duration.seconds}s`);
    return parts.join(" ") || "0m";
}
