import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// A política de segurança (CSP) do nginx libera o script inline do index.html pelo hash dele.
// Se o script mudar, o hash precisa mudar junto, senão o tema deixa de ser aplicado antes de o app carregar.
describe('CSP do nginx', () => {
  it('traz o hash do script inline do index.html', () => {
    const html = readFileSync('index.html', 'utf8')
    const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
    expect(inline).toHaveLength(1)
    const hash = `'sha256-${createHash('sha256').update(inline[0]).digest('base64')}'`
    const conf = readFileSync('deploy/nginx/selah.conf', 'utf8')
    const policies = [...conf.matchAll(/Content-Security-Policy "([^"]+)"/g)].map((m) => m[1])
    expect(policies.length).toBeGreaterThan(0)
    for (const policy of policies) expect(policy).toContain(hash)
  })
})
