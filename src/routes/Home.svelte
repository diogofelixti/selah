<script lang="ts">
  import { BookOpen, Settings as SettingsIcon } from '@lucide/svelte'
  import ProgressBar from '../components/ProgressBar.svelte'
  import { app } from '../lib/app.svelte'
  import { TRANSLATION_BY_LANG, bible } from '../lib/bible/loader'
  import { formatRef, parseRef } from '../lib/bible/refs'
  import { tipOfTheDay, verseOfTheDay } from '../lib/daily/daily'
  import { locale, t } from '../lib/i18n/i18n.svelte'
  import { PLANS } from '../lib/plans/catalog'
  import { planStatus } from '../lib/plans/status'
  import { bibleProgress, daysWithReading, percent, readSet } from '../lib/progress/progress'

  const today = new Date()
  const hour = today.getHours()
  const greetingKey = hour < 12 ? 'home.greeting.morning' : hour < 18 ? 'home.greeting.afternoon' : 'home.greeting.evening'
  const verseRef = verseOfTheDay(today)
  const tip = tipOfTheDay(today)
  const bookName = (id: string) => t(`books.${id}`)

  let verseText = $state<string | null>(null)
  let verseFailed = $state(false)
  let verseToken = 0

  async function loadVerse() {
    const token = ++verseToken
    const tr = TRANSLATION_BY_LANG[locale.lang]
    const p = parseRef(verseRef)!
    verseText = null
    verseFailed = false
    try {
      const text = await bible.getVerse(tr, p.book, p.chapter, p.verse!)
      if (token === verseToken) verseText = text
    } catch {
      if (token === verseToken) verseFailed = true
    }
  }

  $effect(() => {
    void locale.lang
    void loadVerse()
  })

  const set = $derived(readSet(app.readings))
  const overall = $derived(percent(bibleProgress(set)))
  const days = $derived(daysWithReading(app.readings, Date.now()))
  const last = $derived(app.state.lastPosition)
  const plan = $derived(
    app.state.activePlan
      ? {
          id: app.state.activePlan.id,
          status: planStatus(PLANS[app.state.activePlan.id], readSet(app.readings, app.state.activePlan.startedAt)),
        }
      : null,
  )
  const planHref = $derived.by(() => {
    if (!plan?.status.nextRef) return '#/planos'
    const p = parseRef(plan.status.nextRef)!
    return `#/ler/${p.book}/${p.chapter}`
  })
  const verseLink = $derived.by(() => {
    const p = parseRef(verseRef)!
    return `#/ler/${p.book}/${p.chapter}/${p.verse}`
  })
</script>

<div class="page stack">
  <header class="head">
    <div>
      <h1>{t(greetingKey)}</h1>
      <p class="muted">{t('home.subtitle')}</p>
    </div>
    <a class="icon-btn" href="#/ajustes" aria-label={t('home.settings')}><SettingsIcon size={22} aria-hidden="true" /></a>
  </header>

  {#if verseFailed}
    <section class="card verse-card">
      <p class="label">{t('home.verseOfDay')}</p>
      <p>{t('home.verseError')}</p>
      <button class="btn retry" onclick={() => loadVerse()}>{t('common.retry')}</button>
    </section>
  {:else}
    <a class="card verse-card" href={verseLink}>
      <p class="label">{t('home.verseOfDay')}</p>
      <blockquote>{verseText ?? ''}</blockquote>
      <p class="ref">{formatRef(verseRef, bookName)}</p>
    </a>
  {/if}

  {#if last}
    <a class="btn btn-primary continue" href={`#/ler/${last.book}/${last.chapter}`}>
      <BookOpen size={20} aria-hidden="true" />
      <span>{t('home.continue')} · {bookName(last.book)} {last.chapter}</span>
    </a>
  {:else}
    <a class="btn btn-primary continue" href="#/ler/JHN/1">
      <BookOpen size={20} aria-hidden="true" />
      <span>{t('home.start')}</span>
    </a>
    <p class="muted hint">{t('home.startHint')}</p>
  {/if}

  {#if plan}
    <a class="card" href={planHref}>
      <p class="label">{t('home.todayPlan')}</p>
      <h2>{t(`plans.catalog.${plan.id}.title`)}</h2>
      {#if plan.status.currentDay === null}
        <p>{t('home.planDone')}</p>
      {:else}
        <p class="muted">{t('plans.day', { day: plan.status.currentDay, total: plan.status.totalDays })}</p>
        <p>{plan.status.todayRefs.map((r) => formatRef(r, bookName)).join(', ')}</p>
      {/if}
    </a>
  {/if}

  <section class="card">
    <p class="label">{t('home.progressTitle')}</p>
    <p>{t('home.progress', { percent: overall })}</p>
    <ProgressBar value={overall} />
    <p class="muted small">{t('home.days', { count: days })}</p>
  </section>

  <section class="card tip">
    <p class="label">{t('home.tip')}</p>
    <p>{tip[locale.lang]}</p>
  </section>
</div>

<style>
  .head { display: flex; justify-content: space-between; align-items: start; }
  .label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--accent-strong);
    margin-bottom: var(--space-2);
  }
  .verse-card blockquote {
    margin: 0 0 var(--space-3);
    font-family: var(--font-read);
    font-size: 1.1875rem;
    line-height: 1.6;
    min-height: 3em;
  }
  .ref { color: var(--text-2); font-size: 0.875rem; }
  .retry { justify-self: start; }
  .continue { width: 100%; min-height: 52px; }
  .hint { text-align: center; font-size: 0.875rem; margin-top: calc(var(--space-2) * -1); }
  .card { display: grid; gap: var(--space-2); }
  .small { font-size: 0.875rem; }
  .tip p:last-child { line-height: 1.6; }
</style>
