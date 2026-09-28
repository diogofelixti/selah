<script lang="ts">
  import { Check } from '@lucide/svelte'
  import { app, updateState } from '../lib/app.svelte'
  import { formatRef, parseRef } from '../lib/bible/refs'
  import { t } from '../lib/i18n/i18n.svelte'
  import { PLANS, PLAN_IDS, type PlanId } from '../lib/plans/catalog'
  import { planStatus } from '../lib/plans/status'
  import { readSet } from '../lib/progress/progress'

  const bookName = (id: string) => t(`books.${id}`)
  const active = $derived(app.state.activePlan)
  const since = $derived(active ? readSet(app.readings, active.startedAt) : new Set<string>())
  const status = $derived(active ? planStatus(PLANS[active.id], since) : null)

  function hrefFor(ref: string) {
    const p = parseRef(ref)!
    return `#/ler/${p.book}/${p.chapter}`
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
    <p class="muted">{t('plans.intro')}</p>
  </header>

  {#if active && status}
    <section class="card current">
      <p class="label">{t('plans.current')}</p>
      <h2>{t(`plans.catalog.${active.id}.title`)}</h2>
      {#if status.currentDay === null}
        <p>{t('plans.done')}</p>
      {:else}
        <p class="muted">{t('plans.day', { day: status.currentDay, total: status.totalDays })}</p>
        <h3 class="section-title">{t('plans.today')}</h3>
        <ul class="today">
          {#each status.todayRefs as ref (ref)}
            <li>
              <a href={hrefFor(ref)} class:done={since.has(ref)}>
                <span class="check" aria-hidden="true">{#if since.has(ref)}<Check size={16} />{/if}</span>
                {formatRef(ref, bookName)}
              </a>
            </li>
          {/each}
        </ul>
        <p class="muted small">
          {status.remainingDays === 1 ? t('plans.remainingOne') : t('plans.remaining', { count: status.remainingDays })}
        </p>
      {/if}
      <button class="btn btn-ghost stop" onclick={stop}>{t('plans.stop')}</button>
    </section>
  {/if}

  <div class="stack list">
    {#each PLAN_IDS as id (id)}
      <article class="card">
        <h2>{t(`plans.catalog.${id}.title`)}</h2>
        <p class="muted">{t(`plans.catalog.${id}.desc`)}</p>
        <div class="row">
          <span class="muted small">{t('plans.length', { count: PLANS[id].days.length })}</span>
          {#if active?.id === id}
            <span class="badge">{t('plans.current')}</span>
          {:else}
            <button class="btn" onclick={() => start(id)}>{t('plans.start')}</button>
          {/if}
        </div>
      </article>
    {/each}
  </div>
</div>

<style>
  .label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--accent-strong);
  }
  .current { display: grid; gap: var(--space-2); margin-bottom: var(--space-5); }
  .today { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-1); }
  .today a { display: flex; align-items: center; gap: var(--space-3); min-height: 44px; }
  .today a.done { color: var(--text-2); }
  .check {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 999px;
    border: 1.5px solid var(--border);
  }
  .done .check { background: var(--accent); border-color: var(--accent); }
  .stop { justify-self: start; color: var(--text-2); }
  .list .card { display: grid; gap: var(--space-2); }
  .row { display: flex; justify-content: space-between; align-items: center; }
  .badge { font-size: 0.875rem; font-weight: 600; color: var(--accent-strong); }
  .small { font-size: 0.875rem; }
</style>
