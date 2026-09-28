import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR', serviceWorkers: 'block' })

test('versículo do dia mostra erro e tenta de novo quando não carrega', async ({ page }) => {
  let fail = true
  await page.route('**/bibles/BLIVRE/*.json', (route) => (fail ? route.abort() : route.continue()))
  await page.goto('/')
  await expect(page.getByText('Não foi possível carregar o versículo.')).toBeVisible()
  fail = false
  await page.getByRole('button', { name: 'Tentar de novo' }).click()
  await expect(page.locator('.verse-card blockquote')).not.toBeEmpty()
})

test('com movimento reduzido, o versículo aberto continua destacado', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/ler/PSA/23/4')
  await expect(page.locator('#v4')).toHaveClass(/flash/)
  await expect(page.locator('#v4')).toHaveCSS('background-color', 'rgb(246, 231, 196)')
})

test('durante um plano, tocar e segurar um capítulo lido antes não apaga o histórico', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept())
  await page.goto('/#/ler/JHN/3')
  await page.getByRole('button', { name: 'Marcar como lido' }).click()
  await page.goto('/#/planos')
  await page.getByRole('article').filter({ hasText: 'Evangelhos em 30 dias' }).getByRole('button', { name: 'Começar' }).click()
  await page.goto('/#/livro/JHN')
  const cell = page.getByRole('link', { name: 'Capítulo 3, lido', exact: true })
  const box = (await cell.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(700)
  await page.mouse.up()
  await expect(page.getByRole('link', { name: 'Capítulo 3, lido', exact: true })).toBeVisible()
  await page.goto('/#/ler/JHN/3')
  await expect(page.getByRole('button', { name: 'Lido ✓' })).toBeVisible()
})

test('avisa quando não consegue salvar no aparelho', async ({ page }) => {
  await page.addInitScript(() => {
    IDBObjectStore.prototype.add = function () {
      throw new DOMException('Sem espaço', 'QuotaExceededError')
    }
  })
  await page.goto('/#/ler/JHN/1')
  await page.getByRole('button', { name: 'Marcar como lido' }).click()
  await expect(page.getByText('Não foi possível salvar no aparelho.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Marcar como lido' })).toBeVisible()
})

test('com o armazenamento quebrado, o app abre mesmo assim', async ({ page }) => {
  await page.addInitScript(() => {
    IDBObjectStore.prototype.getAll = function () {
      throw new DOMException('Banco fechado', 'InvalidStateError')
    }
  })
  await page.goto('/')
  await expect(page.getByText('Versículo do dia')).toBeVisible()
  await expect(page.getByText(/Seu navegador não permite salvar dados/)).toBeVisible()
})

test('voltar no leitor aberto por link externo fica no app', async ({ page }) => {
  await page.goto('about:blank')
  await page.goto('/#/ler/JHN/3')
  await expect(page.locator('#v16')).toBeVisible()
  await page.getByRole('button', { name: 'Voltar', exact: true }).click()
  await expect(page).toHaveURL(/#\/livro\/JHN$/)
})

test('voltar no leitor depois de navegar no app volta para a tela anterior', async ({ page }) => {
  await page.goto('/#/livro/RUT')
  await page.getByRole('link', { name: 'Capítulo 2', exact: true }).click()
  await page.getByRole('link', { name: 'Próximo capítulo' }).click()
  await expect(page).toHaveURL(/#\/ler\/RUT\/3$/)
  await page.getByRole('button', { name: 'Voltar', exact: true }).click()
  await expect(page).toHaveURL(/#\/ler\/RUT\/2$/)
  await page.getByRole('button', { name: 'Voltar', exact: true }).click()
  await expect(page).toHaveURL(/#\/livro\/RUT$/)
})
