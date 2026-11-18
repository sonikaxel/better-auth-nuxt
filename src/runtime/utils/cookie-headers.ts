import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ServerEvent } from '../server/internal/nitro-compact';

export function appendCookieHeader(event: ServerEvent, header: string): void {
  // ------------- Event = H3Event

  const nodeResponse = (
    event as unknown as {
      node?: {
        res: Response & {
          setHeader(
            name: string,
            value: number | string | readonly string[],
          ): ServerResponse<IncomingMessage>;
          getHeader(name: string): string | number | string[] | undefined;
        };
      };
    }
  ).node?.res;

  // Event is H3Event, append header to event and exit
  if (nodeResponse?.setHeader) {
    const current = nodeResponse.getHeader?.('set-cookie');

    if (Array.isArray(current)) {
      nodeResponse.setHeader('set-cookie', [...current, header]);
    }
    else if (typeof current === 'string') {
      nodeResponse.setHeader('set-cookie', [current, header]);
    }
    else {
      nodeResponse.setHeader('set-cookie', [header]);
    }

    return;
  }

  // ------------ Event = RequestEvent

  // Fallback to RequestEvent
  const eventWithResponse = event as ServerEvent & {
    res?: { headers?: Headers };
    response?: { headers?: Headers };
  };

  const responseHeaders
    = eventWithResponse.res?.headers ?? eventWithResponse.response?.headers;

  responseHeaders?.append('set-cookie', header);
}

function getSetCookieHeaders(headers: Headers): string[] {
  const cookieHeaders = headers as Headers & {
    getAll?: (name: string) => string[];
  };

  const getSetCookie = cookieHeaders.getSetCookie;

  // Preserve explicit header boundaries, including commas in extension attributes.
  if (getSetCookie) return getSetCookie.call(headers);

  // Cloudflare Workers also exposes individual Set-Cookie fields through getAll.
  if (cookieHeaders.getAll)
    return cookieHeaders.getAll.call(headers, 'set-cookie');

  // Flattened legacy headers lose field boundaries; splitting can invent cookies.
  const header = headers.get('set-cookie');

  return header ? [header] : [];
}

export function appendSetCookieHeaders(event: ServerEvent, headers: Headers): void {
  for (const header of getSetCookieHeaders(headers))
    appendCookieHeader(event, header);
}
