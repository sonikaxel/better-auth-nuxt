import type { H3Event } from 'h3';

export function appendCookieHeader(event: H3Event, header: string): void {
  const nodeResponse = event.node?.res;

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

  const eventWithResponse = event as H3Event & {
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

export function appendSetCookieHeaders(event: H3Event, headers: Headers): void {
  for (const header of getSetCookieHeaders(headers))
    appendCookieHeader(event, header);
}
