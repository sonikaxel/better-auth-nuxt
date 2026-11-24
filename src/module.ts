import type { LayerDirectories, NuxtLogger } from '@nuxt/kit';
import {
  addImports,
  addPlugin,
  addRouteMiddleware,
  addServerHandler,
  addServerImports,
  addTemplate,
  addTypeTemplate,
  createResolver,
  defineNuxtModule,
  getLayerDirectories,
  resolveServerVariant,
  updateTemplates,
  useLogger
} from '@nuxt/kit';
import type { Nuxt } from '@nuxt/schema';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { normalizeOptions } from './runtime/utils/normalize-options';
import type { ModuleOptions } from './types';

// Module options TypeScript interface definition
export type { ModuleOptions } from './types';

const configFileName = 'auth.config';

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'better-auth-nuxt',
    configKey: 'auth'
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  async setup(options, nuxt) {
    const optionsNormalized = normalizeOptions(options);

    if (!optionsNormalized.enabled) return;

    const resolver = createResolver(import.meta.url);
    const layer = getProjectDir(nuxt);
    const logger = useLogger('better-auth-nuxt');

    nuxt.options.alias['#better-auth/nitro-compact'] = resolveServerRuntimeShim({
      resolve: resolver.resolve
    });

    addImports([
      {
        from: resolver.resolve('./runtime/utils/config'),
        name: 'defineAuthClient'
      }
    ]);

    addServerImports([
      {
        from: resolver.resolve('./runtime/server/utils/config'),
        name: 'defineAuthServer'
      }
    ]);

    (nuxt.options.runtimeConfig.public.auth as unknown)
      = optionsNormalized;

    let serverConfigPath = join(layer.server, configFileName);
    let clientConfigPath = join(layer.app, configFileName);

    await generateDefaultConfigFiles({
      clientDir: layer.app,
      serverDir: layer.server,
      configFileName,
      logger
    });

    const { serverConfigCode, clientConfigCode } = buildAuthConfigTemplate({
      serverConfigPath,
      clientConfigPath
    });

    serverConfigPath = addTemplate({
      filename: 'better-auth/server.config.ts',
      getContents: () => serverConfigCode,
      write: true
    }).dst;

    clientConfigPath = addTemplate({
      filename: 'better-auth/client.config.ts',
      getContents: () => clientConfigCode,
      write: true
    }).dst;

    nuxt.options.alias['#auth/server'] = serverConfigPath;
    nuxt.options.alias['#auth/client'] = clientConfigPath;

    nuxt.hook('prepare:types', ({ references }) => {
      references.push({
        path: serverConfigPath
      });
    });

    const routeRulesPath = addTemplate({
      filename: 'better-auth/route-rules.ts',
      getContents: () =>
        [
          `export const authRouteRules = ${JSON.stringify(nuxt.options.routeRules ?? {}, null, 2)}`
        ].join('\n'),
      write: true
    }).dst;

    nuxt.options.alias['#auth/route-rules'] = routeRulesPath;

    addTypeTemplate(
      {
        filename: 'types/route-rules-auth.d.ts',
        getContents: () =>
          buildRouteRuleTypeTemplate({
            resolve: resolver.resolve,
            serverConfigPath
          })
      },
      {
        nitro: true,
        node: true,
        nuxt: true,
        shared: true
      }
    );

    nuxt.options.alias['#better-auth-nuxt'] = resolver.resolve('./import');

    nuxt.hook('modules:done', () => {
      nuxt.hook('builder:watch', async (_event, relativePath) => {
        if (relativePath.includes(configFileName)) {
          await updateTemplates({
            filter: template =>
              template.filename.startsWith('better-auth/')
              || template.filename.startsWith('types/route-rules-auth')
          });
        }
      });

      addImports([
        {
          from: resolver.resolve('./runtime/composables/useAuthClient'),
          name: 'useAuthClient'
        },
        {
          from: resolver.resolve('./runtime/composables/useUserSession'),
          name: 'useUserSession'
        }
      ]);

      addServerImports([
        {
          from: resolver.resolve('./runtime/server/utils/auth'),
          name: 'serverAuth'
        }, {
          from: resolver.resolve('./runtime/server/utils/session'),
          name: 'requireUserSession'
        }
      ]);

      addServerHandler({
        handler: resolver.resolve('./runtime/server/api/auth/[...all]'),
        route: '/api/auth/**'
      });

      addPlugin({
        mode: 'server',
        name: 'auth-session.server',
        src: resolver.resolve('./runtime/plugins/session.server')
      });

      addPlugin({
        mode: 'client',
        name: 'auth-session.client',
        src: resolver.resolve('./runtime/plugins/session.client')
      });

      addRouteMiddleware({
        path: resolver.resolve('./runtime/middleware/auth.global'),
        global: true,
        name: 'auth'
      });
    });
  }
});

function getProjectDir(nuxt: Nuxt): LayerDirectories {
  const mainLayer = getLayerDirectories(nuxt)[0]!;

  return mainLayer;
}

async function generateDefaultConfigFiles(opts: {
  serverDir: string;
  clientDir: string;
  configFileName: string;
  logger: NuxtLogger;
}) {
  const { serverDir, clientDir, configFileName, logger } = opts;

  const filePath = {
    server: join(serverDir, `${configFileName}.ts`),
    client: join(clientDir, `${configFileName}.ts`)
  };

  await mkdir(dirname(filePath.server), { recursive: true });
  await mkdir(dirname(filePath.client), { recursive: true });

  const serverConfigExists = existsSync(filePath.server);
  const clientConfigExists = existsSync(filePath.client);

  if (!serverConfigExists) {
    logger.log('Generating server config file...');
    await writeFile(
      filePath.server,
      [
        `export default defineAuthServer({`,
        `  emailAndPassword: {`,
        `    enabled: true`,
        `  }`,
        `});`,
        ``
      ].join('\n')
    );
  }

  if (!clientConfigExists) {
    logger.log('Generating client config file...');
    await writeFile(
      filePath.client,
      [
        `export default defineAuthClient({`,
        `  // Better auth client options`,
        `});`,
        ``
      ].join('\n')
    );
  }
}

function buildAuthConfigTemplate(opts: {
  serverConfigPath: string;
  clientConfigPath: string;
}) {
  const { serverConfigPath, clientConfigPath } = opts;

  const _serverConfigPath = serverConfigPath.replace(/\\/g, '/');
  const _clientConfigPath = clientConfigPath.replace(/\\/g, '/');

  const serverConfigCode = [
    `import serverConfig from ${JSON.stringify(_serverConfigPath)};`,
    ``,
    `export default serverConfig;`,
    ``
  ].join('\n');

  const clientConfigCode = [
    `import clientConfig from ${JSON.stringify(_clientConfigPath)};`,
    ``,
    `export default clientConfig;`,
    ``
  ].join('\n');

  return {
    serverConfigCode,
    clientConfigCode
  };
}

export function buildRouteRuleTypeTemplate({
  resolve,
  serverConfigPath
}: {
  resolve: (...path: string[]) => string;
  serverConfigPath: string;
}) {
  let serverAuthPath = serverConfigPath.replace(/\\/g, '/');

  if (serverAuthPath.endsWith('.ts')) {
    serverAuthPath = serverAuthPath.slice(0, serverAuthPath.length - 3);
  }

  return [
    `import { UserMatch } from '${resolve('./runtime/utils/match-user')}';`,
    `import type { AuthMode } from '${resolve('./runtime/types')}';`,
    `import serverAuthConfig from '${serverAuthPath}';`,
    `import type { Auth } from 'better-auth';`,
    ``,
    `type AuthUser = Auth<ReturnType<typeof serverAuthConfig>>['$Infer']['Session']['user'];`,
    ``,
    `type UserMatchable<T extends AuthUser> = Required<{`,
    `  [P in keyof T as NonNullable<T[P]> extends Date ? never : P]: NonNullable<`,
    `    T[P]`,
    `  >;`,
    `}>;`,
    ``,
    `export type MatchAuthUser = UserMatch<UserMatchable<AuthUser>>;`,
    ``,
    `type AuthMeta =`,
    `  | false`,
    `  | AuthMode`,
    `  | {`,
    `      only?: AuthMode;`,
    `      user?: MatchAuthUser;`,
    `      redirectTo?: string;`,
    `    };`,
    ``,
    `type AuthRouteRules = Record<string, unknown> & { auth?: AuthMeta };`,
    ``,
    `declare module 'nitropack/types' {`,
    `  interface NitroRouteConfig extends AuthRouteRules {}`,
    `  interface NitroRouteRules extends AuthRouteRules {}`,
    `}`,
    `declare module "nitro/types" {`,
    `interface RouteRuleConfig extends AuthRouteRules {}`,
    `interface NormalizedRouteRules extends AuthRouteRules {}`,
    `}`
  ].join('\n');
}

function resolveServerRuntimeShim({ resolve }: { resolve: (path: string) => string }) {
  const nitro2 = resolve('./runtime/server/internal/nitro2');

  return resolveServerVariant({
    nuxt: resolve('./runtime/server/internal/nitro3'),
    nitro2
  }) ?? nitro2;
}
