import type { BetterAuthClientOptions } from 'better-auth';
import defu from 'defu';

export function defineAuthClient<const O extends BetterAuthClientOptions>(
  clientOptions: O
) {
  return (ctx: { baseURL?: string; basePath?: string }) => {
    const clientConfig = defu(clientOptions, ctx);
    return clientConfig;
  };
}
