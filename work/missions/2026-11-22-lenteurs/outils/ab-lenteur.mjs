// A/B alterné du contrôle CAL-LENT : tour7 (avant les corrections) et tour9 (en ligne), N tours, ordre inversé un tour sur deux.
// Usage : node ab-lenteur.mjs [n=5]
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const B = 'C:/Users/mrspa/AppData/Local/Temp/lenteurs-22-11-b';
const n = Number(process.argv[2] ?? 5);
const charge = () => spawnSync('powershell', ['-NoProfile', '-Command', '(Get-CimInstance Win32_Processor).LoadPercentage'], { encoding: 'utf8' }).stdout.trim();
for (let i = 1; i <= n; i++) {
  const ordre = i % 2 ? ['tour7', 'tour9'] : ['tour9', 'tour7'];
  for (const v of ordre) {
    const out = path.join(B, 'out', `ab-${v}-${i}`);
    fs.mkdirSync(out, { recursive: true });
    const c = charge();
    const r = spawnSync('node', [path.join(B, 'tour9/scripts/parcours/lenteur.mjs'), out, '--build', path.join(B, `build-${v}`), '--sans-trace'], { encoding: 'utf8', maxBuffer: 1 << 26 });
    fs.writeFileSync(path.join(out, 'sortie.txt'), r.stdout + r.stderr);
    console.log(`tour ${i} ${v} charge ${c} % code ${r.status}`);
  }
}
