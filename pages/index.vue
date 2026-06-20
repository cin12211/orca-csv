<script setup lang="ts">
import { useFileDialog, useDropZone } from '@vueuse/core';
import { ref } from 'vue';
import { toast } from 'vue-sonner';
import CsvDropOverlay from '~/components/modules/csv-editor/components/CsvDropOverlay.vue';
import { createCsvFileHandlesFromDrop } from '~/components/modules/csv-editor/utils/dragDrop';
import { createCsvFileHandlesFromFiles } from '~/components/modules/csv-editor/utils/createCsvFileHandleFromFiles';
import {
  openCsvFiles as openNativeCsvFiles,
  readCsvFile,
} from '~/core/composables/useCsvFileSystemAccess';
import { useTabManagement } from '~/core/composables/useTabManagement';
import type { CsvFileHandle } from '~/core/services/csv';
import { isFileSystemAPISupported } from '~/core/services/csv';

definePageMeta({
  layout: 'home',
});

const config = useRuntimeConfig();
const githubLink = config.public.githubLink;

const { openCsvEditorTab } = useTabManagement();

const dropZoneRef = useTemplateRef('dropZoneRef');

const openCsvHandles = async (handles: CsvFileHandle[]) => {
  if (handles.length === 0) return;

  for (const handle of handles) {
    const content = await readCsvFile(handle);
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
};

const openFiles = async (files: File[] | null) => {
  if (!files || files.length === 0) return;

  const handles = await createCsvFileHandlesFromFiles(files);
  if (handles.length === 0) {
    toast.error(
      'No valid CSV files found. Only .csv files under 200MB are supported.'
    );
    return;
  }

  await openCsvHandles(handles);
};

const openFilesWithPicker = async () => {
  const handles = await openNativeCsvFiles();
  await openCsvHandles(handles);
};

const handleOpenCsv = async () => {
  try {
    if (isFileSystemAPISupported()) {
      await openFilesWithPicker();
      return;
    }

    openFileDialog();
  } catch (err) {
    console.error('Failed to open CSV files:', err);
    toast.error(
      err instanceof Error ? err.message : 'Failed to open CSV files'
    );
  }
};

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: async (files, event) => {
    try {
      if (event.dataTransfer) {
        const handles = await createCsvFileHandlesFromDrop(event.dataTransfer);
        if (handles.length > 0) {
          await openCsvHandles(handles);
          return;
        }
      }

      await openFiles(files);
    } catch (err) {
      console.error('Failed to open CSV files:', err);
      toast.error(
        err instanceof Error ? err.message : 'Failed to open CSV files'
      );
    }
  },
  dataTypes: ['text/csv'],
  multiple: true,
});

const { open: openFileDialog, onChange: onFileChange } = useFileDialog({
  accept: '.csv,text/csv',
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
    title: 'Open and view instantly',
    desc: 'Drop one or many CSV files and move straight into a fast table view with pinned headers and large-row handling.',
    icon: 'hugeicons:file-upload',
  },
  {
    title: 'Edit like a grid',
    desc: 'Double-click cells, add rows, remove records, and keep the file clean without leaving the browser.',
    icon: 'hugeicons:edit-02',
  },
  {
    title: 'Filter without formulas',
    desc: 'Build visual filters across columns, scan results quickly, and keep the dataset readable.',
    icon: 'hugeicons:filter',
  },
  {
    title: 'Private by default',
    desc: 'CSV parsing and editing run locally. Your data does not need to be uploaded to view it.',
    icon: 'hugeicons:lock',
  },
];

const faqsList = [
  {
    q: 'Can I use this page as the app home?',
    a: 'Yes. The landing page is also the starting point: upload a CSV or drop files anywhere on the page to open the editor.',
  },
  {
    q: 'Does OrcaQ upload my CSV files?',
    a: 'No. Files are read locally in your browser so you can view and edit without sending data to a server.',
  },
  {
    q: 'Can I open multiple files?',
    a: 'Yes. Select or drop multiple CSV files and OrcaQ opens each file in its own tab.',
  },
];
</script>

<template>
  <main
    ref="dropZoneRef"
    class="orca-landing relative min-h-full w-full overflow-x-hidden bg-[var(--landing-background)] text-[var(--landing-foreground)] selection:bg-[var(--landing-selection)]"
  >
    <section class="relative px-5 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10">
      <div class="mx-auto max-w-[1280px] text-center">
        <div class="mx-auto mb-8 flex justify-center">
          <div
            class="landing-logo-frame flex h-20 w-20 items-center justify-center overflow-hidden rounded-[22px] border"
          >
            <img
              src="/logo.png"
              alt="Orca CSV logo"
              class="h-full w-full object-cover"
            />
          </div>
        </div>

        <p
          class="mx-auto mb-5 w-fit rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--landing-muted)]"
        >
          Local-first CSV viewer and editor
        </p>

        <h1
          class="mx-auto max-w-[980px] text-[44px] font-semibold leading-[0.96] tracking-normal text-[var(--landing-foreground)] sm:text-[72px] lg:text-[104px]"
        >
          Orca CSV
        </h1>

        <p
          class="mx-auto mt-7 max-w-[680px] text-base leading-8 text-[var(--landing-copy)] sm:text-lg"
        >
          Upload a CSV, or drop it anywhere on this page to view, filter, and
          edit large datasets in a focused local workspace.
        </p>

        <div class="flex items-center justify-center mt-8">
          <div class="border w-1/2 border-dashed py-12 rounded-2xl">
            <ClientOnly fallback-tag="div">
              <div
                class="flex flex-col items-center justify-center gap-3 sm:flex-row"
              >
                <Button
                  size="lg"
                  class="h-12 rounded-full bg-[var(--landing-button-primary)] px-6 text-[13px] font-medium text-[var(--landing-button-primary-foreground)] shadow-none hover:scale-[1.02] hover:bg-[var(--landing-button-primary)] hover:opacity-90"
                  @click="handleOpenCsv"
                >
                  <Icon name="hugeicons:file-upload" class="size-5" />
                  Upload CSV
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  class="h-12 rounded-full border-[var(--landing-button-secondary-border)] bg-[var(--landing-button-secondary)] px-6 text-[13px] font-medium text-[var(--landing-button-secondary-foreground)] shadow-none hover:scale-[1.02] hover:bg-[var(--landing-surface-soft)]"
                  @click="handleOpenCsv"
                >
                  <Icon name="hugeicons:folder-open" class="size-5" />
                  Drop your files here!
                </Button>
              </div>
              <template #fallback>
                <div
                  aria-hidden="true"
                  class="flex flex-col items-center justify-center gap-3 sm:flex-row"
                >
                  <div
                    class="h-12 w-40 rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface-soft)] animate-pulse"
                  />
                  <div
                    class="h-12 w-40 rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface-soft)] animate-pulse"
                  />
                </div>
              </template>
            </ClientOnly>

            <div
              class="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[var(--landing-faint)]"
            >
              <span class="inline-flex items-center gap-1.5">
                <Icon name="hugeicons:information-circle" class="size-4" />
                Drop CSV to view
              </span>
              <span
                class="hidden h-1 w-1 rounded-full bg-current opacity-40 sm:block"
              />
              <span>Supports multiple .csv files up to 200MB</span>
            </div>
          </div>
        </div>
      </div>

      <div class="relative mx-auto mt-11 max-w-[1280px] sm:mt-14">
        <img
          src="/demo.png"
          alt="Orca CSV editor showing multiple CSV tabs and customer data in a grid"
          class="block aspect-[3360/1878] border shadow w-full rounded-md object-cover object-top"
          loading="eager"
          decoding="async"
        />
      </div>
    </section>

    <section class="px-5 py-16 sm:px-6">
      <div class="mx-auto max-w-[1120px]">
        <div class="mx-auto mb-10 max-w-[620px] text-center">
          <p
            class="text-xs font-semibold uppercase text-[var(--landing-faint)]"
          >
            CSV workflow
          </p>
          <h2
            class="mt-3 text-3xl font-semibold tracking-normal text-[var(--landing-foreground)] sm:text-4xl"
          >
            Landing page first, usable app home always.
          </h2>
        </div>

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <article
            v-for="feature in featuresList"
            :key="feature.title"
            class="landing-feature-card rounded-2xl border bg-[var(--landing-surface)] p-6"
          >
            <div
              class="mb-5 flex size-11 items-center justify-center rounded-xl border border-[var(--landing-icon-border)] bg-[var(--landing-icon-bg)] text-[var(--landing-icon-fg)]"
            >
              <Icon :name="feature.icon" class="size-5" />
            </div>
            <h3
              class="text-base font-semibold text-[var(--landing-foreground)]"
            >
              {{ feature.title }}
            </h3>
            <p class="mt-3 text-sm leading-6 text-[var(--landing-copy)]">
              {{ feature.desc }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="px-5 py-16 sm:px-6">
      <div class="mx-auto max-w-[860px]">
        <div class="mb-8 text-center">
          <h2
            class="text-3xl font-semibold tracking-normal text-[var(--landing-foreground)]"
          >
            Questions before you open a file?
          </h2>
        </div>

        <div
          class="divide-y divide-[var(--landing-border)] border-y border-[var(--landing-border)]"
        >
          <div v-for="(faq, index) in faqsList" :key="faq.q">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-semibold text-[var(--landing-foreground)]"
              @click="toggleFaq(index)"
            >
              <span>{{ faq.q }}</span>
              <Icon
                name="hugeicons:arrow-right-02"
                :class="[
                  'size-4 shrink-0 text-[var(--landing-muted)] transition-transform duration-200',
                  activeFaq === index ? 'rotate-90' : '',
                ]"
              />
            </button>
            <p
              v-show="activeFaq === index"
              class="pb-5 pr-8 text-sm leading-7 text-[var(--landing-copy)]"
            >
              {{ faq.a }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <footer class="px-5 py-3 sm:px-6">
      <div
        class="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left"
      >
        <div class="flex items-center gap-2.5">
          <img src="/logo.png" alt="" class="size-7 rounded-lg" />
          <span class="text-sm font-semibold text-[var(--landing-foreground)]">
            Orca CSV
          </span>
        </div>
        <a
          :href="githubLink"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center gap-2 text-xs text-[var(--landing-muted)] transition hover:text-[var(--landing-foreground)]"
        >
          <Icon name="hugeicons:github" class="size-4" />
          GitHub
        </a>
      </div>
    </footer>

    <ClientOnly>
      <CsvDropOverlay v-if="isOverDropZone" />
    </ClientOnly>
  </main>
</template>

<style scoped>
.orca-landing {
  --landing-background: #ffffff;
  --landing-foreground: #111111;
  --landing-copy: #4b4b52;
  --landing-muted: #6e6e78;
  --landing-faint: #909099;
  --landing-surface: #ffffff;
  --landing-surface-soft: #f8f8f6;
  --landing-border: rgba(17, 17, 17, 0.08);
  --landing-border-strong: rgba(17, 17, 17, 0.14);
  --landing-selection: rgba(17, 17, 17, 0.16);
  --landing-button-primary: #111111;
  --landing-button-primary-foreground: #ffffff;
  --landing-button-secondary: rgba(255, 255, 255, 0.82);
  --landing-button-secondary-border: rgba(17, 17, 17, 0.12);
  --landing-button-secondary-foreground: #29292f;
  --landing-logo-bg: color-mix(
    in srgb,
    var(--landing-surface-soft) 82%,
    transparent
  );
  --landing-logo-border: rgba(17, 17, 17, 0.14);
  --landing-logo-shadow: 0 10px 10px rgba(17, 17, 17, 0.1);
  --landing-icon-bg: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.92) 0%,
    rgba(241, 241, 237, 0.96) 100%
  );
  --landing-icon-border: rgba(17, 17, 17, 0.09);
  --landing-icon-fg: #273242;
  --landing-preview-frame: #efeae0;
  --landing-preview-window: rgba(250, 248, 242, 0.94);
  --landing-preview-topbar: rgba(240, 235, 226, 0.88);
  --landing-preview-sidebar: #e9e4d9;
  --landing-preview-main: #f4f0e8;
  --landing-preview-panel: rgba(255, 255, 255, 0.76);
  --landing-preview-panel-strong: rgba(255, 255, 255, 0.92);
  --landing-preview-chip: rgba(17, 17, 17, 0.04);
  --landing-preview-row-active: rgba(17, 17, 17, 0.04);
  --landing-preview-border: rgba(17, 17, 17, 0.08);
  --landing-preview-text: #18181d;
  --landing-preview-muted: #5b5b65;
  --landing-preview-shadow: 0 10px 30px rgba(17, 17, 17, 0.06);
}

.dark .orca-landing {
  --landing-background: #0f0f0f;
  --landing-foreground: #ffffff;
  --landing-copy: #9e9ea6;
  --landing-muted: #7d7d85;
  --landing-faint: #606068;
  --landing-surface: #141414;
  --landing-surface-soft: #1a1a1a;
  --landing-border: rgba(255, 255, 255, 0.08);
  --landing-border-strong: rgba(255, 255, 255, 0.14);
  --landing-selection: rgba(255, 255, 255, 0.18);
  --landing-button-primary: #ffffff;
  --landing-button-primary-foreground: #000000;
  --landing-button-secondary: transparent;
  --landing-button-secondary-border: #333333;
  --landing-button-secondary-foreground: #cfcfcf;
  --landing-logo-bg: rgba(255, 255, 255, 0.05);
  --landing-logo-border: rgba(255, 255, 255, 0.1);
  --landing-logo-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  --landing-icon-bg: rgba(255, 255, 255, 0.03);
  --landing-icon-border: rgba(255, 255, 255, 0.1);
  --landing-icon-fg: rgba(255, 255, 255, 0.92);
  --landing-preview-frame: #0d0f11;
  --landing-preview-window: rgba(13, 15, 17, 0.96);
  --landing-preview-topbar: rgba(0, 0, 0, 0.45);
  --landing-preview-sidebar: #0f1012;
  --landing-preview-main: #111315;
  --landing-preview-panel: rgba(255, 255, 255, 0.03);
  --landing-preview-panel-strong: rgba(0, 0, 0, 0.38);
  --landing-preview-chip: rgba(255, 255, 255, 0.03);
  --landing-preview-row-active: rgba(255, 255, 255, 0.06);
  --landing-preview-border: rgba(255, 255, 255, 0.08);
  --landing-preview-text: rgba(255, 255, 255, 0.92);
  --landing-preview-muted: rgba(255, 255, 255, 0.72);
  --landing-preview-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
}

.landing-logo-frame {
  background: var(--landing-logo-bg);
  border-color: var(--landing-logo-border);
  box-shadow: var(--landing-logo-shadow);
}

.landing-preview-shell {
  animation: landing-load-in 720ms cubic-bezier(0.16, 1, 0.3, 1) 180ms both;
}

.landing-preview-window {
  border-color: var(--landing-preview-border);
  background: var(--landing-preview-window);
}

.landing-preview-topbar {
  border-color: var(--landing-preview-border);
  background: var(--landing-preview-topbar);
}

.landing-feature-card {
  border-color: var(--landing-border);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.02),
    0 4px 8px rgba(0, 0, 0, 0.02);
  transition:
    border-color 300ms ease,
    box-shadow 300ms ease,
    transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.landing-feature-card:hover {
  border-color: var(--landing-border-strong);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.03),
    0 8px 16px rgba(0, 0, 0, 0.04);
  transform: translateY(-2px);
}

@keyframes landing-load-in {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.98);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-preview-shell,
  .landing-feature-card {
    animation: none;
    transition: none;
  }
}
</style>
