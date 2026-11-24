/**
 * Banc permanent de la lecture des liens du Carnet (D446, 23.11) : les liens réels du banc, leur vérité écrite (page ouverte dans
 * Chrome, champ par champ) et la page telle que le serveur l'a reçue (agent `LaffineeCarnet/1.0`). Rejouable SANS réseau ni app :
 * `lireLien` lit chaque page capturée par un `fetch` simulé qui rejoue les réponses enregistrées (statuts, redirections, défi
 * Cloudflare). Comme le banc des factures (skill banc-lecture) : on le mesure avant et après chaque changement.
 *
 *   npx tsx scripts/banc-liens.ts [--etiquette avant] [--detail] [--seul 3,17]
 *
 * Sortie : le tableau par lien (= juste, ✗ faux, · absent honnête, ? manquant), les taux par champ et le nombre d'inventions ;
 * `banc-liens/mesures/<etiquette>.json` garde tout. Aucun appel Gemini ici : la cascade IA est mesurée à part (budget, journal).
 * Les cours de change sont simulés (taux fixes) : le banc ne dépend ni du jour ni du réseau.
 */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { lireLien } from '../functions/src/lireLien';
import { LIEN_IA_SCHEMA, type AppelIA, type ReponseIA } from '../functions/src/lienIA';
import { geminiBody } from '../functions/src/geminiBody';
import { geminiAnswerText } from '../functions/src/geminiResponse';
import { observedGeminiCostDetails, quoteGeminiCost } from '../functions/src/geminiCosts';
import { GEMINI_LITE_MODEL, INVOICE_STRONG_MODEL, LIEN_NEON_MODEL } from '../functions/src/models';

/** Cours fixes du banc (ordre de grandeur du 23.11) : le banc ne dépend ni du jour ni du réseau. */
const COURS_FIXES: Record<string, number> = { EUR: 0.93, GBP: 1.06, AUD: 0.52, USD: 0.8 };
const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const BANC = path.join(ROOT, 'work/missions/2026-11-23-carnet-en-ligne/banc-liens');

type Saut = { url: string; status?: number; cf?: string | null; type?: string | null; loc?: string | null; erreur?: string; ms?: number };
type Capture = { n: number; lien: string; sauts: Saut[] };
export interface Verite {
  n: number; lien: string; genres: string[]; acces: 'ouvert' | 'bloque'; statut?: string;
  nom: { exact: string | null; doitContenir: string[] };
  prix: number | null; prixInconnu?: boolean; devise: string | null; ttc: boolean | null; prixTTC?: number; prixDes?: boolean;
  photo: boolean; caract: Array<{ nom: string; valeur: string }>; dispo: string | null;
  livraisonCH: { prix: number; devise: string } | 'gratuite' | 'refusee' | null;
  /** PX (24.11, R39 à R41) : la quantité à laquelle le prix lu se rapporte, les conditionnements publiés et, pour un prix donné à l'unité, ce prix et ses paliers. */
  conditionnement?: { valeur: number; unite: string };
  offres?: Array<{ valeur: number; unite: string; prix: number }>;
  prixParUnite?: { prix: number; unite: string; paliers?: Array<{ des: number; prix: number }> };
}

export function verites(): Verite[] {
  const lire = (f: string) => fs.existsSync(path.join(BANC, f)) ? JSON.parse(fs.readFileSync(path.join(BANC, f), 'utf8')) as Verite[] : [];
  return [...lire('verite-base.json'), ...lire('verite-ajout.json')].sort((a, b) => a.n - b.n);
}
function captures(): Map<number, Capture> {
  const m = new Map<number, Capture>();
  for (const f of ['capture.json', 'capture-ajout.json']) {
    const p = path.join(BANC, 'pages', f);
    if (!fs.existsSync(p)) continue;
    for (const c of (JSON.parse(fs.readFileSync(p, 'utf8')).pages as Capture[])) if (c) m.set(c.n, c);
  }
  return m;
}

/** Un `fetch` qui rejoue la capture d'un lien : chaque adresse rend son statut enregistré ; robots.txt absent (404, permis). */
export function fetchRejoue(c: Capture, n: number): typeof fetch {
  const html = (() => { const f = path.join(BANC, 'pages', `${String(n).padStart(2, '0')}.html.gz`); return fs.existsSync(f) ? zlib.gunzipSync(fs.readFileSync(f)) : null; })();
  const sansDiese = (u: string) => u.replace(/#.*$/, '');
  return (async (input: string | URL | Request) => {
    const u = sansDiese(String(input instanceof Request ? input.url : input));
    if (new URL(u).pathname === '/robots.txt') return new Response('', { status: 404 });
    const i = c.sauts.findIndex((s) => sansDiese(s.url) === u);
    const s = i >= 0 ? c.sauts[i] : undefined;
    if (!s) return new Response('', { status: 404 });
    if (s.erreur) throw Object.assign(new TypeError('fetch failed'), { cause: { code: s.erreur } });
    const h = new Headers();
    if (s.type) h.set('content-type', s.type);
    if (s.cf) h.set('cf-mitigated', s.cf);
    if (s.loc) h.set('location', s.loc);
    const dernier = i === c.sauts.length - 1;
    return new Response(dernier && html && s.status !== 204 ? html : null, { status: s.status ?? 500, headers: h });
  }) as typeof fetch;
}

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[\s ]+/g, ' ').trim();
const proche = (a: number | undefined, b: number | undefined) => a !== undefined && b !== undefined && Math.abs(a - b) <= Math.max(0.01, b * 0.005);
const chiffres = (t: string) => (norm(t).match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => x.replace(',', '.').replace(/\.0+$/, ''));

type Note = '=' | '✗' | '·' | '?' | '';
export interface Ligne { ia?: { chf: number; ms: number; appels: number; inconnus: number }; sansJsonLd?: boolean; n: number; genres: string[]; statut: string; nom: Note; prix: Note; photo: Note; caract: Note; ttc: Note; livraison: Note; /** conditionnement du prix (R39) : « = » dit et juste, « ? » non dit, « ✗ » faux ; vide : la vérité n'en attend pas */ cond: Note; inventions: string[]; ms: number; lu: unknown }

/** R39 : le prix lu porte sa quantité. Juste = le conditionnement du prix, chaque offre publiée et, si la page donne un prix à l'unité, ce prix et ses paliers. */
function noterCond(v: Verite, l: any): { note: Note; faux: string[] } {
  if (!v.conditionnement && !v.offres?.length && !v.prixParUnite) return { note: '', faux: [] };
  const faux: string[] = [];
  const c = l?.conditionnement as { valeur: number; unite: string } | undefined;
  if (v.conditionnement) {
    if (!c) return { note: '?', faux };
    if (!(proche(c.valeur, v.conditionnement.valeur) && c.unite === v.conditionnement.unite)) faux.push(`conditionnement ${c.valeur} ${c.unite}`);
  }
  const lues: Array<{ valeur: number; unite: string; prix: number }> = l?.offres ?? [];
  let manque = false;
  for (const o of v.offres ?? []) {
    const m = lues.find((x) => x.unite === o.unite && proche(x.valeur, o.valeur));
    if (!m) manque = true; else if (!proche(m.prix, o.prix)) faux.push(`offre ${o.valeur} ${o.unite} à ${m.prix}`);
  }
  if (v.prixParUnite) {
    const u = l?.prixUnite as { prix: number; unite: string; paliers?: Array<{ des: number; prix: number }> } | undefined;
    if (!u) manque = true;
    else if (!(u.unite === v.prixParUnite.unite && proche(u.prix, v.prixParUnite.prix))) faux.push(`prix à l'unité ${u.prix}/${u.unite}`);
    else for (const p of v.prixParUnite.paliers ?? []) { const m = (u.paliers ?? []).find((x) => proche(x.des, p.des)); if (!m) manque = true; else if (!proche(m.prix, p.prix)) faux.push(`palier ${p.des} à ${m.prix}`); }
  }
  return { note: faux.length ? '✗' : manque ? '?' : '=', faux };
}

/** Note une lecture contre sa vérité. « = » juste et rempli, « · » absent honnête, « ? » manquant, « ✗ » faux (= invention). */
export function noter(v: Verite, l: any, ms = 0): Ligne {
  const inventions: string[] = [];
  const nomLu: string | undefined = l?.nom;
  let nom: Note;
  if (!v.nom.exact && !v.nom.doitContenir.length) nom = nomLu ? '✗' : '·';
  else if (!nomLu) nom = '?';
  else nom = v.nom.doitContenir.every((m) => norm(nomLu).includes(norm(m))) ? '=' : '✗';
  if (nom === '✗' && (!v.nom.exact && !v.nom.doitContenir.length)) inventions.push('nom');

  let prix: Note;
  const p = l?.prix as number | undefined, dev = l?.devise as string | undefined, ht = l?.taxe === 'ht';
  if (v.prix === null) prix = v.prixInconnu ? (p === undefined ? '?' : '') : p === undefined ? '·' : '✗';
  else if (p === undefined) prix = '?';
  else {
    const devOk = !v.devise || dev === v.devise;
    // Prix HT publié : juste s'il est dit HT, ou si le TTC publié est rendu (prixTTC écrit, sinon HT × (1 + un taux de TVA courant)).
    const ttcPossibles = v.prixTTC !== undefined ? [v.prixTTC] : [0.081, 0.077, 0.026, 0.19, 0.2].map((t) => Math.round(v.prix! * (1 + t) * 100) / 100);
    // Variantes à prix différents : « dès » le plus bas des variantes est juste (jamais une variante choisie à sa place).
    const vars = (v as any).variantes as Array<{ prix: number | null }> | null | undefined;
    const prixVars = (vars ?? []).map((x) => x.prix).filter((x): x is number => typeof x === 'number');
    const desJuste = l?.prixDes === true && prixVars.length > 1 && proche(p, Math.min(...prixVars));
    const ok = desJuste || (v.ttc === false ? (ht && proche(p, v.prix)) || (!ht && ttcPossibles.some((t) => proche(p, t))) : proche(p, v.prix) && !ht);
    prix = devOk && ok ? '=' : '✗';
  }
  if (prix === '✗') inventions.push(`prix ${p} ${dev ?? ''}${ht ? ' HT' : ''}`);

  const photos: string[] = l?.photos ?? (l?.photo ? [l.photo] : []);
  const fausses = photos.filter((u) => /no-?image|placeholder|blank\.(?:gif|png)|spacer/i.test(u) || !/^https:\/\//.test(u));
  let photo: Note = v.photo ? (photos.length && !fausses.length ? '=' : photos.length ? '✗' : '?') : photos.length ? '✗' : '·';
  if (photo === '✗') inventions.push('photo');

  const valeurs: Array<{ nom: string; valeur: string; unite?: string }> = l?.valeurs ?? [];
  let caract: Note = '';
  if (v.caract.length) {
    const trouve = v.caract.filter((c) => {
      const attendus = chiffres(c.valeur);
      return valeurs.some((x) => {
        const texte = `${x.nom} ${x.valeur} ${x.unite ?? ''}`;
        const lus = chiffres(texte);
        return attendus.length ? attendus.every((a) => lus.includes(a)) : norm(texte).includes(norm(c.valeur));
      });
    }).length;
    caract = trouve * 2 >= v.caract.length ? '=' : '?';
  } else if (valeurs.length) caract = '·';

  let ttc: Note = '';
  if (v.ttc === false && p !== undefined) ttc = prix === '=' ? '=' : '✗';

  let livraison: Note = '';
  const liv = l?.livraison as { prix?: number; devise?: string; gratuite?: boolean; refusee?: boolean } | undefined;
  if (v.livraisonCH === null) livraison = liv ? '' : '·';
  else if (!liv) livraison = '?';
  else if (v.livraisonCH === 'gratuite') livraison = liv.gratuite || liv.prix === 0 ? '=' : '✗';
  else if (v.livraisonCH === 'refusee') livraison = liv.refusee ? '=' : '✗';
  else livraison = proche(liv.prix, v.livraisonCH.prix) && liv.devise === v.livraisonCH.devise ? '=' : '✗';
  if (livraison === '✗') inventions.push('livraison');

  const cond = noterCond(v, l);
  inventions.push(...cond.faux);
  return { n: v.n, genres: v.genres, statut: l?.statut ?? '?', nom, prix, photo, caract, ttc, livraison, cond: cond.note, inventions, ms, lu: l };
}

export function taux(lignes: Ligne[], verite: Map<number, Verite>) {
  const pct = (a: number, b: number) => `${a}/${b} (${b ? Math.round((a / b) * 100) : 0} %)`;
  const avec = (f: (v: Verite) => boolean) => lignes.filter((l) => f(verite.get(l.n)!));
  const prixAttendu = avec((v) => v.prix !== null), photoAttendue = avec((v) => v.photo), caractAttendues = avec((v) => v.caract.length > 0);
  const ttcFaux = avec((v) => v.ttc === false), livraisons = avec((v) => v.livraisonCH !== null);
  return {
    liens: lignes.length,
    prixSansJsonLd: pct(prixAttendu.filter((l) => l.sansJsonLd && l.prix === '=').length, prixAttendu.filter((l) => l.sansJsonLd).length),
    caracteristiquesSansJsonLd: pct(caractAttendues.filter((l) => l.sansJsonLd && l.caract === '=').length, caractAttendues.filter((l) => l.sansJsonLd).length),
    photoSansJsonLd: pct(photoAttendue.filter((l) => l.sansJsonLd && l.photo === '=').length, photoAttendue.filter((l) => l.sansJsonLd).length),
    nom: pct(lignes.filter((l) => l.nom === '=' || l.nom === '·').length, lignes.length),
    prixAffiche: pct(prixAttendu.filter((l) => l.prix === '=').length, prixAttendu.length),
    photoAffichee: pct(photoAttendue.filter((l) => l.photo === '=').length, photoAttendue.length),
    caracteristiques: pct(caractAttendues.filter((l) => l.caract === '=').length, caractAttendues.length),
    htDit: pct(ttcFaux.filter((l) => l.ttc === '=').length, ttcFaux.length),
    livraisonCH: pct(livraisons.filter((l) => l.livraison === '=').length, livraisons.length),
    conditionnement: pct(lignes.filter((l) => l.cond === '=').length, lignes.filter((l) => l.cond !== '').length),
    inventions: lignes.reduce((s, l) => s + l.inventions.length, 0),
    liensAvecInvention: lignes.filter((l) => l.inventions.length).map((l) => `${l.n}:${l.inventions.join('+')}`)
  };
}

/**
 * L'étape IA du banc. `seche` : aucun appel, le texte qui serait envoyé est chiffré (réservation conservatrice du dépôt,
 * `quoteGeminiCost`) ; `reel` : de vrais appels Gemini, payants, au journal `ia-journal.jsonl`, avec un budget d'arrêt net.
 * Le corps envoyé est celui de la production (`geminiBody`), le coût celui du dépôt (`geminiCosts`).
 */
const MISSION = path.join(BANC, '..');
const JOURNAL_IA = path.join(MISSION, 'ia-journal.jsonl');
const MODELES_IA = { lite: { id: GEMINI_LITE_MODEL, niveau: 'minimal' as const }, fort: { id: INVOICE_STRONG_MODEL, niveau: 'low' as const }, neon: { id: LIEN_NEON_MODEL, niveau: 'low' as const } };
export const PLAFOND_SORTIE_IA = 1500;
/** La voie qui dépense : ses lignes du journal portent `voie`, et le budget (`--budget`) est CUMULÉ sur toutes ses lignes, pas par lancement. */
const VOIE_IA = (() => { const i = process.argv.indexOf('--voie'); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : 'liens-modeles'; })();

const SEULEMENT_LITE = (() => { const i = process.argv.indexOf('--modeles'); return i >= 0 && process.argv[i + 1] === 'lite'; })();

export interface BancIA {
  pour(n: number): AppelIA;
  /** Coût (CHF) et durée (ms) des appels d'un lien, rejoués compris (le coût d'un rejeu vient du journal ou du fichier de mesure de l'appel). */
  duLien(n: number): { chf: number; ms: number; appels: number; inconnus: number };
  bilan(): { appels: number; parModele: Record<string, number>; depenseChf: number; cumuleVoieChf: number; reserveeEngageeChf: number; refuses: number; rejoues: number; textesMax: number; ms: number[]; msParModele: Record<string, number[]> };
}
/** Ce que le journal sait déjà d'un appel du banc : « Lien n° 49 lu par gemini-4-hydrogen … (3030 ms …) » → coût et durée, par lien et modèle. */
function memoireJournal(): { cumuleVoie: number; appel: Map<string, { chf: number; ms: number }> } {
  const appel = new Map<string, { chf: number; ms: number }>();
  let cumuleVoie = 0;
  if (!fs.existsSync(JOURNAL_IA)) return { cumuleVoie, appel };
  for (const l of fs.readFileSync(JOURNAL_IA, 'utf8').split('\n')) {
    if (!l.includes('banc-liens-ia')) continue;
    try {
      const j = JSON.parse(l);
      if (j.voie === VOIE_IA) cumuleVoie += Number(j.estimation_chf) || 0;
      const m = /Lien n° (\d+) lu par (\S+) .*?(\d+) ms/.exec(String(j.geste ?? ''));
      if (m) appel.set(`${m[1]}|${m[2]}`, { chf: Number(j.estimation_chf) || 0, ms: Number(m[3]) });
    } catch { /* ligne d'une autre voie, illisible : ignorée */ }
  }
  return { cumuleVoie, appel };
}
const centile = (xs: number[], q: number) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil(q * s.length) - 1)]; };
export { centile };
export async function bancIA(mode: 'seche' | 'reel', budgetChf: number, secretPath?: string): Promise<BancIA> {
  let cle: string | undefined;
  if (mode === 'reel') {
    const garde = await import(pathToFileURL(path.join(ROOT, 'scripts/gemini-usage-bench-guard.mjs')).href);
    const optIn = await import(pathToFileURL(path.join(ROOT, 'scripts/paid-ai-test-guard.mjs')).href);
    optIn.requirePaidAiTestOptIn({ label: 'banc des liens avec Gemini réel', command: 'npx tsx scripts/banc-liens.ts --ia reel --confirm-paid-ai' });
    cle = garde.readLocalKey(secretPath ? { secretPath } : {});
    if (!cle) throw new Error('Aucune clé Gemini lisible (readLocalKey) : aucun appel.');
  }
  const memoire = memoireJournal();
  // Budget cumulé de la voie : ce qui est déjà au journal sous `voie` compte avant le premier envoi de ce lancement.
  let depense = 0, engage = 0, appels = 0, refuses = 0, textesMax = 0, rejoues = 0;
  const parModele: Record<string, number> = {}, ms: number[] = [], msParModele: Record<string, number[]> = {};
  const lien = new Map<number, { chf: number; ms: number; appels: number; inconnus: number }>();
  const noter1 = (n: number, chf: number | null, duree: number | null) => {
    const e = lien.get(n) ?? { chf: 0, ms: 0, appels: 0, inconnus: 0 };
    e.appels++; if (chf === null || duree === null) e.inconnus++; else { e.chf += chf; e.ms += duree; }
    lien.set(n, e);
  };
  return {
    pour: (n) => async (m, consigne, texte) => {
      const { id, niveau } = MODELES_IA[m];
      textesMax = Math.max(textesMax, texte.length);
      const corps = geminiBody({ systemPrompt: consigne, userText: texte, schema: LIEN_IA_SCHEMA as unknown as Record<string, unknown>, settings: { temperature: 0, thinkingLevel: niveau }, maxOutputTokens: PLAFOND_SORTIE_IA });
      const devis = quoteGeminiCost(id, corps);
      const reserve = devis.reservedMicroChf / 1e6;
      // Une réponse déjà payée se rejoue sans nouvel appel quand le texte envoyé est le même (le journal ne la recompte pas).
      const cleCache = createHash('sha1').update([id, consigne, texte].join('\n')).digest('hex');
      const fichierCache = path.join(BANC, 'ia-reponses', `${cleCache}.json`);
      const fichierMesure = path.join(BANC, 'ia-reponses', `${cleCache}.mesure.json`);
      if (fs.existsSync(fichierCache)) {
        rejoues++;
        const mesure = fs.existsSync(fichierMesure) ? JSON.parse(fs.readFileSync(fichierMesure, 'utf8')) as { chf: number; ms: number } : memoire.appel.get(`${n}|${id}`);
        noter1(n, mesure?.chf ?? null, mesure?.ms ?? null);
        return JSON.parse(fs.readFileSync(fichierCache, 'utf8')) as ReponseIA;
      }
      // `--modeles lite` : le banc ne mesure que la première lecture (Flash-Lite) ; la relecture forte n'est pas appelée (elle coûte dix fois plus) et se mesure à part, sur les liens en doute.
      if (SEULEMENT_LITE && m !== 'lite') throw new Error('modèle plus fort non mesuré (--modeles lite)');
      // Arrêt net : la réservation conservatrice (1 octet = 1 jeton) doit tenir dans ce qui reste du budget de la voie, appels en vol compris.
      if (memoire.cumuleVoie + depense + engage + reserve > budgetChf) { refuses++; throw new Error(`budget du banc atteint (${budgetChf} CHF, dont ${Math.round((memoire.cumuleVoie + depense) * 1e5) / 1e5} déjà dépensés)`); }
      appels++; parModele[m] = (parModele[m] ?? 0) + 1;
      if (mode === 'seche') { depense += reserve * 0.25; noter1(n, null, null); return { caracteristiques: [] }; } // estimation : ~¼ de la réservation
      engage += reserve;
      const t0 = performance.now();
      let reponse: any = null, http = 0;
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${id}:generateContent`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle! }, body: JSON.stringify(devis.body), signal: AbortSignal.timeout(m === 'lite' ? 25_000 : 60_000)
        });
        http = res.status;
        reponse = await res.json().catch(() => null);
      } catch (e) { http = -1; reponse = null; }
      finally { engage -= reserve; }
      const observe = reponse ? observedGeminiCostDetails(devis, reponse) : null;
      const chf = (observe ? observe.chargedMicroChf : devis.reservedMicroChf) / 1e6; // coût inconnu : jamais 0, on compte la réservation
      if (http !== -1) depense += chf;
      const duree = Math.round(performance.now() - t0); ms.push(duree); (msParModele[m] ??= []).push(duree);
      noter1(n, chf, duree);
      const u = reponse?.usageMetadata;
      fs.appendFileSync(JOURNAL_IA, JSON.stringify({ heure: new Date().toISOString(), methode: 'banc-liens-ia', voie: VOIE_IA, geste: `Lien n° ${n} lu par ${id} sur le texte nettoyé (${texte.length} car., ${duree} ms, http ${http})`, modele: id, jetons_entree: u?.promptTokenCount ?? null, jetons_reflexion: u?.thoughtsTokenCount ?? null, jetons_sortie: u?.candidatesTokenCount ?? null, estimation_chf: Math.round(chf * 1e5) / 1e5 }) + '\n');
      if (http !== 200 || reponse?.candidates?.[0]?.finishReason !== 'STOP') throw new Error(`réponse inutilisable (http ${http}, ${reponse?.candidates?.[0]?.finishReason ?? 'vide'})`);
      const lu = JSON.parse(geminiAnswerText(reponse).replace(/```json/g, '').replace(/```/g, '').trim()) as ReponseIA;
      fs.mkdirSync(path.dirname(fichierCache), { recursive: true });
      fs.writeFileSync(fichierCache, JSON.stringify(lu));
      fs.writeFileSync(fichierMesure, JSON.stringify({ n, modele: id, chf, ms: duree }));
      return lu;
    },
    duLien: (n) => lien.get(n) ?? { chf: 0, ms: 0, appels: 0, inconnus: 0 },
    bilan: () => ({ appels, parModele, depenseChf: Math.round(depense * 1e5) / 1e5, cumuleVoieChf: Math.round((memoire.cumuleVoie + depense) * 1e5) / 1e5, reserveeEngageeChf: Math.round(engage * 1e5) / 1e5, refuses, rejoues, textesMax, ms, msParModele })
  };
}

async function main() {
  const args = process.argv.slice(2);
  const val = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  if (val('--comparer')) { comparer(val('--comparer')!.split(',')); return; }
  const etiquette = val('--etiquette') ?? 'courant';
  const seul = val('--seul')?.split(',').map(Number);
  const vs = verites().filter((v) => !seul || seul.includes(v.n));
  const caps = captures();
  const lignes: Ligne[] = [];
  const modeIA = val('--ia') as 'seche' | 'reel' | undefined;
  if (modeIA && modeIA !== 'seche' && modeIA !== 'reel') throw new Error('--ia seche|reel');
  const ia = modeIA ? await bancIA(modeIA, Number(val('--budget') ?? 0.25), val('--secret')) : undefined;
  // D449 : `--regle avant` rejoue la règle du 23.11 (Hydrogen pour le seul prix) ; `--escalade 3,5` lit ces liens comme le bouton Escalader (Neon).
  const regleAvant = val('--regle') === 'avant';
  const escalade = new Set((val('--escalade') ?? '').split(',').filter(Boolean).map(Number));
  const lire1 = async (v: Verite) => {
    const c = caps.get(v.n);
    if (!c) { lignes.push(noter(v, { statut: 'non-capture' })); return; }
    const t0 = performance.now();
    const l = await lireLien(v.lien, { fetchPage: fetchRejoue(c, v.n), maintenant: 0, ...(ia ? { ia: ia.pour(v.n) } : {}), ...(regleAvant ? { regleAvant: true } : {}), ...(escalade.has(v.n) ? { escalade: true } : {}), cours: async (d: string) => (COURS_FIXES[d] ? { taux: COURS_FIXES[d], date: '2026-11-23' } : null) });
    const html = (() => { const f = path.join(BANC, 'pages', String(v.n).padStart(2, '0') + '.html.gz'); return fs.existsSync(f) ? zlib.gunzipSync(fs.readFileSync(f)).toString('utf8') : ''; })();
    const sansJsonLd = ![...html.matchAll(/<script[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/g)].some((m) => /"price"/.test(m[1]));
    lignes.push({ ...noter(v, l, Math.round(performance.now() - t0)), sansJsonLd, ...(ia && ia.duLien(v.n).appels ? { ia: ia.duLien(v.n) } : {}) });
  };
  // Des appels en parallèle par lots de 8 (les pages se rejouent sans réseau ; seuls les appels IA attendent).
  const lot = Number(val('--lot') ?? 8);
  for (let i = 0; i < vs.length; i += lot) await Promise.all(vs.slice(i, i + lot).map(lire1));
  lignes.sort((a, b) => a.n - b.n);
  const parN = new Map(vs.map((v) => [v.n, v]));
  console.log('n  | statut       | nom | prix | photo | caract | HT | livr. | cond. | inventions');
  for (const l of lignes) {
    console.log(`${String(l.n).padStart(2)} | ${l.statut.padEnd(12)} |  ${l.nom || ' '}  |  ${l.prix || ' '}   |   ${l.photo || ' '}   |   ${l.caract || ' '}    | ${l.ttc || ' '}  |   ${l.livraison || ' '}   |   ${l.cond || ' '}   | ${l.inventions.join(', ')}`);
    if (args.includes('--detail')) console.log('     ', JSON.stringify(l.lu).slice(0, 600));
  }
  const t = taux(lignes, parN);
  console.log(`\nBANC LIENS ${etiquette} :`, JSON.stringify(t, null, 1));
  const bilanIA = ia?.bilan();
  if (bilanIA) console.log(`IA ${modeIA} :`, JSON.stringify(bilanIA));
  console.log('COUT ET DUREE PAR LIEN :', JSON.stringify(resumeIA(lignes)));
  fs.mkdirSync(path.join(BANC, 'mesures'), { recursive: true });
  fs.writeFileSync(path.join(BANC, 'mesures', `${etiquette}.json`), JSON.stringify({ le: new Date().toISOString(), ia: modeIA ?? null, bilanIA: bilanIA ?? null, taux: t, lignes }, null, 1));
}

/** Coût et durée de l'IA par lien (seulement les liens où l'IA a parlé), p50 et p90 ; rejeux compris quand leur coût est connu. */
export function resumeIA(lignes: Ligne[]) {
  const avec = lignes.filter((l) => l.ia && l.ia.appels > 0);
  const chf = avec.map((l) => l.ia!.chf), ms = avec.map((l) => l.ia!.ms);
  const r = (x: number | null) => (x === null ? null : Math.round(x * 1e5) / 1e5);
  return { liensAvecIA: avec.length, appels: avec.reduce((a, l) => a + l.ia!.appels, 0), appelsSansCout: avec.reduce((a, l) => a + l.ia!.inconnus, 0), totalChf: r(chf.reduce((a, b) => a + b, 0)), chfParLienP50: r(centile(chf, 0.5)), chfParLienP90: r(centile(chf, 0.9)), msParLienP50: centile(ms, 0.5), msParLienP90: centile(ms, 0.9) };
}

/** `--comparer avant,apres` : deux mesures côte à côte, champ par champ, et les liens qui ont changé. */
function comparer([a, b]: string[]) {
  const lire = (e: string) => JSON.parse(fs.readFileSync(path.join(BANC, 'mesures', e + '.json'), 'utf8')) as { taux: Record<string, unknown>; lignes: Ligne[] };
  const A = lire(a), B = lire(b);
  const champs: Array<[string, keyof Ligne]> = [['prix', 'prix'], ['nom', 'nom'], ['photo', 'photo'], ['caractéristiques', 'caract'], ['HT dit', 'ttc'], ['devise/frais (livraison CH)', 'livraison']];
  const out: string[] = [`COMPARAISON ${a} -> ${b}`, `| champ | ${a} | ${b} |`, '|---|---|---|'];
  const ligne = (nom: string, cle: string) => out.push(`| ${nom} | ${A.taux[cle]} | ${B.taux[cle]} |`);
  ligne('prix', 'prixAffiche'); ligne('nom', 'nom'); ligne('photo', 'photoAffichee'); ligne('caractéristiques', 'caracteristiques'); ligne('HT dit', 'htDit'); ligne('devise/frais (livraison CH)', 'livraisonCH'); ligne('conditionnement (R39)', 'conditionnement');
  out.push(`| inventions | ${A.taux.inventions} ${JSON.stringify(A.taux.liensAvecInvention)} | ${B.taux.inventions} ${JSON.stringify(B.taux.liensAvecInvention)} |`);
  out.push('', 'Liens changés (note avant -> après) :');
  const parB = new Map(B.lignes.map((l) => [l.n, l]));
  for (const la of A.lignes) {
    const lb = parB.get(la.n); if (!lb) continue;
    const diffs = champs.filter(([, k]) => la[k] !== lb[k]).map(([nom, k]) => `${nom} ${la[k] || '∅'} -> ${lb[k] || '∅'}`);
    if (diffs.length) out.push(`  n° ${la.n} : ${diffs.join(' ; ')}`);
  }
  out.push('', `coût/durée ${a} : ${JSON.stringify(resumeIA(A.lignes))}`, `coût/durée ${b} : ${JSON.stringify(resumeIA(B.lignes))}`);
  console.log(out.join('\n'));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main().catch((e) => { console.error(e); process.exit(1); });
