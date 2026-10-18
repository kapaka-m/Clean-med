import { chromium, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setTimeout } from 'node:timers/promises';

const root = fileURLToPath(new URL('..', import.meta.url));
const output = fileURLToPath(new URL('../docs/images/', import.meta.url));
const server = spawn(process.execPath, ['scripts/serve.mjs'], {
  cwd: root,
  stdio: 'pipe',
  windowsHide: true,
});
const base = 'http://127.0.0.1:4173';
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const response = await fetch(base);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* Wait for startup. */
    }
    await setTimeout(100);
  }
  if (!ready) throw new Error('Preview server did not become ready.');
  await mkdir(output, { recursive: true });
  browser = await chromium.launch({ channel: 'chromium' });
  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 1120 },
    deviceScaleFactor: 1,
  });
  await desktop.goto(base);
  await desktop.screenshot({ path: `${output}/clean-med-overview.png`, fullPage: true });
  await desktop.getByRole('button', { name: 'Try a sample' }).click();
  await desktop.getByRole('button', { name: 'Respiratory symptoms', exact: false }).click();
  await desktop.waitForSelector('#resultsContent:not([hidden])');
  await desktop.locator('#toast').evaluate((element) => {
    element.hidden = true;
  });
  await desktop.screenshot({ path: `${output}/clean-med-workspace.png`, fullPage: true });
  await desktop.getByRole('button', { name: 'Switch to dark theme' }).click();
  await desktop.screenshot({ path: `${output}/clean-med-dark.png`, fullPage: true });
  const mobile = await browser.newPage({ ...devices['Pixel 7'] });
  await mobile.goto(base);
  await mobile.screenshot({ path: `${output}/clean-med-mobile.png`, fullPage: true });
  console.log('Captured desktop, results, dark, and mobile views in docs/images/.');
} finally {
  await browser?.close();
  server.kill();
}
