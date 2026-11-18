import { type ServerEvent, createAuthError, getRequestHeaders } from '#better-auth/nitro-compact';
import type { AuthUserSession, MatchAuthUser } from '../../types';
import { matchesUser } from '../../utils/match-user';
import { serverAuth } from './auth';

interface RequireUserSessionOptions {
  user?: MatchAuthUser;
  rule?: (userSession: AuthUserSession) => boolean | Promise<boolean>;
}

export async function requireUserSession(
  event: ServerEvent,
  options?: RequireUserSessionOptions
): Promise<AuthUserSession> {
  const session = await serverAuth(event).api.getSession({
    headers: getRequestHeaders(event)
  });

  if (!session) {
    throw createAuthError({
      statusCode: 401,
      statusMessage: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  }

  if (options?.user && !matchesUser(session.user, options.user)) {
    throw createAuthError({
      statusCode: 403,
      statusMessage: 'FORBIDDEN',
      message: 'Access denied'
    });
  }

  if (options?.rule) {
    const allowed = await options.rule({
      user: session.user,
      session: session.session
    });

    if (!allowed) {
      throw createAuthError({
        statusCode: 403,
        statusMessage: 'FORBIDDEN',
        message: 'Access denied'
      });
    }
  }

  return session;
}
