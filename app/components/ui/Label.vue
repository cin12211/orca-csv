<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { Label as RekaLabel } from 'reka-ui';
import { cn } from '@/lib/utils';

defineProps<{
  for?: string;
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <RekaLabel
    :for="for"
    :class="cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', $props.class)"
  >
    <slot />
  </RekaLabel>
</template>
