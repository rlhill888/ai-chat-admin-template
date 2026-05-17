import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createConversationMessage, getAllMessagesByConversationId } from "@/lib/dynamoDB/service/ConversationMessageService";
import { setConversationAsCurrentlyBeingRespondedByAi, updateConversationMostRecentMessage } from "@/lib/dynamoDB/service/ConversationService";
import ConversationAndMessages from "@/lib/dynamoDB/dynamoDbSchemaInterfaces/conversationAndMessages";
import { GetCommand, GetCommandOutput, QueryCommand, QueryCommandOutput } from "@aws-sdk/lib-dynamodb";
import { dynamoDB } from "@/lib/dynamoDB/dynamodb";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { sqs } from "@/lib/sqs/sqs";
import { randomUUID } from "crypto";
import { getAblyRest, COMPANY_NAME_PLACEHOLDER_CHAT_CHANNEL } from "@/lib/ably/ablyRest";

type CreateConversationMessageBody = Omit<
  ConversationAndMessages,
  "timeStamp"
> & {
  conversationTimeStamp: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateConversationMessageBody;

    const {
      conversationId,
      body: messageBody,
    } = body;

    if (!conversationId || !messageBody) {
      return NextResponse.json(
        {
          message:
            "conversationId and body are required",
        },
        { status: 400 }
      );
    }



    const getConversation: QueryCommandOutput = await dynamoDB.send(
      new QueryCommand({
        TableName: process.env.CONVERSATIONS_DYNAMODB_TABLE_NAME!,
        KeyConditionExpression: "conversationId = :conversationId",
        ExpressionAttributeValues: {
          ":conversationId": conversationId,
        },
        Limit: 1,
      })
    );

    const conversation = getConversation.Items?.[0];

    if (!conversation) {
      // future error handling

      
    } else {
      const newMessage = await createConversationMessage({
        conversationId,
        body: messageBody,
        clientName: conversation.clientName,
        COMPANY_NAME_PLACEHOLDERSentMessage: false,
      });

      const updateResult = await updateConversationMostRecentMessage(
        conversation.conversationId,
        conversation.timeStamp,
        messageBody,
        true
      );

      const messageThread = await getAllMessagesByConversationId(conversation.conversationId)

      type ChatMessage = {
        role: "user" | "assistant";
        content: string;
      };

      const newMessages: ChatMessage[] = messageThread.messages.map((message) => {
        return {
          role: message.COMPANY_NAME_PLACEHOLDERSentMessage ? "assistant" : "user",
          content: message.body,
        };
      });

      // send out notification

      const ablyRest = await getAblyRest();
      const channel = ablyRest.channels.get(COMPANY_NAME_PLACEHOLDER_CHAT_CHANNEL);

      // see if a ai response for a message is turned on:
      let conversationUpdatePublished = false

      if (conversation.aiAutoResponseToggle) {
        const updateConversationBeingRespondedByAI = await setConversationAsCurrentlyBeingRespondedByAi(conversation.conversationId, conversation.timeStamp)
        const publishResponse = await channel.publish("conversation-update-new-message", {
          update: "conversation-update-new-message",
          conversation,
          message: messageThread.messages.at(-1),
          createdAt: new Date().toISOString(),
        });

        const publishAiResponding = await channel.publish("ai-responding-to-conversation-update", {
          update: "ai-responding-to-conversation-update",
          conversation,
          aiResponding: true,
          message: messageThread.messages.at(-1),
          createdAt: new Date().toISOString(),
        });

        conversationUpdatePublished = true
        

        const sendMessageToSQS = await sqs.send(new SendMessageCommand({
          QueueUrl: process.env.SQS_AI_CHAT_LAMBDA_QUE_URL!,
          MessageBody: JSON.stringify({
            messages: JSON.stringify(newMessages),
            conversation: JSON.stringify(conversation),
          }),
          MessageGroupId: conversation.conversationId.replace(/[^a-zA-Z0-9]/g, ""),
          MessageDeduplicationId: randomUUID(),
        }));
      }

      if(!conversationUpdatePublished){
        const publishResponse = await channel.publish("conversation-update-new-message", {
          update: "client-sent-message-update",
          conversation,
          message: messageThread.messages.at(-1),
          createdAt: new Date().toISOString(),
        });
      }


      return NextResponse.json(
        {
          message: "Conversation message created successfully",
          conversation: updateResult.Attributes,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.log(error)
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