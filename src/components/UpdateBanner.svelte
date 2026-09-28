<script lang="ts">
  import { t } from '../lib/i18n/i18n.svelte'
  import { applyUpdate, pwa } from '../lib/pwa.svelte'
</script>

{#if pwa.needRefresh}
  <div class="update" role="status">
    <span>{t('update.available')}</span>
    <button class="btn btn-primary" onclick={applyUpdate}>{t('update.reload')}</button>
  </div>
{/if}

<style>
  .update {
    position: fixed;
    left: var(--space-4);
    right: var(--space-4);
    bottom: calc(var(--nav-height) + env(safe-area-inset-bottom) + var(--space-3));
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow);
    z-index: 2;
  }
</style>
