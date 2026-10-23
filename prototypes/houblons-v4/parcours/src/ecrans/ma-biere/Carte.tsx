// La carte d'un ajout posée sur la frise (base v4.10, index.html) : nom (appui long → fiche), type
// (« ébullition ⟳ »), dose « − 46 g + », × ; α (lot d'abord), usage, signal de la famille marquée
// (« résine 2/4 »), IBU de l'ajout recalculé en direct ; bande des 12 familles en couleur, avec, sous chaque
// famille que l'ajout fait bouger d'au moins 0,5 point, un trait de son intensité en crans du style (D80).
// Toucher court : Dryhopper (carte des outils) ; « Je n'ai pas Nugget » : Substituer.
import { useMemo } from 'react';
import { Minus, Plus, RotateCw, X } from 'lucide-react';
import { COULEURS, COURT, Inconnu, nombre } from '../../commun';
import { useOuvrir } from '../../coquille/ouvrir';
import { useNavigation } from '../../coquille/navigation';
import { useGestes } from '../../etat/EtatParcours';
import { quandDe } from '../../etat/operations';
import type { AjoutParcours, Quand, RecetteParcours } from '../../etat/types';
import { houblon, lireBiere, style, type BiereLue } from '../../moteur';
import type { FamilyId } from '../../../../src/engine';
import { AlphaLu, Autres, StockIcone, Usage } from '../fiche/briques';
import { useGestesFiche } from '../fiche/gestes';

const SEUIL = 0.5;
const COURT_SIGNAL: Partial<Record<FamilyId, string>> = { resin: 'résine', herbal: 'herbe', earthy: 'terre', spice: 'épice', stoneFruit: 'noyau', pomeFruit: 'pépins', tropical: 'tropical', citrus: 'agrumes' };

/** Les familles qu'un ajout fait bouger d'au moins 0,5 point : ma bière avec et sans lui (D80). */
export function effetDe(recette: RecetteParcours, a: AjoutParcours, avec: BiereLue) {
  const sans = lireBiere({ ...recette, additions: recette.additions.filter((x) => x.id !== a.id) });
  const r = {} as Partial<Record<FamilyId, { e: number; crans: number }>>;
  for (const f of Object.keys(avec.profil) as FamilyId[]) {
    const x = avec.profil[f].valeur, y = sans.profil[f].valeur, c = avec.profil[f].crans;
    if (x && y && c != null && Math.abs(x.centre - y.centre) >= SEUIL) r[f] = { e: x.centre - y.centre, crans: c };
  }
  return r;
}

const typeDe = (q: Quand) => (q.type === 'ebullition' || q.type === 'premierMout' ? 'ébullition' : q.type === 'whirlpool' ? 'whirlpool' : 'dry hop');
/** ⟳ : ébullition → whirlpool → dry hop (actif, 3 j) → ébullition 60′. */
const typeSuivant = (q: Quand, recette: RecetteParcours): Quand =>
  q.type === 'ebullition' || q.type === 'premierMout' ? { type: 'whirlpool' } : q.type === 'whirlpool' ? { type: 'dryhop', phase: 'actif', jours: 3 } : { type: 'ebullition', minutes: recette.boilMin };

export function Carte({ a, recette, biere, repere, onGeste }: {
  a: AjoutParcours; recette: RecetteParcours; biere: BiereLue; repere: string | null; onGeste: () => void;
}) {
  const ouvrir = useOuvrir();
  const { route } = useNavigation();
  const gestes = useGestes();
  const h = houblon(a.hopKey);
  const sc = style(recette.styleCode);
  const fiche = useGestesFiche((cle) => { if (route.ecran !== 'fiche') ouvrir({ ecran: 'fiche', houblon: cle }); });
  const q = quandDe(a, recette);
  const ibu = biere.ibuParAjout[a.id];
  const effet = useMemo(() => effetDe(recette, a, biere), [recette, a, biere]);
  const nonSimule = biere.nonSimules.find((x) => x.ajoutId === a.id);
  // Signal : la famille la plus citée par les fiches, entourée de rouge si elle est hors du style dans ma bière.
  const signal = sc.order.filter((f) => h.familles[f].niveau !== 'non décrit')
    .sort((x, y) => (biere.profil[y].horsStyle ? 1 : 0) - (biere.profil[x].horsStyle ? 1 : 0) || h.familles[y].fiches - h.familles[x].fiches)[0];
  // Seules les commandes (boutons) gardent leur geste ; le reste de la carte garde l'appui long (D49).
  const surBouton = (e: React.SyntheticEvent) => !!(e.target as Element).closest('button');
  const stop = { onPointerDown: (e: React.PointerEvent) => { if (surBouton(e)) e.stopPropagation(); }, onClick: (e: React.MouseEvent) => { if (surBouton(e)) e.stopPropagation(); } };
  const bouton = 'w-7 h-7 inline-flex items-center justify-center rounded-full border border-cave-700 text-cave-200';
  return (
    <div data-role="ligne-houblon" data-voie={a.id} data-ajout={a.id} data-element="etape-carte-ajout" data-houblon-ligne={a.hopKey}
      {...fiche.appui(a.hopKey, () => ouvrir({ ecran: 'dryhopper', ajout: a.id }))}
      className={`pq-ma-biere-carte relative px-2.5 pt-1.5 pb-2 space-y-1 rounded-lg ${repere ? 'pq-ma-biere-change' : ''}`}>
      {repere && <p data-role="vient-de-changer" className="pq-ma-biere-repere text-xs leading-none">{repere}</p>}
      <div className="flex items-center gap-x-1.5 gap-y-1 flex-wrap">
        <span data-role="ouvrir-fiche" data-houblon={a.hopKey} {...fiche.nom(a.hopKey)}
          className="shrink-0 font-semibold text-base text-cave-50 underline decoration-dotted decoration-cave-600 underline-offset-4">{h.nom}</span>
        <span {...stop}>
          <button type="button" data-role="type-ajout" aria-label={`Type d'ajout : ${typeDe(q)}, toucher pour changer`}
            onClick={() => { onGeste(); gestes.moment('recette', a.id, typeSuivant(q, recette)); }}
            className="inline-flex items-center gap-1 h-7 px-2 rounded-full border border-cave-700 text-sm text-cave-200 whitespace-nowrap">
            {typeDe(q)}<RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </span>
        <span className="ml-auto inline-flex items-center gap-1 shrink-0" {...stop}>
          <button type="button" data-role="dose-moins" aria-label={`${h.nom} : 1 g de moins`} onClick={() => { onGeste(); gestes.dose('recette', a.id, a.grams - 1); }} className={bouton}>
            <Minus className="w-4 h-4" aria-hidden="true" /></button>
          <output data-role="dose" className="min-w-[2.5rem] text-center font-mono font-semibold text-base text-cave-50 tabular-nums">{nombre(a.grams, 1)}<span className="font-sans font-normal text-sm text-cave-400">{' '}g</span></output>
          <button type="button" data-role="dose-plus" aria-label={`${h.nom} : 1 g de plus`} onClick={() => { onGeste(); gestes.dose('recette', a.id, a.grams + 1); }} className={bouton}>
            <Plus className="w-4 h-4" aria-hidden="true" /></button>
          <button type="button" data-role="retirer" aria-label={`Retirer ${h.nom}`} onClick={() => { onGeste(); gestes.retirer('recette', a.id); }}
            className="w-6 h-7 inline-flex items-center justify-center text-cave-400"><X className="w-4 h-4" aria-hidden="true" /></button>
        </span>
      </div>
      <div className="flex items-center gap-x-1.5 gap-y-1 flex-wrap min-w-0">
        <AlphaLu h={h} />
        <Usage h={h} />
        <StockIcone h={h} />
        {signal && (
          <span data-role="signal" className={`inline-flex items-center h-6 px-2 rounded-full border-2 text-sm whitespace-nowrap ${biere.profil[signal].horsStyle ? 'border-alert text-alert' : 'border-cave-700 text-cave-200'}`}>
            {COURT_SIGNAL[signal] ?? COURT[signal].toLowerCase()} {h.familles[signal].fiches}/{h.familles[signal].sur}
          </span>
        )}
        <span className="ml-auto font-mono text-sm whitespace-nowrap">
          {ibu.ibu
            ? <><output data-role="ibu-ajout" data-valeur={ibu.ibu.valeur.toFixed(2)} className="text-cave-50">{nombre(ibu.ibu.valeur)}</output><span className="font-sans text-cave-400">{' '}IBU</span></>
            : <><Inconnu raison={ibu.raison ?? 'inconnu'} /><span className="font-sans text-cave-400">{' '}IBU</span></>}
        </span>
      </div>
      <div className="flex items-center gap-x-2 gap-y-1 flex-wrap min-w-0">
        <span role="img" aria-label={`Arômes de ${h.nom}`} className="inline-flex items-start gap-0.5 shrink-0">
          {sc.order.map((f) => {
            const n = h.familles[f].niveau;
            const e = effet[f];
            return (
              <span key={f} className="inline-flex flex-col items-center gap-px">
                <i className="block w-2.5 h-3 rounded-sm" style={{ background: n === 'non décrit' ? 'rgb(var(--cave-800))' : COULEURS[f].base, opacity: n === 'cité' ? 0.55 : 1 }} />
                {e
                  ? <i data-famille={f} data-crans={String(e.crans)} title={`${COURT[f]} : ${e.e > 0 ? '+' : '−'}, ${Math.round(e.crans)} cran(s) du style`}
                      className="block h-1 rounded-sm" style={{ width: `${Math.max(3, Math.min(10, 2.5 * Math.max(1, Math.round(e.crans))))}px`, background: biere.profil[f].horsStyle ? '#c2410c' : COULEURS[f].base }} />
                  : <i className="block h-1" />}
              </span>
            );
          })}
        </span>
        {nonSimule && <span className="inline-flex items-center gap-1 text-xs text-cave-400"><Inconnu raison={nonSimule.raison} />arôme</span>}
        {h.partSansFamille != null && h.partSansFamille >= 0.25 && <Autres h={h} largeur={48} petit />}
        <span className="ml-auto" {...stop}>
          <button type="button" data-role="pont-substituer" data-houblon={a.hopKey} onClick={() => ouvrir({ ecran: 'substituer', houblon: a.hopKey })}
            className="h-7 px-2 rounded-full text-xs font-semibold text-cave-200 underline decoration-dotted underline-offset-4 whitespace-nowrap">
            Sans {h.nom} <span aria-hidden="true">›</span>
          </button>
        </span>
      </div>
    </div>
  );
}
