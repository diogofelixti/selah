<script lang="ts">
  import TopicIcon from '../components/TopicIcon.svelte'
  import { locale, t } from '../lib/i18n/i18n.svelte'
  import { TOPICS } from '../lib/topics/topics'
</script>

<div class="page">
  <header class="page-head">
    <h1>{t('topics.title')}</h1>
    <p class="muted">{t('topics.intro')}</p>
  </header>

  <ul class="grid">
    {#each TOPICS as topic (topic.id)}
      <li>
        <a class="card" href={`#/temas/${topic.id}`}>
          <span class="icon"><TopicIcon name={topic.icon} /></span>
          <span>{topic.title[locale.lang]}</span>
        </a>
      </li>
    {/each}
  </ul>
</div>

<style>
  .grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--space-3);
  }
  .grid a { display: grid; gap: var(--space-3); min-height: 104px; align-content: space-between; font-weight: 550; }
  .icon { color: var(--accent-strong); }
</style>
