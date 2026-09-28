<script lang="ts">
  import { Bird, Flower2, Heart, HeartCrack, Mountain, Shield, Sparkles, Sun, Sunrise, Wind } from '@lucide/svelte'
  import type { TopicIcon } from '../lib/topics/topics'

  let { name, size = 24 }: { name: TopicIcon; size?: number } = $props()

  const ICONS = {
    wind: Wind,
    'heart-crack': HeartCrack,
    flower: Flower2,
    shield: Shield,
    heart: Heart,
    sun: Sun,
    sunrise: Sunrise,
    sparkles: Sparkles,
    bird: Bird,
    mountain: Mountain,
  }

  const Icon = $derived(ICONS[name])
</script>

<Icon {size} aria-hidden="true" />
