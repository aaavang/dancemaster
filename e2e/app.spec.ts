import { test, expect } from '@playwright/test'

test.describe('DanceMaster', () => {
  test('app loads with dancers in EIGHT_HAND_SQUARE formation', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#dance-floor')).toBeAttached()
    await expect(page.locator('.dancer')).toHaveCount(8)
    await expect(page.locator('#header')).toBeAttached()
    await expect(page.locator('#formations button')).toHaveCount(3)
    await expect(page.locator('#dances button')).toHaveCount(2)
    expect(await page.locator('#moves button').count()).toBeGreaterThan(0)
  })

  test('switching to TWO_FACING_TWO formation shows 4 dancers', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.dancer')).toHaveCount(8)

    await page.locator('#formations button', { hasText: 'TWO_FACING_TWO' }).click()
    await expect(page.locator('.dancer')).toHaveCount(4)
    await expect(page.locator('#first-top-lead')).toBeAttached()
    await expect(page.locator('#first-top-follow')).toBeAttached()
    await expect(page.locator('#second-top-lead')).toBeAttached()
    await expect(page.locator('#second-top-follow')).toBeAttached()
  })

  test('switchWithPartner moves dancers to new positions', async ({ page }) => {
    await page.goto('/')

    // Switch to a smaller formation for simpler testing
    await page.locator('#formations button', { hasText: 'TWO_FACING_TWO' }).click()
    await expect(page.locator('.dancer')).toHaveCount(4)

    // Send dancers home to deterministic positions
    await page.locator('#moves button', { hasText: /^goHome$/ }).click()
    await page.waitForTimeout(3000)

    // Record initial positions using getBoundingClientRect for accurate values
    const initialPositions = await page.locator('.dancer').evaluateAll((els) =>
      els.map((el) => {
        const rect = el.getBoundingClientRect()
        return { x: rect.x, y: rect.y }
      }),
    )

    // Click switchWithPartner
    await page.locator('#moves button', { hasText: /^switchWithPartner$/ }).click()
    await page.waitForTimeout(3000)

    // Check that at least some dancers have moved
    const finalPositions = await page.locator('.dancer').evaluateAll((els) =>
      els.map((el) => {
        const rect = el.getBoundingClientRect()
        return { x: rect.x, y: rect.y }
      }),
    )

    const somePositionChanged = initialPositions.some(
      (pos, i) => Math.abs(pos.x - finalPositions[i].x) > 1 || Math.abs(pos.y - finalPositions[i].y) > 1,
    )
    expect(somePositionChanged).toBe(true)
  })

  test('The Three Tunes dance runs to completion', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/')
    await expect(page.locator('.dancer')).toHaveCount(8)

    // Click The Three Tunes dance button
    await page.locator('#dances button', { hasText: 'The Three Tunes' }).click()

    // Wait for the dance to complete by watching the header stop updating
    await page.waitForFunction(
      () => {
        const header = document.getElementById('header')
        if (!header) return false
        const text = header.innerHTML
        return new Promise<boolean>((resolve) => {
          setTimeout(() => {
            resolve(header.innerHTML === text || header.innerHTML === '')
          }, 3000)
        })
      },
      { timeout: 120000 },
    )

    // All dancers should still be present
    await expect(page.locator('.dancer')).toHaveCount(8)

    // No console errors during the dance
    expect(consoleErrors).toEqual([])
  })
})
