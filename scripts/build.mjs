import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = path.join(root, 'dist');
await mkdir(dist, { recursive: true });
for (const name of ['index.html', 'expert_system.html', 'css', 'js', 'assets']) {
  await cp(path.join(root, name), path.join(dist, name), { recursive: true });
}
await cp(path.join(root, '.nojekyll'), path.join(dist, '.nojekyll'));
console.log('Static site built in dist/. No bundler or runtime dependencies required.');
