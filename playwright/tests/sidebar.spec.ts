import { test, expect } from '@playwright/test';

test('mobile sidebar opens, closes, and nav closes sidebar', async ({ page }) => {
  // Navigate to dashboard (will use baseURL from config)
  await page.goto('/user/dashboard');

  // Open mobile menu (header menu button is hidden on md and visible on mobile)
  const menuButton = page.locator('header button.md\\:hidden');
  await expect(menuButton).toBeVisible();
  await menuButton.click();

  // Close button should be visible inside the sheet
  const closeButton = page.getByRole('button', { name: 'Close' });
  await expect(closeButton).toBeVisible();

  // Click close and assert it's hidden
  await closeButton.click();
  await expect(closeButton).toBeHidden();

  // Reopen, click a nav link and ensure navigation occurs and sidebar closed
  await menuButton.click();
  const mtnLink = page.locator('nav').getByText('MTN Bundles').first();
  await expect(mtnLink).toBeVisible();
  await mtnLink.click();

  // Should navigate to MTN bundles and sidebar should be closed
  await expect(page).toHaveURL('/user/bundles/mtn');
  await expect(closeButton).toBeHidden();
});
