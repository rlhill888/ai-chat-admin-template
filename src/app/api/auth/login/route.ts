import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { serialize } from "cookie";
import { NextResponse } from "next/server";
import { dynamoDB } from "@/lib/dynamoDB/dynamodb";
import { cookies } from "next/headers";
import { getUserByEmail } from "@/lib/dynamoDB/service/UserService";

type LoginBody = {
  email: string;
  password: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody;
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password required" },
        { status: 400 }
      );
    }

    // 1. Find user
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }
    console.log("User result: ", user)

    if (user.registrationLink) {
      return NextResponse.json(
        { message: "Must register user before logging in" },
        { status: 401 }
      );
    }

    if (user.statusSetToOff) {
      return NextResponse.json(
        { message: "Error Logging in" },
        { status: 403 }
      );
    }
    // 2. Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 3. Create session
    const sessionId = randomUUID();
    const now = new Date();

    await dynamoDB.send(
      new PutCommand({
        TableName: process.env.SESSIONS_TABLE as string,
        Item: {
          email: user.email,
          sessionId,
          createdAt: now.toISOString(),
          lastActiveAt: now.toISOString(),
          expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
          isRevoked: false,
          userAgent: req.headers.get("user-agent") ?? null,
        },
      })
    );

    const cookieStore = await cookies();

    cookieStore.set("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}