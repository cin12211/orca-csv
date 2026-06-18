<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogRoot,
  DialogTrigger,
} from 'reka-ui';

const props = defineProps<{
  open?: boolean;
  class?: HTMLAttributes['class'];
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const isOpen = computed({
  get: () => props.open ?? false,
  set: (val) => emit('update:open', val),
});
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <slot />
  </DialogRoot>
</template>
