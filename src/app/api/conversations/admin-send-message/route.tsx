import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createConversationMessage } from "@/lib/dynamoDB/service/ConversationMessageService";
import { updateConversationMostRecentMessage, updateUserInterventionRequired } from "@/lib/dynamoDB/service/ConversationService";
import ConversationAndMessages from "@/lib/dynamoDB/dynamoDbSchemaInterfaces/conversationAndMessages";
import { ablyRest } from "@/lib/ably/ablyRest";
import { COMPANY_NAME_PLACEHOLDER_CHAT_CHANNEL } from "@/lib/ably/ablyConstants";
import { authorizeUser } from "@/lib/dynamoDB/service/Authorization";
import { twilioClient } from "@/lib/twilio/twilioClient";

type CreateConversationMessageBody = Omit<
  ConversationAndMessages,
  "timeStamp"
> & {
  conversationTimeStamp: string;
};

export async function POST(req: Request) {
  try {

    const authorization = await authorizeUser(req as NextRequest, true)
    if (authorization.authFailed) {
      return authorization.response as NextResponse
    }
    const body = (await req.json()) as CreateConversationMessageBody;

    const {
      conversationId,
      conversationTimeStamp,
      body: messageBody,
      clientName,
      COMPANY_NAME_PLACEHOLDERSentMessage,
      COMPANY_NAME_PLACEHOLDERMemberWhoSentMessage,
    } = body;

    if (!conversationId || !conversationTimeStamp || !messageBody || !clientName) {
      return NextResponse.json(
        {
          message:
            "conversationId, conversationTimeStamp, body, and clientName are required",
        },
        { status: 400 }
      );
    }

    const newMessage = await createConversationMessage({
      conversationId,
      body: messageBody,
      clientName,
      COMPANY_NAME_PLACEHOLDERSentMessage,
      COMPANY_NAME_PLACEHOLDERMemberWhoSentMessage,
    });

    const updateResult = await updateConversationMostRecentMessage(
      conversationId,
      conversationTimeStamp,
      messageBody,
      false
    );

    if(updateResult.Attributes?.userInterventionRequired){
      const updatedUserIntervention = await updateUserInterventionRequired(conversationId, conversationTimeStamp, false)
    }

    const channel = ablyRest.channels.get(COMPANY_NAME_PLACEHOLDER_CHAT_CHANNEL);

    const publishResponse = await channel.publish("conversation-update-new-message", {
      update: "conversation-update-new-message",
      conversation: updateResult.Attributes,
      message: newMessage.item,
      createdAt: new Date().toISOString(),
    });
    // await twilioClient.messages.create({
    //   body: messageBody,
    //   from: process.env.TWILIO_PHONE_NUMBER!,
    //   to: conversationId,
    // });

    return NextResponse.json(
      {
        message: "Conversation message created successfully",
        conversation: updateResult.Attributes,
      },
      { status: 201 }
    );
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("route", "POST /api/conversations/create-message");
      scope.setContext("request", {
        url: req.url,
        method: "POST",
      });

      Sentry.captureException(error);
    });

    console.error("Error creating conversation message:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}