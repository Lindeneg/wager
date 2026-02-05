"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {useApi} from "@/hooks/use-api";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {PageLayout} from "@/components/layout";
import {ErrorAlert} from "@/components/feedback";

interface Field {
    name: string;
    label: string;
    type: string;
    placeholder?: string;
    hint?: string;
    minLength?: number;
    maxLength?: number;
}

interface AuthFormProps {
    title: string;
    description: string;
    endpoint: string;
    submitLabel: string;
    loadingLabel: string;
    fields: Field[];
    footerText: string;
    footerLinkText: string;
    footerLinkHref: string;
    redirectTo?: string;
}

export function AuthForm({
    title,
    description,
    endpoint,
    submitLabel,
    loadingLabel,
    fields,
    footerText,
    footerLinkText,
    footerLinkHref,
    redirectTo = "/",
}: AuthFormProps) {
    const router = useRouter();
    const {post, loading, error} = useApi();
    const [values, setValues] = useState<Record<string, string>>(
        Object.fromEntries(fields.map((f) => [f.name, ""]))
    );

    function handleChange(name: string, value: string) {
        setValues((prev) => ({...prev, [name]: value}));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const result = await post(endpoint, values);

        if (result.ok) {
            router.push(redirectTo);
            router.refresh();
        }
    }

    return (
        <PageLayout centered>
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <ErrorAlert message={String(error)} />
                        {fields.map((field) => (
                            <div key={field.name} className="space-y-2">
                                <Label htmlFor={field.name}>
                                    {field.label}
                                </Label>
                                <Input
                                    id={field.name}
                                    type={field.type}
                                    placeholder={field.placeholder}
                                    value={values[field.name]}
                                    onChange={(e) =>
                                        handleChange(field.name, e.target.value)
                                    }
                                    required
                                    minLength={field.minLength}
                                    maxLength={field.maxLength}
                                />
                                {field.hint && (
                                    <p className="text-xs text-zinc-500">
                                        {field.hint}
                                    </p>
                                )}
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pt-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}>
                            {loading ? loadingLabel : submitLabel}
                        </Button>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {footerText}{" "}
                            <Link
                                href={footerLinkHref}
                                className="text-zinc-900 underline dark:text-zinc-100">
                                {footerLinkText}
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </PageLayout>
    );
}
