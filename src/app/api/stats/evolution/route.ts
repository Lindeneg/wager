import {NextResponse} from "next/server";
import HttpException from "@/lib/http-exception";
import {statsCache} from "@/lib/cache";
import {computeEvolution, type EvolutionDataPoint} from "@/lib/stats";

const CACHE_KEY = "stats:evolution";

export async function GET() {
    try {
        const data = await statsCache.getOrSet<EvolutionDataPoint[]>(
            CACHE_KEY,
            computeEvolution
        );

        return NextResponse.json({evolution: data});
    } catch (err) {
        console.error("Evolution stats error:", err);
        return HttpException.internal().toNextResponse();
    }
}
