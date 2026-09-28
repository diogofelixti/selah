<script lang="ts">
  import { t } from '../lib/i18n/i18n.svelte'
  let { testament }: { testament: 'OT' | 'NT' } = $props()
</script>

<div class="page"><h1>{t('bible.title')}</h1><p>{testament}</p></div>
