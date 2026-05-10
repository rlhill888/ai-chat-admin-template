import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.APP_AWS_REGION,
});

export const dynamoDB = DynamoDBDocumentClient.from(client);