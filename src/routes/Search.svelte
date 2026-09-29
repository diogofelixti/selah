<script lang="ts">
  import { Search as SearchIcon } from '@lucide/svelte'
  import { untrack } from 'svelte'
  import type { Testament } from '../lib/bible/books'
  import { TRANSLATION_BY_LANG } from '../lib/bible/loader'
  import { formatRef } from '../lib/bible/refs'
  import { locale, t } from '../lib/i18n/i18n.svelte'
  import { highlightParts, searchTerms, searchVerses, type IndexedVerse } from '../lib/search'
  import { getIndex } from '../lib/search-index'

  let { query: initial }: { query: string } = $props()

  // O termo da rota só preenche o campo na abertura; depois quem manda é a digitação.
  let query = $state(untrack(() => initial))
  let debounced = $state(untrack(() => initial))
  let testament = $state<Testament | null>(null)
  // raw: 31 mil versículos não precisam ser reativos um a um (isso travava a tela a cada busca).
  let index = $state.raw<IndexedVerse[] | null>(null)
  let missing = $state(0)
  let progress = $state({ done: 0, total: 66 })
  let loadToken = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  // Desenhar muitos resultados de uma vez trava celulares fracos: mostra 50 por vez.
  const PAGE = 50
  let visible = $state(PAGE)

  const bookName = (id: string) => t(`books.${id}`)
  const numberFmt = $derived(new Intl.NumberFormat(locale.lang === 'pt' ? 'pt-BR' : 'en'))
  const terms = $derived(searchTerms(debounced))
  const tooShort = $derived(debounced.trim().length > 0 && terms.length === 0)
  const found = $derived(index && terms.length > 0 ? searchVerses(index, debounced, { testament: testament ?? undefined }) : null)

  // Nova busca ou novo filtro volta para a primeira página.
  $effect(() => {
    void debounced
    void testament
    visible = PAGE
  })

  async function loadIndex() {
    const token = ++loadToken
    index = null
    missing = 0
    const result = await getIndex(TRANSLATION_BY_LANG[locale.lang], (done, total) => {
      if (token === loadToken) progress = { done, total }
    })
    if (token !== loadToken) return
    index = result.index
    missing = result.missing
  }

  $effect(() => {
    void locale.lang
    void loadIndex()
  })

  // Sair da tela cancela a atualização pendente do endereço, para não sobrescrever a tela seguinte.
  $effect(() => () => clearTimeout(timer))

  function onInput() {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced = query
      // Guarda o termo no endereço (sem criar entrada nova no histórico) para o voltar do leitor.
      history.replaceState(history.state, '', `#/busca/${encodeURIComponent(query.trim())}`)
    }, 250)
  }

  const FILTERS: { id: Testament | null; label: string }[] = [
    { id: null, label: 'search.all' },
    { id: 'OT', label: 'search.ot' },
    { id: 'NT', label: 'search.nt' },
  ]
</script>

<div class="page">
  <header class="page-head">
    <h1>{t('search.title')}</h1>
  </header>

  <label class="field">
    <SearchIcon size={20} aria-hidden="true" />
    <span class="sr-only">{t('search.title')}</span>
    <!-- svelte-ignore a11y_autofocus -->
    <input
      type="search"
      bind:value={query}
      oninput={onInput}
      placeholder={t('search.placeholder')}
      autocomplete="off"
      autofocus={!initial}
    />
  </label>

  <div class="filters">
    {#each FILTERS as f (f.label)}
      <button class="pill pill-dark" aria-pressed={testament === f.id} onclick={() => (testament = f.id)}>{t(f.label)}</button>
    {/each}
  </div>

  {#if missing > 0}
    <p class="notice" role="status">
      {t('search.missing')}
      <button class="btn" onclick={() => loadIndex()}>{t('common.retry')}</button>
    </p>
  {/if}

  <div class="status muted" aria-live="polite">
    {#if !index}
      {t('search.preparing', { done: progress.done, total: progress.total })}
    {:else if tooShort}
      {t('search.minLetters')}
    {:else if !found}
      {t('search.hint')}
    {:else if found.total === 0}
      {t('search.none')}
    {:else if found.total > found.results.length}
      {t('search.limited', { shown: numberFmt.format(found.results.length), total: numberFmt.format(found.total) })}
    {:else}
      {found.total === 1 ? t('search.countOne') : t('search.count', { n: numberFmt.format(found.total) })}
    {/if}
  </div>

  {#if found && found.results.length > 0}
    <ul class="results">
      {#each found.results.slice(0, visible) as v (`${v.book}.${v.chapter}.${v.verse}`)}
        <li>
          <a href={`#/ler/${v.book}/${v.chapter}/${v.verse}`}>
            <span class="ref">{formatRef(`${v.book}.${v.chapter}.${v.verse}`, bookName)}</span>
            <span class="text">{#each highlightParts(v.text, terms) as part, i (i)}{#if part.hit}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}</span>
          </a>
        </li>
      {/each}
    </ul>
    {#if found.results.length > visible}
      <button class="btn more" onclick={() => (visible += PAGE)}>{t('search.more')}</button>
    {/if}
  {/if}
</div>

<style>
  .field {
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
  .field input {
    flex-grow: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    color: var(--text);
    font: inherit;
    font-size: 1.0625rem;
    outline: none;
  }
  .field:focus-within { outline: 2px solid var(--accent-text); outline-offset: 2px; }
  .filters { display: flex; flex-wrap: wrap; gap: var(--space-2); margin: var(--space-4) 0; }
  .notice { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-radius: var(--radius-m); background: var(--surface-2); font-size: 0.875rem; }
  .status { font-size: 0.875rem; margin-bottom: var(--space-3); }
  .results { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-2); }
  .results a { display: grid; gap: var(--space-1); padding: var(--space-4); border-radius: 18px; background: var(--surface); border: 1px solid var(--border); }
  .ref { font-weight: 700; font-size: 0.875rem; color: var(--accent-text); }
  .text { font-family: var(--font-read); line-height: 1.55; }
  .more { width: 100%; margin-top: var(--space-4); }
  mark { background: var(--flash); color: inherit; border-radius: 3px; padding: 0 1px; }
</style>
