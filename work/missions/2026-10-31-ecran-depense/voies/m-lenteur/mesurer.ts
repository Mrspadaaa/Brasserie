// Voie m-lenteur : mesure HORS LIGNE (aucun appel) des quatre façons de compter la 3ᵉ lecture (D261c).
// Usage : npx tsx work/missions/2026-10-31-ecran-depense/voies/m-lenteur/mesurer.ts [--banc=banc-k6-C] [--variante=Csv8] [--detail]
// Les lectures (réponses brutes des deux Flash-Lite et de la 3.8) viennent d'une passe déjà payée : `H13-reels/<banc>/raw/*.json` + les durées
// et coûts de `results.json`. La fusion est celle de la production (functions/src/invoiceScanVote.ts, invoiceVisionReview.ts), IMPORTÉE ; le jugement
// est celui du banc (scripts/banc-lecture-facture-juger.ts), les niveaux sûr / repris / inconnu sont ceux de l'écran (src/ui/depense/confiance.ts).
// Aucune valeur d'une pièce n'est écrite : des comptes, des durées, des coûts, des noms de champ.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { readingFromResponse, loadCases, genreOfCase, type Reading } from '../../../../../scripts/banc-lecture-facture';
import { judgeResult, lignesSansPort } from '../../../../../scripts/banc-lecture-facture-juger';
import { finalOfStarVote, finalOfTwo, needsThirdLite, type LectureVote } from '../../../../../functions/src/invoiceScanVote';
import { reconcileInvoiceVision } from '../../../../../functions/src/invoiceVisionReview';
import { peserPoint } from '../../../../../functions/src/invoiceControls';
import { ciblesDuPoint, confianceEntete, confianceLigne, totalCorrobore, type LigneConfiance, type Niveau } from '../../../../../src/ui/depense/confiance';

const REELS = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/finalisation-tickets-2026-10-08/H13-reels';
// Que des drapeaux (--banc=…) : le jugeur du banc lance son propre main() dès qu'un argument ne commence pas par « -- ».
const bancName = process.argv.find(a => a.startsWith('--banc='))?.slice(7) ?? 'banc-k6-C';
const detail = process.argv.includes('--detail');
const variante = process.argv.find(a => a.startsWith('--variante='))?.slice(11) ?? 'Csv8';
const banc = JSON.parse(readFileSync(path.join(REELS, bancName, 'results.json'), 'utf8'));
const cases = loadCases(['cas.json', 'cas-2.json', 'cas-3.json', 'cas-4.json', 'cas-5.json'].map(f => path.join(REELS, f)));
const casDe = new Map(cases.map(c => [c.id, c]));

// ---------------------------------------------------------------------------------------------------------------------
// Les lectures d'une pièce
// ---------------------------------------------------------------------------------------------------------------------
interface Lue { id: string; ms: number; cost: number | null; reading: Reading; vote: LectureVote }
interface Piece { doc: string; tirage: number; genre: string; l1: Lue; l2: Lue; third?: Lue }
const rawPath = (dir: string, doc: string, tirage: number, id: string) => path.join(REELS, dir, 'raw', `${doc}-t${tirage}-${id}.json`);
function lue(meta: any, ms: number, cost: number | null, lent: boolean | undefined, dir: string, doc: string, tirage: number): Lue {
  // une lecture prêtée par une autre passe : sa réponse est dans le dossier de cette passe, sinon cherchée dans tous les bancs
  // une lecture prêtée vient d'abord des passes que `--reprendre` citait (dans cet ordre), puis de n'importe quel autre banc
  const citees: string[] = String(banc.meta.reprendre ?? '').split(',').filter(Boolean);
  const candidates = [dir, ...(lent ? [...citees, ...readdirSync(REELS).filter(d => d.startsWith('banc-') && existsSync(path.join(REELS, d, 'raw')))] : [])];
  const file = candidates.map(d => rawPath(d, doc, tirage, meta.id)).find(existsSync);
  if (!file) throw new Error(`réponse brute introuvable : ${doc} t${tirage} ${meta.id}`);
  const reading = readingFromResponse(meta, JSON.parse(readFileSync(file, 'utf8')), ms, cost, true); // true = N (devise en code ISO), comme la production
  return { id: meta.id, ms, cost, reading, vote: { normalized: reading.normalized as any, cause: reading.cause } };
}
const pieces: Piece[] = [], ecartees: string[] = [], ignorees: string[] = [];
for (const rec of banc.records) {
  const run = rec.variants[`${variante}+N`] ?? rec.variants[variante];
  if (!run) continue;
  const ids: string[] = run.ids;
  const readings: any[] = rec.readings.filter((r: any) => ids.includes(r.meta.id));
  const by = (k: number) => readings.find((r: any) => r.meta.lecture === k);
  const make = (r: any) => lue(r.meta, r.ms, r.costMicroChf, r.lent, bancName, rec.doc, rec.tirage);
  const c = casDe.get(rec.doc);
  if (!c || !by(1) || !by(2)) continue;
  try { pieces.push({ doc: rec.doc, tirage: rec.tirage, genre: genreOfCase(c), l1: make(by(1)), l2: make(by(2)), ...(by(3) ? { third: make(by(3)) } : {}) }); }
  catch (error) { ecartees.push(`${rec.doc} t${rec.tirage} : ${(error as Error).message}`); }
}
// Une 3.8 lue au banc mais que le code d'aujourd'hui n'appellerait pas est ignorée ; une 3.8 que le code appellerait et qui manque écarte la pièce.
for (const p of [...pieces]) {
  const demande = needsThirdLite(p.l1.vote, p.l2.vote);
  if (p.third && !demande) { delete p.third; ignorees.push(`${p.doc} t${p.tirage}`); }
  else if (!p.third && demande) { pieces.splice(pieces.indexOf(p), 1); ecartees.push(`${p.doc} t${p.tirage} : 3.8 appelée par le code d'aujourd'hui, jamais lue`); }
}
if (ignorees.length) console.log(`3.8 IGNOREE (le code d'aujourd'hui ne l'appelle pas) : ${ignorees.join(', ')}`);
if (ecartees.length) console.log(`PIECES ECARTEES (réponse brute absente) : ${ecartees.join(' ; ')}`);

// ---------------------------------------------------------------------------------------------------------------------
// Les quatre façons de compter la troisième lecture
// ---------------------------------------------------------------------------------------------------------------------
const liteMs = (p: Piece) => Math.max(p.l1.ms, p.l2.ms);
const cout = (...l: Array<Lue | undefined>) => l.reduce((s, x) => s + (x?.cost ?? 0), 0) / 1e6;
const MONEY_EXTRA = new Set(['tvaAmount', 'vat']);
/** Un désaccord d'ARGENT entre les deux Flash-Lite : montant total, HT, TVA, quantité, prix ou montant de ligne, ou lignes sans vis-à-vis. */
function desaccordArgent(p: Piece): { argent: boolean; strict: boolean; sec: boolean; argentChamps: string[]; autres: string[] } {
  if (!p.l1.vote.normalized || !p.l2.vote.normalized) return { argent: true, strict: true, sec: true, argentChamps: ['lecture manquante'], autres: [] };
  const points: any[] = reconcileInvoiceVision([p.l1.vote.normalized, p.l2.vote.normalized]).result.points as any[];
  const des = points.filter(x => x.source === 'désaccord' && peserPoint(x));
  const estArgent = (x: any) => x.enjeu === 'argent' || MONEY_EXTRA.has(String(x.champ));
  const nom = (x: any) => String(x.champs?.[0] ?? x.champ).replace(/^items\.\d+\./, '');
  // « strict » : seulement les montants imprimés (total, HT, TVA, montant de ligne, lignes sans vis-à-vis), pas la quantité ni le prix unitaire
  const estMontant = (x: any) => estArgent(x) && !['quantity', 'price'].includes(nom(x));
  // « sec » : encore sans la TVA (bloc et total de TVA) : total TTC, HT, montant de ligne, lignes sans vis-à-vis
  const estSec = (x: any) => estMontant(x) && !MONEY_EXTRA.has(String(x.champ)) && nom(x) !== 'vat' && nom(x) !== 'tvaAmount';
  return { argent: des.some(estArgent), strict: des.some(estMontant), sec: des.some(estSec), argentChamps: [...new Set(des.filter(estArgent).map(nom))], autres: des.filter(x => !estArgent(x)).map(nom) };
}
interface Etape { result: any; ms: number; cost: number }
interface Parcours { premier: Etape; final: Etape; appelleTroisieme: boolean }
type Option = 'A' | 'B' | 'B2' | 'B3' | 'C' | 'D' | 'BD';
function parcours(option: Option, p: Piece): Parcours {
  const lite = liteMs(p), cLite = cout(p.l1, p.l2);
  const deux = (): Etape => ({ result: finalOfTwo(p.l1.vote, p.l2.vote).result, ms: lite, cost: cLite });
  const avec = (): Etape => ({ result: finalOfStarVote(p.l1.vote, p.l2.vote, p.third?.vote).result, ms: lite + (p.third?.ms ?? 0), cost: cLite + cout(p.third) });
  const A = avec();
  const unTroisiemeDemande = needsThirdLite(p.l1.vote, p.l2.vote);
  if (!!p.third !== unTroisiemeDemande) throw new Error(`${p.doc} : la 3.8 ${p.third ? 'est là sans' : 'manque avec'} déclencheur de la production`);
  const d = unTroisiemeDemande ? desaccordArgent(p) : { argent: false, strict: false, sec: false };
  const argent = d.argent;
  const B: Etape = argent ? A : deux();
  const B2: Etape = d.strict ? A : deux();
  const B3: Etape = d.sec ? A : deux();
  switch (option) {
    case 'A': return { premier: A, final: A, appelleTroisieme: !!p.third };
    case 'B': return { premier: B, final: B, appelleTroisieme: argent };
    case 'B2': return { premier: B2, final: B2, appelleTroisieme: d.strict };
    case 'B3': return { premier: B3, final: B3, appelleTroisieme: d.sec };
    case 'C': { const C = deux(); return { premier: C, final: C, appelleTroisieme: false }; }
    case 'D': return { premier: deux(), final: A, appelleTroisieme: !!p.third };
    case 'BD': return { premier: deux(), final: argent ? { ...A, ms: A.ms } : deux(), appelleTroisieme: argent };
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Jugement : champs, lignes, drapeaux (niveaux de l'écran), erreurs muettes
// ---------------------------------------------------------------------------------------------------------------------
const ENTETE: Record<string, string> = { vendor: 'fournisseur', documentType: 'document', date: 'date', currency: 'total', invoiceNumber: 'numero', orderNumber: 'numero',
  amountHT: 'total', amountTTC: 'total', tvaAmount: 'tva', tvaRate: 'tva', paymentEvidence: 'document', 'items.count': 'lignes' };
const LIGNE: Record<string, string> = { quantity: 'quantite', unit: 'unite', price: 'prix', amountTTC: 'montant', name: 'article', kind: 'famille' };
let muetsAccord = 0, muetsTotal = 0;
interface Evalue { champs: number; justes: number; lignes: number; lignesJustes: number; faux: number; muets: string[]; fauxVert: boolean; jaunes: number; rouges: number; statut: string; faux_signales: number; fauxChamps: string[] }
function evaluer(doc: string, result: any): Evalue {
  const expected = casDe.get(doc)!.expected;
  const v = judgeResult(result, expected);
  const lignes: LigneConfiance[] = (result.items ?? []).map((it: any) => ({ id: it.id, description: it.name, kind: it.kind, quantity: it.quantity ?? undefined, unit: it.unit ?? '',
    unitPrice: it.price ?? undefined, amount: it.amountTTC ?? undefined, stockCategory: it.stockCategory ?? '', sourceReference: it.reference ?? '' }));
  const contexte = { lignes, fournisseur: result.vendor, total: result.amountTTC, points: result.points };
  const conf = lignes.map(l => confianceLigne(l, contexte));
  const tete = confianceEntete({ points: result.points }, { date: result.date, vendor: result.vendor, invoiceNumber: result.orderNumber ? undefined : result.invoiceNumber,
    amount: result.amountTTC ?? undefined, sourceVatAmount: result.tvaAmount ?? undefined }, lignes);
  const corrobore = totalCorrobore(contexte);
  // drapeaux : les cellules que la lecture détermine (unité, quantité, prix, montant ; en-tête) ; famille et article dépendent du stock, hors de cette mesure
  let jaunes = 0, rouges = 0;
  const compter = (n: Niveau, facultatif?: boolean) => { if (n === 'repris') jaunes++; else if (n === 'inconnu' && !facultatif) rouges++; };
  for (const c of conf) for (const k of ['unite', 'quantite', 'prix', 'montant'] as const) compter(c[k].niveau);
  for (const k of ['date', 'fournisseur', 'total', 'tva', 'numero', 'lignes', 'document'] as const) compter(tete[k].niveau, (tete[k] as any).facultatif);
  const sp = lignesSansPort(result.items);
  const niveauDe = (route: string): Niveau => {
    const parts = route.split('.');
    if (parts[0] !== 'items' || parts[1] === 'count') return (tete as any)[ENTETE[route] ?? 'lignes'].niveau;
    const orig = result.items.indexOf(sp[Number(parts[1])]);
    if (orig < 0 || !parts[2]) return tete.lignes.niveau; // ligne manquante : le compte de lignes
    const champ = LIGNE[parts[2]];
    if (champ === 'article' || champ === 'famille') {
      const cibles = (result.points ?? []).filter((q: any) => q.ligne === orig + 1).flatMap((q: any) => ciblesDuPoint(q, corrobore)).filter((x: any) => x.champ === champ);
      return cibles.length ? (cibles.some((x: any) => x.niveau === 'inconnu') ? 'inconnu' : cibles.some((x: any) => x.niveau === 'repris') ? 'repris' : 'sur') : 'sur';
    }
    return (conf[orig] as any)[champ].niveau;
  };
  const muets = v.wrong.filter(route => niveauDe(route) === 'sur');
  const statut = result.review?.status ?? 'inconnu';
  // Parmi les muettes : combien sur une cellule où les lectures s'accordaient (aucun point de désaccord) : une erreur que seule une 3.8 pouvait corriger au passage
  const celluleDe = (route: string): string => {
    const parts = route.split('.');
    return parts[0] === 'items' && parts[1] !== 'count' && parts[2] ? `items.${result.items.indexOf(sp[Number(parts[1])]) + 1}.${parts[2]}` : route;
  };
  const accord = muets.filter(route => !(result.points ?? []).some((q: any) => q.source === 'désaccord' && (q.champs ?? []).includes(celluleDe(route))));
  muetsAccord += accord.length; muetsTotal += muets.length;
  return { champs: v.judged, justes: v.right, lignes: v.lineJudged, lignesJustes: v.lineRight, faux: v.wrong.length, muets, fauxVert: statut === 'checked' && v.wrong.length > 0,
    jaunes, rouges, statut, faux_signales: v.wrong.length - muets.length, fauxChamps: v.wrong };
}

// ---------------------------------------------------------------------------------------------------------------------
// Tableau
// ---------------------------------------------------------------------------------------------------------------------
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : NaN; };
const sec = (ms: number) => (ms / 1000).toFixed(1).replace('.', ',') + ' s';
const chf = (x: number) => x.toFixed(4).replace('.', ',');
const OPTIONS: Option[] = ['A', 'B', 'B2', 'B3', 'C', 'D', 'BD'];
const NOM: Record<Option, string> = { A: 'A aujourd’hui', B: 'B 3.8 sur désaccord d’argent', B2: 'B2 comme B, sans quantité ni prix unitaire', B3: 'B3 comme B2, sans la TVA (total, HT, montant de ligne, lignes)',C: 'C jamais de 3.8', D: 'D écran tout de suite, 3.8 après', BD: 'B+D (bonus)' };
const lignesTable: Record<string, any> = {};
const detailParDoc: string[] = [];
for (const option of OPTIONS) {
  const prem: Evalue[] = [], fin: Evalue[] = [], msP: number[] = [], msF: number[] = [], costs: number[] = [];
  let appels3 = 0;
  const parDoc: Record<string, any> = {};
  for (const p of pieces) {
    const run = parcours(option, p);
    const ef = evaluer(p.doc, run.final.result), ep = run.premier === run.final ? ef : evaluer(p.doc, run.premier.result);
    prem.push(ep); fin.push(ef); msP.push(run.premier.ms); msF.push(run.final.ms); costs.push(run.final.cost);
    if (run.appelleTroisieme) appels3++;
    parDoc[p.doc] = { genre: p.genre, ms1: run.premier.ms, msF: run.final.ms, justes: ef.justes, champs: ef.champs, lignesJustes: ef.lignesJustes, lignes: ef.lignes, muets: ef.muets, fauxVert: ef.fauxVert, jaunes: ef.jaunes, rouges: ef.rouges, statut: ef.statut, premierMuets: ep.muets };
  }
  const somme = (xs: Evalue[], f: (e: Evalue) => number) => xs.reduce((s, e) => s + f(e), 0);
  const ligne = {
    appels3, docs: pieces.length,
    premierMed: med(msP), premierMax: Math.max(...msP), finalMed: med(msF), finalMax: Math.max(...msF),
    champs: somme(fin, e => e.champs), justes: somme(fin, e => e.justes), lignes: somme(fin, e => e.lignes), lignesJustes: somme(fin, e => e.lignesJustes),
    jaunes: somme(fin, e => e.jaunes), rouges: somme(fin, e => e.rouges),
    jaunesMedParPiece: med(fin.map(e => e.jaunes)), rougesMedParPiece: med(fin.map(e => e.rouges)),
    fauxTotal: somme(fin, e => e.faux), muets: somme(fin, e => e.muets.length), docsAvecMuet: fin.filter(e => e.muets.length).length, fauxVerts: fin.filter(e => e.fauxVert).length,
    premierMuets: somme(prem, e => e.muets.length), premierJustes: somme(prem, e => e.justes), premierLignesJustes: somme(prem, e => e.lignesJustes), premierJaunes: somme(prem, e => e.jaunes), premierRouges: somme(prem, e => e.rouges), premierDocsMuet: prem.filter(e => e.muets.length).length, premierFauxVerts: prem.filter(e => e.fauxVert).length,
    statuts: fin.reduce((m: any, e) => { m[e.statut] = (m[e.statut] ?? 0) + 1; return m; }, {}),
    coutMed: med(costs), coutTotal: costs.reduce((s, x) => s + x, 0),
  };
  lignesTable[option] = { ligne, parDoc };
}
// Écarts de champs de chaque option contre A (fixés / cassés)
const ecarts: Record<string, { corriges: string[]; casses: string[] }> = {};
for (const option of OPTIONS) {
  const corriges: string[] = [], casses: string[] = [];
  for (const p of pieces) {
    const a = evaluer(p.doc, parcours('A', p).final.result), o = evaluer(p.doc, parcours(option, p).final.result);
    for (const f of o.fauxChamps) if (!a.fauxChamps.includes(f)) casses.push(`${p.doc}:${f}`);
    for (const f of a.fauxChamps) if (!o.fauxChamps.includes(f)) corriges.push(`${p.doc}:${f}`);
  }
  ecarts[option] = { corriges, casses };
}
// Sur quelles pièces la 3.8 est appelée, et pourquoi (noms de champ seulement)
const pourquoi = pieces.map(p => {
  const t = !!p.third, d = t ? desaccordArgent(p) : { argent: false, strict: false, sec: false, argentChamps: [] as string[], autres: [] as string[] };
  return { doc: p.doc, genre: p.genre, troisieme: t, argent: d.argent, strict: d.strict, sec: d.sec, argentChamps: d.argentChamps, autresChamps: [...new Set(d.autres)], liteMs: liteMs(p), troisiemeMs: p.third?.ms ?? 0 };
});
const out = { banc: bancName, variante, pieces: pieces.length, tirages: [...new Set(pieces.map(p => p.tirage))], table: Object.fromEntries(OPTIONS.map(o => [o, lignesTable[o].ligne])), ecarts, pourquoi, ...(detail ? { parDoc: Object.fromEntries(OPTIONS.map(o => [o, lignesTable[o].parDoc])) } : {}) };
const fichier = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, '')), `mesure-${bancName}${variante === 'Csv8' ? '' : '-' + variante}.json`);
writeFileSync(fichier, JSON.stringify(out, null, 1));
// ---- affichage ----
console.log(`BANC ${bancName} · ${pieces.length} pièces · tirages ${out.tirages.join(',')}`);
console.log('option | 3.8 appelée | 1er écran méd/max | final méd/max | champs justes | lignes justes | jaunes | rouges | faux | MUETS (docs) | faux verts | coût méd | coût total');
for (const o of OPTIONS) {
  const l = lignesTable[o].ligne;
  console.log(`${NOM[o]} | ${l.appels3}/${l.docs} | ${sec(l.premierMed)} / ${sec(l.premierMax)} | ${sec(l.finalMed)} / ${sec(l.finalMax)} | ${l.justes}/${l.champs} | ${l.lignesJustes}/${l.lignes} | ${l.jaunes} | ${l.rouges} | ${l.fauxTotal} | ${l.muets} (${l.docsAvecMuet}) | ${l.fauxVerts} | ${chf(l.coutMed)} | ${chf(l.coutTotal)}`);
  if (o === 'D' || o === 'BD') console.log(`   (1er écran : ${l.premierJustes}/${l.champs} champs, ${l.premierLignesJustes}/${l.lignes} lignes, jaunes ${l.premierJaunes}, rouges ${l.premierRouges}, muets ${l.premierMuets} sur ${l.premierDocsMuet} pièces, faux verts ${l.premierFauxVerts})`);
}
for (const o of OPTIONS) console.log(`${o} contre A : corrige ${ecarts[o].corriges.length}, casse ${ecarts[o].casses.length}${detail ? ' | corrige ' + ecarts[o].corriges.join(' ') + ' | casse ' + ecarts[o].casses.join(' ') : ''}`);
console.log('3.8 par pièce : ' + pourquoi.map(x => `${x.doc}${x.troisieme ? (x.argent ? '$' : '~') : '-'}`).join(' ') + '   ($ = désaccord d’argent, ~ = autre désaccord, - = pas de 3.8)');
console.log('désaccords d’argent (champs) : ' + pourquoi.filter(x => x.troisieme).map(x => `${x.doc}[${x.argentChamps.join(',')}]`).join(' '));
console.log('durées : ' + pourquoi.map(x => `${x.doc} ${sec(x.liteMs)}+${x.troisieme ? sec(x.troisiemeMs) : '-'}`).join(' · '));
console.log('désaccords hors argent : ' + pourquoi.filter(x => x.troisieme).map(x => `${x.doc}[${x.autresChamps.join(',')}]`).join(' '));
if (detail) for (const o of OPTIONS) console.log(`muets ${o} : ` + pieces.map(p => { const m = lignesTable[o].parDoc[p.doc].muets; return m.length ? `${p.doc}[${m.join(',')}]` : ''; }).filter(Boolean).join(' '));
for (const o of ['A', 'C'] as Option[]) {
  muetsAccord = 0; muetsTotal = 0;
  for (const p of pieces) evaluer(p.doc, parcours(o, p).final.result);
  console.log(`MUETTES ${o} : ${muetsTotal} au total, dont ${muetsAccord} sur une cellule où les deux Flash-Lite s'accordaient (aucun point de désaccord)`);
}
// Témoin : l'option A recalculée ici contre le résultat final ÉCRIT par le banc (même pièce, même variante), champ par champ.
{
  let accord = 0; const ecartsA: string[] = [];
  for (const rec of banc.records) {
    const p = pieces.find(x => x.doc === rec.doc && x.tirage === rec.tirage);
    const stocke = (rec.variants[`${variante}+N`] ?? rec.variants[variante])?.result;
    if (!p || !stocke) continue;
    const mien = judgeResult(parcours('A', p).final.result, casDe.get(rec.doc)!.expected), sien = judgeResult(stocke, casDe.get(rec.doc)!.expected);
    const a = mien.wrong.join(','), b = sien.wrong.join(',');
    if (a === b && mien.right === sien.right && mien.lineRight === sien.lineRight) accord++; else ecartsA.push(`${rec.doc} (recalculé : ${mien.right}/${mien.judged}, ${mien.lineRight}/${mien.lineJudged} ; écrit : ${sien.right}/${sien.judged}, ${sien.lineRight}/${sien.lineJudged} ; en plus ici : ${mien.wrong.filter(w => !sien.wrong.includes(w)).join(' ') || '-'} ; en moins ici : ${sien.wrong.filter(w => !mien.wrong.includes(w)).join(' ') || '-'})`);
  }
  console.log(`TEMOIN A recalculé = résultat écrit par le banc : ${accord}/${pieces.length} pièces identiques${ecartsA.length ? ' — écarts : ' + ecartsA.join(' ; ') : ''}`);
}
console.log(`ECRIT ${fichier}`);
