import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createUser, UserAlreadyExistsError } from "@/lib/dynamoDB/service/UserService";
import { randomUUID } from "crypto";
import { authorizeUser } from "@/lib/dynamoDB/service/Authorization";

export async function POST(req: Request) {
    try {
        const authorization = await authorizeUser(req as NextRequest, true)
        if (authorization.authFailed) {
            return authorization.response as NextResponse
        }
        if(!authorization.user?.admin){
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }
        const body = await req.json();

        const { email, password, active, registrationLink, name } = body;

        if (!email || !name) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        const user = await createUser({
            name,
            email,
            password,
            active,
            registrationLink: randomUUID(),
        });
        return NextResponse.json(user, { status: 201 });
    } catch (error: any) {
        if (error instanceof UserAlreadyExistsError) {
            return NextResponse.json(
                { message: error.message },
                { status: 409 }
            );
        }
        Sentry.captureException(error, {
            tags: {
                route: "POST /api/user",
            },
            extra: {
                route: "POST /api/user",
            },
        });

        console.error("Unexpected error creating user:", error);

        return NextResponse.json(
            { status: 500 }
        );
    }
}
