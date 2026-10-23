// Aux étapes (D107) : chaque houblon comparé posé à 60′, à 10′ et au dry hop, à la même dose, avec une référence aux
// mêmes étapes, à la manière de x3b (lot 21) : la bière de base en pointillé, la bande qui monte à l'étape où le
// houblon entre. Ses mots : « je voulais comparé au moins : les étapes 60' 10' dryhopping ect comme la maquette de
// base. Et aussi le houblon de base ou bière de base » ; sur x3b : « Montrait vraiment l'état du moment de l'ajout
// facile » ; sa réserve : « dur à lire » (on prend l'idée, pas sa densité).
// Les étapes se lisent ensemble, au repos : ce n'est ni un curseur ni un sélecteur. Le houblon reste le seul facteur
// libre (L10). Disposition : les colonnes du tableau de r6a (une par houblon), une rangée par étape ; la colonne de
// gauche porte l'étape et la référence (le houblon de base de ta recette, ton Nugget, en gris pointillé).
// L'IBU de chaque étape est dans l'aria-label de la case et dans « Chimie et vraies valeurs » (80 mots au premier écran).
import { COULEURS, nombre, Picto } from '../../commun';
import { houblon } from '../../moteur';
import { hopRef } from '../../../../src/engine';
import { ETAPES, ORANGE, type CodeEtape, type ColonneLue, type Etapes, type ValeurEtape } from './calcul';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const pc = (x: number) => `${(Math.max(0, Math.min(1, x)) * 100).toFixed(1)}%`;
/** Le nombre d'une étape : crans gagnés sur ta stout, « ~ » devant (simulé) ; « ? » pour l'inconnu, jamais 0. */
const txt = (x: number) => `~${x < 0 ? '-' : ''}${nombre(Math.abs(x), 1)}`;
const nomEtape = (code: CodeEtape) => ETAPES.find((e) => e.code === code)!.nom;

export function AuxEtapes({ cols, etapes, reference, nomReference, retenu }: {
  cols: ColonneLue[]; etapes: Etapes; reference: string | null; nomReference: string | null; retenu: string;
}) {
  // Échelles communes à toute la grille : le même cran a la même longueur partout (référence comprise).
  const toutes = [...cols.map((c) => c.cle), ...(reference ? [reference] : [])].flatMap((k) => ETAPES.map((e) => etapes[k]?.[e.code])).filter(Boolean) as ValeurEtape[];
  const kF = Math.max(1.5, ...toutes.map((v) => v.floral ?? 0));
  const kR = Math.max(2.5, ...toutes.map((v) => v.resineux ?? 0));
  const meilleur = (code: CodeEtape) => {
    const vals = cols.map((c) => etapes[c.cle]?.[code]?.floral ?? -Infinity);
    const m = Math.max(...vals);
    return m > -Infinity ? cols[vals.indexOf(m)].cle : null;
  };
  const base: ValeurEtape = { floral: 0, resineux: 0, ibu: null, raisonIbu: null, raison: null };
  return (
    <section className="pq-comparer-et" aria-label="Aux étapes : chaque houblon posé à 60′, à 10′ et au dry hop, à 4 g/L"
      data-element="d107-etapes d107-etat-au-moment x3b-cuve-jour-apres-jour">
      <div className="pq-comparer-grille-tab pq-comparer-et-h">
        {reference
          ? <span className="pq-comparer-et-ref" data-reference="houblon" data-houblon={reference} data-element="d107-reference"
              aria-label={`Référence : ${nomReference}, le houblon de base de ta recette, aux mêmes étapes, à la même dose`}>
              <span className="pq-comparer-et-ref-n"><i className="pq-comparer-et-tiret" aria-hidden="true" /><span>{nomReference}</span></span>
              <AlphaRef cle={reference} />
            </span>
          : <span className="pq-comparer-et-ref" data-reference="biere" data-element="d107-reference" aria-label="Référence : ta stout seule, sans ajout">
              <i className="pq-comparer-et-tiret" aria-hidden="true" /><span>ta stout</span>
            </span>}
        {cols.map((c) => <span key={c.cle} className={cx('pq-comparer-et-hc', c.cle === retenu && 'pq-comparer-sel')} style={{ ['--pq-h' as string]: c.couleur }} />)}
      </div>
      {ETAPES.map((e, i) => {
        const top = meilleur(e.code);
        const ref = reference ? etapes[reference]?.[e.code] ?? null : base;
        return (
          <div key={e.code} className={cx('pq-comparer-grille-tab pq-comparer-et-r', i === ETAPES.length - 1 && 'pq-comparer-derniere')} data-etape-ligne={e.code}>
            <span className="pq-comparer-et-l">
              <Case v={ref} kF={kF} kR={kR} code={e.code} cle={reference ?? undefined} nom={nomReference ?? 'ta stout'} gris etiquette={e.nom} />
            </span>
            {cols.map((c) => (
              <span key={c.cle} className={cx('pq-comparer-et-c', c.cle === retenu && 'pq-comparer-sel', top === c.cle && 'pq-comparer-et-top')}
                style={{ ['--pq-h' as string]: c.couleur }} data-col={c.cle}>
                <Case v={etapes[c.cle]?.[e.code] ?? null} kF={kF} kR={kR} code={e.code} cle={c.cle} nom={c.houblon.nom} refF={ref?.floral ?? null} />
              </span>
            ))}
          </div>
        );
      })}
    </section>
  );
}

/** Une case : le floral gagné (nombre ; bande au-dessus du pointillé de ta stout ; trait gris de la référence), puis
 * le résineux gagné (bande orangée : ta stout est déjà au-dessus de sa 16D). */
function Case({ v, kF, kR, code, cle, nom, refF, gris, etiquette }: {
  v: ValeurEtape | null; kF: number; kR: number; code: CodeEtape; cle?: string; nom: string; refF?: number | null; gris?: boolean; etiquette?: string;
}) {
  const f = v?.floral ?? null, r = v?.resineux ?? null;
  const lab = `${nom}, posé à ${nomEtape(code)}, 4 g/L : floral ${f == null ? 'inconnu' : `~${nombre(f, 2)} cran`}, résineux ${r == null ? 'inconnu' : `~${nombre(r, 2)} cran`}${v?.ibu ? `, ~${nombre(v.ibu.valeur, 0)} IBU (${nombre(v.ibu.min, 0)}–${nombre(v.ibu.max, 0)})` : v?.raisonIbu ? `, IBU : ${v.raisonIbu}` : ''}`;
  const attrs = { 'data-etape': code, ...(cle ? { 'data-houblon': cle } : {}), 'data-nature': 'simule' };
  return (
    <span className={cx('pq-comparer-et-b', gris && 'pq-comparer-et-gris')} title={lab}>
      <span className="pq-comparer-et-n">
        {etiquette && <b className="pq-comparer-et-nom">{etiquette}</b>}
        {f == null
          ? <span className="pq-comparer-et-v" {...attrs} data-inconnu="" aria-label={lab}>?</span>
          : <span className="pq-comparer-et-v" {...attrs} aria-label={lab}>{txt(f)}</span>}
      </span>
      <span className="pq-comparer-et-ba">
      {etiquette && <Picto famille="floral" taille={12} />}
      <span className="pq-comparer-et-pis">
        {f != null && <i className="pq-comparer-et-fl" style={{ width: pc(f / kF), background: gris ? 'rgb(var(--cave-400))' : COULEURS.floral.base }} />}
        {refF != null && <i className="pq-comparer-et-rt" style={{ left: pc(refF / kF) }} />}
      </span>
      </span>
      <span className="pq-comparer-et-ba">
      {etiquette && <Picto famille="resin" taille={12} />}
      <span className="pq-comparer-et-pr">
        {r != null && <i style={{ width: pc(r / kR), background: gris ? 'rgb(var(--cave-400))' : ORANGE }} />}
      </span>
      </span>
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
