<script lang="ts">
  import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus } from '@lucide/svelte'
  import { tick } from 'svelte'
  import { app, markRead, unmarkRead, updateSettings, updateState } from '../lib/app.svelte'
  import { nextChapter, prevChapter } from '../lib/bible/books'
  import { splitImplied } from '../lib/bible/format'
  import { TRANSLATION_BY_LANG, bible } from '../lib/bible/loader'
  import { chapterRef } from '../lib/bible/refs'
  import type { BookText } from '../lib/bible/types'
  import { locale, t } from '../lib/i18n/i18n.svelte'
  import { PLANS } from '../lib/plans/catalog'
  import { isChapterDone } from '../lib/plans/status'
  import type { FontSize } from '../lib/storage/types'

  let { book, chapter, verse }: { book: string; chapter: number; verse?: number } = $props()

  let text = $state<BookText | null>(null)
  let failed = $state(false)
  let barHidden = $state(false)
  let flash = $state<number | null>(null)
  let lastY = 0
  let loadToken = 0

  const ref = $derived(chapterRef(book, chapter))
  const activePlan = $derived(
    app.state.activePlan ? { def: PLANS[app.state.activePlan.id], startedAt: app.state.activePlan.startedAt } : null,
  )
  const done = $derived(isChapterDone(ref, app.readings, activePlan))
  const verses = $derived(text?.chapters[chapter - 1] ?? [])
  const next = $derived(nextChapter(book, chapter))
  const prev = $derived(prevChapter(book, chapter))

  async function load() {
    const token = ++loadToken
    const tr = TRANSLATION_BY_LANG[locale.lang]
    failed = false
    text = null
    try {
      const result = await bible.loadBook(tr, book)
      if (token !== loadToken) return
      text = result
      await tick()
      if (verse) {
        document.getElementById(`v${verse}`)?.scrollIntoView({ block: 'center' })
        flash = verse
        setTimeout(() => (flash = null), 2500)
      } else {
        window.scrollTo(0, 0)
      }
    } catch {
      if (token === loadToken) failed = true
    }
  }

  $effect(() => {
    void locale.lang
    void load()
  })

  $effect(() => {
    const pos = app.state.lastPosition
    if (pos?.book !== book || pos?.chapter !== chapter) void updateState({ lastPosition: { book, chapter } })
  })

  function toggleDone() {
    void (done ? unmarkRead(ref) : markRead(ref))
  }

  function changeFont(delta: number) {
    const size = Math.min(4, Math.max(1, app.settings.fontSize + delta)) as FontSize
    void updateSettings({ fontSize: size })
  }

  function onScroll() {
    const y = window.scrollY
    barHidden = y > lastY && y > 80
    lastY = y
  }

  function back() {
    if (history.length > 1) history.back()
    else location.hash = `#/livro/${book}`
  }
</script>

<svelte:window onscroll={onScroll} />

<header class="bar" class:hidden={barHidden}>
  <button class="icon-btn" onclick={back} aria-label={t('common.back')}><ArrowLeft size={22} /></button>
  <a class="where" href={`#/livro/${book}`}>{t(`books.${book}`)} {chapter}</a>
  <div class="font">
    <button class="icon-btn" onclick={() => changeFont(-1)} disabled={app.settings.fontSize === 1} aria-label={t('reader.fontSmaller')}>
      <Minus size={18} />
    </button>
    <button class="icon-btn" onclick={() => changeFont(1)} disabled={app.settings.fontSize === 4} aria-label={t('reader.fontLarger')}>
      <Plus size={18} />
    </button>
  </div>
</header>

<article class="reader page">
  <h1>{t(`books.${book}`)} <span class="num">{chapter}</span></h1>

  {#if failed}
    <div class="state">
      <p>{t('reader.loadError')}</p>
      <button class="btn" onclick={() => load()}>{t('common.retry')}</button>
    </div>
  {:else if !text}
    <p class="state muted" aria-busy="true">{t('common.loading')}</p>
  {:else}
    <div class="text" style:font-size={`var(--read-size-${app.settings.fontSize})`}>
      {#each verses as content, i (i)}
        {#if content}
          <span id={`v${i + 1}`} class="verse" class:flash={flash === i + 1}>
            <sup>{i + 1}</sup>{#each splitImplied(content) as part, j (j)}{#if part.implied}<em>{part.text}</em>{:else}{part.text}{/if}{/each}
          </span>
        {/if}
      {/each}
    </div>

    <div class="end">
      <button class="btn mark" class:btn-primary={!done} aria-pressed={done} onclick={toggleDone}>
        {done ? t('reader.read') : t('reader.markRead')}
      </button>
      <nav class="chapters">
        {#if prev}
          <a class="btn btn-ghost" href={`#/ler/${prev.book}/${prev.chapter}`}>
            <ChevronLeft size={18} aria-hidden="true" />{t('reader.prev')}
          </a>
        {:else}
          <span></span>
        {/if}
        {#if next}
          <a class="btn" class:btn-primary={done} href={`#/ler/${next.book}/${next.chapter}`}>
            {t('reader.next')}<ChevronRight size={18} aria-hidden="true" />
          </a>
        {/if}
      </nav>
    </div>
  {/if}
</article>

<style>
  .bar {
    position: sticky;
    top: 0;
    z-index: 1;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    padding: env(safe-area-inset-top) var(--space-2) 0;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    transition: transform 0.2s ease;
  }
  .bar.hidden { transform: translateY(-100%); }
  .where { text-align: center; font-weight: 600; min-height: 44px; display: grid; place-items: center; }
  .font { display: flex; }
  .reader h1 { font-family: var(--font-read); font-weight: 600; margin-bottom: var(--space-5); }
  .num { color: var(--accent-strong); }
  .text { font-family: var(--font-read); line-height: 1.75; }
  .verse { padding: 2px 0; }
  sup {
    font-family: var(--font-ui);
    font-size: 0.6em;
    color: var(--text-2);
    margin-right: 0.25em;
    vertical-align: 0.5em;
    line-height: 0;
  }
  em { font-style: italic; }
  .state { display: grid; gap: var(--space-4); justify-items: start; padding: var(--space-5) 0; }
  .end { display: grid; gap: var(--space-5); margin-top: var(--space-6); }
  .mark { width: 100%; }
  .chapters { display: flex; justify-content: space-between; gap: var(--space-2); }
</style>
