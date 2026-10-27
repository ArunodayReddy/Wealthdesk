/**
 * wealthdesk.spec.ts — the critical-path e2e spec.
 *
 * WHAT IT COVERS: (1) login → dashboard shows net worth (the auth guard,
 * lazy routing, and store-driven dashboard, end to end); (2) the planner
 * flow — fill the reactive form, submit, see a server-computed projection.
 *
 * PREREQUISITES: the API must be running on :3333 before this spec runs
 * (the dev server proxies /api to it — see apps/web/proxy.conf.json).
 * The web server itself is started by the webServer block in
 * playwright.config.mts. Run: `npx nx run api:build` then
 * `node dist/api/main.js` in one terminal, then `npx nx e2e web-e2e
 * --project=chromium` in another. CI does the same (see
 * .github/workflows/ci.yml).
 */
import { test, expect, type Page } from '@playwright/test';

async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('demo@wealthdesk.local');
  await page.locator('input[type="password"]').fill('demo-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test('login → dashboard shows net worth', async ({ page }) => {
  await login(page);
  await expect(
    page.getByRole('heading', { name: 'Portfolio dashboard' }),
  ).toBeVisible();
  // Net worth stat card renders once the API answers.
  await expect(page.getByText('Net worth')).toBeVisible();
  await expect(page.locator('main')).toContainText('$');
});

test('planner flow projects a balance', async ({ page }) => {
  await login(page);
  await page.goto('/planning');
  await expect(
    page.getByRole('heading', { name: 'Retirement planner' }),
  ).toBeVisible();

  await page.getByLabel('Current balance ($)').fill('50000');
  await page.getByLabel('Annual salary ($)').fill('120000');
  await page.getByLabel('Your contribution (% of salary)').fill('12');
  await page.getByLabel('Employer match rate (% of your contribution)').fill('50');
  await page.getByLabel('Employer match cap (% of salary)').fill('3');
  await page.getByLabel('Assumed annual return (%)').fill('7');
  await page.getByLabel('Years to project').fill('20');
  await page.getByRole('button', { name: 'Project' }).click();

  // Server-computed result: final balance + one row per projected year.
  await expect(page.getByText('Projected balance:')).toBeVisible();
  const rows = page.locator('table.years tbody tr');
  await expect(rows).toHaveCount(20);
});
