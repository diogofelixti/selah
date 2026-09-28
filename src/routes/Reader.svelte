<script lang="ts">
  import { ArrowLeft, ChevronLeft, ChevronRight, Copy, Minus, Plus, Share2, X } from '@lucide/svelte'
  import { tick } from 'svelte'
  import Toast from '../components/Toast.svelte'
  import { app, markRead, unmarkRead, updateSettings, updateState } from '../lib/app.svelte'
  import { nextChapter, prevChapter } from '../lib/bible/books'
  import { formatSelection } from '../lib/bible/copy'
  import { splitImplied } from '../lib/bible/format'
  import { TRANSLATION_BY_LANG, bible } from '../lib/bible/loader'
  import { chapterRef } from '../lib/bible/refs'
  import type { BookText } from '../lib/bible/types'
  import { copyText } from '../lib/clipboard'
  import { locale, t } from '../lib/i18n/i18n.svelte'
  import { PLANS } from '../lib/plans/catalog'
  import { isChapterDone } from '../lib/plans/status'
  import { canGoBack } from '../lib/router.svelte'
  import type { FontSize } from '../lib/storage/types'

  let { book, chapter, verse }: { book: string; chapter: number; verse?: number } = $props()

  let text = $state<BookText | null>(null)
  let failed = $state(false)
  let barHidden = $state(false)
  let flash = $state<number | null>(null)
  let lastY = 0
  let loadToken = 0
  let selected = $state<number[]>([])
  let toast = $state<string | null>(null)
  let toastTimer: ReturnType<typeof setTimeout> | undefined
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

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
    selected = []
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

  function toggleVerse(n: number) {
    selected = selected.includes(n) ? selected.filter((v) => v !== n) : [...selected, n]
  }

  function onVerseKey(e: KeyboardEvent, n: number) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleVerse(n)
    }
  }

  function selectionText() {
    return formatSelection({
      book,
      chapter,
      verses: selected,
      texts: verses,
      bookName: (id) => t(`books.${id}`),
      translation: TRANSLATION_BY_LANG[locale.lang],
    })
  }

  function showToast(message: string) {
    toast = message
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toast = null), 2000)
  }

  async function copySelection() {
    const ok = await copyText(selectionText())
    showToast(t(ok ? 'copy.done' : 'copy.failed'))
    if (ok) selected = []
  }

  async function shareSelection() {
    try {
      await navigator.share({ text: selectionText() })
      selected = []
    } catch {
      // Cancelado pela pessoa: mantém a seleção.
    }
  }

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
    if (canGoBack()) history.back()
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
          <span
            id={`v${i + 1}`}
            class="verse"
            class:flash={flash === i + 1}
            class:selected={selected.includes(i + 1)}
            role="button"
            tabindex="0"
            aria-pressed={selected.includes(i + 1)}
            onclick={() => toggleVerse(i + 1)}
            onkeydown={(e) => onVerseKey(e, i + 1)}
          >
            <sup>{i + 1}</sup>{#each splitImplied(content) as part, j (j)}{#if part.implied}<em>{part.text}</em>{:else}{part.text}{/if}{/each}
          </span>
        {/if}
      {/each}
    </div>

    <div class="end">
      <button class="btn mark" class:btn-dark={!done} aria-pressed={done} onclick={toggleDone}>
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
          <a class="btn" class:btn-dark={done} href={`#/ler/${next.book}/${next.chapter}`}>
            {t('reader.next')}<ChevronRight size={18} aria-hidden="true" />
          </a>
        {/if}
      </nav>
    </div>
  {/if}
</article>

{#if selected.length > 0}
  <div class="selection-bar" role="toolbar" aria-label={t('copy.copy')}>
    <span class="count">{selected.length === 1 ? t('copy.countOne') : t('copy.countMany', { n: selected.length })}</span>
    <button class="btn btn-dark" onclick={copySelection}><Copy size={18} aria-hidden="true" />{t('copy.copy')}</button>
    {#if canShare}
      <button class="icon-btn" onclick={shareSelection} aria-label={t('copy.share')}><Share2 size={20} /></button>
    {/if}
    <button class="icon-btn" onclick={() => (selected = [])} aria-label={t('copy.cancel')}><X size={20} /></button>
  </div>
{/if}
<Toast message={toast} />

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
  .reader h1 { font-family: var(--font-display); font-weight: 500; margin-bottom: var(--space-5); }
  .num { color: var(--accent-text); }
  .text { font-family: var(--font-read); line-height: 1.75; }
  .verse { padding: 2px 0; cursor: pointer; border-radius: 4px; -webkit-tap-highlight-color: transparent; }
  .verse.selected { background: var(--flash); box-shadow: 0 0 0 2px var(--flash); }
  .selection-bar {
    position: fixed;
    left: 14px;
    right: 14px;
    bottom: calc(16px + env(safe-area-inset-bottom));
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-l);
    box-shadow: var(--shadow);
    max-width: 40rem;
    margin: 0 auto;
    z-index: 2;
  }
  .count { flex-grow: 1; font-weight: 600; }
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
  .end { display: grid; gap: var(--space-5); margin: var(--space-6) 0 96px; }
  .mark { width: 100%; }
  .chapters { display: flex; justify-content: space-between; gap: var(--space-2); }
</style>
