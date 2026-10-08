<script setup>
import { computed, ref } from 'vue'
import { useConverterStore } from '../stores/converter.js'

const store = useConverterStore()
const fileInput = ref(null)
const isDragging = ref(false)

const isWorking = computed(() => ['extracting', 'converting', 'packaging'].includes(store.status))

function openPicker() {
  fileInput.value?.click()
}

function onFileChange(event) {
  submitFiles(event.target.files)
  event.target.value = ''
}

function onDrop(event) {
  isDragging.value = false
  submitFiles(event.dataTransfer.files)
}

function submitFiles(fileList) {
  if (!fileList?.length || isWorking.value) return
  store.processFiles([...fileList])
}

function onKeydown(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openPicker()
  }
}
</script>

<template>
  <section class="panel panel--input" aria-labelledby="upload-title">
    <div class="panel__heading">
      <div>
        <span class="step-number">01</span>
        <h2 id="upload-title">Add your files</h2>
      </div>
      <button v-if="store.hasActivity" class="text-button" type="button" @click="store.reset">
        Start over
      </button>
    </div>

    <div
      class="drop-zone"
      :class="{ 'drop-zone--active': isDragging, 'drop-zone--working': isWorking }"
      role="button"
      tabindex="0"
      :aria-disabled="isWorking"
      @click="openPicker"
      @keydown="onKeydown"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInput"
        class="visually-hidden"
        type="file"
        accept=".svg,.zip,image/svg+xml,application/zip"
        multiple
        @change="onFileChange"
      />

      <div class="drop-zone__icon" aria-hidden="true">
        <svg viewBox="0 0 32 32">
          <path d="M16 22V7m0 0-6 6m6-6 6 6M7 20v5h18v-5" />
        </svg>
      </div>
      <strong>{{ isWorking ? 'Conversion in progress' : 'Drop SVGs or a ZIP here' }}</strong>
      <span>{{ isWorking ? 'Your files stay in this browser.' : 'or click to choose files' }}</span>
      <small>SVG and ZIP · Multiple files supported</small>
    </div>

    <div v-if="store.hasActivity" class="progress-card" aria-live="polite">
      <div class="progress-card__row">
        <span>{{ store.statusLabel }}</span>
        <strong>{{ store.progress }}%</strong>
      </div>
      <div
        class="progress-track"
        role="progressbar"
        aria-label="Conversion progress"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="store.progress"
      >
        <span :style="{ width: `${store.progress}%` }"></span>
      </div>
      <div class="progress-card__meta">
        <span>{{ store.sourceCount }} source{{ store.sourceCount === 1 ? '' : 's' }}</span>
        <span v-if="store.activeFile">{{ store.activeFile }}</span>
      </div>
    </div>

    <div v-if="store.errorMessage" class="message message--error" role="alert">
      <strong>We couldn’t convert those files.</strong>
      <span>{{ store.errorMessage }}</span>
    </div>

    <div class="privacy-note">
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M7 10V7a5 5 0 0 1 10 0v3m-11 0h12v10H6V10Z" />
      </svg>
      <div>
        <strong>Private by default</strong>
        <span>Standard conversions happen locally. A server-side AI review can be added later for complex artwork.</span>
      </div>
    </div>
  </section>
</template>
