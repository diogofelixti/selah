import { randomBytes } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, inject } from 'vitest'
import { migrate } from '../src/migrate.js'

/** Banco novo e migrado para o arquivo de teste; apagado no fim. */
export async function freshDb() {
  const admin = postgres(inject('databaseUrl'), { max: 1, onnotice: () => {} })
  const name = `t_${randomBytes(6).toString('hex')}`
  await admin.unsafe(`create database ${name}`)
  const url = new URL(inject('databaseUrl'))
  url.pathname = `/${name}`
  const sql = postgres(url.toString(), { max: 4, onnotice: () => {} })
  await migrate(sql)
  afterAll(async () => {
    await sql.end()
    await admin.unsafe(`drop database ${name} with (force)`)
    await admin.end()
  })
  return sql
}
