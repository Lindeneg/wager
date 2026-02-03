import z from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {cookies} from "next/headers";
import config from "@/config";
import type {AuthUser} from "@/types";
import {authUserSchema} from "@/schemas";

export function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.HASH_COST);
}

export function createToken(id: number, name: string): string {
    return jwt.sign({id, name}, config.JWT_SECRET, {algorithm: "HS512"});
}

export function verifyToken(token: string): AuthUser | null {
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET, {
            algorithms: ["HS512"],
        });
        const parsed = z.safeParse(authUserSchema, decoded);
        if (parsed.success) return parsed.data;
    } catch (err) {
        // TODO maybe not log error here
        console.log(err);
    }
    return null;
}

// Cookie management
export async function setAuthCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(config.JWT_COOKIE, token, {
        path: "/",
        sameSite: "strict",
        httpOnly: true,
        secure: config.isProduction(),
        maxAge: config.COOKIE_MAX_AGE,
    });
}

export async function removeAuthCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(config.JWT_COOKIE, "", {
        path: "/",
        maxAge: -1,
    });
}

export async function getAuthCookie(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(config.JWT_COOKIE)?.value;
}

export async function getAuthUser(): Promise<AuthUser | null> {
    const token = await getAuthCookie();
    if (!token) return null;
    return verifyToken(token);
}
