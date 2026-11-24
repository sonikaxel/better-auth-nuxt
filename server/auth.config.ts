import { defineAuthServer } from '#build/types/nitro-imports';

export default defineAuthServer({
  emailAndPassword: {
    enabled: true
  }
});
