import { defineEventHandler, toWebRequest } from '../../internal/nitro-compact';
import { serverAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  return serverAuth(event).handler(toWebRequest(event));
});
