import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import HttpException from "@/lib/http-exception";

export async function GET() {
    try {
        const users = await db.user.findMany({
            select: {id: true, name: true},
            orderBy: {name: "asc"},
        });

        return NextResponse.json({users});
    } catch (err) {
        console.error("User list error:", err);
        return HttpException.internal().toNextResponse();
    }
}
