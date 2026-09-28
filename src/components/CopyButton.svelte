<script lang="ts">
  import { Copy } from '@lucide/svelte'
  import { copyText } from '../lib/clipboard'
  import { t } from '../lib/i18n/i18n.svelte'
  import { showToast } from '../lib/toast.svelte'

  let { text, disabled = false }: { text: () => string; disabled?: boolean } = $props()

  async function copy() {
    const value = text()
    // Sem texto (ainda carregando), não apaga o que a pessoa já tinha copiado.
    if (!value) return
    const ok = await copyText(value)
    showToast(t(ok ? 'copy.done' : 'copy.failed'))
  }
</script>

<button class="icon-btn copy" onclick={copy} {disabled} aria-label={t('copy.verse')}><Copy size={18} aria-hidden="true" /></button>

<style>
  .copy { color: var(--text-2); flex-shrink: 0; }
</style>
