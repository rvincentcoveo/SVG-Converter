import JSZip from 'jszip'

function isSvg(name) {
  return name.toLowerCase().endsWith('.svg')
}

function isZip(name) {
  return name.toLowerCase().endsWith('.zip')
}

export function startsWithDot(name) {
  const filename = name.replaceAll('\\', '/').split('/').filter(Boolean).pop() || ''
  return filename.startsWith('.')
}

export function isHiddenArchiveEntry(name) {
  const segments = name.replaceAll('\\', '/').split('/').filter(Boolean)
  return segments.some(
    (segment) => segment.startsWith('.') || segment.toLowerCase() === '__macosx',
  )
}

export async function collectSvgSources(files) {
  const sources = []

  for (const file of files) {
    const sourcePath = file.webkitRelativePath || file.name
    if (startsWithDot(sourcePath) || isHiddenArchiveEntry(sourcePath)) continue

    if (isSvg(file.name)) {
      sources.push({ name: file.name, text: await file.text() })
      continue
    }

    if (isZip(file.name)) {
      const archive = await JSZip.loadAsync(file)
      const entries = Object.values(archive.files).filter(
        (entry) =>
          !entry.dir &&
          isSvg(entry.name) &&
          !startsWithDot(entry.name) &&
          !isHiddenArchiveEntry(entry.name),
      )
      for (const entry of entries) {
        sources.push({
          name: entry.name.split('/').pop(),
          text: await entry.async('text'),
        })
      }
    }
  }

  const visibleSources = sources.filter(
    (source) => !startsWithDot(source.name) && !isHiddenArchiveEntry(source.name),
  )

  if (!visibleSources.length) {
    throw new Error('Add at least one valid .svg file, or a .zip containing SVG files.')
  }

  return visibleSources
}

export async function createResultsZip(results) {
  const archive = new JSZip()
  results
    .filter(
      (result) =>
        !startsWithDot(result.outputName) && !isHiddenArchiveEntry(result.outputName),
    )
    .forEach((result) => archive.file(result.outputName, result.markup))
  return archive.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}
