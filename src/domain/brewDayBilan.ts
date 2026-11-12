import type { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../types';
import { cibleMesure, densiteAvantEbullition, ecartHorsCible, isMash, sg, volumeTarget, type CibleMesure, type ReadingKind } from './brewDay';
import { actualAmount, boilMinutes, brewIngredients, isBoilStep } from './brewCompanion';
import { classerReleves, estEtapeCoupure, heureCoupure, heureFr, IDS_RELEVES, type IdReleve } from './brewMeasures';
import { nombreFr } from './nombreAffiche';

/**
 * « Relevés du jour · bilan visé » (p2c, port A1) : les relevés de TOUTE la journée, pas ceux de l'étape. Ce module est du calcul pur :
 * il ne dessine rien. Les composants (frise, bilan, carte Maintenant) reçoivent ces valeurs déjà prêtes.
 *
 * Règles tenues ici :
 * - une valeur absente est « ? », jamais 0 ; une cible que la recette ne donne pas n'est pas inventée ;
 * - la densité à la coupure (fin d'ébullition) n'est pas l'OG (moût refroidi) : deux relevés ;
 * - la bande de cible est celle de `cibleMesure` (une seule lecture, n° 2 de a1) ;
 * - une heure prévue vient du plan de la journée (A3) : sans elle, `null` (jamais une heure devinée).
 */
export type EtatReleve = 'ok' | 'ecart' | 'du' | 'afaire' | 'manque';

export interface ReleveDuJour {
  id: string;
  nom: string;
  /** ms : l'heure du relevé s'il est fait, sinon l'heure prévue ; `null` quand le plan ne la donne pas. */
  heure: number | null;
  etat: EtatReleve;
  /** Le relevé, formaté à la virgule ; « ? » quand il n'y en a pas (jamais 0). Pour une tuile double, les valeurs jointes. */
  valeur: string;
  /** Vrai si le brasseur a relevé la valeur (toutes les parties, pour une tuile double). */
  lu: boolean;
  cible?: string;
  /** Le petit texte du bas de la tuile (« ✓ dans la cible », « vers 15 h 05 », « température non relevée »…). */
  quand: string;
  stepId: string;
  kind: ReadingKind | 'paire';
  /** Tuile double ou à repère : les relevés qu'elle regroupe, un par nombre à afficher. */
  parties?: ReleveDuJour[];
  /** Un repère du plan qui n'est pas un relevé (« 18,5 L » d'eau d'empâtage) : affiché, jamais compté. */
  complement?: string;
}

export type HeuresPrevues = Partial<Record<IdReleve, number | null>>;

const MIN = 60000;
const MOINS = '−';
const signe = (n: number) => (n > 0 ? '+' : MOINS);

const valeurFr = (kind: ReadingKind, v: number) => (kind === 'densite' ? sg(v) : nombreFr(v, kind === 'ph' ? 2 : 1));

/** L'écart à la cible centrale, dit comme p2c : « −2 points » (densité), « −0,5 L », « +0,6 °C ». */
export function phraseEcartCentral(kind: ReadingKind, valeur: number, central: number): string {
  const d = valeur - central;
  if (kind === 'densite') {
    const pts = Math.round(Math.abs(d) * 1000);
    return `${signe(d)}${pts} ${pts > 1 ? 'points' : 'point'}`;
  }
  const unite = kind === 'volume' ? ' L' : kind === 'temperature' ? ' °C' : '';
  return `${signe(d)}${nombreFr(Math.abs(d), kind === 'ph' ? 2 : 1)}${unite}`;
}

interface Def {
  id: IdReleve;
  nom: string;
  kind: ReadingKind;
  stepId: string;
}
const DEFS: Def[] = [
  { id: 'eau-temp', nom: 'Eau d’empâtage', kind: 'temperature', stepId: 'eau' },
  { id: 'maische', nom: 'Maische', kind: 'temperature', stepId: 'mash-1' },
  { id: 'ph', nom: 'pH d’empâtage', kind: 'ph', stepId: 'mash-1' },
  { id: 'avant-volume', nom: 'Volume avant ébullition', kind: 'volume', stepId: 'preboil' },
  { id: 'avant-densite', nom: 'Densité avant ébullition', kind: 'densite', stepId: 'preboil' },
  { id: 'coupure', nom: 'Densité à la coupure', kind: 'densite', stepId: 'boil-fin' },
  { id: 'og', nom: 'OG · densité initiale', kind: 'densite', stepId: 'ensemencement' },
  { id: 'fermenteur', nom: 'Au fermenteur', kind: 'volume', stepId: 'ensemencement' },
  { id: 'ensemencement-temp', nom: 'Ensemencement', kind: 'temperature', stepId: 'ensemencement' }
];

/**
 * Les relevés de la journée, dans l'ordre de la journée : eau °C, maische, pH, volume et densité avant ébullition, coupure, OG, volume au
 * fermenteur, °C à l'ensemencement (9 au plus). Un relevé dont l'étape n'existe pas dans le déroulé de ce brassin (pas d'ébullition, pas
 * de contrôle avant ébullition) n'est pas listé, sauf s'il a été pris : le compteur dit « sur N » avec le N de ce brassin.
 *
 * États : `ok` (dans la cible, ou sans cible à comparer), `ecart` (hors de la bande de cible), `du` (à relever maintenant), `afaire`
 * (viendra), `manque` (son moment est passé sans relevé).
 */
export function relevesDuJour(
  state: BrewDayState,
  recipe: RecipeSnapshot | undefined,
  now: number,
  prevues: HeuresPrevues = {}
): ReleveDuJour[] {
  const lus = classerReleves(state);
  const fini = state.finishedAt != null;
  const etape = (id: string) => state.steps.find((s) => s.id === id);
  const courant = state.steps[state.currentIndex];
  const passe = (s?: BrewDayStep) => fini || s?.doneAt != null;
  const pseudo = (id: string): BrewDayStep => etape(id) ?? { id, label: id, durationMin: 0 };

  const paliers = state.steps.filter((s) => isMash(s.id) && (s.tempC ?? 0) < 75);
  const mashs = paliers.length ? paliers : state.steps.filter((s) => isMash(s.id));
  const finEbull = [...state.steps].reverse().find(estEtapeCoupure);
  const ensemencement = etape('ensemencement');
  const coupe = heureCoupure(state, recipe);
  const apresEbullition = fini || state.boilFinishedAt != null;

  const sortie: ReleveDuJour[] = [];
  for (const def of DEFS) {
    const r: BrewDayReading | undefined = lus[def.id];
    let valeurLue: number | undefined = r?.value;
    let heureLue: number | undefined = r?.at;
    let stepRef: BrewDayStep = pseudo(def.stepId);
    let cibleTexte: string | undefined;
    let central: number | undefined;
    let present = true;
    let manque = false;
    let du = false;
    let quandAFaire = '';
    let heurePrevue: number | null | undefined = prevues[def.id];

    switch (def.id) {
      case 'eau-temp': {
        const e = etape('eau');
        present = !!e || !!r;
        manque = passe(e) || (!!courant && state.currentIndex > state.steps.indexOf(e as BrewDayStep) && !!e);
        du = !!e && courant?.id === 'eau' && !passe(e);
        quandAFaire = 'avant l’empâtage';
        heurePrevue = heurePrevue ?? e?.startedAt ?? null;
        stepRef = e ?? stepRef;
        break;
      }
      case 'maische': {
        present = mashs.length > 0 || !!r;
        const refStep = (r && etape(r.stepId ?? '')) || mashs.find((s) => s.doneAt == null) || mashs.at(-1);
        if (refStep) stepRef = refStep;
        const lance = mashs.some((s) => s.startedAt != null && s.doneAt == null);
        manque = fini || (mashs.length > 0 && mashs.every((s) => s.doneAt != null));
        du = lance && !manque;
        quandAFaire = lance ? 'maintenant' : 'au départ du palier';
        heurePrevue = heurePrevue ?? mashs.find((s) => s.startedAt != null)?.startedAt ?? null;
        if (stepRef.tempC != null) {
          central = stepRef.tempC;
          cibleTexte = `${nombreFr(stepRef.tempC, 1)} °C`;
        }
        break;
      }
      case 'ph': {
        present = mashs.length > 0 || !!r;
        const refStep = (r && etape(r.stepId ?? '')) || mashs.find((s) => s.doneAt == null) || mashs.at(-1);
        if (refStep) stepRef = refStep;
        const depart = mashs.find((s) => s.startedAt != null)?.startedAt;
        const des = depart != null ? depart + 10 * MIN : undefined;
        manque = fini || (mashs.length > 0 && mashs.every((s) => s.doneAt != null));
        du = !manque && des != null && now >= des;
        quandAFaire = du ? 'maintenant' : des != null ? `dès ${heureFr(des)}` : 'dès 10 min de palier';
        heurePrevue = heurePrevue ?? des ?? null;
        cibleTexte = '5,2–5,5';
        break;
      }
      case 'avant-volume':
      case 'avant-densite': {
        const e = etape('preboil');
        present = !!e || !!r;
        manque = fini || passe(e) || state.boilStartedAt != null;
        du = !!e && courant?.id === 'preboil' && !manque;
        quandAFaire = 'avant l’ébullition';
        if (def.id === 'avant-volume') {
          const v = volumeTarget(pseudo('preboil'), recipe);
          if (v && v > 0) {
            central = v;
            cibleTexte = `${nombreFr(v, 1)} L`;
          }
        } else {
          const d = densiteAvantEbullition(recipe);
          if (d) {
            central = d;
            cibleTexte = sg(d);
          }
        }
        break;
      }
      case 'coupure': {
        present = !!finEbull || !!r;
        manque = fini || (!!finEbull && passe(finEbull)) || (!!finEbull && !!courant && state.steps.indexOf(courant) > state.steps.indexOf(finEbull));
        const proche = apresEbullition || (coupe != null && now >= coupe - 5 * MIN) || courant?.id === 'whirlpool';
        du = !manque && !!finEbull && proche && (courant?.id === finEbull.id || courant?.id === 'whirlpool' || courant == null || estEtapeCoupure(courant));
        quandAFaire = coupe != null ? `vers ${heureFr(coupe)}` : 'à la fin de l’ébullition';
        heurePrevue = heurePrevue ?? coupe ?? null;
        break;
      }
      case 'og': {
        present = !!ensemencement || !!r;
        manque = fini || state.pitchedAt != null || passe(ensemencement);
        du = !manque && courant?.id === 'ensemencement';
        quandAFaire = 'au fermenteur';
        const o = recipe?.ogTarget;
        if (o && o > 1) {
          central = o;
          cibleTexte = sg(o);
        }
        break;
      }
      case 'fermenteur': {
        present = !!ensemencement || !!r;
        manque = fini || state.pitchedAt != null || passe(ensemencement);
        du = !manque && courant?.id === 'ensemencement';
        quandAFaire = 'à l’ensemencement';
        const v = volumeTarget(pseudo('ensemencement'), recipe);
        if (v && v > 0) {
          central = v;
          cibleTexte = `${nombreFr(v, 1)} L`;
        }
        break;
      }
      case 'ensemencement-temp': {
        // La température du moût à l'ajout de la levure est portée par l'état (`recordPitch`), pas par un relevé d'étape.
        if (state.pitchTemperatureC != null && Number.isFinite(state.pitchTemperatureC)) {
          valeurLue = state.pitchTemperatureC;
          heureLue = state.pitchedAt ?? r?.at;
        }
        present = !!ensemencement || valeurLue != null;
        manque = fini || state.pitchedAt != null || passe(ensemencement);
        du = !manque && courant?.id === 'ensemencement';
        quandAFaire = 'à l’ensemencement';
        const t = ensemencement?.tempC;
        if (t != null) {
          central = t;
          cibleTexte = `${nombreFr(t, 1)} °C`;
        }
        break;
      }
    }

    if (!present) continue;
    const bande: CibleMesure | null =
      def.id === 'ph'
        ? cibleMesure('ph', stepRef)
        : def.id === 'avant-volume' || def.id === 'avant-densite'
          ? cibleMesure(def.kind, pseudo('preboil'), recipe)
          : def.id === 'og'
            ? cibleMesure('densite', pseudo('ensemencement'), recipe)
            : def.id === 'fermenteur'
              ? cibleMesure('volume', pseudo('ensemencement'), recipe)
              : def.id === 'ensemencement-temp'
                ? cibleMesure('temperature', pseudo('ensemencement'), recipe)
                : def.id === 'maische'
                  ? cibleMesure('temperature', stepRef, recipe)
                  : null;

    let etat: EtatReleve;
    let quand: string;
    let heure: number | null;
    if (valeurLue != null) {
      heure = heureLue ?? null;
      const ecart = ecartHorsCible(bande, valeurLue);
      etat = ecart != null ? 'ecart' : 'ok';
      if (ecart != null && central != null) quand = phraseEcartCentral(def.kind, valeurLue, central);
      else if (ecart != null) quand = `hors de la cible`;
      else if (bande) quand = '✓ dans la cible';
      else quand = heure != null ? `relevé à ${heureFr(heure)}` : 'relevé';
      // Un pH pris à chaud ne vaut pas celui d'un échantillon à 20–25 °C : la valeur reste, la réserve se dit.
      if (def.id === 'ph' && r && !r.roomTemp) quand += ' · à confirmer à froid';
    } else {
      heure = heurePrevue ?? null;
      etat = manque ? 'manque' : du ? 'du' : 'afaire';
      if (manque) quand = def.id === 'eau-temp' ? 'température non relevée' : 'non relevé';
      else if (du && def.id === 'coupure' && coupe != null && coupe > now) {
        const dans = Math.max(1, Math.ceil((coupe - now) / MIN));
        quand = `dans ${dans} min`;
      } else if (du) quand = def.id === 'coupure' ? 'avant le refroidissement' : 'maintenant';
      else if (heure != null && def.id !== 'ph' && def.id !== 'maische' && def.id !== 'eau-temp')
        quand = `${def.id === 'avant-volume' || def.id === 'avant-densite' || def.id === 'coupure' ? 'vers' : '~'} ${heureFr(heure)}`;
      else quand = quandAFaire;
      if (!manque && du && def.id === 'coupure' && coupe != null) cibleTexte = `à ${heureFr(coupe)}`;
    }

    sortie.push({
      id: def.id,
      nom: def.nom,
      heure,
      etat,
      valeur: valeurLue != null ? valeurFr(def.kind, valeurLue) : '?',
      lu: valeurLue != null,
      cible: cibleTexte ?? (def.id === 'coupure' ? 'pour agir avant le refroidissement' : undefined),
      quand,
      stepId: r?.stepId ?? stepRef.id ?? def.stepId,
      kind: def.kind
    });
  }
  return sortie;
}

/** « 0 relevé sur 9 », « 4 relevés sur 9 » : le compteur de la journée (celui d'une étape serait faux). */
export function compteReleves(releves: ReleveDuJour[]): { faits: number; total: number; libelle: string } {
  const atomes = releves.flatMap((r) => r.parties ?? [r]);
  const faits = atomes.filter((r) => r.lu).length;
  const total = atomes.length;
  return { faits, total, libelle: `${faits} ${faits > 1 ? 'relevés' : 'relevé'} sur ${total}` };
}

const RANG_TRI: Record<EtatReleve, number> = { du: 0, ecart: 1, afaire: 2, ok: 2, manque: 2 };

/** Le tri des tuiles : ce qui est dû, puis ce qui est en écart, puis le reste dans l'ordre de la journée (tri stable, l'entrée n'est pas modifiée). */
export function trierTuiles<T extends { etat: EtatReleve }>(tuiles: T[]): T[] {
  return tuiles.map((t, i) => ({ t, i })).sort((a, b) => RANG_TRI[a.t.etat] - RANG_TRI[b.t.etat] || a.i - b.i).map((x) => x.t);
}

const ORDRE_ETAT: EtatReleve[] = ['ecart', 'du', 'manque', 'afaire', 'ok'];
const pire = (etats: EtatReleve[]): EtatReleve => ORDRE_ETAT.find((e) => etats.includes(e)) ?? 'afaire';

function fusion(id: string, nom: string, parties: ReleveDuJour[], extra: Partial<ReleveDuJour> = {}): ReleveDuJour {
  const lus = parties.filter((p) => p.lu);
  const heures = parties.map((p) => p.heure).filter((h): h is number => h != null);
  return {
    id,
    nom,
    heure: heures.length ? (lus.length ? Math.max(...lus.map((p) => p.heure ?? 0)) : Math.min(...heures)) : null,
    etat: pire(parties.map((p) => p.etat)),
    valeur: parties.map((p) => p.valeur).join(' · '),
    lu: parties.every((p) => p.lu),
    quand: parties.map((p) => p.quand).join(' · '),
    stepId: parties[0].stepId,
    kind: parties.length > 1 ? 'paire' : parties[0].kind,
    parties,
    ...extra
  };
}

/**
 * Les 7 tuiles du bilan « vers p2c » (la huitième, « Rendement d'empâtage », vient de A2) : Eau d'empâtage, Empâtage (°C et pH), Avant
 * ébullition (L et densité), Densité à la coupure, OG, Au fermenteur, Ensemencement. Les tuiles doubles portent leurs `parties`.
 */
export function tuilesDuJour(releves: ReleveDuJour[], recipe?: RecipeSnapshot): ReleveDuJour[] {
  const par = (id: IdReleve) => releves.find((r) => r.id === id);
  const sortie: ReleveDuJour[] = [];
  const eau = par('eau-temp');
  if (eau) {
    const litres = recipe?.waterPlan?.mashWaterL;
    sortie.push(
      fusion('eau', 'Eau d’empâtage', [eau], {
        kind: 'temperature',
        complement: litres && litres > 0 ? `${nombreFr(litres, 1)} L` : undefined,
        cible: undefined
      })
    );
  }
  const m = par('maische');
  const ph = par('ph');
  if (m || ph) {
    const parties = [m, ph].filter((p): p is ReleveDuJour => !!p);
    const cible = [m?.cible ? `cible ${m.cible}` : null, ph?.cible ? `pH ${ph.cible}` : null].filter(Boolean).join(' · ');
    // p2c E1 : « maintenant · pH 13 h 15 » quand rien n'est encore lu.
    const quand = parties.every((p) => !p.lu) && m && ph?.heure != null ? `${m.quand} · pH ${heureFr(ph.heure)}` : parties.map((p) => p.quand).join(' · ');
    const lu = parties.filter((p) => p.lu);
    sortie.push(
      fusion('empatage', 'Empâtage', parties, {
        cible: cible || undefined,
        quand: lu.length === parties.length && parties.every((p) => p.etat === 'ok') ? '✓ dans la cible' : quand,
        valeur: parties.map((p) => (p.id === 'ph' ? `pH ${p.valeur}` : `${p.valeur} °C`)).join(' · ')
      })
    );
  }
  const av = [par('avant-volume'), par('avant-densite')].filter((p): p is ReleveDuJour => !!p);
  if (av.length) {
    const cible = av.map((p) => p.cible).filter(Boolean).join(' · ');
    const lus = av.filter((p) => p.lu);
    const quand = lus.length
      ? `relevé à ${heureFr(Math.max(...lus.map((p) => p.heure ?? 0)))}`
      : av.find((p) => p.heure != null)
        ? `vers ${heureFr(av.find((p) => p.heure != null)!.heure!)}`
        : av[0].quand;
    sortie.push(fusion('avant', 'Avant ébullition', av, { cible: cible ? `cible ${cible}` : undefined, quand }));
  }
  const c = par('coupure');
  if (c) sortie.push(fusion('coupure', 'Densité à la coupure', [c], { kind: 'densite', cible: c.cible }));
  const og = par('og');
  if (og) sortie.push(fusion('og', 'OG · densité initiale', [og], { kind: 'densite', cible: og.cible ? `cible ${og.cible}` : undefined, quand: og.lu ? og.quand : og.heure != null ? `au fermenteur ~${heureFr(og.heure)}` : og.quand }));
  const f = par('fermenteur');
  if (f) sortie.push(fusion('fermenteur', 'Au fermenteur', [f], { kind: 'volume', cible: f.cible ? `cible ${f.cible}` : undefined, quand: f.lu ? f.quand : f.heure != null ? `ensemencement ~${heureFr(f.heure)}` : f.quand }));
  const e = par('ensemencement-temp');
  if (e) sortie.push(fusion('ensemencement', 'Ensemencement', [e], { kind: 'temperature', cible: e.cible ? `cible ${e.cible}` : undefined }));
  return sortie;
}

/**
 * Les 6 losanges de la rangée « relevés » de la frise (F05) : eau, maische, pH, avant ébullition (volume et densité ensemble),
 * coupure, OG et fermenteur ensemble. L'ensemencement n'y est pas (p2c). Le nom se lit au toucher (« nom · heure »).
 */
export function losangesFrise(releves: ReleveDuJour[]): ReleveDuJour[] {
  const par = (id: IdReleve) => releves.find((r) => r.id === id);
  const sortie: ReleveDuJour[] = [];
  const eau = par('eau-temp');
  if (eau) sortie.push({ ...eau, nom: `Eau d’empâtage · ${eau.valeur} °C` });
  for (const id of ['maische', 'ph'] as const) {
    const r = par(id);
    if (r) sortie.push(r);
  }
  const av = [par('avant-volume'), par('avant-densite')].filter((p): p is ReleveDuJour => !!p);
  if (av.length) sortie.push(fusion('avant', 'Avant ébullition', av));
  const c = par('coupure');
  if (c) sortie.push(c);
  const fin = [par('og'), par('fermenteur')].filter((p): p is ReleveDuJour => !!p);
  if (fin.length) sortie.push(fusion('og-fermenteur', 'OG et fermenteur', fin));
  return sortie;
}

const NOM_PAS_RELEVE: Record<string, string> = {
  'eau-temp': 'eau d’empâtage °C',
  maische: 'maische °C',
  ph: 'pH d’empâtage',
  'avant-volume': 'volume avant ébullition',
  'avant-densite': 'densité avant ébullition',
  coupure: 'coupure',
  og: 'OG',
  fermenteur: 'volume au fermenteur',
  'ensemencement-temp': 'moût à l’ajout °C'
};

/** « Pas relevés · ? ? ? · eau d'empâtage °C · coupure · moût à l'ajout °C · restent « ? » au journal » (clôture) : tout relevé sans valeur. */
export function pasReleves(releves: ReleveDuJour[]): { ids: string[]; valeurs: string; noms: string[]; libelle: string } {
  const atomes = releves.flatMap((r) => r.parties ?? [r]).filter((r) => !r.lu);
  const noms = atomes.map((r) => NOM_PAS_RELEVE[r.id] ?? r.nom);
  return { ids: atomes.map((r) => r.id), valeurs: atomes.map(() => '?').join(' '), noms, libelle: 'restent « ? » au journal' };
}

/** Une ligne de « Heures tenues » (Z01). `ton` : `ocre` quand la durée ou l'ajout s'écarte du prévu. */
export interface HeureTenue {
  id: string;
  nom: string;
  debut: number | null;
  fin: number | null;
  /** « 13 h 05–14 h 05 », « 4 sur 4 », « 17 h 12 ». */
  plage: string;
  dureeMin: number | null;
  verdict: string;
  ton: 'ok' | 'ocre';
}

const toleranceMin = (prevu: number) => Math.max(2, Math.round(prevu * 0.05));
function verdictDuree(reel: number, prevu: number | undefined): { verdict: string; ton: 'ok' | 'ocre' } {
  if (prevu == null || prevu <= 0) return { verdict: `${reel} min`, ton: 'ok' };
  const ecart = reel - prevu;
  if (Math.abs(ecart) <= toleranceMin(prevu)) return { verdict: `${reel} min ✓`, ton: 'ok' };
  return { verdict: `${reel} min · ${signe(ecart)}${Math.abs(ecart)} min`, ton: 'ocre' };
}

/**
 * « Heures tenues » (Z01) : ce qui a été fait, à quelle heure et pendant combien de temps, contre le prévu. Seules les étapes terminées y
 * figurent (l'inconnu n'est pas une durée) : paliers d'empâtage, ébullition, ajouts d'ébullition, whirlpool, ensemencement. Les durées
 * sont à l'horloge murale, pauses comprises.
 */
export function heuresTenues(state: BrewDayState, recipe: RecipeSnapshot | undefined): HeureTenue[] {
  const sortie: HeureTenue[] = [];
  for (const s of state.steps.filter((x) => isMash(x.id))) {
    const debut = s.holdStartedAt ?? s.startedAt;
    if (debut == null || s.doneAt == null) continue;
    const reel = Math.round((s.doneAt - debut) / MIN);
    sortie.push({ id: s.id, nom: s.label, debut, fin: s.doneAt, plage: `${heureFr(debut)}–${heureFr(s.doneAt)}`, dureeMin: reel, ...verdictDuree(reel, s.durationMin) });
  }
  const boucle = state.steps.filter(isBoilStep);
  const debutEb = state.boilStartedAt;
  const finEb = state.boilFinishedAt ?? (boucle.length && boucle.every((s) => s.doneAt != null) ? Math.max(...boucle.map((s) => s.doneAt!)) : undefined);
  if (debutEb != null && finEb != null) {
    const reel = Math.round((finEb - debutEb) / MIN);
    const prevu = boilMinutes(state, recipe);
    sortie.push({ id: 'ebullition', nom: 'Ébullition', debut: debutEb, fin: finEb, plage: `${heureFr(debutEb)}–${heureFr(finEb)}`, dureeMin: reel, ...verdictDuree(reel, prevu) });
  }
  // Les ajouts d'ébullition : ce qui a un moment « à N min de la fin » et une dose ; un ajout sauté (dose 0) n'est pas attendu.
  const ajouts = recipe ? brewIngredients(recipe).filter((i) => i.beforeEndMin != null && (actualAmount(i, state) ?? i.planned) > 0) : [];
  if (ajouts.length && debutEb != null) {
    const fin = debutEb + boilMinutes(state, recipe) * MIN;
    const prevuA = (i: (typeof ajouts)[number]) =>
      state.hopElapsedMin?.[i.id] != null
        ? Math.min(fin, Math.max(debutEb, debutEb + state.hopElapsedMin[i.id] * MIN))
        : Math.max(debutEb, fin - (i.beforeEndMin ?? 0) * MIN);
    const faits = ajouts.filter((i) => state.additions?.[i.id]?.doneAt != null);
    const retards = faits
      .map((i) => ({ nom: i.name, min: Math.round((state.additions![i.id].doneAt! - prevuA(i)) / MIN) }))
      .filter((x) => x.min >= 1)
      .sort((a, b) => b.min - a.min);
    const manquent = state.boilFinishedAt != null ? ajouts.filter((i) => state.additions?.[i.id]?.doneAt == null) : [];
    if (faits.length || manquent.length) {
      const verdict = manquent.length
        ? `${manquent.map((i) => i.name).join(', ')} non versé${manquent.length > 1 ? 's' : ''}`
        : retards.length
          ? `${retards[0].nom} ${retards[0].min} min en retard`
          : '✓';
      sortie.push({ id: 'ajouts', nom: 'Ajouts', debut: null, fin: null, plage: `${faits.length} sur ${ajouts.length}`, dureeMin: null, verdict, ton: manquent.length || retards.length ? 'ocre' : 'ok' });
    }
  }
  const wp = state.steps.find((s) => s.id === 'whirlpool');
  if (wp?.startedAt != null && wp.doneAt != null) {
    const reel = Math.round((wp.doneAt - (wp.holdStartedAt ?? wp.startedAt)) / MIN);
    sortie.push({ id: 'whirlpool', nom: wp.tempC != null ? `Whirlpool ${nombreFr(wp.tempC, 0)} °C` : 'Whirlpool', debut: wp.startedAt, fin: wp.doneAt, plage: `${heureFr(wp.startedAt)}–${heureFr(wp.doneAt)}`, dureeMin: reel, ...verdictDuree(reel, wp.durationMin) });
  }
  if (state.pitchedAt != null) sortie.push({ id: 'ensemencement', nom: 'Ensemencement', debut: state.pitchedAt, fin: state.pitchedAt, plage: heureFr(state.pitchedAt), dureeMin: null, verdict: '✓', ton: 'ok' });
  return sortie;
}
