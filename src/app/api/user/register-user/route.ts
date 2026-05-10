import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { registerUser } from "@/lib/dynamoDB/service/UserService";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { email, password, phoneNumber, active } = body;
    
    if (!email || typeof active !== "boolean") {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await registerUser(
      email,
      password,
      phoneNumber,
      active
    );
    
    return NextResponse.json(
      {
        message: "User updated successfully",
        data: response,
      },
      { status: 200 }
    );
  } catch (error: any) {
    Sentry.withScope((scope) => {
      scope.setTag("route", "PUT /api/user");

      scope.setContext("error_info", {
        message: error?.message,
        name: error?.name,
      });

      Sentry.captureException(error);
    });

    console.error("Error updating user:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


