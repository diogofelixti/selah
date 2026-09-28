<script lang="ts">
  import { ArrowLeft } from '@lucide/svelte'
  import TopicIcon from '../components/TopicIcon.svelte'
  import { TRANSLATION_BY_LANG, bible } from '../lib/bible/loader'
  import { formatRef, parseRef } from '../lib/bible/refs'
  import { locale, t } from '../lib/i18n/i18n.svelte'
  import { getTopic } from '../lib/topics/topics'

  let { id }: { id: string } = $props()

  const topic = $derived(getTopic(id)!)
  const bookName = (bookId: string) => t(`books.${bookId}`)

  let texts = $state<Record<string, string>>({})
  let failed = $state(false)
  let loadToken = 0

  async function load() {
    const token = ++loadToken
    const tr = TRANSLATION_BY_LANG[locale.lang]
    const refs = topic.refs
    failed = false
    texts = {}
    try {
      const entries = await Promise.all(
        refs.map(async (ref) => {
          const p = parseRef(ref)!
          return [ref, await bible.getVerse(tr, p.book, p.chapter, p.verse!)] as const
        }),
      )
      if (token === loadToken) texts = Object.fromEntries(entries)
    } catch {
      if (token === loadToken) failed = true
    }
  }

  $effect(() => {
    void locale.lang
    void id
    void load()
  })

  function hrefFor(ref: string) {
    const p = parseRef(ref)!
    return `#/ler/${p.book}/${p.chapter}/${p.verse}`
  }
</script>

<div class="page">
  <header class="page-head">
    <a class="back" href="#/temas"><ArrowLeft size={18} aria-hidden="true" />{t('topics.title')}</a>
    <span class="icon"><TopicIcon name={topic.icon} size={28} /></span>
    <h1>{topic.title[locale.lang]}</h1>
    <p class="intro">{topic.intro[locale.lang]}</p>
  </header>

  {#if failed}
    <div class="state">
      <p>{t('topics.loadError')}</p>
      <button class="btn" onclick={() => load()}>{t('common.retry')}</button>
    </div>
  {:else}
    <ul class="stack verses">
      {#each topic.refs as ref (ref)}
        <li>
          <a class="card" href={hrefFor(ref)}>
            <blockquote>{texts[ref] ?? ''}</blockquote>
            <span class="ref">{formatRef(ref, bookName)}</span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .icon { color: var(--accent); }
  .intro { font-size: 1.0625rem; line-height: 1.6; color: var(--text-2); }
  .verses { list-style: none; margin: 0; padding: 0; }
  .verses a { display: grid; gap: var(--space-2); }
  blockquote { margin: 0; font-family: var(--font-display); font-size: 1.125rem; line-height: 1.6; min-height: 1.6em; }
  .ref { color: var(--text-2); font-size: 0.875rem; }
  .state { display: grid; gap: var(--space-4); justify-items: start; }
</style>
