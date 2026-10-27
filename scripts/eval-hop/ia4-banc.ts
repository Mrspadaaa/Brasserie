// Voie ia4 : le banc à l'aveugle de l'IA de Suggérer (D126, D192, accord D100). L'IA ne reclasse que les ex æquo du moteur ; ce banc dit si elle
// rapproche les rangées montrées d'une référence indépendante, sur des cas que le brasseur n'a jamais nommés.
//
//   1. npx vite-node scripts/eval-hop/ia4-banc.ts -- --phase=preparer
//        Écrit `ia4-banc/reference.json` : les cas, les ex æquo du moteur, et pour chacun ce que ses sources HORS Beer Maverick et HORS Beer
//        Analytics disent de la famille demandée. AUCUN appel. Le fichier est écrit, et son empreinte imprimée, AVANT tout appel.
//   2. npx vite-node scripts/eval-hop/ia4-banc.ts -- --phase=jouer --confirm-paid-ai
//        Refuse de partir sans `reference.json`. Un appel Flash-Lite par cas (invite `suggerer-v2`, le même module que le callable : `hopReclassCore.ts`),
//        par `guardLiveFetch`, journal « ia4 » de gemini-journal.md, compteur réservé avant l'envoi, arrêt à 0,4 CHF ou à la 2e erreur de suite.
//        Écrit `ia4-banc/resultats.json` et `tableau.md`, imprime `IA4-BANC-OK` seulement si tous les cas ont été joués et le journal écrit.
//
// ----- La règle de décision, écrite avant le banc (VOIE.md) -----
//  L'IA mérite d'être allumée si, sur l'ensemble des cas mesurables, la part confirmée par la référence monte d'au moins 10 points (moyenne des écarts
//  « ordre de l'IA moins ordre du moteur ») ET ne baisse de plus de 25 points dans AUCUN cas. Sinon elle reste éteinte. Le banc rapporte, le pilote décide.
// ----- La mesure -----
//  Rangées montrées : les 4 premières de l'ordre (ou toutes si le groupe en a moins). Pour chacune : « couverte » si au moins une source de référence
//  décrit son arôme ; « confirmée » si l'une de ces sources cite la famille demandée. Part = confirmées / couvertes. Un cas est mesurable si, dans les
//  DEUX ordres, au moins 2 rangées montrées sont couvertes. Un classement invalide ou refusé = l'app garde l'ordre du moteur = écart 0 (compté, signalé).
// ----- La référence (jamais Beer Maverick ni Beer Analytics) -----
//  Hopsteiner (producteur) : « Aroma evaluation » citrusy / floral, note 0 à 5 ; citée si note ≥ 3.
//  HopDatabase (descripteurs des fiches Yakima Chief) : citée si un descripteur dit la famille (agrumes : citrus, grapefruit, orange, lemon, lime, mandarin, tangerine,
//  zest, bergamot ; floral : floral, flower, rose, lavender, geranium, elderflower, jasmine, perfum, violet, blossom, chamomile).
// ----- Les cas -----
//  Les styles de `pharesParStyle` sauf 22A (sa neipa v3), 16D (stand-in de son stout S1) et 21C (sa Hazy du jeudi) ; deux demandes (agrumes, floral) ;
//  dry hop actif et 10′ ; recette de fixture (Nugget 20 g à 60′, 24 L, OG 1,06, US-05). Seuls les cas dont le groupe « même effet » (effet > 0 sur la
//  famille) a au moins 3 ex æquo dans les 30 premiers du moteur ; au plus 30 cas, répartis à pas régulier. Ses six et sa neipa v3 : UN passage, à la fin.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chargerCataloguePlein } from '../../src/domain/hopIndex/v4/data';
import type { FamilyId } from '../../src/domain/hopIndex/v4/families';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { MomentId, Recipe } from '../../src/domain/hopIndex/v4/recipe';
import type { Voie } from '../../src/domain/hopIndex/v4';
import { poserTypicite } from '../../src/domain/hopIndex/v4/typicite';
import { PHARES_PAR_STYLE } from '../../tests/unit/hopIndexV4/pharesParStyle';
import { R22A, SES_SIX, chargerTable, idCourt } from './f9-commun';
import { guardLiveFetch, liveEndpoint, liveJournalRow, withJournalLock, type LiveCall } from '../gemini38LiveCore';
import { requirePaidAiTestOptIn } from '../paid-ai-test-guard.mjs';
import { analyserReponseSuggerer, construireInviteSuggerer, corpsRequeteSuggerer, ficheDeCatalogue, identifiant, type EntreeSuggerer, type MomentSuggerer } from '../../functions/src/hopReclassCore';

const ICI = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(ICI, '../..');
const DOSSIER = resolve(ROOT, 'work/missions/2026-10-25-integration-houblons/voies/ia4-ia-ex-aequo/ia4-banc');
const SOURCES = resolve(ROOT, 'src/data/hopSources');
const JOURNAL = resolve(ROOT, 'work/finalisation-tickets-2026-10-08/gemini-journal.md');
const VERROU = resolve(ROOT, 'work/finalisation-tickets-2026-10-08/locks/gemini-journal');
const PHASE = process.argv.find((a) => a.startsWith('--phase='))?.split('=')[1] ?? '';
// D130 (27.10, l'utilisateur : « J'autorise un budget de 10ch pour testé les deux ») : le même banc, les mêmes 30 cas et la même référence
// figée, avec un autre modèle et un autre niveau de réflexion. `--modele=gemini-3.8-flash --reflexion=low|high` ; chaque essai a son
// compteur, sa section du journal et ses fichiers de sortie. Sans option : l'essai d'ia4 (Flash-Lite, réflexion basse).
const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
const MODELE = arg('modele') ?? 'gemini-3.5-flash-lite';
const REFLEXION = arg('reflexion') ?? 'low';
const ESSAI = MODELE === 'gemini-3.5-flash-lite' && REFLEXION === 'low' ? '' : ` ${MODELE} ${REFLEXION}`;
const ENVELOPPE = ESSAI ? { appels: 40, micro: 4_500_000 } : { appels: 70, micro: 400_000 };
const MONTREES = 4, MAX_CAS = 30, MIN_GROUPE = 3, TAILLE_POOL = 12, BALAYAGE = 30;
const EXCLUS = new Set(['22A', '16D', '21C']);

const DEMANDES: { nom: string; famille: FamilyId; mot: string; seuilHs: (v: Record<string, unknown>) => number | null; mots: RegExp }[] = [
  { nom: 'plus d’agrumes', famille: 'citrus', mot: 'agrumes', seuilHs: (c) => note(c, 'arome_citrusy'), mots: /citrus|grapefruit|orange|lemon|lime|mandarin|tangerine|zest|bergamot/i },
  { nom: 'plus floral', famille: 'floral', mot: 'floral', seuilHs: (c) => note(c, 'arome_floral'), mots: /floral|flower|rose|lavender|geranium|elderflower|jasmine|perfum|violet|blossom|chamomile/i },
];
const MOMENTS: { nom: string; id: MomentId; ia: MomentSuggerer }[] = [
  { nom: 'dry hop actif', id: 'dryActive', ia: { type: 'dryhop', phase: 'actif' } },
  { nom: '10′', id: 'b10', ia: { type: 'ebullition', minutes: 10 } },
];
const note = (champs: Record<string, unknown>, cle: string): number | null => {
  const v = (champs?.[cle] as { valeur?: unknown } | undefined)?.valeur;
  return typeof v === 'number' ? v : null;
};
const recette = (style: string): Recipe => ({ name: style, styleCode: style, volumeL: 24, og: 1.06, boilMin: 60, yeastId: 'fermentis-us05', ebc: 10, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }] });

// ---------- La référence : Hopsteiner et HopDatabase, par identifiant de variété ----------
const lire = (f: string) => JSON.parse(readFileSync(resolve(SOURCES, f), 'utf8'));
const cle = (k: string) => k.replace(/:cryo$/, '');
const hopsteiner = new Map<string, Record<string, unknown>>(), ych = new Map<string, string[]>();
for (const x of lire('hopsteiner.json').fiches) if (x.varietyId) hopsteiner.set(x.varietyId, x.champs);
for (const x of lire('hopdatabase.json').fiches) if (x.varietyId) ych.set(x.varietyId, (x.listes?.descripteurs ?? []) as string[]);
interface Ref { couverte: boolean; confirmee: boolean; hopsteiner: number | null; ych: string[] | null }
function reference(hopKey: string, d: (typeof DEMANDES)[number]): Ref {
  const hs = hopsteiner.get(cle(hopKey)), y = ych.get(cle(hopKey));
  const n = hs ? d.seuilHs(hs) : null;
  const ychDit = y && y.length ? y.some((t) => d.mots.test(t)) : null;
  const couverte = n != null || ychDit != null;
  return { couverte, confirmee: (n != null && n >= 3) || ychDit === true, hopsteiner: n, ych: y && y.length ? y : null };
}

// ---------- Les ex æquo du moteur (même balayage et même clé que l'écran : suggerer/ia.ts, poolExAequo ; adaptateur.ts, poolSuggerer) ----------
const effet = (v: Voie, f: FamilyId) => (v.effect[f].established && v.effect[f].central != null ? v.effect[f].central : null);
const cleEffet = (v: Voie, f: FamilyId) => JSON.stringify([v.actions.reduce((s, a) => s + a.grams, 0), [effet(v, f)]]);
type Moteur = ReturnType<typeof creerMoteur>;
function exAequo(m: Moteur, r: Recipe, f: FamilyId, mo: MomentId): Voie[] {
  const res = m.proposeVoies(r, { [f]: 1 }, { tasting: null, assemblages: false, remplacements: false, moments: [mo], limit: BALAYAGE, buyLimit: BALAYAGE, perHop: 1 });
  const vus = new Set<string>();
  const balayage = res.voies.filter((v: Voie) => v.type === 'ajouter' && v.actions.length === 1 && v.actions[0].moment === mo)
    .filter((v: Voie) => (vus.has(v.actions[0].hopKey) ? false : (vus.add(v.actions[0].hopKey), true))).slice(0, BALAYAGE);
  const parCle = new Map<string, Voie[]>();
  for (const v of balayage) parCle.set(cleEffet(v, f), [...(parCle.get(cleEffet(v, f)) ?? []), v]);
  // le premier groupe (dans l'ordre du moteur) d'au moins 3 rangées au même effet, dont l'effet sur la famille est positif
  for (const [, xs] of parCle) if (xs.length >= MIN_GROUPE && (effet(xs[0], f) ?? 0) > 0) return xs.slice(0, TAILLE_POOL);
  return [];
}

interface Cas { id: string; style: string; demande: string; famille: FamilyId; mot: string; moment: string; momentId: MomentId; houblons: string[]; ref: Record<string, Ref> }
const ordreMoteur = (c: Cas) => c.houblons;

async function preparer(m: Moteur): Promise<Cas[]> {
  const tous: Cas[] = [];
  for (const style of Object.keys(PHARES_PAR_STYLE).filter((s) => !EXCLUS.has(s))) {
    for (const d of DEMANDES) for (const mo of MOMENTS) {
      const g = exAequo(m, recette(style), d.famille, mo.id);
      if (g.length < MIN_GROUPE) continue;
      const houblons = g.map((v) => v.actions[0].hopKey);
      tous.push({ id: `${style}|${d.famille}|${mo.id}`, style, demande: d.nom, famille: d.famille, mot: d.mot, moment: mo.nom, momentId: mo.id, houblons, ref: Object.fromEntries(houblons.map((h) => [h, reference(h, d)])) });
    }
  }
  const pas = Math.max(1, tous.length / MAX_CAS);
  return tous.length <= MAX_CAS ? tous : Array.from({ length: MAX_CAS }, (_, i) => tous[Math.floor(i * pas)]);
}

// ---------- Le journal « ia4 » ----------
const SECTION = `## Essai à l’aveugle de l’IA de Suggérer sur les ex æquo du moteur (ia4${ESSAI}) — enveloppe séparée`;
const ETIQUETTE = `ia4${ESSAI}`.replace(/\./g, '\\.');
const COMPTEUR = new RegExp(`\\*\\*Compteur ${ETIQUETTE} : (\\d+) \\/ ${ENVELOPPE.appels} · (\\d+(?:\\.\\d+)?) CHF \\/ ${ENVELOPPE.micro / 1e6}\\*\\*`);
const texteCompteur = (n: number | string, micro: number) => `**Compteur ia4${ESSAI} : ${n} / ${ENVELOPPE.appels} · ${(micro / 1e6).toFixed(4)} CHF / ${ENVELOPPE.micro / 1e6}**`;
const ACCORD = ESSAI ? `D130 (« J'autorise un budget de 10ch pour testé les deux ») : ${MODELE}, réflexion ${REFLEXION}` : 'D100 : Flash-Lite';
const EN_TETE = [SECTION, '', `- Accord de l'utilisateur (${ACCORD}) : essai réel de la voie ia4 (invite \`suggerer-v2\`, 3 à 12 candidats par appel, les ex æquo du moteur). Enveloppe : **${ENVELOPPE.appels} appels au plus, ${ENVELOPPE.micro / 1e6} CHF**. Arrêt au premier dépassement ou à la deuxième erreur de suite.`,
  '- Chemin : `scripts/eval-hop/ia4-banc.ts` → garde-fous de `scripts/gemini38LiveCore.ts` → Gemini (le module de l\'invite est celui du callable). Données : fiches du catalogue et recettes de fixture, aucune donnée réelle. Clé jamais journalisée. Jamais dans `npm test`.',
  '', texteCompteur(0, 0), '', '| # | Heure | Issue | Test | Modèle observé | Tokens entrée / sortie | Coût estimé | Résultat |', '|---|---|---|---|---|---|---|---|'].join('\n');
function reserver(): number {
  return withJournalLock(VERROU, () => {
    let t = readFileSync(JOURNAL, 'utf8');
    if (!t.includes(SECTION)) t = `${t.replace(/\n*$/, '\n')}\n${EN_TETE}\n`;
    const c = COMPTEUR.exec(t);
    if (!c) throw new Error('Compteur ia4 illisible : aucun appel.');
    const n = Number(c[1]), micro = Math.round(Number(c[2]) * 1e6);
    if (n + 1 > ENVELOPPE.appels) throw new Error(`Enveloppe ia4 atteinte (${n} / ${ENVELOPPE.appels}) : requête refusée avant l'envoi.`);
    if (micro >= ENVELOPPE.micro) throw new Error(`Budget ia4 atteint (${(micro / 1e6).toFixed(4)} CHF) : requête refusée avant l'envoi.`);
    writeFileSync(JOURNAL, t.replace(COMPTEUR, () => texteCompteur(n + 1, micro)));
    return n + 1;
  });
}
function ligne(call: LiveCall, test: string, resultat: string) {
  withJournalLock(VERROU, () => {
    let t = readFileSync(JOURNAL, 'utf8');
    const c = COMPTEUR.exec(t)!;
    t = t.replace(COMPTEUR, () => texteCompteur(c[1], Math.round(Number(c[2]) * 1e6) + (call.costMicroChf ?? 0)));
    const debut = t.indexOf(SECTION), suite = t.indexOf('\n## ', debut + SECTION.length), fin = suite < 0 ? t.length : suite;
    const bloc = t.slice(debut, fin).replace(/\n*$/, '\n') + liveJournalRow(call, '#ia4', test, resultat) + '\n';
    writeFileSync(JOURNAL, t.slice(0, debut) + bloc + (suite < 0 ? '' : '\n' + t.slice(suite + 1)));
  });
}
function cleLocale(): string | undefined {
  const env = process.env.GEMINI_API_KEY?.trim();
  if (env) return env;
  const f = resolve(ROOT, 'functions/.secret.local');
  if (!existsSync(f)) return undefined;
  const l = readFileSync(f, 'utf8').split(/\r?\n/).find((x) => /^\s*GEMINI_API_KEY\s*=/.test(x));
  return l?.slice(l.indexOf('=') + 1).trim().replace(/^(["'])(.*)\1$/, '$2') || undefined;
}

// ---------- Un appel : l'invite du callable, l'analyse du callable ----------
interface Sortie { ok: boolean; erreur?: string; ordre: string[]; phrases: Record<string, string>; retirees: string[]; horsFiche: string[]; reputations: string[]; ms: number; chfMicro: number; tokens: [number, number] | null }
function entreeDe(style: string, nom: string, r: Recipe, d: (typeof DEMANDES)[number], mo: MomentSuggerer, cat: Map<string, any>, houblons: string[], dit: (a: Recipe['additions'][number]) => string): { entree: EntreeSuggerer; cles: string[] } {
  const cles = houblons.filter((h) => cat.has(h));
  return {
    cles,
    entree: {
      mode: 'suggerer', style: { code: style, nom },
      recette: { og: r.og ?? null, ibu: null, volumeL: r.volumeL ?? null, houblons: r.additions.filter((a) => a.grams > 0).map((a) => ({ nom: cat.get(a.hopKey)?.name ?? a.hopKey, grammes: a.grams, moment: dit(a) })) },
      demande: { objectifs: [{ famille: d.mot, sens: 1, crans: 1 }], moment: mo },
      candidats: cles.map((k) => ({ id: k, fiche: ficheDeCatalogue(cat.get(k)) })),
    },
  };
}
const dit = (a: Recipe['additions'][number]) => (a.moment === 'dryActive' ? 'dry hop actif' : a.moment === 'dryPost' ? 'dry hop après fermentation' : a.moment === 'wp' ? 'whirlpool' : `${String(a.moment).replace(/^b/, '')}′`);

async function appeler(reel: ReturnType<typeof guardLiveFetch>, cleApi: string, entree: EntreeSuggerer, cles: string[], test: string, etat: { dernier: LiveCall | null }): Promise<Sortie> {
  const message = construireInviteSuggerer(entree);
  const corps = corpsRequeteSuggerer(message) as { generationConfig: { maxOutputTokens: number; thinkingConfig: { thinkingLevel: string } } };
  corps.generationConfig.thinkingConfig.thinkingLevel = REFLEXION;
  // La réflexion haute compte ses jetons dans la sortie : sans marge, la réponse s'arrête en MAX_TOKENS.
  if (REFLEXION === 'high') corps.generationConfig.maxOutputTokens = 32_000;
  const ids = cles.map((_, i) => identifiant(i)), body = JSON.stringify(corps);
  const t0 = Date.now();
  const r = await reel.fetch(liveEndpoint(MODELE), { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cleApi }, body, signal: AbortSignal.timeout(REFLEXION === 'high' ? 120_000 : 30_000) });
  const json: any = await r.json().catch(() => ({}));
  const ms = Date.now() - t0, call = etat.dernier;
  const vide = { ok: false, ordre: [], phrases: {}, retirees: [], horsFiche: [], reputations: [], ms, chfMicro: call?.costMicroChf ?? 0, tokens: call?.inputTokens != null ? ([call.inputTokens, call.outputTokens ?? 0] as [number, number]) : null };
  if (!r.ok) return { ...vide, erreur: `HTTP ${r.status}` };
  const texte = (json?.candidates?.[0]?.content?.parts ?? []).filter((p: any) => !p.thought).map((p: any) => p.text ?? '').join('');
  if (json?.candidates?.[0]?.finishReason !== 'STOP') return { ...vide, erreur: `fin ${json?.candidates?.[0]?.finishReason}` };
  const a = analyserReponseSuggerer(texte, ids, message);
  void test;
  return { ...vide, ok: a.valide, erreur: a.valide ? undefined : a.erreurs.join(' ; '), ordre: a.ordre.map((id) => cles[ids.indexOf(id)]), phrases: Object.fromEntries(Object.entries(a.phrases).map(([id, p]) => [cles[ids.indexOf(id)], p])),
    retirees: a.retirees.map((id) => cles[ids.indexOf(id)]), horsFiche: a.horsFiche.map((id) => cles[ids.indexOf(id)]), reputations: a.reputations.map((id) => cles[ids.indexOf(id)]) };
}

// ---------- La mesure ----------
const part = (cas: Cas, ordre: string[]) => {
  const vues = ordre.slice(0, MONTREES).map((k) => cas.ref[k]);
  const couv = vues.filter((x) => x.couverte);
  return { couvertes: couv.length, confirmees: couv.filter((x) => x.confirmee).length, part: couv.length ? couv.filter((x) => x.confirmee).length / couv.length : null };
};
const pct = (x: number | null) => (x == null ? 'n/a' : `${Math.round(x * 100)} %`);

async function main() {
  chargerTable();
  const cat = new Map<string, any>((await chargerCataloguePlein()).map((h: any) => [h.id, h]));
  const m = creerMoteur({ catalogue: [...cat.values()], stock: [] });
  mkdirSync(DOSSIER, { recursive: true });
  const fichierRef = resolve(DOSSIER, 'reference.json');
  if (PHASE === 'preparer') {
    const cas = await preparer(m);
    const contenu = `${JSON.stringify({ regle: 'voir l\'en-tête de scripts/eval-hop/ia4-banc.ts', exclus: [...EXCLUS], sources: ['hopsteiner.json (note ≥ 3 sur 5)', 'hopdatabase.json (descripteurs Yakima Chief)'], cas }, null, 1)}\n`;
    writeFileSync(fichierRef, contenu);
    console.log(`REFERENCE ÉCRITE : ${cas.length} cas, ${cas.filter((c) => c.houblons.length > MONTREES).length} avec plus de ${MONTREES} ex æquo ; sha256 ${createHash('sha256').update(contenu).digest('hex').slice(0, 16)}`);
    poserTypicite(null); return;
  }
  if (PHASE !== 'jouer') { console.error('--phase=preparer ou --phase=jouer --confirm-paid-ai'); process.exit(2); }
  requirePaidAiTestOptIn({ label: 'Gemini réel · ia4 · banc à l\'aveugle de l\'IA de Suggérer', command: 'npx vite-node scripts/eval-hop/ia4-banc.ts -- --phase=jouer --confirm-paid-ai' });
  if (!existsSync(fichierRef)) { console.error('reference.json manque : lancer d\'abord --phase=preparer. Aucun appel.'); process.exit(2); }
  const cas: Cas[] = JSON.parse(readFileSync(fichierRef, 'utf8')).cas;
  const cleApi = cleLocale();
  if (!cleApi) { console.error('Aucune clé Gemini locale (GEMINI_API_KEY ou functions/.secret.local) : aucun appel.'); process.exit(2); }
  const etat: { dernier: LiveCall | null } = { dernier: null };
  let courant = '';
  const reel = guardLiveFetch(fetch, { cap: ENVELOPPE.appels, reserve: reserver, onCall: (call) => { etat.dernier = call; ligne(call, `ia4-banc.ts · suggerer-v2 · ${courant}`, call.error ? `échec réseau (${call.error})` : `HTTP ${call.status}, ${call.latencyMs} ms, fin ${call.finishReason ?? 'non fournie'}`); } });
  const rows: any[] = []; let echecsDeSuite = 0, arret = false, total = 0;
  for (const c of cas) {
    if (arret) break;
    const d = DEMANDES.find((x) => x.famille === c.famille)!, mo = MOMENTS.find((x) => x.id === c.momentId)!;
    const { entree, cles } = entreeDe(c.style, c.style, recette(c.style), d, mo.ia, cat, c.houblons, dit);
    courant = `${c.style} · ${c.demande} · ${mo.nom} · ${cles.length} ex æquo`;
    let s: Sortie;
    try { s = await appeler(reel, cleApi, entree, cles, courant, etat); } catch (e) { s = { ok: false, erreur: (e as Error).message.slice(0, 100), ordre: [], phrases: {}, retirees: [], horsFiche: [], reputations: [], ms: 0, chfMicro: 0, tokens: null }; arret = /Budget|Enveloppe|Plafond/.test((e as Error).message); }
    total += s.chfMicro;
    echecsDeSuite = s.ok ? 0 : echecsDeSuite + 1; if (echecsDeSuite >= 2) arret = true;
    const moteur = part(c, ordreMoteur(c)), ia = s.ok ? part(c, s.ordre) : moteur;
    const mesurable = moteur.couvertes >= 2 && ia.couvertes >= 2;
    rows.push({ id: c.id, style: c.style, demande: c.demande, moment: c.moment, groupe: cles.length, ok: s.ok, erreur: s.erreur, ms: s.ms, tokens: s.tokens, chfMicro: s.chfMicro, moteur, ia, mesurable, ecart: mesurable ? (ia.part! - moteur.part!) : null,
      tete: { moteur: ordreMoteur(c).slice(0, MONTREES).map(idCourt), ia: (s.ok ? s.ordre : ordreMoteur(c)).slice(0, MONTREES).map(idCourt) }, retirees: s.retirees.length, horsFiche: s.horsFiche.length, reputations: s.reputations.length, phrases: s.phrases });
  }
  // ---- Ses six et sa neipa v3 : un seul passage, à la fin, en rapport ----
  let six: unknown = null;
  if (!arret) {
    const d = DEMANDES[0], mo = MOMENTS[0], g = exAequo(m, R22A, d.famille, mo.id);
    const scan = m.proposeVoies(R22A, { [d.famille]: 1 }, { tasting: null, assemblages: false, remplacements: false, moments: [mo.id], limit: BALAYAGE, buyLimit: BALAYAGE, perHop: 1 });
    const rang = (id: string) => { const l = [...new Set(scan.voies.filter((v: Voie) => v.type === 'ajouter' && v.actions[0].moment === mo.id).map((v: Voie) => idCourt(v.actions[0].hopKey)))]; const i = l.indexOf(id); return i < 0 ? null : i + 1; };
    if (g.length >= MIN_GROUPE) {
      const houblons = g.map((v) => v.actions[0].hopKey);
      const { entree, cles } = entreeDe('22A', 'Double IPA', R22A, d, mo.ia, cat, houblons, dit);
      courant = `neipa v3 · ${d.nom} · ${mo.nom} · ${cles.length} ex æquo (rapport final)`;
      const s = await appeler(reel, cleApi, entree, cles, courant, etat); total += s.chfMicro;
      six = { groupe: cles.map(idCourt), ordreIA: s.ok ? s.ordre.map(idCourt) : null, erreur: s.erreur, ses_six: SES_SIX.map((id) => ({ id, rangMoteurBalayage: rang(id), dansLeGroupe: cles.map(idCourt).indexOf(id) + 1 || null, rangIA: s.ok ? s.ordre.map(idCourt).indexOf(id) + 1 || null : null })), phrases: Object.fromEntries(Object.entries(s.phrases).map(([k, p]) => [idCourt(k), p])), retirees: s.retirees.length, horsFiche: s.horsFiche.length };
    } else six = { groupe: [], note: `pas de groupe d'au moins ${MIN_GROUPE} ex æquo : l'IA n'est pas appelée`, ses_six: SES_SIX.map((id) => ({ id, rangMoteurBalayage: rang(id) })) };
  }
  // ---- La règle de décision ----
  const mes = rows.filter((r) => r.mesurable), ecarts: number[] = mes.map((r) => r.ecart);
  const moyenne = ecarts.length ? ecarts.reduce((a, b) => a + b, 0) / ecarts.length : null, pire = ecarts.length ? Math.min(...ecarts) : null;
  const ecartsTous = rows.map((r) => (r.mesurable ? r.ecart : 0));
  const decision = { casJoues: rows.length, casPrevus: cas.length, mesurables: mes.length, moyenneEcartPoints: moyenne == null ? null : Math.round(moyenne * 1000) / 10, piorCasPoints: pire == null ? null : Math.round(pire * 1000) / 10,
    moyenneTousCasInvalidesA0: Math.round((ecartsTous.reduce((a, b) => a + b, 0) / Math.max(1, ecartsTous.length)) * 1000) / 10,
    allume: moyenne != null && moyenne >= 0.10 && pire != null && pire >= -0.25, invalides: rows.filter((r) => !r.ok).length,
    phrasesRetirees: rows.reduce((s, r) => s + r.retirees, 0), phrasesHorsFiche: rows.reduce((s, r) => s + r.horsFiche, 0), phrasesReputation: rows.reduce((s, r) => s + r.reputations, 0), phrasesGardees: rows.reduce((s, r) => s + Object.keys(r.phrases).length, 0),
    sousEnsemblePlusDe4: (() => { const x = mes.filter((r) => r.groupe > MONTREES).map((r) => r.ecart as number); return { n: x.length, moyennePoints: x.length ? Math.round((x.reduce((a, b) => a + b, 0) / x.length) * 1000) / 10 : null }; })(),
    msMediane: (() => { const x = rows.filter((r) => r.ms).map((r) => r.ms).sort((a, b) => a - b); return x.length ? x[x.length >> 1] : null; })(), totalChf: Math.round(total) / 1e6 };
  const SUFFIXE = ESSAI ? `-${MODELE}-${REFLEXION}` : '';
  writeFileSync(resolve(DOSSIER, `resultats${SUFFIXE}.json`), `${JSON.stringify({ modele: MODELE, reflexion: REFLEXION, decision, rows, six }, null, 1)}\n`);
  const tab = ['| Cas | Groupe | Moteur : confirmées / couvertes | IA : confirmées / couvertes | Écart | Phrases : gardées / retirées / Réputation | ms |', '|---|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.style} · ${r.demande} · ${r.moment} | ${r.groupe} | ${r.moteur.confirmees}/${r.moteur.couvertes} (${pct(r.moteur.part)}) | ${r.ok ? `${r.ia.confirmees}/${r.ia.couvertes} (${pct(r.ia.part)})` : `invalide : ${r.erreur}`} | ${r.mesurable ? `${r.ecart >= 0 ? '+' : ''}${Math.round(r.ecart * 100)}` : 'non mesurable'} | ${Object.keys(r.phrases).length} / ${r.retirees} / ${r.reputations} | ${r.ms} |`)].join('\n');
  writeFileSync(resolve(DOSSIER, `tableau${SUFFIXE}.md`), `${tab}\n\n${JSON.stringify(decision)}\n`);
  console.log(tab); console.log(JSON.stringify(decision, null, 1)); console.log(`Ses six / neipa v3 : ${JSON.stringify(six)}`);
  console.log(`Règle : moyenne ≥ +10 points ET pire cas ≥ −25 points → ${decision.allume ? 'L\'IA MÉRITE D\'ÊTRE ALLUMÉE' : 'L\'IA RESTE ÉTEINTE'} (le pilote décide)`);
  console.log(`Total : ${decision.totalChf.toFixed(4)} CHF`);
  if (rows.length === cas.length && !arret && existsSync(JOURNAL) && readFileSync(JOURNAL, 'utf8').includes(SECTION)) console.log('IA4-BANC-OK');
  else console.log(`IA4-BANC-ARRET : ${rows.length}/${cas.length} cas joués`);
  poserTypicite(null);
}
void main();
