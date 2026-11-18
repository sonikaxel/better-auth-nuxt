import type { RequestEvent } from 'nuxt/server';
import { defineEventHandler, useRuntimeConfig } from 'nuxt/server';

export type ServerEvent = RequestEvent;

export { defineEventHandler, useRuntimeConfig };

export function toWebRequest(event: ServerEvent): Request {
  return event.req;
}
