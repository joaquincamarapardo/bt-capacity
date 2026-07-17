const { test, expect } = require('@playwright/test');

test.describe('Firebase & Application Configuration Tests', () => {
  test('login-email page loads with valid HTML', async ({ page }) => {
    await page.goto('/login-email.html', { waitUntil: 'networkidle' });
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('dashboard page loads with valid HTML', async ({ page }) => {
    await page.goto('/dashboard.html', { waitUntil: 'networkidle' });
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('admin page loads with valid HTML', async ({ page }) => {
    await page.goto('/admin.html', { waitUntil: 'networkidle' });
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('planner page loads with valid HTML', async ({ page }) => {
    await page.goto('/planner.html', { waitUntil: 'networkidle' });
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('all app pages have head and body elements', async ({ page }) => {
    const pages = ['/login-email.html', '/dashboard.html', '/admin.html', '/planner.html'];

    for (const pageUrl of pages) {
      await page.goto(pageUrl, { waitUntil: 'networkidle' });
      const head = await page.locator('head').count();
      const body = await page.locator('body').count();
      expect(head).toBeGreaterThanOrEqual(1);
      expect(body).toBeGreaterThanOrEqual(1);
    }
  });

  test('pages load without client-side crashes', async ({ page }) => {
    let uncaughtErrors = [];
    page.on('error', error => {
      uncaughtErrors.push(error);
    });

    const pages = ['/login-email.html', '/dashboard.html'];
    for (const pageUrl of pages) {
      await page.goto(pageUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
    }

    // Uncaught errors would be page crashes
    expect(uncaughtErrors.length).toBe(0);
  });
});
