<script lang="ts">
  import { onMount } from 'svelte'
  import BottomNav from './components/BottomNav.svelte'
  import UpdateBanner from './components/UpdateBanner.svelte'
  import { app, initApp } from './lib/app.svelte'
  import { TRANSLATION_BY_LANG } from './lib/bible/loader'
  import { locale, t } from './lib/i18n/i18n.svelte'
  import { resolveLanguage } from './lib/i18n/lang'
  import { ensureOffline, initPwa } from './lib/pwa.svelte'
  import type { Route } from './lib/router'
  import { router } from './lib/router.svelte'
  import About from './routes/About.svelte'
  import Bible from './routes/Bible.svelte'
  import Book from './routes/Book.svelte'
  import Home from './routes/Home.svelte'
  import Plans from './routes/Plans.svelte'
  import Reader from './routes/Reader.svelte'
  import Settings from './routes/Settings.svelte'
  import Topic from './routes/Topic.svelte'
  import Topics from './routes/Topics.svelte'

  onMount(() => {
    initPwa()
    void initApp()
  })

  $effect(() => {
    const lang = resolveLanguage(app.settings.language, navigator.language)
    locale.lang = lang
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
  })

  $effect(() => {
    if (app.ready) void ensureOffline(TRANSLATION_BY_LANG[locale.lang])
  })

  $effect(() => {
    document.documentElement.dataset.theme = app.settings.theme
  })

  const route = $derived(router.route)

  $effect(() => {
    if (route.name !== 'reader') window.scrollTo(0, 0)
  })

  function tabFor(r: Route): 'home' | 'bible' | 'plans' | 'topics' | null {
    switch (r.name) {
      case 'home': return 'home'
      case 'bible': case 'book': return 'bible'
      case 'plans': return 'plans'
      case 'topics': case 'topic': return 'topics'
      default: return null
    }
  }
</script>

{#if app.ready}
  {#if !app.persistent}
    <p class="banner" role="status">{t('common.notPersistent')}</p>
  {/if}
  <main class:with-nav={route.name !== 'reader'}>
    {#if route.name === 'home'}
      <Home />
    {:else if route.name === 'bible'}
      <Bible testament={route.testament} />
    {:else if route.name === 'book'}
      <Book book={route.book} />
    {:else if route.name === 'reader'}
      {#key `${route.book}.${route.chapter}`}
        <Reader book={route.book} chapter={route.chapter} verse={route.verse} />
      {/key}
    {:else if route.name === 'plans'}
      <Plans />
    {:else if route.name === 'topics'}
      <Topics />
    {:else if route.name === 'topic'}
      <Topic id={route.id} />
    {:else if route.name === 'settings'}
      <Settings />
    {:else if route.name === 'about'}
      <About />
    {/if}
  </main>
  <UpdateBanner />
  {#if route.name !== 'reader'}
    <BottomNav active={tabFor(route)} />
  {/if}
{/if}
