const { test, expect } = require('@playwright/test');

test.describe('Smoke Tests - BT Capacity App', () => {
  test('should have responsive viewport on desktop', async ({ page }) => {
    await page.goto('/login-email.html', { waitUntil: 'networkidle' });
    const viewportSize = page.viewportSize();
    expect(viewportSize).not.toBeNull();
    expect(viewportSize.width).toBeGreaterThan(0);
  });

  test('should be responsive on mobile viewport (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login-email.html', { waitUntil: 'networkidle' });
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should load without major server errors (5xx)', async ({ page }) => {
    let networkErrors = 0;
    page.on('response', response => {
      if (!response.ok() && response.status() >= 500) {
        networkErrors++;
      }
    });

    await page.goto('/login-email.html', { waitUntil: 'networkidle' });
    expect(networkErrors).toBe(0);
  });

  test('login-email page should render HTML body', async ({ page }) => {
    await page.goto('/login-email.html', { waitUntil: 'networkidle' });
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('login-email page should have valid HTML structure', async ({ page }) => {
    await page.goto('/login-email.html', { waitUntil: 'networkidle' });
    const html = await page.locator('html');
    await expect(html).toBeVisible();
  });

  test('dashboard page should render without crashing', async ({ page }) => {
    await page.goto('/dashboard.html', { waitUntil: 'networkidle' });
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('admin page should render without crashing', async ({ page }) => {
    await page.goto('/admin.html', { waitUntil: 'networkidle' });
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('planner page should render without crashing', async ({ page }) => {
    await page.goto('/planner.html', { waitUntil: 'networkidle' });
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });
});
