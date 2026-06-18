<script setup lang="ts">
import { TooltipRoot } from 'reka-ui';

defineProps<{
  delayDuration?: number;
}>();
</script>

<template>
  <TooltipRoot :delay-duration="delayDuration ?? 200">
    <slot />
  </TooltipRoot>
</template>
