<script lang="ts">
  let { message }: { message: string | null } = $props()
</script>

{#if message}
  <div class="toast" role="status">{message}</div>
{/if}

<style>
  .toast {
    position: fixed;
    left: 50%;
    bottom: calc(96px + env(safe-area-inset-bottom));
    transform: translateX(-50%);
    padding: var(--space-3) var(--space-5);
    border-radius: 999px;
    background: var(--text);
    color: var(--bg);
    font-weight: 600;
    z-index: 3;
  }
</style>
