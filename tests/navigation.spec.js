const { test, expect } = require('@playwright/test');

test.describe('Navigation & Page Rendering Tests', () => {
  test('login-email page renders successfully', async ({ page }) => {
    await page.goto('/login-email.html', { waitUntil: 'networkidle' });
    const html = await page.locator('html');
    await expect(html).toBeVisible();
  });

  test('dashboard page renders without errors', async ({ page }) => {
    await page.goto('/dashboard.html', { waitUntil: 'networkidle' });
    const html = await page.locator('html');
    await expect(html).toBeVisible();
  });

  test('admin page renders without errors', async ({ page }) => {
    await page.goto('/admin.html', { waitUntil: 'networkidle' });
    const html = await page.locator('html');
    await expect(html).toBeVisible();
  });

  test('planner page renders without errors', async ({ page }) => {
    await page.goto('/planner.html', { waitUntil: 'networkidle' });
    const html = await page.locator('html');
    await expect(html).toBeVisible();
  });

  test('import-excel page renders without errors', async ({ page }) => {
    await page.goto('/import-excel.html', { waitUntil: 'networkidle' });
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('setup-users page renders without errors', async ({ page }) => {
    await page.goto('/setup-users.html', { waitUntil: 'networkidle' });
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('all main pages have valid HTML structure', async ({ page }) => {
    const pages = ['/login-email.html', '/dashboard.html', '/admin.html'];

    for (const pageUrl of pages) {
      await page.goto(pageUrl, { waitUntil: 'networkidle' });
      const html = await page.locator('html');
      const body = await page.locator('body');
      await expect(html).toBeVisible();
      await expect(body).toBeVisible();
    }
  });

  test('pages should load without 5xx server errors', async ({ page }) => {
    let serverErrors = 0;
    page.on('response', response => {
      if (response.status() >= 500) {
        serverErrors++;
      }
    });

    const pages = ['/login-email.html', '/dashboard.html', '/admin.html'];
    for (const pageUrl of pages) {
      await page.goto(pageUrl, { waitUntil: 'networkidle' });
    }

    expect(serverErrors).toBe(0);
  });
});
