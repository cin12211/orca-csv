<script setup lang="ts">
import { cn } from '@/lib/utils';

const config = useRuntimeConfig();
const githubLink = config.public.githubLink;
const colorMode = useColorMode();

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
};
</script>

<template>
  <div class="h-full overflow-y-auto flex flex-col bg-background text-foreground selection:bg-primary/10">
    <header class="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div class="mx-auto flex h-[64px] md:h-[72px] max-w-[1280px] items-center justify-between px-5 md:px-8">
        <div class="flex items-center space-x-3">
          <!-- Logo (AppMark Style) -->
          <div class="relative h-10 w-10 overflow-hidden rounded-xl border border-black/14 bg-secondary/80 dark:border-white/10 dark:bg-white/5 shadow-sm flex items-center justify-center">
            <img src="/logo.png" alt="OrcaQ Logo" class="h-full w-full object-cover" />
          </div>
          <span class="text-lg font-semibold tracking-[-0.015em] flex items-center text-foreground">
            OrcaQ
            <span class="text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-secondary border border-border ml-2">
              csv
            </span>
          </span>
        </div>

        <div class="flex items-center space-x-4">
          <!-- GitHub Stars Shield Badge -->
          <a
            :href="githubLink"
            target="_blank"
            rel="noreferrer"
            class="transition hover:opacity-80 flex items-center"
            aria-label="GitHub repository"
          >
            <img
              alt="GitHub Repo stars"
              src="https://img.shields.io/github/stars/cin12211/orca-q"
              class="h-5"
            />
          </a>

          <!-- Theme Toggle -->
          <Button
            variant="ghost"
            size="icon"
            class="rounded-full size-9 text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border/50 cursor-pointer"
            @click="toggleTheme"
          >
            <Icon v-if="colorMode.value === 'dark'" name="lucide:moon-star" class="h-4 w-4" />
            <Icon v-else name="lucide:sun" class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>

    <div class="flex-grow">
      <slot />
    </div>
  </div>
</template>
