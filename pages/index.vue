<script setup lang="ts">
import { ref } from 'vue';
import {
  useFileDialog,
  useDropZone,
  type MaybeComputedElementRef,
} from '@vueuse/core';
import { toast } from 'vue-sonner';
import { CsvDropOverlay } from '~/components/modules/csv-editor/components';
import { createCsvFileHandlesFromFiles } from '~/components/modules/csv-editor/utils';
import { useTabManagement } from '~/core/composables/useTabManagement';

definePageMeta({
  layout: 'home',
});

const config = useRuntimeConfig();
const githubLink = config.public.githubLink;

const { openCsvEditorTab } = useTabManagement();

const dropZoneRef = useTemplateRef('dropZoneRef');

const openFiles = async (files: File[] | null) => {
  if (!files || files.length === 0) return;

  try {
    const handles = await createCsvFileHandlesFromFiles(files);
    if (handles.length === 0) {
      toast.error(
        'No valid CSV files found. Only .csv files under 200MB are supported.'
      );
      return;
    }

    for (const handle of handles) {
      const content = handle._file ? await handle._file.text() : '';
      await openCsvEditorTab({
        fileHandle: handle,
        cachedContent: content,
      });
    }

    if (handles.length === 1) {
      toast.success(`Opened CSV file: ${handles[0].name}`);
    } else {
      toast.success(`Opened ${handles.length} CSV files`);
    }
  } catch (err) {
    console.error('Failed to open CSV files:', err);
    toast.error(
      err instanceof Error ? err.message : 'Failed to open CSV files'
    );
  }
};

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: openFiles,
  dataTypes: ['text/csv'],
  multiple: true,
});

const { open: openFileDialog, onChange: onFileChange } = useFileDialog({
  accept: '.csv',
  multiple: true,
});

onFileChange(async files => {
  if (!files) return;
  await openFiles(Array.from(files));
});

const activeFaq = ref<number | null>(null);
const toggleFaq = (index: number) => {
  activeFaq.value = activeFaq.value === index ? null : index;
};

const featuresList = [
  {
    title: 'High-Performance Grid',
    desc: 'Powered by AG Grid. Sort columns, pin headers, group cells, and view thousands of rows instantaneously.',
    icon: 'hugeicons:grid-table',
  },
  {
    title: '100% Local & Private',
    desc: 'Your files are never uploaded to any servers. All file loading and processing happens locally on your computer.',
    icon: 'hugeicons:information-circle',
  },
  {
    title: 'Advanced Filter Builder',
    desc: 'Create complex, multi-column search rules visually. Target specifically the data rows you need to see.',
    icon: 'hugeicons:settings-01',
  },
  {
    title: 'Inline Cell Editing',
    desc: 'Double-click any cell to edit details inline. Insert new rows, delete rows, and keep data clean.',
    icon: 'hugeicons:copy-01',
  },
  {
    title: 'Concurrent Tabs',
    desc: 'Load and switch between multiple CSV tables instantly. No context switching or loss of work in progress.',
    icon: 'hugeicons:folder-open',
  },
  {
    title: 'Sleek Aesthetic Support',
    desc: 'Enjoy a beautiful dark and light mode UI designed for maximum readability and visual elegance.',
    icon: 'hugeicons:home-06',
  },
];

const faqsList = [
  {
    q: 'Is my CSV data secure?',
    a: 'Absolutely. OrcaQ CSV Viewer is fully local-first. All parsing, processing, and rendering take place client-side in your web browser. No files, records, or credentials ever touch our servers.',
  },
  {
    q: 'What is the maximum file size supported?',
    a: 'We support files up to 200MB. Because the processing occurs in your web browser, performance and memory limits depend on your computer, but 200MB files run extremely fast.',
  },
  {
    q: 'Can I edit and export my data?',
    a: 'Yes! Double-click any cell to edit it. You can insert or delete rows directly from the table control bar, and then export the finalized data back to a standard CSV file.',
  },
  {
    q: 'How does Visual Filtering work?',
    a: 'Click the Filter button in the table toolbar. You can visually chain multiple rule groups using standard operations like equals, contains, starts with, or numeric comparisons across columns.',
  },
];
</script>

<template>
  <div
    ref="dropZoneRef"
    class="relative w-full min-h-full flex flex-col bg-background select-none overflow-x-hidden"
  >
    <!-- Ambient Background Gradients -->
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent_40%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_40%)]"
    />
    <div
      class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.01),transparent_20%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_20%)]"
    />

    <!-- Hero Section -->
    <section
      class="relative flex flex-col items-center justify-center text-center px-4 py-20 md:py-32 max-w-4xl mx-auto z-10"
    >
      <!-- Hero Logo (AppMark styled) -->
      <div class="mx-auto mb-8 flex justify-center">
        <div class="relative h-20 w-20 overflow-hidden rounded-2xl border border-black/14 bg-secondary/80 dark:border-white/10 dark:bg-white/5 shadow-xl flex items-center justify-center">
          <img src="/logo.png" alt="OrcaQ CSV Viewer Logo" class="h-full w-full object-cover" />
        </div>
      </div>

      <h1
        class="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6"
      >
        OrcaQ CSV
        <span
          class="bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent"
        >
          Viewer
        </span>
      </h1>

      <p
        class="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-8"
      >
        The high-performance, local-first CSV editor. Parse, filter, search, and
        edit massive datasets securely inside your browser. No server uploads
        required.
      </p>

      <div class="flex flex-col items-center gap-3">
        <Button
          variant="default"
          size="lg"
          class="h-12 px-8 rounded-full text-base font-medium shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          @click="openFileDialog()"
        >
          <Icon name="hugeicons:folder-open" class="size-5 mr-2" />
          Open CSV File
        </Button>
        <div
          class="text-muted-foreground text-sm flex items-center justify-center gap-1.5 mt-2"
        >
          <Icon
            name="hugeicons:information-circle"
            class="size-4 text-muted-foreground"
          />
          Supports .csv files up to 200MB
        </div>
        <div class="text-muted-foreground/60 text-xs mt-1">
          or drag & drop your files anywhere on this page
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section
      class="relative py-20 bg-secondary/20 border-t border-b border-border/30 z-10"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div class="text-center max-w-2xl mx-auto mb-16">
          <Badge
            variant="secondary"
            class="mb-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-secondary/80 text-foreground border border-border/50"
          >
            Features
          </Badge>
          <h2 class="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            A fast and fully featured CSV workshop
          </h2>
          <p class="text-muted-foreground">
            OrcaQ CSV brings database-grade control panel views directly to your
            static CSV documents.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            v-for="feat in featuresList"
            :key="feat.title"
            class="flex flex-col p-6 rounded-2xl border border-border/50 bg-card hover:shadow-lg hover:border-border transition-all"
          >
            <div
              class="size-12 rounded-xl bg-secondary flex items-center justify-center mb-5 border border-border/40"
            >
              <Icon :name="feat.icon" class="size-6 text-foreground" />
            </div>
            <h3 class="text-lg font-semibold mb-2 text-foreground">
              {{ feat.title }}
            </h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              {{ feat.desc }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="relative py-20 max-w-4xl mx-auto px-4 sm:px-6 z-10 w-full">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-semibold tracking-tight mb-2 text-foreground">
          Frequently Asked Questions
        </h2>
        <p class="text-muted-foreground text-sm">
          Have queries about OrcaQ CSV? Here are the answers.
        </p>
      </div>

      <div class="space-y-4 border-t border-border/50 pt-4">
        <div
          v-for="(faq, index) in faqsList"
          :key="faq.q"
          class="border-b border-border/40 pb-4"
        >
          <button
            type="button"
            @click="toggleFaq(index)"
            class="flex w-full items-center justify-between gap-4 py-3 text-left font-medium text-foreground hover:text-primary transition cursor-pointer"
          >
            <span>{{ faq.q }}</span>
            <Icon
              name="lucide:chevron-down"
              :class="[
                'size-4 text-muted-foreground transition-transform duration-300',
                activeFaq === index ? 'rotate-180' : '',
              ]"
            />
          </button>
          <div
            v-show="activeFaq === index"
            class="mt-2 text-sm text-muted-foreground leading-relaxed pl-1"
          >
            {{ faq.a }}
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer
      class="relative py-12 mt-auto border-t border-border/40 bg-secondary/10 z-10"
    >
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left"
      >
        <div class="flex items-center space-x-2">
          <Avatar class="rounded-xl size-6 border border-border/50 shadow-sm">
            <AvatarImage src="/logo.png" alt="OrcaQ Logo" />
          </Avatar>
          <span class="text-sm font-semibold tracking-tight text-foreground">
            orcaq csv
          </span>
        </div>
        <div class="text-xs text-muted-foreground">
          © 2026 OrcaQ. All rights reserved. Privacy-first, local workflow.
        </div>
        <div class="flex items-center gap-4 text-xs text-muted-foreground">
          <a
            :href="githubLink"
            target="_blank"
            class="hover:text-foreground transition flex items-center gap-1"
          >
            <Icon name="hugeicons:github" class="size-4" />
            GitHub
          </a>
        </div>
      </div>
    </footer>

    <!-- Drop overlay -->
    <CsvDropOverlay v-if="isOverDropZone" />
  </div>
</template>

