import { execFileSync } from 'node:child_process'
import type { TestProject } from 'vitest/node'

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string
  }
}

const docker = (...args: string[]) => execFileSync('docker', args, { encoding: 'utf8' }).trim()

/** Sobe um Postgres descartável numa porta livre e entrega a URL aos testes. */
export default async function setup(project: TestProject) {
  const id = docker('run', '-d', '--rm', '-e', 'POSTGRES_PASSWORD=test', '-p', '127.0.0.1::5432', 'postgres:16-alpine')
  const port = docker('port', id, '5432/tcp').split(':').pop()
  for (let i = 0; ; i++) {
    try {
      docker('exec', id, 'pg_isready', '-U', 'postgres', '-h', '127.0.0.1')
      break
    } catch (err) {
      if (i > 60) throw err
      await new Promise((r) => setTimeout(r, 500))
    }
  }
  project.provide('databaseUrl', `postgres://postgres:test@127.0.0.1:${port}/postgres`)
  return () => {
    docker('rm', '-f', id)
  }
}
