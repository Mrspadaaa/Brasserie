// Les voies de Suggérer (q2b, D105), lues du moteur en direct et rangées comme q2b : groupes « même effet sur tes
// objectifs », puis les gestes (Assembler 5 + 5 g, Remplacer Nugget, Dry hop). Pur : aucune vue ici.
// Sources :
// - `proposer(recette, direction)` (proposeVoies du moteur v4) : ajouter à 10′, assembler, remplacer à IBU égal ;
//   effets en points 0–100 (apports V5.5 des familles citées, `established`), débordements de style ;
// - `proposeVoies(…, { leviersLevure: true })` (même moteur) : le houblonnage à froid en fermentation active, le geste
//   « Dry hop · actif » de q2b (Motueka 20 g, avec ses signaux de biotransformation, yeastSignals), et les voies
//   « Changer de levure » de ce levier (levuresDe), son groupe de q2b : « Celle ci aussi est toujours meilleures » (24.10,
//   sur sa q2b) ; son choix l'emporte sur D35. Elles restent à part des voies houblon (verdicts, radar, comparaison).
// Inconnu ≠ 0 : un effet non établi ou non simulé est `null`.
import type { FamilyId, Voie, VoieResult } from '../../../domain/hopIndex/v4';
import { additionEffect, applyVoie, yeastSignals } from '../parcours/v4';
import { calcul } from '../parcours/calcul';
import type { BiereLue, Candidat, HoublonLu } from '../parcours/adaptateur';
import { houblon, leviersLevure, lireBiere, style, type LeviersLevure } from '../parcours/adaptateur';
import { placer } from '../parcours/operations';
import type { Quand, RecetteParcours } from '../parcours/types';
import { DEMANDE_DEGUSTEE, demandeCourante, enPoints, type Visee } from '../parcours/visee';

/** La demande de q2b, son choix (cas c1 du lot 15) : « Moins résineux · Plus floral · Plus agrumes ». La dégustation du
 * 18.10 (etat/visee.ts) ne porte que + floral et − résineux ; « Plus agrumes » est la troisième carte de sa maquette
 * (D124 : « certaines de mes choix ont été perdue »). Une visée posée dans Ma bière l'emporte, famille par famille. */
export const DEMANDE_Q2B: Partial<Record<FamilyId, 1 | -1>> = { floral: 1, citrus: 1, ...DEMANDE_DEGUSTEE };
/** La demande de Suggérer en vigueur : celle de q2b dans la maquette ; dans l'app, aucune sans visée posée (t12d). */
export const demandeQ2B = (): Partial<Record<FamilyId, 1 | -1>> => { const d = demandeCourante(); return d === DEMANDE_DEGUSTEE ? DEMANDE_Q2B : d; };

export type Geste = 'meme' | 'assembler' | 'remplacer' | 'dryhop' | 'levure';
export interface Ligne {
  /** Numéro de la voie à l'écran (data-voie), 1 pour la première. */
  n: number;
  id: string;
  geste: Geste;
  houblons: HoublonLu[];
  /** Dose écrite sur la ligne (« 5+5 g », « 74 g ») ; null quand l'en-tête du groupe la dit. */
  dose: string | null;
  /** Effet par famille, en points 0–100 ; null : non établi ou non simulé (inconnu). */
  effets: Record<FamilyId, number | null>;
  /** Familles hors du style après la voie. */
  hors: FamilyId[];
  stock: 'suffisant' | 'manque' | 'à acheter';
  estime: boolean;
  /** Le moteur rend 0 exact partout alors que les fiches citent des familles : inconnu (Citra cryo en dry hop). */
  muet: string | null;
  /** La voie du moteur (Appliquer à la recette, moment décalé en Radar). */
  voie: Voie;
  /** IBU de la recette après la voie (moteur) ; null si inconnu. */
  ibuApres: number | null;
  /** Signaux de biotransformation du dry hop actif (yeastSignals) : id, titre, statut, pourquoi. */
  bio: { id: string; titre: string; statut: string; pourquoi: string }[];
  /** Changer de levure (q2b) : la souche visée ; aucun houblon. */
  levure?: { id: string; nom: string };
}
export interface Groupe {
  id: string; geste: Geste; titre: string; dose: string | null; moment: string; estime: boolean; lignes: Ligne[];
  /** Voie ia3 : les rangées de ce groupe sont choisies et rangées par l'IA (un ordre appliqué) ; une phrase par houblon (clé du moteur). */
  ia?: { moment: string; phrases: Record<string, string> };
}
/** Voie ia3 : un ordre de l'IA appliqué à un moment : le pool du moteur (voies d'un houblon), l'ordre rendu (clés de houblon) et ses phrases. */
export interface OrdreIA { pool: Voie[]; ordre: readonly string[]; phrases: Readonly<Record<string, string>> }
/** Rangées montrées au moins par un groupe rangé par l'IA : autant que le moteur en montrait (de 3 à 14), pour que le groupe garde sa hauteur. */
export const RANGEES_IA = 3;
export interface Objectif {
  f: FamilyId; sens: 1 | -1; nom: string; cran: number;
  /** L'écart demandé, en points (crans entiers × cran). */
  requis: number;
  avant: number | null;
  /** La cible sur la piste, en points : le palier visé, ou ma bière ± un cran (demande dégustée). */
  visee: number | null;
  /** Le palier posé dans Ma bière (0 à 3), null pour la demande dégustée. */
  palier: number | null;
  /** Visée à 0 (« bannir ») : faire baisser la famille, sans exclure de houblon. */
  bannie: boolean;
}

const fam = <T>(fams: readonly FamilyId[], fn: (f: FamilyId) => T) => Object.fromEntries(fams.map((f) => [f, fn(f)])) as Record<FamilyId, T>;
// a4 (D125) : une famille que le style ne cite pas (neutre) n'est pas « hors du style » ; la carte et le rang lisent le même statut.
const horsDuStyle = (v: Voie): FamilyId[] => [...new Set(v.styleOverflow.filter((o) => o.status !== 'neutre').map((o) => o.family))];

export type { Visee } from '../parcours/visee';
/** Objectifs de la visée commune (onglet Ma bière, D108), en crans du style, visées « plus » d'abord. Comme la base, la
 * visée est un palier absolu (0 à 3) : Suggérer lit l'écart entre ma bière (lue, la dégustation prime) et ce palier, en
 * crans entiers du style (un au moins). Sans visée, la demande dégustée vaut (+1 floral, −1 résineux). Bannir est une
 * visée à 0 : un objectif « faire baisser » (`bannie`), et non l'exclusion V5.5 des houblons qui la citent. */
export function objectifsDe(recette: RecetteParcours, biere: BiereLue, visee: Visee): Objectif[] {
  const sc = style(recette.styleCode);
  const demande = demandeQ2B();
  const fams = [...new Set([...(Object.keys(demande) as FamilyId[]).filter((f) => visee[f] == null), ...(Object.keys(visee) as FamilyId[])])];
  return fams.flatMap((f): Objectif[] => {
    const cran = sc.families[f].cran, avant = biere.profil[f].valeur?.centre ?? null, v = visee[f];
    if (v == null) {
      const k = demande[f]!;
      return [{ f, sens: k, nom: biere.profil[f].nom, cran, requis: k * cran, avant, visee: avant == null ? null : Math.max(0, avant + k * cran), palier: null, bannie: false }];
    }
    const cible = enPoints(v), d = cible - (avant ?? 0);
    // Bannir (visée 0) reste un objectif « faire baisser » même quand ma bière est déjà à 0 : sinon l'écart est nul, l'objectif
    // disparaît et le bannissement ne change rien (27.10 : « SI je fais tropicale, puis ensuite je banis résine. Rien ne se passe »).
    // Un cran vers le bas : le moteur range alors derrière les voies qui la font monter.
    if (Math.abs(d) < 0.05 && v !== 0) return [];
    const sens = (v === 0 || d < 0 ? -1 : 1) as 1 | -1;
    const k = sens * Math.max(1, Math.round(Math.abs(d) / cran));
    return [{ f, sens, nom: biere.profil[f].nom, cran, requis: k * cran, avant, visee: cible, palier: v, bannie: v === 0 }];
  }).sort((a, b) => b.requis / b.cran - a.requis / a.cran);
}
/** Plus aucune exclusion depuis D108 : bannir suit la base (une visée à 0, lue comme objectif par objectifsDe). Gardé pour
 * ses appelants ; rend toujours une liste vide. */
export const bannisDe = (_visee: Visee): FamilyId[] => [];
/** Règle V5.5 des exclusions (« famille citée par le houblon ajouté ») : une voie dont un houblon cite une famille
 * exclue n'est pas proposée. Seulement sur une liste explicite (voiesDe, `bannis`) ; bannir dans Ma bière n'exclut plus. */
export const exclue = (houblons: HoublonLu[], bannis: FamilyId[]) => houblons.some((h) => bannis.some((f) => h.familles[f].niveau !== 'non décrit'));

/** La direction du moteur tirée des objectifs (crans signés : « + floral », « − résineux »). */
export const directionDe = (objectifs: Objectif[]): Record<string, number> => Object.fromEntries(objectifs.map((o) => [o.f, o.requis / o.cran]));

/** Les deux calculs lourds dont partent les voies (client asynchrone, moteur/client.ts) : proposer et les leviers levure. */
export interface CalculsVoies { proposes: VoieResult; leviers: LeviersLevure }
/** Les calculs lourds des voies, lus par le client : tout de suite sur le fil principal, ou déjà reçus (préchauffés).
 * Sinon (worker) : la requête part au préchauffage et la réponse est undefined. */
function lireCalculs(recette: RecetteParcours, direction: Record<string, number>): CalculsVoies | undefined {
  const c = calcul();
  const proposes = c.lire('proposer', recette, direction), leviers = c.lire('leviers', recette, direction);
  if (proposes && leviers) return { proposes, leviers };
  void c.prechauffer('proposer', recette, direction);
  void c.prechauffer('leviers', recette, direction);
  return undefined;
}

/** Les voies du moteur, rangées en groupes comme q2b. `familles` : l'ordre des familles du moteur. `lus` : les calculs
 * lourds déjà rendus par le client (écran : useCalcul) ; absents, ils sont lus par le client (préchauffage : la
 * Coquille), et sans réponse immédiate la liste est vide (rien d'inventé). */
export function voiesDe(recette: RecetteParcours, objectifs: Objectif[], familles: readonly FamilyId[], bannis: FamilyId[] = [], dryhopMax = 4, lus?: CalculsVoies, ia?: Readonly<Record<string, OrdreIA>>): Groupe[] {
  const direction = directionDe(objectifs);
  const calc = lus ?? lireCalculs(recette, direction);
  if (!calc) return [];
  const res = calc.proposes;
  const lignes = res.voies.filter((v) => v.type === 'ajouter' || v.type === 'assemblage' || v.type === 'remplacer à IBU égal')
    .filter((v) => !exclue([...new Set(v.actions.map((a) => a.hopKey))].map((c) => houblon(c)), bannis)).map((v) => {
    const cles = [...new Set(v.actions.filter((a) => a.op !== 'retirer').map((a) => a.hopKey))];
    const geste: Geste = v.type === 'assemblage' ? 'assembler' : v.type === 'ajouter' ? 'meme' : 'remplacer';
    return {
      v, cles,
      ligne: {
        n: 0, id: v.id, geste, houblons: cles.map((c) => houblon(c)),
        dose: v.type === 'assemblage' ? v.actions.map((a) => a.grams).join('+') + ' g' : geste === 'remplacer' ? `${v.actions[0].grams} g` : null,
        effets: fam(familles, (f) => (v.effect[f].established && v.effect[f].central != null ? v.effect[f].central : null)),
        hors: horsDuStyle(v),
        stock: v.stock.status, estime: v.estimated, muet: null,
        voie: v, ibuApres: v.ibu.unknown ? null : v.ibu.after, bio: [],
      } as Ligne,
      moment: v.actions[0].momentLabel, grams: v.actions[0].grams,
    };
  });
  // « Même effet sur tes objectifs » (q2b) : ajouts et assemblages au même moment, à la même dose totale, au même effet
  // sur les objectifs. Les autres assemblages vont au geste « Assembler 5 + 5 g ».
  const cle = (x: (typeof lignes)[number]) => JSON.stringify([x.moment, x.v.actions.reduce((s, a) => s + a.grams, 0), objectifs.map((o) => x.ligne.effets[o.f])]);
  const groupes: Groupe[] = [];
  const ajouts = lignes.filter((x) => x.ligne.geste !== 'remplacer');
  const parCle = new Map<string, typeof lignes>();
  for (const x of ajouts) parCle.set(cle(x), [...(parCle.get(cle(x)) ?? []), x]);
  const seuls: typeof lignes = [];
  let i = 0;
  for (const [, xs] of parCle) {
    if (xs.length < 2) { seuls.push(...xs); continue; }
    const tot = xs[0].v.actions.reduce((s, a) => s + a.grams, 0);
    groupes.push({ id: `meme-${i++}`, geste: 'meme', titre: i === 1 ? 'même effet sur tes objectifs' : 'même effet', dose: `${tot} g`, moment: xs[0].moment, estime: false,
      lignes: xs.map((x) => ({ ...x.ligne, geste: 'meme' as const, dose: x.ligne.geste === 'assembler' ? x.ligne.dose : null })) });
  }
  const assembler = seuls.filter((x) => x.ligne.geste === 'assembler');
  const ajoutSeul = seuls.filter((x) => x.ligne.geste !== 'assembler');
  if (ajoutSeul.length) groupes.push({ id: 'ajouter', geste: 'meme', titre: 'Ajouter', dose: null, moment: ajoutSeul[0].moment, estime: false, lignes: ajoutSeul.map((x) => ({ ...x.ligne, dose: `${x.grams} g` })) });
  // Voie ia3 : à un moment dont l'IA a rendu l'ordre (et que le brasseur lui laisse), le groupe de ce moment est choisi et rangé par l'IA.
  if (ia) for (const [mom, o] of Object.entries(ia)) appliquerOrdreIA(groupes, mom, o, objectifs, familles);
  if (assembler.length) groupes.push({ id: 'assembler', geste: 'assembler', titre: 'Assembler 5 + 5 g', dose: null, moment: assembler[0].moment, estime: true, lignes: assembler.map((x) => x.ligne) });
  const remp = lignes.filter((x) => x.ligne.geste === 'remplacer');
  if (remp.length) {
    const avant = remp[0].v.actions[0].previousHopKey;
    groupes.push({ id: 'remplacer', geste: 'remplacer', titre: `Remplacer ${avant ? houblon(avant).nom : ''}`.trim(), dose: null, moment: remp[0].moment, estime: false, lignes: remp.map((x) => x.ligne) });
  }
  // Dry hop · actif (q2b) : le levier « houblonner à froid en fermentation active » du moteur, avec ses signaux.
  const dh = calc.leviers.dry.filter((v) => !exclue(v.actions.map((x) => houblon(x.hopKey)), bannis)).slice(0, dryhopMax);
  if (dh.length) groupes.push({ id: 'dryhop', geste: 'dryhop', titre: 'Dry hop', dose: null, moment: 'actif', estime: true,
    lignes: dh.map((v): Ligne => {
      const x = v.actions[0];
      const sig = yeastSignals({ id: x.additionId, hopKey: x.hopKey, grams: x.grams, moment: x.moment }, recette)?.signaux ?? [];
      return {
        n: 0, id: v.id, geste: 'dryhop', houblons: [houblon(x.hopKey)], dose: `${x.grams} g`,
        effets: fam(familles, (f) => (v.effect[f].established && v.effect[f].central != null ? v.effect[f].central : null)),
        hors: horsDuStyle(v),
        stock: v.stock.status, estime: true, muet: null, voie: v, ibuApres: v.ibu.unknown ? null : v.ibu.after,
        bio: sig.map((g) => ({ id: g.id, titre: g.titre, statut: g.statut, pourquoi: g.pourquoi })),
      };
    }) });
  let n = 0;
  for (const g of groupes) for (const l of g.lignes) l.n = ++n;
  return groupes;
}

/** Le moment (MomentId du moteur) d'un groupe d'ajouts d'un houblon, null pour les autres gestes. */
export const momentDuGroupe = (g: Groupe): string | null => (g.geste === 'meme' ? g.lignes[0]?.voie.actions[0]?.moment ?? null : null);

/** Voie ia3 : remplace les groupes d'ajouts d'UN houblon d'un moment par celui de l'IA : les rangées sont les premières de l'ordre de l'IA
 * (autant que le moteur en montrait, de 4 à 14), avec leurs effets, leur dose et leur stock du moteur. Les rangées de même effet et de même dose
 * gardent le cadre du moteur (une barre, « même effet 40 g ») ; sinon « Ajouter » : une barre et une dose par rangée (le titre ne ment pas). */
function appliquerOrdreIA(groupes: Groupe[], mom: string, o: OrdreIA, objectifs: Objectif[], familles: readonly FamilyId[]): void {
  const ici = groupes.map((g, i) => ({ g, i })).filter(({ g }) => momentDuGroupe(g) === mom);
  if (!ici.length) return;
  const n = Math.min(14, Math.max(RANGEES_IA, ici.reduce((s, { g }) => s + g.lignes.length, 0)));
  const voies = o.ordre.flatMap((k) => { const v = o.pool.find((x) => x.actions[0].hopKey === k); return v ? [v] : []; }).slice(0, n);
  if (voies.length < Math.min(n, RANGEES_IA)) return;
  const ligne = (v: Voie, dose: string | null): Ligne => ({
    n: 0, id: v.id, geste: 'meme', houblons: [houblon(v.actions[0].hopKey)], dose,
    effets: fam(familles, (f) => (v.effect[f].established && v.effect[f].central != null ? v.effect[f].central : null)),
    hors: horsDuStyle(v), stock: v.stock.status, estime: v.estimated, muet: null, voie: v, ibuApres: v.ibu.unknown ? null : v.ibu.after, bio: [],
  });
  const cle = (l: Ligne) => JSON.stringify([l.voie.actions.reduce((s, a) => s + a.grams, 0), objectifs.map((x) => l.effets[x.f])]);
  const lignes = voies.map((v) => ligne(v, null));
  const egaux = lignes.every((l) => cle(l) === cle(lignes[0]));
  const premier = ici[0].g;
  const groupe: Groupe = {
    id: premier.id, geste: 'meme', moment: premier.moment, estime: false,
    titre: egaux ? (premier.titre !== 'Ajouter' ? premier.titre : 'même effet') : 'Ajouter',
    dose: egaux ? `${lignes[0].voie.actions[0].grams} g` : null,
    lignes: egaux ? lignes : lignes.map((l) => ({ ...l, dose: `${l.voie.actions[0].grams} g` })),
    ia: { moment: mom, phrases: { ...o.phrases } },
  };
  groupes[ici[0].i] = groupe;
  for (const { i } of ici.slice(1).reverse()) groupes.splice(i, 1);
}

/** Le simulateur rend 0 exact partout alors que les fiches citent des familles : un inconnu, pas un zéro. */
export function estMuet(c: Candidat): boolean {
  const connus = Object.values(c.lu.ecart).filter((e) => e != null);
  return connus.length > 0 && connus.every((e) => e!.bas === 0 && e!.haut === 0)
    && Object.values(c.houblon.familles).some((x) => x.niveau !== 'non décrit');
}

/** Verdict d'un objectif, en un mot (q2b) : l'effet de la meilleure voie face au cran voulu. Atteint : le cran entier ;
 * Approche : la moitié au moins ; Aucune : moins. */
export function verdict(o: Objectif, groupes: Groupe[]): { mot: 'Atteint' | 'Approche' | 'Aucune'; meilleure: Ligne | null; effet: number | null } {
  // Comme q2b (generateur-q2b.mjs, meilleure) : la meilleure voie établie qui ne sort pas du style.
  const ls = groupes.flatMap((g) => g.lignes).filter((l) => l.effets[o.f] != null && !l.hors.length);
  if (!ls.length) return { mot: 'Aucune', meilleure: null, effet: null };
  // Bannie et déjà à 0 : rien ne la fait baisser ; l'objectif est tenu si la meilleure voie ne la fait pas monter (un quart de cran au plus).
  if (o.bannie && (o.avant ?? 0) < 0.05) {
    const b = ls.reduce((x, l) => (l.effets[o.f]! < x.effets[o.f]! ? l : x)), eb = b.effets[o.f]!, tenu = eb <= 0.25 * o.cran;
    return { mot: tenu ? 'Atteint' : 'Aucune', meilleure: tenu ? b : null, effet: eb };
  }
  const m = ls.reduce((b, l) => (o.sens * l.effets[o.f]! > o.sens * b.effets[o.f]! ? l : b));
  const e = m.effets[o.f]!, k = (o.sens * e) / Math.abs(o.requis);
  return { mot: k >= 1 ? 'Atteint' : k >= 0.5 ? 'Approche' : 'Aucune', meilleure: k > 0 ? m : null, effet: e };
}

/** Les voies « houblonner à froid en fermentation active » du moteur (levier R44). */
// Calcul de l'adaptateur (leviersLevure), synchrone : pour les contrôles (window.__suggerer) ; l'écran passe par le client.
export const dryhopActif = (recette: RecetteParcours, direction: Record<string, number>): Voie[] => leviersLevure(recette, direction).dry;

/** « Changer de levure » de q2b (levier R43) : une voie par souche caractérisée autre que la levure de la recette, son
 * effet = la différence des arômes propres des deux souches (modèle V5.5, établi seulement là où une souche a un
 * paramètre ; ailleurs null, inconnu). Numérotées après les voies houblon (`depuis`). null : aucune souche. */
export function levuresDe(recette: RecetteParcours, objectifs: Objectif[], familles: readonly FamilyId[], depuis: number, lus?: CalculsVoies): Groupe | null {
  const calc = lus ?? lireCalculs(recette, directionDe(objectifs));
  if (!calc) return null;
  const vs = calc.leviers.souches;
  if (!vs.length) return null;
  return { id: 'levure', geste: 'levure', titre: 'Changer de levure', dose: null, moment: 'levure', estime: true,
    lignes: vs.map((v, i): Ligne => ({
      n: depuis + i + 1, id: v.id, geste: 'levure', houblons: [], dose: null,
      effets: fam(familles, (f) => (v.effect[f].established && v.effect[f].central != null ? v.effect[f].central : null)),
      hors: horsDuStyle(v),
      stock: 'suffisant', estime: true, muet: null, voie: v, ibuApres: v.ibu.unknown ? null : v.ibu.after, bio: [],
      levure: { id: v.yeastChange!.to, nom: v.yeastChange!.toName },
    })) };
}

// ---------- Radar : une voie à un autre moment (« ‹ 10′ › » de la base v4.10) ----------
/** Les moments du décalage, à chaud comme la base : premier moût, l'ébullition par 5′ (rien de figé), whirlpool. */
export function momentsChauds(recette: RecetteParcours): Quand[] {
  const eb: Quand[] = [];
  for (let m = recette.boilMin; m >= 0; m -= 5) eb.push({ type: 'ebullition', minutes: m });
  return [{ type: 'premierMout' }, ...eb, { type: 'whirlpool' }];
}
export const nomQuand = (q: Quand) => (q.type === 'premierMout' ? 'moût' : q.type === 'whirlpool' ? 'whirlpool' : q.type === 'ebullition' ? `${q.minutes}′` : q.phase === 'actif' ? 'actif' : `après ${q.jours} j`);
export const memeQuand = (a: Quand, b: Quand) => JSON.stringify(a) === JSON.stringify(b);
/** La recette après la voie, ses ajouts changés posés au moment q (null : le moment du moteur). */
export function recetteApres(recette: RecetteParcours, v: Voie, q: Quand | null): RecetteParcours {
  const r = applyVoie(recette, v) as RecetteParcours;
  if (!q) return r;
  const ids = new Set(v.actions.filter((x) => x.op !== 'retirer').map((x) => x.additionId));
  return { ...r, additions: r.additions.map((a) => (ids.has(a.id) ? placer(a, q, r) : a)) };
}
/** Ma bière après la voie (simulateur, dégustation comprise) : profil, écart et dérive d'IBU. Écart null : arôme non
 * simulé à ce moment (le simulateur ne couvre que 60′, 10′, whirlpool et le dry hop) ; jamais 0. */
export function lireVoie(recette: RecetteParcours, v: Voie, q: Quand | null) {
  const avant = lireBiere(recette), r = recetteApres(recette, v, q), apres = lireBiere(r);
  // L'effet sur les familles, du même moteur que les cartes et les barres (apports V5.5) : celui de la voie à son
  // moment ; décalée, la somme des apports de ses ajouts au nouveau moment (assemblage : dose totale × part, comme
  // effectOf ; remplacer : le nouveau moins l'ancien). null : aucun apport établi à ce moment (jamais 0).
  const effets = q ? effetsAuMoment(recette, r, v) : (Object.fromEntries(FAMILLES_V.map((f) => [f, v.effect[f].established ? v.effect[f].central : null])) as Record<FamilyId, number | null>);
  const connu = effets && Object.values(effets).some((e) => e != null);
  return { apres, effets: connu ? effets : null, derive: apres.ibu.valeur - avant.ibu.valeur, raison: connu ? null : 'aucun apport établi à ce moment', recette: r };
}
const FAMILLES_V: FamilyId[] = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
function effetsAuMoment(recette: RecetteParcours, apresR: RecetteParcours, v: Voie): Record<FamilyId, number | null> | null {
  const total = v.actions.filter((x) => x.op === 'ajouter').reduce((s, x) => s + x.grams, 0);
  const parts: { e: ReturnType<typeof additionEffect>; signe: 1 | -1; poids: number }[] = [];
  for (const x of v.actions) {
    const a = apresR.additions.find((y) => y.id === x.additionId);
    if (!a || x.op === 'retirer') continue;
    if (x.op === 'ajouter' && v.type === 'assemblage' && total > 0) parts.push({ e: additionEffect({ ...a, grams: total }, apresR), signe: 1, poids: x.grams / total });
    else parts.push({ e: additionEffect(a, apresR), signe: 1, poids: 1 });
    if (x.op === 'modifier') {
      const a0 = recette.additions.find((y) => y.id === x.additionId);
      if (a0) parts.push({ e: additionEffect(a0, recette), signe: -1, poids: 1 });
    }
  }
  if (!parts.length || parts.some((p) => !p.e)) return null;
  return Object.fromEntries(FAMILLES_V.map((f) => {
    const est = parts.filter((p) => p.e![f].established && p.e![f].central != null);
    return [f, est.length ? Math.round(est.reduce((s, p) => s + p.signe * p.poids * p.e![f].central!, 0) * 10) / 10 : null];
  })) as Record<FamilyId, number | null>;
}
