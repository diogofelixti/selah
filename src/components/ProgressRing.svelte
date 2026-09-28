<script lang="ts">
  let { value, size = 44, stroke = 5 }: { value: number; size?: number; stroke?: number } = $props()

  const r = $derived((size - stroke) / 2)
  const circ = $derived(2 * Math.PI * r)
  const filled = $derived((circ * Math.min(100, Math.max(0, value))) / 100)
</script>

<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
  <circle cx={size / 2} cy={size / 2} {r} fill="none" stroke="var(--track)" stroke-width={stroke}></circle>
  <circle
    cx={size / 2}
    cy={size / 2}
    {r}
    fill="none"
    stroke="var(--accent)"
    stroke-width={stroke}
    stroke-linecap="round"
    stroke-dasharray={`${filled.toFixed(2)} ${circ.toFixed(2)}`}
    transform={`rotate(-90 ${size / 2} ${size / 2})`}
  ></circle>
</svg>
