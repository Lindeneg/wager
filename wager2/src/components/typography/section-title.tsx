import {cn} from "@/lib/utils";

interface SectionTitleProps {
    children: React.ReactNode;
    className?: string;
}

export function SectionTitle({children, className}: SectionTitleProps) {
    return (
        <h2
            className={cn(
                "text-xl font-semibold text-zinc-900 dark:text-zinc-100",
                className
            )}>
            {children}
        </h2>
    );
}
