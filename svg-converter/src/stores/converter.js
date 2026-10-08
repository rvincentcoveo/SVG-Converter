import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  collectSvgSources,
  createResultsZip,
  isHiddenArchiveEntry,
  startsWithDot,
} from '../services/archiveService.js'
import { convertSvgMarkup } from '../services/svgConverter.js'
import { downloadBlob } from '../utils/download.js'

const STATUS_LABELS = {
  idle: 'Ready',
  extracting: 'Reading files',
  converting: 'Converting artwork',
  packaging: 'Preparing downloads',
  done: 'Conversion complete',
  error: 'Conversion stopped',
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()))

export const useConverterStore = defineStore('converter', () => {
  const status = ref('idle')
  const progress = ref(0)
  const sourceCount = ref(0)
  const activeFile = ref('')
  const results = ref([])
  const errorMessage = ref('')
  const previewColor = ref('#171716')

  const hasActivity = computed(() => status.value !== 'idle')
  const statusLabel = computed(() => STATUS_LABELS[status.value])
  const reviewCount = computed(() => results.value.filter((result) => result.needsReview).length)

  async function processFiles(files) {
    reset()
    sourceCount.value = files.length
    status.value = 'extracting'
    progress.value = 7

    try {
      const sources = (await collectSvgSources(files)).filter(
        (source) => !startsWithDot(source.name) && !isHiddenArchiveEntry(source.name),
      )
      sourceCount.value = sources.length
      progress.value = 18
      status.value = 'converting'

      const converted = []
      for (let index = 0; index < sources.length; index += 1) {
        const source = sources[index]
        activeFile.value = source.name
        await nextFrame()
        converted.push(convertSvgMarkup(source.text, source.name, index))
        progress.value = 18 + Math.round(((index + 1) / sources.length) * 72)
      }

      status.value = 'packaging'
      activeFile.value = ''
      await nextFrame()
      results.value = converted
      progress.value = 100
      status.value = 'done'
    } catch (error) {
      status.value = 'error'
      progress.value = 0
      activeFile.value = ''
      errorMessage.value = error instanceof Error ? error.message : 'An unexpected error occurred.'
    }
  }

  function downloadOne(result) {
    downloadBlob(new Blob([result.markup], { type: 'image/svg+xml;charset=utf-8' }), result.outputName)
  }

  async function downloadAll() {
    status.value = 'packaging'
    progress.value = 96
    const archive = await createResultsZip(results.value)
    downloadBlob(archive, 'currentcolor-logos.zip')
    progress.value = 100
    status.value = 'done'
  }

  function reset() {
    status.value = 'idle'
    progress.value = 0
    sourceCount.value = 0
    activeFile.value = ''
    results.value = []
    errorMessage.value = ''
  }

  return {
    status,
    progress,
    sourceCount,
    activeFile,
    results,
    errorMessage,
    previewColor,
    hasActivity,
    statusLabel,
    reviewCount,
    processFiles,
    downloadOne,
    downloadAll,
    reset,
  }
})
