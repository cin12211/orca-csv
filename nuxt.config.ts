import tailwindcss from '@tailwindcss/vite';
import type { DefineNuxtConfig, NuxtConfig } from 'nuxt/config';

const appHeaderConfig: NonNullable<NuxtConfig['app']>['head'] = {
  htmlAttrs: { lang: 'en' },
  meta: [
    {
      name: 'viewport',
      content:
        'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover',
    },
  ],
};

const shadcnConfig: Parameters<DefineNuxtConfig>[number]['shadcn'] = {
  prefix: '',
  componentDir: '@/components/ui',
};

export default defineNuxtConfig({
  compatibilityDate: '2025-06-18',
  ssr: false,
  telemetry: false,

  devtools: { enabled: true },

  runtimeConfig: {
    public: {},
  },

  modules: [
    'shadcn-nuxt',
    '@nuxt/icon',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    'nuxt-typed-router',
    '@formkit/auto-animate',
  ],

  css: ['~/assets/css/tailwind.css'],

  colorMode: {
    preference: 'light',
    fallback: 'light',
    classSuffix: '',
    globalName: '__NUXT_COLOR_MODE__',
    componentName: 'ColorScheme',
    storage: 'localStorage',
    storageKey: 'nuxt-color-mode',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  shadcn: shadcnConfig,

  icon: {
    serverBundle: 'local',
    clientBundle: { scan: true },
    provider: 'iconify',
  },

  components: {
    dirs: [{ path: '~/components', pathPrefix: false, extensions: ['vue'] }],
  },

  piniaPluginPersistedstate: {
    storage: 'localStorage',
  },

  app: {
    head: appHeaderConfig,
  },
});
