const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function navigate(page, label) {
  if (await page.getByRole('button', { name: 'Open navigation' }).isVisible())
    await page.getByRole('button', { name: 'Open navigation' }).click();
  await page
    .getByRole('navigation', { name: 'Workspace' })
    .getByRole('button', { name: label })
    .click();
}
async function loadSample(page) {
  await page.getByRole('button', { name: 'Try a sample' }).click();
  await page.getByRole('button', { name: 'Headache & sensitivity' }).click();
}
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('initial workspace is complete and has no overflow or external requests', async ({ page }) => {
  const errors = [];
  const external = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173/')) external.push(request.url());
  });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'A clearer view. A smarter starting point.' }),
  ).toBeVisible();
  await expect(page.locator('#symptomGrid input')).toHaveCount(30);
  await expect(page.getByRole('button', { name: 'Explore matches' })).toBeDisabled();
  await expect(page.locator('#sampleToggle [data-icon="flask"] svg')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
test('search and category filters keep selections intact', async ({ page }) => {
  await page.getByRole('checkbox', { name: 'Fever', exact: true }).check();
  await page.getByRole('button', { name: 'Digestive', exact: true }).click();
  await expect(page.locator('#symptomGrid input')).toHaveCount(6);
  await expect(page.locator('#selectionCount')).toHaveText('1 selected');
  await page.getByRole('searchbox', { name: 'Search symptoms' }).fill('not-a-symptom');
  await expect(page.getByRole('heading', { name: 'No symptoms found' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByRole('checkbox', { name: 'Fever', exact: true })).toBeChecked();
});
test('sample produces explainable results and selection changes invalidate them', async ({
  page,
}) => {
  await loadSample(page);
  await expect(page.locator('#topResult h3')).toHaveText('Migraine');
  await expect(page.locator('.score-ring strong')).toHaveText('60%');
  await expect(page.locator('#topResult')).toContainText('3 ÷ 5 × 100 = 60%');
  await expect(page.locator('#topResult')).toContainText('Dizziness');
  await page.getByRole('checkbox', { name: 'Fever', exact: true }).check();
  await expect(page.locator('#resultsContent')).toBeHidden();
  await page.getByRole('button', { name: 'Explore matches' }).click();
  await expect(page.locator('#resultsContent')).toBeVisible();
  await page.getByRole('button', { name: 'Clear all', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Explore matches' })).toBeDisabled();
  await expect(page.locator('#selectedChips')).toContainText(
    'Your selected symptoms will appear here.',
  );
});
test('backward verification supports zero matches and refreshes on target change', async ({
  page,
}) => {
  await page.getByRole('checkbox', { name: 'Cough', exact: true }).check();
  await page.getByLabel('Condition to verify').selectOption('migraine');
  await page.getByRole('button', { name: 'Verify rule' }).click();
  await expect(page.locator('#verificationResult')).toContainText('0% coverage');
  await expect(page.locator('#verificationResult')).toContainText('Not selected · 5');
  await page.getByLabel('Condition to verify').selectOption('influenza');
  await expect(page.locator('#verificationResult')).toBeHidden();
});
test('library search and complete rule exploration work', async ({ page }) => {
  await navigate(page, 'Knowledge library');
  await expect(page.locator('.library-card')).toHaveCount(12);
  await page.getByRole('searchbox', { name: 'Search knowledge library' }).fill('migraine');
  await expect(page.locator('.library-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Explore this rule' }).click();
  await expect(page.locator('#topResult h3')).toHaveText('Migraine');
  await expect(page.locator('.score-ring strong')).toHaveText('100%');
  await expect(page.locator('#ruleSummary')).toContainText('complete rule match');
});
test('export contains evidence and no fabricated probability', async ({ page }) => {
  await loadSample(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export assessment' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const report = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(report.application).toBe('Clean Med');
  expect(report.selectedSymptoms).toHaveLength(3);
  expect(report.results[0].name).toBe('Migraine');
  expect(report.results[0].coveragePercent).toBe(60);
  expect(report.results[0].unselectedSymptoms).toHaveLength(2);
  expect(report.purpose).toContain('Not a medical diagnosis');
  expect(download.suggestedFilename()).toMatch(/^clean-med-assessment-.*\.json$/);
});
test('only theme persists; health selections do not', async ({ page }) => {
  await page.getByRole('checkbox', { name: 'Fever', exact: true }).check();
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('checkbox', { name: 'Fever', exact: true })).not.toBeChecked();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['clean-med-theme']);
});
test('navigation, hash links and method explanation work', async ({ page }) => {
  await navigate(page, 'How it works');
  await expect(page.getByRole('heading', { name: 'Understand every connection.' })).toBeVisible();
  await expect(page.locator('.formula-example')).toContainText('3 of 5 symptoms = 60% match');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Understand every connection.' })).toBeVisible();
  await page.getByRole('button', { name: 'Try the workspace' }).click();
  await expect(page.locator('#assessmentView')).toBeVisible();
});
test('legacy entry point opens the new workspace', async ({ page }) => {
  await page.goto('/expert_system.html');
  await expect(
    page.getByRole('heading', { name: 'A clearer view. A smarter starting point.' }),
  ).toBeVisible();
});
test('direct file opening works without a server', async ({ page }) => {
  const { pathToFileURL } = require('node:url');
  const path = require('node:path');
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve(__dirname, '../../index.html')).href);
  await loadSample(page);
  await expect(page.locator('#topResult h3')).toHaveText('Migraine');
  await expect(page.locator('.score-ring strong')).toHaveText('60%');
  expect(errors).toEqual([]);
});

test('keyboard shortcuts and sample dismissal preserve focus', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop keyboard behavior.');
  await page.keyboard.press('/');
  await expect(page.getByRole('searchbox', { name: 'Search symptoms' })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.getByRole('button', { name: 'Try a sample' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#sampleMenu')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Try a sample' })).toBeFocused();
});
test('WCAG AA checks pass across primary views, results and dark theme', async ({ page }) => {
  async function audit() {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
  }
  await audit();
  await loadSample(page);
  await audit();
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await audit();
  await navigate(page, 'Knowledge library');
  await audit();
  await navigate(page, 'How it works');
  await audit();
});
