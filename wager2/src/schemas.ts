import {z} from "zod";

export const authUserSchema = z.object({
    id: z.number(),
    name: z.string(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const authCredsSchema = z.object({
    username: z.string().min(3).max(12),
    password: z.string().min(8).max(32),
});

export type AuthCredsUser = z.infer<typeof authCredsSchema>;
