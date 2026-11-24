import { admin } from 'better-auth/plugins';

export default defineAuthServer({
  baseURL: 'http://localhost:3000',
  emailAndPassword: {
    enabled: true
  },
  plugins: [admin()]
});
