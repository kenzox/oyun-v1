import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

let count = 0;
for (const directory of ['server', 'public', 'test', 'scripts']) {
  for (const name of readdirSync(directory, { recursive: true })) {
    if (!/\.(m?js)$/.test(name)) continue;
    const result = spawnSync(process.execPath, ['--check', `${directory}/${name}`], { stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status || 1);
    count++;
  }
}
console.log(`${count} JavaScript dosyasının sözdizimi kontrol edildi.`);
