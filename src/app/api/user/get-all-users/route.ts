import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getAllUsers } from "@/lib/dynamoDB/service/UserService";
import { authorizeUser } from "@/lib/dynamoDB/service/Authorization";

export async function GET(req: Request) {
  try {
    const authorization = await authorizeUser(req as NextRequest, true)
    if (authorization.authFailed) {
      return authorization.response as NextResponse
    }
    const users = await getAllUsers();

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("route", "GET /api/user/get-all-users");
      scope.setContext("request", {
        url: req.url,
        method: "GET",
      });

      Sentry.captureException(error);
    });

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}