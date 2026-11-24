import type { BetterAuthOptions } from 'better-auth';

export function defineAuthServer<const O extends BetterAuthOptions>(
  serverOptions: O
) {
  return () => {
    return serverOptions;
  };
}
