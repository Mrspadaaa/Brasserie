/**
 * Banc du rangement d'une phrase du Carnet sur l'IA RÉELLE (voie c70-ia, 25.11 ; C67-2, C68-1, C69-1, C70-3).
 *
 * Problème type : classification d'un texte court par un LLM à sortie structurée (genre, chemin hiérarchique, titre court).
 * Le banc envoie EXACTEMENT ce que `aiTask` envoie pour `rangerCarnet` : contexte du client (`contexteModele`), compacté par le serveur
 * (`contexteRangerCarnet`), consigne et schéma de `RANGER_CARNET`, corps `geminiBody`, modèle et réflexion de `geminiAttempts` en Rapide ;
 * puis la garde serveur (`assainirRangerCarnet`) et la lecture du client (`lireReponse`). Il juge ce que l'écran en tire pour une phrase
 * tapée sur la liste (chemin « cree » de `rangementCarnets.ts`) : genre du carnet neuf, chemin sous son domaine, titre, tâche, rattachement.
 *
 * Aucune donnée réelle : 16 phrases inventées (8 de réglage, 8 tenues à part) et des carnets fictifs « ZZ ». Gemini réel seulement ici,
 * lancé explicitement, chaque appel au journal `work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl`, budget cumulé par voie :
 *
 *   npx tsx scripts/banc-rangement.ts --passe avant --ia reel --confirm-paid-ai [--budget 0.08] [--fixtures]
 *   npx tsx scripts/banc-rangement.ts --passe avant --rejouer      (relit les réponses gardées avec la lecture actuelle, sans appel)
 *
 * Jamais dans `npm test` : `tests/unit/c70RangementIA.test.ts` rejoue les réponses relevées (`tests/fixtures/c70-ia/`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { RANGER_CARNET, assainirRangerCarnet, contexteRangerCarnet, type GenreSuivi } from '../functions/src/carnetIA';
import { geminiBody, userTextOf } from '../functions/src/geminiBody';
import { geminiAnswerText } from '../functions/src/geminiResponse';
import { observedGeminiCostDetails, quoteGeminiCost } from '../functions/src/geminiCosts';
import { TIERS, geminiAttempts } from '../functions/src/models';
import { contexteModele, lireReponse, sansAccents, sujetLu, type CarnetPourIA, type LigneCarnet, type SujetLu } from '../src/domain/carnets/ia';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const JOURNAL = path.join(ROOT, 'work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl');
const SORTIES = path.join(ROOT, 'work/missions/2026-11-23-reprise-soir/voies/c70-ia');
export const FIXTURES = path.join(ROOT, 'tests/fixtures/c70-ia');
const VOIE = 'c70-ia';

/** Le jour de saisie du banc (fixe : une tâche « cette semaine » ne dépend pas du jour du lancement). */
export const SAISIE = new Date(2026, 10, 25, 10, 0, 0);
const PREFIXE = 'ZZ TEST — ';

/** Carnets fictifs : des voisins proches (même domaine, même partie du matériel) qu'une phrase neuve ne doit PAS rattacher. */
export const CARNETS_ZZ: CarnetPourIA[] = [
  { id: 'zz-moulin', titre: 'ZZ Moulin à malt', majLe: 9, genre: 'achat', etat: 'cherche', domaine: 'brasserie', chemin: ['Brassage', 'Moulin'],
    criteres: [{ texte: '2 cylindres, 150 kg/h au moins', caracteristique: { nom: 'débit', unite: 'kg/h', sens: 'plus' } }] },
  { id: 'zz-fermenteur', titre: 'ZZ Fermenteur conique 60 L à acheter', majLe: 8, genre: 'achat', etat: 'cherche', domaine: 'brasserie', chemin: ['Fermentation', 'Fermenteur'],
    criteres: [{ texte: '60 L utiles', caracteristique: { nom: 'volume', unite: 'L', sens: 'plus' } }] },
  { id: 'zz-futs', titre: 'ZZ Fûts inox 20 L', majLe: 7, genre: 'achat', etat: 'note', domaine: 'brasserie', chemin: ['Conditionnement', 'Fûts'] },
  { id: 'zz-eclairage', titre: 'ZZ Éclairage de la salle de brassage', majLe: 6, genre: 'idee', etat: 'note', domaine: 'local', chemin: ['Électricité', 'Éclairage'] },
  { id: 'zz-robinet', titre: 'ZZ Fuite du robinet de la cave', majLe: 5, genre: 'probleme', etat: 'resolu', domaine: 'local', chemin: ['Eau', 'Robinet'] },
  { id: 'zz-rc', titre: 'ZZ Assurance responsabilité civile', majLe: 4, genre: 'memo', etat: 'note', domaine: 'papiers', chemin: ['Assurances'] },
  { id: 'zz-armoire', titre: 'ZZ Armoire des classeurs', majLe: 3, genre: 'idee', etat: 'note', domaine: 'meuble', chemin: ['Bureau', 'Armoire'] },
  { id: 'zz-noel', titre: 'ZZ Bière de Noël à la cannelle', majLe: 2, genre: 'idee', etat: 'note', domaine: 'brasserie', chemin: ['Recettes'] },
  /* C70-3 (25.11) : un carnet du MÊME sujet qu'une phrase (le « ZZ vapeur » du test en ligne 70). L'IA peut le désigner (« Rattacher ? ») ;
     la phrase doit quand même porter genre, chemin et titre, que « Garder à part » donne au carnet qui naît. Ajoutés après r1, r2, r5 avant. */
  { id: 'zz-densimetres', titre: 'ZZ Densimètres et réfractomètre', majLe: 1, genre: 'achat', etat: 'note', domaine: 'outils', chemin: ['Mesure'] },
  { id: 'zz-chariot', titre: 'ZZ Chariot élévateur : contrôle annuel', majLe: 1, genre: 'memo', etat: 'resolu', domaine: 'outils', chemin: ['Manutention', 'Chariot'] }
];

export interface Attendu {
  /** Genres admis du carnet neuf (un seul quand le sens est net). */
  genres: GenreSuivi[];
  domaines: string[];
  /** Premier niveau sous le domaine : un de ces mots (sans accents, minuscules ; un mot contenu suffit, « pompe de transfert » ⊇ « pompe »). */
  niveau1: string[];
  /** Le titre court contient l'un de ces mots. */
  motsTitre: string[];
  /** Une tâche doit être proposée (un besoin, un geste dit). */
  tache?: boolean;
  /** Le carnet du même sujet que l'IA peut désigner (« Rattacher ? ») ; tout autre carnet désigné est une faute. */
  voisin?: string;
}
export interface PhraseBanc { id: string; jeu: 'reglage' | 'tenue'; texte: string; attendu: Attendu }

/** 16 phrases neuves : aucune ne parle de vapeur, de Citra ni de sol. Écrites avec leur attendu AVANT la première passe. */
export const PHRASES: PhraseBanc[] = [
  // --- réglage ---
  { id: 'r1', jeu: 'reglage', texte: 'la pompe de transfert claque au démarrage et le débit baisse en fin de transfert du moût',
    attendu: { genres: ['probleme'], domaines: ['brasserie'], niveau1: ['brassage', 'transfert'], motsTitre: ['pompe'] } },
  { id: 'r2', jeu: 'reglage', texte: 'le nouveau joint de la porte de la chambre froide tient bien, plus de givre depuis une semaine',
    attendu: { genres: ['memo'], domaines: ['brasserie', 'local'], niveau1: ['fermentation', 'froid', 'chambre froide'], motsTitre: ['joint', 'chambre froide', 'porte'] } },
  { id: 'r3', jeu: 'reglage', texte: 'idée : proposer des visites guidées de la brasserie le premier samedi du mois',
    attendu: { genres: ['idee'], domaines: ['brasserie', 'local'], niveau1: ['evenement', 'visite', 'accueil', 'animation'], motsTitre: ['visite'] } },
  { id: 'r4', jeu: 'reglage', texte: 'il nous faut un deuxième densimètre, le premier est cassé',
    attendu: { genres: ['achat'], domaines: ['outils', 'brasserie'], niveau1: ['densimetre', 'mesure', 'fermentation', 'instrument'], motsTitre: ['densimetre'], tache: true, voisin: 'zz-densimetres' } },
  { id: 'r5', jeu: 'reglage', texte: 'penser à détartrer l\'échangeur à plaques avant le brassin de vendredi',
    attendu: { genres: ['probleme', 'memo', 'idee'], domaines: ['brasserie'], niveau1: ['brassage', 'refroidissement', 'echangeur'], motsTitre: ['echangeur', 'detartr'], tache: true } },
  { id: 'r6', jeu: 'reglage', texte: 'reçu l\'autorisation cantonale de vente à l\'emporter, valable jusqu\'en 2028',
    attendu: { genres: ['memo'], domaines: ['papiers'], niveau1: ['autorisation', 'permis', 'vente'], motsTitre: ['autorisation', 'vente', 'emporter'] } },
  { id: 'r7', jeu: 'reglage', texte: 'la lumière des toilettes clignote et l\'interrupteur chauffe',
    attendu: { genres: ['probleme'], domaines: ['local'], niveau1: ['electricite', 'eclairage', 'toilettes', 'sanitaires'], motsTitre: ['lumiere', 'interrupteur', 'eclairage', 'toilettes'] } },
  { id: 'r8', jeu: 'reglage', texte: 'ce serait bien d\'avoir un établi roulant pour ranger les outils de démontage près des cuves',
    attendu: { genres: ['idee'], domaines: ['meuble', 'outils'], niveau1: ['etabli', 'atelier', 'rangement'], motsTitre: ['etabli'] } },
  // --- tenues à part (jamais regardées pour régler) ---
  { id: 't1', jeu: 'tenue', texte: 'la cuve d\'empâtage perd par la vanne du bas, ça goutte pendant toute la filtration',
    attendu: { genres: ['probleme'], domaines: ['brasserie'], niveau1: ['brassage', 'empatage'], motsTitre: ['vanne', 'fuite', 'cuve', 'empatage'] } },
  { id: 't2', jeu: 'tenue', texte: 'le fermenteur 3 monte à 24 °C la nuit alors que la consigne est à 19',
    attendu: { genres: ['probleme'], domaines: ['brasserie'], niveau1: ['fermentation', 'froid', 'temperature'], motsTitre: ['fermenteur', 'temperature', '24'] } },
  { id: 't3', jeu: 'tenue', texte: 'la nouvelle soutireuse à contre-pression marche nickel, 40 bouteilles sans mousse',
    attendu: { genres: ['memo'], domaines: ['brasserie'], niveau1: ['conditionnement', 'embouteillage'], motsTitre: ['soutireuse', 'contre-pression'] } },
  { id: 't4', jeu: 'tenue', texte: 'commander 25 kg de malt Pilsner et 1 kg de sulfate de calcium',
    attendu: { genres: ['achat'], domaines: ['brasserie'], niveau1: ['brassage', 'ingredient', 'matiere', 'malt', 'stock'], motsTitre: ['malt', 'pilsner', 'commande'], tache: true } },
  { id: 't5', jeu: 'tenue', texte: 'et si on installait une petite terrasse devant l\'entrée pour l\'été',
    attendu: { genres: ['idee'], domaines: ['local'], niveau1: ['terrasse', 'exterieur', 'entree', 'accueil'], motsTitre: ['terrasse'] } },
  { id: 't6', jeu: 'tenue', texte: 'la douane réclame une amende, notre déclaration du trimestre n\'est jamais arrivée',
    attendu: { genres: ['probleme'], domaines: ['papiers'], niveau1: ['douane', 'impot', 'declaration', 'fiscal', 'taxe'], motsTitre: ['douane', 'amende', 'declaration'] } },
  { id: 't7', jeu: 'tenue', texte: 'besoin d\'une clé à sangle pour ouvrir les boîtiers des filtres à cartouche',
    attendu: { genres: ['achat'], domaines: ['outils'], niveau1: ['cle', 'filtr', 'serrage', 'outillage'], motsTitre: ['cle'], tache: true } },
  { id: 't8', jeu: 'tenue', texte: 'le chariot élévateur ne monte plus jusqu\'en haut, il fait un bruit de chaîne',
    attendu: { genres: ['probleme'], domaines: ['outils', 'local', 'brasserie'], niveau1: ['chariot', 'manutention', 'levage', 'transport', 'stockage'], motsTitre: ['chariot'], voisin: 'zz-chariot' } }
];

/** Le contexte envoyé : celui du client (`contexteModele`, phrase tapée sur la liste), compacté par le serveur comme dans `aiTask`. */
export function contexteBanc(texte: string) {
  const ctx = contexteRangerCarnet(contexteModele(texte, SAISIE, null, CARNETS_ZZ));
  if (!ctx) throw new Error('contexte refusé par le serveur');
  return ctx;
}

export interface Vu { genre: GenreSuivi | 'idee'; genreDit: boolean; domaine?: string; chemin?: string[]; titre?: string; tache?: string; rattache?: string }
const sansPrefixe = (t: string) => t.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, '').trim();

/**
 * Ce que l'écran tire des lignes lues pour une phrase tapée sur la liste (chemin « cree » de `rangementCarnets.ts`, `suiviDesLignes`) :
 * genre du carnet neuf (« idée » quand aucune ligne n'en dit), domaine, chemin, titre proposé, tâche ; un carnet existant désigné = rattachement.
 */
export function rangementVu(lignes: LigneCarnet[] | null, sujet?: SujetLu): Vu {
  if (!lignes) return { genre: 'idee', genreDit: false };
  const connus = new Set(CARNETS_ZZ.map((c) => c.id));
  const ici = lignes.filter((l) => !(l.carnetId && connus.has(l.carnetId)));
  const dit = ici.find((l) => l.genreCarnet)?.genreCarnet;
  const rattache = lignes.find((l) => (l.carnetId && connus.has(l.carnetId)) || (l.carnetSuggere && connus.has(l.carnetSuggere)));
  const titre = lignes.find((l) => l.sorte === 'idee')?.titre ?? lignes.find((l) => l.carnetNeuf)?.carnetNeuf ?? lignes.find((l) => l.titrePropose)?.titrePropose
    ?? lignes.find((l) => l.titre && !l.carnetId)?.titre ?? sujet?.titre;
  return {
    genre: dit ?? 'idee', genreDit: !!dit,
    domaine: ici.find((l) => l.domaine)?.domaine,
    chemin: ici.find((l) => l.chemin?.length)?.chemin,
    titre: titre ? sansPrefixe(titre) : undefined,
    tache: lignes.find((l) => l.tachePropose?.texte)?.tachePropose?.texte,
    rattache: rattache ? (rattache.carnetId ?? rattache.carnetSuggere) : undefined
  };
}

const norme = (t: string) => sansAccents(t).replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim();
const contientUn = (t: string, mots: readonly string[]) => mots.some((m) => norme(t).includes(norme(m)));

/** Le verdict d'une phrase : juste seulement si genre, domaine, chemin (2 niveaux au moins), titre court, tâche et carnet sont justes. */
export function juger(p: PhraseBanc, vu: Vu): { juste: boolean; fautes: string[] } {
  const a = p.attendu, fautes: string[] = [];
  if (!a.genres.includes(vu.genre as GenreSuivi)) fautes.push(`genre ${vu.genre}${vu.genreDit ? '' : ' (non dit)'} ≠ ${a.genres.join('|')}`);
  if (!vu.domaine || !a.domaines.includes(vu.domaine)) fautes.push(`domaine ${vu.domaine ?? '∅'} ≠ ${a.domaines.join('|')}`);
  if (!vu.chemin?.length) fautes.push('chemin ∅ (domaine seul)');
  else if (!contientUn(vu.chemin[0], a.niveau1)) fautes.push(`chemin ${vu.chemin.join(' › ')} : 1er niveau ≠ ${a.niveau1.join('|')}`);
  const corps = sansPrefixe(p.texte);
  if (!vu.titre) fautes.push('titre ∅');
  else {
    const mots = vu.titre.split(/\s+/).filter(Boolean).length;
    if (mots > 6) fautes.push(`titre de ${mots} mots`);
    if (norme(vu.titre) === norme(corps)) fautes.push('titre = la phrase');
    if (!contientUn(vu.titre, a.motsTitre)) fautes.push(`titre « ${vu.titre} » sans ${a.motsTitre.join('|')}`);
  }
  if (a.tache && !vu.tache) fautes.push('tâche non proposée');
  if (vu.rattache && vu.rattache !== a.voisin) fautes.push(`rattaché à ${vu.rattache}`);
  return { juste: fautes.length === 0, fautes };
}

/** La lecture complète d'une réponse brute (déjà assainie par le serveur) : lignes du client, puis ce que l'écran en montre. */
export function lireEtJuger(p: PhraseBanc, brut: unknown) {
  const texte = PREFIXE + p.texte;
  const lignes = lireReponse(brut, { texte, carnets: CARNETS_ZZ, depuis: null, maintenant: SAISIE });
  const vu = rangementVu(lignes, sujetLu(brut, { texte, carnets: CARNETS_ZZ, depuis: null }));
  return { vu, ...juger(p, vu) };
}

/* ---------------- lancement (jamais à l'import : le test Vitest importe les phrases et le juge) ---------------- */

const arg = (n: string) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined; };

function cumuleVoie(): number {
  if (!fs.existsSync(JOURNAL)) return 0;
  let s = 0;
  for (const l of fs.readFileSync(JOURNAL, 'utf8').split(/\r?\n/)) {
    if (!l.trim()) continue;
    try { const j = JSON.parse(l); if (j.voie === VOIE) s += Number(j.estimation_chf) || 0; } catch { /* ligne d'une autre voie */ }
  }
  return s;
}

async function main() {
  const passe = arg('--passe');
  if (!passe || !/^[a-z0-9-]+$/.test(passe)) throw new Error('--passe <etiquette> attendu (avant, apres)');
  const fichier = path.join(SORTIES, `passe-${passe}.json`);
  let reponses: Record<string, { brut: unknown; chf: number | null; ms: number; finish: string | null; jetons: unknown }> = {};

  if (process.argv.includes('--rejouer')) {
    reponses = JSON.parse(fs.readFileSync(fichier, 'utf8')).reponses;
  } else {
    if (arg('--ia') !== 'reel') throw new Error('--ia reel ou --rejouer attendu');
    const optIn = await import(pathToFileURL(path.join(ROOT, 'scripts/paid-ai-test-guard.mjs')).href);
    optIn.requirePaidAiTestOptIn({ label: 'banc du rangement du Carnet avec Gemini réel', command: 'npx tsx scripts/banc-rangement.ts --passe avant --ia reel --confirm-paid-ai' });
    const garde = await import(pathToFileURL(path.join(ROOT, 'scripts/gemini-usage-bench-guard.mjs')).href);
    const cle: string | undefined = garde.readLocalKey({});
    if (!cle) throw new Error('Aucune clé Gemini lisible : aucun appel.');
    const budget = Number(arg('--budget') ?? 0.08);
    const [{ model, thinkingLevel }] = geminiAttempts('rangerCarnet', 'fast');
    /* `--consigne <rév>` : consigne, schéma et garde serveur d'une version Git de carnetIA.ts (la passe « avant » après le changement), copiée
       dans le dossier temporaire du système (L17) ; la lecture du client reste l'actuelle (elle ne fait que compléter avec un « sujet » absent). */
    const rev = arg('--consigne');
    let tache = { def: RANGER_CARNET, assainir: assainirRangerCarnet as (d: unknown) => unknown };
    if (rev) {
      if (!/^[0-9a-f]{7,40}$/.test(rev)) throw new Error('--consigne <hash git> attendu');
      const { execFileSync } = await import('node:child_process');
      const { tmpdir } = await import('node:os');
      const f = path.join(tmpdir(), `c70-ia-carnetIA-${rev}.ts`);
      fs.writeFileSync(f, execFileSync('git', ['show', `${rev}:functions/src/carnetIA.ts`], { cwd: ROOT, encoding: 'utf8' }));
      const m = await import(pathToFileURL(f).href);
      tache = { def: m.RANGER_CARNET, assainir: m.assainirRangerCarnet };
      console.log(`consigne de ${rev} (${tache.def.system.length} car.)`);
    }
    // Le plus cher des appels déjà journalisés par cette voie sert de réservation dès le premier appel d'un nouveau lancement.
    const deja = fs.existsSync(JOURNAL) ? fs.readFileSync(JOURNAL, 'utf8').split(/\r?\n/).flatMap((l) => {
      try { const j = JSON.parse(l); return j.voie === VOIE && j.methode === 'banc-rangement' ? [Number(j.estimation_chf) || 0] : []; } catch { return []; }
    }) : [];
    let depense = cumuleVoie(), engage = 0, plusCher = Math.max(0, ...deja);
    const appeler = async (p: PhraseBanc) => {
      const corps = geminiBody({ systemPrompt: tache.def.system, userText: userTextOf(undefined, contexteBanc(PREFIXE + p.texte)), schema: tache.def.schema as Record<string, unknown>,
        settings: { temperature: TIERS.fast.temperature, thinkingLevel }, maxOutputTokens: tache.def.maxOutputTokens });
      const devis = quoteGeminiCost(model, corps);
      // La réservation du devis (1 octet = 1 jeton, plafond de sortie entier, ≈ 10 fois l'observé) bloquerait le banc bien avant le plafond :
      // avant le premier appel observé, la réservation ; ensuite, 1,2 fois l'appel le plus cher observé (écart observé : 4 %). Arrêt net avant tout dépassement.
      const reserve = plusCher ? 1.2 * plusCher : devis.reservedMicroChf / 1e6;
      if (depense + engage + reserve > budget) throw new Error(`budget atteint (${budget} CHF, ${depense.toFixed(5)} dépensés, ${reserve.toFixed(5)} réservés) : ${p.id} non appelée`);
      engage += reserve;
      const t0 = performance.now();
      let rep: any = null, http = 0;
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle }, body: JSON.stringify(devis.body), signal: AbortSignal.timeout(60_000) });
        http = res.status; rep = await res.json().catch(() => null);
      } catch { http = -1; } finally { engage -= reserve; }
      const obs = rep ? observedGeminiCostDetails(devis, rep) : null;
      const chf = (obs ? obs.chargedMicroChf : devis.reservedMicroChf) / 1e6; // inconnu : la réservation, jamais 0
      depense += chf;
      if (obs) plusCher = Math.max(plusCher, chf);
      const ms = Math.round(performance.now() - t0), u = rep?.usageMetadata, finish = rep?.candidates?.[0]?.finishReason ?? null;
      fs.appendFileSync(JOURNAL, JSON.stringify({ heure: new Date().toISOString(), methode: 'banc-rangement', voie: VOIE, tache: 'rangerCarnet',
        geste: `Phrase fictive ${p.id} (${passe}) rangée par ${model} (${ms} ms, http ${http}, ${finish ?? 'vide'})`, modele: model,
        jetons_entree: u?.promptTokenCount ?? null, jetons_reflexion: u?.thoughtsTokenCount ?? null, jetons_sortie: u?.candidatesTokenCount ?? null,
        estimation_chf: Math.round(chf * 1e5) / 1e5 }) + '\n');
      let brut: unknown = null;
      try { if (http === 200) brut = tache.assainir(JSON.parse(geminiAnswerText(rep).replace(/```json/g, '').replace(/```/g, '').trim())); } catch { brut = null; }
      reponses[p.id] = { brut, chf, ms, finish, jetons: u ? { entree: u.promptTokenCount, reflexion: u.thoughtsTokenCount, sortie: u.candidatesTokenCount, total: u.totalTokenCount } : null };
      // Chaque réponse payée est gardée dès son arrivée : un arrêt au budget ne perd rien (25.11, 3 réponses perdues ainsi).
      fs.writeFileSync(fichier, JSON.stringify({ passe, modele: model, reflexion: thinkingLevel, date: new Date().toISOString(), reponses }, null, 1));
    };
    if (fs.existsSync(fichier)) reponses = JSON.parse(fs.readFileSync(fichier, 'utf8')).reponses ?? {};
    const seul = arg('--seul')?.split(',');
    // Une phrase déjà rangée dans cette passe ne se repaie pas.
    const file = PHRASES.filter((p) => (!seul || seul.includes(p.id)) && !reponses[p.id]);
    const suivant = async () => {
      for (let p = file.shift(); p; p = file.shift()) {
        try { await appeler(p); } catch (e) { console.error(`ARRÊT : ${e instanceof Error ? e.message : String(e)}`); file.length = 0; }
      }
    };
    // Le premier appel seul (il fixe la réservation), puis 3 à la fois au plus.
    if (file.length) { const p = file.shift()!; try { await appeler(p); } catch (e) { console.error(`ARRÊT : ${e instanceof Error ? e.message : String(e)}`); file.length = 0; } }
    await Promise.all([suivant(), suivant(), suivant()]);
  }

  const score = { reglage: 0, tenue: 0 };
  const lignes: string[] = [];
  for (const p of PHRASES) {
    const r = reponses[p.id];
    const v = lireEtJuger(p, r?.brut ?? null);
    if (v.juste) score[p.jeu]++;
    lignes.push(`${v.juste ? '✓' : '✗'} ${p.id} ${v.vu.genre} | ${[v.vu.domaine ?? '∅', ...(v.vu.chemin ?? [])].join(' › ')} | « ${v.vu.titre ?? '∅'} »${v.vu.tache ? ` | tâche « ${v.vu.tache} »` : ''}${v.fautes.length ? `  — ${v.fautes.join(' ; ')}` : ''}`);
    if (process.argv.includes('--fixtures') && r?.brut) {
      fs.mkdirSync(FIXTURES, { recursive: true });
      fs.writeFileSync(path.join(FIXTURES, `${p.id}.json`), JSON.stringify({ id: p.id, jeu: p.jeu, passe, texte: PREFIXE + p.texte, brut: r.brut, vu: v.vu, juste: v.juste, fautes: v.fautes }, null, 1) + '\n');
    }
  }
  const chf = Object.values(reponses).reduce((s, r) => s + (r.chf ?? 0), 0);
  console.log(lignes.join('\n'));
  console.log(`\nPASSE ${passe} : réglage ${score.reglage}/8 ; TENUES À PART ${score.tenue}/8 ; coût de la passe ${chf.toFixed(4)} CHF ; cumul voie ${cumuleVoie().toFixed(4)} CHF`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((e) => { console.error(`ECHEC : ${e instanceof Error ? e.message : String(e)}`); process.exit(1); });
}
