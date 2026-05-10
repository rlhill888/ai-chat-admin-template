import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import * as Sentry from "@sentry/nextjs";
import { dynamoDB } from "../dynamodb";

export async function createAIPrompt(
  promptId: string,
  AIResponsePrompt: string,
  FlagUserInLoopRequirements: string
) {
  try {
    await dynamoDB.send(
      new PutCommand({
        TableName: process.env.AI_PROMPT_DYNAMO_DB_TABLE_NAME as string,
        Item: {
          promptId,
          AIResponsePrompt,
          FlagUserInLoopRequirements,
        },
      })
    );

    return { promptId, AIResponsePrompt, FlagUserInLoopRequirements };
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        promptId,
        tableName: process.env.AI_PROMPT_DYNAMO_DB_TABLE_NAME,
        operation: "PutCommand",
        function: "createAIPrompt",
      },
    });

    console.error("Error creating AI prompt:", error);

    throw error;
  }
}

export async function updateAIPrompt(
  promptId: string,
  AIResponsePrompt: string,
  FlagUserInLoopRequirements: string
) {
  try {
    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: process.env.AI_PROMPT_DYNAMO_DB_TABLE_NAME as string,
        Key: { promptId },
        UpdateExpression: "SET AIResponsePrompt = :AIResponsePrompt, FlagUserInLoopRequirements = :FlagUserInLoopRequirements",
        ExpressionAttributeValues: {
          ":AIResponsePrompt": AIResponsePrompt,
          ":FlagUserInLoopRequirements": FlagUserInLoopRequirements,
        },
        ConditionExpression: "attribute_exists(promptId)",
        ReturnValues: "ALL_NEW",
      })
    );

    return result.Attributes ?? null;
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        promptId,
        tableName: process.env.AI_PROMPT_DYNAMO_DB_TABLE_NAME,
        operation: "UpdateCommand",
        function: "updateAIPrompt",
      },
    });

    console.error("Error updating AI prompt:", error);

    throw error;
  }
}

export async function getAIPrompt(promptId: string) {
  try {
    const result = await dynamoDB.send(
      new GetCommand({
        TableName: process.env.AI_PROMPT_DYNAMO_DB_TABLE_NAME as string,
        Key: { promptId },
      })
    );

    return result.Item ?? null;
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        promptId,
        tableName: process.env.AI_PROMPT_DYNAMO_DB_TABLE_NAME,
        operation: "GetCommand",
        function: "getAIPrompt",
      },
    });

    console.error("Error fetching AI prompt:", error);

    throw error;
  }
}