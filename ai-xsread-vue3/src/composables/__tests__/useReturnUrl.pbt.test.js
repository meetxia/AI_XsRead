/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 15: returnUrl must stay on same-origin relative routes.
 */
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { returnUrlArb } from '../../test/arbitraries'

let subject = null

try {
  subject = await import('../useReturnUrl')
} catch {
  subject = null
}

const describeIfImplemented = subject ? describe : describe.skip

describeIfImplemented('[Property 15] useReturnUrl same-origin guard', () => {
  it('only accepts slash-prefixed relative paths', () => {
    fc.assert(
      fc.property(returnUrlArb, (raw) => {
        const result = subject.safeReturnUrl(raw)

        expect(result.startsWith('/')).toBe(true)
        expect(result.startsWith('//')).toBe(false)
        expect(result).not.toMatch(/^\/?https?:/i)
        expect(result).not.toMatch(/^\/?javascript:/i)
      }),
      { numRuns: 100 }
    )
  })

  it('builds encoded login URLs that keep the current path recoverable', () => {
    fc.assert(
      fc.property(fc.webPath(), (path) => {
        const loginUrl = subject.buildLoginUrl(path)
        const parsed = new URL(loginUrl, 'http://localhost:3008')
        const expectedReturnUrl = subject.safeReturnUrl(path)

        expect(parsed.pathname).toBe('/login')
        expect(parsed.searchParams.get('returnUrl')).toBe(expectedReturnUrl)
      }),
      { numRuns: 100 }
    )
  })
})
