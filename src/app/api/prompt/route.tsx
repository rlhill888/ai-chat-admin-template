import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { authorizeUser } from "@/lib/dynamoDB/service/Authorization";
import { getAIPrompt, updateAIPrompt } from "@/lib/dynamoDB/service/PromptService";

export async function PUT(req: Request) {
    try {
        const authorization = await authorizeUser(req as NextRequest, true);
        if (authorization.authFailed) {
            return authorization.response as NextResponse;
        }
        if (!authorization.user?.admin) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { promptId, AIResponsePrompt, FlagUserInLoopRequirements } = body;

        if (!promptId || !AIResponsePrompt || !FlagUserInLoopRequirements) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        const updatedPrompt = await updateAIPrompt(
            promptId,
            AIResponsePrompt,
            FlagUserInLoopRequirements
        );

        return NextResponse.json(updatedPrompt, { status: 200 });
    } catch (error: any) {
        if (error.name === "ConditionalCheckFailedException") {
            return NextResponse.json(
                { message: "Prompt not found" },
                { status: 404 }
            );
        }

        Sentry.captureException(error, {
            tags: {
                route: "PUT /api/ai-prompt",
            },
            extra: {
                route: "PUT /api/ai-prompt",
            },
        });

        console.error("Unexpected error updating AI prompt:", error);

        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const authorization = await authorizeUser(req as NextRequest, true);
        if (authorization.authFailed) {
            return authorization.response as NextResponse;
        }
        if (!authorization.user?.admin) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);

        const prompt = await getAIPrompt("prompt");

        if (!prompt) {
            return NextResponse.json(
                { message: "Prompt not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(prompt, { status: 200 });
    } catch (error: any) {
        Sentry.captureException(error, {
            tags: {
                route: "GET /api/ai-prompt",
            },
            extra: {
                route: "GET /api/ai-prompt",
            },
        });

        console.error("Unexpected error fetching AI prompt:", error);

        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}