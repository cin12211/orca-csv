<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

defineProps<{
  class?: HTMLAttributes['class'];
  type?: string;
  placeholder?: string;
  id?: string;
  modelValue?: string;
  autocomplete?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'keyup': [event: KeyboardEvent];
}>();
</script>

<template>
  <input
    :type="type ?? 'text'"
    :placeholder="placeholder"
    :id="id"
    :autocomplete="autocomplete"
    :value="modelValue"
    :class="cn(
      'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      $props.class
    )"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    @keyup="emit('keyup', $event)"
  />
</template>
