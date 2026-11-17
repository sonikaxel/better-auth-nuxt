import type { BetterAuthOptions } from 'better-auth';

const authConfig = {
  emailAndPassword: {
    enabled: true
  }
} satisfies BetterAuthOptions;

export default authConfig;
