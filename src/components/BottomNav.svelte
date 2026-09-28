<script lang="ts">
  import { BookOpen, CalendarCheck, House, LayoutGrid } from '@lucide/svelte'
  import { t } from '../lib/i18n/i18n.svelte'

  let { active }: { active: 'home' | 'bible' | 'plans' | 'topics' | null } = $props()

  const TABS = [
    { id: 'home', href: '#/', icon: House, label: 'nav.home' },
    { id: 'bible', href: '#/biblia', icon: BookOpen, label: 'nav.bible' },
    { id: 'plans', href: '#/planos', icon: CalendarCheck, label: 'nav.plans' },
    { id: 'topics', href: '#/temas', icon: LayoutGrid, label: 'nav.topics' },
  ] as const
</script>

<nav class="bottom-nav" aria-label={t('nav.main')}>
  {#each TABS as tab (tab.id)}
    <a href={tab.href} aria-current={active === tab.id ? 'page' : undefined}>
      <tab.icon size={22} aria-hidden="true" />
      <span>{t(tab.label)}</span>
    </a>
  {/each}
</nav>

<style>
  .bottom-nav {
    position: fixed;
    inset: auto 0 0 0;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    height: calc(var(--nav-height) + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--surface);
    border-top: 1px solid var(--border);
  }
  a {
    display: grid;
    place-items: center;
    align-content: center;
    gap: 2px;
    font-size: 0.75rem;
    color: var(--text-2);
  }
  a[aria-current='page'] { color: var(--accent-strong); font-weight: 600; }
</style>
