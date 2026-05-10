import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { setUserAdmin } from "@/lib/dynamoDB/service/UserService";
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
    const { email, admin } = body;

    if (!email || typeof admin !== "boolean") {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (authorization.user?.email === email && !admin) {
      return NextResponse.json({ message: "You cannot remove your own admin privileges" }, { status: 403 });
    }

    const result = await setUserAdmin(email, admin);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error.message === "User does not exist") {
      return NextResponse.json({ message: "User does not exist" }, { status: 404 });
    }

    Sentry.captureException(error, {
      tags: { route: "PATCH /api/user/set-admin" },
    });

    console.error("Unexpected error setting admin:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
