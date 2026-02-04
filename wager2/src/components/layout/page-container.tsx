import {cn} from "@/lib/utils";

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
};

export function PageContainer({
    children,
    className,
    size = "lg",
}: PageContainerProps) {
    return (
        <div
            className={cn(
                "mx-auto w-full px-4 py-6",
                sizeClasses[size],
                className
            )}>
            {children}
        </div>
    );
}
