import * as Ably from "ably";
import { getSecret } from "@/lib/secrets/awsSecrets";

let _ablyRest: Ably.Rest | null = null;

export async function getAblyRest(): Promise<Ably.Rest> {
  if (_ablyRest) return _ablyRest;
  const secret = await getSecret(process.env.ABLY_SECRET_ARN!);
  _ablyRest = new Ably.Rest(secret.apiKey);
  return _ablyRest;
}

export const COMPANY_NAME_PLACEHOLDER_CHAT_CHANNEL = "COMPANY_NAME_PLACEHOLDER-chat-updates";