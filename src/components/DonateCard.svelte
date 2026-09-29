<script lang="ts">
  import { Copy, HandHeart, MessageCircle } from '@lucide/svelte'
  import { copyText } from '../lib/clipboard'
  import { PIX_KEY, PIX_KEY_LABEL, WHATSAPP_LABEL, WHATSAPP_URL } from '../lib/donation'
  import { t } from '../lib/i18n/i18n.svelte'
  import { showToast } from '../lib/toast.svelte'

  async function copyPix() {
    const ok = await copyText(PIX_KEY)
    showToast(t(ok ? 'donate.copied' : 'copy.failed'))
  }
</script>

<section class="card donate" aria-labelledby="donate-title">
  <h2 id="donate-title"><HandHeart size={20} aria-hidden="true" />{t('donate.title')}</h2>
  <p class="small">{t('donate.text')}</p>
  <div class="pix">
    <div>
      <p class="eyebrow">{t('donate.pix')}</p>
      <p class="key">{PIX_KEY_LABEL}</p>
    </div>
    <button class="pill copy" onclick={copyPix} aria-label={t('donate.copy')}><Copy size={16} aria-hidden="true" />{t('donate.copyShort')}</button>
  </div>
  <p class="small muted">{t('donate.contact')}</p>
  <a class="btn" href={WHATSAPP_URL} target="_blank" rel="noopener">
    <MessageCircle size={18} aria-hidden="true" /><span>{t('donate.whatsapp')} <span class="nowrap">{WHATSAPP_LABEL}</span></span>
  </a>
</section>

<style>
  .donate { display: grid; gap: var(--space-3); }
  h2 { display: flex; align-items: center; gap: var(--space-2); }
  h2 :global(svg) { color: var(--accent-text); flex-shrink: 0; }
  .small { font-size: 0.875rem; line-height: 1.6; }
  .pix {
    display: flex; justify-content: space-between; align-items: center; gap: var(--space-2);
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
    border-radius: var(--radius-m); background: var(--surface-2);
  }
  .pix > div { min-width: 0; }
  /* Com letra grande, a chave quebra em vez de empurrar o botão para fora. */
  .key { font-weight: 600; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .copy { flex-shrink: 0; padding-inline: var(--space-3); }
  .nowrap { white-space: nowrap; }
  .btn { justify-self: start; text-align: left; padding-block: var(--space-2); border-radius: var(--radius-m); }
  .btn :global(svg) { flex-shrink: 0; }
</style>
