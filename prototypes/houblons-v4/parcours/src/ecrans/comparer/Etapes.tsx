// Les étapes (D107, D128) : chaque houblon comparé posé à 60′, à 10′ et au dry hop, à la même dose, avec une référence
// aux mêmes étapes, à la manière de x3b (lot 21). Ses mots : « je voulais comparé au moins : les étapes 60' 10'
// dryhopping ect comme la maquette de base. Et aussi le houblon de base ou bière de base » ; sur x3b : « Montrait
// vraiment l'état du moment de l'ajout facile » ; sa réserve : « dur à lire » (on prend l'idée, pas sa densité).
// D128 (« C'est pas du tout cette vue là réf ??? ») : le premier écran redevient celui de r6a, radar, colonnes et ses
// rangées de familles ; les étapes deviennent une bande compacte posée sur ces rangées, qui est aussi leur sélecteur :
// une ligne par étape (le nombre : crans gagnés de la famille du critère, ★ au meilleur ; le Nugget de ta recette en
// gris, à gauche et en trait pointillé sur chaque barre) ; toucher une ligne pose ce moment sur les rangées et le radar.
// Les trois étapes restent lisibles ensemble, au repos (« visibles ensemble, pour chaque houblon comparé »).
// L'IBU de chaque étape est dans le title de la case et dans « Valeurs » (80 mots au premier écran).
import { useState, type ReactNode } from 'react';
import { COULEURS, COURT, nombre, Picto } from '../../commun';
import { CONDITIONS } from '../../donnees/cas';
import { VoletBio, VoletPlans } from './Feuilles';
import { Chevron } from './icones';
import { houblon } from '../../moteur';
import { hopRef } from '../../../../src/engine';
import { ETAPES, type CodeEtape, type ColonneLue, type Critere, type Etapes, type ValeurEtape } from './calcul';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const pc = (x: number) => `${(Math.max(0, Math.min(1, x)) * 100).toFixed(1)}%`;
/** Le nombre d'une étape : crans gagnés sur ta stout, « ~ » devant (simulé) ; « ? » pour l'inconnu, jamais 0. */
const txt = (x: number) => `~${x < 0 ? '-' : ''}${nombre(Math.abs(x), 1)}`;
const nomEtape = (code: CodeEtape) => ETAPES.find((e) => e.code === code)!.nom;

export function BandeEtapes({ cols, etapes, reference, nomReference, retenu, moment, onMoment, critere, pastille }: {
  cols: ColonneLue[]; etapes: Etapes; reference: string | null; nomReference: string | null; retenu: string;
  moment: CodeEtape; onMoment: (m: CodeEtape) => void; critere: Critere; pastille: ReactNode;
}) {
  const [alphaVu, setAlphaVu] = useState(false);
  const f = critere.famille;
  const val = (v: ValeurEtape | null | undefined) => (v ? v.crans[f] ?? null : null);
  const aRef = reference ? houblon(reference).alpha : null;
  // Une échelle pour toute la bande : le même cran a la même longueur partout (référence comprise).
  const toutes = [...cols.map((c) => c.cle), ...(reference ? [reference] : [])].flatMap((k) => ETAPES.map((e) => val(etapes[k]?.[e.code]))).filter((x): x is number => x != null);
  const k = Math.max(1.5, ...toutes.map((x) => Math.abs(x)));
  const meilleur = (code: CodeEtape) => {
    const vals = cols.map((c) => { const x = val(etapes[c.cle]?.[code]); return x == null ? -Infinity : x * critere.sens; });
    const tri = [...vals].sort((a, b) => b - a);
    // ★ au meilleur seulement s'il passe le second d'au moins 0,05 cran (sinon égalité : pas d'étoile).
    return tri[0] > -Infinity && (cols.length < 2 || tri[0] - tri[1] >= 0.05) ? cols[vals.indexOf(tri[0])].cle : null;
  };
  const nomRef = nomReference ?? 'ta stout';
  return (
    <section className="pq-comparer-et" aria-label={`Aux étapes : ${COURT[f].toLowerCase()} gagné par chaque houblon posé à 60′, à 10′ et au dry hop, à ${nombre(CONDITIONS.doseGL)} g/L ; toucher une étape la pose sur les rangées et le radar`}
      data-element="d107-etapes d107-etat-au-moment x3b-cuve-jour-apres-jour d128-selecteur-etapes y1b-face-a-ta-stout">
      {/* En tête, au-dessus de sa colonne : la référence (ses valeurs sont dans la colonne de gauche) ; au-dessus des
          houblons : la pastille du critère, qui choisit la famille chiffrée. */}
      <div className="pq-comparer-grille-tab pq-comparer-et-h">
        {reference
          ? <span className="pq-comparer-et-ref" data-reference="houblon" data-houblon={reference} data-element="d107-reference"
              aria-label={`Référence : ${nomRef}${aRef ? `, α ${nombre(aRef.valeur, 1)} %` : ''}, le houblon de base de ta recette, aux mêmes étapes, à la même dose`}>
              {/* D40 bis (80 mots) : l'α de la référence passe à un toucher sur son nom (il reste dans le libellé). */}
              <button type="button" className="pq-comparer-et-ref-n" aria-expanded={alphaVu} onClick={() => setAlphaVu((x) => !x)}><i className="pq-comparer-et-tiret" aria-hidden="true" /><span>{nomRef}</span></button>
              {alphaVu && <AlphaRef cle={reference} />}
            </span>
          : <span className="pq-comparer-et-ref" data-reference="biere" data-element="d107-reference" aria-label="Référence : ta stout seule, sans ajout">
              <i className="pq-comparer-et-tiret" aria-hidden="true" /><span>ta stout</span>
            </span>}
        <span className="pq-comparer-et-crit">{pastille}</span>
      </div>
      <div role="radiogroup" aria-label="Moment de l’ajout, pour les rangées et le radar" className="pq-comparer-et-g">
        {ETAPES.map((e, i) => {
          const top = meilleur(e.code);
          const ref = reference ? etapes[reference]?.[e.code] ?? null : null;
          const vr = reference ? val(ref) : 0;
          const on = moment === e.code;
          return (
            <button key={e.code} type="button" role="radio" aria-checked={on} onClick={() => onMoment(e.code)} data-moment={e.code}
              className={cx('pq-comparer-grille-tab pq-comparer-et-r', on && 'pq-comparer-et-on', i === 0 && 'pq-comparer-et-premiere')} data-etape-ligne={e.code}>
              <span className="pq-comparer-et-l">
                <b className="pq-comparer-et-nom" data-court={e.code === 'dryPost' ? 'DH' : e.nom}><span>{e.nom}</span></b>
                <Valeur v={vr} code={e.code} cle={reference ?? undefined} nom={nomRef} etape={ref} famille={f} gris />
              </span>
              {cols.map((c) => {
                const v = etapes[c.cle]?.[e.code] ?? null, x = val(v);
                return (
                  <span key={c.cle} className={cx('pq-comparer-et-c', c.cle === retenu && 'pq-comparer-sel', top === c.cle && 'pq-comparer-et-top')}
                    style={{ ['--pq-h' as string]: c.couleur }} data-col={c.cle}>
                    <Valeur v={x} code={e.code} cle={c.cle} nom={c.houblon.nom} etape={v} famille={f} etoile={top === c.cle} />
                    <span className="pq-comparer-et-pis" aria-hidden="true">
                      {x != null && <i className="pq-comparer-et-fl" style={{ width: pc(Math.max(0, x) / k), background: COULEURS[f].base }} />}
                      {vr != null && reference && <i className="pq-comparer-et-rt" style={{ left: pc(Math.max(0, vr) / k) }} />}
                    </span>
                  </span>
                );
              })}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Le nombre d'une case : crans de la famille du critère gagnés sur ta stout ; « ? » pour l'inconnu (jamais 0). */
function Valeur({ v, code, cle, nom, etape, famille, gris, etoile }: {
  v: number | null; code: CodeEtape; cle?: string; nom: string; etape: ValeurEtape | null; famille: Critere['famille']; gris?: boolean; etoile?: boolean;
}) {
  const ibu = etape?.ibu ? `, ~${nombre(etape.ibu.valeur, 0)} IBU (${nombre(etape.ibu.min, 0)}–${nombre(etape.ibu.max, 0)})` : etape?.raisonIbu ? `, IBU : ${etape.raisonIbu}` : '';
  const lab = `${nom}, posé à ${nomEtape(code)}, ${nombre(CONDITIONS.doseGL)} g/L : ${COURT[famille].toLowerCase()} ${v == null ? 'inconnu' : `~${nombre(v, 2)} cran`}${etoile ? ', le meilleur de l’étape' : ''}${ibu}`;
  const attrs = { 'data-etape': code, ...(cle ? { 'data-houblon': cle } : {}), 'data-nature': 'simule', title: lab };
  return (
    <span className={cx('pq-comparer-et-v', gris && 'pq-comparer-et-gris')}>
      {v == null
        ? <span {...attrs} data-inconnu="" aria-label={lab}>?</span>
        : <span {...attrs} aria-label={lab}>{txt(v)}</span>}
      {etoile && <span className="pq-comparer-et-etoile" aria-hidden="true">★</span>}
    </span>
  );
}

/** L'α de la référence (L04 : l'α avant le reste), du lot en stock ou des fiches, comme dans les têtes de colonne. */
function AlphaRef({ cle }: { cle: string }) {
  const a = houblon(cle).alpha;
  if (!a) return <span data-role="alpha" data-inconnu="" className="pq-comparer-et-al">α ?</span>;
  const lot = hopRef(cle)?.stock?.alphaFrom === 'fiche de stock';
  return (
    <span data-role="alpha" data-source={lot ? 'lot' : 'fiches'} data-nature="mesure" className="pq-comparer-et-al"
      aria-label={`α ${lot ? 'du lot en stock' : 'des fiches'} : ${nombre(a.valeur, 1)} %`}>α {nombre(a.valeur, 1)}%</span>
  );
}

/** Sous les rangées au dry hop : l'état dans la cuve et la bière de base (x3b), puis deux touchers de x3b, la
 * biotransformation de ce plan et les plans enchaînés. Hors du premier écran (80 mots). */
export function PiedEtapes({ cols, retenu, onDryhopper }: { cols: ColonneLue[]; retenu: string; onDryhopper: () => void }) {
  const [volet, setVolet] = useState<null | 'bio' | 'plans'>(null);
  const basculer = (v: 'bio' | 'plans') => setVolet((x) => (x === v ? null : v));
  return (
    <div className="pq-comparer-et-pieds">
      {/* x3b : « l'état du moment de l'ajout », la cuve, et la bière de base (ta dégustation) au départ de chaque bande. */}
      <p className="pq-comparer-et-pied" data-etat="etat-comp-etat-moment" data-element="d107-etat-au-moment">
        <span data-nature="simule">~ dans la cuve</span>, au moment de chaque ajout ; dry hop : {CONDITIONS.jours} j de contact.
      </p>
      <p className="pq-comparer-et-pied" data-etat="etat-comp-reference">
        <Picto famille="resin" taille={12} />Résineux déjà au-delà, ta dégustation : chaque gain s’y ajoute.
      </p>
      <div className="pq-comparer-et-tch">
        <button type="button" className="pq-comparer-tch" data-role="biotransformation" data-etat="etat-comp-biotransfo" aria-expanded={volet === 'bio'} onClick={() => basculer('bio')}>
          <Picto famille="citrus" taille={14} /><span>Biotransformation</span><Chevron ouvert={volet === 'bio'} />
        </button>
        <button type="button" className="pq-comparer-tch" data-etat="etat-comp-etapes" aria-expanded={volet === 'plans'} onClick={() => basculer('plans')}>
          <span aria-hidden="true">⇢</span><span>Enchaîner</span><Chevron ouvert={volet === 'plans'} />
        </button>
      </div>
      {volet === 'bio' && <VoletBio cols={cols} />}
      {volet === 'plans' && <VoletPlans cols={cols} retenu={retenu} onDryhopper={onDryhopper} />}
    </div>
  );
}
