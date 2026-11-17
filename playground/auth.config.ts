import type { BetterAuthClientOptions } from 'better-auth';
import { adminClient } from 'better-auth/client/plugins';

export default {
  // Better auth client options
  plugins: [adminClient()],
  sessionOptions: {
    refetchOnWindowFocus: false
  }
} satisfies BetterAuthClientOptions;
