// Le rail des étapes de l'étape Houblons, celui de sa base v4.10 (consolide/index.html ; generateur/etape-consolide.js,
// BRIEF-RAIL.md), repris tel quel (D123, D124 ; décision du pilote, option A de p20). Au repos, un rail compact et
// sans graduation : la durée d'ébullition lue dans la recette avec son renvoi (« Ébullition 60′ › », D37 révisé), les
// lignes de la recette posées à leur moment, 0′, le whirlpool, la levure (D28), la fermentation et la
// post-fermentation. La poignée de chaque ligne (« 60′ », « 80 °C », « J+3 ») se glisse : la loupe à plateau ×3 suit
// le doigt et passe au segment où il est (D47, D63, D67), le whirlpool se lit en °C (100 à 60 par 5), la fermentation
// et la post-fermentation en J+0 à J+14 ; la carte se replie en puce ; rien n'est recalculé avant le lâcher (D46) ;
// un geste interrompu rend tout (D42). Le geste est celui de rail.ts (porté de la base) ; le lâcher pose la valeur dans
// l'état du parcours et le moteur recalcule. Au clavier : ↑ ↓ (toutes les valeurs du rail).
// Contrat : [data-role="frise"] aria-orientation="vertical" ; une poignée par ajout [data-role="glisser-moment"]
// [role="slider"][aria-orientation="vertical"][data-ajout-repere] dans sa ligne [data-role="ligne-houblon"].
import { useEffect, useMemo, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { useOuvrir } from '../../coquille/ouvrir';
import { useParcours } from '../../etat/EtatParcours';
import { placer, quandDe } from '../../etat/operations';
import type { AjoutParcours, RecetteParcours } from '../../etat/types';
import { houblon, type BiereLue } from '../../moteur';
import { Carte } from './Carte';
import { nomLevureBase } from './Base';
import { brancherGlisser, creerRail, type Rail, type Segment } from './rail';

/** La valeur du rail d'un ajout : « fwh », « b35 », « wp80 », « f3 », « p10 ». */
export function valeurDe(a: AjoutParcours, recette: RecetteParcours): string {
  const q = quandDe(a, recette);
  if (q.type === 'premierMout') return 'fwh';
  if (q.type === 'ebullition') return 'b' + Math.max(0, Math.min(recette.boilMin, Math.round(q.minutes / 5) * 5));
  if (q.type === 'whirlpool') return 'wp' + (a.tempC ?? 80);
  return (q.phase === 'actif' ? 'f' : 'p') + (a.day ?? 3);
}
/** Un ajout posé à une valeur du rail : le moment du moteur, et la température du whirlpool ou le jour à froid. */
export function appliquerValeur(a: AjoutParcours, v: string, recette: RecetteParcours): AjoutParcours {
  if (v === 'fwh') return placer(a, { type: 'premierMout' }, recette);
  if (/^b\d/.test(v)) return placer(a, { type: 'ebullition', minutes: Number(v.slice(1)) }, recette);
  if (/^wp\d/.test(v)) {
    const base = quandDe(a, recette).type === 'whirlpool' ? a : placer(a, { type: 'whirlpool' }, recette);
    return { ...base, tempC: Number(v.slice(2)), minutes: a.minutes != null && quandDe(a, recette).type === 'whirlpool' ? a.minutes : 20 };
  }
  const actif = v[0] === 'f';
  const q = quandDe(a, recette);
  const jours = q.type === 'dryhop' ? q.jours : 3;
  return { ...placer(a, { type: 'dryhop', phase: actif ? 'actif' : 'apres', jours }, recette), day: Number(v.slice(1)) };
}
/** Le moment écrit sur la poignée : 35′, 80 °C, J+3 ; « moût » au premier moût (base : mom('fwh').quand). */
export const libelleDe = (v: string) => (v === 'fwh' ? 'moût' : /^b/.test(v) ? v.slice(1) + '′' : /^wp/.test(v) ? v.slice(2) + ' °C' : 'J+' + v.slice(1));
/** Le moment en mots (lecteur d'écran, ajouts proposés). */
export function momentLong(v: string, ebu: number, minutesWp = 20) {
  if (v === 'fwh') return `premier moût, ${ebu} minutes d'ébullition`;
  if (/^b/.test(v)) { const m = Number(v.slice(1)); return m === 0 ? "fin d'ébullition" : `${m} minutes d'ébullition`; }
  if (/^wp/.test(v)) return `whirlpool à ${v.slice(2)} °C pendant ${minutesWp} minutes`;
  return `à froid, jour ${v.slice(1)}${v[0] === 'f' ? ', en fermentation active' : ', après fermentation'}`;
}

/** Changer un ajout en place (l'ordre de la recette est gardé) : un geste du parcours. */
export function useModifier() {
  const { etat, dispatch } = useParcours();
  const ref = useRef(etat); ref.current = etat;
  return (id: string, f: (a: AjoutParcours, r: RecetteParcours) => AjoutParcours) => {
    const e = ref.current;
    dispatch({ type: 'etat/poser', etat: { ...e, gestes: e.gestes + 1, recette: { ...e.recette, additions: e.recette.additions.map((a) => (a.id === id ? f(a, e.recette) : a)) } } });
  };
}

function Point({ c }: { c: 'ebu' | 'etape' | 'fin' | 'levure' }) {
  return <span aria-hidden="true" className={`pq-mb-pt pq-mb-pt-${c}`} />;
}

/** La poignée du moment : la pastille (« 60′ ») de la ligne, glissée le long du rail, ou ↑ ↓ au clavier. */
function Poignee({ a, v, rail, recette, frise, onGeste }: {
  a: AjoutParcours; v: string; rail: Rail; recette: RecetteParcours; frise: React.RefObject<HTMLElement | null>; onGeste: () => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const modifier = useModifier();
  const toutes = useMemo(() => rail.toutesValeurs(), [rail]);
  const vRef = useRef(v); vRef.current = v;
  const recetteRef = useRef(recette); recetteRef.current = recette;
  const onGesteRef = useRef(onGeste); onGesteRef.current = onGeste;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return brancherGlisser(el, () => ({
      rail, frise: frise.current!, carte: el.closest<HTMLElement>('[data-rang]')!, v: vRef.current, libelle: libelleDe,
      zone: () => { const m = el.closest('main')?.getBoundingClientRect(); return { haut: m?.top ?? 0, bas: m?.bottom ?? window.innerHeight }; },
      estompe: el.closest<HTMLElement>('[data-ecran="ma-biere"]'),
      fin: (nv) => { if (nv) { onGesteRef.current(); modifier(a.id, (x, r) => appliquerValeur(x, nv, r)); } },
    }));
  }, [rail, a.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const k = toutes.indexOf(v);
  const libelle = libelleDe(v);
  return (
    <span ref={ref} data-role="glisser-moment" data-ajout-repere={a.id} role="slider" tabIndex={0} aria-orientation="vertical"
      aria-label={`Moment de ${houblon(a.hopKey).nom} : ${momentLong(v, recette.boilMin, a.minutes ?? 20)} ; glisser le long du rail pour le changer, ou flèches haut et bas`}
      aria-valuemin={0} aria-valuemax={toutes.length - 1} aria-valuenow={Math.max(0, k)} aria-valuetext={libelle}
      className="pq-mb-poignee"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        const n = k + (e.key === 'ArrowDown' ? 1 : -1);
        if (n >= 0 && n < toutes.length) { onGeste(); modifier(a.id, (x, r) => appliquerValeur(x, toutes[n], r)); }
      }}>
      <span data-role="moment-pouce" className="pq-mb-quand">{libelle}</span>
    </span>
  );
}

export function Frise({ recette, biere, reperes, nouveaux, onGeste, ouvrirChamp }: {
  recette: RecetteParcours; biere: BiereLue; reperes: Record<string, string>; nouveaux: Set<string>; onGeste: () => void; ouvrirChamp: () => void;
}) {
  const ouvrir = useOuvrir();
  const frise = useRef<HTMLElement>(null);
  const ebu = recette.boilMin;
  const rail = useMemo(() => creerRail(ebu), [ebu]);
  const lignes = recette.additions.map((a, i) => ({ a, i, v: valeurDe(a, recette) }));
  const duSegment = (s: Segment) => lignes.filter((l) => rail.segDe(l.v) === s)
    .sort((x, y) => rail.rangValeur(x.v) - rail.rangValeur(y.v) || x.i - y.i)
    .map(({ a, i, v }) => (
      <div key={a.id} data-rang={'L' + a.id} data-role="ligne-houblon" data-valeur={v} data-nom={houblon(a.hopKey).nom} data-ajout={a.id}
        className="pq-mb-rang pq-mb-blk">
        <Poignee a={a} v={v} rail={rail} recette={recette} frise={frise} onGeste={onGeste} />
        <Carte a={a} recette={recette} biere={biere} repere={reperes[a.id] ?? null} nouveau={nouveaux.has(a.id)} premier={i === 0} onGeste={onGeste} />
      </div>
    ));
  const levureChangee = reperes.__levure;
  const ajoutLevure = (lignes.find((l) => rail.segDe(l.v) === 'fermentation') ?? lignes.find((l) => rail.segDe(l.v) === 'post') ?? lignes[0])?.a.id ?? null;
  const graduations = useMemo(() => (['ebullition', 'whirlpool', 'fermentation', 'post'] as Segment[]).flatMap((s) =>
    rail.valeursSeg(s).map((v) => (
      <i key={v} className={`pq-mb-grad${rail.majeure(s, v) ? ' pq-mb-maj' : ''}`} data-etape={v} data-graduation={s}>
        <b className="pq-mb-grad-v">{rail.texteGrad(v)}</b>
      </i>
    ))), [rail]);
  return (
    <section ref={frise} data-role="frise" data-acquis="frise" data-element="etape-frise" data-etat="etat-etape-repos" aria-orientation="vertical"
      aria-label="Houblons de la recette, posés sur le rail du brassage" className="pq-mb-frise">
      <i aria-hidden="true" className="pq-mb-axe" />
      {/* D37 révisé : la durée se lit ici et se règle dans la fiche de brassage (renvoi, comme un réglage d'iPhone). */}
      <div data-rang="T-ebu" data-role="ebullition" data-minutes={String(ebu)} className="pq-mb-rang pq-mb-r-ebu">
        <Point c="ebu" />
        <a href="#fiche-brassage" data-etat="etat-etape-ebullition-lien" data-action="renvoi-ebullition" className="pq-mb-renvoi"
          title="Réglée dans la fiche de brassage" aria-label={`Ébullition ${ebu} minutes, réglée dans la fiche de brassage`}
          onClick={(e) => e.preventDefault()}>
          <span className="pq-mb-cle">Ébullition</span>
          <b className="pq-mb-ebu-v">{`${ebu}′`}</b>
          <ChevronRight aria-hidden="true" className="pq-mb-chevron" />
        </a>
      </div>
      {duSegment('ebullition')}
      {/* Recette vide : la place des houblons sur l'ébullition, en pointillé ; un toucher mène à la recherche. */}
      {!lignes.length && (
        <button type="button" data-rang="T-vide" aria-label="Aucun houblon dans la recette : chercher un houblon à ajouter" onClick={ouvrirChamp}
          className="pq-mb-rang pq-mb-r-vide"><span /><span aria-hidden="true" className="pq-mb-vide-c" /></button>
      )}
      <div data-rang="T-fin" aria-label="Fin de l'ébullition" className="pq-mb-rang pq-mb-r-fin"><Point c="fin" /><span className="pq-mb-nom">0′</span></div>
      <div data-rang="T-wp" data-etape="wp" className="pq-mb-rang pq-mb-r-etape"><Point c="etape" /><span className="pq-mb-nom">whirlpool</span></div>
      {duSegment('whirlpool')}
      <div data-rang="T-levure" data-etape="levure" className="pq-mb-rang pq-mb-r-levure">
        <Point c="levure" />
        <button type="button" data-role="pont-etape-levure" data-element="etape-levure" disabled={!ajoutLevure}
          aria-label={`Levure de la recette : ${nomLevureBase(recette.yeastId)}, caractérisée`}
          onClick={() => ajoutLevure && ouvrir({ ecran: 'levure', ajout: ajoutLevure })}
          className={`pq-mb-levure ${levureChangee ? 'pq-ma-biere-change' : ''}`}>
          <i aria-hidden="true" className="pq-mb-ic-levure" />
          <span className="pq-mb-levure-nom">{nomLevureBase(recette.yeastId)}</span>
          <span className="pq-mb-gris">caractérisée</span>
          {levureChangee && <span data-role="vient-de-changer" className="pq-ma-biere-repere text-xs truncate">{levureChangee}</span>}
        </button>
      </div>
      <div data-rang="T-dryActive" data-etape="dryActive" className="pq-mb-rang pq-mb-r-etape"><Point c="etape" /><span className="pq-mb-nom">fermentation</span></div>
      {duSegment('fermentation')}
      <div data-rang="T-dryPost" data-etape="dryPost" className="pq-mb-rang pq-mb-r-etape"><Point c="etape" /><span className="pq-mb-nom">post-fermentation</span></div>
      {duSegment('post')}
      <div aria-hidden="true" className="pq-mb-grads">{graduations}</div>
    </section>
  );
}
