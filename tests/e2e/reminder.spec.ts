import { expect, test, type Page } from '@playwright/test'

test.use({ locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' })

type Call = { method: string; path: string; body: Record<string, unknown> | null }

/** Permissão e inscrição de push falsas (o navegador de teste não fala com o serviço de push de verdade). */
async function fakePush(page: Page, permission: 'granted' | 'denied') {
  await page.addInitScript((result) => {
    let perm: NotificationPermission = 'default'
    Object.defineProperty(Notification, 'permission', { get: () => perm, configurable: true })
    Notification.requestPermission = async () => (perm = result)
    const KEY = 'fake-sub'
    const make = () => ({
      endpoint: 'https://fcm.googleapis.com/fcm/send/teste',
      toJSON: () => ({ endpoint: 'https://fcm.googleapis.com/fcm/send/teste', keys: { p256dh: 'BPk3', auth: 'x9A' } }),
      unsubscribe: async () => (localStorage.removeItem(KEY), true),
    })
    PushManager.prototype.getSubscription = async () => (localStorage.getItem(KEY) ? (make() as never) : null)
    PushManager.prototype.subscribe = async () => (localStorage.setItem(KEY, '1'), make() as never)
    // Permissão dada continua dada ao recarregar.
    if (localStorage.getItem('fake-perm') === 'granted') perm = 'granted'
    const original = Notification.requestPermission
    Notification.requestPermission = async () => {
      const r = await original()
      localStorage.setItem('fake-perm', r)
      return r
    }
  }, permission)
}

/** Registra os pedidos à API e responde com o status pedido. */
async function fakeApi(page: Page, status = 204) {
  const calls: Call[] = []
  await page.route('**/api/**', async (route) => {
    const req = route.request()
    const path = new URL(req.url()).pathname.replace(/^\/api/, '')
    calls.push({ method: req.method(), path, body: req.postData() ? JSON.parse(req.postData()!) : null })
    if (path === '/push/key') return route.fulfill({ json: { key: 'aGk_' } })
    return route.fulfill({ status, body: status >= 400 ? '{"error":"x"}' : undefined })
  })
  return calls
}

const toggle = (page: Page) => page.getByRole('switch', { name: 'Lembrar todo dia' })

test('liga, muda a hora e desliga o lembrete', async ({ page }) => {
  await fakePush(page, 'granted')
  const calls = await fakeApi(page)
  await page.goto('/#/ajustes')
  await toggle(page).check()
  await expect(page.getByText('Lembrete ativado para 07:00')).toBeVisible()
  const put = calls.find((c) => c.method === 'PUT')!
  expect(put.path).toBe('/reminders')
  expect(put.body).toMatchObject({
    time: '07:00',
    tz: 'America/Sao_Paulo',
    lang: 'pt',
    subscription: { endpoint: 'https://fcm.googleapis.com/fcm/send/teste' },
  })

  await page.getByLabel('Horário').fill('21:30')
  await page.getByLabel('Horário').blur()
  await expect.poll(() => calls.filter((c) => c.method === 'PUT').at(-1)?.body?.time).toBe('21:30')

  await page.reload()
  await expect(toggle(page)).toBeChecked()
  await expect(page.getByLabel('Horário')).toHaveValue('21:30')

  await toggle(page).uncheck()
  await expect.poll(() => calls.find((c) => c.method === 'DELETE')?.body).toEqual({ endpoint: 'https://fcm.googleapis.com/fcm/send/teste' })
  await expect(toggle(page)).not.toBeChecked()
})

test('permissão negada explica como liberar', async ({ page }) => {
  await fakePush(page, 'denied')
  const calls = await fakeApi(page)
  await page.goto('/#/ajustes')
  // O interruptor volta sozinho quando falha: clique simples, sem exigir que fique marcado.
  await toggle(page).click()
  await expect(page.getByText(/notificações estão bloqueadas/)).toBeVisible()
  await expect(toggle(page)).not.toBeChecked()
  expect(calls.filter((c) => c.method === 'PUT')).toEqual([])
})

test('servidor fora do ar: avisa e deixa desligado', async ({ page }) => {
  await fakePush(page, 'granted')
  await fakeApi(page, 503)
  await page.goto('/#/ajustes')
  // O interruptor volta sozinho quando falha: clique simples, sem exigir que fique marcado.
  await toggle(page).click()
  await expect(page.getByText('Não foi possível ativar agora. Tente de novo.')).toBeVisible()
  await expect(toggle(page)).not.toBeChecked()
})

test('ao ler um capítulo com o lembrete ligado, avisa o servidor que hoje já leu', async ({ page }) => {
  await fakePush(page, 'granted')
  const calls = await fakeApi(page)
  await page.goto('/#/ajustes')
  await toggle(page).check()
  await expect(page.getByText('Lembrete ativado para 07:00')).toBeVisible()
  await page.goto('/#/ler/JHN/1')
  await page.getByRole('button', { name: 'Marcar como lido' }).click()
  const today = await page.evaluate(() => new Date().toLocaleDateString('en-CA'))
  await expect.poll(() => calls.find((c) => c.path === '/reminders/done')?.body).toEqual({
    endpoint: 'https://fcm.googleapis.com/fcm/send/teste',
    date: today,
  })
})

test.describe('iPhone fora da Tela de Início', () => {
  test.use({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Version/17.4 Mobile/15E148 Safari/604.1' })

  test('explica como adicionar à Tela de Início', async ({ page }) => {
    await page.goto('/#/ajustes')
    await expect(page.getByText(/adicione o Selah à Tela de Início/)).toBeVisible()
    await expect(toggle(page)).toBeDisabled()
  })
})

test('apagar os dados com o lembrete ligado cancela a inscrição no servidor', async ({ page }) => {
  page.on('dialog', (d) => d.accept())
  await fakePush(page, 'granted')
  const calls = await fakeApi(page)
  await page.goto('/#/ajustes')
  await toggle(page).check()
  await expect(page.getByText('Lembrete ativado para 07:00')).toBeVisible()
  await page.getByRole('button', { name: 'Apagar dados' }).click()
  await expect.poll(() => calls.find((c) => c.method === 'DELETE')?.body).toEqual({ endpoint: 'https://fcm.googleapis.com/fcm/send/teste' })
  await expect(toggle(page)).not.toBeChecked()
})

test('inscrição que ficou no aparelho com o lembrete desligado é cancelada ao abrir o app', async ({ page }) => {
  await fakePush(page, 'granted')
  // Simula um desligamento que falhou sem internet: a inscrição continuou no aparelho.
  await page.addInitScript(() => localStorage.setItem('fake-sub', '1'))
  const calls = await fakeApi(page)
  await page.goto('/')
  await expect.poll(() => calls.find((c) => c.method === 'DELETE')?.body).toEqual({ endpoint: 'https://fcm.googleapis.com/fcm/send/teste' })
})
