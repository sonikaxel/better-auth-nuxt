import { defineEventHandler, toWebRequest } from 'h3';
import { serverAuth } from '../../utils';

export default defineEventHandler(async (event) => {
  return serverAuth(event).handler(toWebRequest(event));
});
