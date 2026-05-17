import { expect, test } from '@playwright/test'

test.describe('Requirement 37.2 / paragraph comment lifecycle', () => {
  test.skip(process.env.E2E_READY !== '1', 'Set E2E_READY=1 after paragraph comment APIs and UI hooks are available.')

  test('comment bubble increments, displays the new comment, then decrements after soft delete', async ({ browser }) => {
    const context = await browser.newContext({ storageState: process.env.E2E_USER_STATE })
    const page = await context.newPage()

    await page.goto('/reading/1?chapter=5')
    const bubble = page.getByTestId('paragraph-comment-bubble-17')
    const before = Number(await bubble.getAttribute('data-count'))

    await bubble.click()
    await page.getByTestId('paragraph-comment-input').fill('这段转折很抓人')
    await page.getByTestId('paragraph-comment-submit').click()

    await expect(page.getByText('这段转折很抓人')).toBeVisible()
    await expect(bubble).toHaveAttribute('data-count', String(before + 1))

    await page.getByTestId('paragraph-comment-delete').click()
    await page.getByRole('button', { name: '确认删除' }).click()
    await expect(bubble).toHaveAttribute('data-count', String(before))

    await context.close()
  })
})
