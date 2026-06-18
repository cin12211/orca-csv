<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Button,
  ContextMenuShortcut,
  Icon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components';
import { Checkbox } from '~/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Label } from '~/components/ui/label';

const DELIMITER_OPTIONS = [
  { label: 'Comma (,)', value: ',' },
  { label: 'Semicolon (;)', value: ';' },
  { label: 'Tab (\\t)', value: '\t' },
  { label: 'Pipe (|)', value: '|' },
] as const;

const props = defineProps<{
  fileName?: string;
  fileSize?: number;
  lastModified?: number;
  hasChanges: boolean;
  isSaving: boolean;
  hasSelection: boolean;
  isReadOnly: boolean;
  pendingChangesCount: number;
  selectedRowsCount: number;
  rowCount: number;
  columnCount: number;
  hasHeaders: boolean;
  delimiter: string;
}>();

const reloadRotation = ref(0);

const emit = defineEmits<{
  (e: 'save'): void;
  (e: 'discard'): void;
  (e: 'addRow'): void;
  (e: 'deleteRows'): void;
  (e: 'reload'): void;
  (e: 'onShowFilter'): void;
  (e: 'update:hasHeaders', value: boolean): void;
  (e: 'update:delimiter', value: string): void;
}>();

function handleReload() {
  reloadRotation.value += 360;
  emit('reload');
}

useHotkeys(
  [
    {
      key: 'meta+r',
      callback: () => {
        handleReload();
      },
    },
  ],
  {
    isPreventDefault: true,
  }
);

const localHasHeaders = computed({
  get: () => props.hasHeaders,
  set: val => emit('update:hasHeaders', val),
});

const localDelimiter = computed({
  get: () => props.delimiter,
  set: val => emit('update:delimiter', val),
});

const currentDelimiterLabel = computed(
  () =>
    DELIMITER_OPTIONS.find(o => o.value === props.delimiter)?.label ??
    props.delimiter
);

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
</script>

<template>
  <div class="w-full select-none h-9 flex items-center justify-between">
    <!-- Left: action buttons -->
    <div class="flex items-center gap-1" v-auto-animate>
      <!-- Filter -->
      <Tooltip>
        <TooltipTrigger as-child>
          <Button variant="outline" size="xxs" @click="emit('onShowFilter')">
            <Icon name="lucide:filter" />
            <ContextMenuShortcut>⌘F</ContextMenuShortcut>
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Filter data</p></TooltipContent>
      </Tooltip>

      <!-- Reload -->
      <Tooltip>
        <TooltipTrigger as-child>
          <Button variant="outline" size="xxs" @click="handleReload">
            <Icon
              name="hugeicons:refresh"
              :style="{ transform: `rotate(${reloadRotation}deg)` }"
              class="icon-transition"
            />
            <ContextMenuShortcut>⌘R</ContextMenuShortcut>
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Reload file</p></TooltipContent>
      </Tooltip>

      <!-- Add Row -->
      <Tooltip v-if="!isReadOnly">
        <TooltipTrigger as-child>
          <Button
            variant="outline"
            size="xxs"
            class="font-normal"
            @click="emit('addRow')"
          >
            <Icon name="hugeicons:plus-sign" />
            Row
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Add new row</p></TooltipContent>
      </Tooltip>

      <!-- Save -->
      <Tooltip v-if="!isReadOnly && hasChanges">
        <TooltipTrigger as-child>
          <Button
            variant="outline"
            size="xxs"
            class="relative overflow-visible"
            :disabled="isSaving"
            @click="emit('save')"
          >
            <Icon
              v-if="isSaving"
              name="hugeicons:loading-03"
              class="animate-spin"
            />
            <Icon v-else name="lucide:save" />
            <span
              v-if="pendingChangesCount"
              class="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-green-700 px-1 text-xxs font-medium leading-4 text-white"
            >
              {{ pendingChangesCount }}
            </span>
            <ContextMenuShortcut>⌘S</ContextMenuShortcut>
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Save changes</p></TooltipContent>
      </Tooltip>

      <!-- Discard -->
      <Tooltip v-if="hasChanges">
        <TooltipTrigger as-child>
          <Button
            variant="outline"
            size="xxs"
            class="font-normal"
            :disabled="isSaving"
            @click="emit('discard')"
          >
            <Icon name="hugeicons:undo-02" />
            Discard
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Discard changes</p></TooltipContent>
      </Tooltip>

      <!-- Delete selected -->
      <Tooltip v-if="hasSelection">
        <TooltipTrigger as-child>
          <Button variant="outline" size="xxs" @click="emit('deleteRows')">
            <Icon name="lucide:trash" />
            <ContextMenuShortcut>⌥⌘⌫</ContextMenuShortcut>
          </Button>
        </TooltipTrigger>
        <TooltipContent
          ><p>Delete {{ selectedRowsCount }} selected rows</p></TooltipContent
        >
      </Tooltip>

      <p v-if="selectedRowsCount" class="font-normal text-xs text-primary/60">
        Selected
      </p>
      <p v-if="selectedRowsCount" class="font-normal text-sm text-primary">
        {{ selectedRowsCount }}
      </p>
    </div>

    <!-- Center: file meta -->
    <div
      v-if="fileName"
      class="flex items-center gap-3 text-xs text-muted-foreground"
    >
      <span
        class="font-medium text-foreground max-w-[160px] truncate"
        :title="fileName"
      >
        {{ fileName }}
      </span>
      <span v-if="fileSize" class="text-[10px]">{{
        formatBytes(fileSize)
      }}</span>
      <span class="text-[10px] font-mono text-foreground/70">
        {{ rowCount }} × {{ columnCount }}
      </span>
    </div>

    <!-- Right: options -->
    <div class="flex items-center gap-1">
      <!-- Has-headers toggle -->
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="xxs"
            class="gap-1.5 font-normal"
            @click="localHasHeaders = !localHasHeaders"
          >
            <Checkbox
              id="has-headers-cb"
              :checked="localHasHeaders"
              class="pointer-events-none size-3!"
            />
            <Label
              for="has-headers-cb"
              class="text-xs font-normal cursor-pointer select-none pointer-events-none"
            >
              Headers
            </Label>
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Toggle first-row headers</p></TooltipContent>
      </Tooltip>

      <!-- Delimiter picker -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="xxs" class="font-normal gap-1">
            <Icon name="hugeicons:arrow-up-down" class="size-3.5!" />
            <span class="text-xs max-w-[64px] truncate">{{
              currentDelimiterLabel
            }}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="min-w-40">
          <p class="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Delimiter
          </p>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup v-model="localDelimiter">
            <DropdownMenuRadioItem
              v-for="opt in DELIMITER_OPTIONS"
              :key="opt.value"
              :value="opt.value"
              class="h-7 cursor-pointer"
            >
              {{ opt.label }}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>

<style scoped>
.icon-transition {
  transition: transform 0.4s ease-in;
}
</style>
