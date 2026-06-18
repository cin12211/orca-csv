<script setup lang="ts">
import { ref } from 'vue';
import { Sun, Moon } from '@lucide/vue';

const isDark = ref(false);

function toggleTheme() {
  isDark.value = !isDark.value;
  if (import.meta.client) {
    document.documentElement.classList.toggle('dark', isDark.value);
  }
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground p-8">
    <div class="mx-auto max-w-2xl space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold">orca-csv</h1>
        <Button variant="outline" size="icon" @click="toggleTheme">
          <Sun v-if="isDark" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuxt 4 + shadcn-vue</CardTitle>
          <CardDescription>
            This is a smoke test rendering Button, Card, Input, and Badge from
            shadcn-vue.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>

          <Input placeholder="Type something..." />

          <div class="flex gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
