/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Properties 1-2 frontend paragraph anchor skeleton.
 */
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { paragraphTextArb } from '../../test/arbitraries'

let subject = null

try {
  subject = await import('../useParagraphAnchor')
} catch {
  subject = null
}

const describeIfImplemented = subject ? describe : describe.skip

describeIfImplemented('[Property 1] frontend paragraph hash contract', () => {
  it('computes deterministic 16-char lowercase hex hashes', async () => {
    await fc.assert(
      fc.asyncProperty(paragraphTextArb, async (text) => {
        const first = await subject.computeParagraphHash(text)
        const second = await subject.computeParagraphHash(text)

        expect(first).toBe(second)
        expect(first).toMatch(/^[0-9a-f]{16}$/)
      }),
      { numRuns: 100 }
    )
  })

  it('only depends on the first 50 characters of a paragraph', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 50, maxLength: 80 }),
        fc.string({ minLength: 1, maxLength: 40 }),
        fc.string({ minLength: 1, maxLength: 40 }),
        async (prefix, suffixA, suffixB) => {
          const first = await subject.computeParagraphHash(prefix + suffixA)
          const second = await subject.computeParagraphHash(prefix + suffixB)
          expect(first).toBe(second)
        }
      ),
      { numRuns: 50 }
    )
  })
})
