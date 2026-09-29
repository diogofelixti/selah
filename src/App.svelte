<script lang="ts">
  import { onMount } from 'svelte'
  import BottomNav from './components/BottomNav.svelte'
  import Toast from './components/Toast.svelte'
  import UpdateBanner from './components/UpdateBanner.svelte'
  import { app, initApp, updateSettings } from './lib/app.svelte'
  import { TRANSLATION_BY_LANG } from './lib/bible/loader'
  import { locale, t } from './lib/i18n/i18n.svelte'
  import { resolveLanguage } from './lib/i18n/lang'
  import { localDayKey } from './lib/progress/progress'
  import { disableReminder, refreshReminder, reportReadToday } from './lib/reminder'
  import { account, loadAccountConfig, restoreSession, syncNow } from './lib/sync/account.svelte'
  import { rememberTheme, resolveTheme } from './lib/theme'
  import { applyUpdate, dismissUpdate, ensureOffline, initPwa, onResume, pwa } from './lib/pwa.svelte'
  import type { Route } from './lib/router'
  import { router } from './lib/router.svelte'
  import { ui } from './lib/ui.svelte'
  import About from './routes/About.svelte'
  import Bible from './routes/Bible.svelte'
  import Book from './routes/Book.svelte'
  import Home from './routes/Home.svelte'
  import Plans from './routes/Plans.svelte'
  import Reader from './routes/Reader.svelte'
  import Settings from './routes/Settings.svelte'
  import Topic from './routes/Topic.svelte'
  import Marks from './routes/Marks.svelte'
  import Search from './routes/Search.svelte'
  import Topics from './routes/Topics.svelte'
  import Tracker from './routes/Tracker.svelte'

  onMount(() => {
    initPwa()
    restoreSession()
    void initApp()
    void loadAccountConfig()
  })

  // Com conta: sincroniza ao abrir, 3 s depois de cada mudança e ao voltar ao app ou à internet.
  let syncTimer: ReturnType<typeof setTimeout> | undefined
  $effect(() => {
    void app.changes
    void resumeTick
    if (!app.ready || !account.token) return
    clearTimeout(syncTimer)
    syncTimer = setTimeout(() => void syncNow(), 3000)
    return () => clearTimeout(syncTimer)
  })
  let syncedOnOpen = false
  $effect(() => {
    if (!app.ready || !account.token || syncedOnOpen) return
    syncedOnOpen = true
    void syncNow()
  })

  $effect(() => {
    const lang = resolveLanguage(app.settings.language, navigator.language)
    locale.lang = lang
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
  })

  $effect(() => {
    if (app.ready) ensureOffline(TRANSLATION_BY_LANG[locale.lang])
  })

  // Lembrete ligado: ao abrir, confirma a inscrição e atualiza fuso e idioma no servidor (uma vez por abertura).
  let reminderChecked = false
  $effect(() => {
    if (!app.ready || reminderChecked || !app.settings.reminder.enabled) return
    reminderChecked = true
    const { time } = app.settings.reminder
    void refreshReminder(time, locale.lang).then((ok) => {
      // Permissão retirada nas configurações do aparelho: o lembrete aparece desligado.
      if (!ok) void updateSettings({ reminder: { enabled: false, time } })
    })
  })

  // Lembrete desligado (pela tela, ao apagar os dados, ao importar backup ou com permissão retirada):
  // se o aparelho ainda tem inscrição de push, cancela. Se falhar sem internet, tenta na próxima abertura.
  $effect(() => {
    if (app.ready && !app.settings.reminder.enabled) void disableReminder()
  })

  // Volta ao app ou volta a internet: tenta de novo o aviso de "já leu hoje" que possa ter falhado.
  let resumeTick = $state(0)
  $effect(() => {
    const bump = () => resumeTick++
    window.addEventListener('online', bump)
    return () => window.removeEventListener('online', bump)
  })

  // Leu hoje com o lembrete ligado: o servidor não manda o lembrete de hoje (só a data vai).
  $effect(() => {
    void resumeTick
    if (!app.ready || !app.settings.reminder.enabled) return
    const today = localDayKey(Date.now())
    if (app.readings.some((r) => localDayKey(r.readAt) === today)) {
      void reportReadToday(today, app.settings.reminder.time, locale.lang)
    }
  })

  let prefersDark = $state(matchMedia('(prefers-color-scheme: dark)').matches)
  $effect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => (prefersDark = media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  })

  $effect(() => {
    // Até os ajustes salvos chegarem, vale o tema que o index.html já aplicou (sem piscar o padrão).
    if (!app.ready) return
    const root = document.documentElement
    root.dataset.theme = resolveTheme(app.settings.theme, prefersDark)
    // Ajustes de memória (banco bloqueado ou indisponível) são o padrão, não a escolha da pessoa.
    if (app.persistent && !app.blocked) rememberTheme(app.settings.theme)
    // A barra do navegador acompanha o fundo do tema.
    const bg = getComputedStyle(root).getPropertyValue('--bg').trim()
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
  })

  const route = $derived(router.route)

  function onVisibility() {
    if (document.visibilityState === 'visible') {
      onResume()
      resumeTick++
    }
  }

  $effect(() => {
    if (route.name !== 'reader') window.scrollTo(0, 0)
  })

  function tabFor(r: Route): 'home' | 'read' | 'tracker' | 'plans' | 'topics' | null {
    switch (r.name) {
      case 'home': return 'home'
      case 'bible': case 'book': case 'search': case 'marks': return 'read'
      case 'tracker': return 'tracker'
      case 'plans': return 'plans'
      case 'topics': case 'topic': return 'topics'
      default: return null
    }
  }
</script>

<svelte:window ononline={onResume} />
<svelte:document onvisibilitychange={onVisibility} />

{#if app.ready}
  {#if app.blocked}
    <p class="banner" role="status">{t('common.storageBlocked')}</p>
  {:else if !app.persistent}
    <p class="banner" role="status">{t('common.notPersistent')}</p>
  {/if}
  {#if app.saveError}
    <p class="banner" role="alert">{t('common.saveError')}</p>
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
    {:else if route.name === 'search'}
      <Search query={route.query} />
    {:else if route.name === 'marks'}
      <Marks />
    {:else if route.name === 'tracker'}
      <Tracker />
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
  {#if pwa.needRefresh && !pwa.dismissed && !ui.readerBar}
    <UpdateBanner withNav={route.name !== 'reader'} onUpdate={applyUpdate} onDismiss={dismissUpdate} />
  {/if}
  <Toast />
  {#if route.name !== 'reader'}
    <BottomNav active={tabFor(route)} />
  {/if}
{/if}
