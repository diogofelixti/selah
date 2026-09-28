<script lang="ts">
  import ProgressBar from '../components/ProgressBar.svelte'
  import { app } from '../lib/app.svelte'
  import { BOOKS, SECTIONS, type Testament } from '../lib/bible/books'
  import { t } from '../lib/i18n/i18n.svelte'
  import { bibleProgress, bookProgress, percent, readSet, testamentProgress } from '../lib/progress/progress'

  let { testament }: { testament: Testament } = $props()

  const TABS: { id: Testament; href: string; label: string }[] = [
    { id: 'OT', href: '#/biblia', label: 'bible.ot' },
    { id: 'NT', href: '#/biblia/nt', label: 'bible.nt' },
  ]

  const set = $derived(readSet(app.readings))
  const sections = $derived(SECTIONS.filter((s) => s.testament === testament))
</script>

<div class="page">
  <header class="page-head">
    <h1>{t('bible.title')}</h1>
    <p class="muted">{t('bible.overall', { percent: percent(bibleProgress(set)) })}</p>
  </header>

  <nav class="tabs">
    {#each TABS as tab (tab.id)}
      <a href={tab.href} aria-current={tab.id === testament ? 'page' : undefined}>
        <span>{t(tab.label)}</span>
        <small>{percent(testamentProgress(set, tab.id))}%</small>
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
  .tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
    padding: var(--space-1);
    background: var(--surface-2);
    border-radius: var(--radius-m);
  }
  .tabs a {
    display: grid;
    justify-items: center;
    min-height: 44px;
    padding: var(--space-2);
    border-radius: calc(var(--radius-m) - 4px);
    color: var(--text-2);
    font-weight: 550;
  }
  .tabs a[aria-current='page'] { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }
  .tabs small { font-size: 0.75rem; }
  .books { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-1); }
  .books a {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-1) var(--space-3);
    padding: var(--space-3) var(--space-2);
    border-radius: var(--radius-s);
  }
  .books a:active { background: var(--surface-2); }
  .name { font-weight: 500; }
  .count { font-size: 0.875rem; }
  .bar { grid-column: 1 / -1; }
</style>
