<script setup lang="ts">
import { cn } from '@/lib/utils';

defineProps<{
  class?: string;
}>();
</script>

<template>
  <span :class="cn('ml-auto text-muted-foreground text-xs tracking-widest', $props.class)">
    <slot />
  </span>
</template>
