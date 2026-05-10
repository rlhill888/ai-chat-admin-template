import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

export const sqs = new SQSClient({ region: "us-east-1" });