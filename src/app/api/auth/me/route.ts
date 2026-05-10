import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDB } from "@/lib/dynamoDB/dynamodb";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic"; // ensures no caching

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    const sessionResult = await dynamoDB.send(
      new GetCommand({
        TableName: process.env.SESSIONS_TABLE!,
        Key: {
          sessionId,
        },
      })
    );

    const session = sessionResult.Item;

    if (!session || session.isRevoked) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    if (session.expiresAt < now) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }
    const userResult = await dynamoDB.send(
      new GetCommand({
        TableName: process.env.USERS_DYNAMODB_TABLE_NAME!,
        Key: {
          email: session.email,
        },
      })
    );

    const user = userResult.Item;

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    if (user.statusSetToOff) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 403 }
      );
    }

    const { password, ...returnUserObject} = user

    return NextResponse.json({
      authenticated: true,
      user: returnUserObject,
    });
  } catch (error) {
    console.log(error)
    Sentry.withScope((scope) => {
      scope.setTag("route", "/api/auth/me");

      scope.setContext("cookies", {
        sessionId: true, 
      });

      scope.setLevel("error");

      Sentry.captureException(error);
    });

    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}