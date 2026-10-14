import { chromium, expect, test } from '@playwright/test';
import path from 'path';

test.describe('Chrome Extension End-to-End Tests', () => {
  test('Should load extension in Chromium, inject Shadow DOM on web page, and respond to hover & shortcut', async () => {
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

    // Navigate to a valid test page
    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');

    // Wait for content script to inject host element
    const host = page.locator('#sahsi-bookmark-root');
    await expect(host).toBeAttached({ timeout: 10000 });

    // Verify shadow root and inner sidebar components exist
    const triggerStrip = host.locator('.edge-trigger-strip');
    await expect(triggerStrip).toBeAttached();

    const sidebar = host.locator('.soft-sidebar');
    await expect(sidebar).toBeAttached();

    // Verify initial closed state
    await expect(sidebar).toHaveClass(/closed/);

    // Verify floating edge trigger tab exists when closed
    const triggerTab = host.locator('.soft-edge-trigger-tab');
    await expect(triggerTab).toBeVisible();

    // Clicking trigger tab opens sidebar
    await triggerTab.click();
    await expect(sidebar).toHaveClass(/open/);

    // Toggle close via Alt+B
    await page.keyboard.press('Alt+b');
    await expect(sidebar).toHaveClass(/closed/);

    // Test Alt+B shortcut to open panel again
    await page.keyboard.press('Alt+b');
    await expect(sidebar).toHaveClass(/open/);

    // Verify title inside Shadow DOM
    const title = host.locator('.soft-app-label');
    await expect(title).toHaveText('Bookmarks');

    // Test "+ Folder" button opens add modal in folder mode
    const newFolderBtn = host.locator('.soft-pill-action:has-text("Folder")');
    await expect(newFolderBtn).toBeVisible();
    await newFolderBtn.click();

    const folderModal = host.locator('.soft-modal-card');
    await expect(folderModal).toBeVisible();
    await expect(host.locator('.soft-modal-title:has-text("Create New Folder")')).toBeVisible();

    // Close modal
    await host.locator('.soft-close-btn').click();
    await expect(folderModal).not.toBeVisible();

    // Open settings modal from sidebar header
    const settingsBtn = host.locator('.soft-icon-btn[title*="Settings"]');
    await settingsBtn.click();

    // Verify Settings modal is visible
    const settingsModal = host.locator('.soft-modal-card');
    await expect(settingsModal).toBeVisible();

    // Verify soft theme pills are visible
    const themePill = host.locator('.soft-theme-pill:has-text("Dark")');
    await expect(themePill).toBeVisible();
    await themePill.click();

    // Close settings modal
    await host.locator('.soft-close-btn').click();
    await expect(settingsModal).not.toBeVisible();

    // Press Alt+B again to toggle close
    await page.keyboard.press('Alt+b');
    await expect(sidebar).toHaveClass(/closed/);

    await context.close();
  });

  test('Should load Side Panel page with full bookmark sidebar', async () => {
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
    await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
    await page.waitForLoadState('domcontentloaded');

    // Verify sidebar is rendered
    await expect(page.locator('.soft-sidebar')).toBeVisible();
    await expect(page.locator('.soft-app-label')).toHaveText('Bookmarks');

    await context.close();
  });
});
