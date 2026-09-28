import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const DASH_RE = /[–—]/
const EXTENSIONS = new Set(['.ts', '.svelte', '.json', '.html', '.css'])

export function findDashes(files: { path: string; text: string }[]): string[] {
  const hits: string[] = []
  for (const file of files) {
    file.text.split('\n').forEach((line, i) => {
      if (DASH_RE.test(line)) hits.push(`${file.path}:${i + 1}`)
    })
  }
  return hits
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

/** Textos do app: tudo em src/ (menos testes) e o index.html. */
export function collectAppFiles(root = '.'): { path: string; text: string }[] {
  const paths = [
    ...walk(join(root, 'src')).filter((p) => EXTENSIONS.has(extname(p)) && !p.endsWith('.test.ts')),
    join(root, 'index.html'),
  ]
  return paths.map((path) => ({ path, text: readFileSync(path, 'utf8') }))
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const hits = findDashes(collectAppFiles())
  if (hits.length > 0) {
    console.error('Travessão encontrado (proibido nos textos do app):')
    for (const hit of hits) console.error(`  ${hit}`)
    process.exit(1)
  }
  console.log('Nenhum travessão encontrado.')
}
