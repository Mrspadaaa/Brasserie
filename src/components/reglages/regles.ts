// Les règles pures de l'écran Réglages (d3p2) : le bilan « à corriger · à saisir · bons », la santé de chaque onglet, le pied
// « Il reste N trous et N erreurs », la vente de 100 CHF coupée en HT et TVA, l'impôt par bouteille, le diagnostic d'un IBAN,
// le volume à chauffer avant l'ébullition. Aucune lecture du stockage ici : tout vient des arguments (testable sur fixture).
import type { AppConfig, BrewhouseProfile } from '../../types';
import { equipmentErrors, profileVolumeErrors } from '../../domain/brewEquipment';
import { brewingPreferenceErrors } from '../../domain/brewPreferences';
import { ibanCompact, ibanValide } from '../../domain/finance/iban';
import { nombreFr } from '../../domain/nombreAffiche';
import { uidValide, adresseBrasserie } from '../../domain/companyDefaults';
import { BAREME_IMPOT_BIERE, TAUX_NORMAL_PAR_HL } from '../../domain/finance/swissBeerTax';

export type Etat = 'ko' | 'to' | 'ok' | 'na';
export type OngletId = 'fiscal' | 'brewhouse' | 'security' | 'backup';
export const ONGLETS: OngletId[] = ['fiscal', 'brewhouse', 'security', 'backup'];

export interface Point { id: string; onglet: OngletId; etat: Etat; libelle: string }
export interface Bilan {
  points: Point[];
  /** Un segment par point mesuré, du plus grave au meilleur ; l'inconnu (« na ») n'a pas de segment. */
  segments: Etat[];
  ko: number; to: number; ok: number;
  parOnglet: Record<OngletId, Etat>;
}

const GRAVITE: Record<Etat, number> = { ko: 3, to: 2, ok: 1, na: 0 };
/** La pire des santés d'une liste ; sans point mesuré : « na » (inconnu, jamais « bon »). */
export const pireEtat = (etats: Etat[]): Etat => etats.reduce<Etat>((a, b) => (GRAVITE[b] > GRAVITE[a] ? b : a), 'na');

const nombreOk = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** L'IBAN réellement en jeu : celui du formulaire, sinon celui de la configuration de l'app (repli `.env`). */
export function etatIban(iban: string | undefined): Etat {
  if (!ibanCompact(iban)) return 'to';
  return ibanValide(iban) ? 'ok' : 'ko';
}

export interface DiagnosticIban { cause: 'format' | 'longueur' | 'cle'; court: string; /** indices dans l'IBAN compact des deux chiffres de contrôle (cause « cle ») */ cle?: [number, number] }
/**
 * Pourquoi un IBAN n'est pas valable, en peu de mots (la ligne le dit à sa place, jamais un pavé). `null` : vide ou valable.
 * Même contrôle que `ibanValide` (ISO 13616) : on ne redit pas le calcul, on nomme l'étape qui échoue.
 */
export function diagnosticIban(texte: string | undefined): DiagnosticIban | null {
  const iban = ibanCompact(texte);
  if (!iban || ibanValide(texte)) return null;
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return { cause: 'format', court: 'Format : deux lettres, deux chiffres, puis la suite' };
  if ((iban.startsWith('CH') || iban.startsWith('LI')) && iban.length !== 21) return { cause: 'longueur', court: `${iban.length} caractères · un IBAN suisse en a 21` };
  return { cause: 'cle', court: `Clé de contrôle fausse · ${iban.length} caractères`, cle: [2, 4] };
}

/** Le bilan de tous les réglages : un point par chose à régler, chacun « bon », « à saisir » (trou) ou « à corriger » (erreur). */
export function bilanReglages(
  config: AppConfig,
  opts: { ibanEffectif?: string; compteConnecte?: boolean } = {}
): Bilan {
  const p: Point[] = [];
  const add = (onglet: OngletId, id: string, libelle: string, etat: Etat) => p.push({ id, onglet, etat, libelle });
  const f = config.fiscal;
  const taux = (n: unknown) => (nombreOk(n) && n >= 0 && n <= 0.15 ? 'ok' : 'ko') as Etat;
  add('fiscal', 'tva-reduite', 'TVA réduite', taux(f.tvaReducedRate));
  add('fiscal', 'tva-normale', 'TVA normale', taux(f.tvaNormalRate));
  add('fiscal', 'tva-statut', 'Statut TVA', typeof f.isTvaRegistered === 'boolean' ? 'ok' : 'to');
  const reduction = f.beerTaxAnnualReductionPct;
  add('fiscal', 'ofdf-reduction', 'Réduction annuelle OFDF', nombreOk(reduction) ? (reduction >= 0 && reduction <= 40 ? 'ok' : 'ko') : 'to');
  add('fiscal', 'ofdf-annee', 'Année confirmée', nombreOk(f.beerTaxReductionYear) ? 'ok' : 'to');
  add('fiscal', 'ofdf-periodicite', 'Périodicité attribuée', f.beerTaxPeriod === 'annual' || f.beerTaxPeriod === 'quarterly' ? 'ok' : 'to');
  add('fiscal', 'iban', 'IBAN', etatIban(opts.ibanEffectif ?? config.company.iban));
  const c = config.company;
  const uid = (c.uid ?? '').trim();
  const adresse = adresseBrasserie(c);
  add('fiscal', 'identite', 'Identité de la brasserie', uid && !uidValide(uid) ? 'ko' : !uid || !adresse ? 'to' : 'ok');

  const bh: BrewhouseProfile | undefined = config.brewhouses.find(b => b.id === config.activeBrewhouseId) ?? config.brewhouses[0];
  if (!bh?.equipment) add('brewhouse', 'installation', 'Installation', 'to');
  else {
    const erreurs = [...equipmentErrors(bh.equipment), ...brewingPreferenceErrors(bh), ...profileVolumeErrors(bh)];
    add('brewhouse', 'installation', 'Installation', erreurs.length ? 'ko' : 'ok');
    add('brewhouse', 'limite-utile', 'Limite utile vérifiée', bh.equipment.workingVolumeConfirmed ? 'ok' : 'to');
  }

  add('security', 'compte', 'Compte Google', opts.compteConnecte === undefined ? 'na' : opts.compteConnecte ? 'ok' : 'to');
  // Sauvegardes : l'app ne garde nulle part la date de la dernière copie. Ni « bon » ni « à saisir » : inconnu.
  add('backup', 'copie', 'Dernière copie', 'na');

  const mesures = p.filter(x => x.etat !== 'na');
  const n = (e: Etat) => mesures.filter(x => x.etat === e).length;
  const parOnglet = Object.fromEntries(ONGLETS.map(o => [o, pireEtat(p.filter(x => x.onglet === o).map(x => x.etat))])) as Record<OngletId, Etat>;
  const segments = [...mesures].sort((a, b) => GRAVITE[b.etat] - GRAVITE[a.etat]).map(x => x.etat);
  return { points: p, segments, ko: n('ko'), to: n('to'), ok: n('ok'), parOnglet };
}

const pluriel = (n: number, un: string, plusieurs = `${un}s`) => `${n} ${n > 1 ? plusieurs : un}`;
/** Le pied d'un onglet : ce qui reste (trous, erreurs), sinon si une saisie attend d'être enregistrée. */
export function piedOnglet(bilan: Bilan, onglet: OngletId, modifie: boolean): { trous: number; erreurs: number; texte: string } {
  const pts = bilan.points.filter(x => x.onglet === onglet);
  const trous = pts.filter(x => x.etat === 'to').length;
  const erreurs = pts.filter(x => x.etat === 'ko').length;
  const reste = [trous ? pluriel(trous, 'trou') : '', erreurs ? pluriel(erreurs, 'erreur') : ''].filter(Boolean);
  const texte = reste.length ? `Il reste ${reste.join(' et ')}` : modifie ? 'Modifications non enregistrées' : 'Aucune modification';
  return { trous, erreurs, texte };
}

/** Une vente de `ttc` CHF TTC au taux `taux` : ce qui reste à la brasserie (HT) et la TVA. 100 / 1,081 = 92,51. */
export function ventilationVente(ttc: number, taux: number): { ht: number; tva: number; partTvaPct: number } | null {
  if (!nombreOk(ttc) || !nombreOk(taux) || taux < 0 || ttc <= 0) return null;
  const ht = ttc / (1 + taux);
  const tva = ttc - ht;
  return { ht, tva, partTvaPct: (tva / ttc) * 100 };
}

/** Les trois tranches de l'impôt sur la bière (CHF/hl), et celle de la bière normale, surlignée. */
export const TRANCHES_PLATO = BAREME_IMPOT_BIERE.map((t, i, tous) => ({
  libelle: i === 0 ? `jusqu’à ${nombreFr(t.jusquaPlato, 0)} °P` : t.jusquaPlato === Infinity ? `dès ${nombreFr(tous[i - 1].jusquaPlato + 0.1, 1)} °P` : `${nombreFr(tous[i - 1].jusquaPlato + 0.1, 1)} à ${nombreFr(t.jusquaPlato, 0)} °P`,
  chfParHl: t.chfParHl,
  normale: t.chfParHl === TAUX_NORMAL_PAR_HL
}));

/** Impôt sur une bouteille de `cl` cl, à `chfParHl` CHF/hl, après la réduction annuelle confirmée (0 à 40 %). */
export function impotParBouteille(chfParHl: number, cl: number, reductionPct?: number): number {
  const r = nombreOk(reductionPct) && reductionPct >= 0 && reductionPct <= 40 ? reductionPct : 0;
  return (chfParHl * (cl / 10000)) * (1 - r / 100);
}

/**
 * Le volume à chauffer pour obtenir `volumeFermenteurL` en fermenteur : (volume + pertes de fond) / (1 − rétraction) + évaporation × durée.
 * Même formule que `brewAssist` (évaporation × (1 − rétraction) × durée, rapportée au froid) et `brewerRecipeRefresh` (rétraction).
 * `null` si une donnée manque : l'inconnu n'est jamais 0.
 */
export function volumeAvantEbullition(bh: BrewhouseProfile, minutes = 60): number | null {
  const e = bh.equipment;
  if (!e || !nombreOk(bh.volumeL) || !nombreOk(bh.deadSpaceL) || !nombreOk(e.coolingShrinkagePct) || !nombreOk(e.boilOffLPerHour)) return null;
  if (e.coolingShrinkagePct < 0 || e.coolingShrinkagePct >= 100) return null;
  return (bh.volumeL + bh.deadSpaceL) / (1 - e.coolingShrinkagePct / 100) + (e.boilOffLPerHour * minutes) / 60;
}

/** Les champs de la brasserie qui comptent pour le point « Installation » : erreurs de l'installation active, dites en phrases. */
export function erreursInstallation(bh: BrewhouseProfile | undefined): string[] {
  if (!bh?.equipment) return [];
  return [...new Set([...equipmentErrors(bh.equipment), ...brewingPreferenceErrors(bh), ...profileVolumeErrors(bh)])];
}

/** Les modifications des Réglages en attente : le brouillon n'est pas la configuration enregistrée. */
export const brouillonModifie = (brouillon: AppConfig, enregistre: AppConfig): boolean => JSON.stringify(brouillon) !== JSON.stringify(enregistre);
