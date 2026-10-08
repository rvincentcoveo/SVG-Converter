<script setup>
import { computed } from 'vue'
import LogoCard from './LogoCard.vue'
import { useConverterStore } from '../stores/converter.js'

const store = useConverterStore()
const hasResults = computed(() => store.results.length > 0)
</script>

<template>
  <section class="panel panel--preview" aria-labelledby="preview-title">
    <div class="panel__heading panel__heading--preview">
      <div>
        <span class="step-number">02</span>
        <h2 id="preview-title">Preview</h2>
      </div>

      <div v-if="hasResults" class="preview-actions">
        <label class="color-control">
          <span>Logo color</span>
          <input v-model="store.previewColor" type="color" aria-label="Preview logo color" />
          <code>{{ store.previewColor }}</code>
        </label>
        <button class="button button--primary" type="button" @click="store.downloadAll">
          Download all
        </button>
      </div>
    </div>

    <div v-if="!hasResults" class="empty-preview">
      <div class="empty-preview__stack" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <strong>Your converted logos will appear here</strong>
      <p>Upload one SVG or a ZIP to see a live, recolorable logo garden.</p>
    </div>

    <template v-else>
      <div class="results-summary">
        <p>
          <strong>{{ store.results.length }}</strong>
          logo{{ store.results.length === 1 ? '' : 's' }} converted
        </p>
        <span v-if="store.reviewCount">{{ store.reviewCount }} flagged for review</span>
        <span v-else>Ready to use</span>
      </div>

      <div class="logo-grid" :style="{ '--preview-color': store.previewColor }">
        <LogoCard
          v-for="result in store.results"
          :key="result.id"
          :result="result"
          @download="store.downloadOne(result)"
        />
      </div>
    </template>
  </section>
</template>
