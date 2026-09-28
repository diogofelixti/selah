<script lang="ts">
  import { BookOpen, CalendarCheck, Heart, House, SquareCheckBig } from '@lucide/svelte'
  import { t } from '../lib/i18n/i18n.svelte'

  let { active }: { active: 'home' | 'read' | 'tracker' | 'plans' | 'topics' | null } = $props()

  const TABS = [
    { id: 'home', href: '#/', icon: House, label: 'nav.home' },
    { id: 'read', href: '#/biblia', icon: BookOpen, label: 'nav.read' },
    { id: 'tracker', href: '#/controle', icon: SquareCheckBig, label: 'nav.tracker' },
    { id: 'plans', href: '#/planos', icon: CalendarCheck, label: 'nav.plans' },
    { id: 'topics', href: '#/temas', icon: Heart, label: 'nav.topics' },
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
    left: 14px;
    right: 14px;
    bottom: calc(16px + env(safe-area-inset-bottom));
    height: 68px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-l);
    box-shadow: var(--shadow);
    max-width: 40rem;
    margin: 0 auto;
  }
  a {
    display: grid;
    place-items: center;
    align-content: center;
    gap: 3px;
    font-size: 0.6875rem;
    color: var(--text-2);
  }
  a[aria-current='page'] { color: var(--accent-text); font-weight: 700; }
</style>
