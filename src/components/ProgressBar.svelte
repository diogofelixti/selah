<script lang="ts">
  let { value, label }: { value: number; label?: string } = $props()
</script>

<!-- Sem nome, a barra é só visual: o texto ao lado ("3/21") já diz o mesmo para leitores de tela. -->
{#if label}
  <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value} aria-label={label}>
    <span style:width={`${value}%`}></span>
  </div>
{:else}
  <div class="bar" aria-hidden="true">
    <span style:width={`${value}%`}></span>
  </div>
{/if}

<style>
  .bar { height: 4px; border-radius: 999px; background: var(--progress-track); overflow: hidden; }
  span { display: block; height: 100%; background: var(--progress); border-radius: inherit; }
</style>
