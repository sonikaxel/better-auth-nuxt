import type clientAuthConfig from '#auth/client';
import type serverAuthConfig from '#auth/server';
import type { Auth } from 'better-auth';
import type { VueAuthClient } from 'better-auth/vue';
import type { UserMatch } from '../utils/match-user';

/** Server auth config */
export type AuthServerConfig = ReturnType<typeof serverAuthConfig>;
/** Server auth */
export type AuthServer = Auth<AuthServerConfig>;

/** Auth user session */
export type AuthUserSession = AuthServer['$Infer']['Session'];

/** Auth session (full) */
export type AuthSession = AuthUserSession['session'];
/** Auth user */
export type AuthUser = AuthUserSession['user'];

type UserMatchable<T extends AuthUser> = Required<{
  [P in keyof T as NonNullable<T[P]> extends Date ? never : P]: NonNullable<
    T[P]
  >;
}>;

/** Auth session */
export type ClientAuthSession = Omit<AuthSession, 'token'>;

/** Client auth config */
export type AuthClientConfig = typeof clientAuthConfig;
/** Client auth */
export type AuthClient = VueAuthClient<ReturnType<AuthClientConfig>>;

/** Auth Mode */
export type AuthMode = 'guest' | 'user';

/** User to match */
export type MatchAuthUser = UserMatch<UserMatchable<AuthUser>>;

/** Auth Meta */
export type AuthMeta
  = | false
    | AuthMode
    | {
      only?: AuthMode;
      user?: MatchAuthUser;
      redirectTo?: string;
    };

/** Auth Route Rules */
export type AuthRouteRules = Record<string, unknown> & { auth?: AuthMeta };

type UpdateUserFn = AuthClient['updateUser'];

/** Update user input */
export type AuthUserUpdateInput = Parameters<UpdateUserFn>[0];
