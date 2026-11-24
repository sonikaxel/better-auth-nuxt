import _clientConfig from '#auth/client';
import { useRequestURL } from '#imports';
import { createAuthClient } from 'better-auth/vue';
import type { AuthClient } from '../types';
import { getAPIBasePath } from '../utils/path';

let _clientAuth: AuthClient;

export const useAuthClient = (): AuthClient => {
  const baseURL = useRequestURL();

  if (!_clientAuth) {
    const clientConfig = _clientConfig({
      baseURL: baseURL.origin,
      basePath: getAPIBasePath()
    });

    _clientAuth = createAuthClient(clientConfig);
  }

  return _clientAuth;
};
