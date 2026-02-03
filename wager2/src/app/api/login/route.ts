import bcrypt from "bcrypt";
import {NextRequest, NextResponse} from "next/server";
import HttpException from "@/lib/http-exception";
import {db} from "@/lib/db";
import {createToken, setAuthCookie} from "@/lib/auth";
import {authCredsSchema} from "@/schemas";
import {parseRequestBody} from "@/lib/parse";

export async function POST(request: NextRequest) {
    const body = await parseRequestBody(request, authCredsSchema);

    if (!body.ok) {
        return body.ctx.toNextResponse();
    }

    const {username, password} = body.data;

    const user = await db.user.findUnique({
        where: {name: username},
    });

    if (!user) {
        return HttpException.notFound().toNextResponse();
    }

    const passwordMatch = await bcrypt.compare(user.password, password);
    if (!passwordMatch) {
        return HttpException.notFound().toNextResponse();
    }

    const token = createToken(user.id, user.name);
    await setAuthCookie(token);

    return new NextResponse(null, {status: 204});
}
