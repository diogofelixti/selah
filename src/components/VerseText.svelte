<script lang="ts">
  import { splitImplied } from '../lib/bible/format'

  // Palavras implícitas da tradução ([assim]) aparecem em itálico, sem colchetes, como no leitor.
  let { text }: { text: string } = $props()
</script>

{#each splitImplied(text) as part, i (i)}{#if part.implied}<em>{part.text}</em>{:else}{part.text}{/if}{/each}
