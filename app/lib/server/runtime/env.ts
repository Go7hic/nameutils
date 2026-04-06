import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function getAppRuntimeEnv() {
  const { env } = await getCloudflareContext({ async: true });
  return env;
}

export function getRequiredEnvString<K extends keyof CloudflareEnv>(
  env: CloudflareEnv,
  key: K,
) {
  const value = env[key];

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required Cloudflare binding: ${String(key)}`);
  }

  return value;
}
