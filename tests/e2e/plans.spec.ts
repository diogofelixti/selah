import { expect, test } from '@playwright/test'

test.use({ locale: 'pt-BR' })

async function startGospels(page: import('@playwright/test').Page) {
  await page.goto('/#/planos')
  await page.getByRole('article').filter({ hasText: 'Evangelhos em 30 dias' }).getByRole('button', { name: 'Começar' }).click()
}

test('marca capítulos do plano sem abrir o leitor e o plano avança', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept())
  await startGospels(page)
  await expect(page.getByText('0 de 89 capítulos · Dia 1 de 30')).toBeVisible()
  await page.getByRole('button', { name: 'Mateus 1', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Mateus 1', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('1 de 89 capítulos · Dia 1 de 30')).toBeVisible()
  await page.getByRole('button', { name: 'Marcar o dia todo' }).first().click()
  await expect(page.getByText('3 de 89 capítulos · Dia 2 de 30')).toBeVisible()
  await expect(page.getByText('3%', { exact: true })).toBeVisible()
  await expect(page.getByText('Faltam 29 dias de leitura')).toBeVisible()
  await page.goto('/#/controle')
  await page.getByRole('button', { name: /Novo/ }).click()
  await expect(page.getByRole('button', { name: /Mateus/ })).toContainText('3 de 28 capítulos')
})

test('o botão de ler abre o capítulo do plano', async ({ page }) => {
  await startGospels(page)
  await page.getByRole('link', { name: 'Ler Mateus 2' }).click()
  await expect(page).toHaveURL(/#\/ler\/MAT\/2$/)
})

test('a faixa mostra o dia atual e o plano pode ser encerrado', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept())
  await startGospels(page)
  await expect(page.locator('.strip [data-current="true"]')).toHaveText('1')
  await expect(page.locator('.strip li')).toHaveCount(7)
  await page.getByRole('button', { name: 'Encerrar plano' }).click()
  await expect(page.getByText(/Dia 1 de 30/)).toHaveCount(0)
})

test('capítulo lido antes do plano precisa ser marcado de novo para o plano', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept())
  await page.goto('/#/ler/MRK/1')
  await page.getByRole('button', { name: 'Marcar como lido' }).click()
  // Espera a gravação terminar antes de sair da página.
  await expect(page.getByRole('button', { name: 'Lido ✓' })).toBeVisible()
  await page.goto('/#/planos')
  await page.getByRole('article').filter({ hasText: 'Novo Testamento em 90 dias' }).getByRole('button', { name: 'Começar' }).click()
  await page.goto('/#/ler/MRK/1')
  await expect(page.getByRole('button', { name: 'Marcar como lido' })).toBeVisible()
})

test('planos em cinco grupos, com os novos para começar', async ({ page }) => {
  await page.goto('/#/planos')
  const groups = page.getByRole('heading', { level: 2 })
  await expect(groups).toHaveText([
    'Para começar',
    'Um livro para cada momento',
    'Para aprofundar',
    'A Bíblia inteira',
    'Personagens da Bíblia',
  ])
  // 19 planos nos grupos antigos e 19 em "Um livro para cada momento" (João e Provérbios estão nos dois).
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(38)
  const david = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'História de Davi' }) })
  await expect(david.getByText('42 dias', { exact: true })).toBeVisible()
  const john = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'João em 21 dias' }) })
  await expect(john.getByText('21 dias', { exact: true })).toBeVisible()
  // Cada botão diz qual plano começa.
  await expect(page.getByRole('button', { name: 'Começar: História de Davi' })).toBeVisible()
  await john.getByRole('button', { name: 'Começar: João em 21 dias' }).click()
  await expect(page.getByText('Dia 1 de 21').first()).toBeVisible()
})

test('um livro para cada momento: a frase é o título e o plano começa por ela', async ({ page }) => {
  await page.goto('/#/planos')
  const group = page.getByRole('region', { name: 'Um livro para cada momento' })
  await expect(group.getByRole('heading', { level: 3 }).first()).toHaveText('Conhecer o que Jesus fez')
  const ephesians = group.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Conhecer sua identidade em Cristo' }) })
  await expect(ephesians.getByText('Efésios em 6 dias')).toBeVisible()
  await expect(ephesians.getByText('6 dias', { exact: true })).toBeVisible()
  await ephesians.getByRole('button', { name: 'Começar: Conhecer sua identidade em Cristo' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Efésios em 6 dias' })).toBeVisible()
  await expect(page.getByText('Dia 1 de 6').first()).toBeVisible()
})

test('João começado pelo grupo novo aparece como o mesmo plano nos dois grupos', async ({ page }) => {
  await page.goto('/#/planos')
  await page.getByRole('button', { name: 'Começar: Conhecer quem Jesus é' }).click()
  await expect(page.getByText('Dia 1 de 21').first()).toBeVisible()
  // Os dois cartões de João mostram o andamento em vez do botão Começar.
  await expect(page.getByText('0% concluído')).toHaveCount(2)
})
