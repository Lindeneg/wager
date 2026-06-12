import {cn} from "@/lib/utils";
import {ThemeToggle} from "@/components/theme-toggle";

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
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>
            {children}
        </div>
    );
}
