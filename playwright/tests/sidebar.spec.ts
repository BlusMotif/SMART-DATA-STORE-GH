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

test('API & Integrations is visible on user dashboard', async ({ page }) => {
  await page.goto('/user/dashboard');
  
  // Check if API & Integrations button is visible
  const apiButton = page.getByText('API & Integrations');
  await expect(apiButton).toBeVisible();
  
  // Click it and check navigation
  await apiButton.click();
  await expect(page).toHaveURL('/dashboard/api-integrations');
});

test('API & Integrations page loads for authenticated user', async ({ page }) => {
  await page.goto('/dashboard/api-integrations');
  
  // Should be redirected to login if not authenticated
  // But since we're testing authenticated, assume login happened
  // In real test, we'd need to login first
  await expect(page.getByText('API & Integrations')).toBeVisible();
});
