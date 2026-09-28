// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import UpdateBanner from './UpdateBanner.svelte'

afterEach(cleanup)

describe('UpdateBanner', () => {
  it('atualiza e pode ser fechado', async () => {
    const onUpdate = vi.fn()
    const onDismiss = vi.fn()
    render(UpdateBanner, { withNav: true, onUpdate, onDismiss })
    await fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onUpdate).toHaveBeenCalledOnce()
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('fica rente ao rodapé quando não há barra de navegação (leitor)', () => {
    render(UpdateBanner, { withNav: false, onUpdate: vi.fn(), onDismiss: vi.fn() })
    expect(screen.getByRole('status').classList.contains('no-nav')).toBe(true)
  })
})
