import { serve } from '@hono/node-server'
import webpush from 'web-push'
import { createApp } from './app.js'
import { loadConfig } from './config.js'
import { connect } from './db.js'
import { migrate } from './migrate.js'
import { makeSend } from './push.js'
import { runDue } from './scheduler.js'

const config = loadConfig()
const sql = connect(config.databaseUrl)
await migrate(sql)

const app = createApp({ sql, now: () => new Date(), vapidPublicKey: config.vapid.publicKey })
const server = serve({ fetch: app.fetch, port: config.port, hostname: '0.0.0.0' }, (info) => {
  console.log(`selah-api ouvindo na porta ${info.port}`)
})

webpush.setVapidDetails(config.vapid.subject, config.vapid.publicKey, config.vapid.privateKey)
const send = makeSend(webpush)

// Roda a cada minuto; se uma rodada demorar, a próxima espera (sem rodadas sobrepostas).
let running = false
const timer = setInterval(async () => {
  if (running) return
  running = true
  try {
    const r = await runDue(sql, new Date(), send)
    if (r.sent || r.removed || r.failed) console.log(`lembretes: ${r.sent} enviados, ${r.removed} removidos, ${r.failed} falhas`)
  } catch (err) {
    console.error('agendador', err)
  } finally {
    running = false
  }
}, 60_000)

async function shutdown() {
  clearInterval(timer)
  server.close()
  await sql.end({ timeout: 5 })
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
