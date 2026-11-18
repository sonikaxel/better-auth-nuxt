import type { H3Event } from 'h3';
import { toWebRequest as _toWebRequest, defineEventHandler } from 'h3';
import { useRuntimeConfig } from 'nitropack/runtime';

export type ServerEvent = H3Event;

export { defineEventHandler, useRuntimeConfig };

export function toWebRequest(event: ServerEvent): Request {
  return _toWebRequest(event);
}
