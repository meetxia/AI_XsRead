import { expect, test } from '@playwright/test'

test.describe('Requirement 37.2 / highlight persistence', () => {
  test.skip(process.env.E2E_READY !== '1', 'Set E2E_READY=1 after highlight APIs and data-testid hooks are available.')

  test('highlight remains visible after leaving and reopening the reading page', async ({ browser }) => {
    const context = await browser.newContext({ storageState: process.env.E2E_USER_STATE })
    const page = await context.newPage()

    await page.goto('/reading/1?chapter=5')
    const paragraph = page.getByTestId('paragraph-17')
    await paragraph.selectText()
    await page.getByTestId('highlight-color-yellow').click()
    await expect(page.getByTestId('highlight-mark').first()).toBeVisible()

    await page.goto('/')
    await page.goto('/reading/1?chapter=5')

    await expect(page.getByTestId('highlight-mark').first()).toBeVisible()
    await context.close()
  })
})
