import bcrypt from "bcrypt";
import {NextRequest, NextResponse} from "next/server";
import HttpException from "@/lib/http-exception";
import {db} from "@/lib/db";
import {createToken, setAuthCookie} from "@/lib/auth";
import {authLoginSchema} from "@/schemas";
import {parseRequestBody} from "@/lib/parse";

export async function POST(request: NextRequest) {
    try {
        const body = await parseRequestBody(request, authLoginSchema);

        if (!body.ok) {
            return body.ctx.toNextResponse();
        }

        const {username, password} = body.data;

        // Case-insensitive username lookup
        const users = await db.$queryRaw<{id: number; name: string; password: string}[]>`
            SELECT id, name, password FROM user WHERE LOWER(name) = LOWER(${username}) LIMIT 1
        `;
        const user = users[0];

        if (!user) {
            return HttpException.notFound().toNextResponse();
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return HttpException.notFound().toNextResponse();
        }

        const token = createToken(user.id, user.name);
        await setAuthCookie(token);

        return new NextResponse(null, {status: 204});
    } catch (err) {
        console.error("Login error:", err);
        return HttpException.internal(String(err)).toNextResponse();
    }
}
