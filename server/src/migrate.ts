import { readdir, readFile } from 'node:fs/promises'
import type { Sql } from './db.js'

const DIR = new URL('../migrations/', import.meta.url)

/** Aplica, em ordem, os arquivos SQL de migrations/ que ainda não rodaram. Seguro com várias instâncias. */
export async function migrate(sql: Sql): Promise<void> {
  await sql`create table if not exists migrations (name text primary key, applied_at timestamptz not null default now())`
  const files = (await readdir(DIR)).filter((f) => f.endsWith('.sql')).sort()
  await sql.begin(async (tx) => {
    // Trava para duas instâncias não aplicarem a mesma migração ao mesmo tempo.
    await tx`select pg_advisory_xact_lock(7243)`
    const done = new Set((await tx`select name from migrations`).map((r) => r.name as string))
    for (const file of files) {
      if (done.has(file)) continue
      await tx.unsafe(await readFile(new URL(file, DIR), 'utf8'))
      await tx`insert into migrations (name) values (${file})`
    }
  })
}
