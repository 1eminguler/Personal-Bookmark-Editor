import { chromium, expect, test } from '@playwright/test';
import path from 'path';

test.describe('Bookmark & Folder Management (File-Explorer Style)', () => {
  test('Should create folder, add bookmark, inspect properties, and safely delete', async () => {
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

    // Open sidebar via Alt+B
    await page.keyboard.press('Alt+b');
    await expect(sidebar).toHaveClass(/open/);

    // 1. Click "+ Folder" button
    const newFolderBtn = host.locator('.soft-pill-action:has-text("Folder")');
    await newFolderBtn.click();

    const addModal = host.locator('.soft-modal-card');
    await expect(addModal).toBeVisible();

    // Type folder name
    const folderInput = host.locator('.soft-text-input');
    await folderInput.fill('Test Folder');

    // Submit form
    await host.locator('.soft-btn-submit').click();
    await expect(addModal).not.toBeVisible();

    // Verify folder is visible in tree
    const createdFolder = host.locator('.soft-folder-title:has-text("Test Folder")');
    await expect(createdFolder).toBeVisible({ timeout: 5000 });

    // 2. Right-click on created folder -> Context Menu
    await createdFolder.click({ button: 'right' });
    const contextMenu = host.locator('.soft-context-menu');
    await expect(contextMenu).toBeVisible();

    // Verify folder menu options
    await expect(contextMenu.locator('text=New Subfolder Here')).toBeVisible();
    await expect(contextMenu.locator('text=New Bookmark Here')).toBeVisible();
    await expect(contextMenu.locator('text=Rename')).toBeVisible();
    await expect(contextMenu.locator('text=Delete Folder')).toBeVisible();
    await expect(contextMenu.locator('text=Properties')).toBeVisible();

    // Click "Properties"
    await contextMenu.locator('text=Properties').click();
    const propsModal = host.locator('.soft-modal-card');
    await expect(propsModal).toBeVisible();
    await expect(propsModal.locator('.soft-prop-value:has-text("Test Folder")')).toBeVisible();

    // Close properties modal
    await propsModal.locator('.soft-btn-submit').click();
    await expect(propsModal).not.toBeVisible();

    // 3. Delete the created test folder
    await createdFolder.click({ button: 'right' });
    await contextMenu.locator('text=Delete Folder').click();

    // Verify deleted
    await expect(createdFolder).not.toBeVisible();

    await context.close();
  });
});
