import {NextRequest, NextResponse} from "next/server";
import HttpException from "@/lib/http-exception";
import {db} from "@/lib/db";
import {hashPassword, createToken, setAuthCookie} from "@/lib/auth";
import {parseRequestBody} from "@/lib/parse";
import {authSignupSchema} from "@/schemas";
import config from "@/config";

export async function POST(request: NextRequest) {
    const body = await parseRequestBody(request, authSignupSchema);

    if (!body.ok) {
        return body.ctx.toNextResponse();
    }

    const {username, password, inviteCode} = body.data;

    if (inviteCode !== config.INVITE_CODE) {
        return HttpException.forbidden().toNextResponse();
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
        where: {name: username.toLowerCase()},
    });

    if (existingUser) {
        return HttpException.unprocessable().toNextResponse();
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const user = await db.user.create({
        data: {
            name: username.toLowerCase(),
            password: hashedPassword,
        },
    });

    const token = createToken(user.id, user.name);
    await setAuthCookie(token);

    return new NextResponse(null, {status: 201});
}
