// Prépare une copie de travail (worktree) prête à tester, en une commande (D439, 23.11).
// Usage : node scripts/agents/copie-travail.mjs <nom> [base=origin/main]
//   → C:/Users/mrspa/.codex/worktrees/openai-clean-start/<nom>, branche claude/<nom>,
//     node_modules (racine et functions) en jonction vers port-carnet, .env copié depuis Brasserie,
//     seedData.ts pris du gabarit versionné (jamais les vraies données), port et dossier de build e2e à part.
// Affiche les variables à exporter (E2E_PORT, E2E_BUILD). Ne lit jamais functions/.env ni .secret.local.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [nom, base = 'origin/main'] = process.argv.slice(2);
if (!nom || !/^[a-z0-9-]+$/.test(nom)) { console.error('usage : copie-travail.mjs <nom-en-minuscules> [base]'); process.exit(2); }
const RACINE_WT = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start';
const PILOTE = `${RACINE_WT}/Brasserie`;
const MODULES = `${RACINE_WT}/port-carnet`;
const wt = `${RACINE_WT}/${nom}`;
const git = (...a) => execFileSync('git', ['-C', PILOTE, ...a], { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();

if (fs.existsSync(wt)) { console.error(`existe déjà : ${wt}`); process.exit(1); }
git('fetch', '-q', 'origin');
git('worktree', 'add', wt, '-b', `claude/${nom}`, base);

const jonction = (lien, cible) => {
  if (!fs.existsSync(cible) || fs.existsSync(lien)) return false;
  fs.symlinkSync(cible, lien, 'junction');
  return true;
};
const nm = jonction(`${wt}/node_modules`, `${MODULES}/node_modules`);
// functions : cheerio y manquait le 23.11 ; si la jonction n'a pas cheerio, installer sur place.
let fnm = false;
if (fs.existsSync(`${MODULES}/functions/node_modules/cheerio`)) fnm = jonction(`${wt}/functions/node_modules`, `${MODULES}/functions/node_modules`);
else { execFileSync('npm', ['ci', '--prefix', `${wt}/functions`, '--no-audit', '--no-fund'], { stdio: 'ignore', shell: true }); fnm = 'npm ci'; }

if (fs.existsSync(`${PILOTE}/.env`)) fs.copyFileSync(`${PILOTE}/.env`, `${wt}/.env`);
const gabarit = `${wt}/src/data/seedData.example.ts`;
if (!fs.existsSync(`${wt}/src/data/seedData.ts`) && fs.existsSync(gabarit)) fs.copyFileSync(gabarit, `${wt}/src/data/seedData.ts`);

// Port stable par nom (4300–4799), dossier de build à part : aucun partage entre copies.
const port = 4300 + ([...nom].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 500);
const build = path.join(os.tmpdir(), 'affinee-e2e', nom).replace(/\\/g, '/');
console.log(`COPIE OK ${wt} (claude/${nom} depuis ${base}) · node_modules ${nm ? 'jonction' : 'déjà là'} · functions ${fnm}`);
console.log(`export E2E_PORT=${port} E2E_BUILD=${build}`);
