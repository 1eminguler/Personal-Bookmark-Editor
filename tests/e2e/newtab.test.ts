import { chromium, expect, test } from '@playwright/test';
import path from 'path';

test.describe('New Tab Page & Start Screen Verification', () => {
  test('Should load modern New Tab start page and smoothly trigger sliding bookmark sidebar', async () => {
    const pathToExtension = path.resolve('dist');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
      ],
    });

    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }
    const extensionId = background.url().split('/')[2];

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/newtab.html`);
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify clock, search bar, shortcuts are visible on start page
    await expect(page.locator('.newtab-clock-display')).toBeVisible();
    await expect(page.locator('.newtab-search-input')).toBeVisible();
    await expect(page.locator('.newtab-shortcuts-grid')).toBeVisible();

    // 2. CRITICAL: Verify bookmark sidebar is NOT statically occupying 380px screen space
    const sidebar = page.locator('.soft-sidebar');
    await expect(sidebar).toBeAttached();
    await expect(sidebar).toHaveClass(/closed/);

    // 3. Hover left edge of new tab page -> opens bookmark sidebar
    await page.mouse.move(2, 350);
    await page.waitForTimeout(160);
    await expect(sidebar).toHaveClass(/open/);

    // 4. Move mouse away -> closes bookmark sidebar
    await page.mouse.move(450, 350);
    await page.waitForTimeout(400);
    await expect(sidebar).toHaveClass(/closed/);

    // 5. Test Alt+B shortcut on new tab
    await page.keyboard.press('Alt+b');
    await expect(sidebar).toHaveClass(/open/);
    await page.keyboard.press('Alt+b');
    await expect(sidebar).toHaveClass(/closed/);

    await context.close();
  });
});
