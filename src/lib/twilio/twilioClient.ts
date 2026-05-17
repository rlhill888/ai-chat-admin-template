import twilio from "twilio";
import { getSecret } from "@/lib/secrets/awsSecrets";

type TwilioClient = ReturnType<typeof twilio>;
let _client: TwilioClient | null = null;

export async function getTwilioClient(): Promise<TwilioClient> {
  if (_client) return _client;
  const secret = await getSecret(process.env.TWILIO_SECRET_ARN!);
  _client = twilio(secret.accountSid, secret.authToken);
  return _client;
}
