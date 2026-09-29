import { serve } from '@hono/node-server'
import { createApp } from './app.js'
import { loadConfig } from './config.js'
import { connect } from './db.js'
import { migrate } from './migrate.js'

const config = loadConfig()
const sql = connect(config.databaseUrl)
await migrate(sql)

const app = createApp({ sql, now: () => new Date(), vapidPublicKey: config.vapid.publicKey })
const server = serve({ fetch: app.fetch, port: config.port, hostname: '0.0.0.0' }, (info) => {
  console.log(`selah-api ouvindo na porta ${info.port}`)
})

async function shutdown() {
  server.close()
  await sql.end({ timeout: 5 })
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
