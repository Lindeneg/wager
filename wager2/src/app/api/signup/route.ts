import {NextRequest, NextResponse} from "next/server";
import HttpException from "@/lib/http-exception";
import {db} from "@/lib/db";
import {hashPassword, createToken, setAuthCookie} from "@/lib/auth";
import {parseRequestBody} from "@/lib/parse";
import {authSignupSchema} from "@/schemas";
import config from "@/config";

export async function POST(request: NextRequest) {
    try {
        const body = await parseRequestBody(request, authSignupSchema);

        if (!body.ok) {
            return body.ctx.toNextResponse();
        }

        const {username, password, inviteCode} = body.data;

        if (inviteCode !== config.INVITE_CODE) {
            return HttpException.forbidden().toNextResponse();
        }

        // Check if user already exists (case-insensitive via raw query)
        const existingUser = await db.$queryRaw`
            SELECT id FROM user WHERE LOWER(name) = LOWER(${username}) LIMIT 1
        `;

        if (Array.isArray(existingUser) && existingUser.length > 0) {
            return HttpException.unprocessable().toNextResponse();
        }

        // Create user
        const hashedPassword = await hashPassword(password);
        const user = await db.user.create({
            data: {
                name: username,
                password: hashedPassword,
            },
        });

        const token = createToken(user.id, user.name);
        await setAuthCookie(token);

        return NextResponse.json({id: user.id, name: user.name});
    } catch (err) {
        console.error("Signup error:", err);
        return HttpException.internal(String(err)).toNextResponse();
    }
}
