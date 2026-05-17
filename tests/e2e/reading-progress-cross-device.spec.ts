import { expect, test } from '@playwright/test'

test.describe('Requirement 37.2 / reading progress cross-device', () => {
  test.skip(process.env.E2E_READY !== '1', 'Set E2E_READY=1 after login fixtures and seeded chapter data are available.')

  test('A client position is restored in B client with paragraph-level precision', async ({ browser }) => {
    const clientA = await browser.newContext({ storageState: process.env.E2E_USER_STATE })
    const clientB = await browser.newContext({ storageState: process.env.E2E_USER_STATE })
    const pageA = await clientA.newPage()
    const pageB = await clientB.newPage()

    await pageA.goto('/reading/1?chapter=5')
    const targetParagraph = pageA.getByTestId('paragraph-17')
    await targetParagraph.scrollIntoViewIfNeeded()
    await expect(targetParagraph).toBeVisible()
    await pageA.getByTestId('reading-progress-flush').click()

    await pageB.goto('/reading/1')
    await expect(pageB.getByTestId('paragraph-17')).toBeInViewport({ ratio: 0.5 })

    await clientA.close()
    await clientB.close()
  })
})
