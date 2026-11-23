#!/usr/bin/env node
// Chaque entrée du fichier des tickets du soir porte « - Publié : <url> », et chaque URL existe sur GitHub (gh api).
// Usage : node publies.mjs  →  « PUBLIES OK (n publications : c commentaires, f fermetures, i issues) » ou « PUBLIES ECHEC (…) ».
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const F = 'work/refonte-frontend/tickets-2026-10-24-soir.md';
if (!fs.existsSync(F)) { console.log(`PUBLIES ECHEC (pas de ${F})`); process.exit(1); }
const urls = [...fs.readFileSync(F, 'utf8').matchAll(/- Publié : (https:\/\/github\.com\/Mrspadaaa\/Brasserie\/issues\/(\d+)(#issuecomment-(\d+))?)/g)];
const ecarts = [];
let c = 0, i = 0;
for (const [, url, n, , com] of urls) {
  try {
    if (com) { execFileSync('gh', ['api', `repos/Mrspadaaa/Brasserie/issues/comments/${com}`, '--jq', '.id'], { stdio: 'pipe' }); c++; }
    else { execFileSync('gh', ['api', `repos/Mrspadaaa/Brasserie/issues/${n}`, '--jq', '.number'], { stdio: 'pipe' }); i++; }
  } catch { ecarts.push(url); }
}
if (urls.length < 10) ecarts.push(`${urls.length} publications (10 au moins)`);
const fermees = JSON.parse(execFileSync('gh', ['issue', 'list', '--repo', 'Mrspadaaa/Brasserie', '--state', 'closed', '--search', 'closed:>=2026-10-24', '--json', 'number'], { encoding: 'utf8' })).length;
console.log(ecarts.length ? `PUBLIES ECHEC (${ecarts.slice(0, 6).join(' ; ')})` : `PUBLIES OK (${urls.length} publications : ${c} commentaires, ${i} issues ; ${fermees} fermées depuis le 24.10)`);
process.exit(ecarts.length ? 1 : 0);
