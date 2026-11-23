// Voie p3c-port : resynchronise la copie isolée %TEMP%/qr-app-copie (npm ci réel, zxing-wasm et pdf.js installés), puis y lance une
// commande. Les tests, tsc, le build et Chrome se jouent là, jamais via la jonction node_modules du dépôt.
// Usage, depuis la racine du worktree : node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs <commande…>
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const racine = process.cwd();
const copie = path.join(process.env.TEMP, 'qr-app-copie');
const synchro = spawnSync('bash', [path.join(racine, 'work/missions/2026-11-01-bascule-lecture/voies/qr-app/outils/synchro.sh')], { stdio: 'inherit', cwd: racine });
if (synchro.status !== 0) process.exit(synchro.status ?? 1);
const commande = spawnSync(process.argv.slice(2).join(' '), { stdio: 'inherit', cwd: copie, shell: true });
process.exit(commande.status ?? 1);
