/**
 * Chercher : texte libre (index d'identité existant `yeastSearchIndex` / `yeastSearchScore`), puis 18 filtres à facettes
 * disjonctives (le compte d'une option exclut son propre filtre, standard des moteurs à facettes), les « non documentées »
 * comptées à part. Ordre c4 : une levure tapée (« 1056 ») est un REPÈRE, jamais un filtre ; la liste est rangée par
 * disponibilité (vendue CH · FR · DE, puis Europe, puis rare) puis par proximité de Gower.
 * Coût : O(n · 18) par appel sur des valeurs déjà lues (1 733 fiches).
 */
import { yeastSearchScore } from '../yeastCatalogue';
import type { YeastReference } from '../yeastReferences';
import type { ComptesFiltre, EtatFiltres, IdFiltre, ReperesRecette, ResultatRecherche } from './contrat';
import { FILTRES, axeParId } from './axes';
import type { Contexte } from './contexte';
import { RANG_ORDRE, enStockIci } from './disponibilite';
import type { Fiche } from './fiche';
import { DEFS, etatEffectif, facettesLevure } from './filtres';
import { facetter } from '../rechercheAvancee/facettes';
import { distance } from './proximite';
import { lire } from './valeurs';

export interface ContexteRecherche { stockIds?: readonly string[] }
export interface ResultatRechercheEtendu extends ResultatRecherche {
  /** La levure tapée quand le texte l'identifie sans ambiguïté : posée en repère, absente de `liste`, comptée dans `total`. */
  tapee?: YeastReference;
}

const milliers = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const IDS = FILTRES.map((f) => f.id);

function trouverTapee(ctx: Contexte, q: string, scores: Map<Fiche, number>): Fiche | undefined {
  let max = 0;
  for (const s of scores.values()) if (s > max) max = s;
  if (max < 1000) return undefined;
  const ex = [...scores].filter(([, s]) => s === max).map(([f]) => f);
  if (ex.length === 1) return ex[0];
  if (max < 10_000) return undefined;
  // Homonymes du même code : la fiche vendue la plus proche, puis la mieux documentée.
  return ex.sort((a, b) => RANG_ORDRE[ctx.dispo(a).rang] - RANG_ORDRE[ctx.dispo(b).rang] || b.faits.length - a.faits.length)[0];
}

function libelleEtat(id: IdFiltre, etat: string[] | { min: number; max: number } | true, ctx: Contexte): string {
  const def = DEFS[id];
  if (etat === true) return def.options(ctx)[0].libelle;
  if (Array.isArray(etat)) {
    const options = def.options(ctx);
    return etat.map((v) => options.find((o) => o.valeur === v)?.libelle ?? v).join(' ou ');
  }
  const u = id === 'temperature' ? ' °C' : id === 'attenuation' || id === 'tolerance' ? ' %' : '';
  return etat.min === etat.max ? `${etat.min}${u}` : id === 'tolerance' && etat.max >= 25 ? `≥ ${etat.min}${u}` : `${etat.min}–${etat.max}${u}`;
}

/**
 * La fiche porte-t-elle la donnée de ce filtre ? C'est la règle même des « non documentées » de `chercher` : `valeur` non nulle.
 * Le filtre « En stock chez moi » et « Disponibilité » se lisent toujours ; « Boisson » et « Famille » aussi (déduites de la fiche).
 */
export function documente(ctx: Contexte, ref: YeastReference, filtre: IdFiltre): boolean {
  return DEFS[filtre].valeur(ctx.fiche(ref), new Set(), ctx) != null;
}

export function chercher(
  ctx: Contexte, requete: string, filtres: EtatFiltres, reperes?: ReperesRecette, extra: ContexteRecherche = {}
): ResultatRechercheEtendu {
  const q = requete.trim();
  const stock = new Set(extra.stockIds ?? []);
  const tous = ctx.tous();

  // 1. Le texte : un repère s'il identifie une levure, sinon un filtre de texte.
  const scores = new Map<Fiche, number>();
  let tapee: Fiche | undefined;
  if (q) {
    for (const f of tous) { const s = yeastSearchScore(ctx.index(f), q); if (s > 0) scores.set(f, s); }
    tapee = trouverTapee(ctx, q, scores);
  }
  const texteOk = (f: Fiche) => !q || !!tapee || scores.has(f);

  // 2. Filtres posés
  const etats = IDS.map((id) => etatEffectif(filtres, id));
  const posés = IDS.filter((_, k) => etats[k] != null);

  // 3. et 4. Filtres et comptes disjonctifs : le moteur de facettes commun (src/domain/rechercheAvancee), sur les fiches du texte.
  const { retenues, comptes: tousComptes } = facetter(tous.filter(texteOk), facettesLevure(ctx, stock), etats);
  const comptes = tousComptes as Partial<Record<IdFiltre, ComptesFiltre>>;

  // 5. L'ordre c4
  let rangees = retenues.filter((f) => f !== tapee);
  // Vendues ici d'abord, celles qui ont du stock avant les épuisées ; puis Europe ; puis rares.
  const rang = (f: Fiche) => RANG_ORDRE[ctx.dispo(f).rang] * 2 + (ctx.dispo(f).rang === 'ici' && !enStockIci(f.id) ? 1 : 0);
  const nom = (a: Fiche, b: Fiche) => a.ref.name.localeCompare(b.ref.name, 'fr');
  if (tapee) {
    const d = new Map(rangees.map((f) => [f, distance(tapee!, f)] as const));
    rangees = rangees.sort((a, b) => rang(a) - rang(b) || d.get(a)! - d.get(b)! || nom(a, b));
  } else if (q) {
    rangees = rangees.sort((a, b) => scores.get(b)! - scores.get(a)! || rang(a) - rang(b) || nom(a, b));
  } else {
    const T = reperes?.temperatureC;
    const couvre = (f: Fiche) => { const p = lire(f, 'temperature')?.plage; return T != null && p != null && p.min <= T && T <= p.max ? 0 : 1; };
    rangees = rangees.sort((a, b) => rang(a) - rang(b) || couvre(a) - couvre(b) || nom(a, b));
  }

  // 6. La ligne de résumé de c6b
  const parts: string[] = [];
  const boisson = etatEffectif(filtres, 'boisson');
  parts.push(Array.isArray(boisson) ? libelleEtat('boisson', boisson, ctx) : 'toutes boissons');
  const autres = posés.filter((id) => id !== 'boisson');
  if (autres.length) {
    for (const id of autres) parts.push(libelleEtat(id, etats[IDS.indexOf(id)]!, ctx));
  } else if (reperes) {
    if (reperes.temperatureC != null) parts.push(`repères ${String(reperes.temperatureC).replace('.', ',')} °C`);
    if (reperes.abvVise != null) parts.push(`${String(Math.round(reperes.abvVise * 10) / 10).replace('.', ',')} %`);
  }
  if (tapee) parts.push(`proche de ${tapee.ref.catalogue?.productCode ?? tapee.ref.name}`);
  const total = retenues.length;
  parts.push(milliers(total));
  void axeParId;

  return { liste: rangees.map((f) => f.ref), total, comptes, resume: parts.join(' · '), ...(tapee ? { tapee: tapee.ref } : {}) };
}
