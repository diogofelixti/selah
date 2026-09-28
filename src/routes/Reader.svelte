<script lang="ts">
  import { t } from '../lib/i18n/i18n.svelte'
  let { book, chapter, verse }: { book: string; chapter: number; verse?: number } = $props()
</script>

<div class="page"><h1>{t(`books.${book}`)} {chapter}</h1>{#if verse}<p>{verse}</p>{/if}</div>
