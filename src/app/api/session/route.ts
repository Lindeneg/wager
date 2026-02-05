import {NextRequest, NextResponse} from "next/server";
import z from "zod";
import {db} from "@/lib/db";
import HttpException from "@/lib/http-exception";
import {parseRequestBody} from "@/lib/parse";
import {createResultMap, stringifyResultMap} from "@/lib/result-map";

const createSessionSchema = z.object({
    userIds: z.array(z.number().int().positive()).min(2),
});

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const limit = Math.min(
            parseInt(searchParams.get("limit") || "10"),
            100
        );
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
        const allSessions = activeSession
            ? [activeSession, ...sessions]
            : sessions;

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
    } catch (err) {
        console.error("Session list error:", err);
        return HttpException.internal().toNextResponse();
    }
}

export async function POST(request: NextRequest) {
    try {
        const parsed = await parseRequestBody(request, createSessionSchema);
        if (!parsed.ok) {
            return parsed.ctx.toNextResponse();
        }

        const {userIds} = parsed.data;

        // Check for existing active session
        const activeSession = await db.session.findFirst({
            where: {ended: null},
        });

        if (activeSession) {
            return HttpException.unprocessable(
                "An active session already exists"
            ).toNextResponse();
        }

        // Verify all users exist
        const users = await db.user.findMany({
            where: {id: {in: userIds}},
        });

        if (users.length !== userIds.length) {
            return HttpException.unprocessable(
                "One or more users not found"
            ).toNextResponse();
        }

        const resultMap = createResultMap(userIds);

        const session = await db.session.create({
            data: {
                result: stringifyResultMap(resultMap),
                started: new Date(),
                participants: {
                    create: userIds.map((userId) => ({userId})),
                },
            },
            include: {
                participants: {
                    include: {user: {select: {id: true, name: true}}},
                },
            },
        });

        return NextResponse.json({
            id: session.id,
            result: session.result,
            started: session.started,
            ended: session.ended,
            users: session.participants.map((p) => p.user),
        });
    } catch (err) {
        console.error("Session create error:", err);
        return HttpException.internal().toNextResponse();
    }
}
