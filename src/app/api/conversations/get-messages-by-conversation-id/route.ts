import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getMessagesByConversationId } from "@/lib/dynamoDB/service/ConversationMessageService";
import { authorizeUser } from "@/lib/dynamoDB/service/Authorization";

export async function GET(req: Request) {
  try {
    const authorization = await authorizeUser(req as NextRequest, true)
    if (authorization.authFailed) {
      return authorization.response as NextResponse
    }
    const { searchParams } = new URL(req.url);

    const conversationId = searchParams.get("conversationId");
    const lastEvaluatedKeyParam = searchParams.get("lastEvaluatedKey");

    if (!conversationId) {
      return NextResponse.json(
        { message: "conversationId is required" },
        { status: 400 }
      );
    }

    const lastEvaluatedKey = lastEvaluatedKeyParam
      ? JSON.parse(lastEvaluatedKeyParam)
      : undefined;

    const result = await getMessagesByConversationId(
      conversationId,
      lastEvaluatedKey
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag(
        "route",
        "GET /api/conversation-messages/get-by-conversation-id"
      );

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