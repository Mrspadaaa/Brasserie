/**
 * Banc t2b (mission 2026-11-14-gemini4, tour 2) : tâches courtes d'`aiTask` qui servent Flash-Lite en production (COA de houblon `readHopCoa`,
 * diagnostic `diagnoseBatch`, recherche `lookup_brewing_reference`), comparées à 3.8, Hydrogen, Argon et Carbon.
 * Les corps d'appel, la vérité et les critères sont CEUX du banc d'usage #91 (`gemini-usage-bench.ts`, importé : une seule écriture) ; les cas de
 * diagnostic neufs sont dans `work/missions/2026-11-14-gemini4/voies/t2b/cas-diag-t2b.json` (vérité écrite avant toute passe).
 *
 *   npx vite-node --config vitest.config.ts scripts/banc-t2b-taches.ts -- --usage diag --cells lite@low,3.8@low,hydrogen@low --simuler
 *   npx vite-node --config vitest.config.ts scripts/banc-t2b-taches.ts -- --usage coa --cells lite@minimal,hydrogen@low --tirages 1 --payant --confirm-paid-ai
 *   npx vite-node --config vitest.config.ts scripts/banc-t2b-taches.ts -- --usage diag --tableau [--moitie choisir|juger]
 * Options : --cases a,b  --tirages N  --moitie choisir|juger (diag)  --plafond-passe CHF (défaut 0,6)  --plafond-voie CHF (5)  --plafond-cumul CHF (14,5)
 *           --journal <fichier>  --out <dossier>. HTTP 429 : arrêt net. Clé : `readLocalKey` (jamais affichée).
 * Réflexion : `lite@minimal|low`, `3.8@low|medium|high`, `hydrogen@low|medium|high|xhigh`, `argon@…`, `carbon@…` (pas de minimal hors Flash-Lite).
 */
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { GEMINI_SEARCH_COST_POLICY, observedGeminiCostDetails, observedGeminiSearchQueries } from '../functions/src/geminiCosts';
import { encodeGeminiToolsForRest } from '../functions/src/geminiRequestSchema';
import { geminiAnswerText, unusableGeminiOutput } from '../functions/src/geminiResponse';
import { TARIFS_GEMINI4, coutObserveBanc, devisBanc, estGemini4, reserveGemini4 } from './banc-lecture-modeles';
import { readLocalKey } from './gemini-usage-bench-guard.mjs';

type Json = Record<string, any>;
const VOIE = 't2b';
const DOSSIER = 'work/missions/2026-11-14-gemini4';
const MODELES: Record<string, string> = { lite: 'gemini-3.5-flash-lite', '3.8': 'gemini-3.8-flash', hydrogen: 'gemini-4-hydrogen', argon: 'gemini-4-argon', carbon: 'gemini-4-carbon' };
const NIVEAUX_BASE = ['low', 'medium', 'high'];
export interface Cellule { label: string; model: string; level: string }
export function parseCellule(texte: string): Cellule {
  const [nom, niveau = ''] = texte.trim().split('@'), model = MODELES[nom], level = niveau.toLowerCase();
  if (!model) throw new Error(`Cellule « ${texte} » : modèle inconnu (${Object.keys(MODELES).join(', ')}).`);
  const permis = nom === 'lite' ? ['minimal', 'low', 'medium', 'high'] : nom === 'hydrogen' ? [...NIVEAUX_BASE, 'xhigh'] : NIVEAUX_BASE;
  if (!permis.includes(level)) throw new Error(`Cellule « ${texte} » : niveaux acceptés ${permis.join(', ')} (« minimal » n'existe que sur Flash-Lite).`);
  return { label: `${nom}@${level}`, model, level };
}

/** La somme de la colonne « coût CHF » de toutes les lignes du journal du tour (toutes voies), colonne repérée par la dernière ligne d'en-tête vue. */
export function lireCumul(texte: string): number {
  let colonne = -1, total = 0;
  for (const ligne of texte.split(/\r?\n/)) {
    if (!ligne.startsWith('|')) continue;
    const cases = ligne.split('|').slice(1, -1).map(c => c.trim());
    const entete = cases.findIndex(c => /^co[uû]t( chf)?$/i.test(c));
    if (entete >= 0) { colonne = entete; continue; }
    const valeur = Number(String(cases[colonne] ?? '').replace(',', '.'));
    if (colonne >= 0 && Number.isFinite(valeur) && !/^-+$/.test(cases[colonne] ?? '')) total += valeur;
  }
  return total;
}

export interface Mesure { cell: string; cas: string; tirage: number; ok: boolean; ms: number; entree: number | null; sortie: number | null; reflexion: number | null; chf: number | null; score: number | null; critique: boolean; detail: string; erreur?: string }
const quantile = (valeurs: number[], q: number) => { if (!valeurs.length) return null; const s = [...valeurs].sort((a, b) => a - b), at = (s.length - 1) * q, lo = Math.floor(at), hi = Math.ceil(at); return s[lo] + (s[hi] - s[lo]) * (at - lo); };
/** Une ligne par cellule : `| réglage | qualité | inutilisables | p50 s | p90 s | CHF/appel | appels |` (le verdict reste au juge, jamais au script). */
export function tableau(mesures: Mesure[]): string {
  const cellules = [...new Set(mesures.map(m => m.cell))];
  const f = (v: number | null, d = 1) => v === null ? '—' : v.toFixed(d).replace('.', ',');
  const lignes = cellules.map(cell => {
    const mm = mesures.filter(m => m.cell === cell), bons = mm.filter(m => m.ok && m.score !== null), coutes = mm.filter(m => m.chf !== null);
    const qualite = bons.length ? bons.reduce((s, m) => s + (m.score as number), 0) / mm.length : 0;
    return `| ${cell} | ${f(qualite * 100, 0)} % (${bons.filter(m => m.critique).length} critique) | ${mm.length - bons.length}/${mm.length} | ${f(quantile(mm.filter(m => m.ok).map(m => m.ms / 1000), 0.5))} | ${f(quantile(mm.filter(m => m.ok).map(m => m.ms / 1000), 0.9))} | ${coutes.length ? f(coutes.reduce((s, m) => s + (m.chf as number), 0) / coutes.length, 4) : '—'} | ${mm.length} |`;
  });
  return ['| réglage | qualité (inutilisable = 0) | inutilisables | p50 s | p90 s | CHF/appel | appels |', '|---|---|---|---|---|---|---|', ...lignes].join('\n');
}

const ressortie = (texte: string) => JSON.parse(texte.replace(/```json/g, '').replace(/```/g, '').trim());
export function noteDe(criteres: Array<{ weight: number; critical: boolean; value: number | null; id: string }>): { score: number; critique: boolean; detail: string } {
  const comptes = criteres.filter(c => c.value !== null), poids = comptes.reduce((s, c) => s + c.weight, 0);
  const score = poids ? comptes.reduce((s, c) => s + c.weight * (c.value as number), 0) / poids : 1;
  const rates = comptes.filter(c => (c.value as number) < 1).map(c => c.id);
  return { score, critique: comptes.some(c => c.critical && (c.value as number) < 1), detail: rates.join(',') };
}

// Recherche : deux cas BJCP de plus (vérité écrite avant les passes : BJCP 2021, 5B Kölsch et 21A American IPA) ; les deux cas du banc #91 sont repris.
const CAS_RECHERCHE_PLUS = [
  { id: 'recherche-kolsch', usage: 'recherche', query: 'BJCP 2021, style 5B Kölsch : plages officielles d’IBU et de densité initiale (OG)', expected: { patterns: ['18\\D{1,8}30', '1[.,]044\\D{1,10}1[.,]050'], sourceDomain: 'bjcp', truth: 'BJCP Style Guidelines 2021, 5B Kölsch' } },
  { id: 'recherche-ipa', usage: 'recherche', query: 'BJCP 2021, style 21A American IPA : plages officielles d’IBU et de densité initiale (OG)', expected: { patterns: ['40\\D{1,8}70', '1[.,]056\\D{1,10}1[.,]070'], sourceDomain: 'bjcp', truth: 'BJCP Style Guidelines 2021, 21A American IPA' } }
];

async function main() {
  const args = process.argv.slice(2).filter(a => a !== '--');
  const val = (flag: string) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const usage = val('--usage');
  if (!usage || !['coa', 'diag', 'recherche'].includes(usage)) throw new Error('--usage coa|diag|recherche');
  const out = val('--out') ?? `${DOSSIER}/voies/${VOIE}/sorties`;
  mkdirSync(out, { recursive: true });
  const fichier = path.join(out, `${usage}.jsonl`);
  const lire = (): Mesure[] => existsSync(fichier) ? readFileSync(fichier, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
  if (args.includes('--tableau')) {
    const cas = new Map<string, string>(JSON.parse(readFileSync(`${DOSSIER}/voies/${VOIE}/cas-diag-t2b.json`, 'utf8')).map((c: Json) => [c.id, c.moitie]));
    const moitie = val('--moitie');
    console.log(tableau(lire().filter(m => !moitie || usage !== 'diag' || cas.get(m.cas) === moitie)));
    return;
  }
  const simuler = !args.includes('--payant');
  if (!simuler && !args.includes('--confirm-paid-ai')) throw new Error('Appels payants : ajouter --confirm-paid-ai.');
  const cellules = (val('--cells') ?? '').split(',').filter(Boolean).map(parseCellule);
  if (!cellules.length) throw new Error('--cells lite@low,3.8@low,hydrogen@low …');
  const tirages = Number(val('--tirages') ?? 1), plafondPasse = Number(val('--plafond-passe') ?? 0.6), plafondVoie = Number(val('--plafond-voie') ?? 5), plafondCumul = Number(val('--plafond-cumul') ?? 14.5);
  const journal = val('--journal') ?? (simuler ? path.join(mkdtempSync(path.join(tmpdir(), 'banc-t2b-')), 'journal.md') : `${DOSSIER}/journal-tour2.md`);
  if (!existsSync(journal)) appendFileSync(journal, '# Journal du tour 2 (Gemini 4 ailleurs dans l\'app)\n\nUne ligne par appel ; coûts au tarif provisionné de `geminiCosts.ts`. Les voies ajoutent sans réécrire.\n\n| date | voie | usage | cellule | cas | tirage | durée | entrée | sortie | coût CHF | état |\n|---|---|---|---|---|---|---|---|---|---|---|\n');

  // Le banc d'usage #91 : son `main` ne tourne que hors Vitest (variable posée le temps de l'import).
  const avant = process.env.VITEST; process.env.VITEST = '1';
  const bench = await import('./gemini-usage-bench');
  if (avant === undefined) delete process.env.VITEST;
  const def = bench.USAGES.find((u: Json) => u.id === (usage === 'diag' ? 'diagnostic' : usage === 'coa' ? 'coa' : 'recherche'));
  if (!def) throw new Error('Usage inconnu du banc #91.');
  const brut = JSON.parse(readFileSync('tests/fixtures/gemini-usage-bench/cases.json', 'utf8'));
  const base: Json[] = Array.isArray(brut) ? brut : brut.cases;
  let cas: Json[] = usage === 'diag' ? JSON.parse(readFileSync(`${DOSSIER}/voies/${VOIE}/cas-diag-t2b.json`, 'utf8')) : base.filter(c => c.usage === def.id);
  if (usage === 'diag') cas = [...cas, ...base.filter(c => c.usage === 'diagnostic').map(c => ({ ...c, moitie: 'choisir' }))];
  if (usage === 'recherche') cas = [...cas, ...CAS_RECHERCHE_PLUS];
  if (val('--cases')) cas = cas.filter(c => val('--cases')!.split(',').includes(c.id));
  if (val('--moitie')) cas = cas.filter(c => c.moitie === val('--moitie'));

  if (usage === 'recherche') {
    const { researchBrewing } = await import('../functions/src/brewerResearch');
    for (const c of cas) {
      await researchBrewing('lookup_brewing_reference', c.query, 1, async (corps: Json) => { c.captured = corps; throw new Error('capture'); }, AbortSignal.timeout(10_000)).catch(() => undefined);
      if (!c.captured) throw new Error(`Capture du chercheur impossible pour ${c.id}.`);
    }
  }
  const cle = simuler ? 'cle-simulee' : readLocalKey();
  if (!cle) throw new Error('Clé Gemini absente (functions/.secret.local).');

  let depense = 0;
  const gardes = (reserve: number) => {
    const cumul = lireCumul(readFileSync(journal, 'utf8')), voie = lireCumulVoie(readFileSync(journal, 'utf8'));
    if (cumul + reserve > plafondCumul) throw new Error(`Arrêt : cumul du tour ${cumul.toFixed(3)} CHF + réserve ${reserve.toFixed(3)} dépasse ${plafondCumul}.`);
    if (voie + reserve > plafondVoie) throw new Error(`Arrêt : voie ${voie.toFixed(3)} CHF + réserve ${reserve.toFixed(3)} dépasse ${plafondVoie}.`);
    if (depense + reserve > plafondPasse) throw new Error(`Arrêt : passe ${depense.toFixed(3)} CHF + réserve ${reserve.toFixed(3)} dépasse ${plafondPasse}.`);
  };
  for (const cell of cellules) for (const c of cas) for (let tirage = 1; tirage <= tirages; tirage++) {
    const corps: Json = usage === 'recherche'
      ? { ...c.captured, tools: encodeGeminiToolsForRest(c.captured.tools), generationConfig: { ...c.captured.generationConfig, thinkingConfig: { thinkingLevel: cell.level } } }
      : bench.aiTaskBody(usage === 'diag' ? 'diagnoseBatch' : 'readHopCoa', c as any, cell.level as any, 0);
    // Les modèles 4 et la 3.8 pensent dans le plafond de sortie : 8 000 (Flash-Lite garde celui de la production).
    if (cell.model !== MODELES.lite) corps.generationConfig = { ...corps.generationConfig, maxOutputTokens: Math.max(8000, corps.generationConfig?.maxOutputTokens ?? 0) };
    const devis = devisBanc(cell.model, corps);
    // La réserve du garde-fou de la production prend tout le contexte du modèle pour un PDF ou une image (≈ 2 CHF) : ici elle est bornée à 0,08 CHF
    // (les appels réels de ces trois usages coûtent 0,001 à 0,03 CHF), et le coût relu de chaque réponse s'ajoute au journal.
    const reserve = Math.min(0.08, (estGemini4(cell.model) ? reserveGemini4(cell.model, corps.generationConfig.maxOutputTokens, devis.inputTokens) : devis.reservedMicroChf) / 1e6);
    gardes(reserve);
    const debut = Date.now();
    let reponse: Json | undefined, erreur: string | undefined, statut = 200;
    try {
      if (simuler) reponse = { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: usage === 'recherche' ? 'Simulé.' : '{}' }] } }], usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 200, thoughtsTokenCount: 50, totalTokenCount: 1250 } };
      else {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${cell.model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle }, body: JSON.stringify(corps), signal: AbortSignal.timeout(90_000) });
        statut = res.status; reponse = await res.json().catch(() => ({}));
        if (!res.ok) erreur = `HTTP ${res.status} ${String(reponse?.error?.message ?? '').slice(0, 160).replace(cle, '«clé»')}`;
      }
    } catch (e: any) { erreur = `${e?.name ?? 'Erreur'} : ${String(e?.message ?? e).slice(0, 120)}`; }
    const ms = Date.now() - debut, usageMeta = reponse?.usageMetadata;
    // Coût : jetons au tarif du modèle ; recherche : les requêtes prouvées (sinon la provision), au tarif de recherche de la production, supposé égal pour les modèles 4.
    let micro: number | null = null;
    if (reponse && usageMeta) {
      if (estGemini4(cell.model)) {
        const jetons = coutObserveBanc(devis, reponse), requetes = observedGeminiSearchQueries(devis, reponse) ?? devis.searchQueriesReserved;
        micro = jetons ? jetons.chargedMicroChf + requetes * GEMINI_SEARCH_COST_POLICY.microChfPerQuery : null;
      } else micro = observedGeminiCostDetails(devis, reponse)?.chargedMicroChf ?? null;
    }
    const chf = micro === null ? null : micro / 1e6;
    if (chf !== null) depense += chf; else if (reponse && !erreur) depense += reserve;
    let mesure: Mesure = { cell: cell.label, cas: c.id, tirage, ok: false, ms, entree: usageMeta?.promptTokenCount ?? null, sortie: usageMeta?.candidatesTokenCount ?? null, reflexion: usageMeta?.thoughtsTokenCount ?? null, chf, score: null, critique: false, detail: '', erreur };
    if (!erreur && reponse) {
      try {
        const inutilisable = unusableGeminiOutput(reponse);
        if (inutilisable) throw inutilisable;
        let resultat: unknown;
        if (usage === 'recherche') {
          const texte = (reponse.candidates?.[0]?.content?.parts ?? []).filter((p: Json) => typeof p.text === 'string' && !p.thought).map((p: Json) => p.text).join('\n').slice(0, 4500);
          const sources = (reponse.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []).filter((k: Json) => String(k.web?.uri ?? '').startsWith('https://')).map((k: Json) => ({ title: String(k.web?.title ?? ''), url: k.web.uri }));
          resultat = { text: texte, sources };
        } else { const brut = geminiAnswerText(reponse); if (!brut) throw new Error('Aucun contenu.'); resultat = ressortie(brut); }
        const note = noteDe(def.score(c as any, resultat));
        mesure = { ...mesure, ok: true, score: note.score, critique: note.critique, detail: note.detail };
      } catch (e: any) { mesure.erreur = String(e?.message ?? e).slice(0, 160); }
    }
    appendFileSync(fichier, `${JSON.stringify(mesure)}\n`);
    appendFileSync(journal, `| ${new Date().toISOString().slice(0, 19).replace('T', ' ')} | ${VOIE} | ${usage} | ${cell.label} | ${c.id} | ${tirage} | ${ms} ms | ${mesure.entree ?? '—'} | ${mesure.sortie ?? '—'}+${mesure.reflexion ?? 0} | ${chf === null ? '0.000000' : chf.toFixed(6)} | ${erreur ? erreur.slice(0, 40) : mesure.ok ? 'STOP' : 'INUTILISABLE'} |\n`);
    if (statut === 429) throw new Error('HTTP 429 : arrêt net, rien relancé.');
  }
  console.log(`Passe finie : ${depense.toFixed(4)} CHF. Journal : ${journal}\n${tableau(lire())}`);
}

/** Le cumul des seules lignes de cette voie (colonne « voie » = t2b). */
export function lireCumulVoie(texte: string): number {
  const lignes = texte.split(/\r?\n/).filter(l => new RegExp(`^\\|[^|]*\\|\\s*${VOIE}\\s*\\|`).test(l));
  return lireCumul(`| coût CHF |\n${lignes.map(l => `| ${l.split('|').slice(1, -1)[9]?.trim() ?? '0'} |`).join('\n')}`);
}

if (!process.env.VITEST) main().catch(e => { console.error(`✗ ${e instanceof Error ? e.message : String(e)}`); process.exit(1); });
