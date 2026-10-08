<script setup>
defineProps({
  result: {
    type: Object,
    required: true,
  },
})

defineEmits(['download'])
</script>

<template>
  <article class="logo-card" :class="{ 'logo-card--review': result.needsReview }">
    <div class="logo-card__art" v-html="result.previewMarkup"></div>
    <div class="logo-card__footer">
      <div>
        <strong>{{ result.displayName }}</strong>
        <span>{{ result.needsReview ? 'Review recommended' : 'CurrentColor ready' }}</span>
      </div>
      <button type="button" :aria-label="`Download ${result.outputName}`" @click="$emit('download')">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 4v11m0 0 5-5m-5 5-5-5M5 20h14" />
        </svg>
      </button>
    </div>
  </article>
</template>
