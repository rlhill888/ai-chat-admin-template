import { NextRequest, NextResponse } from "next/server";
import { setConversationAiResponseToggle } from "@/lib/dynamoDB/service/ConversationService";
import { authorizeUser } from "@/lib/dynamoDB/service/Authorization";

type SetConversationAiResponseToggleBody = {
  conversationId: string;
  timeStamp: string;
  aiResponseToggle: boolean;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SetConversationAiResponseToggleBody;
    const authorization = await authorizeUser(req as NextRequest, true)
    if (authorization.authFailed) {
      return authorization.response as NextResponse
    }

    const { conversationId, timeStamp, aiResponseToggle } = body;

    if (!conversationId || !timeStamp || typeof aiResponseToggle !== "boolean") {
      return NextResponse.json(
        { error: "conversationId, timeStamp, and aiResponseToggle are required" },
        { status: 400 }
      );
    }

    const conversation = await setConversationAiResponseToggle(
      conversationId,
      timeStamp,
      aiResponseToggle
    );

    return NextResponse.json({
      success: true,
      conversation: conversation.Attributes,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Failed to update AI response toggle" },
      { status: 500 }
    );
  }
}