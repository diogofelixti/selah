import postgres from 'postgres'

export type Sql = postgres.Sql

export function connect(url: string): Sql {
  return postgres(url, { max: 5, onnotice: () => {} })
}
