<script lang="ts">
  import { BookOpen, Menu, SquareCheckBig } from '@lucide/svelte'
  import { app } from '../lib/app.svelte'
  import { TRANSLATION_BY_LANG, bible } from '../lib/bible/loader'
  import { formatChapterList, formatRef, parseRef } from '../lib/bible/refs'
  import { tipOfTheDay, verseOfTheDay } from '../lib/daily/daily'
  import { locale, t } from '../lib/i18n/i18n.svelte'
  import { PLANS } from '../lib/plans/catalog'
  import { planStatus } from '../lib/plans/status'
  import { bibleProgress, percent, readSet, testamentProgress, weekDays } from '../lib/progress/progress'

  const today = new Date()
  const hour = today.getHours()
  const greetingKey = hour < 12 ? 'home.greeting.morning' : hour < 18 ? 'home.greeting.afternoon' : 'home.greeting.evening'
  const verseRef = verseOfTheDay(today)
  const tip = tipOfTheDay(today)
  const bookName = (id: string) => t(`books.${id}`)
  const OT_SHARE = (929 / 1189) * 100

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

  const numberFmt = $derived(new Intl.NumberFormat(locale.lang === 'pt' ? 'pt-BR' : 'en'))
  const set = $derived(readSet(app.readings))
  const total = $derived(bibleProgress(set))
  const overall = $derived(percent(total))
  const ot = $derived(percent(testamentProgress(set, 'OT')))
  const nt = $derived(percent(testamentProgress(set, 'NT')))
  const week = $derived(weekDays(app.readings, Date.now()))
  const weekCount = $derived(week.filter((d) => d.read).length)
  const last = $derived(app.state.lastPosition)
  const plan = $derived.by(() => {
    const active = app.state.activePlan
    if (!active) return null
    const since = readSet(app.readings, active.startedAt)
    const status = planStatus(PLANS[active.id], since)
    return { id: active.id, status, todayDone: status.todayRefs.filter((r) => since.has(r)).length }
  })
  const verseLink = $derived.by(() => {
    const p = parseRef(verseRef)!
    return `#/ler/${p.book}/${p.chapter}/${p.verse}`
  })
</script>

<div class="page stack home">
  <header class="head">
    <div>
      <p class="muted greeting">{t(greetingKey)}</p>
      <p class="brand">Selah</p>
    </div>
    <a class="round" href="#/ajustes" aria-label={t('home.settings')}><Menu size={20} aria-hidden="true" /></a>
  </header>

  <section class="card progress-card">
    <div class="row">
      <div>
        <p class="eyebrow">{t('home.bibleRead')}</p>
        <p class="big-number percent">{overall}<small>%</small></p>
      </div>
      <p class="muted count">{t('home.chapters', { read: numberFmt.format(total.read), total: numberFmt.format(total.total) })}</p>
    </div>
    <div class="split" aria-hidden="true">
      <span class="part" style:flex-grow={OT_SHARE}><span class="fill ot" style:width={`${ot}%`}></span></span>
      <span class="part" style:flex-grow={100 - OT_SHARE}><span class="fill nt" style:width={`${nt}%`}></span></span>
    </div>
    <div class="legend muted">
      <span><span class="dot ot"></span>{t('home.otShort', { percent: ot })}</span>
      <span><span class="dot nt"></span>{t('home.ntShort', { percent: nt })}</span>
    </div>
    <hr />
    <p class="muted small">{t('home.thisWeek')}</p>
    <p class="sr-only">{t('home.weekSummary', { count: weekCount })}</p>
    <ul class="week" aria-hidden="true">
      {#each week as day (day.key)}
        <li data-read={day.read} data-today={day.today}><span class="bubble"></span>{t(`week.${day.weekday}`)}</li>
      {/each}
    </ul>
  </section>

  <div class="shortcuts">
    {#if last}
      <a class="shortcut dark" href={`#/ler/${last.book}/${last.chapter}`}>
        <BookOpen size={24} aria-hidden="true" />
        <span class="label">{t('home.continue')}</span>
        <span class="title">{bookName(last.book)} {last.chapter}</span>
      </a>
    {:else}
      <a class="shortcut dark" href="#/ler/JHN/1">
        <BookOpen size={24} aria-hidden="true" />
        <span class="label">{t('home.start')}</span>
        <span class="title">{bookName('JHN')} 1</span>
      </a>
    {/if}
    <a class="shortcut" href="#/controle">
      <SquareCheckBig size={24} aria-hidden="true" class="accent-icon" />
      <span class="label">{t('home.trackerShortcut')}</span>
      <span class="title">{t('nav.tracker')}</span>
    </a>
  </div>

  {#if verseFailed}
    <section class="card verse-card">
      <p class="eyebrow">{t('home.verseOfDay')}</p>
      <p>{t('home.verseError')}</p>
      <button class="btn retry" onclick={() => loadVerse()}>{t('common.retry')}</button>
    </section>
  {:else}
    <a class="card verse-card" href={verseLink}>
      <p class="eyebrow">{t('home.verseOfDay')}</p>
      <blockquote>{verseText ?? ''}</blockquote>
      <p class="muted small">{formatRef(verseRef, bookName)}</p>
    </a>
  {/if}

  {#if plan}
    <a class="card plan-card" href="#/planos">
      <span class="row">
        <span class="plan-title">{t(`plans.catalog.${plan.id}.title`)}</span>
        <span class="plan-pct">{plan.status.percent}%</span>
      </span>
      {#if plan.status.currentDay === null}
        <span class="muted small">{t('home.planDone')}</span>
      {:else}
        <span class="muted small">
          {t('home.planToday', {
            refs: formatChapterList(plan.status.todayRefs, bookName, t('common.to')),
            done: plan.todayDone,
            total: plan.status.todayRefs.length,
          })}
        </span>
      {/if}
      <span class="bar"><span style:width={`${plan.status.percent}%`}></span></span>
    </a>
  {/if}

  <section class="card tip">
    <p class="eyebrow">{t('home.tip')}</p>
    <p>{tip[locale.lang]}</p>
  </section>
</div>

<style>
  .home { gap: var(--space-5); }
  .head { display: flex; justify-content: space-between; align-items: center; }
  .greeting { font-size: 0.875rem; }
  .brand { font-family: var(--font-display); font-size: 1.875rem; font-weight: 500; line-height: 1.1; }
  .round {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    background: var(--surface);
    border: 1px solid var(--border);
    display: grid;
    place-items: center;
    color: var(--text-2);
  }
  .progress-card { display: grid; gap: var(--space-4); }
  .row { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-3); }
  .percent { font-size: 4rem; margin-top: var(--space-1); }
  .count { font-size: 0.875rem; text-align: right; max-width: 9rem; }
  .split { display: flex; gap: 4px; height: 10px; }
  .part { display: block; border-radius: 999px; background: var(--track); overflow: hidden; }
  .fill { display: block; height: 100%; }
  .fill.ot, .dot.ot { background: var(--accent); }
  .fill.nt, .dot.nt { background: var(--nt); }
  .legend { display: flex; justify-content: space-between; font-size: 0.8125rem; }
  .dot { display: inline-block; width: 8px; height: 8px; border-radius: 999px; margin-right: 6px; }
  hr { border: 0; border-top: 1px solid var(--border); margin: 0; width: 100%; }
  .small { font-size: 0.875rem; }
  .week {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
    text-align: center;
    font-size: 0.75rem;
    color: var(--text-2);
  }
  .week li { display: grid; justify-items: center; gap: 6px; }
  .bubble { width: 30px; height: 30px; border-radius: 999px; background: var(--track); }
  .week li[data-read='true'] .bubble { background: var(--accent); }
  .week li[data-today='true'] .bubble { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--accent); }
  .shortcuts { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
  .shortcut {
    display: grid;
    gap: var(--space-2);
    align-content: start;
    min-height: 120px;
    padding: var(--space-4);
    border-radius: 20px;
    background: var(--surface);
    border: 1px solid var(--border);
  }
  .shortcut.dark { background: var(--text); border-color: var(--text); color: var(--bg); }
  .shortcut :global(.accent-icon) { color: var(--accent); }
  .label { font-size: 0.8125rem; font-weight: 600; color: var(--text-2); }
  .shortcut.dark .label { color: var(--track); }
  .title { font-family: var(--font-display); font-size: 1.375rem; }
  .verse-card { display: grid; gap: var(--space-3); }
  .verse-card blockquote { margin: 0; font-family: var(--font-display); font-size: 1.375rem; line-height: 1.45; min-height: 2.9em; }
  .retry { justify-self: start; }
  .plan-card { display: grid; gap: var(--space-3); }
  .plan-title { font-family: var(--font-display); font-size: 1.1875rem; }
  .plan-pct { font-size: 0.8125rem; font-weight: 700; color: var(--accent-text); }
  .bar { display: block; height: 6px; border-radius: 999px; background: var(--track); overflow: hidden; }
  .bar span { display: block; height: 100%; background: var(--accent); }
  .tip { display: grid; gap: var(--space-2); }
  .tip p:last-child { line-height: 1.6; }
</style>
