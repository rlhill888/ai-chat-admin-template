import { dynamoDB } from "@/lib/dynamoDB/dynamodb";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { authorizeUser } from "@/lib/dynamoDB/service/Authorization";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;
    const authorization = await authorizeUser(req, true)
    if (authorization.authFailed) {
      return authorization.response as NextResponse
    }

    if (sessionId) {
      await dynamoDB.send(
        new DeleteCommand({
          TableName: process.env.SESSIONS_TABLE! as string,
          Key: { sessionId },
        })
      );
    }

    cookieStore.set("sessionId", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        operation: "logout",
        context: "POST /api/logout",
      },
    });

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}