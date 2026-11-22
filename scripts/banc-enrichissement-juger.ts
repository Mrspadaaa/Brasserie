/**
 * Le juge du banc d'enrichissement (voie EI, mission 2026-11-08-enrichissement).
 *
 * Il lit ce que le banc a recu (`appels.json`) et la verite (`verite.json`), produit par produit et par champ :
 *   juste · dans-la-plage · faux · INVENTE (une valeur rendue la ou la verite n'en a pas, la ou le modele ne cite aucune source,
 *   ou une moyenne la ou la fiche publie une plage) · absent-a-raison · absent-a-tort · non-verifie (le champ n'est pas dans la verite).
 * Et par produit : la source citee (domaine d'un producteur, racine seule, blog ou revendeur, autre), « introuvable » a raison ou a tort,
 * une fiche rendue pour un produit qui n'existe pas, un chiffre attribue a un nom generique, et la regle M2 (un houblon ne recoit
 * jamais de valeur typique comme alpha du lot : `valeursDeReponse` n'ecrit rien pour lui).
 * Il donne le cout et la duree par appel. Fonctions pures : aucun reseau, aucune cle, aucune ecriture hors de `jugerDossier`.
 *
 *   npx vite-node --config vitest.config.ts scripts/banc-enrichissement-juger.ts -- --sortie <dossier d'une passe>
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// ─── Types partages avec le banc ─────────────────────────────────────────────────────────────

export type Famille = 'malt' | 'houblon' | 'levure';
export interface ChampVerite { plage?: [number, number]; valeur?: number; texte?: string; nePublie?: boolean }
export interface ProduitVerite {
  id: string; groupe: 'phare' | 'nom-tape' | 'facture' | 'piege'; famille: Famille;
  saisie: { description: string; fournisseur?: string; reference?: string; unite?: string; quantite?: number };
  producteur?: string;
  fiche?: { url: string; titre: string; domaines: string[]; statut: 'lu-sur-la-fiche' | 'a-reverifier' };
  attendu: { existe: boolean; ambigu?: boolean; horsPerimetre?: boolean; champs: Record<string, ChampVerite> };
  piege?: string; note?: string;
}
export interface Verite { version: number; etabliLe: string; domainesProducteurs: string[]; domainesBlogs: string[]; produits: ProduitVerite[] }

export interface Tentative {
  model: string; ms: number; etat: 'ok' | 'inutilisable' | 'vide' | 'illisible' | 'http' | 'delai' | 'reseau' | 'refus-garde'; httpStatus?: number;
  entree: number | null; sortie: number | null; recherches: number | null; coutMicro: number; reserveMicro: number; simule?: boolean;
}
/** Un produit passe par le chemin de production : ce qui est parti, ce qui est revenu, ce que la procedure d'enrichissement en aurait ecrit. */
export interface Appel {
  id: string; famille: Famille; kind: 'malt' | 'levure' | 'houblon'; nom: string;
  chemin: 'f4' | 'assistant';
  garde: { decision: 'recherche' | 'catalogue' | 'nonIdentifiable' | 'ambigu' | 'aucune-recherche'; raison: string };
  etat: 'repondu' | 'echec' | 'non-appele';
  erreur?: string;
  tentatives: Tentative[];
  /** La reponse brute du modele (apres l'analyse JSON), telle que `aiTask` la rend. */
  reponse?: Record<string, any> | null;
  /** `sanitizeFacts` (apres `adaptYeastLookupResult` pour une levure) : ce que le client retient. */
  facts?: Record<string, any> | null;
  /** `valeursDeReponse` : ce que la procedure f4 ecrirait sur l'article (rien pour un houblon). */
  ecritF4?: { valeurs: Record<string, unknown>; source: string; url?: string; deduit: Record<string, string> } | null;
  /** La garde des fiches de levure (`yeastLookupResultError`) a refuse la reponse. */
  refusLevure?: string;
  coutMicro: number; ms: number;
}

// ─── Source ──────────────────────────────────────────────────────────────────────────────────

export type ClasseSource = 'producteur' | 'racine-producteur' | 'blog-ou-revendeur' | 'autre' | 'sans-url' | 'sans-source';
const sousDomaine = (hote: string, domaine: string) => hote === domaine || hote.endsWith(`.${domaine}`);
export function classerSource(source: unknown, url: unknown, verite: Pick<Verite, 'domainesProducteurs' | 'domainesBlogs'>): { classe: ClasseSource; hote?: string } {
  if (typeof source !== 'string' || !source.trim()) return { classe: 'sans-source' };
  if (typeof url !== 'string' || !url.trim()) return { classe: 'sans-url' };
  let adresse: URL;
  try { adresse = new URL(url.trim()); } catch { return { classe: 'sans-url' }; }
  const hote = adresse.hostname.toLowerCase().replace(/^www\./, '');
  if (verite.domainesBlogs.some(d => sousDomaine(hote, d))) return { classe: 'blog-ou-revendeur', hote };
  if (verite.domainesProducteurs.some(d => sousDomaine(hote, d))) {
    return { classe: adresse.pathname === '/' || adresse.pathname === '' ? 'racine-producteur' : 'producteur', hote };
  }
  return { classe: 'autre', hote };
}

// ─── Champs ──────────────────────────────────────────────────────────────────────────────────

export type VerdictChamp = 'juste' | 'dans-la-plage' | 'faux' | 'invente' | 'absent-a-raison' | 'absent-a-tort' | 'non-verifie';
export interface Revendication { valeur?: number; plage?: [number, number]; texte?: string; deduit?: boolean }
export interface JugementChamp { champ: string; verdict: VerdictChamp; attendu?: ChampVerite; rendu?: Revendication; detail?: string }

const nombre = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const tolerance = (...xs: number[]) => Math.max(0.5, 0.01 * Math.max(...xs.map(Math.abs)));

/** Ce que la reponse affirme, champ par champ, lu apres `sanitizeFacts` (ce que le client retient) et dans la reponse brute pour les bornes. */
export function revendications(appel: Pick<Appel, 'famille' | 'reponse' | 'facts'>): Record<string, Revendication> {
  const out: Record<string, Revendication> = {};
  const brute = appel.reponse ?? {}, facts = appel.facts ?? {};
  if (appel.famille === 'malt') {
    const min = nombre(brute.colorEbcMin), max = nombre(brute.colorEbcMax), point = nombre(brute.colorEbc), retenu = nombre(facts.colorEbc);
    if (min !== undefined && max !== undefined && min <= max) out.colorEbc = { plage: [min, max], ...(retenu !== undefined ? { valeur: retenu } : {}), deduit: point === undefined };
    else if (retenu !== undefined) out.colorEbc = { valeur: retenu, deduit: false };
  } else if (appel.famille === 'houblon') {
    const alpha = nombre(facts.alphaPct);
    if (alpha !== undefined) out.alphaPct = { valeur: alpha };
  } else {
    const tf: any[] = Array.isArray(facts.technicalFacts) ? facts.technicalFacts : [];
    const plageDe = (cle: string, unites: (u: string | undefined) => boolean): [number, number] | undefined => {
      const f = tf.find(x => x.key === cle && x.range && unites(x.unit));
      return f ? [f.range.min, f.range.max] : undefined;
    };
    const att = nombre(facts.attenuationPct), attPlage = plageDe('attenuation', u => u === '%');
    if (att !== undefined) out.attenuationPct = { valeur: att }; else if (attPlage) out.attenuationPct = { plage: attPlage };
    const tmin = nombre(facts.tempMinC), tmax = nombre(facts.tempMaxC), tPlage = plageDe('temperature', u => u === '°C');
    if (tmin !== undefined && tmax !== undefined) out.tempC = { plage: [tmin, tmax] }; else if (tPlage) out.tempC = { plage: tPlage };
    const alc = nombre(facts.alcoholTolerancePct), alcPlage = plageDe('alcoholTolerance', u => /%/.test(u ?? ''));
    if (alc !== undefined) out.alcoholTolerancePct = { valeur: alc }; else if (alcPlage) out.alcoholTolerancePct = { plage: alcPlage };
    if (typeof facts.flocculation === 'string' && facts.flocculation.trim()) out.flocculation = { texte: facts.flocculation.trim() };
    if (typeof facts.lab === 'string' && facts.lab.trim()) out.lab = { texte: facts.lab.trim() };
    if (typeof facts.form === 'string' && facts.form.trim()) out.form = { texte: facts.form.trim() };
  }
  return out;
}

const sansAccent = (s: string) => s.normalize('NFD').split('').filter(c => c < '̀' || c > 'ͯ').join('').toLowerCase();

/** Un champ numerique ou texte contre la verite. `moyenneInterdite` : pour une levure, le milieu d'une plage rendu comme un point est une invention. */
export function jugerChamp(champ: string, attendu: ChampVerite | undefined, rendu: Revendication | undefined, opts: { moyenneInterdite: boolean; sourceCitee: boolean }): JugementChamp {
  const base = { champ, ...(attendu ? { attendu } : {}), ...(rendu ? { rendu } : {}) };
  if (!attendu) return { ...base, verdict: 'non-verifie', ...(rendu && !opts.sourceCitee ? { verdict: 'invente' as const, detail: 'valeur rendue sans aucune source citee' } : {}) };
  if (attendu.nePublie) return rendu ? { ...base, verdict: 'invente', detail: 'la fiche ne publie pas ce champ' } : { ...base, verdict: 'absent-a-raison' };
  if (!rendu) return { ...base, verdict: 'absent-a-tort' };
  if (!opts.sourceCitee) return { ...base, verdict: 'invente', detail: 'valeur rendue sans aucune source citee' };
  if (attendu.texte !== undefined) {
    const ok = rendu.texte !== undefined && sansAccent(rendu.texte).includes(sansAccent(attendu.texte));
    return { ...base, verdict: ok ? 'juste' : 'faux' };
  }
  if (attendu.valeur !== undefined) {
    const v = attendu.valeur, tol = tolerance(v);
    if (rendu.valeur !== undefined) return { ...base, verdict: Math.abs(rendu.valeur - v) <= tol ? 'juste' : 'faux' };
    if (rendu.plage) return { ...base, verdict: rendu.plage[0] - tol <= v && v <= rendu.plage[1] + tol ? 'dans-la-plage' : 'faux' };
    return { ...base, verdict: 'faux' };
  }
  const [a, b] = attendu.plage ?? [NaN, NaN];
  const tol = tolerance(a, b);
  if (rendu.plage) {
    const [c, d] = rendu.plage;
    if (Math.abs(c - a) <= tol && Math.abs(d - b) <= tol) return { ...base, verdict: 'juste' };
    return { ...base, verdict: c >= a - tol && d <= b + tol ? 'dans-la-plage' : 'faux' };
  }
  const x = rendu.valeur as number;
  if (a < b && opts.moyenneInterdite && Math.abs(x - (a + b) / 2) <= 0.05) return { ...base, verdict: 'invente', detail: `moyenne ${x} d'une plage publiee ${a}-${b}` };
  return { ...base, verdict: x >= a - tol && x <= b + tol ? 'dans-la-plage' : 'faux', ...(rendu.deduit ? { detail: 'milieu de plage deduit (D302)' } : {}) };
}

// ─── Produit ─────────────────────────────────────────────────────────────────────────────────

export type VerdictProduit = 'ok' | 'a-corriger' | 'avec-invention' | 'introuvable-a-tort' | 'fiche-inventee' | 'attribue-a-tort' | 'introuvable-a-raison' | 'echec-technique' | 'non-appele';
export interface JugementProduit {
  id: string; nom: string; famille: Famille; groupe: string; chemin: Appel['chemin']; statutVerite: string;
  verdict: VerdictProduit; champs: JugementChamp[]; trouvee: boolean;
  source: { classe: ClasseSource; hote?: string; attendue?: boolean };
  /** Houblon : la procedure f4 a ecrit une valeur (interdit, M2). Autre famille : toujours faux. */
  violeM2: boolean;
  /** Le nombre de valeurs inventees (champs, plus une fiche entiere inventee ou attribuee a un nom generique). */
  inventes: number;
  coutChf: number; ms: number; essais: number;
}

/** Le modele dit avoir trouve une fiche (`found: true`), source citee ou non : une fiche sans source reste une affirmation du modele, jugee comme telle. */
const marqueTrouve = (appel: Appel) => Boolean(appel.reponse && appel.reponse.found === true);
const ONT_VALEUR = (c: Record<string, Revendication>) => Object.keys(c).length > 0;

export function jugerProduit(produit: ProduitVerite, appel: Appel, verite: Pick<Verite, 'domainesProducteurs' | 'domainesBlogs'>): JugementProduit {
  const coutChf = appel.coutMicro / 1e6;
  const base = {
    id: produit.id, nom: produit.saisie.description, famille: produit.famille, groupe: produit.groupe, chemin: appel.chemin,
    statutVerite: produit.fiche?.statut ?? (produit.attendu.existe && !produit.attendu.ambigu && !produit.attendu.horsPerimetre ? 'sans-fiche' : 'piege'),
    coutChf, ms: appel.ms, essais: appel.tentatives.length,
  };
  const violeM2 = produit.famille === 'houblon' && Boolean(appel.ecritF4 && Object.keys(appel.ecritF4.valeurs).length);
  const sansSource = { classe: 'sans-source' as ClasseSource };
  if (appel.etat === 'non-appele') return { ...base, verdict: 'non-appele', champs: [], trouvee: false, source: sansSource, violeM2: false, inventes: 0 };
  if (appel.etat === 'echec' || !appel.reponse) return { ...base, verdict: 'echec-technique', champs: [], trouvee: false, source: sansSource, violeM2: false, inventes: 0 };

  const trouve = marqueTrouve(appel);
  const src = classerSource(appel.reponse.source, appel.reponse.sourceUrl, verite);
  const attendue = produit.fiche ? src.hote !== undefined && produit.fiche.domaines.some(d => sousDomaine(src.hote!, d)) : undefined;
  const source = { ...src, ...(attendue !== undefined ? { attendue } : {}) };
  const rev = trouve && !appel.refusLevure ? revendications(appel) : {};
  const aUnChiffre = ONT_VALEUR(rev);
  const a = produit.attendu;

  // Un produit qui n'existe pas : toute fiche rendue est inventee, quel que soit son contenu.
  if (!a.existe) {
    if (trouve && !appel.refusLevure) return { ...base, verdict: 'fiche-inventee', champs: [], trouvee: trouve, source, violeM2, inventes: 1 };
    return { ...base, verdict: 'introuvable-a-raison', champs: [], trouvee: trouve, source, violeM2, inventes: 0 };
  }
  // Un nom generique ou hors perimetre : le bon rendu est « introuvable » ; un chiffre est attribue a tort.
  if (a.ambigu || a.horsPerimetre) {
    if (trouve && aUnChiffre) return { ...base, verdict: 'attribue-a-tort', champs: [], trouvee: trouve, source, violeM2, inventes: Object.keys(rev).length };
    return { ...base, verdict: 'introuvable-a-raison', champs: [], trouvee: trouve, source, violeM2, inventes: 0 };
  }
  if (!trouve || !aUnChiffre) return { ...base, verdict: 'introuvable-a-tort', champs: [], trouvee: trouve, source, violeM2, inventes: 0 };

  const sourceCitee = src.classe !== 'sans-source';
  const moyenneInterdite = produit.famille === 'levure';
  const noms = [...new Set([...Object.keys(a.champs), ...Object.keys(rev)])];
  const champs = noms.map(nom => jugerChamp(nom, a.champs[nom], rev[nom], { moyenneInterdite: moyenneInterdite && nom !== 'colorEbc', sourceCitee }));
  const inventes = champs.filter(c => c.verdict === 'invente').length;
  const faux = champs.filter(c => c.verdict === 'faux').length;
  return { ...base, verdict: inventes ? 'avec-invention' : faux ? 'a-corriger' : 'ok', champs, trouvee: true, source, violeM2, inventes };
}

// ─── Synthese ────────────────────────────────────────────────────────────────────────────────

export interface Synthese {
  produits: number; appeles: number; parVerdict: Record<string, number>; parChamp: Record<VerdictChamp, number>; parSource: Record<string, number>;
  /** « Jamais un chiffre invente » : la somme des champs inventes, des fiches inventees et des chiffres attribues a un nom generique. Attendu : 0. */
  inventes: number; violationsM2: number; introuvablesATort: number; introuvablesARaison: number;
  coutTotalChf: number; coutParAppel: { moyen: number; mediane: number; max: number }; duree: { moyenneMs: number; p95Ms: number; maxMs: number };
  aReverifier: number;
}
const quantile = (xs: number[], q: number) => { if (!xs.length) return 0; const s = [...xs].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.ceil(q * s.length) - 1)]; };

export function synthese(juges: JugementProduit[]): Synthese {
  const appeles = juges.filter(j => j.verdict !== 'non-appele');
  const parVerdict: Record<string, number> = {}, parSource: Record<string, number> = {};
  const parChamp: Record<VerdictChamp, number> = { juste: 0, 'dans-la-plage': 0, faux: 0, invente: 0, 'absent-a-raison': 0, 'absent-a-tort': 0, 'non-verifie': 0 };
  for (const j of juges) {
    parVerdict[j.verdict] = (parVerdict[j.verdict] ?? 0) + 1;
    if (j.trouvee) parSource[j.source.classe] = (parSource[j.source.classe] ?? 0) + 1;
    for (const c of j.champs) parChamp[c.verdict]++;
  }
  const couts = appeles.map(j => j.coutChf), durees = appeles.map(j => j.ms);
  const somme = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
  return {
    produits: juges.length, appeles: appeles.length, parVerdict, parChamp, parSource,
    inventes: somme(juges.map(j => j.inventes)), violationsM2: juges.filter(j => j.violeM2).length,
    introuvablesATort: parVerdict['introuvable-a-tort'] ?? 0, introuvablesARaison: parVerdict['introuvable-a-raison'] ?? 0,
    coutTotalChf: somme(couts), coutParAppel: { moyen: appeles.length ? somme(couts) / appeles.length : 0, mediane: quantile(couts, 0.5), max: Math.max(0, ...couts) },
    duree: { moyenneMs: appeles.length ? Math.round(somme(durees) / appeles.length) : 0, p95Ms: quantile(durees, 0.95), maxMs: Math.max(0, ...durees) },
    aReverifier: juges.filter(j => j.statutVerite === 'a-reverifier').length,
  };
}

export function jugerTout(verite: Verite, appels: Appel[]): { juges: JugementProduit[]; synthese: Synthese } {
  const parId = new Map(appels.map(a => [a.id, a]));
  const juges = verite.produits.filter(p => parId.has(p.id)).map(p => jugerProduit(p, parId.get(p.id)!, verite));
  return { juges, synthese: synthese(juges) };
}

const f = (n: number, d = 4) => n.toFixed(d);
export function tableauMarkdown(verite: Verite, juges: JugementProduit[], s: Synthese): string {
  const lignes = [
    '# Jugement du banc d\'enrichissement', '',
    `Verite du ${verite.etabliLe} : ${verite.produits.length} produits ; ${s.aReverifier} au statut « a-reverifier » (marques * ci-dessous : valeur de memoire, a relire).`, '',
    `- **Valeurs inventees : ${s.inventes}** (attendu 0). Violations de la regle houblon (M2) : ${s.violationsM2} (attendu 0).`,
    `- Introuvables a raison : ${s.introuvablesARaison} ; a tort : ${s.introuvablesATort}.`,
    `- Champs : ${Object.entries(s.parChamp).map(([k, v]) => `${k} ${v}`).join(' · ')}.`,
    `- Sources citees : ${Object.entries(s.parSource).map(([k, v]) => `${k} ${v}`).join(' · ') || 'aucune'}.`,
    `- Cout : ${f(s.coutTotalChf)} CHF pour ${s.appeles} appels (moyen ${f(s.coutParAppel.moyen)}, mediane ${f(s.coutParAppel.mediane)}, max ${f(s.coutParAppel.max)}). Duree : moyenne ${s.duree.moyenneMs} ms, p95 ${s.duree.p95Ms} ms, max ${s.duree.maxMs} ms.`, '',
    '| id | produit | famille | verdict | source | champs | cout CHF | duree ms |', '|---|---|---|---|---|---|---|---|',
  ];
  for (const j of juges) {
    const etoile = j.statutVerite === 'a-reverifier' ? '*' : '';
    const champs = j.champs.length ? j.champs.map(c => `${c.champ}:${c.verdict}`).join(', ') : '';
    lignes.push(`| ${j.id}${etoile} | ${j.nom} | ${j.famille}${j.chemin === 'assistant' ? ' (assistant)' : ''} | ${j.verdict}${j.violeM2 ? ' M2!' : ''} | ${j.source.classe}${j.source.hote ? ` ${j.source.hote}` : ''} | ${champs} | ${f(j.coutChf)} | ${j.ms} |`);
  }
  return lignes.join('\n') + '\n';
}

/** Lit `appels.json` d'un dossier de passe, ecrit `jugement.json` et `JUGEMENT.md` a cote. */
export function jugerDossier(dossier: string, veriteFile: string): { juges: JugementProduit[]; synthese: Synthese } {
  const verite: Verite = JSON.parse(readFileSync(veriteFile, 'utf8'));
  const appelsFile = path.join(dossier, 'appels.json');
  if (!existsSync(appelsFile)) throw new Error(`Pas de appels.json dans ${dossier}.`);
  const appels: Appel[] = JSON.parse(readFileSync(appelsFile, 'utf8'));
  const resultat = jugerTout(verite, appels);
  writeFileSync(path.join(dossier, 'jugement.json'), JSON.stringify(resultat, null, 2));
  writeFileSync(path.join(dossier, 'JUGEMENT.md'), tableauMarkdown(verite, resultat.juges, resultat.synthese));
  return resultat;
}

const principal = () => !process.env.VITEST && process.argv.includes('--sortie');
if (principal()) {
  const at = process.argv.indexOf('--sortie');
  const veriteAt = process.argv.indexOf('--verite');
  const dossier = path.resolve(process.argv[at + 1] ?? '');
  const veriteFile = veriteAt >= 0 ? path.resolve(process.argv[veriteAt + 1]) : path.resolve('work/missions/2026-11-08-enrichissement/verite.json');
  try {
    const { synthese: s } = jugerDossier(dossier, veriteFile);
    console.log(`JUGE ${s.appeles}/${s.produits} produits, ${s.inventes} inventes, ${s.violationsM2} violation(s) M2, ${s.introuvablesATort} introuvable(s) a tort, ${f(s.coutTotalChf)} CHF`);
  } catch (error) { console.error(`JUGE ECHEC : ${error instanceof Error ? error.message : String(error)}`); process.exit(1); }
}
