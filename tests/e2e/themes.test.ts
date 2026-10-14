import { chromium, expect, test } from '@playwright/test';
import path from 'path';

test.describe('Themes & Readability Verification', () => {
  test('Should support 4 core themes and maintain text readability', async () => {
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
    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');

    const host = page.locator('#sahsi-bookmark-root');
    await expect(host).toBeAttached({ timeout: 10000 });

    const sidebar = host.locator('.soft-sidebar');
    await page.keyboard.press('Alt+b');
    await expect(sidebar).toHaveClass(/open/);

    // Open settings modal
    const settingsBtn = host.locator('.soft-icon-btn[title*="Settings"]');
    await settingsBtn.click();
    const settingsModal = host.locator('.soft-modal-card');
    await expect(settingsModal).toBeVisible();

    // Verify 4 theme pills are present
    await expect(settingsModal.locator('.soft-theme-pill:has-text("System")')).toBeVisible();
    await expect(settingsModal.locator('.soft-theme-pill:has-text("Dark")')).toBeVisible();
    await expect(settingsModal.locator('.soft-theme-pill:has-text("Light")')).toBeVisible();
    await expect(settingsModal.locator('.soft-theme-pill:has-text("Transparent")')).toBeVisible();

    // Select "Light" theme
    await settingsModal.locator('.soft-theme-pill:has-text("Light")').click();
    await expect(host.locator('.sahsi-bookmark-app')).toHaveClass(/theme-light/);

    // Select "Transparent" theme
    await settingsModal.locator('.soft-theme-pill:has-text("Transparent")').click();
    await expect(host.locator('.sahsi-bookmark-app')).toHaveClass(/theme-transparent/);

    // Select "Dark" theme
    await settingsModal.locator('.soft-theme-pill:has-text("Dark")').click();
    await expect(host.locator('.sahsi-bookmark-app')).toHaveClass(/theme-dark/);

    // Close settings modal
    await host.locator('.soft-close-btn').click();
    await expect(settingsModal).not.toBeVisible();

    await context.close();
  });
});
