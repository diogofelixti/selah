<script lang="ts">
  import { X } from '@lucide/svelte'
  import { t } from '../lib/i18n/i18n.svelte'

  let { withNav, onUpdate, onDismiss }: { withNav: boolean; onUpdate: () => void; onDismiss: () => void } = $props()
</script>

<div class="update" class:no-nav={!withNav} role="status">
  <span>{t('update.available')}</span>
  <div class="actions">
    <button class="btn btn-primary" onclick={onUpdate}>{t('update.reload')}</button>
    <button class="icon-btn" onclick={onDismiss} aria-label={t('update.dismiss')}><X size={18} /></button>
  </div>
</div>

<style>
  .update {
    position: fixed;
    left: var(--space-4);
    right: var(--space-4);
    bottom: calc(var(--nav-offset) + env(safe-area-inset-bottom));
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow);
    z-index: 2;
  }
  .update.no-nav { bottom: calc(env(safe-area-inset-bottom) + var(--space-3)); }
  .actions { display: flex; align-items: center; }
</style>
