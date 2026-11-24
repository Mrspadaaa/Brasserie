/**
 * D437 (23.11, CARNET-FILTRES-DOMAINE, variante A « Puces de domaines ») : le domaine d'un carnet, ce qui filtre la liste.
 * Cinq domaines, ses mots (« brasserie, local, meuble, outils ») plus Papiers. Qui le pose, du plus fort au plus faible :
 *  1. lui, d'un toucher sur la pastille du carnet (`origine: 'vous'`) ; 2. l'IA au rangement (`origine: 'ia'`) ;
 *  3. un carnet du Planning : sa catégorie (« (Planning, Équipements) » dans sa note de dates), « Équipements » et les jalons départagés
 *     par le titre (table de filtres-domaine/page.html, rangements surlignés gardés tels quels) ;
 *  4. les mots de son titre et de sa phrase (`ParMots`, comme sa vignette : src/ui/carnets/domaineMots.ts). Aucun : `null`, et aucun
 *     filtre ne le cache.
 */
export type DomaineCarnet = 'local' | 'brasserie' | 'meuble' | 'outils' | 'papiers';
export const DOMAINES: readonly DomaineCarnet[] = ['local', 'brasserie', 'meuble', 'outils', 'papiers'];
export const DOMAINE_LIBELLE: Record<DomaineCarnet, string> = { local: 'Local', brasserie: 'Brasserie', meuble: 'Meuble', outils: 'Outils', papiers: 'Papiers' };

export interface DomainePose { valeur: DomaineCarnet; origine: 'vous' | 'ia' }

export const estDomaine = (v: unknown): v is DomaineCarnet => typeof v === 'string' && (DOMAINES as readonly string[]).includes(v);

/** Le domaine posé, lu d'un document ; `undefined` s'il est absent ou mal formé. */
export function lireDomainePose(v: unknown): DomainePose | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as { valeur?: unknown; origine?: unknown };
  return estDomaine(o.valeur) && (o.origine === 'vous' || o.origine === 'ia') ? { valeur: o.valeur, origine: o.origine } : undefined;
}

/** Une lettre pliée : sans accent, en minuscule ; une lettre en donne une (les positions restent celles du texte). */
export const plier = (t: string): string => t.split('').map(ch => ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().slice(0, 1) || ch).join('');

/** Une règle de mots (titre, phrase) → domaine ; celle de l'app vit dans src/ui/carnets/domaineMots.ts, comme les pictos des vignettes. */
export type ParMots = (texte: string) => DomaineCarnet | null;

/** La catégorie d'un carnet du Planning, lue dans la note de ses dates (« … (Planning, Équipements) ») ; « Jalon » pour un jalon. */
export function categoriePlanning(c: { id: string; title: string; carnet: { notes: readonly { texte: string }[] } }): string | null {
  for (const n of c.carnet.notes) {
    const m = /\(Planning, ([^)]+)\)\s*$/.exec(n.texte.trim());
    if (m) return m[1].trim();
    if (/^Jalon du Planning\b/.test(n.texte.trim())) return 'Jalon';
  }
  return c.id.startsWith('CARNET-PLANNING-') && /^\s*Jalon\b/i.test(c.title) ? 'Jalon' : null;
}

const CATEGORIES: Record<string, DomaineCarnet> = { structure: 'local', plomberie: 'local', electricite: 'local', securite: 'local', administratif: 'papiers' };

/** D437 : le domaine d'un carnet du Planning, d'après sa catégorie (table de filtres-domaine/page.html). */
export function domaineDuPlanning(categorie: string, titre: string, parMots: ParMots = () => null): DomaineCarnet | null {
  const cat = plier(categorie).trim();
  const t = plier(titre);
  /* les rangements de la page : armoire, étagère, rangement → Meuble ; la hotte est au bâtiment → Local */
  const parTitre = /\b(armoire|etagere|rangement)/.test(t) ? 'meuble' : /\bhotte/.test(t) ? 'local' : parMots(titre);
  /* « Conformité complète — Peut vendre officiellement » : Papiers ; « Peut brasser au local (sans autorisation vente) » : Local */
  if (cat === 'jalon') return /conformit/.test(plier(titre)) ? 'papiers' : 'local';
  /* « Rangement / étagères inox & déménagement » : Structure au Planning, un meuble (surligné, gardé) ; « Sol — … + outils » : le sol */
  if (cat === 'structure') return parTitre === 'meuble' ? 'meuble' : 'local';
  if (cat === 'equipements' || cat === 'equipement') return parTitre === 'meuble' || parTitre === 'local' || parTitre === 'outils' || parTitre === 'papiers' ? parTitre : 'brasserie';
  return CATEGORIES[cat] ?? parTitre;
}

export interface CarnetPourDomaine {
  id: string; title: string;
  carnet: { phrase?: string; notes: readonly { texte: string }[]; domaine?: DomainePose | unknown };
}

/** Le domaine d'un carnet : posé (par lui, puis par l'IA), sinon sa catégorie du Planning, sinon ses mots ; `null` si rien ne le dit. */
export function domaineDe(c: CarnetPourDomaine, parMots: ParMots = () => null): DomaineCarnet | null {
  const pose = lireDomainePose(c.carnet.domaine);
  if (pose) return pose.valeur;
  const cat = categoriePlanning(c);
  if (cat) return domaineDuPlanning(cat, c.title, parMots);
  return parMots(c.title) ?? (c.carnet.phrase ? parMots(c.carnet.phrase) : null);
}

/** Les puces de la liste : Tous, puis chaque domaine qui a au moins un carnet (Outils dès son premier), avec son nombre. */
export function puceDomaines(carnets: readonly CarnetPourDomaine[], parMots?: ParMots): { tous: number; domaines: { d: DomaineCarnet; n: number }[] } {
  const n = new Map<DomaineCarnet, number>();
  for (const c of carnets) { const d = domaineDe(c, parMots); if (d) n.set(d, (n.get(d) ?? 0) + 1); }
  return { tous: carnets.length, domaines: DOMAINES.filter(d => (n.get(d) ?? 0) > 0).map(d => ({ d, n: n.get(d)! })) };
}

/** Le filtre : un carnet du domaine, ou sans domaine (aucun filtre ne le cache) ; `null` = Tous. */
export const dansDomaine = (c: CarnetPourDomaine, filtre: DomaineCarnet | null, parMots?: ParMots): boolean => {
  if (!filtre) return true;
  const d = domaineDe(c, parMots);
  return d === null || d === filtre;
};
