import {cn} from "@/lib/utils";

interface PageLayoutProps {
    children: React.ReactNode;
    className?: string;
    centered?: boolean;
}

export function PageLayout({children, className, centered}: PageLayoutProps) {
    return (
        <div
            className={cn(
                "min-h-screen bg-zinc-50 dark:bg-zinc-950",
                centered && "flex items-center justify-center",
                className
            )}>
            {children}
        </div>
    );
}
