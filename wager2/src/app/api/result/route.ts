import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import HttpException from "@/lib/http-exception";

export async function GET() {
    try {
        // TODO think about caching
        // TODO: change this, really not that smart
        // Get global result (single row with id=1)
        const result = await db.result.findFirst({
            where: {id: 1},
        });

        // Get all users for name mapping
        const users = await db.user.findMany({
            select: {id: true, name: true},
        });

        const userMap = new Map(users.map((u) => [u.id, u.name]));

        // Parse the result data
        const resultData = result?.data ? JSON.parse(result.data) : {};

        // Transform to a more usable format per user
        const userResults = users.map((user) => {
            const userOwes = resultData[user.id] || {};

            // Calculate what this user owes to others
            const owes: Record<string, number> = {};
            let totalOwes = 0;
            for (const [toId, amount] of Object.entries(userOwes)) {
                const numAmount = amount as number;
                if (numAmount > 0) {
                    owes[userMap.get(parseInt(toId)) || toId] = numAmount;
                    totalOwes += numAmount;
                }
            }

            // Calculate what others owe to this user
            const owed: Record<string, number> = {};
            let totalOwed = 0;
            for (const [fromId, fromOwes] of Object.entries(resultData)) {
                const owedAmount =
                    (fromOwes as Record<string, number>)[user.id.toString()] ||
                    0;
                if (owedAmount > 0) {
                    owed[userMap.get(parseInt(fromId)) || fromId] = owedAmount;
                    totalOwed += owedAmount;
                }
            }

            return {
                id: user.id,
                name: user.name,
                totalOwes,
                owes,
                totalOwed,
                owed,
            };
        });

        return NextResponse.json({results: userResults});
    } catch (err) {
        console.error("Result error:", err);
        return HttpException.internal().toNextResponse();
    }
}
