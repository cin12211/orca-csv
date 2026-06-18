<script setup lang="ts">
import { ContextMenuRoot } from 'reka-ui';

defineEmits<{
  'update:open': [value: boolean];
}>();
</script>

<template>
  <ContextMenuRoot @update:open="$emit('update:open', $event)">
    <slot />
  </ContextMenuRoot>
</template>
