/**
 * Client-side text extraction for uploaded VSL letters.
 *
 * Runs entirely in the browser: .txt/.md are read directly, .pdf is parsed
 * with pdf.js. Only the extracted text is sent to the backend, which keeps
 * the payload small and avoids a server-side PDF parser.
 */
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

export const ACCEPTED_EXTENSIONS = ['.txt', '.text', '.md', '.markdown', '.pdf']
export const ACCEPTED_ATTR = '.txt,.text,.md,.markdown,.pdf,text/plain,text/markdown,application/pdf'
export const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB
export const MIN_TEXT_LENGTH = 200

export function fileExtension(name = '') {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot).toLowerCase()
}

export function formatBytes(bytes) {
  if (!bytes) return '0 KB'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

/** Collapse the whitespace soup that PDF extraction usually produces. */
function tidy(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function extractFromPdf(file, onProgress) {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

  const buffer = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buffer }).promise

  try {
    const pages = []

    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber)
      const content = await page.getTextContent()

      let line = ''
      const lines = []

      for (const item of content.items) {
        if (!('str' in item)) continue
        line += item.str
        if (item.hasEOL) {
          lines.push(line)
          line = ''
        }
      }
      if (line) lines.push(line)

      pages.push(lines.join('\n'))
      page.cleanup()
      onProgress?.(Math.round((pageNumber / doc.numPages) * 100))
    }

    return tidy(pages.join('\n\n'))
  } finally {
    await doc.destroy()
  }
}

/**
 * @param {File} file
 * @param {(percent:number)=>void} [onProgress]
 * @returns {Promise<string>} the extracted plain text
 */
export async function extractTextFromFile(file, onProgress) {
  if (!file) throw new Error('No file selected.')

  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`That file is ${formatBytes(file.size)}. The limit is 20 MB.`)
  }

  const extension = fileExtension(file.name)

  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    throw new Error(`Unsupported file type "${extension || file.type || 'unknown'}". Upload a .txt, .md or .pdf file.`)
  }

  let text = ''

  if (extension === '.pdf') {
    try {
      text = await extractFromPdf(file, onProgress)
    } catch (error) {
      console.error(error)
      throw new Error(
        'This PDF could not be read. If it is a scanned document there is no ' +
          'text layer to extract - paste the transcript instead.',
      )
    }
  } else {
    text = tidy(await file.text())
    onProgress?.(100)
  }

  if (text.length < MIN_TEXT_LENGTH) {
    throw new Error(
      `Only ${text.length} characters could be read from that file. ` +
        `At least ${MIN_TEXT_LENGTH} are needed for a useful analysis.`,
    )
  }

  return text
}
