import * as Ably from "ably";

export const ablyRest = new Ably.Rest(process.env.ABLY_API_KEY!);

export const COMPANY_NAME_PLACEHOLDER_CHAT_CHANNEL = "COMPANY_NAME_PLACEHOLDER-chat-updates";