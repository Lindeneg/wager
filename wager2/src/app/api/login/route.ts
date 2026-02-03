import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  comparePassword,
  createToken,
  setAuthCookie,
} from "@/lib/auth";

interface LoginRequest {
  username: string;
  password: string;
}

export async function POST(request: NextRequest) {
  let body: LoginRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({
    where: { name: username.toLowerCase() },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const passwordMatch = await comparePassword(user.password, password);
  if (!passwordMatch) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = createToken(user.id, user.name);
  await setAuthCookie(token);

  return new NextResponse(null, { status: 204 });
}
