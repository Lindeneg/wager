import {NextRequest, NextResponse} from "next/server";
import {db} from "@/lib/db";
import HttpException from "@/lib/http-exception";
import {
    parseResultMap,
    stringifyResultMap,
    mergeResultMaps,
    resolveDebts,
} from "@/lib/result-map";

interface Params {
    params: Promise<{id: string}>;
}

export async function POST(_request: NextRequest, {params}: Params) {
    const {id} = await params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
        return HttpException.malformedBody().toNextResponse();
    }

    const session = await db.session.findUnique({
        where: {id: sessionId},
        include: {
            gameSessions: {where: {ended: null}},
            participants: true,
        },
    });

    if (!session) {
        return HttpException.notFound().toNextResponse();
    }

    if (session.ended) {
        return HttpException.unprocessable(
            "Session has already ended"
        ).toNextResponse();
    }

    // Check no active game session
    if (session.gameSessions.length > 0) {
        return HttpException.unprocessable(
            "Cannot end session with active game"
        ).toNextResponse();
    }

    // End the session
    await db.session.update({
        where: {id: sessionId},
        data: {ended: new Date()},
    });

    // Update global result
    const result = await db.result.findFirst();
    if (result) {
        const userIds = session.participants.map((p) => p.userId);
        const globalResult = parseResultMap(result.data);
        const sessionResult = parseResultMap(session.result);

        const mergedResult = mergeResultMaps(
            userIds,
            globalResult,
            sessionResult
        );
        resolveDebts(mergedResult);

        await db.result.update({
            where: {id: result.id},
            data: {data: stringifyResultMap(mergedResult)},
        });
    }

    return NextResponse.json({success: true});
}
