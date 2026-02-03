import {z} from "zod";

export const authUserSchema = z.object({
    id: z.number(),
    name: z.string(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const authLoginSchema = z.object({
    username: z.string().min(3).max(12),
    password: z.string().min(8).max(32),
});

export type AuthLogin = z.infer<typeof authLoginSchema>;

export const authSignupSchema = authLoginSchema.extend({
    inviteCode: z.string(),
});

export type AuthSignup = z.infer<typeof authSignupSchema>;
