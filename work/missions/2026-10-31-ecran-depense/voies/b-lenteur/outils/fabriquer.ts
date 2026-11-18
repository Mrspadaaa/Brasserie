// Voie b-lenteur : fabrique, HORS GIT (sous os.tmpdir()), le manifeste rejoué et le fichier « lenteur » des pièces de Sa vraie lecture.
//
// Rien n'est inventé : pour chaque pièce, les deux lectures Flash-Lite et la lecture 3.8 sont les RÉPONSES BRUTES déjà payées de
// `H13-reels/banc-k6-C/raw` (aucun appel, aucune clé). Le serveur de production (`lireCsv8`, `functions/src/invoiceScanVote.ts`) est rejoué sur ces lectures avec de
// FAUX accès (les lectures rendues telles quelles) : il appelle `provisoire` (le morceau, calculé par `provisoireDeDeux`), puis rend le final avec ses `rangProvisoire`.
// Sorties, toutes sous `<tmp>/affinee-lenteur/` (ses pièces : jamais dans le dépôt) :
//   - `lenteur.json`   : par pièce, { provisoire, final, finalSeul, finalEchec, finalPerdues2?, rangs… } ; une pièce HT (banc-k5-C) en plus, rejouée telle quelle.
//   - `manifeste.json` : copie du manifeste de `jus0/rejeu-k6.json` en chemins absolus, plus la clé `lenteur` (chemin de `lenteur.json`).
// Marquage du simulé : `finalPerdues2` est DÉRIVÉ d'une vraie lecture (deux lignes du final retirées pour jouer le geste « pas retrouvée ») ; il porte `simule: true`.
// Usage : npx tsx work/missions/2026-10-31-ecran-depense/voies/b-lenteur/outils/fabriquer.ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readingFromResponse } from '../../../../../../scripts/banc-lecture-facture';
import { lireCsv8, type LectureVote } from '../../../../../../functions/src/invoiceScanVote';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../..');
const REELS = path.join(RACINE, 'work/finalisation-tickets-2026-10-08/H13-reels');
const SORTIE = path.join(tmpdir(), 'affinee-lenteur');
mkdirSync(SORTIE, { recursive: true });

const banc = JSON.parse(readFileSync(path.join(REELS, 'banc-k6-C/results.json'), 'utf8'));
const lire = (doc: string, tirage: number, meta: any, ms: number, cout: number | null) => {
  const brut = JSON.parse(readFileSync(path.join(REELS, 'banc-k6-C/raw', `${doc}-t${tirage}-${meta.id}.json`), 'utf8'));
  const lecture = readingFromResponse(meta, brut, ms, cout, true);
  if (!lecture.normalized) throw new Error(`${doc} : lecture ${meta.id} illisible`);
  return lecture.normalized as any;
};

/** Le serveur rejoué : `lireCsv8` avec de faux accès. `troisieme` rend la 3.8 ou rejette (3.8 en échec). */
async function jouer(l1: any, l2: any, l3: any | null, cause: 'delai' | null, avecMorceau: boolean) {
  let morceau: any = null;
  const io: any = {
    readLite: async (lecture: 1 | 2) => (lecture === 1 ? l1 : l2),
    readStrong: async () => { if (!l3) throw Object.assign(new Error('3.8 coupée'), { name: 'TimeoutError' }); return l3; },
    causeOf: () => cause, deadlineReached: () => false,
    ...(avecMorceau ? { provisoire: (donnees: any) => { morceau = donnees; } } : {})
  };
  const final = await lireCsv8(io);
  return { final, morceau };
}

const pieces: Record<string, any> = {};
for (const doc of ['doc1', 'doc2', 'doc3', 'doc4', 'doc5', 'doc6', 'doc14']) {
  const rec = banc.records.find((r: any) => r.doc === doc && r.tirage === 1);
  const run = rec.variants['Csv8+N'] ?? rec.variants.Csv8;
  const lectures: any[] = rec.readings.filter((r: any) => run.ids.includes(r.meta.id));
  const par = (k: number) => lectures.find((r: any) => r.meta.lecture === k);
  if (!par(1) || !par(2) || !par(3)) { console.log(`${doc} : sans 3.8, ignorée`); continue; }
  const [l1, l2, l3] = [1, 2, 3].map(k => lire(doc, rec.tirage, par(k).meta, par(k).ms, par(k).costMicroChf));
  const normale = await jouer(l1, l2, l3, null, true);
  if (!normale.morceau) { console.log(`${doc} : aucun provisoire (deux lectures d'accord), ignorée`); continue; }
  const echec = await jouer(l1, l2, null, 'delai', true);
  const seul = await jouer(l1, l2, l3, null, false);
  const itemsFinal = normale.final.items as any[];
  // Deux lignes que « la 3.8 ne lit plus » : DÉRIVÉ d'une vraie lecture (simulé), deux lignes à rang provisoire des dernières du final retirées.
  const retirables = itemsFinal.map((l, i) => (l.rangProvisoire === null ? -1 : i)).filter(i => i >= 3);
  const perdues = retirables.slice(-2);
  const finalPerdues2 = perdues.length === 2 ? { ...normale.final, items: itemsFinal.filter((_, i) => !perdues.includes(i)) } : null;
  pieces[doc] = {
    id: doc, simule: false,
    msProvisoire: Math.max(par(1).ms, par(2).ms), msFinal: par(3).ms,
    provisoire: normale.morceau, final: normale.final, finalSeul: seul.final, finalEchec: echec.final,
    finalPerdues2: finalPerdues2 ? { ...finalPerdues2, simule: true } : null,
    // Les rangs (du provisoire) dont la 3.8 change le nom, l'unité ou le prix : le banc y tape une valeur (« sa saisie l'emporte ») ou y cherche une correction.
    rangsNomChange: itemsFinal.map((l: any) => (l.rangProvisoire !== null && l.name !== normale.morceau.items[l.rangProvisoire]?.name ? l.rangProvisoire : -1)).filter((r: number) => r >= 0),
    rangsUniteChange: itemsFinal.map((l: any) => (l.rangProvisoire !== null && l.unit !== normale.morceau.items[l.rangProvisoire]?.unit ? l.rangProvisoire : -1)).filter((r: number) => r >= 0),
    rangsNuls: itemsFinal.filter(l => l.rangProvisoire === null).length, lignesProvisoire: normale.morceau.items.length, lignesFinal: itemsFinal.length,
    lignesRetirees: perdues
  };
  console.log(`${doc} : provisoire ${normale.morceau.items.length} lignes, final ${itemsFinal.length} (rang nul ${pieces[doc].rangsNuls}), échec ${echec.final.items.length}, perdues-2 ${finalPerdues2 ? 'oui' : 'non'}`);
}

// La pièce HT (n3-ht, critère 4) : la lecture rejouée de banc-k5-C (doc10, tirage 1, trois images), telle quelle ; sans provisoire (rejeu du final).
const k5 = JSON.parse(readFileSync(path.join(REELS, 'banc-k5-C/results.json'), 'utf8'));
const ht = k5.records[9];
if (ht.doc !== 'doc10' || ht.variants['Csv8+N']?.result?.controls?.sum?.base !== 'HT') throw new Error('Pièce HT introuvable (banc-k5-C records[9]).');
pieces.ht = { id: 'ht', simule: false, final: ht.variants['Csv8+N'].result, images: [1, 2, 3].map(n => path.join(REELS, `doc10-commande-652093-ecran-${n}.jpg`)) };
console.log(`ht : ${pieces.ht.final.items.length} lignes, base ${pieces.ht.final.controls.sum.base}`);

const fichierLenteur = path.join(SORTIE, 'lenteur.json');
writeFileSync(fichierLenteur, JSON.stringify({ pieces }));

// Le manifeste : mêmes entrées que `jus0/rejeu-k6.json`, chemins absolus (il vit hors du dépôt), plus `lenteur`.
const dirManifeste = path.join(REELS, 'jus0');
const manifeste = JSON.parse(readFileSync(path.join(dirManifeste, 'rejeu-k6.json'), 'utf8'));
for (const entree of Object.values<any>(manifeste.docs)) {
  entree.image = path.resolve(dirManifeste, entree.image); entree.output = path.resolve(dirManifeste, entree.output);
  if (entree.truth) entree.truth = path.resolve(dirManifeste, entree.truth);
}
manifeste.lenteur = fichierLenteur;
writeFileSync(path.join(SORTIE, 'manifeste.json'), JSON.stringify(manifeste, null, 1));
console.log(`MANIFESTE ${path.join(SORTIE, 'manifeste.json')}`);
