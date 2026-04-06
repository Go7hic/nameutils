export function createKvStringCache(namespace?: KVNamespace | null) {
  return {
    async get(key: string) {
      if (!namespace) {
        return null;
      }

      return namespace.get(key);
    },
    async put(key: string, value: string, ttlSeconds: number) {
      if (!namespace) {
        return;
      }

      await namespace.put(key, value, {
        expirationTtl: ttlSeconds,
      });
    },
  };
}
