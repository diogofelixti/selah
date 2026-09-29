<script lang="ts">
  import { CloudCheck, RefreshCw } from '@lucide/svelte'
  import { locale, t } from '../lib/i18n/i18n.svelte'
  import { account, deleteAccount, signInWithCredential, signOut, syncNow } from '../lib/sync/account.svelte'
  import { loadGoogle } from '../lib/sync/google'
  import { showToast } from '../lib/toast.svelte'

  let buttonEl = $state<HTMLDivElement | null>(null)
  let message = $state<string | null>(null)
  let busy = $state(false)
  // Relógio para "Sincronizado há N min".
  let now = $state(Date.now())
  $effect(() => {
    const timer = setInterval(() => (now = Date.now()), 30_000)
    return () => clearInterval(timer)
  })

  // Sem conta e com login ligado: desenha o botão oficial do Google.
  $effect(() => {
    const el = buttonEl
    const clientId = account.clientId
    const lang = locale.lang
    if (!el || !clientId || account.token) return
    let cancelled = false
    loadGoogle()
      .then((google) => {
        if (cancelled) return
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }: { credential: string }) => {
            busy = true
            message = null
            const ok = await signInWithCredential(credential)
            busy = false
            if (!ok) message = t('account.loginError')
          },
        })
        el.replaceChildren()
        google.accounts.id.renderButton(el, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'signin_with',
          locale: lang === 'pt' ? 'pt-BR' : 'en',
        })
      })
      .catch(() => {
        if (!cancelled) message = t('account.offline')
      })
    return () => {
      cancelled = true
    }
  })

  const syncedText = $derived.by(() => {
    if (account.status === 'syncing') return t('account.syncing')
    if (account.status === 'error') return t('account.syncError')
    if (account.lastSyncAt === null) return t('account.notSynced')
    const minutes = Math.floor((now - account.lastSyncAt) / 60_000)
    return minutes < 1 ? t('account.synced') : t('account.syncedAgo', { n: minutes })
  })

  async function leave() {
    await signOut()
    showToast(t('account.signedOut'))
  }

  async function remove() {
    if (!confirm(t('account.deleteConfirm1')) || !confirm(t('account.deleteConfirm2'))) return
    busy = true
    const ok = await deleteAccount()
    busy = false
    if (ok) showToast(t('account.deleted'))
    else message = t('account.deleteError')
  }
</script>

<section class="card account" aria-labelledby="account-title">
  <h2 id="account-title"><CloudCheck size={20} aria-hidden="true" />{t('account.title')}</h2>

  {#if account.token}
    <p>{t('account.signedInAs', { email: account.email ?? '' })}</p>
    <p class="small muted" aria-live="polite">{syncedText}</p>
    <div class="actions">
      <button class="btn" onclick={() => syncNow()} disabled={account.status === 'syncing'}>
        <RefreshCw size={16} aria-hidden="true" />{t('account.syncNow')}
      </button>
      <button class="btn btn-ghost" onclick={leave}>{t('account.signOut')}</button>
    </div>
    <button class="btn btn-ghost danger" onclick={remove} disabled={busy}>{t('account.delete')}</button>
  {:else if account.config === 'on'}
    <p class="small">{t('account.text')}</p>
    <p class="small muted">{t('account.keepLocal')}</p>
    {#if account.status === 'expired'}<p class="small">{t('account.expired')}</p>{/if}
    <div class="google" bind:this={buttonEl} aria-busy={busy}></div>
  {:else if account.config === 'off'}
    <p class="small muted">{t('account.soon')}</p>
  {:else if account.config === 'unreachable'}
    <p class="small muted">{t('account.unreachable')}</p>
  {/if}

  {#if message}<p class="small" role="status">{message}</p>{/if}
</section>

<style>
  .account { display: grid; gap: var(--space-3); }
  h2 { display: flex; align-items: center; gap: var(--space-2); }
  h2 :global(svg) { color: var(--accent-text); flex-shrink: 0; }
  .small { font-size: 0.875rem; line-height: 1.6; }
  .actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .danger { justify-self: start; color: var(--text-2); }
  .google { min-height: 44px; }
</style>
