import { describe, expect, it } from 'vitest'
import { reminderNotification } from './reminder-text'

const day = Date.UTC(2026, 8, 29, 12)
const empty = { readings: [], state: { lastPosition: null, activePlan: null } }

describe('reminderNotification', () => {
  it('com plano ativo, mostra os capítulos de hoje e abre os Planos', () => {
    const data = { ...empty, state: { lastPosition: null, activePlan: { id: 'gospels-30' as const, startedAt: day - 1000 } } }
    expect(reminderNotification(data, 'pt')).toEqual({ title: 'Hora da leitura', body: 'Hoje: Mateus 1 a 3', url: '/#/planos' })
    expect(reminderNotification(data, 'en').body).toBe('Today: Matthew 1 to 3')
  })

  it('segue o plano: com o dia 1 lido, mostra o dia 2', () => {
    const readings = ['MAT.1', 'MAT.2', 'MAT.3'].map((ref) => ({ ref, readAt: day }))
    const data = { readings, state: { lastPosition: null, activePlan: { id: 'gospels-30' as const, startedAt: day - 1000 } } }
    expect(reminderNotification(data, 'pt').body).toBe('Hoje: Mateus 4 a 6')
  })

  it('plano concluído ou sem plano, com última posição: continuar de onde parou', () => {
    const data = { ...empty, state: { lastPosition: { book: 'JHN', chapter: 3 }, activePlan: null } }
    expect(reminderNotification(data, 'pt')).toEqual({ title: 'Hora da leitura', body: 'Continue em João 3', url: '/#/ler/JHN/3' })
    expect(reminderNotification(data, 'en').body).toBe('Continue at John 3')
  })

  it('sem plano e sem posição: convite geral', () => {
    expect(reminderNotification(empty, 'pt')).toEqual({ title: 'Hora da leitura', body: 'Um momento com a Palavra hoje.', url: '/' })
    expect(reminderNotification(empty, 'en')).toEqual({ title: 'Time to read', body: 'A moment with the Word today.', url: '/' })
  })

  it('plano salvo com id desconhecido (versão futura) cai para a última posição', () => {
    const data = { ...empty, state: { lastPosition: { book: 'JHN', chapter: 3 }, activePlan: { id: 'nao-existe', startedAt: day } } }
    expect(reminderNotification(data as never, 'pt').body).toBe('Continue em João 3')
  })
})
