import {
  computed,
  navigateTo,
  nextTick,
  useNuxtApp,
  useRequestFetch,
  useRequestHeaders,
  useRuntimeConfig,
  useState,
  watch,
  type ComputedRef,
  type Ref
} from '#imports';
import { parseJSON } from 'better-auth/client';
import type {
  AuthClient,
  AuthUser as ClientAuthUser,
  AuthUserSession,
  AuthUserUpdateInput,
  ClientAuthSession
} from '../types';
import { isRecord, normalizeAuthActionError } from '../utils/auth-action-error';
import { getAPISessionPath } from '../utils/path';
import { useAuthClient } from './useAuthClient';

type UseUserSession = {
  client: AuthClient;
  user: Ref<ClientAuthUser | null>;
  session: Ref<ClientAuthSession | null>;
  loggedIn: ComputedRef<boolean>;
  ready: Ref<boolean>;
  fetchSession: (opts?: {
    force?: boolean | undefined;
    headers?: HeadersInit;
  }) => Promise<void>;
  signOut: (options?: SignOutOptions | undefined) => Promise<void>;
  waitForSession: () => Promise<void>;
  updateUser: (updates: AuthUserUpdateInput) => Promise<void>;
};

export interface SignOutOptions {
  onSuccess?: () => void | Promise<void>;
}

const _appSync = new WeakSet();
let _signOutPromise: Promise<void> | null = null;

export const useUserSession = (): UseUserSession => {
  const authClient = useAuthClient();

  const runtimeFlags = {
    server: import.meta.server,
    client: import.meta.client
  };
  const runtimeConfig = useRuntimeConfig();
  const nuxtApp = useNuxtApp();
  const client = authClient;

  // Shared state via useState for SSR hydration
  const session = useState<ClientAuthSession | null>(
    'auth:session',
    () => null
  );
  const user = useState<ClientAuthUser | null>('auth:user', () => null);
  const authReady = useState('auth:ready', () => false);
  const prerenderReadyResetQueued = useState(
    'auth:prerender-ready-reset-queued',
    () => false
  );
  const hydrationReconcileQueued = useState(
    'auth:hydration-reconcile-queued',
    () => false
  );
  const signOutInProgress = useState('auth:sign-out-in-progress', () => false);
  const ready = computed(() => authReady.value);
  const loggedIn = computed(() => Boolean(session.value && user.value));
  const isPrerenderedPayload = computed(() =>
    Boolean(nuxtApp.payload.prerenderedAt || nuxtApp.payload.isCached)
  );
  const isPrerenderHydrationEmptySnapshot = computed(() => {
    if (!runtimeFlags.client) return false;
    if (
      !nuxtApp.isHydrating
      || !nuxtApp.payload.serverRendered
      || !isPrerenderedPayload.value
    )
      return false;
    return !session.value && !user.value;
  });

  if (
    isPrerenderHydrationEmptySnapshot.value
    && authReady.value
    && !prerenderReadyResetQueued.value
  ) {
    prerenderReadyResetQueued.value = true;
    nuxtApp.hook('app:suspense:resolve', () => {
      try {
        if (!session.value && !user.value && authReady.value)
          authReady.value = false;
      }
      finally {
        prerenderReadyResetQueued.value = false;
      }
    });
  }

  function clearSession() {
    session.value = null;
    user.value = null;
  }

  async function fetchSession(
    options: { headers?: HeadersInit; force?: boolean } = {}
  ) {
    if (runtimeFlags.server)
      return fetchSessionServer({ session, user, authReady, ...options });
    if (client)
      return fetchSessionClient({
        client,
        session,
        user,
        authReady,
        ...options
      });
  }

  let mountedReconciliationStarted = false;
  let sessionExpiredRedirecting = false;

  function getSessionExpiredRedirect(): string | undefined {
    return (
      runtimeConfig.public.auth as
      | { redirects?: { sessionExpired?: string } }
      | undefined
    )?.redirects?.sessionExpired;
  }

  function scheduleSessionExpiredRedirect() {
    const sessionExpiredRedirect = getSessionExpiredRedirect();
    if (
      !sessionExpiredRedirect
      || signOutInProgress.value
      || sessionExpiredRedirecting
    )
      return;

    sessionExpiredRedirecting = true;
    void nextTick().then(() => {
      if (sessionExpiredRedirecting) void navigateTo(sessionExpiredRedirect);
    });
  }

  function queueHydrationReconciliation() {
    if (hydrationReconcileQueued.value) return;

    hydrationReconcileQueued.value = true;
    const reconcile = async () => {
      const sessionWasActive = loggedIn.value;
      try {
        await fetchSession({ force: true });
        if (sessionWasActive && !loggedIn.value)
          scheduleSessionExpiredRedirect();
      }
      catch (error) {
        console.error(
          '[nuxt-better-auth] Failed to fetch session during hydration reconciliation:',
          error
        );
      }
      finally {
        hydrationReconcileQueued.value = false;
      }
    };

    if (mountedReconciliationStarted) {
      void reconcile();
    }
    else {
      nuxtApp.hook('app:mounted', () => {
        mountedReconciliationStarted = true;
        return reconcile();
      });
    }
  }

  // On client, subscribe to better-auth's reactive session store
  if (runtimeFlags.client && client && !_appSync.has(nuxtApp)) {
    const clientSession = client.useSession();
    const initialClientSession = clientSession.value;
    let hydrationSessionWasActive
      = nuxtApp.isHydrating
        && nuxtApp.payload.serverRendered
        && Boolean(session.value && user.value)
        && !initialClientSession?.data?.session
        && !initialClientSession?.data?.user;

    const shouldReconcileInitialHydration
      = nuxtApp.isHydrating
        && nuxtApp.payload.serverRendered
        && Boolean(session.value && user.value)
        && !initialClientSession?.data?.session
        && !initialClientSession?.data?.user
        && !initialClientSession?.isPending
        && !initialClientSession?.isRefetching;

    if (shouldReconcileInitialHydration) queueHydrationReconciliation();

    watch(
      () => clientSession.value,
      (newSession, previousSession) => {
        const shouldWaitForPrerenderResolution
          = isPrerenderHydrationEmptySnapshot.value
            && !newSession?.data?.session
            && !newSession?.data?.user;

        if (shouldWaitForPrerenderResolution) return;

        if (newSession?.data?.session && newSession?.data?.user) {
          sessionExpiredRedirecting = false;
          hydrationSessionWasActive = false;

          // set Auth shared state
          session.value = stripToken(newSession.data.session);
          user.value = newSession.data.user;
        }
        else if (!newSession?.isPending && !newSession?.isRefetching) {
          const isHydrationEmptySnapshot
            = nuxtApp.isHydrating
              && nuxtApp.payload.serverRendered
              && Boolean(session.value && user.value)
              && !newSession?.data?.session
              && !newSession?.data?.user;

          if (isHydrationEmptySnapshot) {
            queueHydrationReconciliation();
            return;
          }

          const sessionWasActive
            = hydrationSessionWasActive
              || Boolean(
                previousSession?.data?.session && previousSession?.data?.user
              );
          const sessionWasInvalidated
            = !newSession?.error
              || isExpectedSignedOutSessionError(newSession.error);

          if (sessionWasInvalidated) {
            hydrationSessionWasActive = false;
            clearSession();
          }

          if (sessionWasActive && sessionWasInvalidated)
            scheduleSessionExpiredRedirect();
        }
        if (
          !authReady.value
          && !newSession?.isPending
          && !newSession?.isRefetching
        )
          authReady.value = true;
      }
    );

    _appSync.add(nuxtApp);
  }

  function waitForSession(): Promise<void> {
    return new Promise((resolve) => {
      if (loggedIn.value) {
        resolve();
        return;
      }
      const unwatch = watch(loggedIn, (isLoggedIn) => {
        if (isLoggedIn) {
          unwatch();
          resolve();
        }
      });
      setTimeout(() => {
        unwatch();
        resolve();
      }, 5000);
    });
  }

  async function signOut(options?: SignOutOptions) {
    if (!import.meta.client)
      throw new Error('signOut can only be called on client-side');

    if (_signOutPromise) {
      await _signOutPromise;
      return;
    }

    _signOutPromise = (async () => {
      signOutInProgress.value = true;
      try {
        const result = await client.signOut();
        if (isRecord(result) && result.error)
          throw new Error(normalizeAuthActionError(result.error).message);
        clearSession();

        if (options?.onSuccess) {
          await options.onSuccess();
          return;
        }

        const authConfig = runtimeConfig.public.auth as
          | { redirects?: { logout?: string } }
          | undefined;
        const logoutRedirect = authConfig?.redirects?.logout;
        if (logoutRedirect) {
          await nextTick();
          await navigateTo(logoutRedirect);
        }
      }
      finally {
        signOutInProgress.value = false;
      }
    })().finally(() => {
      _signOutPromise = null;
    });

    await _signOutPromise;
  }

  return {
    session,
    user,
    loggedIn,
    ready,
    signOut,
    waitForSession,
    fetchSession,
    updateUser: _updateUser(user, authClient),
    client: authClient
  };
};

function _updateUser(user: Ref<ClientAuthUser | null>, client: AuthClient) {
  return async (updates: AuthUserUpdateInput) => {
    if (!import.meta.client)
      throw new Error('updateUser can only be called on client-side');

    if (!user.value) return;

    const previousUser = user.value;

    user.value = { ...user.value, ...updates };

    try {
      const result = await client.updateUser(updates);

      if (result?.error) {
        if (result.error instanceof Error) {
          throw result.error;
        }

        const normalizedError = normalizeAuthActionError(result.error);
        throw new Error(normalizedError.message);
      }
    }
    catch (error) {
      user.value = previousUser;
      if (!(error instanceof Error)) {
        const normalizedError = normalizeAuthActionError(error);
        throw new Error(normalizedError.message, { cause: error });
      }
      throw error;
    }
  };
}

async function fetchSessionServer(opts: {
  user: Ref<ClientAuthUser | null>;
  session: Ref<ClientAuthSession | null>;
  authReady: Ref<boolean>;
  force?: boolean;
  headers?: HeadersInit;
}) {
  try {
    const headers = opts.headers || useRequestHeaders(['cookie']);
    const sessionApiPath = getAPISessionPath();

    const appSession = await useRequestFetch()<Partial<AuthUserSession>>(
      sessionApiPath,
      {
        query: {
          disableCookieCache: opts.force
        },
        headers,
        parseResponse: parseJSON
      }
    );

    if (appSession?.user && appSession?.session) {
      opts.session.value = stripToken(appSession.session);
      opts.user.value = appSession.user;
    }
    else {
      opts.session.value = null;
      opts.user.value = null;
    }
  }
  catch (e) {
    handleSessionFetchError(e, opts.session, opts.user);
  }
  finally {
    if (!opts.authReady.value) {
      opts.authReady.value = true;
    }
  }
}

async function fetchSessionClient(opts: {
  user: Ref<ClientAuthUser | null>;
  session: Ref<ClientAuthSession | null>;
  authReady: Ref<boolean>;
  client: AuthClient;
  force?: boolean;
  headers?: HeadersInit;
}) {
  try {
    const { client } = opts;
    const headers = opts.headers || useRequestHeaders(['cookie']);
    const fetchOptions = {
      ...(headers ? { headers } : {}),
      throw: false as const
    };

    const { data: appSession, error } = await client.getSession({
      query: {
        disableCookieCache: opts.force
      },
      fetchOptions
    });

    if (error) {
      handleSessionFetchError(error, opts.session, opts.user);
      return;
    }

    if (appSession?.user && appSession?.session) {
      opts.session.value = stripToken(appSession.session);
      opts.user.value = appSession.user;
    }
    else {
      opts.session.value = null;
      opts.user.value = null;
    }
  }
  catch (e) {
    handleSessionFetchError(e, opts.session, opts.user);
  }
  finally {
    if (!opts.authReady.value) {
      opts.authReady.value = true;
    }
  }
}

function stripToken(
  session: ClientAuthSession & { token: string }
): ClientAuthSession {
  const { token, ...rest } = session;

  return rest;
}

function isExpectedSignedOutSessionError(error: unknown): boolean {
  const normalizedError = normalizeAuthActionError(error);
  if (normalizedError.status === 401) return true;
  return normalizedError.code === 'UNAUTHORIZED';
}

function handleSessionFetchError(
  error: unknown,
  session: Ref<ClientAuthSession | null>,
  user: Ref<ClientAuthUser | null>
): void {
  if (isExpectedSignedOutSessionError(error)) {
    session.value = null;
    user.value = null;
    return;
  }

  if (error instanceof Error) throw error;

  const normalizedError = normalizeAuthActionError(error);
  throw new Error(
    `[nuxt-better-auth] Failed to fetch session: ${normalizedError.message}`,
    { cause: error }
  );
}
