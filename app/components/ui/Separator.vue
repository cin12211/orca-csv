<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
import { Separator as RekaSeparator } from 'reka-ui';

defineProps<{
  class?: HTMLAttributes['class'];
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
  label?: string;
}>();
</script>

<template>
  <RekaSeparator
    data-slot="separator"
    :class="cn('shrink-0 bg-border', orientation === 'vertical' ? 'h-full w-[1px]' : 'h-[1px] w-full', $props.class)"
  />
</template>
