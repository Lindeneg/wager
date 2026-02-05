import {NextResponse} from "next/server";
import HttpException from "@/lib/http-exception";
import {statsCache} from "@/lib/cache";
import {computeBestGames, type UserBestGame} from "@/lib/stats";

const CACHE_KEY = "stats:best-games";

export async function GET() {
    try {
        const data = await statsCache.getOrSet<UserBestGame[]>(
            CACHE_KEY,
            computeBestGames
        );

        return NextResponse.json({bestGames: data});
    } catch (err) {
        console.error("Best games stats error:", err);
        return HttpException.internal().toNextResponse();
    }
}
