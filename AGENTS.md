# orca-csv Agent Guide

Nuxt 4 + Vue 3 + TypeScript SPA scaffolded with shadcn-vue (new-york / neutral /
lucide). Tailwind v4 via `@tailwindcss/vite` (no `@nuxtjs/tailwindcss`).

## Project At A Glance

- **Framework:** Nuxt 4 (`srcDir: 'app/'` — `app/app.vue`, `app/pages/`,
  `app/components/`, `app/assets/`, `app/layouts/`, `app/lib/`)
- **Rendering:** SPA — `ssr: false` in `nuxt.config.ts`
- **Styling:** Tailwind v4 + CSS variables (oklch tokens in
  `app/assets/css/tailwind.css`); dark mode toggled via `.dark` class
- **Components:** shadcn-vue (new-york style, baseColor neutral, icon library
  lucide). Installed to `app/components/ui/`. NOT all shadcn-vue components are
  present — see "Existing UI components" below.
- **Auto-import:** shadcn-vue components are auto-imported by Nuxt; do not
  manually import them. Just use `<Button>`, `<Card>`, etc. in templates.
- **Path aliases:** `@/components`, `@/lib`, `@/composables`, `@/components/ui`
  (configured in `components.json` and resolved by Nuxt).

## Reference Repo

This project mirrors the stack of `/Volumes/Cinny/Cinny/Project/HeraQ`. When
upgrading shadcn-vue, adjusting Tailwind tokens, or changing module wiring,
compare with HeraQ's `nuxt.config.ts`, `components.json`, and
`assets/css/tailwind.css` first.

## Nuxt Modules Installed

`shadcn-nuxt`, `@nuxt/icon`, `@nuxtjs/color-mode`, `@pinia/nuxt`,
`pinia-plugin-persistedstate/nuxt`, `nuxt-typed-router`, `@formkit/auto-animate`.

## MCP Servers (`.opencode/opencode.json`)

- `nuxt` (remote, `https://nuxt.com/mcp`) — Nuxt docs / blog / deploy
  providers. Use `mcp_nuxt` tools for any Nuxt API question.
- `shadcnVue` (local, `npx shadcn-vue@latest mcp`) — browse, search, and
  install shadcn-vue components. Prefer this over guessing component names
  when adding a new UI primitive.
- `context7` (remote, `https://mcp.context7.com/mcp`) — resolve-library-id +
  query-docs for any third-party library (Vue, Reka UI, Tailwind, Pinia, etc.).
  Requires the `context7-api-key` input on first run. **Set it via the
  opencode input prompt, or in `~/.config/opencode/opencode.jsonc` globally.**

`context7` API key setup: first time a tool call fails with auth error, open
`.opencode/opencode.json` and re-save — opencode will prompt for the key.

## Commands

```bash
pnpm dev               # dev server (http://localhost:3000)
pnpm build             # production build
pnpm generate          # static generate
pnpm typecheck         # nuxt typecheck
pnpm preview           # preview production build
pnpm postinstall       # runs nuxt prepare
```

`nuxt prepare` runs automatically via `postinstall`; rerun manually after
adding new modules or aliases.

## Adding shadcn-vue Components

Always go through the CLI — do NOT copy components by hand. The CLI reads
`components.json` and respects the configured `baseColor` + aliases.

```bash
pnpm dlx shadcn-vue@latest add <component-name>     # single
pnpm dlx shadcn-vue@latest add a b c                # multiple
pnpm dlx shadcn-vue@latest add --overwrite          # refresh existing
```

`components.json` lives at repo root, NOT inside `app/`. The
`tailwind.css` path inside it is `app/assets/css/tailwind.css` to match the
Nuxt 4 `srcDir: app` layout.

## Tailwind Conventions

- All design tokens are CSS variables in `app/assets/css/tailwind.css`
  (`--background`, `--foreground`, `--primary`, `--border`, `--ring`, chart
  series, sidebar tokens, etc.). Components reference them via
  `bg-background`, `text-foreground`, `border-border`, etc.
- Dark mode: toggle the `.dark` class on `<html>` (handled by
  `@nuxtjs/color-mode`). The CSS uses `@custom-variant dark (&:is(.dark *))`.
- Do not edit colors inline in components. Add a token to
  `app/assets/css/tailwind.css` instead.
- `tw-animate-css` is loaded — use `animate-*` utilities from it.

## Where Things Live

- `app/app.vue` — root component. Currently renders `<NuxtLayout><NuxtPage /></NuxtLayout>`.
- `app/pages/` — file-based routes.
- `app/layouts/` — layout components (default + named).
- `app/components/ui/` — shadcn-vue primitives. **Edit these only via
  `pnpm dlx shadcn-vue@latest add --overwrite`**, or your changes will be lost
  on next upgrade.
- `app/components/` — your own feature components (not in `ui/`).
- `app/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge). Required by
  every shadcn-vue component.
- `app/assets/css/tailwind.css` — Tailwind v4 entry + design tokens.
- `app/plugins/` — Nuxt plugins (e.g. `ssr-width.ts` from shadcn-vue docs).

## Things Agents Get Wrong

- **Don't import shadcn-vue components** — Nuxt + `shadcn-nuxt` auto-imports
  them. A manual `import { Button } from '@/components/ui/button'` works but
  is noise; auto-import is the convention.
- **Don't put new components in `app/components/ui/`** unless they came from
  `pnpm dlx shadcn-vue@latest add`. Your own components go in
  `app/components/`.
- **`components.json` is at repo root**, not under `app/`. The
  `tailwind.css` path inside it is `app/assets/css/tailwind.css`.
- **Nuxt 4 `srcDir` is `app/`** — every `~/...` alias resolves under `app/`.
  `@/lib` = `app/lib`, `@/components` = `app/components`. Do not create
  `lib/`, `components/`, `pages/` at the repo root.
- **Tailwind v4 ≠ v3.** No `tailwind.config.ts` content/plugins; tokens live
  in CSS via `@theme inline`. `tailwind.config.ts` may exist for legacy
  shadcn-nuxt reasons but is not the source of truth.
- **`@nuxtjs/color-mode` prefix is empty** (`classSuffix: ''`) — dark class
  is literally `.dark`, not `.dark-mode`.
- **SPA mode (`ssr: false`)** — `<ClientOnly>` is usually not needed, but
  reka-ui popper/dialog portals work without it because there is no SSR.

## Verification

After changing `nuxt.config.ts`, modules, or CSS tokens:

```bash
pnpm typecheck        # catches broken imports + alias typos
pnpm dev              # open http://localhost:3000 — visually confirm
```

There is no test suite yet. Add Vitest + `@nuxt/test-utils` only when there
is feature code worth testing.
