import {NextRequest, NextResponse} from "next/server";
import {db} from "@/lib/db";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get total count
    const totalCount = await db.session.count();

    // Get active session first (if exists)
    const activeSession = await db.session.findFirst({
        where: {ended: null},
        include: {
            participants: {
                include: {user: true},
            },
            gameSessions: true,
        },
    });

    // Calculate how many more to fetch
    const adjustedLimit = activeSession ? limit - 1 : limit;

    // Get other sessions (excluding active), ordered by ended desc
    const sessions = await db.session.findMany({
        where: activeSession
            ? {id: {not: activeSession.id}}
            : {ended: {not: null}},
        orderBy: {ended: "desc"},
        take: adjustedLimit,
        skip: offset,
        include: {
            participants: {
                include: {user: true},
            },
            gameSessions: true,
        },
    });

    // Prepend active session if exists
    const allSessions = activeSession ? [activeSession, ...sessions] : sessions;

    // Transform to response format
    const data = allSessions.map((session) => ({
        id: session.id,
        users: session.participants.map((p) => p.user.name).join(", "),
        gameSessionCount: session.gameSessions.length,
        started: session.started,
        ended: session.ended,
        isActive: session.ended === null,
    }));

    const nextOffset = offset + limit;
    const hasMore = nextOffset < totalCount;

    return NextResponse.json({
        sessions: data,
        pagination: {
            total: totalCount,
            limit,
            offset,
            next: hasMore
                ? `/api/session?limit=${limit}&offset=${nextOffset}`
                : null,
            prev:
                offset > 0
                    ? `/api/session?limit=${limit}&offset=${Math.max(
                          0,
                          offset - limit
                      )}`
                    : null,
        },
    });
}
