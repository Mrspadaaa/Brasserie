/**
 * Banc t2c — le niveau MAX (`TIERS.max` : 3.8, température 0,2, réflexion haute, 12 000 jetons de sortie) des tâches qui l'offrent : diagnostic de
 * brassin (`diagnoseBatch`), synthèse comptable (`monthlySummary`, la préparation de la déclaration) et anomalies des comptes (`detectAnomalies`).
 * Le corps est celui de la production (`TASKS[tâche]` + `geminiBody`) ; seul le modèle et la réflexion changent. Réglage ≤ low : corps « Rapide » (température 0,
 * 4 500 jetons) ; medium ou high : corps « Max » (température 0,2, 12 000 jetons).
 *
 * Vérité écrite AVANT les passes, fixtures SYNTHÉTIQUES (aucune donnée réelle) : chaque cas a des contrôles chiffrés que le code applique (aucun juge humain ni IA) :
 *   diagnostic  atténuation apparente recalculée, gravité attendue, causes et actions attendues, rien d'inventé quand tout est normal ou quand les relevés manquent ;
 *   anomalies   défauts plantés (doublon, montant, TVA, justificatif, date) parmi des leurres légitimes : rappel, précision (faux positifs), types ;
 *   synthèse    totaux, solde, catégories, TVA seulement si assujetti, apport privé exclu, montant manquant signalé et jamais complété.
 * Moitié « choix » : cas impairs (D1, D3, A, M1) ; « jugement » : cas pairs (D2, D4, B, M2) : L20.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { TASKS } from '../functions/src/prompts';
import { geminiBody, userTextOf } from '../functions/src/geminiBody';
import { appeler, corpsReglage, creerEnv, enParallele, envoyerReseau, envoyerSimule, f2, jsonReponse, parseReglage, statCellule, MISSION_DIR, type EnvT2, type StatCellule } from './banc-t2c-commun';
import { normaliser } from './banc-compagnon-grille';
// @ts-ignore — module JavaScript sans types
import { readLocalKey, redact } from './gemini-usage-bench-guard.mjs';
// @ts-ignore — module JavaScript sans types
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';

export const DOSSIER_VOIE = `${MISSION_DIR}/voies/t2c`;
export type Tache = 'diagnoseBatch' | 'detectAnomalies' | 'monthlySummary';
export interface Controle { label: string; ok: (v: any, texte: string) => boolean }
export interface CasMax { id: string; tache: Tache; moitie: 'choix' | 'jugement'; instruction: string; context: unknown; controles: Controle[] }

const arrondi = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const proche = (v: unknown, cible: number, tol = 0.011) => arrondi(v) && Math.abs((v as number) - cible) <= tol;
const texteDe = (v: any) => normaliser(JSON.stringify(v ?? ''));

// --- Diagnostic de brassin ------------------------------------------------------------------------------------------------
const base = (nom: string, og: number) => ({ recipe: { name: nom, style: 'American Pale Ale', volumeL: 24, ogTarget: og, fgTarget: 1.012 }, yeast: { name: 'SafAle US-05', form: 'sèche', quantity: '1 sachet de 11,5 g', declaredAttenuationPct: 81 }, phase: 'fermentation' });
export const DIAGNOSTICS: CasMax[] = [
  { id: 'D1-calage', tache: 'diagnoseBatch', moitie: 'choix', instruction: 'Diagnostique ce brassin.',
    context: { ...base('Pale du Pont', 1.058), pitchedTempC: 17, readings: [{ day: 0, sg: 1.058, tempC: 17 }, { day: 2, sg: 1.05, tempC: 15 }, { day: 4, sg: 1.044, tempC: 15 }, { day: 6, sg: 1.04, tempC: 15 }, { day: 8, sg: 1.04, tempC: 15 }], notes: ['Fermenteur à la cave, 15 °C constants.', 'Levure saupoudrée sans réhydratation.'] },
    controles: [
      { label: 'atténuation apparente 31 % (±2)', ok: v => proche(v.apparentAttenuationPct, 31, 2) },
      { label: 'gravité surveiller ou agir (ni normal, ni urgent)', ok: v => ['surveiller', 'agir'].includes(v.severity) },
      { label: 'cause : température trop basse', ok: (_v, t) => /froid|basse|15 ?°|temperature/.test(t) },
      { label: 'cause : levure (quantité, vitalité, réhydratation)', ok: (_v, t) => /sous-ensemenc|quantite|vitalite|rehydrat|levure/.test(t) },
      { label: 'action : réchauffer ou remuer', ok: (v, t) => /rechauff|monter|remonter|18|19|20 ?°|remu|tourner/.test(texteDe([v.immediateAction, v.causes]) + t) }] },
  { id: 'D2-normal', tache: 'diagnoseBatch', moitie: 'jugement', instruction: 'Diagnostique ce brassin.',
    context: { ...base('Pale du Pont', 1.05), pitchedTempC: 19, readings: [{ day: 0, sg: 1.05, tempC: 19 }, { day: 2, sg: 1.032, tempC: 19 }, { day: 4, sg: 1.016, tempC: 19 }, { day: 6, sg: 1.011, tempC: 19 }, { day: 7, sg: 1.011, tempC: 19 }, { day: 8, sg: 1.011, tempC: 19 }], notes: ['Rien de particulier.'] },
    controles: [
      { label: 'atténuation apparente 78 % (±2)', ok: v => proche(v.apparentAttenuationPct, 78, 2) },
      { label: 'gravité normal', ok: v => v.severity === 'normal' },
      { label: 'le verdict dit que c’est normal, sans inventer de problème', ok: (v, _t) => /normal|conforme|attendu|termine|stable|rien a signaler/.test(texteDe(v.verdict)) },
      { label: 'aucune cause probable à plus de 40 % (rien d’inventé)', ok: v => !(Array.isArray(v.causes) ? v.causes : []).some((c: any) => Number(c.probability) > 0.4 && Number(c.probability) <= 1) } ] },
  { id: 'D3-chaud', tache: 'diagnoseBatch', moitie: 'choix', instruction: 'Diagnostique ce brassin.',
    context: { ...base('Pale du Pont', 1.065), pitchedTempC: 24, readings: [{ day: 0, sg: 1.065, tempC: 24 }, { day: 1, sg: 1.048, tempC: 27 }, { day: 2, sg: 1.032, tempC: 28 }], notes: ['Mousse énorme, odeur de solvant et de banane.'] },
    controles: [
      { label: 'atténuation apparente 51 % (±2)', ok: v => proche(v.apparentAttenuationPct, 51, 2) },
      { label: 'gravité surveiller ou agir', ok: v => ['surveiller', 'agir'].includes(v.severity) },
      { label: 'cause : température trop élevée', ok: (_v, t) => /chaud|haute|elevee|27|28|temperature/.test(t) },
      { label: 'esters, alcools supérieurs, solvant', ok: (_v, t) => /ester|fusel|solvant|banane|alcool superieur|alcools superieurs/.test(t) },
      { label: 'action : refroidir', ok: (v, t) => /refroid|baisser|descend|bac|18 ?°|19 ?°|ruban/.test(texteDe([v.immediateAction, v.causes]) + t) }] },
  { id: 'D4-donnees-rares', tache: 'diagnoseBatch', moitie: 'jugement', instruction: 'Diagnostique ce brassin.',
    context: { ...base('Pale du Pont', 1.048), pitchedTempC: 18, readings: [{ day: 0, sg: 1.048, tempC: 18 }], notes: ['36 heures après l’ensemencement, aucune bulle dans le barboteur, 18 °C.'] },
    controles: [
      { label: 'aucune atténuation inventée (un seul relevé)', ok: v => v.apparentAttenuationPct === undefined || v.apparentAttenuationPct === null },
      { label: 'gravité normal ou surveiller (pas agir, pas urgent)', ok: v => ['normal', 'surveiller'].includes(v.severity) },
      { label: 'dit qu’il manque des relevés / mesurer la densité', ok: (_v, t) => /releve|mesur|densit|donnee|insuffisant|nouvelle lecture|inconnu/.test(t) },
      { label: 'pistes : étanchéité du couvercle, patience, délai de démarrage', ok: (_v, t) => /etancheit|joint|couvercle|bonde|patien|latence|delai|demarr|attendre/.test(t) }] }
];

// --- Anomalies des comptes ---------------------------------------------------------------------------------------------------
type Ligne = [string, string, string, string, string, number, number, boolean];
const ecritures = (liste: Ligne[]) => liste.map(([id, date, tiers, libelle, categorie, montantTtc, tvaRate, justificatif]) => ({ id, date, tiers, libelle, categorie, montantTtc, tvaRate, justificatif }));
const LEDGER_A = ecritures([
  ['T01', '2026-07-03', 'Brau- und Rauchshop', 'Malt Pilsner 25 kg', 'Matières premières', 78.4, 0.026, true], ['T02', '2026-07-08', 'SIG Fribourg', 'Électricité juillet', 'Énergie', 96.2, 0.081, true],
  ['T03', '2026-07-14', 'Régie du Centre', 'Loyer juillet', 'Loyer', 1200, 0, true], ['T04', '2026-07-19', 'Brewstore', 'Houblons Mosaic 500 g', 'Matières premières', 118.9, 0.026, true],
  ['T05', '2026-08-02', 'Brau- und Rauchshop', 'Levure SafAle US-05 x10', 'Matières premières', 184.5, 0.026, true], ['T06', '2026-08-03', 'Brau- und Rauchshop', 'Levure SafAle US-05 x10', 'Matières premières', 184.5, 0.026, true],
  ['T07', '2026-08-08', 'SIG Fribourg', 'Électricité août', 'Énergie', 104.1, 0.081, true], ['T08', '2026-08-14', 'Régie du Centre', 'Loyer août', 'Loyer', 1200, 0, true],
  ['T09', '2026-08-22', 'SIG Fribourg', 'Électricité septembre', 'Énergie', 1150, 0.081, true], ['T10', '2026-09-02', 'Brewstore', 'Houblons Citra 500 g', 'Matières premières', 62.4, 0.026, true],
  ['T11', '2026-09-09', 'Eckenstein', 'Sac de malt Munich 25 kg', 'Matières premières', 81.6, 0.19, true], ['T12', '2026-09-14', 'Régie du Centre', 'Loyer septembre', 'Loyer', 1200, 0, true],
  ['T13', '2026-09-21', 'Frigo Service SA', 'Cuve inox 300 L', 'Équipement', 2480, 0.081, false], ['T14', '2026-09-25', 'Garage Rey', 'Entretien du véhicule de livraison', 'Véhicule', 1350, 0.081, true],
  ['T15', '2027-03-14', 'SIOS', 'Fûts 20 L x4', 'Équipement', 340, 0.081, true], ['T16', '2026-10-03', 'SIG Fribourg', 'Électricité octobre', 'Énergie', 99.8, 0.081, true],
  ['T17', '2026-10-14', 'Régie du Centre', 'Loyer octobre', 'Loyer', 1200, 0, true], ['T18', '2026-10-19', 'Brau- und Rauchshop', 'Malt Pale 25 kg', 'Matières premières', 79.9, 0.026, true]]);
const LEDGER_B = ecritures([
  ['U01', '2026-08-04', 'Hopfen Müller', 'Houblon Hallertau 1 kg', 'Matières premières', 96, 0.026, true], ['U02', '2026-08-04', 'Hopfen Müller', 'Houblon Hallertau 1 kg', 'Matières premières', 96, 0.026, true],
  ['U03', '2026-08-10', 'Transports Dupont', 'Transport palette', 'Transport', 48, 0.081, true], ['U04', '2026-08-24', 'Transports Dupont', 'Transport palette', 'Transport', 55, 0.081, true],
  ['U05', '2026-09-07', 'Transports Dupont', 'Transport palette', 'Transport', 4800, 0.081, true], ['U06', '2026-09-12', 'Swisscom', 'Abonnement internet', 'Télécom', 69, 0.081, true],
  ['U07', '2026-10-12', 'Swisscom', 'Abonnement internet', 'Télécom', 69, 0.081, true], ['U08', '2026-09-15', 'Boulangerie du Centre', 'Repas de l’équipe', 'Frais', 38.5, 0.081, true],
  ['U09', '2026-09-18', 'Eckenstein', 'Bouteilles 50 cl x1000', 'Emballage', 410, 0.081, true], ['U10', '2026-09-27', 'Imprimerie Sarine', 'Étiquettes x5000', 'Emballage', 1920, 0.081, false],
  ['U11', '1999-05-02', 'Brewstore', 'Fût inox 30 L', 'Équipement', 289, 0.081, true], ['U12', '2026-10-02', 'Brau- und Rauchshop', 'Malt Pilsner 25 kg', 'Matières premières', 79.9, 0.081, true],
  ['U13', '2026-08-18', 'Brau- und Rauchshop', 'Malt Pilsner 25 kg', 'Matières premières', 78.4, 0.026, true], ['U14', '2026-09-16', 'Brau- und Rauchshop', 'Malt Pilsner 25 kg', 'Matières premières', 79.2, 0.026, true],
  ['U15', '2026-10-20', 'Brewstore', 'Houblon Cascade 500 g', 'Matières premières', 64.2, 0.026, true], ['U16', '2026-10-25', 'Garage Rey', 'Entretien du véhicule', 'Véhicule', 1350, 0.081, true],
  ['U17', '2026-10-28', 'SIG Fribourg', 'Électricité octobre', 'Énergie', 101.2, 0.081, true], ['U18', '2026-09-28', 'SIG Fribourg', 'Électricité septembre', 'Énergie', 97.8, 0.081, true]]);
export interface Plante { ids: string[]; type: string }
export const PLANTEES: Record<string, Plante[]> = {
  'A-anomalies-1': [{ ids: ['T05', 'T06'], type: 'doublon' }, { ids: ['T09'], type: 'montant' }, { ids: ['T11'], type: 'tva' }, { ids: ['T13'], type: 'justificatif' }, { ids: ['T15'], type: 'date' }],
  'B-anomalies-2': [{ ids: ['U01', 'U02'], type: 'doublon' }, { ids: ['U05'], type: 'montant' }, { ids: ['U10'], type: 'justificatif' }, { ids: ['U11'], type: 'date' }, { ids: ['U12'], type: 'tva' }]
};
export interface NoteAnomalies { rappel: number; precision: number; types: number; fauxPositifs: number; anomalies: number; manques: string[]; qualite: number }
/** Qualité = 0,5 rappel + 0,3 précision + 0,2 types (écrit avant les passes). Précision = anomalies qui touchent un défaut planté / toutes les anomalies (1 si aucune anomalie rendue et aucun défaut manqué n'est exigé : ici rappel 0). */
export function noterAnomalies(id: string, valeur: any): NoteAnomalies {
  const plantes = PLANTEES[id] ?? [];
  const liste: any[] = Array.isArray(valeur?.anomalies) ? valeur.anomalies : [];
  const ids = (a: any): string[] => Array.isArray(a?.transactionIds) ? a.transactionIds.map(String) : [];
  const trouve = plantes.map(p => liste.find(a => ids(a).some(i => p.ids.includes(i))));
  const rappel = plantes.length ? trouve.filter(Boolean).length / plantes.length : 0;
  const utiles = liste.filter(a => plantes.some(p => ids(a).some(i => p.ids.includes(i)))).length;
  const precision = liste.length ? utiles / liste.length : 0;
  const bonsTypes = plantes.filter((p, i) => trouve[i]?.type === p.type).length;
  const types = plantes.length ? bonsTypes / plantes.length : 0;
  const manques = plantes.filter((_p, i) => !trouve[i]).map(p => `${p.type} ${p.ids.join('+')}`);
  return { rappel, precision, types, fauxPositifs: liste.length - utiles, anomalies: liste.length, manques, qualite: 0.5 * rappel + 0.3 * precision + 0.2 * types };
}
export const ANOMALIES: CasMax[] = [
  { id: 'A-anomalies-1', tache: 'detectAnomalies', moitie: 'choix', instruction: 'Passe ces écritures au crible.', context: { dateDuJour: '2026-11-14', statut: { assujettiTva: false }, ecritures: LEDGER_A }, controles: [] },
  { id: 'B-anomalies-2', tache: 'detectAnomalies', moitie: 'jugement', instruction: 'Passe ces écritures au crible.', context: { dateDuJour: '2026-11-14', statut: { assujettiTva: false }, ecritures: LEDGER_B }, controles: [] }
];

// --- Synthèse comptable (préparation de la déclaration) -----------------------------------------------------------------------
const absentOuNul = (v: unknown) => v === undefined || v === null || v === 0;
const categorie = (v: any, motif: RegExp) => (Array.isArray(v.byCategory) ? v.byCategory : []).find((c: any) => motif.test(normaliser(String(c.category ?? ''))));
export const SYNTHESES: CasMax[] = [
  { id: 'M1-non-assujetti', tache: 'monthlySummary', moitie: 'choix', instruction: 'Synthèse de la période.',
    context: { period: '2026-10', statut: { assujettiTva: false }, ecritures: [
      { id: 'V01', date: '2026-10-03', libelle: 'Vente de fûts, Café du Pont', categorie: 'Ventes', type: 'recette', montantTtc: 1260 }, { id: 'V02', date: '2026-10-11', libelle: 'Vente de bouteilles au marché', categorie: 'Ventes', type: 'recette', montantTtc: 438.5 },
      { id: 'V03', date: '2026-10-24', libelle: 'Vente en ligne', categorie: 'Ventes', type: 'recette', montantTtc: 212 },
      { id: 'A01', date: '2026-10-02', libelle: 'Malt Pale 25 kg', categorie: 'Matières premières', type: 'charge', montantTtc: 79.9 }, { id: 'A02', date: '2026-10-06', libelle: 'Houblon Cascade 500 g', categorie: 'Matières premières', type: 'charge', montantTtc: 64.2 },
      { id: 'A03', date: '2026-10-09', libelle: 'Électricité', categorie: 'Énergie', type: 'charge', montantTtc: 101.2 }, { id: 'A04', date: '2026-10-14', libelle: 'Loyer octobre', categorie: 'Loyer', type: 'charge', montantTtc: 1200 },
      { id: 'A05', date: '2026-10-17', libelle: 'Étiquettes x5000', categorie: 'Emballage', type: 'charge', montantTtc: 412.3 }, { id: 'A06', date: '2026-10-21', libelle: 'Assurance', categorie: 'Assurances', type: 'charge', montantTtc: 183 },
      { id: 'A07', date: '2026-10-28', libelle: 'Levure SafAle US-05 x10', categorie: 'Matières premières', type: 'charge', montantTtc: null }, { id: 'A08', date: '2026-10-30', libelle: 'Houblon Citra 500 g', categorie: 'Matières premières', type: 'charge', montantTtc: 118.9 }] },
    controles: [
      { label: 'charges 2 159,50', ok: v => proche(v.totalCharges, 2159.5) }, { label: 'recettes 1 910,50', ok: v => proche(v.totalRecettes, 1910.5) }, { label: 'solde −249,00', ok: v => proche(v.solde, -249) },
      { label: 'matières premières 263,00', ok: v => proche(categorie(v, /mati/)?.total, 263) }, { label: 'loyer 1 200,00', ok: v => proche(categorie(v, /loyer/)?.total, 1200) },
      { label: 'aucune TVA inventée (non assujetti)', ok: v => absentOuNul(v.tvaCollected) && absentOuNul(v.tvaDeductible) },
      { label: 'montant manquant de la levure signalé, non complété', ok: (v, t) => /levure|a07|manquant|sans montant|non saisi|non renseign|incomplet/.test(texteDe([v.attentionPoints, v.highlights]) + t) }] },
  { id: 'M2-assujetti', tache: 'monthlySummary', moitie: 'jugement', instruction: 'Synthèse de la période.',
    context: { period: '2026-10', statut: { assujettiTva: true, methode: 'effective' }, ecritures: [
      { id: 'V01', date: '2026-10-05', libelle: 'Vente de fûts', categorie: 'Ventes', type: 'recette', montantTtc: 1081, tvaMontant: 81 }, { id: 'V02', date: '2026-10-19', libelle: 'Vente de bouteilles', categorie: 'Ventes', type: 'recette', montantTtc: 540.5, tvaMontant: 40.5 },
      { id: 'V03', date: '2026-10-20', libelle: 'Apport privé du brasseur', categorie: 'Apport privé', type: 'apport-prive', montantTtc: 5000 },
      { id: 'A01', date: '2026-10-02', libelle: 'Malt Pale 25 kg', categorie: 'Matières premières', type: 'charge', montantTtc: 102.6, tvaMontant: 2.6 }, { id: 'A02', date: '2026-10-09', libelle: 'Électricité', categorie: 'Énergie', type: 'charge', montantTtc: 108.1, tvaMontant: 8.1 },
      { id: 'A03', date: '2026-10-14', libelle: 'Loyer', categorie: 'Loyer', type: 'charge', montantTtc: 1500, tvaMontant: 0 }, { id: 'A04', date: '2026-10-22', libelle: 'Cuve inox 300 L', categorie: 'Équipement', type: 'charge', montantTtc: 540.5, tvaMontant: 40.5 }] },
    controles: [
      { label: 'charges 2 251,20', ok: v => proche(v.totalCharges, 2251.2) }, { label: 'recettes 1 621,50 (apport privé exclu)', ok: v => proche(v.totalRecettes, 1621.5) }, { label: 'solde −629,70', ok: v => proche(v.solde, -629.7) },
      { label: 'TVA collectée 121,50', ok: v => proche(v.tvaCollected, 121.5) }, { label: 'TVA déductible 51,20', ok: v => proche(v.tvaDeductible, 51.2) }, { label: 'loyer 1 500,00', ok: v => proche(categorie(v, /loyer/)?.total, 1500) }] }
];
export const CAS_MAX: CasMax[] = [...DIAGNOSTICS, ...ANOMALIES, ...SYNTHESES].sort((a, b) => a.moitie.localeCompare(b.moitie) || a.id.localeCompare(b.id));

/** Le corps de la production pour la tâche : température 0 et 4 500 jetons (Rapide) ou 0,2 et 12 000 (Max), selon la réflexion de la cellule. */
export function corpsTache(cas: CasMax, niveau: 'low' | 'medium' | 'high' | 'minimal' | 'xhigh') {
  const def = TASKS[cas.tache];
  const max = niveau === 'low' || niveau === 'minimal';
  return geminiBody({ systemPrompt: def.system, userText: userTextOf(cas.instruction, cas.context), schema: def.schema, settings: { temperature: max ? 0 : 0.2, thinkingLevel: max ? 'low' : 'high' }, maxOutputTokens: def.maxOutputTokens ?? 4500 });
}
export interface NoteCas { qualite: number; utilisable: boolean; passes: string[]; manques: string[]; detail?: NoteAnomalies }
export function noterCas(cas: CasMax, valeur: any, valide: boolean): NoteCas {
  if (!valide || !valeur || typeof valeur !== 'object') return { qualite: 0, utilisable: false, passes: [], manques: ['réponse inutilisable'] };
  if (cas.tache === 'detectAnomalies') { const d = noterAnomalies(cas.id, valeur); return { qualite: d.qualite, utilisable: Array.isArray(valeur.anomalies), passes: [], manques: d.manques, detail: d }; }
  const requis = TASKS[cas.tache].schema as any;
  const manquants = ((requis.required ?? []) as string[]).filter(cle => valeur[cle] === undefined || valeur[cle] === null);
  const t = texteDe(valeur);
  const passes: string[] = [], manques: string[] = [];
  for (const c of cas.controles) { let bon = false; try { bon = c.ok(valeur, t); } catch { bon = false; } (bon ? passes : manques).push(c.label); }
  return { qualite: cas.controles.length ? passes.length / cas.controles.length : 0, utilisable: manquants.length === 0 || (cas.id === 'D4-donnees-rares' && manquants.every(cle => cle === 'apparentAttenuationPct')), passes, manques };
}

export interface SortieMax { reglage: string; cas: string; tache: string; moitie: string; note: NoteCas; ms: number; coutMicro: number; etat: string; valeur?: any; erreur?: string }
export const slug = (t: string) => t.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
export async function jouerMax(options: { reglages: string[]; cas: string[]; sortie: string; workers: number }, env: EnvT2, log: (l: string) => void = () => {}): Promise<SortieMax[]> {
  const retenus = CAS_MAX.filter(c => !options.cas.length || options.cas.includes(c.id));
  const taches = options.reglages.flatMap(texte => { const reglage = parseReglage(texte); return retenus.map(cas => async () => {
    const fichier = path.join(options.sortie, slug(reglage.id), `${cas.id}.json`);
    if (existsSync(fichier)) { log(`déjà joué : ${reglage.id} / ${cas.id}`); return JSON.parse(readFileSync(fichier, 'utf8')) as SortieMax; }
    const corps = corpsReglage(corpsTache(cas, reglage.thinking.toLowerCase() as any), reglage, 12_000);
    const r = await appeler(env, { doc: `max-${cas.id}`, variante: cas.tache, reglage, body: corps, maxSortie: Number(corps.generationConfig.maxOutputTokens ?? 4500), timeoutMs: 120_000 });
    const lu = r.ok ? jsonReponse(r.payload) : { ok: false as const, raison: r.etat };
    const sortie: SortieMax = { reglage: reglage.id, cas: cas.id, tache: cas.tache, moitie: cas.moitie, note: noterCas(cas, lu.valeur, lu.ok), ms: r.ms, coutMicro: r.coutMicro, etat: r.etat, valeur: lu.valeur, erreur: r.erreur };
    mkdirSync(path.dirname(fichier), { recursive: true });
    writeFileSync(fichier, JSON.stringify(sortie, null, 1));
    log(`${reglage.id} / ${cas.id} : qualité ${f2(sortie.note.qualite)} ${sortie.note.utilisable ? '' : '(inutilisable) '}${(r.ms / 1000).toFixed(1)} s ${(r.coutMicro / 1e6).toFixed(4)} CHF sortie ${r.sortie ?? '?'}`);
    return sortie;
  }); });
  return enParallele(taches, options.workers, env);
}
export interface LigneMax extends StatCellule { moitie: string; tache: string; qualite: number | null }
export function agregerMax(sorties: SortieMax[], par: 'tache' | 'tout' = 'tache'): LigneMax[] {
  const groupes = new Map<string, SortieMax[]>();
  for (const s of sorties) for (const m of [s.moitie, 'tout']) for (const t of par === 'tache' ? [s.tache, 'toutes'] : ['toutes']) groupes.set(`${s.reglage}|${m}|${t}`, [...(groupes.get(`${s.reglage}|${m}|${t}`) ?? []), s]);
  return [...groupes.entries()].map(([cle, liste]) => { const [reglage, moitie, tache] = cle.split('|');
    return { ...statCellule(reglage, liste.map(s => ({ ms: s.ms, coutMicro: s.coutMicro, utilisable: s.note.utilisable }))), moitie, tache, qualite: liste.reduce((a, s) => a + s.note.qualite, 0) / liste.length };
  }).sort((a, b) => a.tache.localeCompare(b.tache) || a.moitie.localeCompare(b.moitie) || a.reglage.localeCompare(b.reglage));
}
export const tableauMax = (lignes: LigneMax[]) => ['| tâche | moitié | réglage | qualité | inutilisables | p50 s | p90 s | CHF/appel | appels |', '|---|---|---|---|---|---|---|---|---|',
  ...lignes.map(l => `| ${l.tache} | ${l.moitie} | ${l.reglage} | ${f2(l.qualite)} | ${l.inutilisables} | ${f2(l.p50, 1)} | ${f2(l.p90, 1)} | ${f2(l.chfParAppel, 4)} | ${l.appels} |`)].join('\n');
export function grilleMax(): string {
  return ['# Grille du niveau Max (écrite avant les passes, 14.11.2026, voie t2c)', '', 'Fixtures synthétiques ; chaque contrôle est appliqué par le code (`scripts/banc-t2c-max.ts`), sans juge.', '',
    ...CAS_MAX.map(c => c.tache === 'detectAnomalies' ? `## ${c.id} (${c.moitie}, ${c.tache})\nDéfauts plantés : ${PLANTEES[c.id].map(p => `${p.type} ${p.ids.join('+')}`).join(' ; ')}. Qualité = 0,5 rappel + 0,3 précision + 0,2 types ; faux positif = anomalie sans défaut planté.\n` : `## ${c.id} (${c.moitie}, ${c.tache})\n${c.controles.map(x => `- ${x.label}`).join('\n')}\n`)].join('\n');
}

export function lireArgs(args: string[]) {
  const valeurs = (nom: string) => args.flatMap((a, i) => (a === nom && args[i + 1] !== undefined ? [args[i + 1]] : []));
  const une = (nom: string) => valeurs(nom)[0];
  const nombre = (nom: string, defaut: number) => { const v = une(nom); const n = v === undefined ? defaut : Number(v); if (!(n > 0)) throw new Error(`${nom} attend un nombre positif.`); return n; };
  return { simuler: args.includes('--simuler'), payant: args.includes('--payant'), tableau: args.includes('--tableau'), grille: args.includes('--grille'), reglages: valeurs('--reglage'),
    cas: (une('--cas') ?? '').split(',').filter(Boolean), sortie: une('--out') ?? `${DOSSIER_VOIE}/max`, plafondPasse: nombre('--plafond-passe', 0.4), workers: nombre('--workers', 2) };
}
export async function main(args: string[]) {
  const o = lireArgs(args);
  if (o.grille) { writeFileSync(path.join(DOSSIER_VOIE, 'GRILLE-max.md'), grilleMax()); console.log('GRILLE-max.md écrit.'); return; }
  if (o.tableau) {
    const dossiers = readdirSync(o.sortie, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
    const sorties = dossiers.flatMap(d => readdirSync(path.join(o.sortie, d)).filter(n => n.endsWith('.json')).map(n => JSON.parse(readFileSync(path.join(o.sortie, d, n), 'utf8')) as SortieMax));
    const texte = tableauMax(agregerMax(sorties)); writeFileSync(path.join(o.sortie, 'tableau-max.md'), `${texte}\n`); console.log(texte); return;
  }
  if (!o.reglages.length) throw new Error('Au moins un --reglage <modèle>@<niveau>.');
  let env: EnvT2;
  if (o.simuler) env = creerEnv({ simuler: true, payant: false, plafondPasse: o.plafondPasse, journal: path.join(o.sortie, 'journal-simule.md') }, envoyerSimule());
  else {
    if (!o.payant) throw new Error('Passe payante : ajouter --payant --confirm-paid-ai (ou --simuler).');
    requirePaidAiTestOptIn({ label: `Banc t2c Max (${o.reglages.join(' | ')} × ${o.cas.length || CAS_MAX.length} cas, passe ${o.plafondPasse} CHF)`, command: 'npx vite-node --config vitest.config.ts scripts/banc-t2c-max.ts -- --payant --confirm-paid-ai --reglage <modèle@niveau> --cas <ids>' });
    const cle = readLocalKey();
    if (!cle) throw new Error('Aucune clé Gemini locale : aucun appel.');
    env = creerEnv({ simuler: false, payant: true, plafondPasse: o.plafondPasse, cle }, envoyerReseau(cle));
  }
  const sorties = await jouerMax({ reglages: o.reglages, cas: o.cas, sortie: o.sortie, workers: o.workers }, env, l => console.log(redact(l, env.cle)));
  console.log(`${o.simuler ? 'SIMULÉ ' : ''}Passe terminée : ${sorties.length} appels, ${(env.depensePasseMicro / 1e6).toFixed(4)} CHF${env.arret.raison ? ` ; ARRÊT : ${env.arret.raison}` : ''}.`);
  if (env.arret.raison) process.exitCode = 2;
}
const estPrincipal = () => !process.env.VITEST && ['--simuler', '--payant', '--tableau', '--grille'].some(drapeau => process.argv.includes(drapeau));
if (estPrincipal()) main(process.argv.slice(2)).catch(erreur => { console.error(String(erreur?.message ?? erreur)); process.exitCode = 1; });
