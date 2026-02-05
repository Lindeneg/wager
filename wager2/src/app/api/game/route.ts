import {NextRequest, NextResponse} from "next/server";
import z from "zod";
import {db} from "@/lib/db";
import HttpException from "@/lib/http-exception";
import {parseRequestBody} from "@/lib/parse";

const createGameSchema = z.object({
    name: z.string().min(1).max(100),
});

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

export async function POST(request: NextRequest) {
    try {
        const parsed = await parseRequestBody(request, createGameSchema);
        if (!parsed.ok) {
            return parsed.ctx.toNextResponse();
        }

        const {name} = parsed.data;

        // Check if game with same name exists
        const existing = await db.game.findUnique({
            where: {name},
        });

        if (existing) {
            return HttpException.unprocessable(
                "Game with this name already exists"
            ).toNextResponse();
        }

        const game = await db.game.create({
            data: {name},
        });

        return NextResponse.json(game);
    } catch (err) {
        console.error("Game create error:", err);
        return HttpException.internal().toNextResponse();
    }
}
