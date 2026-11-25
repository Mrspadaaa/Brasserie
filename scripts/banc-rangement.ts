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
 * D453 (voie banc-modeles) : comparaison de modèles, même consigne et même schéma, contexte sans ou avec un carnet du même sujet :
 *   npx tsx scripts/banc-rangement.ts --modele lite|flash38|hydrogen --contexte sans|avec [--jeu tenue] --ia reel --confirm-paid-ai --budget 0.50
 *   npx tsx scripts/banc-rangement.ts --tableau                    (le tableau des passes gardées, sans appel)
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
import { GEMINI_LITE_MODEL, GEMINI_MODEL, INVOICE_STRONG_MODEL, TIERS, geminiAttempts, type GeminiThinkingLevel } from '../functions/src/models';
import { contexteModele, lireReponse, sansAccents, sujetLu, type CarnetPourIA, type LigneCarnet, type SujetLu } from '../src/domain/carnets/ia';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const JOURNAL = path.join(ROOT, 'work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl');
const SORTIES_C70 = path.join(ROOT, 'work/missions/2026-11-23-reprise-soir/voies/c70-ia');
const SORTIES_MODELES = path.join(ROOT, 'work/missions/2026-11-23-reprise-soir/voies/banc-modeles');
export const FIXTURES = path.join(ROOT, 'tests/fixtures/c70-ia');
export const FIXTURES_MODELES = path.join(ROOT, 'tests/fixtures/banc-modeles');

/**
 * D453 (banc-modeles, 25.11) : les trois modèles comparés, sous les noms de `functions/src/models.ts` (ceux de `lienIA` et d'`aiTask`).
 * Même consigne, même schéma, même température, même réflexion basse pour les trois : seule la variable « modèle » change.
 * La production reste `geminiAttempts('rangerCarnet', 'fast')` (3.8, réflexion basse) : le banc ne la change pas.
 */
export const MODELES: Record<'lite' | 'flash38' | 'hydrogen', { model: string; thinkingLevel: GeminiThinkingLevel }> = {
  lite: { model: GEMINI_LITE_MODEL, thinkingLevel: 'low' },
  flash38: { model: GEMINI_MODEL, thinkingLevel: TIERS.fast.thinkingLevel },
  hydrogen: { model: INVOICE_STRONG_MODEL, thinkingLevel: 'low' }
};
export type CleModele = keyof typeof MODELES;

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

/**
 * D453 : pour chaque phrase, un carnet fictif du MÊME sujet (cas qui a échoué au test en ligne 70). Contexte « sans » : les 8 voisins proches
 * seuls ; contexte « avec » : les 8 voisins et ce carnet-là. Avec lui, l'IA peut proposer « Rattacher ? » (permis), mais la phrase doit porter
 * quand même genre, chemin et titre (le « sujet »), que « Garder à part » donne au carnet qui naît. r4 et t8 reprennent les deux de c70-ia.
 */
const zz = (id: string, titre: string, genre: CarnetPourIA['genre'], etat: CarnetPourIA['etat'], domaine: string, chemin: string[]): CarnetPourIA =>
  ({ id, titre: `ZZ ${titre}`, majLe: 1, genre, etat, domaine, chemin } as CarnetPourIA);
const voisinDe = (id: string) => CARNETS_ZZ.find((c) => c.id === id)!;
export const MEME_SUJET: Record<string, CarnetPourIA> = {
  r1: zz('zz-pompe', 'Pompe de transfert', 'probleme', 'note', 'brasserie', ['Brassage', 'Pompe']),
  r2: zz('zz-chambre-froide', 'Chambre froide : porte et givre', 'probleme', 'decide', 'brasserie', ['Froid', 'Chambre froide']),
  r3: zz('zz-visites', 'Visites de la brasserie', 'idee', 'note', 'brasserie', ['Accueil', 'Visites']),
  r4: voisinDe('zz-densimetres'),
  r5: zz('zz-echangeur', 'Échangeur à plaques', 'memo', 'note', 'brasserie', ['Brassage', 'Refroidissement']),
  r6: zz('zz-vente-emporter', 'Autorisation de vente à l\'emporter', 'memo', 'cherche', 'papiers', ['Autorisations']),
  r7: zz('zz-toilettes', 'Électricité des toilettes', 'probleme', 'note', 'local', ['Électricité', 'Toilettes']),
  r8: zz('zz-etabli', 'Établi roulant', 'idee', 'note', 'meuble', ['Atelier', 'Établi']),
  t1: zz('zz-vanne-empatage', 'Cuve d\'empâtage : vanne du bas', 'probleme', 'note', 'brasserie', ['Brassage', 'Empâtage']),
  t2: zz('zz-temp-fermenteur', 'Température du fermenteur 3', 'probleme', 'cherche', 'brasserie', ['Fermentation', 'Température']),
  t3: zz('zz-soutireuse', 'Soutireuse à contre-pression', 'achat', 'decide', 'brasserie', ['Conditionnement', 'Embouteillage']),
  t4: zz('zz-malt', 'Malts de base', 'achat', 'cherche', 'brasserie', ['Ingrédients', 'Malt']),
  t5: zz('zz-terrasse', 'Terrasse d\'été', 'idee', 'note', 'local', ['Extérieur', 'Terrasse']),
  t6: zz('zz-douane', 'Déclarations à la douane', 'memo', 'note', 'papiers', ['Douane']),
  t7: zz('zz-filtres', 'Boîtiers des filtres à cartouche', 'memo', 'note', 'brasserie', ['Filtration', 'Cartouches']),
  t8: voisinDe('zz-chariot')
};
const IDS_MEME_SUJET = new Set(Object.values(MEME_SUJET).map((c) => c.id));
/** Les carnets du contexte d'une phrase : les 8 voisins proches (jamais du même sujet), plus le sien « avec ». */
export function carnetsBanc(id: string, avec: boolean): CarnetPourIA[] {
  return [...CARNETS_ZZ.filter((c) => !IDS_MEME_SUJET.has(c.id)), ...(avec ? [MEME_SUJET[id]] : [])];
}

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
export function contexteBanc(texte: string, carnets: CarnetPourIA[] = CARNETS_ZZ) {
  const ctx = contexteRangerCarnet(contexteModele(texte, SAISIE, null, carnets));
  if (!ctx) throw new Error('contexte refusé par le serveur');
  return ctx;
}

export interface Vu { genre: GenreSuivi | 'idee'; genreDit: boolean; domaine?: string; chemin?: string[]; titre?: string; tache?: string; rattache?: string }
const sansPrefixe = (t: string) => t.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, '').trim();

/**
 * Ce que l'écran tire des lignes lues pour une phrase tapée sur la liste (chemin « cree » de `rangementCarnets.ts`, `suiviDesLignes`) :
 * genre du carnet neuf (« idée » quand aucune ligne n'en dit), domaine, chemin, titre proposé, tâche ; un carnet existant désigné = rattachement.
 */
export function rangementVu(lignes: LigneCarnet[] | null, sujet?: SujetLu, carnets: CarnetPourIA[] = CARNETS_ZZ): Vu {
  if (!lignes) return { genre: 'idee', genreDit: false };
  const connus = new Set(carnets.map((c) => c.id));
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
export function lireEtJuger(p: PhraseBanc, brut: unknown, carnets: CarnetPourIA[] = CARNETS_ZZ) {
  const texte = PREFIXE + p.texte;
  const lignes = lireReponse(brut, { texte, carnets, depuis: null, maintenant: SAISIE });
  const vu = rangementVu(lignes, sujetLu(brut, { texte, carnets, depuis: null }), carnets);
  return { vu, ...juger(p, vu) };
}

/* ---------------- lancement (jamais à l'import : le test Vitest importe les phrases et le juge) ---------------- */

const arg = (n: string) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined; };

function cumuleVoie(voie: string): number {
  if (!fs.existsSync(JOURNAL)) return 0;
  let s = 0;
  for (const l of fs.readFileSync(JOURNAL, 'utf8').split(/\r?\n/)) {
    if (!l.trim()) continue;
    try { const j = JSON.parse(l); if (j.voie === voie) s += Number(j.estimation_chf) || 0; } catch { /* ligne d'une autre voie */ }
  }
  return s;
}

type Contexte = 'avec' | 'sans';
/** La phrase telle que le banc la juge dans un contexte : « sans », aucun rattachement n'est juste ; « avec », seulement à son carnet. */
export function phraseEnContexte(p: PhraseBanc, contexte?: Contexte): PhraseBanc {
  if (!contexte) return p;
  return { ...p, attendu: { ...p.attendu, voisin: contexte === 'avec' ? MEME_SUJET[p.id].id : undefined } };
}
export const carnetsEnContexte = (p: PhraseBanc, contexte?: Contexte) => contexte ? carnetsBanc(p.id, contexte === 'avec') : CARNETS_ZZ;

/** Le genre de chaque faute d'une phrase tenue, pour le tableau : genre, chemin (domaine compris), titre, carnet (rattachement), tâche. */
const familleFaute = (f: string) => f.startsWith('genre') ? 'genre' : f.startsWith('domaine') || f.startsWith('chemin') ? 'chemin'
  : f.startsWith('titre') ? 'titre' : f.startsWith('rattach') ? 'carnet' : 'tâche';

/** `--tableau` : relit toutes les passes de banc-modeles (aucun appel) et rend le tableau du RESULTAT, tenues à part seulement pour le score. */
function tableau() {
  const fichiers = fs.readdirSync(SORTIES_MODELES).filter((f) => /^passe-[a-z0-9]+-(avec|sans)\.json$/.test(f)).sort();
  const ordre: CleModele[] = ['lite', 'flash38', 'hydrogen'];
  const lignes = ['| modèle | contexte | tenues justes (écran) | sujet du modèle juste | réglage justes | fautes des tenues (genre / chemin / titre / carnet / tâche) | CHF par appel | ms par appel (médiane) | appels |',
    '|---|---|---|---|---|---|---|---|---|'];
  const total: Record<string, { justes: number; n: number; chf: number; appels: number }> = {};
  const details: string[] = [];
  for (const cle of ordre) for (const contexte of ['sans', 'avec'] as Contexte[]) {
    const f = fichiers.find((x) => x === `passe-${cle}-${contexte}.json`);
    if (!f) continue;
    const { reponses, modele } = JSON.parse(fs.readFileSync(path.join(SORTIES_MODELES, f), 'utf8'));
    const score = { tenue: 0, reglage: 0, nTenue: 0, nReglage: 0, sujet: 0 };
    const fautes: Record<string, number> = { genre: 0, chemin: 0, titre: 0, carnet: 0, 'tâche': 0 };
    const ms: number[] = []; let chf = 0;
    for (const p0 of PHRASES) {
      const r = reponses[p0.id]; if (!r) continue;
      const p = phraseEnContexte(p0, contexte);
      const v = lireEtJuger(p, r.brut ?? null, carnetsEnContexte(p0, contexte));
      ms.push(r.ms); chf += r.chf ?? 0;
      /* Vue secondaire, le modèle seul : son « sujet » (genre, domaine, chemin, titre) jugé comme la phrase, tâche et carnet pris des lignes.
         Elle sépare ce que le modèle rend de ce que la lecture du client en tire (une ligne versée dans un carnet mémo n'est pas complétée). */
      const s = sujetLu(r.brut ?? null, { texte: PREFIXE + p.texte, carnets: carnetsEnContexte(p0, contexte), depuis: null });
      const js = juger(p, { ...v.vu, genre: s?.genre ?? 'idee', genreDit: !!s, domaine: s?.domaine, chemin: s?.chemin, titre: s?.titre });
      if (p.jeu === 'tenue' && js.juste) score.sujet++;
      if (p.jeu === 'tenue') { score.nTenue++; if (v.juste) score.tenue++; else for (const x of new Set(v.fautes.map(familleFaute))) fautes[x]++; }
      else { score.nReglage++; if (v.juste) score.reglage++; }
      details.push(`${v.juste ? '✓' : '✗'} ${cle}-${contexte} ${p.id} ${v.vu.genre} | ${[v.vu.domaine ?? '∅', ...(v.vu.chemin ?? [])].join(' › ')} | « ${v.vu.titre ?? '∅'} »${v.vu.rattache ? ` | → ${v.vu.rattache}` : ''}${v.fautes.length ? `  — ${v.fautes.join(' ; ')}` : ''}`);
    }
    ms.sort((a, b) => a - b);
    const med = ms.length ? ms[Math.floor(ms.length / 2)] : 0;
    lignes.push(`| ${cle} (${modele}) | ${contexte} | ${score.tenue}/${score.nTenue} | ${score.sujet}/${score.nTenue} | ${score.nReglage ? `${score.reglage}/${score.nReglage}` : '–'} | ${Object.values(fautes).join(' / ')} | ${ms.length ? (chf / ms.length).toFixed(4) : '–'} | ${med} | ${ms.length} |`);
    const t = (total[cle] ??= { justes: 0, n: 0, chf: 0, appels: 0 });
    t.justes += score.tenue; t.n += score.nTenue; t.chf += chf; t.appels += ms.length;
  }
  console.log(lignes.join('\n'));
  console.log('\n' + ordre.filter((c) => total[c]).map((c) => `${c} : tenues ${total[c].justes}/${total[c].n} (avec + sans) ; ${total[c].chf.toFixed(4)} CHF pour ${total[c].appels} appels`).join('\n'));
  console.log(`cumul voie banc-modeles au journal : ${cumuleVoie('banc-modeles').toFixed(4)} CHF\n\n${details.join('\n')}`);
}

async function main() {
  if (process.argv.includes('--tableau')) return tableau();
  /* D453 : `--modele lite|flash38|hydrogen --contexte avec|sans` : passe d'un modèle du banc comparatif (voie banc-modeles, son dossier, son budget). */
  const cle = arg('--modele') as CleModele | undefined;
  if (cle && !(cle in MODELES)) throw new Error('--modele lite|flash38|hydrogen attendu');
  const contexte = arg('--contexte') as Contexte | undefined;
  if (contexte && contexte !== 'avec' && contexte !== 'sans') throw new Error('--contexte avec|sans attendu');
  if (cle && !contexte) throw new Error('--modele demande --contexte avec|sans');
  const jeu = arg('--jeu');
  if (jeu && jeu !== 'tenue' && jeu !== 'reglage') throw new Error('--jeu tenue|reglage attendu');
  const VOIE = cle ? 'banc-modeles' : 'c70-ia';
  const SORTIES = cle ? SORTIES_MODELES : SORTIES_C70;
  const passe = cle ? `${cle}-${contexte}` : arg('--passe');
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
    const cleApi: string | undefined = garde.readLocalKey({});
    if (!cleApi) throw new Error('Aucune clé Gemini lisible : aucun appel.');
    const budget = Number(arg('--budget') ?? 0.08);
    // Sans `--modele` : le modèle de production (`geminiAttempts`), inchangé ; avec, celui du banc comparatif (D453).
    const { model, thinkingLevel } = cle ? MODELES[cle] : geminiAttempts('rangerCarnet', 'fast')[0];
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
    let depense = cumuleVoie(VOIE), engage = 0, plusCher = Math.max(0, ...deja);
    const appeler = async (p: PhraseBanc) => {
      const corps = geminiBody({ systemPrompt: tache.def.system, userText: userTextOf(undefined, contexteBanc(PREFIXE + p.texte, carnetsEnContexte(p, contexte))), schema: tache.def.schema as Record<string, unknown>,
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
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cleApi }, body: JSON.stringify(devis.body), signal: AbortSignal.timeout(60_000) });
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
      fs.writeFileSync(fichier, JSON.stringify({ passe, cle, contexte, modele: model, reflexion: thinkingLevel, date: new Date().toISOString(), reponses }, null, 1));
    };
    if (fs.existsSync(fichier)) reponses = JSON.parse(fs.readFileSync(fichier, 'utf8')).reponses ?? {};
    const seul = arg('--seul')?.split(',');
    // Une phrase déjà rangée dans cette passe ne se repaie pas.
    const file = PHRASES.filter((p) => (!seul || seul.includes(p.id)) && (!jeu || p.jeu === jeu) && !reponses[p.id]);
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
  // Les fixtures d'une passe de modèle vont dans leur propre dossier (tests/fixtures/banc-modeles/<modèle>-<contexte>/), jamais sur celles de c70-ia.
  const dossierFixtures = cle ? path.join(FIXTURES_MODELES, passe) : FIXTURES;
  for (const p0 of PHRASES) {
    if (jeu && p0.jeu !== jeu) continue;
    const r = reponses[p0.id];
    const p = phraseEnContexte(p0, contexte);
    const v = lireEtJuger(p, r?.brut ?? null, carnetsEnContexte(p0, contexte));
    if (v.juste) score[p.jeu]++;
    lignes.push(`${v.juste ? '✓' : '✗'} ${p.id} ${v.vu.genre} | ${[v.vu.domaine ?? '∅', ...(v.vu.chemin ?? [])].join(' › ')} | « ${v.vu.titre ?? '∅'} »${v.vu.tache ? ` | tâche « ${v.vu.tache} »` : ''}${v.fautes.length ? `  — ${v.fautes.join(' ; ')}` : ''}`);
    if (process.argv.includes('--fixtures') && r?.brut) {
      fs.mkdirSync(dossierFixtures, { recursive: true });
      fs.writeFileSync(path.join(dossierFixtures, `${p.id}.json`), JSON.stringify({ id: p.id, jeu: p.jeu, passe, ...(contexte ? { contexte } : {}), texte: PREFIXE + p.texte, brut: r.brut, vu: v.vu, juste: v.juste, fautes: v.fautes }, null, 1) + '\n');
    }
  }
  const chf = Object.values(reponses).reduce((s, r) => s + (r.chf ?? 0), 0);
  console.log(lignes.join('\n'));
  console.log(`\nPASSE ${passe} : réglage ${score.reglage}/8 ; TENUES À PART ${score.tenue}/8 ; coût de la passe ${chf.toFixed(4)} CHF ; cumul voie ${cumuleVoie(VOIE).toFixed(4)} CHF`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((e) => { console.error(`ECHEC : ${e instanceof Error ? e.message : String(e)}`); process.exit(1); });
}
