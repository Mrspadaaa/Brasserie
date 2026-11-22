/**
 * La recherche avancée des houblons (09.11 : « Faire la même chose que levure pour la recherche pour les houblons ») : le
 * catalogue houblon de la vue commune (`src/ui/rechercheAvancee`, forme c6b), sur le moteur de facettes commun
 * (`src/domain/rechercheAvancee`). Les fiches sont celles que l'étape lit déjà (`parcours/adaptateur.ts`, `donnees()` : le
 * stock du brasseur, puis le catalogue du moteur) ; rien n'est inventé :
 *  - α : celui du lot (stock), sinon le milieu de la plage variétale (`houblon(cle).alpha`), la plage des fiches si elle existe ;
 *  - rôle : amérisant, aromatique, double (fournisseur, sinon règle rôle-α), le mot de l'étape Houblons (`Usage` de maBiere/briques : hopRole) ;
 *  - arômes : les 12 familles citées ou marquées par les fiches (`describeFamilies`), aux couleurs et pictos de l'app ;
 *  - origine : celle de la fiche ; huiles : l'huile totale (mL/100 g, Beer Maverick, sinon Hopsteiner) ;
 *  - stock : les grammes libres du brasseur ; disponibilité : chez moi, épuisé chez moi, à acheter.
 * Une donnée absente est « non documentée », comptée à part, jamais 0. Ordre d'une ligne (L04) : nom, α, rôle, arômes en couleur ;
 * le stock en icône seulement.
 */
import { Package, PackageX, ShoppingCart } from 'lucide-react';
import { facetter, tranches, trancheDe, type EtatFacette, type Facette } from '../../../domain/rechercheAvancee/facettes';
import type { CatalogueHop } from '../../../domain/hopIndex/v4/data';
import { FAMILIES, type FamilyId } from '../../../domain/hopIndex/v4/families';
import { donnees, houblon, type HoublonLu } from '../parcours/adaptateur';
import { moteur } from '../parcours/donnees';
import { COULEURS, COURT } from '../familyTokens';
import { Picto } from '../Pictos';
import { sourceAlpha } from '../maBiere/briques';
import { mil, nb } from '../../rechercheAvancee/RechercheAvancee';
import type { CatalogueRA, DefFiltreRA, EtatFiltresRA, RayonRA, ResultatRA } from '../../rechercheAvancee/types';
import './rechercheHoublons.css';

export type DispoHoublon = 'stock' | 'epuise' | 'catalogue';
export interface FicheHoublon {
  cle: string;
  h: HoublonLu;
  /** La fiche du catalogue (origine, huiles, alias) ; null : houblon hors des fiches du moteur. */
  cat: CatalogueHop | null;
  /** Grammes au stock ; null : pas au stock. */
  grams: number | null;
  dispo: DispoHoublon;
  /** Pour le texte : le nom et les alias, sans accents. */
  texte: string;
  /** L'huile totale, plage en mL/100 g ; null : non documentée. */
  huile: [number, number] | null;
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const milieu = (p: readonly [number, number]) => (p[0] + p[1]) / 2;
/** Le rôle dans le mot de l'étape Houblons (`Usage` de maBiere/briques lit hopRole : « double »), jamais « mixte » (voie r4, 09.11 : deux mots pour une même donnée). */
export const motDuRole = (f: FicheHoublon): 'amérisant' | 'aromatique' | 'double' | null => (f.h.role.mot === 'mixte' ? 'double' : f.h.role.mot);

/** Les fiches de la recherche : le stock du brasseur (même clé, cryo compris), puis le catalogue du moteur (même règle que les ajouts proposés). */
export function fichesHoublons(): FicheHoublon[] {
  const d = donnees();
  const enStock = new Map(d.stock.map((s) => [s.key, s.grams] as const));
  const cles = [...d.stock.map((s) => s.key), ...d.catalogue.map((c) => c.id).filter((id) => !enStock.has(id))];
  const vues = new Set<string>();
  const sortie: FicheHoublon[] = [];
  for (const cle of cles) {
    if (vues.has(cle)) continue;
    vues.add(cle);
    const ref = moteur().hopRef(cle);
    const cat = ref?.catalogue ?? null;
    const h = houblon(cle);
    if (!h.connu) continue;
    const grams = enStock.has(cle) ? enStock.get(cle)! : null;
    const huile = cat?.oil ?? cat?.hs?.totalOil ?? null;
    sortie.push({
      cle, h, cat, grams, huile,
      dispo: grams == null ? 'catalogue' : grams > 0 ? 'stock' : 'epuise',
      texte: norm([h.nom, ...(cat?.aliases ?? [])].join(' ')),
    });
  }
  return sortie;
}

/**
 * Les familles d'un houblon pour le filtre : celles que le dessin de l'app MARQUE (au moins deux fiches, ou la première citée). Une famille citée par
 * une seule fiche parmi d'autres n'est pas la sienne (D167 : Hersbrucker n'est pas tropical parce qu'une fiche écrit « tropical/fruit »). Une fiche qui n'en
 * marque aucune garde ses familles citées : elle est décrite, seulement moins nettement. Sans rien : non documentée, jamais 0.
 */
export const familles = (f: FicheHoublon): FamilyId[] => {
  const marquees = FAMILIES.filter((x) => f.h.familles[x].niveau === 'marqué');
  return marquees.length ? marquees : FAMILIES.filter((x) => f.h.familles[x].niveau === 'cité');
};
const ALPHA = [5, 8, 11, 14];
const HUILE = [1, 1.5, 2, 3];

/** Les facettes des houblons, sur le moteur commun. */
export function facettesHoublons(fiches: readonly FicheHoublon[]): Facette<FicheHoublon>[] {
  const origines = [...new Set(fiches.map((f) => f.cat?.origin).filter((o): o is string => !!o))].sort((a, b) => a.localeCompare(b, 'fr'));
  return [
    {
      id: 'alpha', options: tranches(ALPHA), valeur: (f) => f.h.alpha?.valeur ?? null, tranche: (v) => trancheDe(ALPHA, v),
      // α du lot : la valeur ; sinon la plage des fiches, gardée si elle recoupe la plage demandée (comme les plages de la levure).
      garde: (e, v, f) => { const p = sourceAlpha(f.h) === 'lot' ? null : f.h.alpha?.plage; return p ? p[1] >= e.min && p[0] <= e.max : v >= e.min && v <= e.max; },
    },
    { id: 'role', options: [{ valeur: 'amérisant', libelle: 'amérisant' }, { valeur: 'aromatique', libelle: 'aromatique' }, { valeur: 'double', libelle: 'double' }], valeur: (f) => { const m = motDuRole(f); return m ? [m] : null; } },
    { id: 'aromes', options: FAMILIES.map((x) => ({ valeur: x, libelle: COURT[x] })), valeur: (f) => { const l = familles(f); return l.length ? l : null; }, cumul: true },
    { id: 'origine', options: origines.map((o) => ({ valeur: o, libelle: o })), valeur: (f) => (f.cat?.origin ? [f.cat.origin] : null) },
    { id: 'huile', options: tranches(HUILE), valeur: (f) => (f.huile ? milieu(f.huile) : null), tranche: (v) => trancheDe(HUILE, v),
      garde: (e, _v, f) => !!f.huile && f.huile[1] >= e.min && f.huile[0] <= e.max },
    { id: 'stock', options: [{ valeur: 'oui', libelle: 'en stock' }], valeur: (f) => (f.grams ?? 0) > 0 },
    { id: 'disponibilite', options: [{ valeur: 'stock', libelle: 'chez moi' }, { valeur: 'epuise', libelle: 'épuisé chez moi' }, { valeur: 'catalogue', libelle: 'à acheter' }], valeur: (f) => [f.dispo] },
  ];
}

export const FILTRES_HOUBLON: DefFiltreRA[] = [
  { id: 'alpha', libelle: 'α (acides alpha)', court: 'α', nonDoc: 'non documenté', rang: 'premier', genre: 'plage', unite: '%', enPuce: true },
  { id: 'role', libelle: 'Rôle', nonDoc: 'non documenté', rang: 'premier', genre: 'choix', enPuce: true },
  { id: 'aromes', libelle: 'Arômes', nonDoc: 'non documentés', rang: 'premier', genre: 'choix', enPuce: true },
  { id: 'origine', libelle: 'Origine', rang: 'premier', genre: 'choix', enPuce: true },
  { id: 'huile', libelle: 'Huile totale', court: 'Huiles', nonDoc: 'non documentée', rang: 'premier', genre: 'plage', unite: 'mL/100 g', enPuce: true },
  { id: 'stock', libelle: 'En stock chez moi', court: 'En stock', rang: 'premier', genre: 'bascule', enPuce: true },
  { id: 'disponibilite', libelle: 'Disponibilité', rang: 'plus', genre: 'choix' },
];

const RAYONS: RayonRA[] = [
  { id: 'stock', titre: 'Chez moi', court: 'Chez moi', icone: Package, pas: 6, reste: 'chez moi', legende: 'chez moi', teinte: 'vert' },
  { id: 'epuise', titre: 'Épuisés chez moi', court: 'Épuisés', icone: PackageX, pas: 3, reste: 'épuisés', legende: 'épuisés', teinte: 'neutre' },
  { id: 'catalogue', titre: 'À acheter', court: 'À acheter', icone: ShoppingCart, pas: 8, reste: 'à acheter', legende: 'à acheter', teinte: 'violet' },
];
const RANG: Record<DispoHoublon, number> = { stock: 0, epuise: 1, catalogue: 2 };

function libelleEtat(def: DefFiltreRA, etat: EtatFacette, options: Facette<FicheHoublon>['options']): string {
  if (etat === true) return def.libelle.toLowerCase();
  if (Array.isArray(etat)) return etat.map((v) => options.find((o) => o.valeur === v)?.libelle ?? v).join(' ou ');
  const u = def.unite ? ` ${def.unite}` : '';
  return !Number.isFinite(etat.max) || etat.max >= 99 ? `≥ ${nb(etat.min)}${u}` : etat.min === etat.max ? `${nb(etat.min)}${u}` : `${nb(etat.min)}–${nb(etat.max)}${u}`;
}

/** L'ordre « au style » : le rang que le moteur donne à chaque houblon pour le style de la recette (QUICK_ADD_RULE, comme les ajouts proposés). */
export interface OrdreStyle { nom: string; rang(cle: string): number | undefined }

/**
 * La recherche des houblons : texte (nom et alias), facettes, ordre chez moi → épuisés → à acheter, puis le texte, puis le rang
 * au style de la recette quand il est connu, puis le nom.
 */
export function chercherHoublons(fiches: readonly FicheHoublon[], facettes: readonly Facette<FicheHoublon>[], requete: string, filtres: EtatFiltresRA, ordre?: OrdreStyle): ResultatRA<FicheHoublon> {
  const q = norm(requete);
  const score = (f: FicheHoublon) => (!q ? 0 : norm(f.h.nom).startsWith(q) ? 2 : f.texte.includes(q) ? 1 : 0);
  const texte = q ? fiches.filter((f) => score(f) > 0) : fiches;
  const etats = facettes.map((fac) => { const v = filtres[fac.id]; return v === undefined || v === false ? null : v === true ? true : Array.isArray(v) ? (v.length ? v : null) : v; });
  const { retenues, comptes } = facetter(texte, facettes, etats);
  // D175 : une variété « peu de données » ne passe jamais devant une variété documentée à égalité.
  const rang = (f: FicheHoublon) => ordre?.rang(f.cle) ?? Infinity;
  const liste = [...retenues].sort((a, b) => RANG[a.dispo] - RANG[b.dispo] || score(b) - score(a) || (rang(a) === rang(b) ? 0 : rang(a) < rang(b) ? -1 : 1)
    || Number(!!a.cat?.peuDeDonnees) - Number(!!b.cat?.peuDeDonnees) || a.h.nom.localeCompare(b.h.nom, 'fr'));
  const parts = ['houblons'];
  facettes.forEach((fac, k) => { const e = etats[k]; const def = FILTRES_HOUBLON.find((d) => d.id === fac.id); if (e != null && def) parts.push(libelleEtat(def, e, fac.options)); });
  if (ordre && parts.length === 1) parts.push(`au style ${ordre.nom}`);
  parts.push(mil(retenues.length));
  return { liste, total: retenues.length, comptes, resume: parts.join(' · ') };
}

/** Une famille d'arômes en pastille : picto et couleur de l'app, nom court ; « cité » plus pâle que « marqué ». */
function PastilleFamille({ f, niveau }: { f: FamilyId; niveau: 'cité' | 'marqué' }) {
  return (
    <span className={`hx-p${niveau === 'cité' ? ' hx-cite' : ''}`} style={{ ['--c' as string]: COULEURS[f].base }} title={`${COURT[f]} : ${niveau} par les fiches`}>
      <Picto famille={f} taille={12} nomme={false} />{COURT[f]}
    </span>
  );
}

export interface ActionsHoublon {
  /** « Ajouter à ma recette » : par la porte du champ d'ajout (`ajouter` de parcours/operations), au moment proposé. */
  ajouter(f: FicheHoublon): void;
  /** La dose et le moment proposés, dits sur le bouton (« 10 g à 10′ ») ; null : rien à proposer. */
  proposition(f: FicheHoublon): string | null;
  fiche(f: FicheHoublon): void;
}

/** Le catalogue houblon pour la vue commune. `actions()` rend les gestes du moment (la recette change sans refaire la recherche). */
export function catalogueHoublons(fiches: readonly FicheHoublon[], actions: () => ActionsHoublon, ordre?: OrdreStyle): CatalogueRA<FicheHoublon> {
  const facettes = facettesHoublons(fiches);
  return {
    vue: 'recherche-houblons', libelleChamp: 'Nom ou alias', aucun: 'Aucun houblon ne correspond.',
    filtres: FILTRES_HOUBLON,
    idDe: (f) => f.cle,
    nomLigne: (f) => f.h.nom,
    attrsLigne: (f) => ({ 'data-houblon': f.cle }),
    chercher: (requete, filtres) => chercherHoublons(fiches, facettes, requete, filtres, ordre),
    rayons: RAYONS,
    rayonDe: (f) => f.dispo,
    pistes: [
      { id: 'alpha', lo: 0, hi: 20, unite: 'α %', teinte: 'neutre', plage: (f) => (f.h.alpha?.plage ? { min: f.h.alpha.plage[0], max: f.h.alpha.plage[1] } : f.h.alpha ? { min: f.h.alpha.valeur, max: f.h.alpha.valeur } : undefined) },
      { id: 'huile', lo: 0, hi: 4, unite: 'huile', teinte: 'vert', plage: (f) => (f.huile ? { min: f.huile[0], max: f.huile[1] } : undefined) },
    ],
    tris: [['proche', ordre ? 'au style' : 'nom'], ['alpha', 'α'], ['huile', 'huile']],
    cleTri: (f, tri) => (tri === 'alpha' ? f.h.alpha?.valeur : tri === 'huile' && f.huile ? milieu(f.huile) : undefined),
    triDecroissant: ['alpha', 'huile'],
    documente: (f, id) => facettes.find((x) => x.id === id)?.valeur(f) != null,
    echelle: { rayon: 'stock', titre: <><Package size={12} aria-hidden="true" /> chez moi · fiche</>, plage: (f, id) => (id === 'alpha' && f.h.alpha?.plage ? { min: f.h.alpha.plage[0], max: f.h.alpha.plage[1] } : id === 'huile' && f.huile ? { min: f.huile[0], max: f.huile[1] } : undefined), nomCourt: (f) => f.h.nom },

    ApresNom: ({ item: f }) => (
      <>
        <b className="hx-alpha ra-m" title={f.h.alpha ? `α ${f.h.alpha.source}` : 'α inconnu'}>{f.h.alpha ? <>{nb(f.h.alpha.valeur)}<small> %</small></> : 'α ?'}</b>
        <small className="hx-role">{motDuRole(f) ?? 'usage ?'}</small>
        {(f.grams ?? 0) > 0 && <Package size={13} role="img" aria-label="en stock" className="hx-stock" />}
      </>
    ),
    Pastilles: ({ item: f, filtres }) => {
      const marques = FAMILIES.filter((x) => f.h.familles[x].niveau === 'marqué');
      const cites = FAMILIES.filter((x) => f.h.familles[x].niveau === 'cité');
      // Les familles filtrées d'abord, toujours : le brasseur voit pourquoi la ligne est là. Puis les marquées, puis les citées (4 au plus, hors filtrées).
      const posees = (Array.isArray(filtres?.aromes) ? filtres!.aromes : []).filter((x): x is FamilyId => (FAMILIES as readonly string[]).includes(x) && f.h.familles[x as FamilyId].niveau !== 'non décrit');
      const montre = [...new Set<FamilyId>([...posees, ...marques, ...cites])].slice(0, Math.max(4, posees.length));
      // L14 : les mots hors des 12 familles (« vin blanc », « groseille ») se disent aussi, sinon Nelson Sauvin paraît ordinaire.
      const hors = f.h.motsSansFamille;
      return (
        <span className="hx-pas">
          {montre.map((x) => <PastilleFamille key={x} f={x} niveau={marques.includes(x) ? 'marqué' : 'cité'} />)}
          {!montre.length && <span className="hx-nd" title="Aucune famille d'arôme citée par les fiches">arômes ?</span>}
          {hors.length > 0 && <span className="hx-hors" title={`hors des 12 familles : ${hors.join(', ')}`}>◇ {hors[0]}{hors.length > 1 ? ` +${hors.length - 1}` : ''}</span>}
        </span>
      );
    },
    Actions: ({ item: f }) => {
      const a = actions();
      const p = a.proposition(f);
      return (
        <>
          <button type="button" className="hx-btn hx-btn-prim" onClick={() => a.ajouter(f)}>Ajouter à ma recette{p && <small> · {p}</small>}</button>
          <button type="button" className="hx-btn" onClick={() => a.fiche(f)}>Fiche</button>
        </>
      );
    },
    NonDoc: ({ texte }) => <span className="hx-nd">{texte}</span>,
  };
}
