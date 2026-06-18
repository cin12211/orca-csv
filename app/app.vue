<template>
  <TooltipProvider :delay-duration="200">
    <div class="antialiased">
      <NuxtPage />
    </div>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { TooltipProvider } from 'reka-ui'
</script>
