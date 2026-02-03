import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  hashPassword,
  createToken,
  setAuthCookie,
  validateUsername,
  validatePassword,
  getInviteCode,
} from "@/lib/auth";

interface SignupRequest {
  username: string;
  password: string;
  inviteCode: string;
}

export async function POST(request: NextRequest) {
  let body: SignupRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { username, password, inviteCode } = body;

  if (!username || !password || !inviteCode) {
    return NextResponse.json(
      { error: "Username, password, and invite code are required" },
      { status: 400 }
    );
  }

  // Validate invite code
  if (inviteCode !== getInviteCode()) {
    return NextResponse.json(
      { error: "Invalid invite code" },
      { status: 403 }
    );
  }

  // Validate username
  const usernameError = validateUsername(username);
  if (usernameError) {
    return NextResponse.json({ error: usernameError }, { status: 400 });
  }

  // Validate password
  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { name: username.toLowerCase() },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Username already exists" },
      { status: 422 }
    );
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

  return new NextResponse(null, { status: 201 });
}
