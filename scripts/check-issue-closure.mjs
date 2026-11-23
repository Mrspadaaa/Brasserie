// Refuse la clôture d'une issue d'interface qui ne prouve pas le besoin du brasseur
// (refonte #119, phase 4 ; causes H1, H2, A2 de docs/qualite/causes-racines.md).
//
// Une issue d'interface (étiquette « interface » ou gabarit .github/ISSUE_TEMPLATE/interface.yml)
// ne se ferme que si :
//   1. elle cite au moins un mot du brasseur, Cnnn « ... », retrouvé dans docs/besoins/corpus-demandes.md ;
//   2. elle vise au moins une question Qnn de docs/besoins/banque-de-questions.md ;
//   3. elle nomme au moins un contrôle scripts/check-*.mjs existant et colle sa sortie « … OK »
//      dans un bloc de code ;
//   4. aucune case de bloquant n'est vide, et le dernier verdict commenté ne laisse aucun bloquant ;
//   5. la section Production dit ce qui a été vu en ligne, ou « sans objet » avec la raison.
//
// Usage :
//   node scripts/check-issue-closure.mjs <numéro>          (lit l'issue avec gh, lecture seule)
//   node scripts/check-issue-closure.mjs --body-file <f> [--ui]
//   node scripts/check-issue-closure.mjs --selftest       (témoins positif et négatifs)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/ | /g, ' ').replace(/\s+/g, ' ').trim();
const corpus = new Map([...fs.readFileSync(path.join(root, 'docs/besoins/corpus-demandes.md'), 'utf8').matchAll(/^- \*\*(C\d{3})\*\* · .*? — « (.+) »\s*$/gm)].map((m) => [m[1], norm(m[2])]));
const bank = new Set([...fs.readFileSync(path.join(root, 'docs/besoins/banque-de-questions.md'), 'utf8').matchAll(/^### (Q\d{2}) /gm)].map((m) => m[1]));

function section(body, title) {
  const m = body.split(/^###\s+/m).find((s) => s.toLowerCase().startsWith(title.toLowerCase()));
  return m ? m.slice(m.indexOf('\n') + 1).trim() : '';
}

export function verdict({ body, labels = [], comments = [], ui = false }) {
  const isUi = ui || labels.includes('interface') || /^###\s+Mots du brasseur/m.test(body);
  if (!isUi) return { ok: true, reasons: ['hors interface'] };
  const reasons = [];
  const words = section(body, 'Mots du brasseur') || body;
  const cites = [...words.matchAll(/\b(C\d{3})\s*«\s*([^»]+?)\s*»/g)];
  const good = cites.filter(([, id, q]) => corpus.has(id) && norm(q).split('…').map((x) => x.trim()).filter(Boolean).every((seg) => corpus.get(id).includes(seg)));
  if (!good.length) reasons.push(cites.length ? `citation du brasseur introuvable mot pour mot (${cites.map((c) => c[1]).join(', ')})` : 'aucune citation Cnnn « … » du brasseur');
  const qs = [...(section(body, 'Questions de la banque') || body).matchAll(/\bQ\d{2}\b/g)].map((m) => m[0]).filter((q) => bank.has(q));
  if (!qs.length) reasons.push('aucune question Qnn de la banque');
  const ctrl = section(body, 'Contrôles qui prouvent') || body;
  const scripts = [...ctrl.matchAll(/scripts\/(check-[\w-]+\.mjs)/g)].map((m) => m[1]).filter((f) => fs.existsSync(path.join(root, 'scripts', f)));
  if (!scripts.length) reasons.push('aucun contrôle scripts/check-*.mjs existant');
  // La sortie doit être collée telle quelle dans un bloc de code : écrire l'attendu ne suffit pas.
  if (!/```[\s\S]*?\b[A-Z][A-Z-]+ OK\b[\s\S]*?```/.test(ctrl)) reasons.push('aucune sortie « … OK » collée dans un bloc de code');
  const open = (section(body, 'Bloquants').match(/^\s*- \[ \].*$/gm) || []);
  if (open.length) reasons.push(`${open.length} bloquant(s) ouvert(s) : ${open[0].trim().slice(6, 60)}`);
  const lastVerdict = [...comments].reverse().find((c) => /verdict/i.test(c));
  if (lastVerdict && /bloquant/i.test(lastVerdict) && !/(aucun|0|zéro|sans) bloquant|bloquants? levés?/i.test(lastVerdict)) reasons.push('le dernier verdict commenté porte un bloquant');
  const prod = section(body, 'Production');
  if (!prod || /^_?No response_?$/i.test(prod)) reasons.push('section Production vide (contrôle en ligne ou « sans objet » avec raison)');
  return { ok: !reasons.length, reasons };
}

function report(name, v) {
  console.log((v.ok ? 'CLOSURE OK ' : 'CLOSURE REFUSED ') + name + (v.reasons.length ? ' : ' + v.reasons.join(' ; ') : ''));
  return v.ok;
}

if (process.argv.includes('--selftest')) {
  const [cid, cq] = [...corpus.entries()].find(([, q]) => q.length > 40);
  const good = `### Mots du brasseur\n\n${cid} « ${cq.slice(0, 40)}… »\n\n### Questions de la banque\n\nQ01\n\n### Critères d'acceptation, en mots du brasseur\n\nx\n\n### Contrôles qui prouvent\n\nnode scripts/check-hop-one-tap.mjs\n\n\`\`\`text\nONE-TAP OK meilleur état : 0 toucher\n\`\`\`\n\n### Production\n\nProduction : sans objet, rien de déployé\n\n### Bloquants\n\n- [x] B1 levé\n`;
  const cases = [
    ['conforme', good, [], true],
    ['sans citation', good.replace(/C\d{3} « [^»]+ »/, 'le brasseur veut un clic'), [], false],
    ['citation inventée', good.replace(/« [^»]+ »/, '« une phrase que le brasseur n’a jamais dite »'), [], false],
    ['sans question', good.replace('Q01', 'aucune'), [], false],
    ['bloquant ouvert', good.replace('- [x] B1 levé', '- [ ] B1 contraste'), [], false],
    ['verdict bloquant', good, ['Verdict UX : à corriger (bloquant)'], false],
    ['sans contrôle', good.replace('node scripts/check-hop-one-tap.mjs', 'vu en local'), [], false],
    ['attendu écrit, pas collé', good.replace(/```text\nONE-TAP OK[^`]*```/, 'doit sortir « ONE-TAP OK »'), [], false],
  ];
  let bad = 0;
  for (const [name, body, comments, expect] of cases) {
    const v = verdict({ body, comments, ui: true });
    if (v.ok !== expect) { bad++; console.log(`SELFTEST FAIL ${name} : attendu ${expect}, obtenu ${v.ok} (${v.reasons.join(' ; ')})`); }
  }
  console.log(bad ? 'SELFTEST FAILED' : `SELFTEST OK ${cases.length}`);
  process.exitCode = bad ? 1 : 0;
} else if (process.argv.includes('--body-file')) {
  const f = process.argv[process.argv.indexOf('--body-file') + 1];
  if (!report(path.basename(f), verdict({ body: fs.readFileSync(f, 'utf8'), ui: process.argv.includes('--ui') }))) process.exitCode = 1;
} else {
  const n = process.argv[2];
  if (!/^\d+$/.test(n || '')) { console.error('Usage : node scripts/check-issue-closure.mjs <numéro> | --body-file <f> | --selftest'); process.exit(2); }
  const j = JSON.parse(execFileSync('gh', ['issue', 'view', n, '--json', 'body,labels,comments'], { encoding: 'utf8' }));
  if (!report('#' + n, verdict({ body: j.body || '', labels: j.labels.map((l) => l.name), comments: j.comments.map((c) => c.body) }))) process.exitCode = 1;
}
