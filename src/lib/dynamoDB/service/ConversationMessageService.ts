import { PutCommand, PutCommandOutput, QueryCommand } from "@aws-sdk/lib-dynamodb";
import * as Sentry from "@sentry/nextjs";
import ConversationAndMessages from "../dynamoDbSchemaInterfaces/conversationAndMessages";
import { dynamoDB } from "../dynamodb";

type GetConversationMessagesResult = {
  messages: ConversationAndMessages[];
  nextKey?: Record<string, unknown>;
};

export async function getMessagesByConversationId(
  conversationId: string,
  lastEvaluatedKey?: Record<string, unknown>
): Promise<GetConversationMessagesResult> {
  try {
    const result = await dynamoDB.send(
      new QueryCommand({
        TableName: process.env.CONVERSATIONS_AND_MESSAGES_DYNAMO_DB_TABLE_NAME!,

        KeyConditionExpression: "conversationId = :conversationId",

        ExpressionAttributeValues: {
          ":conversationId": conversationId,
        },

        Limit: 50,
        ScanIndexForward: false,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    return {
      messages: (result.Items ?? []) as ConversationAndMessages[],
      nextKey: result.LastEvaluatedKey,
    };
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        conversationId,
        tableName: process.env.CONVERSATIONS_AND_MESSAGES_DYNAMO_DB_TABLE_NAME,
        operation: "QueryCommand",
        function: "getMessagesByConversationId",
      },
    });

    console.error("Error fetching conversation messages:", error);

    throw error;
  }
}

export async function getAllMessagesByConversationId(
  conversationId: string,
  lastEvaluatedKey?: Record<string, unknown>
): Promise<GetConversationMessagesResult> {
  try {
    const result = await dynamoDB.send(
      new QueryCommand({
        TableName: process.env.CONVERSATIONS_AND_MESSAGES_DYNAMO_DB_TABLE_NAME!,

        KeyConditionExpression: "conversationId = :conversationId",

        ExpressionAttributeValues: {
          ":conversationId": conversationId,
        },
        ScanIndexForward: true,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    return {
      messages: (result.Items ?? []) as ConversationAndMessages[],
      nextKey: result.LastEvaluatedKey,
    };
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        conversationId,
        tableName: process.env.CONVERSATIONS_AND_MESSAGES_DYNAMO_DB_TABLE_NAME,
        operation: "QueryCommand",
        function: "getMessagesByConversationId",
      },
    });

    console.error("Error fetching conversation messages:", error);

    throw error;
  }
}

type CreateConversationMessageResult = {
  result: PutCommandOutput;
  item: ConversationAndMessages;
};

export async function createConversationMessage(
  conversationMessage: Omit<ConversationAndMessages, "timeStamp">
): Promise<CreateConversationMessageResult> {
  const timeStamp = new Date().toISOString();

  const item: ConversationAndMessages = {
    ...conversationMessage,
    timeStamp,
  };

  try {
    const result = await dynamoDB.send(
      new PutCommand({
        TableName: process.env.CONVERSATIONS_AND_MESSAGES_DYNAMO_DB_TABLE_NAME!,
        Item: item,
        ConditionExpression:
          "attribute_not_exists(#conversationId) AND attribute_not_exists(#timeStamp)",
        ExpressionAttributeNames: {
          "#conversationId": "conversationId",
          "#timeStamp": "timeStamp",
        },
      })
    );

    return {
      result,
      item
    };
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        conversationId: item.conversationId,
        timeStamp: item.timeStamp,
        tableName: process.env.CONVERSATIONS_AND_MESSAGES_DYNAMO_DB_TABLE_NAME,
        operation: "PutCommand",
        function: "createConversationMessage",
      },
    });

    console.error("Error creating conversation message:", error);

    throw error;
  }
}