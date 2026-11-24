import type { ModuleOptions, ModuleOptionsNormalized } from '../../types';
import defu from 'defu';

export function normalizeOptions(
  options: ModuleOptions
): ModuleOptionsNormalized {
  const normalizedOptions: ModuleOptionsNormalized = defu(options, {
    enabled: true,
    redirects: {
      login: '/login',
      guest: '/'
    },
    redirectQueryKey: 'redirect',
    preserveRedirect: true,
    cookiePrefix: 'auth'
  } satisfies ModuleOptionsNormalized);

  return normalizedOptions;
}
