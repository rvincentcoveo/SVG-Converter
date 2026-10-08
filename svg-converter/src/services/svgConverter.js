const SVG_NS = 'http://www.w3.org/2000/svg'
const PAINTABLE = new Set(['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line', 'text', 'g', 'use'])
const MASK_CONTEXT = new Set(['mask', 'linearGradient', 'radialGradient', 'pattern', 'filter'])
const SAFE_STYLE_PROPERTIES = new Set([
  'fill',
  'stroke',
  'fill-rule',
  'clip-rule',
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
])

export function isNearWhite(value) {
  const normalized = value.trim().toLowerCase().replaceAll(' ', '')
  if (['white', '#fff', '#ffffff', 'rgb(255,255,255)'].includes(normalized)) return true
  const match = normalized.match(/^#([0-9a-f]{6})$/)
  if (!match) return false
  const channels = match[1].match(/.{2}/g).map((channel) => Number.parseInt(channel, 16))
  return channels.every((channel) => channel >= 248)
}

export function convertPaint(value) {
  const normalized = value.trim()
  if (!normalized || normalized.toLowerCase() === 'none') return normalized || 'none'
  if (isNearWhite(normalized)) return '#fff'
  return 'currentColor'
}

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/\.svg$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'logo'
}

export function makeOutputName(filename) {
  return `${filename.replace(/\.svg$/i, '').replace(/-color$/i, '')}-currentcolor.svg`
}

function shortHash(value) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function inlineSafeStyleSheets(document) {
  let droppedDeclarations = false

  document.querySelectorAll('style').forEach((styleElement) => {
    const css = styleElement.textContent || ''
    const rulePattern = /([^{}]+)\{([^{}]+)\}/g
    let rule

    while ((rule = rulePattern.exec(css))) {
      const selectors = rule[1].split(',').map((selector) => selector.trim()).filter(Boolean)
      const safeDeclarations = rule[2]
        .split(';')
        .map((declaration) => declaration.trim())
        .filter(Boolean)
        .filter((declaration) => {
          const property = declaration.split(':', 1)[0]?.trim().toLowerCase()
          const isSafe = SAFE_STYLE_PROPERTIES.has(property)
          if (!isSafe) droppedDeclarations = true
          return isSafe
        })
        .join(';')

      if (!safeDeclarations) continue
      selectors.forEach((selector) => {
        try {
          document.querySelectorAll(selector).forEach((element) => {
            const existing = element.getAttribute('style')
            element.setAttribute('style', [safeDeclarations, existing].filter(Boolean).join(';'))
          })
        } catch {
          droppedDeclarations = true
        }
      })
    }
    styleElement.remove()
  })

  return droppedDeclarations
}

function removeUnsafeContent(document) {
  let removedExternalReference = false
  document.querySelectorAll('script, foreignObject, iframe, object, embed').forEach((element) => element.remove())
  document.querySelectorAll('*').forEach((element) => {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim()
      if (name.startsWith('on')) element.removeAttribute(attribute.name)
      if ((name === 'href' || name.endsWith(':href')) && !value.startsWith('#') && !value.startsWith('data:image/')) {
        element.removeAttribute(attribute.name)
        removedExternalReference = true
      }
    }
  })
  return removedExternalReference
}

function namespaceIds(root, prefix) {
  const idMap = new Map()
  root.querySelectorAll('[id]').forEach((element) => {
    const oldId = element.id
    const newId = `${prefix}-${oldId}`
    idMap.set(oldId, newId)
    element.id = newId
  })

  root.querySelectorAll('*').forEach((element) => {
    for (const attribute of [...element.attributes]) {
      let nextValue = attribute.value
      idMap.forEach((newId, oldId) => {
        nextValue = nextValue.replaceAll(`url(#${oldId})`, `url(#${newId})`)
        if (nextValue === `#${oldId}`) nextValue = `#${newId}`
      })
      if (nextValue !== attribute.value) element.setAttribute(attribute.name, nextValue)
    }
  })
}

function isInsideProtectedContext(element) {
  let current = element.parentElement
  while (current) {
    if (MASK_CONTEXT.has(current.localName)) return true
    current = current.parentElement
  }
  return false
}

function convertElementPaint(element) {
  if (element.hasAttribute('fill')) {
    element.setAttribute('fill', convertPaint(element.getAttribute('fill')))
  }
  if (element.hasAttribute('stroke')) {
    element.setAttribute('stroke', convertPaint(element.getAttribute('stroke')))
  }

  const inlineStyle = element.getAttribute('style')
  if (inlineStyle) {
    const converted = inlineStyle.replace(/(fill|stroke)\s*:\s*([^;]+)/gi, (_, property, value) => {
      return `${property}:${convertPaint(value)}`
    })
    element.setAttribute('style', converted)
  }
}

function wrapEmbeddedRaster(root, document, maskId) {
  const viewBox = root.getAttribute('viewBox')?.trim().split(/[\s,]+/) || []
  const x = viewBox[0] || '0'
  const y = viewBox[1] || '0'
  const width = viewBox[2] || root.getAttribute('width') || '100'
  const height = viewBox[3] || root.getAttribute('height') || '100'
  const originalChildren = [...root.children].map((child) => child.cloneNode(true))

  root.replaceChildren()
  const defs = document.createElementNS(SVG_NS, 'defs')
  const mask = document.createElementNS(SVG_NS, 'mask')
  mask.setAttribute('id', maskId)
  mask.setAttribute('maskUnits', 'userSpaceOnUse')
  mask.setAttribute('x', x)
  mask.setAttribute('y', y)
  mask.setAttribute('width', width)
  mask.setAttribute('height', height)
  mask.setAttribute('style', 'mask-type:alpha')

  originalChildren.forEach((child) => {
    if (child.localName === 'defs') {
      ;[...child.children].forEach((definition) => defs.append(definition.cloneNode(true)))
    } else {
      mask.append(child)
    }
  })
  defs.append(mask)
  root.append(defs)

  const rect = document.createElementNS(SVG_NS, 'rect')
  rect.setAttribute('x', x)
  rect.setAttribute('y', y)
  rect.setAttribute('width', width)
  rect.setAttribute('height', height)
  rect.setAttribute('fill', 'currentColor')
  rect.setAttribute('mask', `url(#${maskId})`)
  root.append(rect)
}

export function convertSvgMarkup(svgText, filename, sequence = 0) {
  if (typeof DOMParser === 'undefined') {
    throw new Error('SVG conversion requires a browser environment.')
  }

  const document = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  if (document.querySelector('parsererror') || document.documentElement.localName !== 'svg') {
    throw new Error(`${filename} is not a valid SVG file.`)
  }

  const droppedStyleDeclarations = inlineSafeStyleSheets(document)
  const removedExternalReference = removeUnsafeContent(document)
  const root = document.documentElement
  const prefix = `${slugify(filename)}-${shortHash(svgText)}-${sequence}`
  namespaceIds(root, prefix)

  const hasEmbeddedRaster = Boolean(root.querySelector('image[href^="data:image/"], image[xlink\\:href^="data:image/"]'))
  const hasUnsupportedExternalImage = Boolean(root.querySelector('image:not([href^="data:image/"]):not([xlink\\:href^="data:image/"])'))
  const hasComplexEffects = Boolean(root.querySelector('filter, pattern, linearGradient, radialGradient'))

  if (hasEmbeddedRaster) {
    wrapEmbeddedRaster(root, document, `${prefix}-alpha-mask`)
  } else {
    root.querySelectorAll('*').forEach((element) => {
      if (PAINTABLE.has(element.localName) && !isInsideProtectedContext(element)) {
        convertElementPaint(element)
      }
    })
  }

  if (!root.getAttribute('xmlns')) root.setAttribute('xmlns', SVG_NS)
  const markup = new XMLSerializer().serializeToString(root)
  const outputName = makeOutputName(filename)

  return {
    id: `${prefix}-${sequence}`,
    displayName: filename.replace(/\.svg$/i, ''),
    outputName,
    markup,
    previewMarkup: markup,
    needsReview:
      removedExternalReference ||
      droppedStyleDeclarations ||
      hasUnsupportedExternalImage ||
      (hasComplexEffects && !hasEmbeddedRaster),
  }
}
