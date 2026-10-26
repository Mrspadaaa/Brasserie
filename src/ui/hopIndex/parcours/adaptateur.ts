// Adaptateur du moteur v4 (qui importe le moteur V5.5 de l'app), calculé en direct dans le navigateur, sans
// grille précalculée. Une fonction par besoin d'écran, typée, mémoïsée et chronométrée (mesure.ts).
// Unités : IBU en IBU (BrewingMath.hopIbu) ; profil en points 0–100 de l'échelle des axes V5.5 (style-bands.json),
// toujours SIMULÉ (couche de lecture profil-simule.ts, « ~ ») sauf la famille dégustée ; α en % m/m ; doses en g.
// Inconnu ≠ 0 : une valeur qu'on ne sait pas est `null` avec sa raison, jamais un zéro.
import {
  FAMILIES, FAMILY_NAMES, MOMENTS, cransOf, getStyleScale,
  type Direction, type Voie, type VoieResult,
  type AjoutSimule, type CasSimule, type FamilyId, type FamilyStatus, type MomentSimule, type ProfilFamilles, type Recipe, type StyleScale,
} from '../../../domain/hopIndex/v4';
import { ibuPerGram, ibuPerGramAt } from '../../../domain/hopIndex/v4/recipe';
import type { AjoutPouvoir, RecettePouvoir } from '../../../domain/hopIndex/v4/pouvoir';
import { CONDITIONS } from './conditions';
import { alphaDeAjout, alphaDeCle, catalogueDuMoteur, donnees, moteur, proposable, siDonneesChangent, stockLibre } from './donnees';
import { placer, quandDe } from './quand';
import { autresDe } from '../fiche/autres';
import type { AjoutParcours, Quand, RecetteParcours } from './types';
import { memo, viderCaches } from './mesure';

export { mesures, medianeRecalcul, viderMesures } from './mesure';
// Données injectées (B2) : catalogue, stock, dégustation, α du lot par ajout. Défaut : les fixtures.
export { configurerDonnees, donnees, type DonneesParcours, type DegustationParcours } from './donnees';
siDonneesChangent(viderCaches);
export const UNITES = { ibu: 'IBU', profil: 'points 0–100 (axes V5.5), simulé', alpha: '% m/m', dose: 'g', doseGL: 'g/L', jours: 'jours de contact' } as const;

// ---------- Types rendus aux écrans ----------
export interface Plage { valeur: number; min: number; max: number }
/** IBU d'un ajout : plage par l'α (lot, sinon plage variétale) ; null à froid (non modélisé) ou α inconnu. */
export interface IbuLu { ibu: Plage | null; raison: string | null }
export interface FamilleLue {
  famille: FamilyId; nom: string; statut: FamilyStatus;
  /** Bande du style 16D sur 0–100, null hors style documenté. */
  bande: [number, number] | null;
  /** null = inconnu (rien de simulé, pas une preuve d'absence). */
  valeur: { bas: number; centre: number; haut: number } | null;
  /** Crans du style sur le centre : 0–3 dans la bande, 4 au-dessus, −1 en dessous (CRANS_RULE). */
  crans: number | null;
  source: 'simulé' | 'dégustation';
  horsStyle: 'au-dessus' | 'en dessous' | null;
  /** Borne haute partielle (composés sans borne publiée) : le vrai haut peut être plus haut. */
  hautPartiel: boolean;
  raison: string | null;
}
export type ProfilLu = Record<FamilyId, FamilleLue>;
export interface BiereLue {
  ibu: Plage & { inconnus: string[] };
  ibuParAjout: Record<string, IbuLu>;
  bandeIbu: [number, number] | null;
  og: number; ebc: number | null;
  profil: ProfilLu;
  /** Ajouts dont l'arôme n'est pas simulé (moment hors du simulateur) : le profil les ignore. */
  nonSimules: { ajoutId: string; raison: string }[];
  /** Un ajout dégusté a été retiré ou changé : sa part simulée est retranchée du profil dégusté. */
  retraits: string[];
  confiance: CasSimule['confiance'];
  drapeaux: string[];
}
export type Ecart = { centre: number; bas: number; haut: number } | null;
export type EcartProfil = Record<FamilyId, Ecart>;

// ---------- Style et outils ----------
const STYLES = new Map<string, StyleScale>();
export function style(code: string): StyleScale {
  if (!STYLES.has(code)) STYLES.set(code, getStyleScale(code));
  return STYLES.get(code)!;
}
const fam = <T>(fn: (f: FamilyId) => T) => Object.fromEntries(FAMILIES.map((f) => [f, fn(f)])) as Record<FamilyId, T>;
const r2 = (x: number) => Math.round(x * 100) / 100;
const cleRecette = (r: Recipe) => JSON.stringify([r.styleCode, r.volumeL, r.og, r.boilMin, r.yeastId, r.additions]);

// ---------- IBU (BrewingMath.hopIbu, via le moteur v4) ----------
function ibuParGrammeA(alpha: number, q: Quand, recette: Recipe, a?: AjoutParcours): number | null {
  switch (q.type) {
    case 'premierMout': return ibuPerGram(alpha, 'fwh', recette);
    case 'ebullition': return ibuPerGramAt(alpha, 'boil', q.minutes, undefined, recette);
    // Whirlpool : le préréglage du moteur v4 (80 °C, 20 min), comme ibuPerGram('wp') ; la durée et la température de
    // la recette de l'app quand la conversion les donne (même BrewingMath.hopIbu que la page recette).
    case 'whirlpool': return a && (a.minutes != null || a.tempC != null) ? ibuPerGramAt(alpha, 'whirlpool', a.minutes ?? 20, a.tempC ?? 80, recette) : ibuPerGram(alpha, 'wp', recette);
    case 'dryhop': return null;
  }
}
/** IBU d'un ajout à sa dose et à son moment (minutes libres par 5′). α : celui du lot de la recette s'il est donné,
 * sinon celui du stock, sinon la plage variétale (moteur/donnees.ts). */
export function ibuAjout(a: AjoutParcours, recette: RecetteParcours): IbuLu {
  const q = quandDe(a, recette);
  if (q.type === 'dryhop') return { ibu: null, raison: 'à froid : IBU non modélisé' };
  if (recette.ibuInconnu) return { ibu: null, raison: recette.ibuInconnu };
  if (a.momentInconnu) return { ibu: null, raison: a.momentInconnu };
  const al = alphaDeAjout(a);
  if (!al) return { ibu: null, raison: a.alphaLot === null ? 'α du lot inconnu : IBU incalculable' : 'α inconnu : IBU incalculable' };
  const k = (x: number) => a.grams * (ibuParGrammeA(x, q, recette, a) ?? 0);
  return { ibu: { valeur: k(al.value), min: k(al.min), max: k(al.max) }, raison: null };
}

// ---------- Profil simulé de la bière ----------
const ARÔME_EBULLITION: Record<number, MomentSimule> = { 60: 'b60', 10: 'b10' };
/** Un ajout du parcours dans le simulateur, ou la raison pour laquelle il n'y entre pas. */
export function versSimule(a: AjoutParcours, recette: RecetteParcours): AjoutSimule | { raison: string } {
  const q = quandDe(a, recette);
  const base = { id: a.id, houblon: a.hopKey, dose_gL: a.grams / recette.volumeL };
  if (!moteur().hopRef(a.hopKey)) return { raison: 'houblon absent des fiches du moteur : arôme non simulé' };
  if (a.momentInconnu) return { raison: a.momentInconnu };
  if (q.type === 'premierMout') return { raison: 'premier moût : arôme non simulé par le moteur' };
  if (q.type === 'whirlpool') return { ...base, moment: 'wp' };
  if (q.type === 'ebullition') {
    const m = ARÔME_EBULLITION[q.minutes];
    return m ? { ...base, moment: m } : { raison: `ébullition ${q.minutes}′ : le moteur simule l'arôme à 60′ et 10′ seulement` };
  }
  const moment: MomentSimule = q.phase === 'actif' ? 'dryActive' : 'dryPost';
  return { ...base, moment, jourDebut: a.day ?? CONDITIONS.jourDebut[moment], jours: q.jours };
}
const versPouvoir = (a: AjoutParcours): AjoutPouvoir => ({ ...a, ...(a.moment === 'dryActive' || a.moment === 'dryPost' ? { dureeJours: a.jours ?? CONDITIONS.jours } : {}) });
const recettePouvoir = (r: RecetteParcours, additions: AjoutParcours[]): RecettePouvoir => ({ ...r, additions: additions.map(versPouvoir) });

const memeAjout = (a: AjoutParcours, b: AjoutParcours) =>
  a.hopKey === b.hopKey && a.grams === b.grams && a.moment === b.moment && (a.minutes ?? null) === (b.minutes ?? null) && (a.jours ?? null) === (b.jours ?? null) && (a.day ?? null) === (b.day ?? null);

const profilSansDegustation = memo('profilSansDegustation', (r: RecettePouvoir, levure: string) => cleRecette(r) + levure,
  (r: RecettePouvoir, levure: string): ProfilFamilles => moteur().simulerCas({ id: 'sans', titre: 'sans dégustation', ajouts: [], levure, recette: r, degustation: null, complet: false }).avant);

function lu(f: FamilyId, v: { bas: number; centre: number; haut: number; source: 'simulé' | 'dégustation'; inconnu?: string; hautPartiel?: string[] }, sc: StyleScale, decrite = true): FamilleLue {
  const fs = sc.families[f];
  // D40 point 6 (D35, D65, D14) : une famille simulée n'est placée que si une fiche d'un houblon de la recette la décrit ;
  // sinon « non située » (Végétal pour Nugget, comme sa base : « 6 au style · 5 non situées »). La dégustation reste placée.
  if (v.source === 'simulé' && !decrite) v = { ...v, inconnu: v.inconnu ?? 'aucune fiche des houblons de la recette ne la décrit', bas: 0, centre: 0, haut: 0 };
  const inconnu = !!v.inconnu && v.haut === 0;
  const crans = inconnu ? null : cransOf(f, v.centre, sc).crans;
  return {
    famille: f, nom: FAMILY_NAMES[f], statut: fs.status, bande: fs.band,
    valeur: inconnu ? null : { bas: r2(v.bas), centre: r2(v.centre), haut: r2(v.haut) },
    crans, source: v.source,
    horsStyle: crans == null ? null : crans >= 4 ? 'au-dessus' : crans < 0 && fs.status === 'attendue' ? 'en dessous' : null,
    hautPartiel: !!v.hautPartiel?.length, raison: inconnu ? v.inconnu! : null,
  };
}

/** Ce que la levure apporte seule : la recette sans houblon ni dégustation, simulée. */
const levureSeule = (recette: RecetteParcours, levure: string): ProfilFamilles => profilSansDegustation(recettePouvoir(recette, []), levure);

/** Ma bière lue : IBU (total, par ajout, bande du style), OG, EBC et profil au style des 12 familles.
 * Le profil part de la bière dégustée (la dégustation prime ; maquette : le 18.10), décalée par l'effet simulé des
 * ajouts nouveaux ; un ajout dégusté retiré ou changé retranche sa part simulée (sans dégustation). Sans dégustation
 * (données injectées) : tous les ajouts sont simulés sur une base sans houblon. */
export const lireBiere = memo('lireBiere', (r: RecetteParcours) => cleRecette(r), (recette: RecetteParcours): BiereLue => {
  const sc = style(recette.styleCode);
  const levure = recette.yeastId ?? CONDITIONS.levure;
  const deg = donnees().degustation;
  const base: RecetteParcours = deg ? deg.recette() : { ...recette, additions: [] };
  const gardes = base.additions.filter((b) => recette.additions.some((a) => a.id === b.id && memeAjout(a, b)));
  const retires = base.additions.filter((b) => !gardes.includes(b));
  const nouveaux = recette.additions.filter((a) => !gardes.some((b) => b.id === a.id));
  const nonSimules: BiereLue['nonSimules'] = [];
  const ajouts: AjoutSimule[] = [];
  for (const a of nouveaux) {
    const s = versSimule(a, recette);
    if ('raison' in s) nonSimules.push({ ajoutId: a.id, raison: s.raison }); else ajouts.push(s);
  }
  const rBase = recettePouvoir(recette, base.additions);
  const cas = moteur().simulerCas({ id: 'ma-biere', titre: recette.name, ajouts, levure, recette: rBase, degustation: deg?.tasting ?? null, complet: false });
  let p: ProfilFamilles = cas.apres;
  if (retires.length) {
    const avec_ = profilSansDegustation(rBase, levure);
    const sans = profilSansDegustation(recettePouvoir(recette, gardes), levure);
    p = fam((f) => {
      const d = sans[f].centre - avec_[f].centre, x = p[f];
      return { ...x, bas: Math.max(0, x.bas + d), centre: Math.max(0, x.centre + d), haut: Math.max(0, x.haut + d) };
    }) as ProfilFamilles;
  }
  const fond = !recette.additions.length && !deg ? moteur().recipeProfile(recette as never).profile : null;
  const ibuParAjout = Object.fromEntries(recette.additions.map((a) => [a.id, ibuAjout(a, recette)]));
  const valeurs = Object.values(ibuParAjout);
  const somme = (k: keyof Plage) => valeurs.reduce((s, x) => s + (x.ibu ? x.ibu[k] : 0), 0);
  // Inconnus : les ajouts à chaud dont l'IBU manque (α, moment ou densité inconnus) ; jamais comptés pour 0 en silence.
  const inconnu = (r: string | null) => !!r && (r.startsWith('α') || r === recette.ibuInconnu || recette.additions.some((a) => a.momentInconnu === r));
  return {
    ibu: { valeur: somme('valeur'), min: somme('min'), max: somme('max'), inconnus: recette.additions.filter((a) => inconnu(ibuParAjout[a.id].raison)).map((a) => a.id) },
    ibuParAjout, bandeIbu: sc.ibu, og: recette.og, ebc: recette.ebc ?? null,
    // D40 bis : une source décrit la famille : la fiche d'un houblon de la recette, ou la levure (ce qu'elle apporte seule,
    // sans houblon ni dégustation, sur la recette).
    profil: fam((f) => {
      // Sans houblon ni dégustation (sa page cas-k2) : le fond de levure du modèle (recipeProfile, comme son pack S4 : « sans
      // houblon, le modèle ne voit que le fond de levure US-05 ») ; la levure est la source de la famille placée.
      if (fond) { const e = fond[f]; return e.situated && e.range ? lu(f, { bas: e.range.min, centre: e.central ?? (e.range.min + e.range.max) / 2, haut: e.range.max, source: 'simulé' }, sc, true) : lu(f, { bas: 0, centre: 0, haut: 0, source: 'simulé', inconnu: 'sans houblon : la levure seule ne la situe pas' }, sc, false); }
      return lu(f, p[f], sc, recette.additions.some((a) => houblon(a.hopKey).familles[f].niveau !== 'non décrit') || levureSeule(recette, levure)[f].centre > 0.05);
    }), nonSimules, retraits: retires.map((b) => b.id), confiance: cas.confiance, drapeaux: cas.drapeauxIds,
  };
});

/** Écart simulé entre deux profils, famille par famille ; null si l'un des deux est inconnu. */
export function ecart(avant: ProfilLu, apres: ProfilLu): EcartProfil {
  return fam((f) => {
    const a = avant[f].valeur, b = apres[f].valeur;
    return a && b ? { centre: r2(b.centre - a.centre), bas: r2(b.bas - a.bas), haut: r2(b.haut - a.haut) } : null;
  });
}

// ---------- Un houblon ----------
export interface HoublonLu {
  cle: string; nom: string;
  /** false : houblon hors des fiches du moteur (`inconnu:<nom>` d'une vraie recette) ; la fiche est alors vide, jamais inventée. */
  connu: boolean;
  /** α du lot (stock ou article), sinon milieu de la plage variétale ; plage des fiches ; « ≠ » si le lot en sort. */
  alpha: { valeur: number; source: string; plage: [number, number] | null; horsFiches: boolean } | null;
  /** Rôle en mot du brasseur : « mixte » pour le « double » de la règle rôle-α v1 (D90). */
  role: { mot: 'amérisant' | 'aromatique' | 'mixte' | null; source: string };
  familles: Record<FamilyId, { niveau: 'non décrit' | 'cité' | 'marqué'; fiches: number; sur: number }>;
  /** Part des mots des fiches qui n'entrent dans aucune des 12 familles (L14), null sans aucun mot. */
  partSansFamille: number | null;
  motsSansFamille: string[];
  /** Stock libre en g ; null : pas au stock (catalogue). */
  stock: number | null;
  origine: string | null;
}
/** Un houblon que les fiches du moteur ne connaissent pas (`inconnu:hallertau` d'une recette réelle) : une fiche vide qui le dit.
 * Ni α, ni rôle, ni famille, ni stock inventés (inconnu ≠ 0) ; le nom est celui de la clé (plié par la conversion : sans accents). */
function houblonInconnu(cle: string): HoublonLu {
  const brut = cle.includes(':') ? cle.slice(cle.indexOf(':') + 1) : cle;
  const nom = brut.split('-').join(' ').split(' ').filter(Boolean).map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(' ') || cle;
  return {
    cle, nom, connu: false, alpha: null,
    role: { mot: null, source: 'houblon absent des fiches du moteur' },
    familles: fam(() => ({ niveau: 'non décrit' as const, fiches: 0, sur: 0 })),
    partSansFamille: null, motsSansFamille: [], stock: null, origine: null,
  };
}
export const houblon = memo('houblon', (cle: string) => cle, (cle: string): HoublonLu => {
  const h = moteur().hopRef(cle);
  if (!h) return houblonInconnu(cle);
  const a = moteur().hopAlpha(cle), plage = h.catalogue.alpha;
  const role = moteur().hopRole(cle);
  const d = moteur().describeFamilies(h.varietyId);
  // Un seul calcul des mots sans famille, en mots distincts traduits (fiche/autres.ts) : carte, fiche et « ? » le lisent.
  const au = autresDe(cle);
  return {
    cle, nom: h.name, connu: true,
    alpha: a ? { valeur: a.value, source: a.source, plage: plage ? [plage[0], plage[1]] : null, horsFiches: !!plage && (a.value < plage[0] || a.value > plage[1]) } : null,
    role: { mot: role.value === 'double' ? 'mixte' : role.value, source: role.source },
    familles: fam((f) => ({ niveau: d[f].level, fiches: d[f].sources, sur: d[f].of })),
    partSansFamille: au ? au.part : null,
    motsSansFamille: au ? au.mots.map((x) => x.mot) : [],
    stock: stockLibre(cle), origine: h.catalogue.origin,
  };
});

// ---------- Un ajout simulé ----------
/** `apres` ignore un ajout non simulé (voir apres.nonSimules) ; son `ecart` est alors null partout (inconnu). */
export interface AjoutLu { avant: BiereLue; apres: BiereLue; ecart: EcartProfil; ibu: IbuLu; quand: Quand; simule: boolean; raison: string | null }
/** Ma bière avant et après un ajout (ou un ajout changé), et l'écart simulé. */
export function simulerAjout(recette: RecetteParcours, ajout: AjoutParcours): AjoutLu {
  const avant = lireBiere(recette);
  const apresR = { ...recette, additions: [...recette.additions.filter((a) => a.id !== ajout.id), ajout] };
  const apres = lireBiere(apresR);
  const s = versSimule(ajout, apresR);
  // Arôme de l'ajout non simulé (ébullition hors 60′ et 10′, premier moût) : l'écart est INCONNU, jamais 0.
  const e = 'raison' in s ? null : ecart(avant.profil, apres.profil);
  // Un ajout dosé qui ne bouge aucune famille (Citra cryo : huiles du cryo non relevées) n'a pas d'effet nul : le
  // moteur n'a pas de donnée. L'écart est inconnu, jamais 0.
  const sansDonnee = !!e && ajout.grams > 0 && FAMILIES.every((f) => !e[f] || (e[f]!.centre === 0 && e[f]!.bas === 0 && e[f]!.haut === 0));
  const simule = !!e && !sansDonnee;
  const raison = 'raison' in s ? s.raison : sansDonnee ? 'aucune donnée d’huile pour ce houblon dans le moteur' : null;
  return { avant, apres, ecart: simule ? e! : fam(() => null), ibu: ibuAjout(ajout, apresR), quand: quandDe(ajout, apresR), simule, raison };
}

/** Crans de la frise de Dryhopper : ébullition par 5′ (durée → 0), whirlpool, dry hop actif et après, en jours. */
export function cransFrise(recette: RecetteParcours, joursMax = 7): Quand[] {
  const eb: Quand[] = [];
  for (let m = recette.boilMin; m >= 0; m -= 5) eb.push({ type: 'ebullition', minutes: m });
  const jours = Array.from({ length: joursMax }, (_, i) => i + 1);
  return [...eb, { type: 'whirlpool' }, ...jours.map((j): Quand => ({ type: 'dryhop', phase: 'actif', jours: j })), ...jours.map((j): Quand => ({ type: 'dryhop', phase: 'apres', jours: j }))];
}
/** Un ajout placé à un cran de la frise, simulé (calcul à chaque geste, mémoïsé). */
export const simulerMoment = (recette: RecetteParcours, ajout: AjoutParcours, q: Quand) => simulerAjout(recette, placer(ajout, q, recette));

// ---------- Voies du moteur (Suggérer de q2b, D105) ----------
/** Les voies du moteur pour une direction tirée de la dégustation (« + floral », « − résineux » : crans signés) :
 * ajouter (10′, whirlpool, dry hop), augmenter, diminuer, retirer, remplacer à IBU égal, assembler deux houblons du
 * stock ; classées par le moteur (RANKING) avec les achats possibles. C'est la source des voies de q2b, groupées par
 * effet à l'écran. Mémoïsé par recette et direction. */
const voiesProposees = (recette: RecetteParcours, direction: Direction, remplacements: boolean): VoieResult => {
  const res = moteur().proposeVoies(recette, direction, { tasting: donnees().degustation?.tasting ?? null, assemblages: true, ...(remplacements ? {} : { remplacements: false }) });
  // Catalogue injecté (app : catalogue de production, #120) : seules les voies dont tous les houblons sont
  // proposables restent. Catalogue du moteur (maquette) : rien n'est filtré.
  return catalogueDuMoteur() ? res : { ...res, voies: res.voies.filter((v) => v.actions.every((x) => x.op === 'retirer' || proposable(x.hopKey))) };
};
export const proposer = memo<[RecetteParcours, Direction], VoieResult>('proposer', (r, d) => cleRecette(r) + JSON.stringify(d), (recette, direction) => voiesProposees(recette, direction, true));
/** D106 (coût de Suggérer, « Attention au délais ajouter, la Responsive, réactivité ») : les mêmes voies SANS les remplacements (« remplacer à IBU égal » et à masse égale), qui portent l'essentiel du
 * surcoût de B1. C'est ce que Suggérer calcule à son premier affichage ; les remplacements arrivent ensuite, au repos, par l'appel complet (`proposer`), qui est celui de Ma bière et du préchauffage.
 * Mémoïsé à part : un résultat complet déjà gardé n'est pas relu ici (clé différente), mais l'écran le préfère dès qu'il l'a (suggerer/differe.ts). */
export const proposerRapide = memo<[RecetteParcours, Direction], VoieResult>('proposerRapide', (r, d) => cleRecette(r) + JSON.stringify(d), (recette, direction) => voiesProposees(recette, direction, false));

/** Les leviers levure du moteur (R43, R44), par recette et direction : le houblonnage à froid en fermentation active
 * (dry hop « actif ») et les changements de souche. Un calcul lourd (proposeVoies), servi par le client asynchrone. */
export interface LeviersLevure { dry: Voie[]; souches: Voie[] }
const LEVIERS = new Map<string, LeviersLevure>();
siDonneesChangent(() => LEVIERS.clear());
export function leviersLevure(recette: RecetteParcours, direction: Record<string, number>): LeviersLevure {
  const cle = JSON.stringify([recette.styleCode, recette.volumeL, recette.og, recette.boilMin, recette.yeastId, recette.additions, direction]);
  if (!LEVIERS.has(cle)) {
    const res = moteur().proposeVoies(recette, direction, { tasting: donnees().degustation?.tasting ?? null, assemblages: false, leviersLevure: true, remplacements: false, maxBuy: 0, moments: ['dryActive'] }); // D106 : les leviers ne lisent que le dry hop actif du STOCK et les souches : ni remplacements, ni pool à acheter, ni autres moments (inutile de les calculer)
    LEVIERS.set(cle, {
      dry: res.voies.filter((v) => v.type === 'levure' && !v.yeastChange && v.actions.length > 0 && v.actions.every((x) => x.op === 'ajouter' && x.moment === 'dryActive'))
        .filter((v) => catalogueDuMoteur() || v.actions.every((x) => proposable(x.hopKey))),
      souches: res.voies.filter((v) => v.type === 'levure' && !!v.yeastChange),
    });
    if (LEVIERS.size > 60) LEVIERS.delete(LEVIERS.keys().next().value!);
  }
  return LEVIERS.get(cle)!;
}

// ---------- Suggérer ----------
export interface Candidat { cle: string; houblon: HoublonLu; ajout: AjoutParcours; lu: AjoutLu; visee: Ecart; besoin: number; stockSuffisant: boolean | null }
/** Les houblons du stock (stock libre > 0) ajoutés aux conditions fixées (4 g/L, après fermentation, 3 j,
 * levure de la recette), classés par l'écart simulé sur la famille visée (puis par nom). */
export function suggerer(recette: RecetteParcours, visee: FamilyId, cond: { doseGL?: number; phase?: 'actif' | 'apres'; jours?: number } = {}): Candidat[] {
  const doseGL = cond.doseGL ?? CONDITIONS.doseGL;
  const q: Quand = { type: 'dryhop', phase: cond.phase ?? 'apres', jours: cond.jours ?? CONDITIONS.jours };
  const cles = [...new Set(donnees().stock.filter((s) => s.grams > 0).map((s) => s.key))];
  return cles.map((cle) => {
    const ajout = placer({ id: `essai-${cle}`, hopKey: cle, grams: doseGL * recette.volumeL, moment: 'dryPost' }, q, recette);
    const lu_ = simulerAjout(recette, ajout);
    const st = stockLibre(cle);
    return { cle, houblon: houblon(cle), ajout, lu: lu_, visee: lu_.ecart[visee], besoin: ajout.grams, stockSuffisant: st == null ? null : st >= ajout.grams };
  }).sort((a, b) => (b.visee?.centre ?? -Infinity) - (a.visee?.centre ?? -Infinity) || a.houblon.nom.localeCompare(b.houblon.nom, 'fr'));
}

// ---------- Comparer ----------
export interface Colonne { cle: string; houblon: HoublonLu; ajout: AjoutParcours; lu: AjoutLu }
/** N houblons à dose, moment et levure fixés (simulerCas pour chacun). */
export function comparer(recette: RecetteParcours, cles: string[], cond: { doseGL?: number; quand?: Quand } = {}): Colonne[] {
  const q = cond.quand ?? { type: 'dryhop', phase: 'apres', jours: CONDITIONS.jours };
  return cles.map((cle) => {
    const ajout = placer({ id: `comparer-${cle}`, hopKey: cle, grams: (cond.doseGL ?? CONDITIONS.doseGL) * recette.volumeL, moment: 'dryPost' }, q, recette);
    return { cle, houblon: houblon(cle), ajout, lu: simulerAjout(recette, ajout) };
  });
}

// ---------- Levure ----------
export interface EffetLevure { levure: string; lu: BiereLue; ecart: EcartProfil; reference: string }
/** Effet de chaque levure sur la bière avec l'ajout, face à la levure de la recette (référence). Le moteur ne
 * fait varier la levure qu'en dry hop actif (biotransformation) : ailleurs, l'écart simulé est nul ou inconnu. */
export function effetLevure(recette: RecetteParcours, ajout: AjoutParcours, levures: string[]): EffetLevure[] {
  const ref = recette.yeastId ?? CONDITIONS.levure;
  const avec_ = { ...recette, additions: [...recette.additions.filter((a) => a.id !== ajout.id), ajout] };
  const base = lireBiere(avec_);
  return levures.map((l) => {
    const lu_ = l === ref ? base : lireBiere({ ...avec_, yeastId: l });
    return { levure: l, lu: lu_, ecart: ecart(base.profil, lu_.profil), reference: ref };
  });
}

// ---------- Substituer ----------
export interface Remplacant {
  cle: string; houblon: HoublonLu; score: number; palier: string; raison: string;
  dose: { grams: number; min: number; max: number; regle: 'même IBU' | 'masse égale' };
  familles: { gagne: FamilyId[]; perd: FamilyId[] };
  composantes: { arome: number | null; huiles: number | null; amertume: number | null };
  stock: { etat: 'en stock' | 'épuisé' | 'à acheter'; libre: number | null; suffisant: boolean | null };
}
/** Remplaçants d'un ajout, au même moment (substitution calculée du moteur, « en stock d'abord », style de la recette). */
export const remplacants = memo<[RecetteParcours, string, number?], Remplacant[]>('remplacants', (r, id, limite = 8) => cleRecette(r) + id + limite,
  (recette, ajoutId, limite = 8) => {
    const a = recette.additions.find((x) => x.id === ajoutId);
    if (!a) return [];
    const res = moteur().substitutes(a.hopKey, { moment: a.moment, grams: a.grams, recipe: recette, style: style(recette.styleCode), stockFirst: true, limit: limite });
    return res.remplacants.filter((s) => proposable(s.key)).map((s) => {
      const d = doseRemplacement(recette, a, s.key);
      return {
        cle: s.key, houblon: houblon(s.key), score: s.score, palier: s.palier, raison: s.raison,
        dose: { grams: d.grams, min: d.min, max: d.max, regle: d.regle },
        familles: { gagne: s.familles.gagne.map((m) => m.family), perd: s.familles.perd.map((m) => m.family) },
        composantes: s.composantes, stock: s.stock,
      };
    });
  });

/** Dose du remplaçant au même moment : même IBU à chaud, masse égale à froid (règle de substitution.ts),
 * arrondie au gramme ; plage par la plage d'α du remplaçant. α inconnu : masse égale, avec la raison. */
export function doseRemplacement(recette: RecetteParcours, a: AjoutParcours, cle: string): { grams: number; min: number; max: number; regle: 'même IBU' | 'masse égale'; raison: string | null } {
  const q = quandDe(a, recette);
  const meme = (raison: string | null) => ({ grams: a.grams, min: a.grams, max: a.grams, regle: 'masse égale' as const, raison });
  if (q.type === 'dryhop') return meme('à froid : pas d’IBU, à masse égale');
  const ibu = ibuAjout(a, recette).ibu;
  const al = alphaDeCle(cle);
  if (!ibu || !al) return meme(!ibu ? 'IBU de l’original inconnu : masse égale' : 'α du remplaçant inconnu : masse égale');
  const g = (x: number) => ibu.valeur / (ibuParGrammeA(x, q, recette, a) ?? Infinity);
  return { grams: Math.round(g(al.value)), min: Math.round(g(al.max)), max: Math.round(g(al.min)), regle: 'même IBU', raison: null };
}

export const nomMoment = (q: Quand) =>
  q.type === 'premierMout' ? 'premier moût' : q.type === 'ebullition' ? `${q.minutes}′` : q.type === 'whirlpool' ? 'whirlpool' : `${q.phase} · ${q.jours} j`;
export { MOMENTS };
