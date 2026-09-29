import { expect, test, type Page } from '@playwright/test'

// O Chromium completo (não o headless-shell padrão) é o que mostra notificações.
test.use({ locale: 'pt-BR', permissions: ['notifications'], channel: 'chromium' })

/** Entrega um push ao service worker pelo protocolo do Chrome, como faria o serviço de push. */
async function deliverPush(page: Page, data: string) {
  const cdp = await page.context().newCDPSession(page)
  const registrationId = new Promise<string>((resolve) => {
    cdp.on('ServiceWorker.workerRegistrationUpdated', ({ registrations }) => {
      const reg = registrations.find((r: { isDeleted: boolean }) => !r.isDeleted)
      if (reg) resolve(reg.registrationId)
    })
  })
  await cdp.send('ServiceWorker.enable')
  await cdp.send('ServiceWorker.deliverPushMessage', { origin: new URL(page.url()).origin, registrationId: await registrationId, data })
}

const notifications = (page: Page) =>
  page.evaluate(async () =>
    (await (await navigator.serviceWorker.ready).getNotifications()).map((n) => ({ title: n.title, body: n.body, url: n.data?.url })),
  )

test('o lembrete mostra os capítulos de hoje do plano ativo', async ({ page }) => {
  page.on('dialog', (d) => d.accept())
  await page.goto('/#/planos')
  await page.getByRole('button', { name: 'Começar: Evangelhos em 30 dias' }).click()
  await expect(page.getByText(/Dia 1 de 30/).first()).toBeVisible()
  await page.evaluate(() => navigator.serviceWorker.ready)

  await deliverPush(page, JSON.stringify({ type: 'reminder' }))
  await expect.poll(() => notifications(page)).toEqual([{ title: 'Hora da leitura', body: 'Hoje: Mateus 1 a 3', url: '/#/planos' }])
})

test('sem plano, convida a continuar do último capítulo', async ({ page }) => {
  await page.goto('/#/ler/JHN/3')
  await expect(page.locator('#v1')).toBeVisible()
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await deliverPush(page, JSON.stringify({ type: 'reminder' }))
  await expect.poll(() => notifications(page)).toEqual([{ title: 'Hora da leitura', body: 'Continue em João 3', url: '/#/ler/JHN/3' }])
})
