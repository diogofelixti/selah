<script lang="ts">
  import { t } from '../lib/i18n/i18n.svelte'
  let { book }: { book: string } = $props()
</script>

<div class="page"><h1>{t(`books.${book}`)}</h1></div>
