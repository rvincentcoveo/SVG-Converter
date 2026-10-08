import test from 'node:test'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import {
  collectSvgSources,
  createResultsZip,
  isHiddenArchiveEntry,
  startsWithDot,
} from './archiveService.js'

test('detects hidden archive paths', () => {
  assert.equal(startsWithDot('._S-oliver-group-color.svg'), true)
  assert.equal(startsWithDot('logos/._S-oliver-group-color.svg'), true)
  assert.equal(startsWithDot('S-oliver-group-color.svg'), false)
  assert.equal(isHiddenArchiveEntry('.hidden.svg'), true)
  assert.equal(isHiddenArchiveEntry('logos/.hidden.svg'), true)
  assert.equal(isHiddenArchiveEntry('__MACOSX/._logo.svg'), true)
  assert.equal(isHiddenArchiveEntry('__macosx/._logo.svg'), true)
  assert.equal(isHiddenArchiveEntry('logos/visible.svg'), false)
})

test('ignores AppleDouble files dropped directly', async () => {
  const files = [
    {
      name: '._nvidia-wordmark-color.svg',
      text: async () => {
        throw new Error('AppleDouble content must never be read')
      },
    },
    {
      name: 'nvidia-wordmark-color.svg',
      text: async () => '<svg xmlns="http://www.w3.org/2000/svg"/>',
    },
  ]

  const sources = await collectSvgSources(files)
  assert.deepEqual(sources.map((source) => source.name), ['nvidia-wordmark-color.svg'])
})

test('ignores hidden SVG files when reading a ZIP', async () => {
  const archive = new JSZip()
  archive.file('visible.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>')
  archive.file('.hidden.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>')
  archive.file('logos/.nested-hidden.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>')
  archive.file('__MACOSX/._visible.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>')

  const zipFile = await archive.generateAsync({ type: 'nodebuffer' })
  zipFile.name = 'logos.zip'

  const sources = await collectSvgSources([zipFile])
  assert.deepEqual(sources.map((source) => source.name), ['visible.svg'])
})

test('excludes hidden entries from the exported ZIP', async () => {
  const output = await createResultsZip([
    { outputName: 'visible-currentcolor.svg', markup: '<svg/>' },
    { outputName: '._hidden-currentcolor.svg', markup: '<svg/>' },
    { outputName: '__MACOSX/ghost-currentcolor.svg', markup: '<svg/>' },
  ])
  const archive = await JSZip.loadAsync(await output.arrayBuffer())

  assert.deepEqual(Object.keys(archive.files), ['visible-currentcolor.svg'])
})
