<script setup lang="ts">
import { cn } from '@/lib/utils';
import { isPWA } from '~/core/helpers';

const config = useRuntimeConfig();
const githubLink = config.public.githubLink;
</script>

<template>
  <div class="h-full overflow-y-auto flex flex-col">
    <div
      class="flex items-center justify-between border-b border-border py-2 px-2"
    >
      <div class="flex items-center space-x-2">
        <Avatar class="rounded-2xl">
          <AvatarImage src="/logo.png" alt="OrcaQ" />
        </Avatar>

        <p class="text-2xl font-medium">orcaq</p>
      </div>

      <div>
        <Button variant="outline" size="sm" as-child>
          <a :href="githubLink" target="_blank">
            <Icon name="hugeicons:github" class="w-5 h-5" /> Star us on GitHub
          </a>
        </Button>
      </div>
    </div>

    <slot />
  </div>
</template>
