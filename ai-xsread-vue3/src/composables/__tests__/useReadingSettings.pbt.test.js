/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 9: useReadingSettings preference round-trip.
 */
import fc from 'fast-check'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import { currentReadingSettingsArb } from '../../test/arbitraries'
import { defaultReadingSettings, useReadingSettings } from '../useReadingSettings'

describe('[Property 9] useReadingSettings current contract', () => {
  it('persists supported reading settings to localStorage', async () => {
    await fc.assert(
      fc.asyncProperty(currentReadingSettingsArb, async (input) => {
        const { settings, save } = useReadingSettings()

        save(input)
        await nextTick()

        const saved = JSON.parse(localStorage.getItem('reading-settings'))
        expect(saved).toMatchObject(input)
        expect({ ...settings }).toMatchObject(saved)
      }),
      { numRuns: 50 }
    )
  })

  it('clamps out-of-range font size and brightness values', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer({ max: 11 }), fc.integer({ min: 29, max: 200 })),
        fc.oneof(fc.integer({ max: 49 }), fc.integer({ min: 101, max: 200 })),
        (fontSize, brightness) => {
          const { settings, setFontSize, setBrightness } = useReadingSettings()

          setFontSize(fontSize)
          setBrightness(brightness)

          expect(settings.fontSize).toBeGreaterThanOrEqual(12)
          expect(settings.fontSize).toBeLessThanOrEqual(28)
          expect(settings.brightness).toBeGreaterThanOrEqual(50)
          expect(settings.brightness).toBeLessThanOrEqual(100)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('resets to spec defaults', () => {
    const { settings, save, reset } = useReadingSettings()
    save({
      fontSize: 28,
      lineHeight: 2.2,
      paragraphSpacing: 'relaxed',
      pageMargin: 'wide',
      pageFlipMode: 'tap',
      brightness: 50
    })

    reset()

    expect({ ...settings }).toMatchObject(defaultReadingSettings)
    expect(JSON.parse(localStorage.getItem('reading-settings'))).toMatchObject(defaultReadingSettings)
  })
})
