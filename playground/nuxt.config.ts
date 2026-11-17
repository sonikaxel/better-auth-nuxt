export default defineNuxtConfig({
  modules: ['better-auth-nuxt'],
  devtools: { enabled: true },
  routeRules: {
    '/': { prerender: true },
    '/login': {
      auth: {
        only: 'guest',
        redirectTo: '/'
      }
    },
    '/admin/**': {
      ssr: false,
      auth: {
        user: {
          role: 'admin'
        }
        // redirectTo: '/'
      }
    }
  },
  compatibilityDate: '2026-11-13',
  auth: {
    cookiePrefix: 'auth'
  }
});
