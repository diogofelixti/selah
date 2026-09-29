<script lang="ts">
  import { StickyNote } from '@lucide/svelte'
  import { app } from '../lib/app.svelte'
  import { BOOKS } from '../lib/bible/books'
  import { TRANSLATION_BY_LANG, bible } from '../lib/bible/loader'
  import { formatRef, parseRef } from '../lib/bible/refs'
  import { locale, t } from '../lib/i18n/i18n.svelte'
  import { MARK_COLORS, type MarkColor, type VerseMark } from '../lib/storage/types'

  type Filter = 'all' | 'notes' | MarkColor
  let filter = $state<Filter>('all')
  let texts = $state<Record<string, string>>({})

  const bookOrder = new Map(BOOKS.map((b, i) => [b.id, i]))
  const bookName = (id: string) => t(`books.${id}`)

  function sortKey(m: VerseMark): [number, number, number] {
    const p = parseRef(m.ref)!
    return [bookOrder.get(p.book) ?? 0, p.chapter, p.verse ?? 0]
  }

  const sorted = $derived(
    [...app.marks].sort((a, b) => {
      const [x, y] = [sortKey(a), sortKey(b)]
      return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]
    }),
  )
  const shown = $derived(
    sorted.filter((m) => filter === 'all' || (filter === 'notes' ? m.note !== '' : m.color === filter)),
  )

  // Carrega o texto dos versículos marcados (um livro por vez, do cache quando possível).
  $effect(() => {
    const tr = TRANSLATION_BY_LANG[locale.lang]
    const refs = sorted.map((m) => m.ref)
    let cancelled = false
    void (async () => {
      const next: Record<string, string> = {}
      for (const ref of refs) {
        const p = parseRef(ref)!
        try {
          next[ref] = await bible.getVerse(tr, p.book, p.chapter, p.verse!)
        } catch {
          next[ref] = ''
        }
      }
      if (!cancelled) texts = next
    })()
    return () => (cancelled = true)
  })

  function hrefFor(ref: string) {
    const p = parseRef(ref)!
    return `#/ler/${p.book}/${p.chapter}/${p.verse}`
  }

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'marks.filterAll' },
    { id: 'notes', label: 'marks.filterNotes' },
    ...MARK_COLORS.map((c) => ({ id: c, label: `marks.${c}` })),
  ]
</script>

<div class="page">
  <header class="page-head">
    <h1>{t('marks.title')}</h1>
    {#if app.marks.length > 0}
      <p class="muted">{app.marks.length === 1 ? t('marks.countOne') : t('marks.count', { n: app.marks.length })}</p>
    {/if}
  </header>

  {#if app.marks.length === 0}
    <p class="card empty">{t('marks.empty')}</p>
  {:else}
    <div class="filters">
      {#each FILTERS as f (f.id)}
        <button class="pill pill-dark" aria-pressed={filter === f.id} onclick={() => (filter = f.id)}>
          {#if f.id !== 'all' && f.id !== 'notes'}<span class="dot" data-color={f.id}></span>{/if}{t(f.label)}
        </button>
      {/each}
    </div>

    <ul class="marks">
      {#each shown as m (m.ref)}
        <li>
          <a class="card" href={hrefFor(m.ref)}>
            <span class="head">
              {#if m.color}<span class="dot" data-color={m.color} aria-hidden="true"></span>{/if}
              <span class="ref">{formatRef(m.ref, bookName)}</span>
            </span>
            <span class="text" data-color={m.color ?? undefined}>{(texts[m.ref] ?? '').replace(/\[([^\]]+)\]/g, '$1')}</span>
            {#if m.note}
              <span class="note"><StickyNote size={16} aria-hidden="true" />{m.note}</span>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .empty { line-height: 1.6; }
  .filters { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4); }
  .marks { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-3); }
  .marks a { display: grid; gap: var(--space-2); }
  .head { display: flex; align-items: center; gap: var(--space-2); }
  .ref { font-weight: 700; font-size: 0.875rem; color: var(--accent-text); }
  .text { font-family: var(--font-read); line-height: 1.55; border-radius: 4px; }
  .text[data-color='gold'] { background: var(--mark-gold); }
  .text[data-color='green'] { background: var(--mark-green); }
  .text[data-color='blue'] { background: var(--mark-blue); }
  .note {
    display: flex;
    gap: var(--space-2);
    align-items: flex-start;
    padding: var(--space-3);
    border-radius: var(--radius-m);
    background: var(--surface-2);
    font-size: 0.9375rem;
    white-space: pre-line;
  }
  .note :global(svg) { flex-shrink: 0; margin-top: 3px; color: var(--accent-text); }
  .dot { display: inline-block; width: 14px; height: 14px; border-radius: 999px; border: 1px solid var(--border-strong); margin-right: 6px; }
  .dot[data-color='gold'] { background: var(--mark-gold); }
  .dot[data-color='green'] { background: var(--mark-green); }
  .dot[data-color='blue'] { background: var(--mark-blue); }
</style>
