import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import twilio from "twilio";
import { createConversationMessage, getAllMessagesByConversationId } from "@/lib/dynamoDB/service/ConversationMessageService";
import {
  setConversationAsCurrentlyBeingRespondedByAi,
  updateConversationMostRecentMessage,
  putConversation,
  getConversationById,
} from "@/lib/dynamoDB/service/ConversationService";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { sqs } from "@/lib/sqs/sqs";
import { randomUUID } from "crypto";
import { getAblyRest, COMPANY_NAME_PLACEHOLDER_CHAT_CHANNEL } from "@/lib/ably/ablyRest";
import { getSecret } from "@/lib/secrets/awsSecrets";

function twimlResponse(status = 200) {
  return new Response("<Response/>", {
    status,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const from = params.From;
    const messageBody = params.Body;

    if (!from || !messageBody) {
      return twimlResponse();
    }

    // Validate that this request genuinely came from Twilio
    const twilioSecret = await getSecret(process.env.TWILIO_SECRET_ARN!);
    const authToken = twilioSecret.authToken;
    const twilioSignature = req.headers.get("X-Twilio-Signature") ?? "";
    const isValid = twilio.validateRequest(authToken, twilioSignature, req.url, params);

    if (!isValid) {
      return twimlResponse(403);
    }

    const conversationId = from;

    let conversation = await getConversationById(conversationId);

    if (!conversation) {
      const now = new Date().toISOString();
      await putConversation({
        conversationId,
        clientName: from,
        conversationMethod: "Text",
        phoneNumber: from,
        newMessage: true,
        mostRecentMessage: messageBody,
        lastMessageTimeStamp: now,
        aiAutoResponseToggle: true,
      });

      conversation = await getConversationById(conversationId);

      if (!conversation) {
        throw new Error(`Failed to find or create conversation for ${conversationId}`);
      }
    }

    await createConversationMessage({
      conversationId,
      body: messageBody,
      clientName: conversation.clientName,
      COMPANY_NAME_PLACEHOLDERSentMessage: false,
    });

    await updateConversationMostRecentMessage(
      conversation.conversationId,
      conversation.timeStamp,
      messageBody,
      true
    );

    const messageThread = await getAllMessagesByConversationId(conversation.conversationId);

    type ChatMessage = { role: "user" | "assistant"; content: string };
    const newMessages: ChatMessage[] = messageThread.messages.map((message) => ({
      role: message.COMPANY_NAME_PLACEHOLDERSentMessage ? "assistant" : "user",
      content: message.body,
    }));

    const ablyRest = await getAblyRest();
    const channel = ablyRest.channels.get(COMPANY_NAME_PLACEHOLDER_CHAT_CHANNEL);

    if (conversation.aiAutoResponseToggle) {
      await setConversationAsCurrentlyBeingRespondedByAi(
        conversation.conversationId,
        conversation.timeStamp
      );

      await channel.publish("conversation-update-new-message", {
        update: "conversation-update-new-message",
        conversation,
        message: messageThread.messages.at(-1),
        createdAt: new Date().toISOString(),
      });

      await channel.publish("ai-responding-to-conversation-update", {
        update: "ai-responding-to-conversation-update",
        conversation,
        aiResponding: true,
        message: messageThread.messages.at(-1),
        createdAt: new Date().toISOString(),
      });

      await sqs.send(
        new SendMessageCommand({
          QueueUrl: process.env.SQS_AI_CHAT_LAMBDA_QUE_URL!,
          MessageBody: JSON.stringify({
            messages: JSON.stringify(newMessages),
            conversation: JSON.stringify(conversation),
          }),
          MessageGroupId: conversation.conversationId.replace(/[^a-zA-Z0-9]/g, ""),
          MessageDeduplicationId: randomUUID(),
        })
      );
    } else {
      await channel.publish("conversation-update-new-message", {
        update: "client-sent-message-update",
        conversation,
        message: messageThread.messages.at(-1),
        createdAt: new Date().toISOString(),
      });
    }

    return twimlResponse();
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("route", "POST /api/webhooks/twilio");
      scope.setContext("request", { url: req.url, method: "POST" });
      Sentry.captureException(error);
    });

    console.error("Error handling Twilio inbound webhook:", error);

    // Always return 200 to Twilio to prevent retries on application errors
    return twimlResponse();
  }
}
