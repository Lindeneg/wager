import {NextRequest, NextResponse} from "next/server";
import HttpException from "@/lib/http-exception";
import {statsCache} from "@/lib/cache";
import {computeHeadToHead, type HeadToHeadStats} from "@/lib/stats";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const player1 = parseInt(searchParams.get("player1") || "");
        const player2 = parseInt(searchParams.get("player2") || "");

        if (isNaN(player1) || isNaN(player2)) {
            return HttpException.malformedBody(
                "player1 and player2 query params required"
            ).toNextResponse();
        }

        if (player1 === player2) {
            return HttpException.malformedBody(
                "player1 and player2 must be different"
            ).toNextResponse();
        }

        const cacheKey = `stats:h2h:${Math.min(player1, player2)}:${Math.max(player1, player2)}`;

        const data = await statsCache.getOrSet<HeadToHeadStats | null>(
            cacheKey,
            () => computeHeadToHead(player1, player2)
        );

        if (!data) {
            return HttpException.notFound("One or both players not found").toNextResponse();
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Head-to-head stats error:", err);
        return HttpException.internal().toNextResponse();
    }
}
