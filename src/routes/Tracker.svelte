<script lang="ts">
  import ProgressRing from '../components/ProgressRing.svelte'
  import { app, markMany, markRead, unmarkMany, unmarkRead } from '../lib/app.svelte'
  import { BOOKS, chapterRefs, type Testament } from '../lib/bible/books'
  import { chapterRef } from '../lib/bible/refs'
  import { locale, t } from '../lib/i18n/i18n.svelte'
  import { bibleProgress, bookProgress, percent, readSet, testamentProgress, unreadChapters } from '../lib/progress/progress'

  let testament = $state<Testament>('OT')
  let openBook = $state<string | null>(null)

  const numberFmt = $derived(new Intl.NumberFormat(locale.lang === 'pt' ? 'pt-BR' : 'en'))
  const set = $derived(readSet(app.readings))
  const total = $derived(bibleProgress(set))
  const books = $derived(BOOKS.filter((b) => b.testament === testament))

  function toggleBook(id: string) {
    openBook = openBook === id ? null : id
  }

  function toggleChapter(book: string, chapter: number) {
    const ref = chapterRef(book, chapter)
    void (set.has(ref) ? unmarkRead(ref) : markRead(ref))
  }

  function clearBook(book: string) {
    if (confirm(t('tracker.clearConfirm', { book: t(`books.${book}`) }))) void unmarkMany(chapterRefs(book))
  }
</script>

<div class="page">
  <header class="page-head">
    <div class="row">
      <div>
        <p class="eyebrow">{t('tracker.eyebrow')}</p>
        <h1>{t('tracker.title')}</h1>
      </div>
      <p class="big-number overall">{percent(total)}<small>%</small></p>
    </div>
    <p class="muted intro">{t('tracker.intro', { read: numberFmt.format(total.read), total: numberFmt.format(total.total) })}</p>
  </header>

  <div class="filters">
    <button class="pill pill-dark" aria-pressed={testament === 'OT'} onclick={() => (testament = 'OT')}>
      {t('tracker.ot', { percent: percent(testamentProgress(set, 'OT')) })}
    </button>
    <button class="pill pill-dark" aria-pressed={testament === 'NT'} onclick={() => (testament = 'NT')}>
      {t('tracker.nt', { percent: percent(testamentProgress(set, 'NT')) })}
    </button>
  </div>

  <ul class="books">
    {#each books as book (book.id)}
      {@const count = bookProgress(set, book)}
      {@const pct = percent(count)}
      <li class="book">
        <button class="book-row" aria-expanded={openBook === book.id} onclick={() => toggleBook(book.id)}>
          <span class="ring">
            <ProgressRing value={pct} />
            <span class="ring-label">{pct}</span>
          </span>
          <span class="book-text">
            <span class="name">{t(`books.${book.id}`)}</span>
            <span class="muted small">{t('tracker.bookCount', { read: count.read, total: count.total })}</span>
          </span>
        </button>
        {#if openBook === book.id}
          <div class="panel">
            <div class="chapters">
              {#each Array.from({ length: book.chapters }, (_, i) => i + 1) as chapter (chapter)}
                {@const isRead = set.has(chapterRef(book.id, chapter))}
                <button
                  class="pill chapter"
                  aria-pressed={isRead}
                  aria-label={t(isRead ? 'bible.chapterRead' : 'bible.chapterUnread', { n: chapter })}
                  onclick={() => toggleChapter(book.id, chapter)}
                >{chapter}</button>
              {/each}
            </div>
            <div class="actions">
              <button class="btn btn-dark grow" onclick={() => markMany(unreadChapters(book.id, set))}>{t('tracker.markAll')}</button>
              <button class="pill" onclick={() => clearBook(book.id)}>{t('tracker.clear')}</button>
            </div>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .row { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-3); }
  .overall { font-size: 2.5rem; }
  .intro { font-size: 0.875rem; line-height: 1.5; }
  .filters { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); }
  .books { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-3); }
  .book { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; }
  .book-row {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    width: 100%;
    padding: 14px 18px;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
  }
  .ring { position: relative; width: 44px; height: 44px; flex-shrink: 0; }
  .ring-label { position: absolute; inset: 0; display: grid; place-items: center; font-size: 0.6875rem; font-weight: 700; }
  .book-text { display: grid; gap: 2px; }
  .name { font-family: var(--font-display); font-size: 1.1875rem; }
  .small { font-size: 0.8125rem; }
  .panel { display: grid; gap: var(--space-4); padding: 2px 12px 16px; }
  /* 6 por linha com alvos de 45px mesmo num celular de 360px. */
  .chapters { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
  .chapter { min-height: 46px; padding: 0; font-weight: 500; }
  .actions { display: flex; gap: var(--space-3); }
  .grow { flex-grow: 1; }
</style>
