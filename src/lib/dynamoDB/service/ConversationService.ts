/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamoDBDocumentClient, PutCommand, PutCommandOutput, QueryCommand, UpdateCommand, UpdateCommandOutput } from "@aws-sdk/lib-dynamodb";
import * as Sentry from "@sentry/nextjs";
import Conversation from "../dynamoDbSchemaInterfaces/conversation";
import { dynamoDB } from "../dynamodb";

export async function getConversations(
  conversationMethod: "Text" | "Email",
  cursor: Record<string, any> | null,
  limit: number,
) {
  try {
    const result = await dynamoDB.send(
      new QueryCommand({
        TableName: process.env.CONVERSATIONS_DYNAMODB_TABLE_NAME!,
        IndexName: process.env.CHAT_CONVERSATIONS_TABLE_GSI_NAME!,
        KeyConditionExpression: "#cm = :cm",
        ExpressionAttributeNames: {
          "#cm": "conversationMethod"
        },
        ExpressionAttributeValues: {
          ":cm": conversationMethod
        },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: cursor || undefined
      })
    );

    return {
      items: result.Items || [],
      cursor: result.LastEvaluatedKey || null
    };
  } catch (error) {
    console.log(error)
    Sentry.captureException(error, {
      extra: {
        conversationMethod,
        limit,
        cursor,
        tableName: process.env.CONVERSATIONS_DYNAMODB_TABLE_NAME,
        indexName: process.env.CHAT_CONVERSATIONS_TABLE_GSI_NAME
      }
    });
    throw error
  }

}

export async function putConversation(
  conversation: Omit<Conversation, "timeStamp">
): Promise<PutCommandOutput> {
  const params = {
    TableName: process.env.CONVERSATIONS_DYNAMODB_TABLE_NAME!,
    Item: {
      conversationId: conversation.conversationId,
      timeStamp: new Date().toISOString(),
      clientName: conversation.clientName,
      conversationMethod: conversation.conversationMethod,
      phoneNumber: conversation.phoneNumber,
      email: conversation.email,
      aiAutoResponseToggle: conversation.aiAutoResponseToggle,
      conversationNotes: conversation.conversationNotes,
      newMessage: conversation.newMessage,
      mostRecentMessage: conversation.mostRecentMessage,
      lastMessageTimeStamp: conversation.lastMessageTimeStamp,
    },

    // Only insert if this conversationId does not already exist
    ConditionExpression: "attribute_not_exists(conversationId)",
  };

  try {
    const request = await dynamoDB.send(new PutCommand(params));
    return request;
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "ConditionalCheckFailedException"
    ) {
      throw new Error("A conversation with this ID already exists.");
    }
    Sentry.captureException(error, {
      extra: {
        conversationId: conversation.conversationId,
        conversationMethod: conversation.conversationMethod,
        clientName: conversation.clientName,
        aiAutoResponseToggle: conversation.aiAutoResponseToggle,
      },
    });

    throw error;
  }
}

export async function setConversationAsRead(conversationId: string, timeStamp: string): Promise<PutCommandOutput> {

  try {
    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: process.env.CONVERSATIONS_DYNAMODB_TABLE_NAME!,
        Key: {
          conversationId,
          timeStamp
        },
        UpdateExpression: "SET newMessage = :nm, readAt = :ra",
        ExpressionAttributeValues: {
          ":nm": false,
          ":ra": new Date().toISOString()
        },
        ReturnValues: "ALL_NEW"
      })
    )
    return result
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        conversationId: conversationId
      }
    })
    throw error
  }
}

export async function setConversationAsCurrentlyBeingRespondedByAi(
  conversationId: string,
  timeStamp: string
): Promise<UpdateCommandOutput> {
  try {
    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: process.env.CONVERSATIONS_DYNAMODB_TABLE_NAME!,
        Key: {
          conversationId,
          timeStamp,
        },
        UpdateExpression:
          "SET currentlyBeingRespondedByAi = :currentlyBeingRespondedByAi",
        ExpressionAttributeValues: {
          ":currentlyBeingRespondedByAi": true,
        },
        ReturnValues: "ALL_NEW",
      })
    );

    return result;
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        conversationId,
        timeStamp,
      },
    });

    throw error;
  }
}

export async function setConversationAiResponseToggle(
  conversationId: string,
  timeStamp: string,
  aiAutoResponseToggle: boolean
): Promise<UpdateCommandOutput> {
  try {
    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: process.env.CONVERSATIONS_DYNAMODB_TABLE_NAME!,
        Key: {
          conversationId,
          timeStamp,
        },
        UpdateExpression: "SET aiAutoResponseToggle = :aiAutoResponseToggle",
        ExpressionAttributeValues: {
          ":aiAutoResponseToggle": aiAutoResponseToggle,
        },
        ReturnValues: "ALL_NEW",
      })
    );

    return result;
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        conversationId,
        timeStamp,
        aiAutoResponseToggle,
      },
    });

    throw error;
  }
}

export async function updateConversationMostRecentMessage(
  conversationId: string,
  timeStamp: string,
  mostRecentMessage: string,
  setNewMessage: boolean
): Promise<UpdateCommandOutput> {
  try {
    const lastMessageTimeStamp = new Date().toISOString();

    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: process.env.CONVERSATIONS_DYNAMODB_TABLE_NAME!,
        Key: {
          conversationId,
          timeStamp,
        },
        UpdateExpression: setNewMessage
          ? "SET mostRecentMessage = :mostRecentMessage, lastMessageTimeStamp = :lastMessageTimeStamp, newMessage = :newMessage"
          : "SET mostRecentMessage = :mostRecentMessage, lastMessageTimeStamp = :lastMessageTimeStamp",
        ExpressionAttributeValues: setNewMessage
          ? {
            ":mostRecentMessage": mostRecentMessage,
            ":lastMessageTimeStamp": lastMessageTimeStamp,
            ":newMessage": true,
          }
          : {
            ":mostRecentMessage": mostRecentMessage,
            ":lastMessageTimeStamp": lastMessageTimeStamp,
          },
        ReturnValues: "ALL_NEW",
      })
    );

    return result;
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        conversationId,
        timeStamp,
        mostRecentMessage,
        setNewMessage,
        tableName: process.env.CONVERSATIONS_DYNAMODB_TABLE_NAME,
        operation: "UpdateCommand",
        function: "updateConversationMostRecentMessage",
      },
    });

    console.error("Error updating most recent message:", error);

    throw error;
  }
}

export async function getConversationById(
  conversationId: string
): Promise<Conversation | null> {
  try {
    const result = await dynamoDB.send(
      new QueryCommand({
        TableName: process.env.CONVERSATIONS_DYNAMODB_TABLE_NAME!,
        KeyConditionExpression: "conversationId = :conversationId",
        ExpressionAttributeValues: {
          ":conversationId": conversationId,
        },
        Limit: 1,
      })
    );

    return (result.Items?.[0] as Conversation) ?? null;
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        conversationId,
        tableName: process.env.CONVERSATIONS_DYNAMODB_TABLE_NAME,
      },
    });

    throw error;
  }
}

export async function updateUserInterventionRequired(
  conversationId: string,
  timeStamp: string,
  userInterventionRequired: boolean
): Promise<UpdateCommandOutput> {
  try {
    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: process.env.CONVERSATIONS_DYNAMODB_TABLE_NAME!,
        Key: {
          conversationId,
          timeStamp,
        },
        UpdateExpression: "SET userInterventionRequired = :userInterventionRequired",
        ExpressionAttributeValues: {
          ":userInterventionRequired": userInterventionRequired,
        },
        ReturnValues: "ALL_NEW",
      })
    );

    return result;
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        conversationId,
        timeStamp,
        userInterventionRequired,
        tableName: process.env.CONVERSATIONS_DYNAMODB_TABLE_NAME,
        operation: "UpdateCommand",
        function: "updateUserInterventionRequired",
      },
    });

    console.error("Error updating user intervention required:", error);

    throw error;
  }
}
