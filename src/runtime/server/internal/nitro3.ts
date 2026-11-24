import type { RequestEvent } from 'nuxt/server';
import {
  defineEventHandler,
  useRuntimeConfig,
  createError,
  getRequestHeaders as _getRequestHeaders
} from 'nuxt/server';

export type ServerEvent = RequestEvent;

export { defineEventHandler, useRuntimeConfig };

export function toWebRequest(event: ServerEvent): Request {
  return event.req;
}

export function getRequestHeaders(event: ServerEvent): Record<string, string> {
  return _getRequestHeaders(event);
}

export function createAuthError(input: {
  status?: number;
  statusText?: string;
  message: string;
}): Error {
  return createError({ ...input });
}
