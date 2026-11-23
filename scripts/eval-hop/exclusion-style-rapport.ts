// Voie g2c-exclusion-style : met en tables les trois mesures de exclusion-style.ts (prod, head, d90) dans rapport.md. Pur : lit des JSON, écrit un fichier.
// Lancement : npx vite-node scripts/eval-hop/exclusion-style-rapport.ts -- --entree=<dossier des exclusion-style-*.json> --sortie=<dossier de rapport.md>
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const ENTREE = resolve(args.find((a) => a.startsWith('--entree='))?.split('=')[1] ?? '.');
const SORTIE = resolve(args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? '.');

interface Mesure {
  etat: string; catalogue: number;
  partieA: { cas: string; retirees: number; variétésDeBase: number; variétésRestantes: number; exemples: string[] }[];
  partieB: { houblon: string; herbal: F; green: F; resin: F; exclu21C: boolean; exclu23A: boolean; excluMoinsResine16D: boolean; excluMoinsResine21C: boolean }[];
  partieC: { jeu: string; visee: string; voies: { rang: number; label: string; conflits: number; domaine: string }[] }[];
  partieD: { original: string; candidats: number; avecConflitStyle: number; dix: { rang: number; nom: string; score: number; conflitsStyle: string[] }[];
    phares: { nom: string; rang: number | null; score: number | null; conflitsStyle: string[] | null }[] }[];
  partieE: Record<string, { uneFiche: number; niveauMarque: number; moitie: number } | number>;
}
interface F { sources: number; sur: number; niveau: string; moitie: boolean }
const lire = (e: string): Mesure => JSON.parse(readFileSync(join(ENTREE, `exclusion-style-${e}.json`), 'utf8'));
const ETATS: [string, string, string][] = [['prod', 'Production (49907352)', 'avant d4 : peu de fiches par houblon ; une fiche suffit pour exclure'],
  ['head', 'HEAD (d4, sans D90)', 'fiches de 12 sources ; une fiche suffit pour exclure'], ['d90', 'HEAD + D90', 'exclusion seulement si la famille est citée par la moitié au moins des fiches']];
const M = new Map(ETATS.map(([e]) => [e, lire(e)]));

const oui = (b: boolean) => (b ? 'exclu' : 'non');
const fiches = (f: F) => (f.sur ? `${f.sources}/${f.sur}${f.moitie ? ' (moitié)' : ''}` : 'aucune fiche');
const lignes: string[] = [];
const L = (s = '') => lignes.push(s);

L('# g2c : une seule fiche ne doit plus exclure Nelson Sauvin d’une Hazy (D90)');
L();
L('Mesure déterministe : `scripts/eval-hop/exclusion-style.ts`, lancé dans trois racines (prod et HEAD extraits par `git archive` vers un dossier court de `os.tmpdir()`, jamais en remplaçant un fichier du dépôt ; D90 dans le dépôt). Ce fichier est écrit par `scripts/eval-hop/exclusion-style-rapport.ts`.');
L();
L('Lecture : « exclu » = absent de la liste « ajouter » du moteur pour toutes les familles montées où il figure sous le style 21A (sans famille indésirable), alors que la même recette sous le style testé, ou la même visée sans « moins », l’y met. Mesuré sur le moteur, un seul moment (dry hop actif), catalogue de ' + M.get('d90')!.catalogue + ' houblons sans stock (tout vient du pool « à acheter » ; avec du stock, un houblon exclu reste proposé mais en conflit, première clé du classement : partie C).');
L();
L('Seuls trois styles des fixtures ont des familles indésirables : **21C** (herbacé, végétal vert), **23A** et **23G** (les douze, car un style sans houblon). La stout 16D n’en a aucune : sa mesure porte sur la visée « moins de résineux ».');

for (const [e, titre, note] of ETATS) {
  const m = M.get(e)!;
  L();
  L(`## ${titre}`);
  L();
  L(`_${note}._`);
  L();
  L('### Houblons retirés du pool');
  L();
  L('| cas | variétés de la liste de base | retirées | restantes | premières retirées |');
  L('|---|---:|---:|---:|---|');
  for (const a of m.partieA) L(`| ${a.cas} | ${a.variétésDeBase} | **${a.retirees}** | ${a.variétésRestantes} | ${a.exemples.slice(0, 6).join(', ') || '—'} |`);
  L();
  L('### Houblons phares');
  L();
  L('Fiches qui citent la famille, sur les fiches lues pour ce houblon (« moitié » = D90 la compte comme marquée).');
  L();
  L('| houblon | herbacé | végétal vert | résineux | 21C | 23A | 16D moins résineux | 21C moins résineux |');
  L('|---|---|---|---|---|---|---|---|');
  for (const b of m.partieB) L(`| ${b.houblon} | ${fiches(b.herbal)} | ${fiches(b.green)} | ${fiches(b.resin)} | ${oui(b.exclu21C)} | ${oui(b.exclu23A)} | ${oui(b.excluMoinsResine16D)} | ${oui(b.excluMoinsResine21C)} |`);
  L();
  L('### Suggérer, 21C : les 10 premières voies');
  L();
  for (const c of m.partieC) {
    L(`**${c.jeu} · ${c.visee}**`);
    L();
    L('| rang | voie | conflits | domaine |');
    L('|---:|---|---:|---|');
    for (const v of c.voies) L(`| ${v.rang} | ${v.label} | ${v.conflits} | ${v.domaine} |`);
    L();
  }
  L('### Substituer, 21C, dry hop : remplaçants');
  L();
  for (const d of m.partieD) {
    L(`**${d.original}** : ${d.avecConflitStyle} candidats sur ${d.candidats} en conflit de style (derrière tous les autres).`);
    L();
    L('Dix premiers : ' + d.dix.map((x) => `${x.rang}. ${x.nom} (${x.score}${x.conflitsStyle.length ? `, conflit ${x.conflitsStyle.join('+')}` : ''})`).join(' ; ') + '.');
    L();
    L('Rangs des phares : ' + d.phares.map((x) => `${x.nom} ${x.rang ?? '—'}${x.conflitsStyle?.length ? ` (conflit ${x.conflitsStyle.join('+')})` : ''}`).join(' ; ') + '.');
    L();
  }
}

L('## Trois lectures de « citée » (même catalogue, états identiques)');
L();
L('Variétés du catalogue qui citent la famille, selon la lecture. « Une fiche » est l’ancienne règle ; « niveau marqué » est celui de `describeFamilies` (deux fiches, ou premier descripteur) ; « moitié » est D90.');
L();
L('| famille(s) | une fiche | niveau « marqué » | moitié des fiches (D90) |');
L('|---|---:|---:|---:|');
for (const e of ['head', 'prod'] as const) {
  const E = M.get(e)!.partieE;
  for (const [k, v] of Object.entries(E)) if (typeof v === 'object') L(`| ${k} (${e === 'head' ? 'fiches d4' : 'production'}) | ${v.uneFiche} | ${v.niveauMarque} | ${v.moitie} |`);
}
L();

const texte = lignes.join('\n');
writeFileSync(join(SORTIE, 'rapport.md'), texte);
process.stdout.write(`rapport.md sha256 ${createHash('sha256').update(texte).digest('hex')}\n`);
