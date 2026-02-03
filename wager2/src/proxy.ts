import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {verifyToken} from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/signup"];

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
}

function isPublicApiPath(pathname: string): boolean {
    return (
        pathname.startsWith("/api/login") || pathname.startsWith("/api/signup")
    );
}

export function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl;
    const cookieName = process.env.JWT_COOKIE || "auth-cookie-wager";
    const token = request.cookies.get(cookieName)?.value;
    const user = token ? verifyToken(token) : null;

    // Protected API routes require auth
    if (pathname.startsWith("/api/")) {
        if (isPublicApiPath(pathname)) {
            return NextResponse.next();
        } else if (user) {
            return NextResponse.next();
        }
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    // Authenticated users on login/signup -> redirect to home
    if (isPublicPath(pathname) && user) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Unauthenticated users on any other page -> redirect to login
    if (!isPublicPath(pathname) && !user) {
        console.log("TEST");
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
