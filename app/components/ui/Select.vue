<script setup lang="ts">
import { SelectRoot } from 'reka-ui';

defineProps<{
  modelValue?: string;
  size?: 'default' | 'xxs';
  class?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:open': [value: boolean];
}>();
</script>

<template>
  <SelectRoot
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    @update:open="emit('update:open', $event)"
  >
    <slot />
  </SelectRoot>
</template>
