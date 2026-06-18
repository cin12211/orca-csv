<script setup lang="ts">
</script>

<template>
  <div
    class="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in select-none"
  >
    <div
      class="flex flex-col items-center justify-center border-1 border-dashed border-primary/40 rounded-xl bg-card/50 p-8 text-center shadow-2xl transition-all w-[98vw] h-[97vh]"
    >
      <Icon name="lucide:file-text" class="size-12 text-foreground mb-2" />
      <h4 class="text-lg font-medium text-foreground">Drop CSV File Here</h4>
      <p class="text-sm text-muted-foreground max-w-xs">
        Release to open and edit this CSV file. Supports files up to 50MB.
      </p>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
