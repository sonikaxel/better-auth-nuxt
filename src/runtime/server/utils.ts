import serverAuthConfig from '#auth/server';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import defu from 'defu';
import type { ModuleOptions } from '../../types';
import type { AuthServer, AuthServerConfig } from '../types';
import { getAPIBasePath } from '../utils/path';
import type { ServerEvent } from './internal/nitro-compact';
import { useRuntimeConfig } from './internal/nitro-compact';

let _serverAuth: AuthServer;

export const serverAuth = (event?: ServerEvent): AuthServer => {
  if (!_serverAuth) {
    const runtimeConfig = useRuntimeConfig(event);

    const { cookiePrefix } = runtimeConfig.public.auth as ModuleOptions;

    const secret
      = process.env.BETTER_AUTH_SECRET
        || process.env.AUTH_SECRET
        || runtimeConfig.appSecret;

    const options = defu(serverAuthConfig, {
      secret,
      advanced: {
        cookiePrefix
      },
      basePath: getAPIBasePath()
    } satisfies BetterAuthOptions);

    _serverAuth = betterAuth(options as AuthServerConfig);
  }

  return _serverAuth;
};
