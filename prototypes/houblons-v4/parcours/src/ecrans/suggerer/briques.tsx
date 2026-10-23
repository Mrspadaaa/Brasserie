// Briques de Suggérer (q2b, base v4.10), propres à l'écran et préfixées pq-suggerer- (L26) :
// - la piste l5b (zone du style, repère de ma bière, barre, visée), sur une échelle commune à l'objectif et aux voies
//   pour que la ligne pointillée de la visée traverse toute la liste (q2b) ;
// - la jauge en traits d'une famille (un trait par cran du style, demi-trait sous le cran ; contour si elle baisse,
//   orangée si elle sort du style), avec data-famille et data-crans (D80) ;
// - l'usage en mot avec son mini picto (D80, D90), le stock en icône (D23 ter), l'α sourcé (D87).
import { useLayoutEffect, useRef } from 'react';
import { PackageCheck, PackageMinus, ShoppingCart } from 'lucide-react';
import { COULEURS, COURT, Picto, SegmentedControl, nombre, type Echelle } from '../../commun';
import type { HoublonLu } from '../../moteur';
import type { FamilyId, StyleScale } from '../../../../src/engine';

// ---------- Échelle d'une famille ----------
export interface Domaine { max: number; zone: [number, number] | null; cran: number; crans: number[] }
/** Au style : la piste va de 0 à deux fois le haut de la bande (zone du style sur la moitié gauche, crans marqués),
 * élargie si une valeur montrée la dépasse (le résineux de la stout est déjà à 83). Absolu : 0 → 110 (axes V5.5). */
export function domaine(f: FamilyId, sc: StyleScale, echelle: Echelle, valeurs: number[]): Domaine {
  const fs = sc.families[f];
  const haut = fs.band?.[1] ?? null;
  const plafond = Math.max(...valeurs.filter(Number.isFinite), 0) * 1.06;
  if (echelle === 'style' && haut) {
    const crans = [1, 2].map((i) => fs.band![0] + (i * (haut - fs.band![0])) / 3);
    return { max: Math.max(2 * haut, plafond), zone: fs.band, cran: fs.cran, crans };
  }
  return { max: Math.max(110, plafond), zone: fs.band, cran: fs.cran, crans: [] };
}
const pc = (x: number, d: Domaine) => `${Math.max(0, Math.min(100, (x / d.max) * 100)).toFixed(2)}%`;
export const position = pc;

/** La piste l5b. `barre` : la valeur montrée (aplat à la couleur de la famille) ; `avant` : ma bière (rond) ;
 * `visee` : trait pointillé ; `marques` : petites encoches (les houblons choisis, sur la piste de l'objectif). */
export function Piste({ f, d, barre, avant, visee, marques = [], inconnu = null, epaisse = false }: {
  f: FamilyId; d: Domaine; barre: number | null; avant: number | null; visee?: number | null;
  marques?: { cle: string; x: number }[]; inconnu?: string | null; epaisse?: boolean;
}) {
  return (
    <span data-role="piste" data-famille-piste={f}
      className={`pq-suggerer-piste relative block ${epaisse ? 'h-2.5' : 'h-2'} rounded-full bg-cave-800/50 ${inconnu ? 'pq-hachure' : ''}`}
      {...(inconnu ? { 'data-inconnu': '', 'aria-label': `inconnu : ${inconnu}` } : {})}>
      {d.zone && (
        <i data-role="zone" className="pq-suggerer-zone absolute inset-y-0 rounded-full"
          style={{ left: pc(d.zone[0], d), width: `calc(${pc(d.zone[1], d)} - ${pc(d.zone[0], d)})` }} />
      )}
      {barre != null && !inconnu && (
        <i data-role="barre" className="absolute inset-y-0 left-0 rounded-full" style={{ width: pc(barre, d), background: COULEURS[f].base }} />
      )}
      {/* Au-delà du style, la barre passe à l'orangé « hors style » (q2b) : la stout « trop résineuse » se voit. */}
      {barre != null && !inconnu && d.zone && barre > d.zone[1] && (
        <i data-role="hors-style" aria-hidden="true" className="pq-suggerer-barre-hors absolute inset-y-0 rounded-r-full"
          style={{ left: pc(d.zone[1], d), width: `calc(${pc(barre, d)} - ${pc(d.zone[1], d)})` }} />
      )}
      {/* Les crans du style par-dessus la barre : on les compte dans la barre (« +1 cran »). */}
      {d.crans.map((c) => <i key={c} aria-hidden="true" className="pq-suggerer-cran absolute inset-y-0 w-px" style={{ left: pc(c, d) }} />)}
      {marques.map((m) => (
        <i key={m.cle} data-role="marque" data-marque={m.cle} aria-hidden="true"
          className="pq-suggerer-marque absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded-sm" style={{ left: pc(m.x, d), background: COULEURS[f].texte }} />
      ))}
      {avant != null && (
        <i data-role="avant" aria-hidden="true"
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-cave-50 bg-cave-950" style={{ left: pc(avant, d) }} />
      )}
      {visee != null && <i data-role="visee" aria-hidden="true" className="pq-suggerer-visee absolute -top-1.5 -bottom-1.5 -translate-x-1/2" style={{ left: pc(visee, d) }} />}
    </span>
  );
}

// ---------- Intensité en traits (D80) ----------
/** Une famille qu'un houblon fait bouger : son picto, puis un trait par cran (demi-trait pour un reste ≥ ¼). */
export function Traits({ f, crans, hors, role = 'extra' }: { f: FamilyId; crans: number; hors: boolean; role?: 'extra' | 'cible' }) {
  const n = Math.min(4, Math.abs(crans));
  const pleins = Math.floor(n + 0.25);
  // Sous le cran (ou un reste d'au moins ¼), un demi-trait : jamais un trait plein pour un petit apport.
  const demi = pleins < 4 && (pleins === 0 || n - pleins >= 0.25);
  const baisse = crans < 0;
  const ton = hors ? 'pq-suggerer-trait-hors' : '';
  const traits = Array.from({ length: pleins }, (_, i) => i);
  return (
    <span data-role={role} data-famille={f} data-crans={crans.toFixed(2)} {...(hors ? { 'data-hors-style': '' } : {})}
      aria-label={`${COURT[f]} ${baisse ? '−' : '+'}${nombre(Math.abs(crans), 1)} cran${hors ? ', hors style' : ''}`} role="img"
      className="pq-suggerer-case flex flex-col items-center gap-0.5">
      <Picto famille={f} taille={15} nomme={false} />
      <span className="flex items-end gap-px h-1.5" aria-hidden="true">
        {traits.map((i) => <i key={i} className={`pq-suggerer-trait ${baisse ? 'pq-suggerer-trait-baisse' : ''} ${ton}`} />)}
        {demi && <i className={`pq-suggerer-trait pq-suggerer-trait-demi ${baisse ? 'pq-suggerer-trait-baisse' : ''} ${ton}`} />}
      </span>
    </span>
  );
}
/** Famille que le houblon ne fait pas bouger (moins de 0,5 point) : un point, à sa place dans l'alignement. */
export const Calme = () => <span aria-hidden="true" className="pq-suggerer-case flex items-center justify-center"><i className="pq-suggerer-calme" /></span>;
/** Famille dont l'écart est inconnu (rien de simulé) : hachuré, jamais 0. */
export const CaseInconnue = ({ f }: { f: FamilyId }) => (
  <span data-inconnu="" role="img" aria-label={`${COURT[f]} : effet non établi`} className="pq-suggerer-case flex flex-col items-center gap-0.5">
    <span className="pq-suggerer-inconnue inline-flex"><Picto famille={f} taille={15} nomme={false} /></span>
    <i className="pq-hachure block w-3.5 h-1.5 rounded-sm" />
  </span>
);

// ---------- Usage, α, stock ----------
/** L'usage du houblon en mot court du brasseur (amer, arôme, mixte) : la « mini info » de D80, en mot parce que les
 * pictos d'usage de l8e n'étaient « pas parlant du tout » (D90). data-usage comme hopRole (« double » pour mixte),
 * data-source « fournisseur » ou « règle » (déduit de l'α : souligné en pointillé). */
const COURT_USAGE = { amérisant: 'amer', aromatique: 'arôme', mixte: 'mixte' } as const;
export function Usage({ h }: { h: HoublonLu }) {
  const mot = h.role.mot;
  const regle = !/^fournisseur/.test(h.role.source);
  const brut = mot === 'mixte' ? 'double' : mot ?? 'inconnu';
  return (
    <span data-role="usage" data-usage={brut} data-source={regle ? 'règle' : 'fournisseur'} data-pour={h.cle}
      aria-label={`usage : ${mot ?? 'inconnu'}${regle ? ', déduit de l’α' : ''}`}
      className={`pq-suggerer-usage shrink-0 text-xs leading-none ${regle ? 'pq-suggerer-usage-regle' : ''}`}>
      {mot ? COURT_USAGE[mot] : 'usage ?'}
    </span>
  );
}

/** « lot » quand l'α vient du lot (stock, article), « fiches » quand c'est le milieu de la plage variétale. */
export const sourceAlpha = (h: HoublonLu): 'lot' | 'fiches' => (!h.alpha || /^plage/.test(h.alpha.source) ? 'fiches' : 'lot');
/** α du lot (« α » et « ≠ » posés par la feuille de style) ; « ≠ » : le lot sort de la plage des fiches. */
export function AlphaCourt({ h }: { h: HoublonLu }) {
  if (!h.alpha) return <span data-role="alpha" data-source="fiches" className="font-mono text-xs text-cave-400">α ?</span>;
  return (
    <span data-role="alpha" data-source={sourceAlpha(h)} {...(h.alpha.horsFiches ? { 'data-hors-fiches': '', 'aria-label': `α ${nombre(h.alpha.valeur, 1)} %, hors de la plage des fiches` } : {})}
      className={`pq-suggerer-alpha font-mono text-xs text-cave-200 whitespace-nowrap ${h.alpha.horsFiches ? 'pq-suggerer-alpha-hors' : ''}`}>
      {`${nombre(h.alpha.valeur, 1)}%`}
    </span>
  );
}

/** Le stock en icône seule (D23 ter, q2b) : assez pour la dose, en stock mais pas assez, ou à acheter. */
export function Stock({ etat }: { etat: 'suffisant' | 'manque' | 'à acheter' }) {
  const I = etat === 'suffisant' ? PackageCheck : etat === 'manque' ? PackageMinus : ShoppingCart;
  const mot = etat === 'suffisant' ? 'en stock' : etat === 'manque' ? 'en stock, pas assez' : 'à acheter';
  return <I data-role="stock" data-stock={etat} role="img" aria-label={mot} className={`w-3.5 h-3.5 shrink-0 ${etat === 'suffisant' ? 'text-cave-200' : 'text-cave-400'}`} />;
}

// ---------- Réglages de lecture (q2b) ----------
/** SegmentedControl de l'app, en lecture seule de l'affichage (data-lecture) ; data-e sur chaque option si donné. */
export function Lecture<T extends string>({ valeur, onChange, options, label, e }: {
  valeur: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string; e?: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!e) return;
    ref.current?.querySelectorAll<HTMLElement>('[role="radio"]').forEach((r, i) => { r.dataset.e = e[i]; });
  });
  return (
    <div ref={ref} data-lecture="" className="pq-suggerer-lentille shrink-0 [&_span]:whitespace-nowrap [&_button]:px-2.5">
      <SegmentedControl<T> label={label} value={valeur} onChange={onChange} options={options} />
    </div>
  );
}
