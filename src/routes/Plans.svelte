<script lang="ts">
  import { BookOpen, Check } from '@lucide/svelte'
  import { app, markMany, markRead, unmarkRead, updateState } from '../lib/app.svelte'
  import { formatRef, parseRef } from '../lib/bible/refs'
  import { t } from '../lib/i18n/i18n.svelte'
  import { PLANS, PLAN_IDS, type PlanId } from '../lib/plans/catalog'
  import { planStatus, planStrip, visibleDays } from '../lib/plans/status'
  import { readSet } from '../lib/progress/progress'

  const bookName = (id: string) => t(`books.${id}`)
  const active = $derived(app.state.activePlan)
  const since = $derived(active ? readSet(app.readings, active.startedAt) : new Set<string>())
  const status = $derived(active ? planStatus(PLANS[active.id], since) : null)
  const strip = $derived(active ? planStrip(PLANS[active.id], since) : [])
  const days = $derived(active ? visibleDays(PLANS[active.id], since) : [])

  function hrefFor(ref: string) {
    const p = parseRef(ref)!
    return `#/ler/${p.book}/${p.chapter}`
  }

  function toggle(ref: string) {
    void (since.has(ref) ? unmarkRead(ref) : markRead(ref))
  }

  function start(id: PlanId) {
    if (active && !confirm(t('plans.switchConfirm'))) return
    void updateState({ activePlan: { id, startedAt: Date.now() } })
  }

  function stop() {
    if (confirm(t('plans.stopConfirm'))) void updateState({ activePlan: null })
  }
</script>

<div class="page">
  <header class="page-head">
    <h1>{t('plans.title')}</h1>
    {#if !active}
      <p class="muted">{t('plans.intro')}</p>
    {/if}
  </header>

  {#if active && status}
    <section class="card top">
      <div class="row">
        <div>
          <p class="eyebrow">{t('plans.eyebrow')}</p>
          <h2 class="plan-name">{t(`plans.catalog.${active.id}.title`)}</h2>
        </div>
        <p class="big-number pct">{status.percent}<small>%</small></p>
      </div>
      <span class="bar" aria-hidden="true"><span style:width={`${status.percent}%`}></span></span>
      {#if status.currentDay === null}
        <p>{t('plans.done')}</p>
      {:else}
        <p class="muted small">
          {t('plans.summary', {
            read: status.readChapters,
            total: status.totalChapters,
            day: status.currentDay,
            days: status.totalDays,
          })}
        </p>
      {/if}
      <ol class="strip" aria-hidden="true">
        {#each strip as day (day.n)}
          <li data-complete={day.complete} data-current={day.current}>{day.n}</li>
        {/each}
      </ol>
      <p class="muted small">
        {status.remainingDays === 1 ? t('plans.remainingOne') : t('plans.remaining', { count: status.remainingDays })}
      </p>
    </section>

    <p class="muted support">{t('plans.support')}</p>

    <div class="stack">
      {#each days as day (day.n)}
        <section class="card day" class:today={day.today}>
          <div class="day-head">
            <h3>
              {t('plans.dayTitle', { n: day.n })}
              {#if day.today}<span class="eyebrow tag">{t('plans.today')}</span>{/if}
            </h3>
            <span class="muted small">{t('plans.dayCount', { done: day.doneCount, total: day.total })}</span>
          </div>
          <ul class="items">
            {#each day.refs as ref (ref)}
              {@const label = formatRef(ref, bookName)}
              <li>
                <button class="pill item" aria-pressed={since.has(ref)} onclick={() => toggle(ref)}>
                  <span class="box" aria-hidden="true">{#if since.has(ref)}<Check size={16} />{/if}</span>
                  {label}
                </button>
                <a class="read" href={hrefFor(ref)} aria-label={t('plans.readChapter', { ref: label })}>
                  <BookOpen size={20} aria-hidden="true" />
                </a>
              </li>
            {/each}
          </ul>
          {#if !day.complete}
            <button class="btn btn-dark" onclick={() => markMany(day.refs.filter((r) => !since.has(r)))}>{t('plans.markDay')}</button>
          {/if}
        </section>
      {/each}
    </div>

    <button class="btn btn-ghost stop" onclick={stop}>{t('plans.stop')}</button>
  {/if}

  <div class="stack list">
    {#each PLAN_IDS as id (id)}
      <article class="card">
        <h2>{t(`plans.catalog.${id}.title`)}</h2>
        <p class="muted">{t(`plans.catalog.${id}.desc`)}</p>
        <div class="list-row">
          <span class="muted small">{t('plans.length', { count: PLANS[id].days.length })}</span>
          {#if active?.id === id && status}
            <span class="badge">{t('plans.percent', { percent: status.percent })}</span>
          {:else}
            <button class="pill" onclick={() => start(id)}>{t('plans.start')}</button>
          {/if}
        </div>
      </article>
    {/each}
  </div>
</div>

<style>
  .top { display: grid; gap: var(--space-4); margin-bottom: var(--space-4); }
  .row { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-3); }
  .plan-name { font-size: 1.625rem; line-height: 1.15; margin-top: var(--space-1); }
  .pct { font-size: 3.5rem; }
  .bar { display: block; height: 10px; border-radius: 999px; background: var(--track); overflow: hidden; }
  .bar span { display: block; height: 100%; background: var(--accent); }
  .small { font-size: 0.875rem; }
  .strip { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
  .strip li {
    justify-self: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    font-size: 0.75rem;
    font-weight: 700;
    background: var(--track);
    color: var(--text-2);
  }
  .strip li[data-complete='true'] { background: var(--accent); color: var(--on-accent); }
  .strip li[data-current='true'] { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--accent); }
  .support { font-size: 0.875rem; line-height: 1.5; margin-bottom: var(--space-4); }
  .day { display: grid; gap: var(--space-3); }
  .day.today { border: 2px solid var(--accent); }
  .day-head { display: flex; justify-content: space-between; align-items: baseline; }
  h3 { font-family: var(--font-display); font-size: 1.25rem; font-weight: 500; }
  .tag { margin-left: var(--space-2); }
  .items { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-2); }
  .items li { display: flex; gap: var(--space-2); }
  .item { flex-grow: 1; justify-content: flex-start; min-height: 48px; }
  .box {
    width: 20px;
    height: 20px;
    box-sizing: border-box;
    border-radius: 999px;
    border: 2px solid var(--border-strong);
    display: grid;
    place-items: center;
  }
  .item[aria-pressed='true'] .box { border: 0; }
  .read {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: 999px;
    background: var(--surface-2);
    display: grid;
    place-items: center;
    color: var(--text-2);
  }
  .stop { justify-self: start; color: var(--text-2); margin: var(--space-4) 0; }
  .list { margin-top: var(--space-5); }
  .list .card { display: grid; gap: var(--space-2); }
  .list-row { display: flex; justify-content: space-between; align-items: center; }
  .badge { font-size: 0.875rem; font-weight: 700; color: var(--accent-text); }
</style>
