import { GetCommand } from "@aws-sdk/lib-dynamodb";
import * as Sentry from "@sentry/nextjs";
import { dynamoDB } from "../dynamodb";

export async function getSession(sessionId?: string) {
  if (!sessionId) return null;

  try {
    const result = await dynamoDB.send(
      new GetCommand({
        TableName: process.env.SESSIONS_TABLE as string,
        Key: { sessionId },
      })
    );

    return result.Item ?? null;
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        sessionId,
        tableName: process.env.SESSIONS_TABLE,
        operation: "GetCommand",
        function: "getSession",
      },
    });

    console.error("Error fetching session:", error);

    throw error;
  }
}