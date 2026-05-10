import * as Sentry from "@sentry/nextjs";
import ConversationAndMessages from "../dynamoDbSchemaInterfaces/conversationAndMessages";

export type GetConversationMessagesResult = {
  messages: ConversationAndMessages[];
  nextKey?: Record<string, unknown>;
};

export async function getMessagesByConversationId(
  conversationId: string,
  lastEvaluatedKey?: Record<string, unknown>
): Promise<GetConversationMessagesResult> {
  try {
    const params = new URLSearchParams({
      conversationId,
    });

    if (lastEvaluatedKey) {
      params.set("lastEvaluatedKey", JSON.stringify(lastEvaluatedKey));
    }

    const res = await fetch(
      `/api/conversations/get-messages-by-conversation-id?${params.toString()}`,
      {
        method: "GET",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch conversation messages");
    }

    return data;
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("helper", "getMessagesByConversationId");
      scope.setContext("request", {
        conversationId,
        lastEvaluatedKey,
      });

      Sentry.captureException(error);
    });

    throw error;
  }
}

type CreateConversationMessageInput = Omit<
  ConversationAndMessages,
  "timeStamp"
> & {
  conversationTimeStamp: string;
};

export async function createConversationMessage(
  conversationMessage: CreateConversationMessageInput
) {
  try {
    const res = await fetch("/api/conversations/admin-send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(conversationMessage),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to create conversation message");
    }

    return data;
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("helper", "createConversationMessagehelper");
      scope.setContext("request", {
        conversationId: conversationMessage.conversationId,
        conversationTimeStamp: conversationMessage.conversationTimeStamp,
        body: conversationMessage.body,
        clientName: conversationMessage.clientName,
        COMPANY_NAME_PLACEHOLDERSentMessage: conversationMessage.COMPANY_NAME_PLACEHOLDERSentMessage,
        COMPANY_NAME_PLACEHOLDERMemberWhoSentMessage: conversationMessage.COMPANY_NAME_PLACEHOLDERMemberWhoSentMessage,
      });

      Sentry.captureException(error);
    });

    throw error;
  }
}