<script lang="ts">
  import { ArrowLeft } from '@lucide/svelte'
  import ProgressBar from '../components/ProgressBar.svelte'
  import { longpress } from '../lib/actions/longpress'
  import { app, markRead, unmarkRead } from '../lib/app.svelte'
  import { getBook } from '../lib/bible/books'
  import { chapterRef } from '../lib/bible/refs'
  import { t } from '../lib/i18n/i18n.svelte'
  import { PLANS } from '../lib/plans/catalog'
  import { isChapterDone } from '../lib/plans/status'
  import { bookProgress, percent, readSet } from '../lib/progress/progress'

  let { book }: { book: string } = $props()

  const info = $derived(getBook(book)!)
  const set = $derived(readSet(app.readings))
  const count = $derived(bookProgress(set, info))
  const chapters = $derived(Array.from({ length: info.chapters }, (_, i) => i + 1))

  const activePlan = $derived(
    app.state.activePlan ? { def: PLANS[app.state.activePlan.id], startedAt: app.state.activePlan.startedAt } : null,
  )

  // Mesma regra do leitor: com um plano ativo, um capítulo lido antes do plano ainda precisa ser marcado para o plano.
  // Assim, segurar um capítulo desses adiciona a leitura em vez de apagar o histórico.
  function toggle(chapter: number) {
    const ref = chapterRef(book, chapter)
    void (isChapterDone(ref, app.readings, activePlan) ? unmarkRead(ref) : markRead(ref))
  }
</script>

<div class="page">
  <header class="page-head">
    <a class="back" href={info.testament === 'OT' ? '#/biblia' : '#/biblia/nt'}>
      <ArrowLeft size={18} aria-hidden="true" />{t('bible.title')}
    </a>
    <h1>{t(`books.${book}`)}</h1>
    <p class="muted">{t('bible.chaptersRead', { read: count.read, total: count.total })}</p>
    <ProgressBar value={percent(count)} label={t(`books.${book}`)} />
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
    grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
    gap: var(--space-2);
  }
  .grid a {
    display: grid;
    place-items: center;
    min-height: 46px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface);
    font-weight: 550;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    touch-action: manipulation;
  }
  .grid a.read { background: var(--accent); border-color: var(--accent); color: var(--on-accent); font-weight: 700; }
</style>
