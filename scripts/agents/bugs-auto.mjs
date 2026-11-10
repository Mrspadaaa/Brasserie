// Met à jour work/missions/BUGS.md depuis Git, sans saisie à la main :
//  1. un commit (toutes branches) dont le sujet COMMENCE par des ids du registre (« TE-23 : … », « BE-98, RL-1 (…) ») passe ces bugs
//     ouverts / en cours / rouverts à « corrigé <sha> » ;
//  2. avec --deploye <commit> : chaque bug « corrigé » dont le commit est un ancêtre du commit déployé passe à « déployé <commit> ».
// « vérifié » reste un geste joué en ligne : jamais posé ici. Usage : node scripts/agents/bugs-auto.mjs [--jours=14] [--deploye <sha>] [--sec] [--fichier <BUGS.md>] [--hook]
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
const jours = Number((process.argv.find((a) => a.startsWith('--jours=')) ?? '=14').split('=')[1]);
const deploye = arg('--deploye');
const sec = process.argv.includes('--sec');
const f = arg('--fichier') ?? 'work/missions/BUGS.md';
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
// --hook (Stop) : n'agit que dans le dossier qui tient le registre maître, marqué par <git-dir>/registre-maitre ; silencieux ailleurs.
if (process.argv.includes('--hook') && !fs.existsSync(`${git('rev-parse', '--git-dir')}/registre-maitre`)) process.exit(0);

const lignes = fs.readFileSync(f, 'utf8').split('\n');
const index = new Map();
lignes.forEach((l, i) => { const c = l.split('|'); if (c.length >= 9 && /^[A-Z][A-Z0-9]*(-NOTE)?-\d+$/.test(c[1].trim())) index.set(c[1].trim(), i); });

const journal = [];
const commitsDe = new Map(); // id → tous les sha qui le nomment en tête (une correction reprise sur une autre branche change de sha)
const poser = (id, etat, commit, note) => {
  const i = index.get(id); const c = lignes[i].split('|');
  c[6] = ` ${etat} `; c[7] = ` ${commit} `; c[8] = ` ${c[8].trim() ? c[8].trim() + ' ; ' : ''}${note} `;
  lignes[i] = c.join('|'); journal.push(`${id} → ${etat} ${commit}`);
};

// 1. Commits → corrigé (le plus ancien commit qui nomme le bug en tête de sujet).
const log = git('log', '--all', `--since=${jours} days ago`, '--reverse', '--format=%h%x09%s');
for (const l of log.split('\n').filter(Boolean)) {
  const [sha, sujet] = l.split('\t');
  const tete = /^((?:[A-Z][A-Z0-9]*-\d+(?:\s*(?:,|et)\s*)?)+)\s*[:(]/.exec(sujet);
  if (!tete) continue;
  for (const id of tete[1].match(/[A-Z][A-Z0-9]*-\d+/g)) {
    if (!index.has(id)) continue;
    commitsDe.set(id, [...(commitsDe.get(id) ?? []), sha]);
    const etat = lignes[index.get(id)].split('|')[6].trim();
    if (/^(ouvert|en cours)/.test(etat)) poser(id, 'corrigé', sha, `auto : commit ${sha} « ${sujet.slice(0, 80).replace(/\|/g, '/')} »`);
  }
}

// 2. Déploiement → déployé pour les corrections contenues dans le commit servi.
if (deploye) {
  for (const [id, i] of index) {
    const c = lignes[i].split('|');
    const sha = c[7].trim().split(/\s/)[0];
    if (c[6].trim() !== 'corrigé' || !/^[0-9a-f]{7,40}$/.test(sha)) continue;
    const servi = [sha, ...(commitsDe.get(id) ?? [])].find((s) => { try { execFileSync('git', ['merge-base', '--is-ancestor', s, deploye], { stdio: 'ignore' }); return true; } catch { return false; } });
    if (servi) poser(id, 'déployé', deploye, `auto : ${servi} contenu dans ${deploye}`);
  }
}

if (!sec && journal.length) fs.writeFileSync(f, lignes.join('\n'));
console.log(`${journal.length} changement(s)${sec ? ' (à blanc)' : ''}${journal.length ? ' :\n' + journal.join('\n') : ''}`);
