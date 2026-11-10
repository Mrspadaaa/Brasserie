/**
 * Le contexte d'un jeu de levures : les 1 733 fiches du catalogue (+ les références de l'app), leurs fiches de travail,
 * leur index de recherche et leur disponibilité, construits à la demande puis gardés.
 * `faitsSources: false` lit le catalogue seul (utile pour comparer aux comptes des maquettes).
 */
import { yeastReferences, type YeastReference } from '../yeastReferences';
import { yeastSearchIndex, type YeastSearchIndex } from '../yeastCatalogue';
import { disponibilite } from './disponibilite';
import type { Disponibilite } from './contrat';
import { construireFiche, type Fiche } from './fiche';

export interface OptionsLevure {
  /** Verse les faits sourcés de src/data/levure/faitsSources.json (défaut : oui). */
  faitsSources?: boolean;
  /** Lit le catalogue comme les comptes de la passe 4 des maquettes : catalogue brut (sans les remplacements revus), sans faits versés, sans boisson par catégories, fiches du catalogue seulement. */
  maquette?: boolean;
}

export interface Contexte {
  readonly options: Required<OptionsLevure>;
  /** Toutes les fiches (toutes boissons). */
  tous(): readonly Fiche[];
  /** Les fiches de bière : le défaut de tout compte. */
  biere(): readonly Fiche[];
  fiche(ref: YeastReference): Fiche;
  ficheParId(id: string): Fiche | undefined;
  index(f: Fiche): YeastSearchIndex;
  dispo(f: Fiche): Disponibilite;
}

export function creerContexte(options: OptionsLevure = {}): Contexte {
  const maquette = options.maquette ?? false;
  const opts = { faitsSources: maquette ? false : options.faitsSources ?? true, maquette };
  const fiches = new Map<string, Fiche>();
  const index = new WeakMap<Fiche, YeastSearchIndex>();
  const dispo = new WeakMap<Fiche, Disponibilite>();
  let tous: Fiche[] | undefined;
  let biere: Fiche[] | undefined;
  let parId: Map<string, Fiche> | undefined;
  const fiche = (ref: YeastReference): Fiche => {
    let f = fiches.get(ref.id);
    if (!f || f.ref !== ref) { f = construireFiche(ref, opts.faitsSources, { categories: !opts.maquette, brut: opts.maquette }); fiches.set(ref.id, f); }
    return f;
  };
  return {
    options: opts,
    tous() { return tous ??= yeastReferences([], { includeCatalogue: true }).filter((r) => !opts.maquette || !!r.catalogue).map(fiche); },
    biere() { return biere ??= this.tous().filter((f) => f.boisson === 'biere'); },
    fiche,
    ficheParId(id) { return (parId ??= new Map(this.tous().map((f) => [f.id, f] as const))).get(id); },
    index(f) { let i = index.get(f); if (!i) { i = yeastSearchIndex(f.ref); index.set(f, i); } return i; },
    dispo(f) { let d = dispo.get(f); if (!d) { d = disponibilite(f.ref); dispo.set(f, d); } return d; }
  };
}
