<script lang="ts">
  import { ArrowLeft, ChevronRight, Download, Minus, Plus, Trash2, Upload } from '@lucide/svelte'
  import { app, clearData, replaceData, snapshot, updateSettings } from '../lib/app.svelte'
  import { t } from '../lib/i18n/i18n.svelte'
  import type { LanguageSetting } from '../lib/i18n/lang'
  import { localDayKey } from '../lib/progress/progress'
  import { pwa } from '../lib/pwa.svelte'
  import { BackupError, parseBackup, serializeBackup } from '../lib/storage/backup'
  import { THEMES, type FontSize } from '../lib/storage/types'

  const LANGUAGES: { value: LanguageSetting; label: string }[] = [
    { value: 'auto', label: 'settings.languageAuto' },
    { value: 'pt', label: 'settings.languagePt' },
    { value: 'en', label: 'settings.languageEn' },
  ]

  let message = $state<{ kind: 'ok' | 'error'; key: string } | null>(null)
  let fileInput = $state<HTMLInputElement>()

  function changeFont(delta: number) {
    const size = Math.min(4, Math.max(1, app.settings.fontSize + delta)) as FontSize
    void updateSettings({ fontSize: size })
  }

  function exportData() {
    const blob = new Blob([serializeBackup(snapshot())], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `selah-backup-${localDayKey(Date.now())}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function importData(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    try {
      const data = parseBackup(await file.text())
      if (!confirm(t('settings.importConfirm'))) return
      message = (await replaceData(data))
        ? { kind: 'ok', key: 'settings.importDone' }
        : { kind: 'error', key: 'common.saveError' }
    } catch (err) {
      if (!(err instanceof BackupError)) throw err
      message = { kind: 'error', key: 'settings.importError' }
    }
  }

  async function erase() {
    if (!confirm(t('settings.clearConfirm1')) || !confirm(t('settings.clearConfirm2'))) return
    message = (await clearData())
      ? { kind: 'ok', key: 'settings.clearDone' }
      : { kind: 'error', key: 'common.saveError' }
  }
</script>

<div class="page">
  <header class="page-head">
    <a class="back" href="#/"><ArrowLeft size={18} aria-hidden="true" />{t('nav.home')}</a>
    <h1>{t('settings.title')}</h1>
  </header>

  <div class="stack">
    <fieldset class="card">
      <legend>{t('settings.language')}</legend>
      {#each LANGUAGES as lang (lang.value)}
        <label class="option">
          <input
            type="radio"
            name="language"
            value={lang.value}
            checked={app.settings.language === lang.value}
            onchange={() => updateSettings({ language: lang.value })}
          />
          {t(lang.label)}
        </label>
      {/each}
    </fieldset>

    <fieldset class="card">
      <legend>{t('settings.theme')}</legend>
      {#each THEMES as theme (theme)}
        <label class="option">
          <input type="radio" name="theme" value={theme} checked={app.settings.theme === theme} onchange={() => updateSettings({ theme })} />
          {t(`settings.themes.${theme}`)}
        </label>
      {/each}
      <p class="muted small">{t('settings.moreThemes')}</p>
    </fieldset>

    <section class="card row">
      <h2>{t('settings.fontSize')}</h2>
      <div class="stepper">
        <button class="icon-btn" onclick={() => changeFont(-1)} disabled={app.settings.fontSize === 1} aria-label={t('reader.fontSmaller')}><Minus size={18} /></button>
        <span>{t('settings.fontSizeValue', { n: app.settings.fontSize })}</span>
        <button class="icon-btn" onclick={() => changeFont(1)} disabled={app.settings.fontSize === 4} aria-label={t('reader.fontLarger')}><Plus size={18} /></button>
      </div>
    </section>

    {#if pwa.offlineSupported}
      <section class="card">
        <h2>{t('settings.offline')}</h2>
        <p class="muted small" data-offline-status>
          {pwa.offlineDone === pwa.offlineTotal
            ? t('settings.offlineReady')
            : t('settings.offlineProgress', { done: pwa.offlineDone, total: pwa.offlineTotal })}
        </p>
      </section>
    {/if}

    <section class="card data">
      <h2>{t('settings.data')}</h2>
      <p class="muted small">{t('settings.dataHint')}</p>
      <button class="btn" onclick={exportData}><Download size={18} aria-hidden="true" />{t('settings.export')}</button>
      <button class="btn" onclick={() => fileInput?.click()}><Upload size={18} aria-hidden="true" />{t('settings.import')}</button>
      <input bind:this={fileInput} type="file" accept="application/json,.json" hidden onchange={importData} />
      <button class="btn btn-ghost danger" onclick={erase}><Trash2 size={18} aria-hidden="true" />{t('settings.clear')}</button>
      {#if message}
        <p class="message" class:error={message.kind === 'error'} role="status">{t(message.key)}</p>
      {/if}
    </section>

    <a class="card row link" href="#/sobre">
      <span>{t('settings.about')}</span>
      <ChevronRight size={20} aria-hidden="true" />
    </a>
  </div>
</div>

<style>
  fieldset { border: 1px solid var(--border); margin: 0; display: grid; gap: var(--space-1); }
  legend { font-weight: 600; padding: 0 var(--space-1); }
  .option { display: flex; align-items: center; gap: var(--space-3); min-height: 44px; }
  .option input { width: 20px; height: 20px; accent-color: var(--accent-strong); }
  .row { display: flex; justify-content: space-between; align-items: center; }
  .stepper { display: flex; align-items: center; gap: var(--space-1); }
  .data { display: grid; gap: var(--space-2); }
  .danger { color: var(--text-2); }
  .message { font-size: 0.875rem; font-weight: 550; color: var(--accent-strong); }
  .message.error { color: var(--text); }
  .small { font-size: 0.875rem; }
  .link { font-weight: 550; }
</style>
