import { chromium, expect, test } from '@playwright/test';
import path from 'path';

test.describe('Left Edge Trigger & 50-Cycle Open/Close Stress Test', () => {
  test('50 consecutive open/close cycles and multi-height edge trigger verification', async () => {
    test.setTimeout(90000); // Allow sufficient time for 50 cycles

    const pathToExtension = path.resolve('dist');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
      ],
    });

    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });

    // Navigate to a long test page with scrolling
    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');

    // Create a tall dummy element to allow scrolling
    await page.evaluate(() => {
      const tall = document.createElement('div');
      tall.style.height = '3000px';
      tall.textContent = 'Tall scrollable content';
      document.body.appendChild(tall);
    });

    const host = page.locator('#sahsi-bookmark-root');
    await expect(host).toBeAttached({ timeout: 10000 });

    const sidebar = host.locator('.soft-sidebar');
    await expect(sidebar).toBeAttached();

    // Verify initial closed state
    await expect(sidebar).toHaveClass(/closed/);

    // ================= Part 1: Multi-height Edge Triggering (Top, Middle, Bottom) =================
    // 1. Top region (x=2, y=60)
    await page.mouse.move(2, 60);
    await page.waitForTimeout(160);
    await expect(sidebar).toHaveClass(/open/);

    // Move mouse away to close
    await page.mouse.move(500, 60);
    await page.waitForTimeout(400);
    await expect(sidebar).toHaveClass(/closed/);

    // 2. Middle region (x=2, y=400)
    await page.mouse.move(2, 400);
    await page.waitForTimeout(160);
    await expect(sidebar).toHaveClass(/open/);

    await page.mouse.move(500, 400);
    await page.waitForTimeout(400);
    await expect(sidebar).toHaveClass(/closed/);

    // 3. Bottom region (x=2, y=750)
    await page.mouse.move(2, 750);
    await page.waitForTimeout(160);
    await expect(sidebar).toHaveClass(/open/);

    await page.mouse.move(500, 750);
    await page.waitForTimeout(400);
    await expect(sidebar).toHaveClass(/closed/);

    // 4. After page scroll
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(100);

    await page.mouse.move(2, 300);
    await page.waitForTimeout(160);
    await expect(sidebar).toHaveClass(/open/);

    await page.mouse.move(500, 300);
    await page.waitForTimeout(400);
    await expect(sidebar).toHaveClass(/closed/);

    // Reset scroll
    await page.evaluate(() => window.scrollTo(0, 0));

    // ================= Part 2: 50 Consecutive Open/Close Stress Cycles =================
    console.log('Starting 50 consecutive open/close stress cycles...');
    for (let cycle = 1; cycle <= 50; cycle++) {
      // Alternate between hover trigger and keyboard shortcut Alt+b
      if (cycle % 2 === 1) {
        // Trigger via edge hover at variable Y height
        const targetY = 100 + (cycle * 13) % 600;
        await page.mouse.move(2, targetY);
        await page.waitForTimeout(120);
        await expect(sidebar).toHaveClass(/open/);

        // Move outside panel
        await page.mouse.move(450, targetY);
        await page.waitForTimeout(380);
        await expect(sidebar).toHaveClass(/closed/);
      } else {
        // Trigger via Alt+B keyboard shortcut
        await page.keyboard.press('Alt+b');
        await expect(sidebar).toHaveClass(/open/);

        await page.keyboard.press('Alt+b');
        await expect(sidebar).toHaveClass(/closed/);
      }
    }
    console.log('Completed 50 consecutive open/close stress cycles with 100% success!');

    await context.close();
  });
});
