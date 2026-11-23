import type { Periode } from '../../../components/periode/periode';
import { fenetreDePeriode, lundi, periodeDeFenetre, plusJours, plusSemaines, semainesEntre, type FenetreSemaines } from '../../../domain/calendrier/temps';
import { echelleEffective, type Echelle } from '../echelle';

/**
 * Le cœur de la frise (D444, CAL-ETAT-COHERENT, 23.11 : « Toujours quelque problème avec la gestion des date, timing du graph.... »).
 *
 * UN seul état : la période que montre le cadre (`periode`), la vue, l'échelle voulue. Tout le reste s'en dérive (`lire`) : la fenêtre de
 * semaines, le libellé, l'échelle montrée. Avant, la fenêtre (`fenetre`), la période locale (`periodeLocale`), la vue, l'échelle voulue, la
 * fenêtre d'avant un geste et celle d'avant l'An vivaient chacune dans son état, rapprochées par des effets dans deux composants : un geste qui
 * n'en écrivait qu'une laissait « 24 sem. » sur un cadre de 4 ans, ou « An » sur deux mois (témoin rouge du tour 26). Ici, chaque geste est une
 * action ; le réducteur est pur et se teste par modèle (tests/unit/calendrierCadre.test.ts).
 *
 * Invariant : l'An (vue `annee` : mois sur la bande, « nov. – nov. 2027 ») est toujours un cadre de 52 semaines au moins ; un cadre plus court
 * le quitte, quel que soit le geste (période de l'app, poignée, durée, rotation).
 */

export type VueCadre = 'semaines' | 'annee' | 'liste' | 'graph';

export const SEMAINES_ANNEE = 52;
/** En paysage, la fenêtre montre au moins 13 semaines (E10). */
export const SEMAINES_PAYSAGE = 13;

/** L'horizon de la courbe : son premier lundi, son nombre de semaines, et le lundi d'aujourd'hui (le repli). */
export interface Horizon { premier: string; total: number; lundiAuj: string }

export interface Instantane { periode: Periode; vue: VueCadre; echelle: Echelle }

export interface EtatCadre {
  /** LA période du cadre : celle de l'app (« Nov. ») tant qu'aucun geste ne l'a changée, sinon des dates, du lundi au dimanche. */
  periode: Periode;
  vue: VueCadre;
  /** L'échelle voulue (Jour, Semaine, Mois), gardée par appareil ; la montrée en dérive selon la durée. */
  echelle: Echelle;
  paysage: boolean;
  /** CHN-6 : un cadre posé par un saut vers une chose (`centrerSur`) ne se garde pas au rechargement. */
  ephemere: boolean;
  /** CHG-5 : l'état d'avant le geste en cours (barre tenue au bord) ; un geste annulé le rend. */
  avantGeste: Instantane | null;
  /** La période d'avant l'An (quitter l'An la rend ; une durée choisie depuis l'An part de son début). */
  avantAnnee: Periode | null;
  /** E10 : la période d'avant la rotation en paysage, rendue au retour en portrait. */
  avantPaysage: Periode | null;
}

export type ActionCadre =
  /** La période de l'app a changé (barre de l'app, Finances) ; `gardee` : la fenêtre locale gardée pour cette période. */
  | { type: 'app'; periode: Periode | undefined; gardee?: Periode | null }
  /** Un geste a posé le cadre (poignées, corps, défilement, voir une chose, six semaines, renvoi, bande touchée). `vue` : la vue qu'il ouvre. */
  | { type: 'poser'; fenetre: FenetreSemaines; vue?: VueCadre }
  /** Le menu de période : 6 sem., 3 mois, 6 mois, An. */
  | { type: 'duree'; semaines: number }
  | { type: 'annee' }
  | { type: 'quitterAnnee' }
  | { type: 'vue'; vue: VueCadre }
  /** D385 : l'échelle choisie (menu, pincer) et la fenêtre qu'elle prend. */
  | { type: 'echelle'; echelle: Echelle; fenetre: FenetreSemaines }
  | { type: 'debutGeste' }
  | { type: 'finGeste'; annule: boolean }
  /** Annuler d'un message : l'état d'avant, tel quel. */
  | { type: 'restaurer'; avant: Instantane }
  | { type: 'orientation'; paysage: boolean }
  /** CHN-6 : un saut vers une chose pose la fenêtre sur elle, sans toucher la période gardée. */
  | { type: 'centrer'; fenetre: FenetreSemaines };

const repli = (h: Horizon): FenetreSemaines => ({ du: h.lundiAuj < h.premier ? h.premier : h.lundiAuj, semaines: 6 });
const totalDe = (h: Horizon) => Math.max(1, h.total);

/** La fenêtre de semaines du cadre, bornée à l'horizon ; en paysage, au moins 13 semaines. */
export function fenetreDuCadre(e: Pick<EtatCadre, 'periode' | 'paysage'>, h: Horizon): FenetreSemaines {
  const total = totalDe(h);
  const f = fenetreDePeriode(e.periode, h.premier, total) ?? repli(h);
  if (!e.paysage || f.semaines >= SEMAINES_PAYSAGE) return f;
  const n = Math.min(SEMAINES_PAYSAGE, total);
  const du = semainesEntre(h.premier, f.du) + n > total ? plusSemaines(h.premier, total - n) : f.du;
  return { du, semaines: n };
}

/** Une fenêtre bornée à l'horizon (début dedans, fin au plus à sa dernière semaine), écrite en période. */
function borner(f: FenetreSemaines, h: Horizon): Periode {
  const total = totalDe(h);
  const n = Math.max(1, Math.min(Math.round(f.semaines), total));
  let du = lundi(f.du);
  if (du < h.premier) du = h.premier;
  if (semainesEntre(h.premier, du) + n > total) du = plusSemaines(h.premier, total - n);
  return periodeDeFenetre({ du, semaines: n });
}

/** Ce que l'écran lit : tout dérive de l'état. */
export interface LectureCadre {
  fenetre: FenetreSemaines;
  vue: VueCadre;
  annee: boolean;
  /** L'échelle de l'axe permise par la durée. */
  echelle: Echelle;
  /** La période du cadre, en clair (le libellé « Nov. » d'un mois de l'app). */
  periode: Periode;
  /** Du lundi de la première semaine au dimanche de la dernière. */
  du: string;
  au: string;
}

export function lire(e: EtatCadre, h: Horizon): LectureCadre {
  const fenetre = fenetreDuCadre(e, h);
  const annee = e.vue === 'annee' && fenetre.semaines >= SEMAINES_ANNEE;
  return {
    fenetre, vue: e.vue === 'annee' && !annee ? 'semaines' : e.vue, annee, echelle: echelleEffective(e.echelle, fenetre.semaines, annee),
    periode: e.periode, du: fenetre.du, au: plusJours(plusSemaines(fenetre.du, fenetre.semaines), -1)
  };
}

/**
 * Après chaque action : l'An quitté par un cadre plus court (sa fenêtre d'avant l'An oubliée) ; l'échelle voulue suit celle que la durée permet
 * (une période réglée ailleurs que l'échelle ne permet pas la ramène à celle montrée, paquet F n° 3), sauf en paysage (13 semaines le temps de la
 * rotation) et dans l'An (ses mois).
 */
function normaliser(e: EtatCadre, h: Horizon): EtatCadre {
  const f = fenetreDuCadre(e, h);
  let s = e;
  if (f.semaines < SEMAINES_ANNEE) {
    if (s.vue === 'annee') s = { ...s, vue: 'semaines' };
    if (s.avantAnnee && s.vue !== 'liste') s = { ...s, avantAnnee: null };
  }
  if (s.paysage || s.vue === 'annee' || f.semaines >= SEMAINES_ANNEE) return s;
  const montree = echelleEffective(s.echelle, f.semaines, false);
  return montree === s.echelle ? s : { ...s, echelle: montree };
}

const instantane = (e: EtatCadre): Instantane => ({ periode: e.periode, vue: e.vue, echelle: e.echelle });
/** La vue d'un geste qui montre le calendrier : la Liste reste la Liste ; la courbe en grand se ferme. */
const calendrier = (v: VueCadre): VueCadre => (v === 'graph' ? 'semaines' : v);

function agir(e: EtatCadre, a: ActionCadre, h: Horizon): EtatCadre {
  switch (a.type) {
    case 'app': {
      const voulue = a.gardee ?? a.periode;
      /* « Tout » (sans bornes) et une période tout entière hors de l'horizon ne se lisent pas en semaines : le cadre reste le sien, écrit en dates */
      const f = voulue ? fenetreDePeriode(voulue, h.premier, totalDe(h)) : null;
      if (!voulue || !f) return { ...e, periode: periodeDeFenetre(fenetreDuCadre(e, h)), ephemere: false };
      /* CHV-4 : une plage qui commence avant l'horizon se lit posée à son début ; elle s'écrit telle qu'elle se montre */
      const periode = voulue.genre === 'dates' && lundi(voulue.du) < f.du ? periodeDeFenetre(f) : voulue;
      return { ...e, periode, ephemere: false, avantGeste: null };
    }
    case 'poser':
      return { ...e, periode: borner(a.fenetre, h), ephemere: false, vue: a.vue ?? e.vue };
    case 'centrer':
      return { ...e, periode: borner(a.fenetre, h), vue: 'semaines', ephemere: true, avantAnnee: null };
    case 'duree': {
      if (a.semaines >= SEMAINES_ANNEE) return agir(e, { type: 'annee' }, h);
      const depart = (e.avantAnnee ? fenetreDePeriode(e.avantAnnee, h.premier, totalDe(h)) : null) ?? fenetreDuCadre(e, h);
      return { ...e, periode: borner({ du: depart.du, semaines: a.semaines }, h), avantAnnee: null, ephemere: false, vue: e.vue === 'liste' ? 'liste' : 'semaines' };
    }
    case 'annee': {
      const f = fenetreDuCadre(e, h);
      const avant = f.semaines < SEMAINES_ANNEE ? e.periode : e.avantAnnee;
      /* l'An part du début de la fenêtre, calé pour que ses 52 semaines tiennent dans l'horizon ; en Liste, la Liste reste (l'en-tête lit l'An) */
      return { ...e, periode: borner({ du: f.du, semaines: Math.min(SEMAINES_ANNEE, totalDe(h)) }, h), avantAnnee: avant, ephemere: false, vue: e.vue === 'liste' ? 'liste' : 'annee' };
    }
    case 'quitterAnnee':
      return { ...e, periode: e.avantAnnee ?? periodeDeFenetre({ du: h.premier, semaines: 6 }), avantAnnee: null, ephemere: false, vue: e.vue === 'liste' ? 'liste' : 'semaines' };
    case 'vue':
      return { ...e, vue: a.vue };
    case 'echelle':
      return { ...e, echelle: a.echelle, periode: borner(a.fenetre, h), vue: 'semaines', avantAnnee: null, ephemere: false };
    case 'debutGeste':
      return e.avantGeste ? e : { ...e, avantGeste: instantane(e) };
    case 'finGeste':
      return a.annule && e.avantGeste ? { ...e, ...e.avantGeste, avantGeste: null } : { ...e, avantGeste: null };
    case 'restaurer':
      return { ...e, ...a.avant, avantGeste: null, ephemere: false };
    case 'orientation':
      if (a.paysage === e.paysage) return e;
      if (a.paysage) return { ...e, paysage: true, avantPaysage: e.periode };
      return { ...e, paysage: false, periode: e.avantPaysage ?? e.periode, avantPaysage: null };
  }
}

export function reduire(e: EtatCadre, a: ActionCadre, h: Horizon): EtatCadre {
  const s = agir(e, a, h);
  /* l'échelle voulue ne suit pas pendant un geste ni pour un Annuler : elle revient telle quelle */
  if (a.type === 'restaurer' || a.type === 'finGeste' || a.type === 'echelle') {
    const f = fenetreDuCadre(s, h);
    return f.semaines < SEMAINES_ANNEE && s.vue === 'annee' ? { ...s, vue: 'semaines' } : s;
  }
  return normaliser(s, h);
}

/**
 * L'état de départ : la fenêtre gardée pour cette période de l'app, sinon la période de l'app, sinon six semaines dès aujourd'hui. L-10 : une
 * fenêtre gardée de 52 semaines et plus revient en An, comme choisie au menu.
 */
export function etatInitial(o: { app: Periode | undefined; gardee: Periode | null; centrerSur?: string; echelle: Echelle; paysage: boolean }, h: Horizon): EtatCadre {
  const base: EtatCadre = { periode: periodeDeFenetre(repli(h)), vue: 'semaines', echelle: o.echelle, paysage: o.paysage, ephemere: false, avantGeste: null, avantAnnee: null, avantPaysage: null };
  if (o.centrerSur) return reduire(base, { type: 'centrer', fenetre: { du: lundi(plusJours(o.centrerSur, -14)), semaines: 6 } }, h);
  const voulue = o.gardee ?? o.app;
  const f = voulue ? fenetreDePeriode(voulue, h.premier, totalDe(h)) : null;
  const s: EtatCadre = voulue && f ? { ...base, periode: voulue, vue: o.gardee && f.semaines >= SEMAINES_ANNEE ? 'annee' : 'semaines' } : base;
  return o.paysage ? { ...s, avantPaysage: s.periode } : s;
}

export const instantaneDe = instantane;
