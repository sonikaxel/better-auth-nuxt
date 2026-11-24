import { adminClient } from 'better-auth/client/plugins';

export default defineAuthClient({
  // Better auth client options
  plugins: [adminClient()],
  sessionOptions: {
    refetchOnWindowFocus: false
  }
});
