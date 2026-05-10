import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { setUserStatus, getUserByEmail } from "@/lib/dynamoDB/service/UserService";
import { authorizeUser } from "@/lib/dynamoDB/service/Authorization";

export async function PATCH(req: NextRequest) {
  try {
    const authorization = await authorizeUser(req, true);
    if (authorization.authFailed) {
      return authorization.response as NextResponse;
    }
    if (!authorization.user?.admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, active } = body;

    if (!email || typeof active !== "boolean") {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (authorization.user?.email === email) {
      return NextResponse.json({ message: "You cannot change your own status" }, { status: 403 });
    }

    const targetUser = await getUserByEmail(email);
    if (!targetUser) {
      return NextResponse.json({ message: "User does not exist" }, { status: 404 });
    }
    if (targetUser.admin) {
      return NextResponse.json({ message: "Cannot change the status of an admin" }, { status: 403 });
    }

    const result = await setUserStatus(email, active);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    Sentry.captureException(error, {
      tags: { route: "PATCH /api/user/set-status" },
    });
    console.error("Unexpected error setting user status:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
