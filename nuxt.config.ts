import tailwindcss from '@tailwindcss/vite';
import type { DefineNuxtConfig } from 'nuxt/config';

const shadcnConfig: Parameters<DefineNuxtConfig>[number]['shadcn'] = {
  prefix: '',
  componentDir: './app/components/ui',
};

export default defineNuxtConfig({
  compatibilityDate: '2025-06-12',

  ssr: false,
  telemetry: false,

  devServer: {
    host: '0.0.0.0',
    port: 3000,
  },

  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },

  modules: [
    'shadcn-nuxt',
    '@nuxt/icon',
    '@nuxtjs/color-mode',
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
    clearScreen: false,
    plugins: [tailwindcss()],
    server: {
      strictPort: true,
    },
  },

  shadcn: shadcnConfig,

  icon: {
    serverBundle: 'local',
    clientBundle: {
      scan: true,
    },
    provider: 'iconify',
  },

  imports: {
    autoImport: true,
    dirs: ['core/composables'],
  },

  components: {
    dirs: [
      {
        path: '~/components',
        pathPrefix: false,
        extensions: ['vue'],
      },
    ],
  },

  spaLoadingTemplate: true,
})
