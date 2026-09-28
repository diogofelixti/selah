// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/svelte'
import { afterEach, describe, expect, it } from 'vitest'
import ProgressRing from './ProgressRing.svelte'

afterEach(cleanup)

describe('ProgressRing', () => {
  it('desenha o arco proporcional ao valor e fica escondido de leitores de tela', () => {
    const { container } = render(ProgressRing, { value: 25, size: 44, stroke: 4 })
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    const arc = container.querySelectorAll('circle')[1]
    const r = (44 - 4) / 2
    const circ = 2 * Math.PI * r
    expect(arc.getAttribute('stroke-dasharray')).toBe(`${(circ * 0.25).toFixed(2)} ${circ.toFixed(2)}`)
  })

  it('limita o valor entre 0 e 100', () => {
    const { container } = render(ProgressRing, { value: 140 })
    const [filled, total] = container.querySelectorAll('circle')[1].getAttribute('stroke-dasharray')!.split(' ')
    expect(filled).toBe(total)
  })
})
