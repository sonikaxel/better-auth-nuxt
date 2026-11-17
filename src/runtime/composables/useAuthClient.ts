import _clientConfig from '#auth/client';
import { createAuthClient } from 'better-auth/vue';
import type { AuthClient } from '../types';
import defu from 'defu';
import type { BetterAuthClientOptions } from 'better-auth';
import { useRequestURL } from '#imports';
import { getAPIBasePath } from '../utils/path';

let _clientAuth: AuthClient;

export const useAuthClient = (): AuthClient => {
  if (!_clientAuth) {
    const clientConfig = defu(_clientConfig, {
      baseURL: useRequestURL().origin,
      basePath: getAPIBasePath()
    } satisfies BetterAuthClientOptions);

    _clientAuth = createAuthClient(clientConfig);
  }

  return _clientAuth;
};
