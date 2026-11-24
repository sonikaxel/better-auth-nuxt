import type { H3Event } from 'h3';
import { toWebRequest as _toWebRequest, defineEventHandler, createError, getRequestHeaders as _getRequestHeaders } from 'h3';
import { useRuntimeConfig } from 'nitropack/runtime';

export type ServerEvent = H3Event;

export { defineEventHandler, useRuntimeConfig };

export function toWebRequest(event: ServerEvent): Request {
  return _toWebRequest(event);
}

export function getRequestHeaders(event: ServerEvent): Record<string, string> {
  return _getRequestHeaders(event) as Record<string, string>;
}

export function createAuthError(input: {
  statusCode?: number;
  statusMessage?: string;
  message: string;
}): Error {
  return createError({ ...input });
}
