<script setup lang="ts">
import {
  ContextMenuShortcut,
  Icon,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components';
import ColumnSelector from '~/components/modules/selectors/ColumnSelector.vue';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  CsvFilterOperator,
  CsvFilterCompose,
  CSV_FILTER_OPERATOR_LABELS,
  CSV_FILTER_OPERATORS_NO_VALUE,
} from '../constants/csv-filter.constants';
import type { CsvFilterRow } from '../types/csv-filter.types';

const props = defineProps<{
  columns: string[];
  initFilters: CsvFilterRow[];
  composeWith: CsvFilterCompose;
}>();

const emit = defineEmits<{
  (e: 'onSearch'): void;
  (e: 'onUpdateFilters', filters: CsvFilterRow[]): void;
  (e: 'onChangeComposeWith', compose: CsvFilterCompose): void;
}>();

const isVisible = defineModel<boolean>('isVisible', { default: false });

const filterContainerRef = ref<HTMLElement>();

interface FilterInputRef {
  $el?: Element | null;
  el?: HTMLInputElement | null;
  focus?: () => void;
}
const filterInputRefs = useTemplateRef<FilterInputRef>('filterInputRefs');

// Controlled: read from prop
const fields = computed(() => props.initFilters ?? []);

const getNextFilters = () => fields.value.map(f => ({ ...f }));

const emitFilters = (nextFilters: CsvFilterRow[]) => {
  emit('onUpdateFilters', nextFilters);
};

// ── Helpers ────────────────────────────────────────────────────────────────

const getPlaceholder = (operator: CsvFilterOperator) => {
  if (CSV_FILTER_OPERATORS_NO_VALUE.includes(operator)) return '';
  switch (operator) {
    case CsvFilterOperator.CONTAINS:
    case CsvFilterOperator.NOT_CONTAINS:
      return 'Search text...';
    case CsvFilterOperator.STARTS_WITH:
      return 'Starts with...';
    case CsvFilterOperator.ENDS_WITH:
      return 'Ends with...';
    default:
      return 'Value...';
  }
};

const needsValue = (operator: CsvFilterOperator) =>
  !CSV_FILTER_OPERATORS_NO_VALUE.includes(operator);

// ── Focus helpers (mirrors QuickQueryFilter) ───────────────────────────────

const getSearchInputElement = (index: number): HTMLInputElement | null => {
  const refs = filterInputRefs.value as unknown as FilterInputRef[];
  const inputRef = refs?.[index];
  if (!inputRef) return null;
  if (inputRef.el instanceof HTMLInputElement) return inputRef.el;
  if (inputRef.$el instanceof HTMLInputElement) return inputRef.$el;
  if (inputRef.$el instanceof HTMLElement) {
    const nested = inputRef.$el.querySelector('input');
    if (nested instanceof HTMLInputElement) return nested;
  }
  return null;
};

const runInNextFrame = (cb: () => void) => {
  if (
    typeof window !== 'undefined' &&
    typeof window.requestAnimationFrame === 'function'
  ) {
    window.requestAnimationFrame(cb);
    return;
  }
  cb();
};

const tryFocusSearchByIndex = (index: number, remaining = 2) => {
  const el = getSearchInputElement(index);
  if (!el) {
    if (remaining > 0)
      runInNextFrame(() => tryFocusSearchByIndex(index, remaining - 1));
    return;
  }
  el.focus();
  if (
    typeof document !== 'undefined' &&
    document.activeElement !== el &&
    remaining > 0
  ) {
    runInNextFrame(() => tryFocusSearchByIndex(index, remaining - 1));
  }
};

const focusSearchByIndex = async (index: number) => {
  if (index < 0) return;
  await nextTick();
  runInNextFrame(() => tryFocusSearchByIndex(index));
};

const getCurrentFocusInput = (): number | undefined => {
  const refs = filterInputRefs.value as unknown as FilterInputRef[];
  if (!refs) return;
  return refs.findIndex(
    (_, i) => getSearchInputElement(i) === document.activeElement
  );
};

// ── CRUD ───────────────────────────────────────────────────────────────────

const insertFilter = (index: number) => {
  const next = getNextFilters();
  next.splice(index, 0, {
    column: props.columns[0] || '',
    operator: CsvFilterOperator.CONTAINS,
    value: '',
    isActive: false,
  });
  emitFilters(next);
};

const onAddFilter = (index: number) => {
  insertFilter(index + 1);
};

const updateFilter = (index: number, patch: Partial<CsvFilterRow>) => {
  const next = getNextFilters();
  if (!next[index]) return;
  next[index] = { ...next[index], ...patch };
  emitFilters(next);
};

const onRemoveFilter = async (index: number) => {
  const row = fields.value[index];
  const wasActive = !!row?.isActive;
  const next = getNextFilters();
  next.splice(index, 1);
  emitFilters(next);
  await nextTick();
  if (index !== 0) await focusSearchByIndex(index - 1);
  // re-apply if the removed filter was active
  if (wasActive) emit('onSearch');
};

// ── Apply ──────────────────────────────────────────────────────────────────

const onApplyFilter = (index: number) => {
  const row = fields.value[index];
  if (!row?.isActive) {
    updateFilter(index, { isActive: true });
  }
  emit('onSearch');
};

const onApplyAllFilters = () => {
  emitFilters(fields.value.map(f => ({ ...f, isActive: true })));
  emit('onSearch');
};

const onClearFilters = () => {
  emitFilters([]);
  emit('onSearch');
};

// Checkbox toggle → immediate apply (mirrors QuickQuery)
const updateFilterSelection = async (index: number, isSelected: boolean) => {
  updateFilter(index, { isActive: isSelected });
  await emit('onSearch');
};

const updateSearchValue = (index: number, value: string) => {
  updateFilter(index, { value });
};

// ── Show ───────────────────────────────────────────────────────────────────

const onShowSearch = async () => {
  const shouldAddFirst = !fields.value.length;
  if (shouldAddFirst) insertFilter(0);
  isVisible.value = true;
  // Wait for parent to propagate the new initFilters prop back
  await nextTick();
  const lastIndex = shouldAddFirst ? 0 : fields.value.length - 1;
  await focusSearchByIndex(lastIndex);
};

// ── Hotkeys (mirrors QuickQueryFilter) ────────────────────────────────────

useHotkeys(
  [
    {
      key: 'meta+i',
      callback: async () => {
        const idx = getCurrentFocusInput();
        if (idx === undefined || idx < 0) return;
        onAddFilter(idx);
        await focusSearchByIndex(idx + 1);
      },
    },
    {
      key: 'meta+backspace',
      callback: async () => {
        const idx = getCurrentFocusInput();
        if (idx === undefined || idx < 0) return;
        await onRemoveFilter(idx);
      },
    },
    {
      key: 'meta+enter',
      callback: () => {
        const idx = getCurrentFocusInput();
        if (idx === undefined) return;
        if (idx >= 0) onApplyAllFilters();
      },
    },
    {
      key: 'escape',
      callback: () => {
        isVisible.value = false;
        emit('onSearch');
      },
    },
  ],
  { target: filterContainerRef }
);

defineExpose({ onShowSearch, insertFilter });
</script>

<template>
  <div
    v-if="isVisible"
    ref="filterContainerRef"
    :class="['h-fit space-y-1', fields.length && 'pb-2']"
  >
    <div
      class="flex gap-1 items-center"
      v-for="(filter, index) in fields"
      :key="index"
    >
      <!-- Checkbox: immediate apply on toggle -->
      <Checkbox
        :model-value="filter.isActive"
        @click.stop
        @keydown.enter.stop.prevent
        @keyup.enter.stop
        @update:model-value="updateFilterSelection(index, !!$event)"
      />

      <!-- Column selector -->
      <ColumnSelector
        :columns="columns"
        :value="filter.column"
        :show-extended-fields="false"
        @update:value="val => updateFilter(index, { column: String(val) })"
        @update:open="
          isOpen => {
            if (!isOpen) focusSearchByIndex(index);
          }
        "
      />

      <!-- Operator selector -->
      <Select
        size="xxs"
        :model-value="filter.operator"
        @update:model-value="
          val => updateFilter(index, { operator: val as CsvFilterOperator })
        "
        @update:open="
          isOpen => {
            if (!isOpen) focusSearchByIndex(index);
          }
        "
      >
        <SelectTrigger class="w-36 min-w-36 cursor-pointer">
          <SelectValue placeholder="Select operator" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem
              v-for="(label, op) in CSV_FILTER_OPERATOR_LABELS"
              :key="op"
              class="cursor-pointer"
              :value="op"
            >
              {{ label }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <!-- Search input -->
      <Input
        v-if="needsValue(filter.operator)"
        :model-value="filter.value ?? ''"
        type="text"
        :placeholder="getPlaceholder(filter.operator)"
        class="w-full h-6 px-2"
        ref="filterInputRefs"
        @keyup.enter.stop="() => emit('onSearch')"
        @update:model-value="updateSearchValue(index, String($event))"
      />
      <div v-else class="flex-1" />

      <Tooltip>
        <TooltipTrigger as-child>
          <Button size="xxs" variant="outline" @click="onApplyFilter(index)">
            Apply
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Apply this filter</p></TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            size="iconSm"
            variant="outline"
            @click="onRemoveFilter(index)"
          >
            <Icon name="hugeicons:minus-sign" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Remove filter (⌘⌫)</p></TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            size="iconSm"
            variant="outline"
            @click="() => onAddFilter(index)"
          >
            <Icon name="hugeicons:plus-sign" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Add new filter (⌘I)</p></TooltipContent>
      </Tooltip>
    </div>

    <!-- Guide footer: compose selector + shortcuts -->
    <div v-if="fields.length" class="flex justify-between">
      <div class="flex items-center gap-0.5 text-xs">
        Compose with:
        <Select
          size="xxs"
          :model-value="composeWith"
          @update:model-value="
            emit('onChangeComposeWith', $event as CsvFilterCompose)
          "
        >
          <SelectTrigger
            class="text-xs cursor-pointer px-1 border-none gap-1 shadow-none"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="CsvFilterCompose.AND">AND</SelectItem>
            <SelectItem :value="CsvFilterCompose.OR">OR</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="text-xs flex items-center gap-2">
        <div><ContextMenuShortcut>⌘F</ContextMenuShortcut>: Show</div>
        <div><ContextMenuShortcut>Esc</ContextMenuShortcut>: Exit</div>
        <Separator orientation="vertical" class="h-3/4!" />
        <div><ContextMenuShortcut>⌘I</ContextMenuShortcut>: Insert</div>
        <div><ContextMenuShortcut>⌘⌫</ContextMenuShortcut>: Delete</div>
        <div><ContextMenuShortcut>⌘↵</ContextMenuShortcut>: Apply all</div>
      </div>
      <div>
        <Button size="xxs" variant="outline" @click="onClearFilters">
          Clear All
        </Button>
      </div>
    </div>
  </div>
</template>
