// Essai d'IA en re-classement des substituts (#181, voie ia1-reclassement). HORS `npm test`, lancé à la main.
//
// Le moteur garde la liste : un modèle Gemini reçoit les 20 premiers candidats de `substitutes()` (ou de l'option 1 de e1, avec
// `--pool=opt1`), avec leurs fiches, et rend l'ordre des 10 premiers avec une phrase par choix. On compare, sur les mêmes cas,
// le moteur seul, l'option 1 hors ligne de e1 (mots hors famille, λ = 0,25) et l'IA, contre les substituts de Beer Maverick.
//
//   npx vite-node scripts/eval-hop/ia-reclassement.ts -- --figer            écrit les requêtes figées (requetes/requetes-<pool>.json)
//   npx vite-node scripts/eval-hop/ia-reclassement.ts -- --simule[=fautes]  passe à vide : fournisseur simulé, journal temporaire
//   npx vite-node scripts/eval-hop/ia-reclassement.ts -- --reel --confirm-paid-ai [--cas=phares|echantillon|tous] [--max=N]
//   npx vite-node scripts/eval-hop/ia-reclassement.ts -- --rapport --date=AAAA-MM-JJ   métriques et rapport à partir des réponses gardées
//
// Options : --pool=moteur|opt1  --modele=3.8|lite  --date=AAAA-MM-JJ  --refaire (rappelle un cas déjà répondu : coûte un appel).
// Garde-fous (réemployés tels quels, scripts/gemini38LiveCore.ts) : hôte et modèle de la liste blanche, journal réservé avant
// l'envoi, ligne de journal pour chaque appel parti, opt-in payant explicite. L'enveloppe de cette voie (100 appels, 5 CHF
// estimés) a son propre compteur dans la section « ia1 » de gemini-journal.md. La clé n'est lue que dans GEMINI_API_KEY ou la
// ligne GEMINI_API_KEY de functions/.secret.local ; elle n'est ni affichée ni écrite. functions/.env n'est jamais lu.
// Ce fichier copie (sans les importer : banc-eval.ts écrit ses résultats à l'import) les fonctions de classement de e1.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { CATALOGUE, bmLienId, type CatalogueHop } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { FAMILIES } from '../../src/domain/hopIndex/v4/families';
import type { MomentId } from '../../src/domain/hopIndex/v4/recipe';
import type { SubstitutionWeights } from '../../src/domain/hopIndex/v4';
import { arrondi, echantillon, mediane, moyenne, mulberry32, resume, type Obs, type Resume } from './metriques';
import { requirePaidAiTestOptIn } from '../paid-ai-test-guard.mjs';
import { guardLiveFetch, liveEndpoint, liveJournalRow, withJournalLock, type LiveCall } from '../gemini38LiveCore';
import { GEMINI_LITE_MODEL, GEMINI_MODEL, GEMINI_MODELS } from '../../functions/src/models';

// ---------- Arguments ----------
const args = process.argv.slice(2);
const flag = (n: string) => args.includes(n);
const val = (n: string) => args.find((a) => a === n || a.startsWith(n + '='))?.split('=').slice(1).join('=');
const stop = (message: string): never => { console.error(`✗ ${message}`); process.exit(2); };

const VOIE = resolve('work/missions/2026-10-25-integration-houblons/voies/ia1-reclassement');
const JOURNAL_REEL = resolve('work/finalisation-tickets-2026-10-08/gemini-journal.md');
const LOCK_REEL = resolve('work/finalisation-tickets-2026-10-08/locks/gemini-journal');
/** Suite de l'essai : ia1 (100 appels, 5 CHF, 3.8 ou lite) ou ia2 (70 appels, 1 CHF, Flash-Lite seul). */
const SUITE = (val('--section') ?? 'ia1') as 'ia1' | 'ia2';
if (SUITE !== 'ia1' && SUITE !== 'ia2') stop(`--section inconnue : ${SUITE}`);
const ENVELOPPE = SUITE === 'ia2' ? { appels: 70, microChf: 1_000_000 } : { appels: 100, microChf: 5_000_000 };
const POOL = (val('--pool') ?? 'moteur') as 'moteur' | 'opt1';
if (POOL !== 'moteur' && POOL !== 'opt1') stop(`--pool inconnu : ${POOL}`);
const MODELE_ARG = val('--modele') ?? '3.8';
const MODELE = MODELE_ARG === 'lite' ? GEMINI_LITE_MODEL : MODELE_ARG === '3.8' ? GEMINI_MODEL : stop(`--modele inconnu : ${MODELE_ARG} (3.8 ou lite)`);
if (SUITE === 'ia2' && MODELE !== GEMINI_LITE_MODEL) stop('La suite ia2 est limitée à Flash-Lite (--modele=lite).');
const DATE = val('--date') ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date());
const GRAINE = 181, N_ECHANTILLON = 60, N_BANC = 30, TAILLE_POOL = 20, TAILLE_REPONSE = 10;
const PROMPT_VERSION = 'v1';

// ---------- Données et moteur (copie de la logique de e1-banc-eval) ----------
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const parId = new Map(CATALOGUE.map((h) => [h.id, h]));
const nom = (id: string) => parId.get(id)?.name ?? id;
const COLL = new Intl.Collator('fr');
interface Cible { id: string; attendus: string[] }
const cibles: Cible[] = CATALOGUE.filter((h) => h.bm?.substituts && h.bm.substituts.length > 0).map((h) => ({
  id: h.id,
  attendus: [...new Set(h.bm!.substituts!.map((l) => bmLienId(l)).filter((x): x is string => !!x && x !== h.id && parId.has(x)))],
})).filter((c) => c.attendus.length > 0).sort((a, b) => (a.id < b.id ? -1 : 1));
const cibleDe = new Map(cibles.map((c) => [c.id, c]));

interface Fiche { nbFamilles: number; motsSet: string[] }
const fiches = new Map<string, Fiche>();
for (const h of CATALOGUE) {
  const d = m.describeFamilies(h.id), w = m.familyWords(h.id);
  const mots = new Set<string>();
  for (const f of FAMILIES) for (const row of w.mots[f]) for (const x of row.mots) mots.add(x.toLowerCase().replace(/[_-]+/g, ' '));
  for (const x of w.sansFamille) mots.add(x.mot.toLowerCase().replace(/[_-]+/g, ' '));
  fiches.set(h.id, { nbFamilles: FAMILIES.filter((f) => d[f].level !== 'non décrit').length, motsSet: [...mots].sort() });
}
const N_HOUBLONS = CATALOGUE.length;
const df = new Map<string, number>();
for (const h of CATALOGUE) for (const w of fiches.get(h.id)!.motsSet) df.set(w, (df.get(w) ?? 0) + 1);
const idf = (w: string) => Math.log((N_HOUBLONS + 1) / ((df.get(w) ?? 0) + 1));
const poidsMots = new Map<string, Map<string, number>>(CATALOGUE.map((h) => [h.id, new Map(fiches.get(h.id)!.motsSet.map((w) => [w, idf(w)]))]));
const cosMots = (a: string, b: string): number | null => {
  const A = poidsMots.get(a)!, B = poidsMots.get(b)!;
  if (!A.size || !B.size) return null;
  let dot = 0, na = 0, nb = 0;
  for (const [w, x] of A) { na += x * x; const y = B.get(w); if (y !== undefined) dot += x * y; }
  for (const y of B.values()) nb += y * y;
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
};

interface Ligne { k: string; name: string; a: number | null; o: number | null; b: number | null; faible: boolean; demotion: boolean }
const W_AROME: SubstitutionWeights = { arome: 0.6, huiles: 0.3, amertume: 0.1 };
const scoreHL = (l: Ligne, w: SubstitutionWeights, a: number | null): number => {
  let tw = 0, num = 0;
  if (a !== null) { tw += w.arome; num += w.arome * a; }
  if (l.o !== null) { tw += w.huiles; num += w.huiles * l.o; }
  if (l.b !== null) { tw += w.amertume; num += w.amertume * l.b; }
  return tw > 0 ? Math.round(num / tw) : 0;
};
const avant = (x: Ligne, sx: number, y: Ligne, sy: number) => (x.faible !== y.faible ? !x.faible : x.demotion !== y.demotion ? !x.demotion : sx !== sy ? sx > sy : COLL.compare(x.name, y.name) < 0);
const LAMBDA_OPT1 = 0.25;
const mixMots = (cid: string, l: Ligne): number | null => { const x = cosMots(cid, l.k); return l.a === null || x === null ? l.a : Math.round(LAMBDA_OPT1 * l.a + (1 - LAMBDA_OPT1) * 100 * x); };

const cacheMoteur = new Map<string, Ligne[]>();
/** Le classement du moteur, tel que l'app l'affiche : toutes les lignes, dans l'ordre. */
function lignesMoteur(id: string, mo: MomentId): Ligne[] {
  const cle = id + '|' + mo;
  let l = cacheMoteur.get(cle);
  if (!l) {
    l = m.substitutes(id, { moment: mo }).remplacants.map((s) => ({ k: s.key, name: s.name, a: s.composantes.arome, o: s.composantes.huiles, b: s.composantes.amertume, faible: s.couverture.fiabilite === 'faible', demotion: !!s.amertumeDeconseillee }));
    cacheMoteur.set(cle, l);
  }
  return l;
}
const ordreMoteur = (id: string, mo: MomentId) => lignesMoteur(id, mo).map((l) => l.k);
/** Option 1 de e1 : l'arôme mêle les 12 familles (λ = 0,25) et les mots de toutes les fiches ; aux moments d'arôme seulement (dry hop). */
function ordreOpt1(id: string, mo: MomentId): string[] {
  if (mo !== 'dryActive') return ordreMoteur(id, mo);
  const lignes = lignesMoteur(id, mo), sc = lignes.map((l) => scoreHL(l, W_AROME, mixMots(id, l)));
  return lignes.map((_, i) => i).sort((i, j) => (i === j ? 0 : avant(lignes[i], sc[i], lignes[j], sc[j]) ? -1 : 1)).map((i) => lignes[i].k);
}
const ordrePool = (id: string, mo: MomentId) => (POOL === 'opt1' ? ordreOpt1(id, mo) : ordreMoteur(id, mo));
const rangsDans = (ordre: string[], attendus: string[]): (number | null)[] => attendus.map((a) => { const i = ordre.indexOf(a); return i < 0 ? null : i + 1; });

// ---------- Les cas du banc ----------
const PHARES: [string, string][] = [['Nelson Sauvin', 'nelson-sauvin'], ['Citra', 'citra'], ['Motueka', 'motueka'], ['Mosaic', 'mosaic'], ['Galaxy', 'galaxy'], ['Simcoe', 'simcoe'], ['Saaz', 'saaz-cz'], ['Cascade', 'cascade'], ['Idaho 7', 'idaho-7']];
const phareIds = PHARES.map(([, s]) => `beermaverick-${s}`);
const eligibles = cibles.filter((c) => fiches.get(c.id)!.nbFamilles > 0).map((c) => c.id);   // « direction » de e1 : au moins une famille décrite
const sousEchantillon = echantillon(eligibles, GRAINE, N_ECHANTILLON).slice(0, N_BANC);
const MOMENTS: [MomentId, string][] = [['dryActive', 'dry hop'], ['b60', '60′']];
const court = (id: string) => id.replace(/^beermaverick-/, '');
const idCas = (h: string, mo: MomentId) => `${court(h)}@${mo === 'dryActive' ? 'dry' : '60'}`;
type Groupe = 'phare' | 'echantillon';
function listeCas(): { hop: string; moment: MomentId; groupes: Groupe[] }[] {
  const hops = [...new Set([...phareIds, ...sousEchantillon])];   // les phares d'abord : ils passent en premier
  return hops.flatMap((hop) => MOMENTS.map(([moment]) => ({ hop, moment, groupes: [...(phareIds.includes(hop) ? ['phare' as const] : []), ...(sousEchantillon.includes(hop) ? ['echantillon' as const] : [])] })));
}

// ---------- L'invite ----------
const SYSTEME = [
  'Tu es un brasseur artisanal expert des houblons. Un brasseur veut remplacer un houblon par un autre, à un moment précis de son brassin.',
  `Tu reçois la fiche du houblon à remplacer et ${TAILLE_POOL} candidats présélectionnés par un moteur de calcul, listés dans l'ordre du moteur (c01 = le plus proche selon lui). Choisis les ${TAILLE_REPONSE} meilleurs remplaçants parmi ces ${TAILLE_POOL} candidats seulement, du meilleur au dixième, avec une phrase par choix.`,
  'Juge comme un brasseur, dans cet ordre :',
  '1. Les arômes perçus (les mots des fiches), y compris ceux qu\'aucune famille classique ne range (vin blanc, groseille à maquereau, sauvignon blanc, mojito, noix de coco…). Un houblon qui sent autre chose n\'est pas un substitut, même avec le même α.',
  '2. Le rôle au moment donné. À 60 minutes d\'ébullition, seule l\'amertume compte vraiment : α, cohumulone, finesse de l\'amertume ; l\'arôme est perdu à la chaleur. En dry hop, l\'arôme et les huiles priment ; l\'α est secondaire.',
  '3. Les huiles (myrcène, humulène, caryophyllène, farnésène, linalol) et la classe thiol, qui disent le caractère quand les mots sont rares.',
  '4. L\'usage déclaré (aroma, dual, bittering) : un amérisant neutre ne remplace pas un houblon d\'arôme au dry hop.',
  'Règles : l\'ordre du moteur est une indication, pas une vérité : il se trompe quand une fiche est creuse ou que les mots sont hors des familles ; corrige-le quand ton jugement de brasseur le demande, sans le suivre ni le contredire par principe. « inconnu » veut dire que la donnée manque, pas qu\'elle vaut zéro : ne pénalise pas et ne favorise pas sur cette base. Ne choisis qu\'un identifiant (c01 à c20) donné dans la liste, une seule fois. Chaque phrase tient en 25 mots au plus, en français, et dit ce qui rapproche et ce qui sépare du houblon d\'origine.',
].join('\n');
const SCHEMA = {
  type: 'OBJECT',
  properties: { classement: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, phrase: { type: 'STRING' } }, required: ['id', 'phrase'], propertyOrdering: ['id', 'phrase'] } } },
  required: ['classement'],
};
const GENERATION = { temperature: 0, maxOutputTokens: 4000, thinkingLevel: 'low' };

const plage = (r: [number, number] | null | undefined, unite = '') => (r ? `${r[0] === r[1] ? r[0] : `${r[0]}–${r[1]}`}${unite}` : 'inconnu');
const virgule = (s: string) => s.replace(/(\d)\.(\d)/g, '$1,$2');
function ficheTexte(h: CatalogueHop, etiquette: string): string {
  const o = h.oils;
  const parts = [
    `${etiquette} · ${h.name} (${h.origin ?? 'origine inconnue'})`,
    `usage ${h.purpose ?? 'inconnu'}`,
    `α ${plage(h.alpha, ' %')}`, `β ${plage(h.beta, ' %')}`, `cohumulone ${plage(h.cohumulone, ' % des α')}`,
    `huile totale ${plage(h.oil, ' mL/100 g')}`,
    `myrcène ${plage(o.myrcene, ' %')}`, `humulène ${plage(o.humulene, ' %')}`, `caryophyllène ${plage(o.caryophyllene, ' %')}`, `farnésène ${plage(o.farnesene, ' %')}`,
    `linalol (Hopsteiner) ${plage(h.hsLinalool?.range, ' % de l\'huile')}`,
    `thiol (Hopsteiner) ${h.hsThiol?.class ? 'classe ' + h.hsThiol.class : 'inconnu'}`,
    `mots : ${h.tagsFr.length ? h.tagsFr.join(', ') : 'aucun'}`,
  ];
  return virgule(parts.join(' · ') + ' (huiles en % de l\'huile totale)');
}
interface CasFige { id: string; hop: string; hopNom: string; moment: MomentId; groupes: Groupe[]; candidats: { c: string; key: string; nom: string }[]; attendus: string[]; user: string }
function construireCas(): CasFige[] {
  return listeCas().map(({ hop, moment, groupes }) => {
    const ordre = ordrePool(hop, moment).slice(0, TAILLE_POOL);
    const candidats = ordre.map((key, i) => ({ c: `c${String(i + 1).padStart(2, '0')}`, key, nom: nom(key) }));
    const libelle = moment === 'dryActive' ? 'dry hop, en fermentation active (l\'arôme prime)' : 'ébullition de 60 minutes (l\'amertume prime)';
    const user = [`Moment du houblon à remplacer : ${libelle}.`, '', "Houblon à remplacer (huiles en % de l'huile totale ; « inconnu » : donnée absente) :", ficheTexte(parId.get(hop)!, 'à remplacer'), '',
      `Candidats (ordre du moteur) :`, ...candidats.map((x) => ficheTexte(parId.get(x.key)!, x.c)), '',
      `Rends le classement des ${TAILLE_REPONSE} meilleurs remplaçants (identifiants c01 à c${String(TAILLE_POOL).padStart(2, '0')}), du meilleur au dixième, avec une phrase chacun.`].join('\n');
    return { id: idCas(hop, moment), hop, hopNom: nom(hop), moment, groupes, candidats, attendus: cibleDe.get(hop)!.attendus, user };
  });
}
const sha = (x: unknown) => createHash('sha256').update(typeof x === 'string' ? x : JSON.stringify(x)).digest('hex').slice(0, 16);
const FICHIER_REQUETES = join(VOIE, 'requetes', `requetes-${POOL}.json`);
function figer() {
  const cas = construireCas();
  const contenu = { version: 1, promptVersion: PROMPT_VERSION, pool: POOL, graine: GRAINE, poolTaille: TAILLE_POOL, reponseTaille: TAILLE_REPONSE,
    note: 'Requêtes figées : rejouer une autre invite hors ligne se fait en comparant ce fichier à un nouveau. Les champs `attendus` (substituts Beer Maverick) ne partent jamais au modèle.',
    systeme: SYSTEME, schema: SCHEMA, generation: GENERATION, empreinteCas: sha(cas), cas };
  mkdirSync(join(VOIE, 'requetes'), { recursive: true });
  writeFileSync(FICHIER_REQUETES, JSON.stringify(contenu, null, 1) + '\n');
  console.log(`requêtes figées : ${cas.length} cas (${POOL}), empreinte ${contenu.empreinteCas}, ${FICHIER_REQUETES}`);
}
function lireRequetes(): { systeme: string; schema: unknown; generation: typeof GENERATION; cas: CasFige[]; empreinteCas: string } {
  if (!existsSync(FICHIER_REQUETES)) return stop(`Requêtes figées absentes (${FICHIER_REQUETES}) : lancer --figer d'abord.`);
  const r = JSON.parse(readFileSync(FICHIER_REQUETES, 'utf8'));
  if (sha(r.cas) !== r.empreinteCas) stop('Les requêtes figées ont été modifiées à la main (empreinte différente). Aucun appel.');
  return r;
}

// ---------- Lecture d'une réponse ----------
interface Analyse { valide: boolean; ordre: string[]; phrases: Record<string, string>; erreurs: string[]; avertissements?: string[] }
/** Un classement valide : 10 identifiants distincts, tous dans la liste donnée, chacun avec une phrase non vide. Au-delà de la dixième, les entrées sont ignorées (l'app garderait les 10 premières) et signalées. */
function analyser(texte: string | undefined, cas: CasFige): Analyse {
  const erreurs: string[] = [], ids = new Set(cas.candidats.map((c) => c.c));
  let json: any;
  try { json = JSON.parse(String(texte ?? '').replace(/```json/g, '').replace(/```/g, '').trim()); } catch { return { valide: false, ordre: [], phrases: {}, erreurs: ['JSON illisible'] }; }
  const toutes: any[] = Array.isArray(json?.classement) ? json.classement : [];
  const liste = toutes.slice(0, TAILLE_REPONSE), avertissements = toutes.length > TAILLE_REPONSE ? [`${toutes.length} entrées : les ${toutes.length - TAILLE_REPONSE} dernière(s) ignorée(s)`] : [];
  if (!liste.length) erreurs.push('classement absent');
  const ordre: string[] = [], phrases: Record<string, string> = {};
  for (const x of liste) {
    const id = typeof x?.id === 'string' ? x.id.trim().toLowerCase() : '';
    if (!ids.has(id)) { erreurs.push(`identifiant hors liste : ${String(x?.id).slice(0, 12)}`); continue; }
    if (ordre.includes(id)) { erreurs.push(`identifiant en double : ${id}`); continue; }
    ordre.push(id); phrases[id] = typeof x.phrase === 'string' ? x.phrase.trim() : '';
    if (!phrases[id]) erreurs.push(`phrase vide : ${id}`);
  }
  if (liste.length !== TAILLE_REPONSE) erreurs.push(`${liste.length} entrées au lieu de ${TAILLE_REPONSE}`);
  return { valide: erreurs.length === 0 && ordre.length === TAILLE_REPONSE, ordre, phrases, erreurs, ...(avertissements.length ? { avertissements } : {}) };
}
/** L'ordre complet après l'IA : ses choix valides d'abord, puis le reste du pool et le reste de la liste dans l'ordre d'origine du pool. */
function ordreIA(cas: CasFige, a: Analyse): string[] {
  const choisis = a.ordre.map((c) => cas.candidats.find((x) => x.c === c)!.key);
  const base = ordrePool(cas.hop, cas.moment);
  return [...choisis, ...base.filter((k) => !choisis.includes(k))];
}

// ---------- Le journal (section « ia1 » ou « ia2 » de gemini-journal.md) ----------
const SECTION = SUITE === 'ia2'
  ? '## Suite de l\'essai IA de re-classement des substituts (ia2, #181) — enveloppe séparée'
  : '## Essai IA de re-classement des substituts (ia1, #181) — enveloppe séparée';
const COMPTEUR = new RegExp(`\\*\\*Compteur ${SUITE} : (\\d+) \\/ ${ENVELOPPE.appels} · (\\d+(?:\\.\\d+)?) CHF \\/ ${ENVELOPPE.microChf / 1e6}\\*\\*`);
const texteCompteur = (used: number | string, micro: number) => `**Compteur ${SUITE} : ${used} / ${ENVELOPPE.appels} · ${(micro / 1e6).toFixed(4)} CHF / ${ENVELOPPE.microChf / 1e6}**`;
const EN_TETE = [SECTION, '',
  SUITE === 'ia2'
    ? `- Accord de l'utilisateur pour l'essai d'IA (suite d'ia1) relayé par le pilote le 26.10 ; enveloppe : **${ENVELOPPE.appels} appels au plus, ${ENVELOPPE.microChf / 1e6} CHF estimé**, \`gemini-3.5-flash-lite\` seul (l'invite n'en admet pas d'autre dans cette suite).`
    : `- Accord du brasseur (26.10, matin) : « Je donne mon accord pour les deux. » ; enveloppe fixée par le pilote : **${ENVELOPPE.appels} appels au plus, ${ENVELOPPE.microChf / 1e6} CHF estimés** (\`geminiCosts.ts\`).`,
  '- Modèles : `gemini-3.8-flash` (ia1 seulement) et `gemini-3.5-flash-lite` ; champ `modelVersion` vérifié à chaque réponse.',
  '- Données : fiches du catalogue (Beer Maverick, Hopsteiner), aucune donnée du brasseur. Clé jamais journalisée. Jamais dans `npm test`.',
  '- Lanceur : `scripts/eval-hop/ia-reclassement.ts` (garde-fous de `scripts/gemini38LiveCore.ts`) ; entrées et sorties : `work/missions/2026-10-25-integration-houblons/voies/ia1-reclassement/resultats/<date>/`.',
  '- Compteur propre à cette section : ne pas le confondre avec les autres. Une ligne par appel parti, réservée avant l\'envoi.', '',
  texteCompteur(0, 0), '',
  '| # | Heure | Issue | Test | Modèle observé | Tokens entrée / sortie | Coût estimé | Résultat |', '|---|---|---|---|---|---|---|---|'].join('\n');
interface Journal { chemin: string; verrou: string }
function reserver(j: Journal): number {
  return withJournalLock(j.verrou, () => {
    let t = readFileSync(j.chemin, 'utf8');
    if (!t.includes(SECTION)) t = `${t.replace(/\n*$/, '\n')}\n${EN_TETE}\n`;
    const c = COMPTEUR.exec(t);
    if (!c) throw new Error(`Compteur ${SUITE} illisible : aucun appel.`);
    const used = Number(c[1]), micro = Math.round(Number(c[2]) * 1_000_000);
    if (used + 1 > ENVELOPPE.appels) throw new Error(`Enveloppe ${SUITE} atteinte (${used} / ${ENVELOPPE.appels}) : requête refusée avant l'envoi.`);
    if (micro + Math.min(100_000, ENVELOPPE.microChf / 10) > ENVELOPPE.microChf) throw new Error(`Enveloppe de coût ${SUITE} atteinte (${(micro / 1e6).toFixed(4)} CHF) : requête refusée avant l'envoi.`);
    writeFileSync(j.chemin, t.replace(COMPTEUR, () => texteCompteur(used + 1, micro)));
    return used + 1;
  });
}
function ajouterLigne(j: Journal, call: LiveCall, test: string, resultat: string) {
  withJournalLock(j.verrou, () => {
    let t = readFileSync(j.chemin, 'utf8');
    const c = COMPTEUR.exec(t)!;
    const micro = Math.round(Number(c[2]) * 1_000_000) + (call.costMicroChf ?? 0);
    t = t.replace(COMPTEUR, () => texteCompteur(c[1], micro));
    const debut = t.indexOf(SECTION), suite = t.indexOf('\n## ', debut + SECTION.length), fin = suite < 0 ? t.length : suite;
    const bloc = t.slice(debut, fin).replace(/\n*$/, '\n') + liveJournalRow(call, `#181 (${SUITE})`, test, resultat) + '\n';
    writeFileSync(j.chemin, t.slice(0, debut) + bloc + (suite < 0 ? '' : '\n' + t.slice(suite + 1)));
  });
}
function lireCompteur(j: Journal): { used: number; microChf: number } {
  const c = COMPTEUR.exec(readFileSync(j.chemin, 'utf8'));
  return c ? { used: Number(c[1]), microChf: Math.round(Number(c[2]) * 1_000_000) } : { used: 0, microChf: 0 };
}

// ---------- Fournisseur ----------
function cleLocale(): string | undefined {
  const env = process.env.GEMINI_API_KEY?.trim();
  if (env) return env;
  const fichier = resolve('functions/.secret.local');
  if (!existsSync(fichier)) return undefined;
  const ligne = readFileSync(fichier, 'utf8').split(/\r?\n/).find((l) => /^\s*GEMINI_API_KEY\s*=/.test(l));
  return ligne?.slice(ligne.indexOf('=') + 1).trim().replace(/^(["'])(.*)\1$/, '$2') || undefined;
}
const urlDe = (input: RequestInfo | URL) => (typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
/** Fournisseur simulé : ni réseau ni coût. `identite` rend les 10 premiers dans l'ordre du moteur ; `fautes` casse certaines réponses. */
function fournisseurSimule(mode: string): typeof fetch {
  let n = 0;
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    n++;
    const modele = /\/models\/([^:/?]+):generateContent$/.exec(urlDe(input))?.[1] ?? '?';
    const body = JSON.parse(String(init?.body ?? '{}')), texte: string = body.contents?.[0]?.parts?.[0]?.text ?? '';
    const ids = [...texte.matchAll(/^(c\d{2}) · /gm)].map((x) => x[1]);
    let sortie: string;
    if (mode === 'fautes' && n % 7 === 0) sortie = '{"classement": [{"id": "c01", "phrase": "coupé';
    else if (mode === 'fautes' && n % 5 === 0) sortie = JSON.stringify({ classement: [...ids.slice(0, 9), 'c99'].map((id) => ({ id, phrase: 'Hors liste.' })) });
    else if (mode === 'fautes' && n % 3 === 0) sortie = JSON.stringify({ classement: [ids[0], ...ids.slice(0, 9)].map((id) => ({ id, phrase: 'Doublon.' })) });
    else if (mode === 'fautes' && n % 4 === 0) sortie = JSON.stringify({ classement: [...ids.slice(0, 10)].reverse().map((id) => ({ id, phrase: 'Ordre inversé.' })) });
    else sortie = JSON.stringify({ classement: ids.slice(0, TAILLE_REPONSE).map((id) => ({ id, phrase: 'Simulé : ordre du moteur.' })) });
    const entree = Math.ceil(texte.length / 3.5);
    return new Response(JSON.stringify({ modelVersion: modele, candidates: [{ finishReason: 'STOP', content: { role: 'model', parts: [{ text: sortie }] } }],
      usageMetadata: { promptTokenCount: entree, candidatesTokenCount: Math.ceil(sortie.length / 3.5), totalTokenCount: entree + Math.ceil(sortie.length / 3.5) } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
}

// ---------- Une passe (simulée ou réelle) ----------
interface Reponse { casId: string; pool: string; modele: string; modeleObserve: string | null; promptVersion: string; empreinteRequete: string; simule: boolean;
  appel: number; http: number | null; latenceMs: number; finishReason: string | null; jetonsEntree: number | null; jetonsSortie: number | null; coutMicroChf: number | null;
  texte: string | null; analyse: Analyse; erreurReseau: string | null }
const dossierReponses = (sim: string | null) => join(VOIE, 'resultats', sim ?? DATE, `reponses-${POOL}-${MODELE_ARG}`);

async function passe(sim: string | null) {
  const req = lireRequetes();
  const portee = val('--cas') ?? 'tous';
  if (!['phares', 'echantillon', 'tous'].includes(portee)) stop(`--cas inconnu : ${portee}`);
  let cas = req.cas.filter((c) => portee === 'tous' || c.groupes.includes(portee === 'phares' ? 'phare' : 'echantillon'));
  const cap = val('--max') ? Number(val('--max')) : Infinity;
  if (sim === null && (!(cap >= 1) || !Number.isFinite(cap))) stop('Mode réel : --max=N obligatoire (nombre d\'appels de ce lancement, au moins 1).');
  const sortie = dossierReponses(sim);
  mkdirSync(sortie, { recursive: true });
  if (val('--moment')) { if (!['dry', '60'].includes(val('--moment')!)) stop('--moment : dry ou 60.'); cas = cas.filter((c) => c.moment === (val('--moment') === 'dry' ? 'dryActive' : 'b60')); }
  const faits = (c: CasFige) => existsSync(join(sortie, `${c.id.replace('@', '_')}.json`));
  if (!flag('--refaire')) cas = cas.filter((c) => !faits(c));
  if (Number.isFinite(cap)) cas = cas.slice(0, cap);
  console.log(`${sim !== null ? 'SIMULÉ' : 'RÉEL'} · pool ${POOL} · ${MODELE} · ${cas.length} requêtes à envoyer (${portee}${flag('--refaire') ? ', refaire' : ''})`);

  // Journal : le vrai en réel ; en simulé, une copie temporaire du vrai journal (la section y est créée comme en réel).
  let journal: Journal;
  if (sim !== null) {
    const dossier = mkdtempSync(join(tmpdir(), 'ia1-sim-'));
    const chemin = join(dossier, 'gemini-journal.md');
    writeFileSync(chemin, existsSync(JOURNAL_REEL) ? readFileSync(JOURNAL_REEL, 'utf8') : '# Journal simulé\n');
    journal = { chemin, verrou: join(dossier, 'verrou') };
  } else journal = { chemin: JOURNAL_REEL, verrou: LOCK_REEL };

  let cle: string | undefined = 'cle-simulee-pas-un-secret';
  if (sim === null) {
    // Avant tout réseau : le modèle doit être dans la liste blanche, puis l'opt-in payant explicite.
    if (!(GEMINI_MODELS as readonly string[]).includes(MODELE)) stop(`Modèle hors de la liste blanche : ${MODELE}. Aucun appel.`);
    if (!existsSync(journal.chemin)) stop('gemini-journal.md introuvable : aucun appel.');
    const { used, microChf } = lireCompteur(journal);
    if (used >= ENVELOPPE.appels || microChf >= ENVELOPPE.microChf) stop(`Enveloppe ia1 déjà atteinte (${used} appels, ${(microChf / 1e6).toFixed(2)} CHF). Aucun appel.`);
    try { requirePaidAiTestOptIn({ label: 'Gemini réel · ia1 · re-classement des substituts', command: `npx vite-node scripts/eval-hop/ia-reclassement.ts -- --reel --confirm-paid-ai --max=N` }); } catch (e) { stop((e as Error).message); }
    cle = cleLocale();
    if (!cle) stop('Aucune clé Gemini locale (GEMINI_API_KEY ou functions/.secret.local). Aucun appel.');
  }
  const fournisseur = sim !== null ? fournisseurSimule(sim.includes('fautes') ? 'fautes' : 'identite') : fetch;
  let testCourant = '';
  const restant = sim !== null ? Infinity : ENVELOPPE.appels - lireCompteur(journal).used;
  const garde = guardLiveFetch(fournisseur, {
    cap: Math.min(cas.length, restant),
    reserve: () => reserver(journal),
    onCall: (call) => {
      const issue = call.error ? `échec réseau (${call.error})` : `HTTP ${call.status}, ${call.latencyMs} ms, demandé ${call.model}, réflexion ${call.thinkingLevel ?? 'non fournie'}, fin ${call.finishReason ?? 'non fournie'}${sim !== null ? ', simulé' : ''}`;
      ajouterLigne(journal, call, testCourant, issue);
    },
  });
  let ok = 0, invalides = 0;
  for (const c of cas) {
    testCourant = `ia-reclassement.ts · ${c.id} · pool ${POOL} · ${MODELE_ARG} · invite ${PROMPT_VERSION}`;
    const body = { systemInstruction: { parts: [{ text: req.systeme }] }, contents: [{ role: 'user', parts: [{ text: c.user }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: req.schema, temperature: req.generation.temperature, maxOutputTokens: req.generation.maxOutputTokens, thinkingConfig: { thinkingLevel: req.generation.thinkingLevel } } };
    let reponse: Response | null = null, erreurReseau: string | null = null;
    const avantN = garde.calls.length;
    try {
      reponse = await garde.fetch(liveEndpoint(MODELE), { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle! }, body: JSON.stringify(body), signal: AbortSignal.timeout(60_000) });
    } catch (e) { erreurReseau = (e as Error).message.slice(0, 200); }
    const appel = garde.calls.length > avantN ? garde.calls[garde.calls.length - 1] : null;
    if (!appel) { console.error(`  ${c.id} : aucune requête partie (${erreurReseau})`); break; }
    const json = reponse ? await reponse.json().catch(() => undefined) : undefined;
    const parties: any[] = json?.candidates?.[0]?.content?.parts ?? [];
    const texte = parties.filter((p) => p.thought !== true && typeof p.text === 'string').map((p) => p.text).join('') || null;
    const analyse = texte ? analyser(texte, c) : { valide: false, ordre: [], phrases: {}, erreurs: [erreurReseau ?? `pas de texte (HTTP ${appel.status})`] };
    const r: Reponse = { casId: c.id, pool: POOL, modele: MODELE, modeleObserve: appel.modelVersion ?? null, promptVersion: PROMPT_VERSION, empreinteRequete: sha(body), simule: sim !== null,
      appel: appel.n, http: appel.status ?? null, latenceMs: appel.latencyMs, finishReason: appel.finishReason ?? null, jetonsEntree: appel.inputTokens ?? null, jetonsSortie: appel.outputTokens ?? null,
      coutMicroChf: appel.costMicroChf ?? null, texte, analyse, erreurReseau };
    writeFileSync(join(sortie, `${c.id.replace('@', '_')}.json`), JSON.stringify(r, null, 1) + '\n');
    if (sim === null && r.modeleObserve && !r.modeleObserve.startsWith(MODELE)) { console.error(`✗ modèle observé « ${r.modeleObserve} » ≠ demandé « ${MODELE} » : arrêt.`); break; }
    analyse.valide ? ok++ : invalides++;
    console.log(`  ${c.id.padEnd(28)} appel ${String(r.appel).padStart(3)} · ${String(r.latenceMs).padStart(5)} ms · ${r.jetonsEntree ?? '?'} / ${r.jetonsSortie ?? '?'} jetons · ${analyse.valide ? 'valide' : 'INVALIDE ' + analyse.erreurs.join(' ; ')}`);
  }
  console.log(`terminé : ${ok} valides, ${invalides} invalides, ${garde.calls.length} appels partis. Réponses : ${sortie}`);
  if (sim !== null) console.log(`journal temporaire : ${journal.chemin}`);
}

// ---------- Métriques et rapport ----------
const pct = (x: number | null) => (x === null ? '–' : `${(x * 100).toFixed(1).replace('.', ',')} %`);
const f3 = (x: number | null) => (x === null ? '–' : x.toFixed(3).replace('.', ','));
const f1 = (x: number | null) => (x === null ? '–' : String(Math.round(x * 10) / 10).replace('.', ','));
const ligneResume = (nom: string, r: Resume) => `| ${nom} | ${r.n} | ${pct(r.rappel5)} | ${pct(r.rappel10)} | ${pct(r.touche10)} | ${f1(r.rangMedian)} | ${f3(r.mrr)} |`;
const ENTETE = '| système | cas | rappel@5 | rappel@10 | au moins 1 dans les 10 | rang médian du 1er | MRR |\n|---|---|---|---|---|---|---|';
const percentile = (xs: number[], p: number) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)]; };

interface Evalue { cas: CasFige; rep: Reponse; moteur: Obs; opt1: Obs; ia: Obs; ordreMoteur: string[]; ordreOpt1: string[]; ordreIA: string[] }
function evaluer(cas: CasFige[], reps: Map<string, Reponse>): Evalue[] {
  return cas.filter((c) => reps.has(c.id)).map((c) => {
    const brut = reps.get(c.id)!, rep: Reponse = { ...brut, analyse: brut.texte ? analyser(brut.texte, c) : brut.analyse };   // ré-analysée : les règles se corrigent hors ligne
    const om = ordreMoteur(c.hop, c.moment), oo = ordreOpt1(c.hop, c.moment);
    // Une réponse invalide ne change pas le classement : le moteur reste la réponse (ou l'option 1 pour le pool opt1). Elle est comptée à part.
    const oi = rep.analyse.valide ? ordreIA(c, rep.analyse) : ordrePool(c.hop, c.moment);
    return { cas: c, rep, moteur: { rangs: rangsDans(om, c.attendus) }, opt1: { rangs: rangsDans(oo, c.attendus) }, ia: { rangs: rangsDans(oi, c.attendus) }, ordreMoteur: om, ordreOpt1: oo, ordreIA: oi };
  });
}
function chargerReponses(dossier: string): Map<string, Reponse> {
  const out = new Map<string, Reponse>();
  if (existsSync(dossier)) for (const f of readdirSync(dossier).filter((x) => x.endsWith('.json')).sort()) { const r: Reponse = JSON.parse(readFileSync(join(dossier, f), 'utf8')); out.set(r.casId, r); }
  return out;
}
/** Le meilleur gain possible : les cas où un substitut de référence est dans le pool, mis en premier par un oracle. */
function plafond(ev: Evalue[]) {
  const dansPool = ev.filter((e) => e.cas.attendus.some((a) => e.cas.candidats.some((c) => c.key === a)));
  const mrr = moyenne(ev.map((e) => (e.cas.attendus.some((a) => e.cas.candidats.some((c) => c.key === a)) ? 1 : (1 / (Math.min(...e.moteur.rangs.filter((r): r is number => r !== null)) || Infinity)))));
  return { dansPool: dansPool.length, n: ev.length, mrrOracle: arrondi(mrr) };
}
const rr = (o: Obs) => { const r = o.rangs.filter((x): x is number => x !== null); return r.length ? 1 / Math.min(...r) : 0; };
const premier = (o: Obs) => { const r = o.rangs.filter((x): x is number => x !== null); return r.length ? Math.min(...r) : Infinity; };
/** Cas par cas : l'IA fait-elle monter ou descendre le premier substitut ? Écart de MRR avec son intervalle (rééchantillonnage des cas, graine fixe). */
function gainsParCas(ev: Evalue[], contre: 'moteur' | 'opt1') {
  const d = ev.map((e) => rr(e.ia) - rr(e[contre])), mieux = ev.filter((e) => premier(e.ia) < premier(e[contre])).length, pire = ev.filter((e) => premier(e.ia) > premier(e[contre])).length;
  const rnd = mulberry32(GRAINE + 7), moy: number[] = [];
  for (let b = 0; b < 2000; b++) { let t = 0; for (let i = 0; i < d.length; i++) t += d[Math.floor(rnd() * d.length)]; moy.push(t / d.length); }
  moy.sort((a, b) => a - b);
  return { mieux, pire, egal: ev.length - mieux - pire, ecart: d.length ? d.reduce((a, b) => a + b, 0) / d.length : 0, bas: moy[Math.floor(0.025 * moy.length)] ?? 0, haut: moy[Math.floor(0.975 * moy.length)] ?? 0 };
}
/** Intervalle à 95 % d'une statistique des cas (rééchantillonnage avec remise, graine fixe). */
function intervalle(obs: Obs[], stat: (o: Obs[]) => number | null): [number | null, number | null] {
  const rnd = mulberry32(GRAINE + 11), vals: number[] = [];
  for (let b = 0; b < 2000; b++) { const v = stat(obs.map(() => obs[Math.floor(rnd() * obs.length)])); if (v !== null) vals.push(v); }
  vals.sort((a, c) => a - c);
  return vals.length ? [vals[Math.floor(0.025 * vals.length)], vals[Math.min(vals.length - 1, Math.floor(0.975 * vals.length))]] : [null, null];
}
const ic = (obs: Obs[], stat: (o: Obs[]) => number | null, fmt: (x: number | null) => string) => { const [a, b] = intervalle(obs, stat); return `${fmt(a)} à ${fmt(b)}`; };
const lignesIC = (nom: string, obs: Obs[]) => `| ${nom} | ${ic(obs, (o) => resume(o).mrr, f3)} | ${ic(obs, (o) => resume(o).rappel10, pct)} | ${ic(obs, (o) => resume(o).rangMedian, f1)} |`;
const texteGains = (g: ReturnType<typeof gainsParCas>) => `le premier substitut monte dans ${g.mieux} cas, descend dans ${g.pire}, reste dans ${g.egal} ; écart de MRR ${g.ecart >= 0 ? '+' : ''}${f3(g.ecart)} (intervalle à 95 % : ${f3(g.bas)} à ${f3(g.haut)})`;
function tableauComparatif(titre: string, ev: Evalue[], avecOpt1 = true): string {
  if (!ev.length) return `### ${titre}\n\n(aucun cas)\n`;
  const lignes = [ligneResume('moteur seul', resume(ev.map((e) => e.moteur)))];
  if (avecOpt1) lignes.push(ligneResume('option 1 (mots, λ = 0,25), hors ligne', resume(ev.map((e) => e.opt1))));
  lignes.push(ligneResume(`IA (${POOL === 'opt1' ? 'sur l\'option 1' : 'sur le moteur'})`, resume(ev.map((e) => e.ia))));
  const g1 = gainsParCas(ev, 'moteur'), g2 = gainsParCas(ev, 'opt1');
  const tabIC = `\nIntervalles à 95 % (rééchantillonnage des cas, 2000 tirages, graine fixe) :\n\n| système | MRR | rappel@10 | rang médian du 1er |\n|---|---|---|---|\n${[lignesIC('moteur seul', ev.map((e) => e.moteur)), ...(avecOpt1 ? [lignesIC('option 1', ev.map((e) => e.opt1))] : []), lignesIC('IA', ev.map((e) => e.ia))].join('\n')}\n`;
  return `### ${titre}\n\n${ENTETE}\n${lignes.join('\n')}\n${tabIC}\nIA contre moteur : ${texteGains(g1)}.${avecOpt1 ? `\nIA contre option 1 : ${texteGains(g2)}.` : ''}\n`;
}
function verifierContreE1(): { texte: string; ok: boolean } {
  const e1 = JSON.parse(readFileSync(resolve('work/missions/2026-10-25-integration-houblons/voies/e1-banc-eval/resultats/resultats.json'), 'utf8'));
  const rd = (mo: MomentId, f: (id: string) => string[]) => resume(cibles.map((c) => ({ rangs: rangsDans(f(c.id), c.attendus) })));
  const mesures: [string, Resume, Resume][] = [
    ['moteur 60′ (217 houblons)', rd('b60', (id) => ordreMoteur(id, 'b60')), e1.substituer.parMoment['60′'].tous],
    ['moteur dry hop actif (217)', rd('dryActive', (id) => ordreMoteur(id, 'dryActive')), e1.substituer.parMoment['dry hop actif'].tous],
    ['option 1 λ = 0,25, arôme (217)', rd('dryActive', (id) => ordreOpt1(id, 'dryActive')), e1.options.motsSansFamille['λ=0.25']],
  ];
  const lignes = mesures.map(([nomm, a, b]) => {
    const egal = ['n', 'rappel5', 'rappel10', 'touche10', 'rangMedian', 'mrr', 'sansRang'].every((k) => (a as any)[k] === (b as any)[k]);
    return { egal, ligne: `| ${nomm} | ${f3(a.mrr)} / ${f3(b.mrr)} | ${pct(a.rappel10)} / ${pct(b.rappel10)} | ${f1(a.rangMedian)} / ${f1(b.rangMedian)} | ${egal ? 'identique' : 'DIFFÉRENT'} |` };
  });
  // Les rangs par cas : les 9 phares, substituts Beer Maverick reliés, aux deux moments, contre les rangs publiés par e1.
  let phOk = 0, phTot = 0;
  for (const p of e1.phares) for (const [mo, cle] of [['dryActive', 'dry'], ['b60', 'a60']] as const) {
    const ordre = ordreMoteur(p.id, mo);
    for (const b of p[cle].bm.filter((x: { relie: boolean }) => x.relie)) { phTot++; if ((ordre.findIndex((k) => nom(k) === b.nom) + 1) === b.rang) phOk++; }
  }
  const egalPhares = phOk === phTot && phTot > 0;
  lignes.push({ egal: egalPhares, ligne: `| rangs des substituts BM des 9 phares, deux moments | ${phOk} / ${phTot} rangs retrouvés | | | ${egalPhares ? 'identique' : 'DIFFÉRENT'} |` });
  return { ok: lignes.every((l) => l.egal), texte: `| mesure | MRR (ici / e1) | rappel@10 | rang médian | |\n|---|---|---|---|---|\n${lignes.map((l) => l.ligne).join('\n')}\n` };
}
function rapport(dossiers: { libelle: string; dossier: string }[], sortieDir: string, titreSimule: boolean) {
  const req = lireRequetes();
  const e1 = verifierContreE1();
  const parties: string[] = [];
  parties.push(`# Essai d'IA : re-classement des substituts (#181, voie ia1-reclassement)${titreSimule ? ' — PASSE SIMULÉE (aucun appel réel)' : ''}\n`);
  parties.push(`Généré par \`scripts/eval-hop/ia-reclassement.ts --rapport\`. Invite ${PROMPT_VERSION}, requêtes figées \`requetes/requetes-${POOL}.json\` (empreinte ${req.empreinteCas}). Référence : substituts Beer Maverick (comme e1) ; le moteur et l'option 1 sont recalculés ici sur les mêmes cas.\n`);
  parties.push(`## 0. Contrôle : le moteur seul et l'option 1, recalculés ici, contre e1\n\n${e1.texte}\nLe moteur et l'option 1 retrouvent à l'identique les chiffres publiés de e1 sur les 217 houblons : ${e1.ok ? 'OUI' : 'NON'}.\n`);
  const resultats: Record<string, unknown> = { controleE1: e1.ok };
  const runs: { libelle: string; ev: Evalue[] }[] = [];
  for (const { libelle, dossier } of dossiers) {
    const reps = chargerReponses(dossier), ev = evaluer(req.cas, reps);
    runs.push({ libelle, ev });
    if (!ev.length) { parties.push(`## ${libelle}\n\n(aucune réponse)\n`); continue; }
    const echant = ev.filter((e) => e.cas.groupes.includes('echantillon')), phares = ev.filter((e) => e.cas.groupes.includes('phare'));
    const aroma = ev.filter((e) => e.cas.moment === 'dryActive'), a60 = ev.filter((e) => e.cas.moment === 'b60');
    const valides = ev.filter((e) => e.rep.analyse.valide).length;
    const lat = ev.map((e) => e.rep.latenceMs), jin = ev.map((e) => e.rep.jetonsEntree ?? 0), jout = ev.map((e) => e.rep.jetonsSortie ?? 0);
    const cout = ev.reduce((s, e) => s + (e.rep.coutMicroChf ?? 0), 0), connus = ev.filter((e) => e.rep.coutMicroChf != null).length;
    const modeles = [...new Set(ev.map((e) => e.rep.modeleObserve ?? 'non fourni'))];
    parties.push(`## ${libelle}\n`);
    parties.push(`${ev.length} cas, ${valides} réponses valides (${pct(valides / ev.length)}) ; modèle(s) observé(s) : ${modeles.join(', ')}. Une réponse invalide laisse le classement de départ (le repli) et pèse donc 0 dans le gain.\n`);
    parties.push(tableauComparatif('Tous les cas (60′ et dry hop)', ev));
    parties.push(tableauComparatif('Échantillon (graine 181, 30 premiers) — les deux moments', echant));
    parties.push(tableauComparatif('Les 9 houblons phares — les deux moments', phares));
    parties.push(tableauComparatif('Dry hop seulement (tous les cas)', aroma));
    parties.push(tableauComparatif('60′ seulement (tous les cas) : l\'option 1 ne change rien à 60′', a60));
    const pl = plafond(ev);
    parties.push(`**Plafond de la fenêtre** : un substitut de référence est dans les ${TAILLE_POOL} candidats pour ${pl.dansPool} cas sur ${pl.n} ; une IA parfaite qui le mettrait premier plafonne le MRR à ${f3(pl.mrrOracle)}. Ce que le modèle ne voit pas, il ne peut pas le remonter.\n`);
    const rm = resume(ev.map((e) => e.moteur)), ri = resume(ev.map((e) => e.ia)), ro = resume(ev.map((e) => e.opt1));
    const gMrr = (ri.mrr ?? 0) - (rm.mrr ?? 0), gRap = ((ri.rappel10 ?? 0) - (rm.rappel10 ?? 0)) * 100;
    const nelson = ev.find((e) => e.cas.id === 'nelson-sauvin@dry'), hb = 'beermaverick-hallertau-blanc';
    const rangHB = nelson ? nelson.ordreIA.indexOf(hb) + 1 : null;
    const seuilChiffres = gMrr >= 0.05 || gRap >= 5, seuilNelson = rangHB !== null && rangHB > 0 && rangHB <= 5;
    parties.push(`**Seuil pour continuer** (+0,05 de MRR ou +5 points de rappel@10 sur le moteur seul, **et** Hallertau Blanc dans les 5 premiers de Nelson Sauvin au dry hop) : gain de MRR ${gMrr >= 0 ? '+' : ''}${f3(gMrr)}, de rappel@10 ${gRap >= 0 ? '+' : ''}${gRap.toFixed(1).replace('.', ',')} point(s) sur tous les cas → chiffres ${seuilChiffres ? 'atteints' : 'non atteints'} ; Hallertau Blanc ${rangHB ? `au rang ${rangHB} chez l'IA` : 'absent'} (moteur : ${nelson ? nelson.ordreMoteur.indexOf(hb) + 1 : '–'}, option 1 : ${nelson ? nelson.ordreOpt1.indexOf(hb) + 1 : '–'}) → ${seuilNelson ? 'tenu' : 'non tenu'}. **Seuil : ${!nelson ? 'critère Hallertau Blanc non mesuré dans ce lot (Nelson Sauvin n\'y est pas)' : seuilChiffres && seuilNelson ? 'ATTEINT' : 'NON ATTEINT'}.** Écart de l'IA à l'option 1 : MRR ${(ri.mrr ?? 0) - (ro.mrr ?? 0) >= 0 ? '+' : ''}${f3((ri.mrr ?? 0) - (ro.mrr ?? 0))}, rappel@10 ${((ri.rappel10 ?? 0) - (ro.rappel10 ?? 0)) * 100 >= 0 ? '+' : ''}${(((ri.rappel10 ?? 0) - (ro.rappel10 ?? 0)) * 100).toFixed(1).replace('.', ',')} point(s).\n`);

    // Les phares : 10 premiers du moteur, de l'option 1 et de l'IA avec ses phrases.
    parties.push(`### Les 9 phares : les 10 premiers de chaque système\n`);
    for (const [lib, s] of PHARES) for (const [mo, lm] of MOMENTS) {
      const e = ev.find((x) => x.cas.id === idCas(`beermaverick-${s}`, mo)); if (!e) continue;
      const dix = (o: string[]) => o.slice(0, 10).map((k, i) => `${i + 1}. ${nom(k)}`).join(' · ');
      const refs = e.cas.attendus.map((a) => `${nom(a)} (moteur ${e.ordreMoteur.indexOf(a) + 1}${POOL === 'opt1' || mo === 'dryActive' ? `, option 1 ${e.ordreOpt1.indexOf(a) + 1}` : ''}, IA ${e.ordreIA.indexOf(a) + 1})`).join(' ; ');
      parties.push(`#### ${lib} — ${lm}\n\n- Moteur : ${dix(e.ordreMoteur)}\n${mo === 'dryActive' ? `- Option 1 : ${dix(e.ordreOpt1)}\n` : ''}- IA${e.rep.analyse.valide ? '' : ' (INVALIDE, repli)'} : ${dix(e.ordreIA)}\n${e.rep.analyse.valide ? e.rep.analyse.ordre.map((c, i) => `  - ${i + 1}. ${e.cas.candidats.find((x) => x.c === c)!.nom} : ${e.rep.analyse.phrases[c]}`).join('\n') + '\n' : ''}- Beer Maverick : ${refs}\n`);
    }
    // Les cinq cas du brasseur.
    const rangDe = (id: string, mo: MomentId, cible: string) => { const e = ev.find((x) => x.cas.id === idCas(id, mo)); return e ? e.ordreIA.indexOf(cible) + 1 : null; };
    const hbNelson = rangDe('beermaverick-nelson-sauvin', 'dryActive', hb);
    const saazChezGalaxy = rangDe('beermaverick-galaxy', 'dryActive', 'beermaverick-saaz-cz'), galaxyChezSaaz = rangDe('beermaverick-saaz-cz', 'dryActive', 'beermaverick-galaxy');
    parties.push(`### Les cinq cas du brasseur (K1 à K5)\n\n| cas | lecture | résultat |\n|---|---|---|\n` +
      `| K1 · Stout « plus floral » | Suggérer, pas Substituer : hors du périmètre de ce banc | non applicable ici |\n| K2 · résineux, stout contre lager | Suggérer (échelles de style) | non applicable ici |\n| K3 · agrumes, IPA contre lager | Suggérer (échelles de style) | non applicable ici |\n` +
      `| K4 · Nelson Sauvin (vin blanc) | Hallertau Blanc dans les 5 premiers au dry hop | ${nelson ? '' : 'non mesuré dans ce lot (Nelson Sauvin absent) · '}IA : rang ${hbNelson || 'hors des 20 candidats'} ; moteur : ${nelson ? nelson.ordreMoteur.indexOf(hb) + 1 : '–'} ; option 1 : ${nelson ? nelson.ordreOpt1.indexOf(hb) + 1 : '–'} → ${hbNelson && hbNelson <= 5 ? 'tenu' : 'non tenu'} |\n` +
      `| K5 · Galaxy n'est pas Saaz | Saaz hors des 10 premiers de Galaxy et Galaxy hors des 10 premiers de Saaz, au dry hop | ${saazChezGalaxy === null ? 'non mesuré dans ce lot (Galaxy ou Saaz absent) · ' : ''}Saaz chez Galaxy : rang ${saazChezGalaxy || '–'} ; Galaxy chez Saaz : rang ${galaxyChezSaaz || '–'} → ${(saazChezGalaxy ?? 0) > 10 || !saazChezGalaxy ? 'tenu' : 'non tenu'} / ${(galaxyChezSaaz ?? 0) > 10 || !galaxyChezSaaz ? 'tenu' : 'non tenu'} |\n\n` +
      `K1 à K3 portent sur Suggérer (visées de recette et échelles de style), pas sur le classement des substituts : l'IA de ce banc n'y touche pas. Ils restent à juger sur un essai de Suggérer.\n`);
    // Durée, jetons, coût.
    const q = (p: number) => percentile(lat, p);
    parties.push(`### Durée, jetons, coût\n\n- Durée par requête : médiane ${f1(mediane(lat))} ms, p95 ${q(0.95)} ms, max ${Math.max(...lat)} ms ; limite de l'écran Substituer : 3 s au p95 → ${(q(0.95) ?? 0) <= 3000 ? 'tenue' : 'NON tenue'}.\n- Jetons : entrée ${Math.round(moyenne(jin)!)} en moyenne (total ${jin.reduce((a, b) => a + b, 0)}), sortie ${Math.round(moyenne(jout)!)} en moyenne (total ${jout.reduce((a, b) => a + b, 0)}), réflexion comprise.\n- Coût estimé (tarifs de \`geminiCosts.ts\`, 1 USD = 1,25 CHF) : ${(cout / 1e6).toFixed(4)} CHF pour ${ev.length} appels (${connus} chiffrés), soit ${(cout / ev.length / 1e6).toFixed(4)} CHF par usage.\n`);
    const motsInvalides = ev.filter((e) => !e.rep.analyse.valide).map((e) => `${e.cas.id} (${e.rep.analyse.erreurs.join(' ; ')})`);
    if (motsInvalides.length) parties.push(`Réponses invalides : ${motsInvalides.join(' ; ')}\n`);
    resultats[libelle] = { n: ev.length, valides, moteur: resume(ev.map((e) => e.moteur)), opt1: ro, ia: ri, echantillon: { moteur: resume(echant.map((e) => e.moteur)), opt1: resume(echant.map((e) => e.opt1)), ia: resume(echant.map((e) => e.ia)) },
      phares: { moteur: resume(phares.map((e) => e.moteur)), opt1: resume(phares.map((e) => e.opt1)), ia: resume(phares.map((e) => e.ia)) }, plafond: pl, seuil: { chiffres: seuilChiffres, nelson: seuilNelson, rangHB }, latenceP95: q(0.95), coutMicroChf: cout };
  }
  // Deux réponses sur les mêmes cas : le seul écart est le modèle (ou l'invite).
  for (let i = 0; i < runs.length; i++) for (let j = i + 1; j < runs.length; j++) {
    const ids = new Set(runs[j].ev.map((e) => e.cas.id)), A = runs[i].ev.filter((e) => ids.has(e.cas.id)), B = new Map(runs[j].ev.map((e) => [e.cas.id, e]));
    if (!A.length) continue;
    const Bs = A.map((e) => B.get(e.cas.id)!), hbA = A.find((e) => e.cas.id === 'nelson-sauvin@dry'), hbB = hbA && B.get('nelson-sauvin@dry');
    parties.push(`## Comparaison sur les ${A.length} cas communs : ${runs[i].libelle} contre ${runs[j].libelle}

${ENTETE}
${[ligneResume('moteur seul', resume(A.map((e) => e.moteur))), ligneResume('option 1, hors ligne', resume(A.map((e) => e.opt1))), ligneResume(runs[i].libelle, resume(A.map((e) => e.ia))), ligneResume(runs[j].libelle, resume(Bs.map((e) => e.ia)))].join('\n')}

Hallertau Blanc chez Nelson Sauvin (dry hop) : ${hbA ? hbA.ordreIA.indexOf('beermaverick-hallertau-blanc') + 1 : '–'} contre ${hbB ? hbB.ordreIA.indexOf('beermaverick-hallertau-blanc') + 1 : '–'}.
`);
  }
  mkdirSync(sortieDir, { recursive: true });
  const nomRapport = titreSimule ? 'rapport-simule.md' : `rapport-${POOL}.md`;
  writeFileSync(join(sortieDir, nomRapport), parties.join('\n'));
  writeFileSync(join(sortieDir, titreSimule ? 'metriques-simule.json' : `metriques-${POOL}.json`), JSON.stringify(resultats, null, 1) + '\n');
  console.log(`rapport écrit : ${join(sortieDir, nomRapport)} · contrôle e1 ${e1.ok ? 'identique' : 'DIFFÉRENT'}`);
  return resultats;
}

// ---------- Côte à côte pour le brasseur (aucun appel : réponses déjà gardées) ----------
const COTE_PHARES = ['nelson-sauvin', 'citra', 'motueka', 'mosaic', 'galaxy', 'simcoe', 'saaz-cz', 'cascade'];
function coteACote() {
  if (POOL !== 'opt1') stop('--cote-a-cote : utiliser --pool=opt1 (les réponses de la fenêtre de l\'option 1).');
  const req = lireRequetes();
  const base = join(VOIE, 'resultats', '2026-10-26');
  const sources = [['lite', join(base, 'reponses-opt1-lite')], ['3.8', join(base, 'reponses-opt1-3.8')]] as const;
  const dix = (ordre: string[]) => ordre.slice(0, 10).map((k, i) => ({ rang: i + 1, nom: nom(k) }));
  const phares = COTE_PHARES.map((s) => {
    const id = `beermaverick-${s}`, h = parId.get(id)!, c = req.cas.find((x) => x.id === idCas(id, 'dryActive'))!;
    let rep: Reponse | undefined, modele = '';
    for (const [m2, dossier] of sources) { const r = chargerReponses(dossier).get(c.id); if (r) { rep = r; modele = r.modeleObserve ?? m2; break; } }
    if (!rep) throw new Error(`Aucune réponse gardée pour ${c.id} : pas de nouvel appel dans ce mode.`);
    const a = analyser(rep.texte ?? undefined, c);
    if (!a.valide) throw new Error(`Réponse invalide pour ${c.id}.`);
    const om = ordreMoteur(id, 'dryActive'), oo = ordreOpt1(id, 'dryActive'), oi = ordreIA(c, a);
    const iaDix = a.ordre.map((cc, i) => ({ rang: i + 1, nom: c.candidats.find((x) => x.c === cc)!.nom, phrase: a.phrases[cc] }));
    const bm = (h.bm?.substituts ?? []).map((l) => {
      const lien = bmLienId(l);
      if (!lien || !parId.has(lien)) return { nom: typeof l === 'string' ? l : l.name, relie: false, rangMoteur: null, rangOption1: null, rangOption1PlusIA: null, dansLes10: { moteur: false, option1: false, option1PlusIA: false } };
      const r = (o: string[]) => o.indexOf(lien) + 1 || null;
      return { nom: nom(lien), relie: true, rangMoteur: r(om), rangOption1: r(oo), rangOption1PlusIA: r(oi), dansLes10: { moteur: (r(om) ?? 99) <= 10, option1: (r(oo) ?? 99) <= 10, option1PlusIA: (r(oi) ?? 99) <= 10 } };
    });
    return { nom: h.name, id, moment: 'dry hop (fermentation active)', usage: h.purpose ?? null, alphaPct: h.alpha, mots: h.tagsFr,
      moteur: dix(om), option1: dix(oo), option1PlusIA: iaDix, modeleIA: modele, reponse: `resultats/2026-10-26/reponses-opt1-${modele.includes('lite') ? 'lite' : '3.8'}/${c.id.replace('@', '_')}.json`, beerMaverick: bm };
  });
  const sortie = join(VOIE, 'resultats', 'cote-a-cote.json');
  writeFileSync(sortie, JSON.stringify({ version: 1, genere: 'scripts/eval-hop/ia-reclassement.ts --cote-a-cote --pool=opt1',
    note: 'Réponses déjà gardées, aucun nouvel appel. « Moteur » = substitutes() de l\'app ; « option 1 » = le même moteur avec l\'arôme mêlé aux mots hors famille (λ = 0,25, hors ligne) ; « option 1 + IA » = l\'IA reclasse les 20 premiers de l\'option 1 (une phrase par choix, écrite par le modèle). « Beer Maverick » = substituts choisis par des brasseurs sur leur page, avec leur rang dans chaque liste (null : non relié au catalogue). Un meilleur rang veut dire plus proche de Beer Maverick, pas jugé par le brasseur.',
    systemes: ['moteur', 'option1', 'option1PlusIA'], phares }, null, 1) + '\n');
  console.log(`côte à côte écrit : ${sortie} (${phares.length} phares ; modèles : ${phares.map((p) => `${p.nom} ${p.modeleIA}`).join(', ')})`);
}

// ---------- Aiguillage ----------
(async () => {
  if (flag('--figer')) return figer();
  if (flag('--cote-a-cote')) return coteACote();
  if (flag('--simule') || val('--simule') !== undefined) {
    const mode = val('--simule') === 'fautes' ? 'fautes' : 'identite';
    const nomSim = `simule${mode === 'fautes' ? '-fautes' : ''}${POOL === 'opt1' ? '-opt1' : ''}`;
    await passe(nomSim);
    return rapport([{ libelle: `Passe simulée (${mode})`, dossier: dossierReponses(nomSim) }], join(VOIE, 'resultats', nomSim), true);
  }
  if (flag('--reel')) return passe(null);
  if (flag('--rapport')) {
    const dossiers = readdirSync(join(VOIE, 'resultats', DATE)).filter((d) => d.startsWith('reponses-')).sort();
    // Un rapport par pool et modèle présents ; le pool du lancement courant sert de référence pour les chiffres du moteur.
    const choisis = dossiers.filter((d) => d.startsWith(`reponses-${POOL}-`));
    return rapport(choisis.map((d) => ({ libelle: `Réponses réelles : ${d.replace('reponses-', '')} (${DATE})`, dossier: join(VOIE, 'resultats', DATE, d) })), join(VOIE, 'resultats', DATE), false);
  }
  stop('Mode ? --figer, --simule[=fautes], --reel --confirm-paid-ai --max=N, ou --rapport.');
})();
