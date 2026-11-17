import type { BetterAuthOptions } from 'better-auth';
import { admin } from 'better-auth/plugins';

export default {
  baseURL: 'http://localhost:3000',
  emailAndPassword: {
    enabled: true
  },
  plugins: [admin()]
} satisfies BetterAuthOptions;
