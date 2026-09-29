import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

test('com uma janela antiga aberta, o app abre e avisa em vez de ficar em branco', async ({ context }) => {
  const old = await context.newPage()
  // Página do mesmo site que não roda o app, para só ela segurar o banco.
  await old.goto('/pwa-64x64.png')
  // Simula uma janela da versão anterior do app segurando o banco na versão 1.
  await old.evaluate(async () => {
    const dbs = await indexedDB.databases()
    if (dbs.some((d) => d.name === 'selah')) {
      await new Promise((ok) => {
        const del = indexedDB.deleteDatabase('selah')
        del.onsuccess = del.onerror = del.onblocked = () => ok(null)
      })
    }
    await new Promise((ok) => {
      const req = indexedDB.open('selah', 1)
      req.onupgradeneeded = () => {
        req.result.createObjectStore('readings', { autoIncrement: true }).createIndex('ref', 'ref')
        req.result.createObjectStore('settings')
        req.result.createObjectStore('state')
      }
      req.onsuccess = () => {
        ;(window as unknown as { __old: IDBDatabase }).__old = req.result
        ok(null)
      }
    })
  })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByText(/Feche as outras janelas do Selah/)).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('Versículo do dia')).toBeVisible()
})
