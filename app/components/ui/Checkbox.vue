<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    id?: string;
    class?: HTMLAttributes['class'];
    checked?: boolean;
  }>(),
  {
    modelValue: false,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const localChecked = computed({
  get: () => props.checked ?? props.modelValue,
  set: (val) => emit('update:modelValue', val),
});
</script>

<template>
  <CheckboxRoot
    :id="id"
    v-model:checked="localChecked"
    :class="cn(
      'peer size-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
      props.class
    )"
  >
    <CheckboxIndicator class="flex items-center justify-center text-current">
      <Icon name="lucide:check" class="size-3.5" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
