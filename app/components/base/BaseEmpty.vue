<script setup lang="ts">
import { Icon } from '#components';

withDefaults(
  defineProps<{
    title?: string;
    desc?: string;
    icon?: string;
    hiddenIcon?: boolean;
  }>(),
  {
    icon: 'lucide:file-search',
    hiddenIcon: false,
  }
);
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full w-full gap-2">
    <Icon v-if="!hiddenIcon" class="size-28 text-muted-foreground/40" :name="icon" />
    <h3 v-if="title" class="text-lg font-medium text-foreground">{{ title }}</h3>
    <p v-if="desc" class="text-sm text-muted-foreground max-w-md text-center">
      {{ desc }}
    </p>
    <div v-if="$slots.default" class="mt-2">
      <slot />
    </div>
  </div>
</template>
