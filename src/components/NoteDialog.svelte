<script lang="ts">
  import { t } from '../lib/i18n/i18n.svelte'
  import { NOTE_MAX } from '../lib/storage/types'

  let {
    title,
    initial,
    onSave,
    onDelete,
    onClose,
  }: { title: string; initial: string; onSave: (note: string) => void; onDelete: () => void; onClose: () => void } = $props()

  let dialog: HTMLDialogElement
  // O texto inicial só preenche o campo na abertura.
  let note = $state('')

  $effect(() => {
    note = initial
    dialog.showModal()
    return () => dialog.close()
  })

  function save(e: SubmitEvent) {
    e.preventDefault()
    onSave(note)
  }
</script>

<dialog bind:this={dialog} aria-labelledby="note-title" onclose={onClose} oncancel={onClose}>
  <form onsubmit={save}>
    <h2 id="note-title">{title}</h2>
    <label>
      <span class="sr-only">{t('marks.noteLabel')}</span>
      <!-- svelte-ignore a11y_autofocus -->
      <textarea bind:value={note} maxlength={NOTE_MAX} rows="6" autofocus></textarea>
    </label>
    <p class="muted counter">{note.length}/{NOTE_MAX}</p>
    <div class="actions">
      {#if initial}
        <button type="button" class="btn btn-ghost danger" onclick={onDelete}>{t('marks.deleteNote')}</button>
      {/if}
      <span class="grow"></span>
      <button type="button" class="btn btn-ghost" onclick={onClose}>{t('marks.cancel')}</button>
      <button type="submit" class="btn btn-dark">{t('marks.save')}</button>
    </div>
  </form>
</dialog>

<style>
  dialog {
    width: min(34rem, calc(100vw - 32px));
    border: 1px solid var(--border);
    border-radius: var(--radius-l);
    padding: var(--space-5);
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow);
  }
  dialog::backdrop { background: rgba(0, 0, 0, 0.4); }
  form { display: grid; gap: var(--space-3); }
  textarea {
    width: 100%;
    box-sizing: border-box;
    padding: var(--space-3);
    border-radius: var(--radius-m);
    border: 1px solid var(--border-strong);
    background: var(--bg);
    color: var(--text);
    font: inherit;
    font-family: var(--font-read);
    font-size: 1.0625rem;
    line-height: 1.5;
    resize: vertical;
  }
  .counter { font-size: 0.8125rem; text-align: right; }
  .actions { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
  .grow { flex-grow: 1; }
  .danger { color: var(--text-2); }
</style>
