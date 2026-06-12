import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import HttpException from "./lib/http-exception";
import {verifyToken} from "@/lib/auth";
import {db} from "@/lib/db";

const PUBLIC_PATHS = ["/login", "/signup"];
const PUBLIC_API_PATHS = ["/api/login", "/api/signup", "/api/ping"];

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
}

function isPublicApiPath(pathname: string): boolean {
    return PUBLIC_API_PATHS.some((path) => pathname.startsWith(path));
}

export async function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl;
    const cookieName = process.env.JWT_COOKIE || "auth-cookie-wager";
    const token = request.cookies.get(cookieName)?.value;
    let user = token ? verifyToken(token) : null;
    let staleToken = false;

    // The token must belong to an existing user with a matching name
    if (user) {
        const dbUser = await db.user.findUnique({where: {id: user.id}});
        if (!dbUser || dbUser.name !== user.name) {
            user = null;
            staleToken = true;
        }
    }

    // Protected API routes require auth
    if (pathname.startsWith("/api/")) {
        if (isPublicApiPath(pathname) || user) {
            return NextResponse.next();
        }
        const response = HttpException.unauthorized().toNextResponse();
        if (staleToken) {
            response.cookies.delete(cookieName);
        }
        return response;
    }

    // Authenticated users on login/signup -> redirect to home
    if (isPublicPath(pathname) && user) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Unauthenticated users on any other page -> redirect to login
    if (!isPublicPath(pathname) && !user) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        if (staleToken) {
            response.cookies.delete(cookieName);
        }
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
