"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface PageSizeSelectProps {
    value: number;
    onChange: (value: number) => void;
    options?: number[];
    label?: string;
}

const DEFAULT_OPTIONS = [10, 20, 50, 100];

export function PageSizeSelect({
    value,
    onChange,
    options = DEFAULT_OPTIONS,
    label = "Page Size",
}: PageSizeSelectProps) {
    return (
        <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">
                {label}
            </label>
            <Select
                value={value.toString()}
                onValueChange={(v) => onChange(parseInt(v))}>
                <SelectTrigger className="w-20">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                            {size}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
