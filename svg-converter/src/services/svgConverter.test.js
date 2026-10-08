import test from 'node:test'
import assert from 'node:assert/strict'
import { convertPaint, isNearWhite, makeOutputName, slugify } from './svgConverter.js'

test('converts colored paints to currentColor', () => {
  assert.equal(convertPaint('#76B900'), 'currentColor')
  assert.equal(convertPaint('rgb(20, 40, 60)'), 'currentColor')
  assert.equal(convertPaint('black'), 'currentColor')
})

test('preserves none and white knockout values', () => {
  assert.equal(convertPaint('none'), 'none')
  assert.equal(convertPaint('#FEFEFE'), '#fff')
  assert.equal(isNearWhite('rgb(255, 255, 255)'), true)
})

test('creates stable safe names', () => {
  assert.equal(slugify('General Motors (Primary).svg'), 'general-motors-primary')
  assert.equal(makeOutputName('NVIDIA-color.svg'), 'NVIDIA-currentcolor.svg')
})
