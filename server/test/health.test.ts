import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { migrate } from '../src/migrate.js'
import { freshDb } from './db.js'

const sql = await freshDb()
const app = createApp({ sql, now: () => new Date(), vapidPublicKey: 'chave' })

describe('esqueleto', () => {
  it('responde à checagem de saúde consultando o banco', async () => {
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('migrações criam as tabelas e podem rodar de novo sem erro', async () => {
    await migrate(sql)
    const rows = await sql`select name from migrations order by name`
    expect(rows.map((r) => r.name)).toEqual(['001_reminders.sql'])
    const [{ exists }] = await sql`select to_regclass('reminders') is not null as exists`
    expect(exists).toBe(true)
  })

  it('rota desconhecida devolve 404 em JSON', async () => {
    const res = await app.request('/api/nada')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'not_found' })
  })
})
