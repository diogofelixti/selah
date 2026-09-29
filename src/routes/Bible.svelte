<script lang="ts">
  import { Bookmark, Search } from '@lucide/svelte'
  import ProgressBar from '../components/ProgressBar.svelte'
  import { app } from '../lib/app.svelte'
  import { BOOKS, SECTIONS, type Testament } from '../lib/bible/books'
  import { t } from '../lib/i18n/i18n.svelte'
  import { bibleProgress, bookProgress, percent, readSet, testamentProgress } from '../lib/progress/progress'

  let { testament }: { testament: Testament } = $props()

  const TABS: { id: Testament; href: string }[] = [
    { id: 'OT', href: '#/biblia' },
    { id: 'NT', href: '#/biblia/nt' },
  ]

  const set = $derived(readSet(app.readings))
  const sections = $derived(SECTIONS.filter((s) => s.testament === testament))
</script>

<div class="page">
  <header class="page-head">
    <h1>{t('bible.title')}</h1>
    <p class="muted">{t('bible.overall', { percent: percent(bibleProgress(set)) })}</p>
  </header>

  <div class="tools">
    <a class="search-link" href="#/busca"><Search size={20} aria-hidden="true" />{t('search.title')}</a>
    <a class="marks-link" href="#/marcacoes" aria-label={t('marks.title')}><Bookmark size={20} aria-hidden="true" /></a>
  </div>

  <nav class="filters">
    {#each TABS as tab (tab.id)}
      <a class="pill pill-dark" href={tab.href} aria-current={tab.id === testament ? 'page' : undefined}>
        {t(tab.id === 'OT' ? 'tracker.ot' : 'tracker.nt', { percent: percent(testamentProgress(set, tab.id)) })}
      </a>
    {/each}
  </nav>

  {#each sections as section (section.id)}
    <section>
      <h2 class="section-title">{t(`sections.${section.id}`)}</h2>
      <ul class="books">
        {#each BOOKS.filter((b) => b.section === section.id) as book (book.id)}
          {@const count = bookProgress(set, book)}
          <li>
            <a href={`#/livro/${book.id}`}>
              <span class="name">{t(`books.${book.id}`)}</span>
              <span class="count muted">{count.read}/{count.total}</span>
              <span class="bar"><ProgressBar value={percent(count)} /></span>
            </a>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</div>

<style>
  .filters { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  .tools { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); }
  .marks-link {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 52px;
    height: 52px;
    border-radius: 999px;
    background: var(--surface);
    border: 1px solid var(--border-strong);
    color: var(--accent-text);
  }
  .search-link {
    flex-grow: 1;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-height: 52px;
    padding: 0 var(--space-4);
    border-radius: 999px;
    background: var(--surface);
    border: 1px solid var(--border-strong);
    color: var(--text-2);
  }
  .books { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-2); }
  .books a {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-2) var(--space-3);
    padding: var(--space-4);
    border-radius: 18px;
    background: var(--surface);
    border: 1px solid var(--border);
  }
  .books a:active { background: var(--surface-2); }
  .name { font-family: var(--font-display); font-size: 1.0625rem; }
  .count { font-size: 0.875rem; }
  .bar { grid-column: 1 / -1; }
</style>
