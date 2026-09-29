<script lang="ts">
  import {
    ArrowLeft, ChevronLeft, ChevronRight, Copy, Headphones, Highlighter, Image as ImageIcon, Minus, NotebookPen, Pause, Play, Plus, Share2,
    Square, StickyNote, Type, X,
  } from '@lucide/svelte'
  import NoteDialog from '../components/NoteDialog.svelte'
  import { tick } from 'svelte'
  import { app, markRead, setMarks, unmarkRead, updateSettings, updateState } from '../lib/app.svelte'
  import { nextChapter, prevChapter } from '../lib/bible/books'
  import { formatSelection, selectionParts } from '../lib/bible/copy'
  import { splitImplied } from '../lib/bible/format'
  import { TRANSLATION_BY_LANG, bible } from '../lib/bible/loader'
  import { chapterRef } from '../lib/bible/refs'
  import type { BookText } from '../lib/bible/types'
  import { copyText } from '../lib/clipboard'
  import { shareOrDownload } from '../lib/share-image'
  import { fitsVerseImage, imageFilename, renderVerseImage } from '../lib/verse-image'
  import { showToast } from '../lib/toast.svelte'
  import { ui } from '../lib/ui.svelte'
  import { locale, t } from '../lib/i18n/i18n.svelte'
  import { PLANS } from '../lib/plans/catalog'
  import { isChapterDone } from '../lib/plans/status'
  import { canGoBack } from '../lib/router.svelte'
  import { SPEECH_RATES, browserEngine, createChapterSpeaker, type SpeakerState } from '../lib/speech'
  import { MARK_COLORS, type FontSize, type MarkColor, type VerseMark } from '../lib/storage/types'

  let { book, chapter, verse }: { book: string; chapter: number; verse?: number } = $props()

  let text = $state<BookText | null>(null)
  let failed = $state(false)
  let barHidden = $state(false)
  let flash = $state<number | null>(null)
  let lastY = 0
  let loadToken = 0
  let selected = $state<number[]>([])
  // Só um versículo por vez entra na ordem do Tab; as setas andam entre eles.
  let focusVerse = $state(1)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  let shareOpen = $state(false)
  // null: ainda calculando; false: não cabe na imagem.
  let imageFits = $state<boolean | null>(null)

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
    speaker?.stop()
    focusVerse = verse ?? 1
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

  // Marcações deste capítulo, por número do versículo.
  const chapterMarks = $derived.by(() => {
    const prefix = `${book}.${chapter}.`
    const map = new Map<number, VerseMark>()
    for (const m of app.marks) if (m.ref.startsWith(prefix)) map.set(Number(m.ref.slice(prefix.length)), m)
    return map
  })
  let colorsOpen = $state(false)
  // Cor em comum dos versículos selecionados (null se não houver uma só).
  const selectedColor = $derived.by(() => {
    const colors = new Set(selected.map((n) => chapterMarks.get(n)?.color ?? null))
    return colors.size === 1 ? [...colors][0] : null
  })

  function onKey(e: KeyboardEvent) {
    if (e.key !== 'Escape') return
    colorsOpen = false
    shareOpen = false
  }
  let noteVerse = $state<number | null>(null)
  const verseRef = (n: number) => `${book}.${chapter}.${n}`
  const verseLabel = (n: number) => `${t(`books.${book}`)} ${chapter}:${n}`

  async function highlight(color: MarkColor | null) {
    const refs = selected.map(verseRef)
    colorsOpen = false
    selected = []
    await setMarks(refs, { color })
  }

  function openNote(n: number) {
    colorsOpen = false
    noteVerse = n
  }

  async function saveNote(note: string) {
    const n = noteVerse
    noteVerse = null
    selected = []
    if (n !== null) await setMarks([verseRef(n)], { note })
  }

  async function deleteNote() {
    const n = noteVerse
    noteVerse = null
    selected = []
    if (n !== null) await setMarks([verseRef(n)], { note: '' })
  }

  // Leitura em voz alta: um controlador por abertura do leitor, criado no primeiro toque.
  const canSpeak = typeof window !== 'undefined' && !!window.speechSynthesis
  let speech = $state<SpeakerState>({ status: 'idle', verse: null, rate: 1 })
  let speaker: ReturnType<typeof createChapterSpeaker> | null = null
  const rateFmt = $derived(new Intl.NumberFormat(locale.lang === 'pt' ? 'pt-BR' : 'en'))

  function onSpeech(s: SpeakerState) {
    speech = s
    if (s.status === 'playing' && s.verse) {
      const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches
      document.getElementById(`v${s.verse}`)?.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' })
    }
  }

  function listen() {
    const engine = browserEngine(locale.lang === 'pt' ? 'pt-BR' : 'en-US')
    if (!engine) return
    speaker?.stop()
    speaker = createChapterSpeaker(engine, onSpeech)
    speaker.setRate(speech.rate)
    const from = selected.length > 0 ? Math.min(...selected) : 1
    selected = []
    speaker.play(verses.map((text, i) => ({ n: i + 1, text })), from)
  }

  function nextRate() {
    const i = SPEECH_RATES.indexOf(speech.rate as (typeof SPEECH_RATES)[number])
    speaker?.setRate(SPEECH_RATES[(i + 1) % SPEECH_RATES.length])
  }

  // Sair do leitor (ou trocar de capítulo, que recria o leitor) para a voz.
  $effect(() => () => speaker?.stop())

  // Enquanto uma barra do leitor ocupa o rodapé, o aviso de nova versão sai do caminho.
  $effect(() => {
    ui.readerBar = selected.length > 0 || speech.status !== 'idle'
    return () => (ui.readerBar = false)
  })

  function toggleVerse(n: number) {
    focusVerse = n
    selected = selected.includes(n) ? selected.filter((v) => v !== n) : [...selected, n]
  }

  function onVerseClick(e: MouseEvent, n: number) {
    // Quem está selecionando texto para copiar pelo sistema não quer marcar o versículo.
    const sel = getSelection()
    if (sel && !sel.isCollapsed && sel.containsNode(e.currentTarget as Node, true)) return
    toggleVerse(n)
  }

  function moveFocus(from: number, step: 1 | -1) {
    for (let v = from + step; v >= 1 && v <= verses.length; v += step) {
      if (verses[v - 1]) {
        focusVerse = v
        document.getElementById(`v${v}`)?.focus()
        return
      }
    }
  }

  function onVerseKey(e: KeyboardEvent, n: number) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleVerse(n)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      moveFocus(n, 1)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      moveFocus(n, -1)
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

  async function copySelection() {
    const ok = await copyText(selectionText())
    showToast(t(ok ? 'copy.done' : 'copy.failed'))
    if (ok) selected = []
  }

  // Mudou a seleção: as opções abertas (e o "cabe na imagem") deixam de valer.
  $effect(() => {
    void selected.join()
    shareOpen = false
    if (selected.length === 0) colorsOpen = false
  })

  function parts() {
    return selectionParts({ book, chapter, verses: selected, texts: verses, bookName: (id) => t(`books.${id}`) })
  }

  async function toggleShare() {
    colorsOpen = false
    shareOpen = !shareOpen
    if (!shareOpen) return
    imageFits = null
    const p = parts()
    imageFits = p ? await fitsVerseImage(p.body) : false
  }

  async function shareText() {
    shareOpen = false
    // Sem compartilhamento nativo, "Texto" copia.
    if (!canShare) return copySelection()
    try {
      await navigator.share({ text: selectionText() })
      selected = []
    } catch (err) {
      // Cancelar é normal e fica em silêncio; qualquer outro erro vira aviso.
      if (!(err instanceof DOMException && err.name === 'AbortError')) showToast(t('copy.shareFailed'))
    }
  }

  async function shareImage() {
    const p = parts()
    if (!p) return
    const css = getComputedStyle(document.documentElement)
    const color = (name: string) => css.getPropertyValue(name).trim()
    const blob = await renderVerseImage({
      text: p.body,
      reference: `${p.reference} · ${TRANSLATION_BY_LANG[locale.lang]}`,
      colors: { bg: color('--bg'), text: color('--text'), accent: color('--accent-text') },
    })
    if (!blob) return showToast(t('image.tooLong'))
    try {
      const result = await shareOrDownload(blob, imageFilename(book, chapter, p.verses, (id) => t(`books.${id}`)))
      if (result === 'downloaded') showToast(t('image.saved'))
      if (result !== 'cancelled') {
        shareOpen = false
        selected = []
      }
    } catch {
      showToast(t('copy.shareFailed'))
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

<svelte:window onscroll={onScroll} onkeydown={onKey} />

<header class="bar" class:hidden={barHidden}>
  <button class="icon-btn" onclick={back} aria-label={t('common.back')}><ArrowLeft size={22} /></button>
  <a class="where" href={`#/livro/${book}`}>{t(`books.${book}`)} {chapter}</a>
  <div class="font">
    {#if canSpeak}
      {#if speech.status === 'idle'}
        <button class="icon-btn" onclick={listen} aria-label={t('speech.listen')}><Headphones size={20} /></button>
      {:else}
        <button class="icon-btn listening" onclick={() => speaker?.stop()} aria-label={t('speech.stopListening')}><Headphones size={20} /></button>
      {/if}
    {/if}
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
            class:speaking={speech.verse === i + 1}
            data-mark={chapterMarks.get(i + 1)?.color ?? undefined}
            role="button"
            tabindex={focusVerse === i + 1 ? 0 : -1}
            aria-pressed={selected.includes(i + 1)}
            onclick={(e) => onVerseClick(e, i + 1)}
            onkeydown={(e) => onVerseKey(e, i + 1)}
          >
            <sup>{i + 1}</sup>{#each splitImplied(content) as part, j (j)}{#if part.implied}<em>{part.text}</em>{:else}{part.text}{/if}{/each}
          </span>
          {#if chapterMarks.get(i + 1)?.note}
            <button class="note-btn" onclick={() => openNote(i + 1)} aria-label={t('marks.openNote', { ref: verseLabel(i + 1) })}>
              <StickyNote size={14} aria-hidden="true" />
            </button>
          {/if}
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

{#if speech.status !== 'idle' && selected.length === 0}
  <div class="selection-bar speech-bar" role="toolbar" aria-label={t('speech.toolbar')}>
    <span class="count" aria-live="polite">
      {speech.status === 'paused' ? t('speech.paused', { n: speech.verse ?? 0 }) : t('speech.reading', { n: speech.verse ?? 0 })}
    </span>
    {#if speech.status === 'playing'}
      <button class="icon-btn" onclick={() => speaker?.pause()} aria-label={t('speech.pause')}><Pause size={20} /></button>
    {:else}
      <button class="icon-btn" onclick={() => speaker?.resume()} aria-label={t('speech.resume')}><Play size={20} /></button>
    {/if}
    <button class="pill rate" onclick={nextRate} aria-label={t('speech.rate', { rate: rateFmt.format(speech.rate) })}>{rateFmt.format(speech.rate)}×</button>
    <button class="icon-btn" onclick={() => speaker?.stop()} aria-label={t('speech.stop')}><Square size={18} /></button>
  </div>
{/if}

{#if selected.length > 0 && shareOpen}
  <div class="colors share-options" role="group" aria-label={t('image.options')}>
    <button class="pill" onclick={shareText}><Type size={18} aria-hidden="true" />{t('image.text')}</button>
    <button class="pill" onclick={shareImage} disabled={imageFits !== true}><ImageIcon size={18} aria-hidden="true" />{t('image.image')}</button>
    {#if imageFits === false}
      <p class="hint muted">{t('image.tooLong')}</p>
    {/if}
  </div>
{/if}

{#if selected.length > 0 && colorsOpen}
  <div class="colors" role="group" aria-label={t('marks.colors')}>
    {#each MARK_COLORS as color (color)}
      <button class="swatch" data-color={color} aria-pressed={selectedColor === color} onclick={() => highlight(color)} aria-label={t(`marks.${color}`)}></button>
    {/each}
    <button class="pill" onclick={() => highlight(null)}>{t('marks.clear')}</button>
  </div>
{/if}

{#if selected.length > 0}
  <div class="selection-bar" role="toolbar" aria-label={t('copy.toolbar')}>
    <span class="count" aria-live="polite">{selected.length === 1 ? t('copy.countOne') : t('copy.countMany', { n: selected.length })}</span>
    <button class="icon-btn filled" onclick={copySelection} aria-label={t('copy.copy')}><Copy size={18} /></button>
    <button class="icon-btn" onclick={() => ((shareOpen = false), (colorsOpen = !colorsOpen))} aria-expanded={colorsOpen} aria-label={t('marks.highlight')}>
      <Highlighter size={20} />
    </button>
    {#if selected.length === 1}
      <button class="icon-btn" onclick={() => openNote(selected[0])} aria-label={t('marks.note')}><NotebookPen size={20} /></button>
    {/if}
    <button class="icon-btn" onclick={toggleShare} aria-expanded={shareOpen} aria-label={t('copy.share')}><Share2 size={20} /></button>
    <button class="icon-btn" onclick={() => ((selected = []), (colorsOpen = false), (shareOpen = false))} aria-label={t('copy.cancel')}><X size={20} /></button>
  </div>
{/if}

{#if noteVerse !== null}
  <NoteDialog
    title={t('marks.noteTitle', { ref: verseLabel(noteVerse) })}
    initial={chapterMarks.get(noteVerse)?.note ?? ''}
    onSave={saveNote}
    onDelete={deleteNote}
    onClose={() => (noteVerse = null)}
  />
{/if}

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
  /* Selecionado: contorno tracejado e sublinhado, sem fundo, para não se confundir com os destaques coloridos. */
  .verse.selected { box-shadow: inset 0 -2px 0 var(--accent); outline: 2px dashed var(--accent); outline-offset: 1px; animation: none; }
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
  /* Os botões mantêm 44px; quem encolhe é o texto da contagem. */
  .selection-bar > button { flex-shrink: 0; }
  .listening { background: var(--flash); color: var(--accent-text); }
  .count { flex-grow: 1; min-width: 0; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .filled { background: var(--text); color: var(--bg); }
  .verse[data-mark='gold'] { background: var(--mark-gold); }
  .verse[data-mark='green'] { background: var(--mark-green); }
  .verse[data-mark='blue'] { background: var(--mark-blue); }
  .note-btn {
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    margin: 0 2px;
    vertical-align: middle;
    border: 0;
    border-radius: 999px;
    background: var(--surface-2);
    color: var(--accent-text);
    cursor: pointer;
  }
  /* Área de toque de 44px sem empurrar o texto. */
  .note-btn { position: relative; }
  .note-btn::after { content: ''; position: absolute; inset: -8px; }
  .colors {
    position: fixed;
    left: 14px;
    right: 14px;
    bottom: calc(92px + env(safe-area-inset-bottom));
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-l);
    box-shadow: var(--shadow);
    max-width: 40rem;
    margin: 0 auto;
    z-index: 2;
  }
  .colors { gap: var(--space-2); }
  .share-options { flex-wrap: wrap; }
  .share-options .pill { flex-grow: 1; }
  .share-options .pill:disabled { opacity: 0.45; cursor: default; }
  .hint { flex-basis: 100%; font-size: 0.8125rem; margin: 0; }
  .colors .pill { padding: 0 var(--space-3); white-space: nowrap; flex-shrink: 0; }
  .swatch { flex-shrink: 0; width: 44px; height: 44px; border-radius: 999px; border: 2px solid var(--border-strong); cursor: pointer; }
  .swatch[aria-pressed='true'] { border-color: var(--accent-text); box-shadow: 0 0 0 3px var(--surface), 0 0 0 5px var(--accent-text); }
  .swatch[data-color='gold'] { background: var(--mark-gold); }
  .swatch[data-color='green'] { background: var(--mark-green); }
  .swatch[data-color='blue'] { background: var(--mark-blue); }
  .rate { min-width: 64px; padding: 0 var(--space-3); }
  /* Versículo sendo lido: contorno, diferente da seleção (fundo) e do destaque por link. */
  .verse.speaking { outline: 2px solid var(--accent); outline-offset: 2px; }
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
