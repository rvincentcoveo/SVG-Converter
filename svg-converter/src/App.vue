<script setup>
import AppHeader from './components/AppHeader.vue'
import UploadPanel from './components/UploadPanel.vue'
import PreviewPanel from './components/PreviewPanel.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="workspace" aria-label="SVG conversion workspace">
      <UploadPanel />
      <PreviewPanel />
    </main>
  </div>
</template>
