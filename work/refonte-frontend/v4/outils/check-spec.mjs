// Vérifie que chaque citation « … » de SPEC-BRASSEUR.md existe mot pour mot dans une source.
// Usage : node work/refonte-frontend/v4/outils/check-spec.mjs [--control]
// Sources : corpus, décisions, brief v4, exigences retrouvées, et la transcription de la
// session (paroles du 18.10 pas encore recopiées ailleurs). « […] » coupe une citation en
// morceaux vérifiés séparément. --control : cherche dans un texte vide (doit échouer).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve('.');
const spec = fs.readFileSync(path.join(ROOT, 'work/refonte-frontend/v4/SPEC-BRASSEUR.md'), 'utf8');
const sources = [
  'docs/besoins/corpus-demandes.md',
  'work/refonte-frontend/decisions.md',
  'work/refonte-frontend/v4/brief-v4.md',
  'work/refonte-frontend/v4/exigences-retrouvees.md',
  'work/refonte-frontend/v4/tournoi/REGLES.md',
].map((p) => path.join(ROOT, p));
const transcript = path.join(os.homedir(), '.claude/projects/C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie/055d83f7-e384-467e-9f02-749828cb09f6.jsonl');
if (fs.existsSync(transcript)) sources.push(transcript);
// Séances suivantes (19.10 : 16fc09ec…) : seuls les messages du brasseur comptent (rôle user, texte
// tapé ou dicté) ; ni les réponses ni les écritures de l'agent, qui citent ses mots et rendraient
// le contrôle circulaire.
const SEANCES = ['16fc09ec-4e69-48a9-9744-5912b6ef6552'];
const paroles = (f) => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).flatMap((l) => {
  try {
    const o = JSON.parse(l), m = o.message;
    const textes = (c) => (typeof c === 'string' ? [c] : (c || []).filter((x) => x.type === 'text').map((x) => x.text));
    // Un message envoyé pendant que l'agent travaille arrive en commande en attente (queued_command).
    if (o.type === 'attachment' && o.attachment && o.attachment.type === 'queued_command') return textes(o.attachment.prompt);
    if (o.type !== 'user' || !m || m.role !== 'user') return [];
    return textes(m.content);
  } catch (e) { return []; }
}).join(' ');
const norm = (s) => s.replace(/\\n/g, ' ').replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();
const textes = sources.map((f) => fs.readFileSync(f, 'utf8'));
for (const id of SEANCES) {
  const f = path.join(os.homedir(), '.claude/projects/C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie/' + id + '.jsonl');
  if (fs.existsSync(f)) textes.push(paroles(f));
}
const hay = process.argv.includes('--control') ? '' : textes.map(norm).join(' ');
const quotes = [...spec.matchAll(/«\s*([^»]+?)\s*»/g)].map((m) => m[1]);
let ok = 0;
const missing = [];
for (const q of quotes) {
  const parts = q.split(/\[…\]|\.\.\.$/).map((p) => norm(p)).filter((p) => p.length > 3);
  if (parts.every((p) => hay.includes(p))) ok++;
  else missing.push(q.slice(0, 80));
}
console.log(ok + '/' + quotes.length + ' citations retrouvées');
for (const m of missing) console.log('  introuvable : ' + m);
console.log(missing.length === 0 ? 'SPEC OK' : 'SPEC ECHEC');
if (missing.length) process.exitCode = 1;
