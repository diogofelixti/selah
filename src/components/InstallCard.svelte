<script lang="ts">
  import { Download } from '@lucide/svelte'
  import { t } from '../lib/i18n/i18n.svelte'
  import { install, isIos, promptInstall } from '../lib/install.svelte'
  import { showToast } from '../lib/toast.svelte'

  const ios = isIos()

  async function onInstall() {
    if (await promptInstall()) showToast(t('install.done'))
  }
</script>

{#if !install.installed}
  <section class="card install" aria-labelledby="install-title">
    <h2 id="install-title"><Download size={20} aria-hidden="true" />{t('install.title')}</h2>
    <p class="small">{t('install.text')}</p>
    {#if install.canPrompt}
      <button class="btn btn-primary" onclick={onInstall}>{t('install.button')}</button>
    {:else if ios}
      <ol class="small steps">
        <li>{t('install.ios1')}</li>
        <li>{t('install.ios2')}</li>
        <li>{t('install.ios3')}</li>
      </ol>
    {:else}
      <ol class="small steps">
        <li>{t('install.android1')}</li>
        <li>{t('install.android2')}</li>
      </ol>
      <p class="small muted">{t('install.xiaomi')}</p>
    {/if}
  </section>
{/if}

<style>
  .install { display: grid; gap: var(--space-3); }
  h2 { display: flex; align-items: center; gap: var(--space-2); }
  h2 :global(svg) { color: var(--accent-text); flex-shrink: 0; }
  .small { font-size: 0.875rem; line-height: 1.6; }
  .steps { margin: 0; padding-left: var(--space-5); display: grid; gap: var(--space-1); }
  .btn { justify-self: start; }
</style>
