import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: process.env.APP_AWS_REGION! });
const cache = new Map<string, Record<string, string>>();

export async function getSecret(secretArn: string): Promise<Record<string, string>> {
  const cached = cache.get(secretArn);
  if (cached) return cached;
  const { SecretString } = await client.send(
    new GetSecretValueCommand({ SecretId: secretArn })
  );
  const parsed = JSON.parse(SecretString!) as Record<string, string>;
  cache.set(secretArn, parsed);
  return parsed;
}
