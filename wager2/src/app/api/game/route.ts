import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import HttpException from "@/lib/http-exception";

export async function GET() {
    try {
        const games = await db.game.findMany({
            orderBy: {name: "asc"},
        });

        return NextResponse.json({games});
    } catch (err) {
        console.error("Game list error:", err);
        return HttpException.internal().toNextResponse();
    }
}
