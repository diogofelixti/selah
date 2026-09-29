<script lang="ts">
  import { ArrowLeft } from '@lucide/svelte'
  import DonateCard from '../components/DonateCard.svelte'
  import { t } from '../lib/i18n/i18n.svelte'
</script>

<div class="page">
  <header class="page-head">
    <a class="back" href="#/ajustes"><ArrowLeft size={18} aria-hidden="true" />{t('settings.title')}</a>
    <h1>{t('about.title')}</h1>
  </header>

  <div class="stack">
    <p class="lead">{t('about.whatIs')}</p>
    <p>{t('about.free')}</p>

    <section class="card stack">
      <h2>{t('about.translations')}</h2>
      <p class="small">{t('about.blivre')}</p>
      <p class="small">{t('about.bsb')}</p>
      <p class="small muted">{t('about.italics')}</p>
    </section>

    <p class="small">{t('reminder.privacy')}</p>
    <p class="small">{t('account.privacy')}</p>

    <DonateCard />

    <p class="muted small">
      <a href="https://selatech.com.br" target="_blank" rel="noopener">{t('about.madeBy')}</a>
      · {t('about.version', { version: __APP_VERSION__ })}
    </p>
  </div>
</div>

<style>
  .lead { font-family: var(--font-read); font-size: 1.1875rem; line-height: 1.6; }
  .small { font-size: 0.875rem; line-height: 1.6; }
  a { text-decoration: underline; }
</style>
