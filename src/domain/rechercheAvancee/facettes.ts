/**
 * Recherche avancée : le moteur de facettes commun (mission 2026-11-09-levure-retours, voie r2 ; MISSION.md, « État de l'art »).
 *
 * Problème d'école : recherche à facettes avec comptes DISJONCTIFS. Le compte d'une option se calcule en excluant son propre
 * filtre (standard des moteurs à facettes : on voit combien on obtiendrait en changeant ce seul choix), et les fiches qui ne
 * documentent pas la facette sont comptées à part (« non documentées ») : l'inconnu n'est jamais un accord ni un zéro.
 * Pas de bibliothèque : itemsjs (Apache-2.0) ne sait ni les plages ni les valeurs non documentées (décision de la mission).
 *
 * Un catalogue (levures, houblons…) fournit ses facettes : options, valeur d'une fiche, façon de la garder. Ce module ne connaît
 * aucun catalogue. Coût : une passe O(n · f) sur les fiches, puis O(n · f) pour les comptes.
 */

/** La valeur d'une fiche pour une facette : des valeurs (choix), un nombre (plage), un booléen (bascule) ; `null` : non documentée. */
export type ValeurFacette = string[] | number | boolean | null;
/** Ce que le brasseur a posé : des valeurs (OU, ou ET si la facette cumule), une plage, une bascule allumée. */
export type EtatFacette = string[] | { min: number; max: number } | true;
export interface OptionFacette { valeur: string; libelle: string }
/** Par facette : le compte de chaque option (disjonctif) et les fiches sans la donnée. */
export interface ComptesFacette { options: Array<{ valeur: string; libelle: string; n: number }>; nonDocumentees: number }

export interface Facette<F> {
  id: string;
  options: readonly OptionFacette[];
  valeur(fiche: F): ValeurFacette;
  /** Plusieurs choix se cumulent (ET) au lieu de s'additionner (OU) : « fruité ET sans phénols ». */
  cumul?: boolean;
  /** Une valeur numérique, rangée dans l'option qui la contient (« 10-12 »). Sans elle, une plage ne compte aucune option. */
  tranche?(v: number): string;
  /** Garder une fiche numérique pour une plage posée ; défaut : la valeur est dans la plage. La levure garde une plage qui recoupe. */
  garde?(etat: { min: number; max: number }, valeur: number, fiche: F): boolean;
}

/** Une valeur posée devient un état, ou rien : `false`, `undefined`, une liste vide ne filtrent pas. */
export function etatDe(v: unknown): EtatFacette | null {
  if (v === undefined || v === null || v === false) return null;
  if (v === true) return true;
  if (Array.isArray(v)) return v.length ? (v as string[]) : null;
  if (typeof v === 'object' && 'min' in (v as object) && 'max' in (v as object)) return v as { min: number; max: number };
  return null;
}

/** Une fiche passe-t-elle une facette posée ? Non documentée : non (l'inconnu n'est jamais un accord). */
export function garde<F>(facette: Facette<F>, etat: EtatFacette, valeur: ValeurFacette, fiche: F): boolean {
  if (valeur == null) return false;
  if (etat === true) return valeur === true;
  if (Array.isArray(etat)) {
    if (!Array.isArray(valeur)) return false;
    return facette.cumul ? etat.every((e) => valeur.includes(e)) : etat.some((e) => valeur.includes(e));
  }
  if (typeof valeur !== 'number') return false;
  return facette.garde ? facette.garde(etat, valeur, fiche) : valeur >= etat.min && valeur <= etat.max;
}

/** Des bornes [8, 10, 12] en tranches « < 8 », « 8–10 », « 10–12 », « ≥ 12 » (valeurs « <8 », « 8-10 », « >=12 »). */
export function tranches(bornes: readonly number[]): OptionFacette[] {
  const t = (x: number) => String(x).replace('.', ',');
  return [
    { valeur: `<${bornes[0]}`, libelle: `< ${t(bornes[0])}` },
    ...bornes.slice(1).map((b, i) => ({ valeur: `${bornes[i]}-${b}`, libelle: `${t(bornes[i])}–${t(b)}` })),
    { valeur: `>=${bornes[bornes.length - 1]}`, libelle: `≥ ${t(bornes[bornes.length - 1])}` },
  ];
}
/** La tranche (valeur d'option de `tranches`) qui contient v. */
export function trancheDe(bornes: readonly number[], v: number): string {
  if (v < bornes[0]) return `<${bornes[0]}`;
  for (let i = 1; i < bornes.length; i++) if (v < bornes[i]) return `${bornes[i - 1]}-${bornes[i]}`;
  return `>=${bornes[bornes.length - 1]}`;
}

export interface ResultatFacettes<F> {
  /** Les fiches qui passent toutes les facettes posées, dans l'ordre reçu. */
  retenues: F[];
  comptes: Record<string, ComptesFacette>;
}

/**
 * Filtre et compte en une passe. `etats[k]` est l'état de `facettes[k]` (null : pas posée). Une fiche qui échoue à UNE seule
 * facette compte encore dans les options de cette facette-là (comptes disjonctifs).
 */
export function facetter<F>(fiches: Iterable<F>, facettes: readonly Facette<F>[], etats: ReadonlyArray<EtatFacette | null>): ResultatFacettes<F> {
  const nf = facettes.length;
  const base: Array<{ f: F; valeurs: ValeurFacette[]; echecs: number; premier: number }> = [];
  for (const f of fiches) {
    const valeurs: ValeurFacette[] = new Array(nf);
    let echecs = 0, premier = -1;
    for (let k = 0; k < nf; k++) {
      const v = facettes[k].valeur(f);
      valeurs[k] = v;
      const e = etats[k];
      if (e != null && !garde(facettes[k], e, v, f)) { echecs++; if (premier < 0) premier = k; }
    }
    base.push({ f, valeurs, echecs, premier });
  }

  const comptes: Record<string, ComptesFacette> = {};
  facettes.forEach((fac, k) => {
    const n = new Map<string, number>(fac.options.map((o) => [o.valeur, 0]));
    let nonDocumentees = 0;
    for (const b of base) {
      if (!(b.echecs === 0 || (b.echecs === 1 && b.premier === k))) continue;
      const v = b.valeurs[k];
      if (v == null) { nonDocumentees++; continue; }
      if (typeof v === 'boolean') { if (v) n.set('oui', (n.get('oui') ?? 0) + 1); continue; }
      const cles = typeof v === 'number' ? (fac.tranche ? [fac.tranche(v)] : []) : v;
      for (const c of cles) if (n.has(c)) n.set(c, n.get(c)! + 1);
    }
    comptes[fac.id] = { options: fac.options.map((o) => ({ valeur: o.valeur, libelle: o.libelle, n: n.get(o.valeur) ?? 0 })), nonDocumentees };
  });

  return { retenues: base.filter((b) => b.echecs === 0).map((b) => b.f), comptes };
}
