import { describe, expect, it } from 'vitest'
import { collectAppFiles, findDashes } from './check-dashes'

describe('findDashes', () => {
  it('acha travessão e meia risca com arquivo e linha', () => {
    const files = [
      { path: 'a.json', text: 'ok\ncom — travessão' },
      { path: 'b.svelte', text: 'meia – risca' },
      { path: 'c.ts', text: 'hífen - normal' },
    ]
    expect(findDashes(files)).toEqual(['a.json:2', 'b.svelte:1'])
  })

  it('os arquivos do app não têm travessão', () => {
    expect(findDashes(collectAppFiles())).toEqual([])
  })
})
