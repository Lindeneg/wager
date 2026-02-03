import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const BCRYPT_COST = 10;
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export interface AuthUser {
  id: number;
  name: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

function getCookieName(): string {
  return process.env.JWT_COOKIE || "auth-wager-user";
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function comparePassword(
  hash: string,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT
export function createToken(id: number, name: string): string {
  return jwt.sign({ id, name }, getJwtSecret(), { algorithm: "HS512" });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS512"],
    });

    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "id" in decoded &&
      "name" in decoded
    ) {
      return {
        id: decoded.id as number,
        name: decoded.name as string,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Cookie management
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(getCookieName(), token, {
    path: "/",
    sameSite: "strict",
    httpOnly: true,
    secure: isProduction(),
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(getCookieName(), "", {
    path: "/",
    maxAge: -1,
  });
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(getCookieName())?.value;
}

// Get current authenticated user from cookie
export async function getAuthUser(): Promise<AuthUser | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  return verifyToken(token);
}

// Validation
export function validateUsername(username: string): string | null {
  if (username.length < 3 || username.length > 12) {
    return "Username must be between 3 and 12 characters";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8 || password.length > 32) {
    return "Password must be between 8 and 32 characters";
  }
  return null;
}

export function getInviteCode(): string {
  const code = process.env.INVITE_CODE;
  if (!code) {
    throw new Error("INVITE_CODE environment variable is not set");
  }
  return code;
}
