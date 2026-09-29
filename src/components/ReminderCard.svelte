<script lang="ts">
  import { Bell } from '@lucide/svelte'
  import { app, updateSettings } from '../lib/app.svelte'
  import { locale, t } from '../lib/i18n/i18n.svelte'
  import { currentSupport, disableReminder, enableReminder } from '../lib/reminder'
  import { isReminderTime } from '../lib/storage/types'
  import { showToast } from '../lib/toast.svelte'

  const support = currentSupport()
  const reminder = $derived(app.settings.reminder)
  let busy = $state(false)
  let message = $state<string | null>(null)

  async function onToggle(event: Event & { currentTarget: HTMLInputElement }) {
    const input = event.currentTarget
    busy = true
    message = null
    try {
      if (input.checked) {
        const result = await enableReminder(reminder.time, locale.lang)
        if (result === 'ok') {
          await updateSettings({ reminder: { enabled: true, time: reminder.time } })
          showToast(t('reminder.enabled', { time: reminder.time }))
        } else {
          input.checked = false
          message = t(result === 'denied' ? 'reminder.denied' : 'reminder.failed')
        }
      } else {
        await disableReminder()
        await updateSettings({ reminder: { enabled: false, time: reminder.time } })
        showToast(t('reminder.disabled'))
      }
    } finally {
      busy = false
    }
  }

  async function onTime(event: Event & { currentTarget: HTMLInputElement }) {
    const input = event.currentTarget
    const time = input.value
    if (!isReminderTime(time) || time === reminder.time) return
    message = null
    if (!reminder.enabled) return void updateSettings({ reminder: { enabled: false, time } })
    busy = true
    try {
      if ((await enableReminder(time, locale.lang)) === 'ok') {
        await updateSettings({ reminder: { enabled: true, time } })
        showToast(t('reminder.timeChanged', { time }))
      } else {
        // O servidor continua com a hora antiga: a tela volta para ela.
        input.value = reminder.time
        message = t('reminder.failed')
      }
    } finally {
      busy = false
    }
  }
</script>

<section class="card reminder" aria-labelledby="reminder-title">
  <h2 id="reminder-title"><Bell size={20} aria-hidden="true" />{t('reminder.title')}</h2>
  <p class="small muted">{t('reminder.text')}</p>
  <label class="row">
    <span>{t('reminder.toggle')}</span>
    <input type="checkbox" role="switch" checked={reminder.enabled} disabled={busy || support !== 'ok'} onchange={onToggle} />
  </label>
  <label class="row">
    <span>{t('reminder.time')}</span>
    <input class="time" type="time" step="300" value={reminder.time} disabled={busy || support !== 'ok'} onchange={onTime} />
  </label>
  <p class="small note" aria-live="polite">
    {#if support === 'ios-install'}{t('reminder.iosInstall')}{:else if support === 'unsupported'}{t('reminder.unsupported')}{:else if message}{message}{/if}
  </p>
</section>

<style>
  .reminder { display: grid; gap: var(--space-3); }
  h2 { display: flex; align-items: center; gap: var(--space-2); }
  h2 :global(svg) { color: var(--accent-text); flex-shrink: 0; }
  .small { font-size: 0.875rem; line-height: 1.6; }
  .note:empty { display: none; }
  .row { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); min-height: 44px; }
  /* Interruptor: a linha inteira (label) é o alvo de toque de 44px. */
  input[role='switch'] {
    appearance: none; position: relative; flex-shrink: 0; margin: 0; cursor: pointer;
    width: 52px; height: 32px; border-radius: 999px;
    background: var(--track); border: 1px solid var(--border-strong);
    transition: background 0.2s;
  }
  input[role='switch']::before {
    content: ''; position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%;
    background: var(--text-2); transition: transform 0.2s;
  }
  input[role='switch']:checked { background: var(--accent); border-color: var(--accent); }
  input[role='switch']:checked::before { transform: translateX(20px); background: var(--on-accent); }
  input[role='switch']:disabled { opacity: 0.5; cursor: default; }
  .time {
    min-height: 44px; padding: 0 var(--space-3); font: inherit; color: var(--text);
    background: var(--surface-2); border: 1px solid var(--border-strong); border-radius: var(--radius-s);
  }
</style>
