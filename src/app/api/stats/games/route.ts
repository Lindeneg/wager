import {NextResponse} from "next/server";
import HttpException from "@/lib/http-exception";
import {statsCache} from "@/lib/cache";
import {computeGameStats, type GameStats} from "@/lib/stats";

const CACHE_KEY = "stats:games";

export async function GET() {
    try {
        const data = await statsCache.getOrSet<GameStats[]>(
            CACHE_KEY,
            computeGameStats
        );

        return NextResponse.json({games: data});
    } catch (err) {
        console.error("Game stats error:", err);
        return HttpException.internal().toNextResponse();
    }
}
