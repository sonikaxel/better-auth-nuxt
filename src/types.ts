export interface ModuleOptions {
  cookiePrefix?: string;
  redirects?: {
    /** Login page route, default '/login' */
    login?: string;
    /** Navigate user on successful logout, default no redirect */
    logout?: string;
    /** Redirect a guest user to, default '/' */
    guest?: string;
  };
  /** Preserve Redirect when redirected by auth middleware, default `true` */
  preserveRedirect?: boolean;
  /** Query key user for redirect, default 'redirect' */
  redirectQueryKey?: string;
}

export type ModuleOptionsNormalized = {
  redirects: {
    login: string;
    logout?: string;
    guest: string;
  };
  /** Preserve Redirect when redirected by auth middleware, default `true` */
  preserveRedirect: boolean;
  /** Query key user for redirect, default 'redirect' */
  redirectQueryKey: string;
  /** Session Cookie prefix */
  cookiePrefix: string;
};
