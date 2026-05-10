import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getUserByRegistrationLink } from "@/lib/dynamoDB/service/UserService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const registrationLink = searchParams.get("registrationLink");

    if (!registrationLink) {
      return NextResponse.json(
        { message: "registrationLink is required" },
        { status: 400 }
      );
    }

    const user = await getUserByRegistrationLink(registrationLink);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });

  } catch (error) {
    console.log(error)
    Sentry.withScope((scope) => {
      scope.setTag("route", "GET /api/user");
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
