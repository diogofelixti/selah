<script lang="ts">
  import { Copy } from '@lucide/svelte'
  import { copyText } from '../lib/clipboard'
  import { t } from '../lib/i18n/i18n.svelte'
  import Toast from './Toast.svelte'

  let { text }: { text: () => string } = $props()

  let toast = $state<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function copy() {
    const ok = await copyText(text())
    toast = t(ok ? 'copy.done' : 'copy.failed')
    clearTimeout(timer)
    timer = setTimeout(() => (toast = null), 2000)
  }
</script>

<button class="icon-btn copy" onclick={copy} aria-label={t('copy.verse')}><Copy size={18} aria-hidden="true" /></button>
<Toast message={toast} />

<style>
  .copy { color: var(--text-2); flex-shrink: 0; }
</style>
