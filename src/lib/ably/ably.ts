import * as Ably from "ably";
import { getSecret } from "@/lib/secrets/awsSecrets";

let _ably: Ably.Rest | null = null;

export async function getAbly(): Promise<Ably.Rest> {
  if (_ably) return _ably;
  const secret = await getSecret(process.env.ABLY_SECRET_ARN!);
  _ably = new Ably.Rest(secret.apiKey);
  return _ably;
}