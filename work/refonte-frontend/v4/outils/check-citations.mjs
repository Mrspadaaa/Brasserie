// Vérifie mot pour mot les citations de exigences-retrouvees.md dans leurs sources.
// Usage : node work/refonte-frontend/v4/outils/check-citations.mjs [--control]
// --control altère chaque citation d'un mot : toutes doivent alors échouer.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ARCH = 'C:/Users/mrspa/Documents/Brasserie/work/';
const FILE = path.join(ROOT, 'work/refonte-frontend/v4/exigences-retrouvees.md');
const control = process.argv.includes('--control');

const DIRS = {
  'cadrage/': ARCH + 'houblons-v5-cadrage-2026-09-29/',
  'realisation/': ARCH + 'houblons-v5-realisation-2026-09-29/',
  'complement-carte-2026-10-01/': ARCH + 'houblons-complement-carte-2026-10-01/',
  'dépôt/': ROOT.replace(/\\/g, '/') + '/',
};
const BARE = {
  'brief-exact.md': 'realisation/consultation-carte-01/',
  'brief-before-radar.md': 'realisation/consultation-carte-01/',
  'brief-before-gemini.md': 'realisation/consultation-carte-01/',
  'prompt-a.txt': 'realisation/consultation-carte-team-04/',
  'proofs-c.txt': 'realisation/consultation-carte-team-04/',
  '01-brief-utilisateur.md': 'realisation/input-carte-21/',
  '10-addendum-radar-team-13.md': 'realisation/input-carte-21/',
  'retours-demandes-nolo.txt': 'realisation/team-v55-final-01/',
  'steering-barres-radar-2026-10-01.md': ARCH + 'houblons-v5-supervision-astra-2026-09-29/v55-team-13/input/',
  'brief-opus.md': 'complement-carte-2026-10-01/',
  'gemini-catalogues-simulateur.md': 'complement-carte-2026-10-01/',
  'observations-reference.md': 'complement-carte-2026-10-01/',
  'clarification-en-attente-opus.md': 'complement-carte-2026-10-01/',
};

function resolve(p) {
  p = p.replace(/\\/g, '/');
  if (/^[A-Za-z]:\//.test(p)) return p;
  for (const [k, v] of Object.entries(DIRS)) if (p.startsWith(k)) return v + p.slice(k.length);
  const base = p.split('/')[0];
  if (BARE[p]) {
    const pre = BARE[p];
    return resolve(pre.startsWith('C:') ? pre + p : pre + p);
  }
  if (BARE[base]) return resolve(BARE[base] + p);
  if (p.startsWith('input-carte-21/') || p.startsWith('consultation-') || p.startsWith('team-'))
    return ARCH + 'houblons-v5-realisation-2026-09-29/' + p;
  if (p.startsWith('docs/') || p.startsWith('src/')) return DIRS['dépôt/'] + p;
  return ARCH + p;
}

const norm = (s) => s.replace(/\*\*/g, '').replace(/[\u2019']/g, "'").replace(/\s+/g, ' ').trim();

const text = fs.readFileSync(FILE, 'utf8');
const blocks = text.split(/\n(?=\*\*R\d{2} ·)/).filter((b) => /^\*\*R\d{2} ·/.test(b));
// Le florilège R13 à R24 est un tableau : chaque ligne cite la transcription T1.
for (const row of text.matchAll(/^\| (R\d{2}) \| « ([^|]*?) » \| L\d+/gm)) {
  blocks.push('**' + row[1] + ' · tableau\n- Citation : « ' + row[2] + ' »\n- Source : `cadrage/demandes-utilisateur.md`');
}
let ok = 0, bad = 0, skipped = 0;
const report = [];
for (const b of blocks) {
  const id = b.match(/^\*\*(R\d{2})/)[1];
  const cit = b.match(/- Citation[^:]*: « ([\s\S]*?) »/) || b.match(/^\*\*R\d{2} · [^·]*· « ([^»]*?) »/);
  const src = b.match(/- Source : `([^`]+?\.(?:md|txt|html|json))(?::[^`]*)?`/);
  if (!cit || !src) { skipped++; report.push(id + ' SANS-CITATION-OU-SOURCE'); continue; }
  const label = b.match(/- Citation[^:]*:/);
  const fromCorpus = label ? /\(corpus/.test(label[0]) : false;
  const target = fromCorpus ? DIRS['dépôt/'] + 'docs/besoins/corpus-demandes.md' : resolve(src[1]);
  if (!fs.existsSync(target)) { bad++; report.push(id + ' FICHIER-ABSENT ' + target); continue; }
  const hay = norm(fs.readFileSync(target, 'utf8'));
  let quote = cit[1];
  if (control) quote = quote.replace(/(\S+)/, '$1ZZZ');
  const parts = quote.split(/\[…\]|\[\.\.\.\]/).map(norm).filter((x) => x.length >= 6);
  const missing = parts.filter((p) => !hay.includes(p));
  if (missing.length === 0) ok++;
  else { bad++; report.push(id + ' INTROUVABLE dans ' + path.basename(target) + ' : « ' + missing[0].slice(0, 90) + ' »'); }
}
const total = blocks.length;
console.log('Entrées : ' + total + ' · citations retrouvées : ' + ok + ' · introuvables : ' + bad + ' · sans citation : ' + skipped);
for (const r of report) console.log('  ' + r);
if (!control && bad === 0 && ok > 0) console.log('CITATIONS OK');
else if (control && ok === 0) console.log('CONTROLE OK (toutes les citations altérées échouent)');
else process.exitCode = 1;
