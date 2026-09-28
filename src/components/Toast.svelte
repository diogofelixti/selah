<script lang="ts">
  import { toast } from '../lib/toast.svelte'
</script>

<!-- No topo da tela: o rodapé já tem a barra de navegação, a barra de cópia e o aviso de atualização. -->
{#if toast.message}
  <div class="toast" role="status">{toast.message}</div>
{/if}

<style>
  .toast {
    position: fixed;
    left: 50%;
    top: calc(env(safe-area-inset-top) + var(--space-4));
    transform: translateX(-50%);
    padding: var(--space-3) var(--space-5);
    border-radius: 999px;
    background: var(--text);
    color: var(--bg);
    font-weight: 600;
    box-shadow: var(--shadow);
    z-index: 4;
  }
</style>
