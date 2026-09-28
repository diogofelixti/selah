// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it } from 'vitest'
import ProgressBar from './ProgressBar.svelte'

afterEach(cleanup)

describe('ProgressBar', () => {
  it('com nome, é uma barra de progresso acessível', () => {
    render(ProgressBar, { value: 40, label: 'João' })
    expect(screen.getByRole('progressbar', { name: 'João' }).getAttribute('aria-valuenow')).toBe('40')
  })

  it('sem nome, fica escondida de leitores de tela (o texto ao lado já informa)', () => {
    render(ProgressBar, { value: 40 })
    expect(screen.queryByRole('progressbar')).toBeNull()
  })
})
