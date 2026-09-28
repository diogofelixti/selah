<script lang="ts">
  import { ArrowLeft } from '@lucide/svelte'
  import ProgressBar from '../components/ProgressBar.svelte'
  import { longpress } from '../lib/actions/longpress'
  import { app, markRead, unmarkRead } from '../lib/app.svelte'
  import { getBook } from '../lib/bible/books'
  import { chapterRef } from '../lib/bible/refs'
  import { t } from '../lib/i18n/i18n.svelte'
  import { bookProgress, percent, readSet } from '../lib/progress/progress'

  let { book }: { book: string } = $props()

  const info = $derived(getBook(book)!)
  const set = $derived(readSet(app.readings))
  const count = $derived(bookProgress(set, info))
  const chapters = $derived(Array.from({ length: info.chapters }, (_, i) => i + 1))

  function toggle(chapter: number) {
    const ref = chapterRef(book, chapter)
    void (set.has(ref) ? unmarkRead(ref) : markRead(ref))
  }
</script>

<div class="page">
  <header class="page-head">
    <a class="back" href={info.testament === 'OT' ? '#/biblia' : '#/biblia/nt'}>
      <ArrowLeft size={18} aria-hidden="true" />{t('bible.title')}
    </a>
    <h1>{t(`books.${book}`)}</h1>
    <p class="muted">{t('bible.chaptersRead', { read: count.read, total: count.total })}</p>
    <ProgressBar value={percent(count)} />
  </header>

  <p class="hint muted">{t('bible.longPressHint')}</p>

  <ul class="grid">
    {#each chapters as chapter (chapter)}
      {@const isRead = set.has(chapterRef(book, chapter))}
      <li>
        <a
          href={`#/ler/${book}/${chapter}`}
          class:read={isRead}
          data-read={isRead}
          aria-label={t(isRead ? 'bible.chapterRead' : 'bible.chapterUnread', { n: chapter })}
          use:longpress={() => toggle(chapter)}
        >{chapter}</a>
      </li>
    {/each}
  </ul>
</div>

<style>
  .hint { font-size: 0.875rem; margin-bottom: var(--space-4); }
  .grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
    gap: var(--space-2);
  }
  .grid a {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    min-height: 44px;
    border-radius: var(--radius-s);
    border: 1px solid var(--border);
    background: var(--surface);
    font-weight: 550;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    touch-action: manipulation;
  }
  .grid a.read { background: var(--accent); border-color: var(--accent); color: var(--text); }
</style>
