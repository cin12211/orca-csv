<script setup lang="ts">
import { reactify, useFileSystemAccess } from '@vueuse/core';
import type { ShallowRef } from 'vue';
import { reactive, shallowRef } from 'vue';
import YAML from 'yaml';

const stringify = reactify((input: any) =>
  YAML.stringify(
    input,
    (k, v) => {
      if (typeof v === 'function') {
        return undefined;
      }
      return v;
    },
    {
      singleQuote: true,
      flowCollectionPadding: false,
    }
  )
);

const dataType = shallowRef('Text') as ShallowRef<
  'Text' | 'ArrayBuffer' | 'Blob'
>;
const res = useFileSystemAccess({
  dataType,
  types: [
    {
      description: 'text',
      accept: {
        'text/plain': ['.txt', '.html'],
      },
    },
  ],
  excludeAcceptAllOption: true,
});

const content = res.data;
const str = stringify(
  reactive({
    isSupported: res.isSupported,
    file: res.file,
    fileName: res.fileName,
    fileMIME: res.fileMIME,
    fileSize: res.fileSize,
    fileLastModified: res.fileLastModified,
  })
);

async function onSave() {
  await res.save();
}
</script>

<template>
  <div class="p-6 space-y-4">
    <h1 class="text-xl font-bold mb-4">VueUse useFileSystemAccess Test Page</h1>
    <div class="flex gap-2 items-center flex-wrap">
      <button
        class="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        @click="res.open()"
      >
        Open
      </button>
      <button
        class="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
        @click="res.updateData()"
      >
        Update
      </button>
      <button
        class="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
        @click="res.create()"
      >
        New file
      </button>
      <button
        class="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        :disabled="!res.file.value"
        @click="onSave"
      >
        Save
      </button>
      <button
        class="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        :disabled="!res.file.value"
        @click="res.saveAs()"
      >
        Save as
      </button>

      <div class="ml-5">
        <div class="text-xs opacity-50">DataType</div>
        <select
          v-model="dataType"
          class="outline-none w-30 px-2 py-1 text-sm bg-background border border-input rounded"
        >
          <option value="Text">Text</option>
          <option value="ArrayBuffer">ArrayBuffer</option>
          <option value="Blob">Blob</option>
        </select>
      </div>
    </div>

    <pre
      class="code-block p-4 rounded bg-muted text-sm font-mono whitespace-pre-wrap"
      >{{ str }}</pre
    >

    <div v-if="content" class="mt-4">
      <h2 class="text-sm font-semibold mb-2">Content</h2>
      <textarea
        v-if="typeof content === 'string'"
        v-model="content"
        rows="20"
        cols="40"
        class="w-full p-2 border rounded font-mono text-sm bg-background"
      />
      <span v-else class="font-mono text-sm">{{ content }}</span>
    </div>
  </div>
</template>
