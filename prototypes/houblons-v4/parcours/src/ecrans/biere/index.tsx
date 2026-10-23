// Onglet Ma bière (route biere), reprise de la base v4.10 que le brasseur a confirmée (« Ça aussi » ;
// consolide/biere.html, capture consolide-biere-390.png ; D105) : les onglets « Ma bière · Suggestions · Comparer »,
// le bandeau, l'alerte dégustée, « Barres / Radar » et « Au style / Absolu », « 6 au style · 5 non situées », la
// légende « dégusté · prévu · non situé », une barre par famille (zone du style, « au-dessus » en pointillé, point
// dégusté plein ou prévu creux, inconnu hachuré), la famille hors du style en rouge avec son facteur (« ×2,8 »),
// la famille touchée ouverte sur « bannir · − · sans visée · + », les objectifs « + floral · − résineux · + … » vers
// Suggestions, et « Prévu avec SafAle US-05, caractérisée ». Moteur en direct. Classes préfixées pq-biere- (L26).
import { useState } from 'react';
import { PageShell } from '@app/pages/PageShell';
import { COURT, Legende, Onglets, nombre, type Echelle } from '../../commun';
import { useNavigation } from '../../coquille/navigation';
import { useBiere, useGestes, useRecette, useVisee } from '../../etat/EtatParcours';
import { houblon, nomMoment, style } from '../../moteur';
import { quandDe } from '../../etat/operations';
import { useFiche } from '../fiche/FicheHoublon';
import { effetDe } from '../ma-biere/Carte';
import { tropMarquees } from '../ma-biere/Base';
import type { FamilyId } from '../../../../src/engine';
import { Alerte, Bandeau, NomFamille, PisteBase, nomLevureBase } from '../ma-biere/Base';
import { Lentille } from '../ma-biere/Lentille';
import { RadarBiere } from '../ma-biere/RadarBiere';
import '../ma-biere/ma-biere.css';

/** Une visée par famille, dans l'état commun du parcours (useVisee) : bannir, moins, plus ; sans visée = absente. Au départ,
 * sa dégustation : plus florale, moins résineuse. Suggérer la lit, la fiche aussi (sa demande). */
export type Visee = 'bannir' | -1 | 0 | 1;
const motVisee = (v: Visee, f: FamilyId) => (v === 'bannir' ? `bannir ${COURT[f].toLowerCase()}` : `${v > 0 ? '+' : '−'} ${COURT[f].toLowerCase()}`);

export default function Biere() {
  const recette = useRecette();
  const biere = useBiere();
  const { retour, aller } = useNavigation();
  const sc = style(recette.styleCode);
  const [vue, setVue] = useState<'barres' | 'radar'>('barres');
  const [echelle, setEchelle] = useState<Echelle>('style');
  const visee = useVisee();
  const gestes = useGestes();
  const visees = new Map((Object.entries(visee) as [FamilyId, number | 'banni'][]).map(([f, v]) => [f, (v === 'banni' ? 'bannir' : v > 0 ? 1 : -1) as Visee]));
  const fiche = useFiche();
  // Le houblon qui porte le plus la famille trop marquée (effet simulé de l'ajout sur ma bière).
  const trop = tropMarquees(biere, sc.order)[0];
  const cause = trop ? recette.additions.map((a) => ({ a, e: effetDe(recette, a, biere)[trop]?.e ?? 0 })).filter((x) => x.e > 0).sort((x, y) => y.e - x.e)[0]?.a ?? null : null;
  // La famille hors du style est ouverte au repos (comme la base) ; toucher une autre famille l'ouvre.
  const [ouverte, setOuverte] = useState<FamilyId | null>(() => sc.order.find((f) => biere.profil[f].horsStyle === 'au-dessus') ?? null);
  const poser = (f: FamilyId, v: Visee) => gestes.fixerVisee(f, v === 0 ? null : v === 'bannir' ? 'banni' : v);

  const auStyle = sc.order.filter((f) => biere.profil[f].valeur && !biere.profil[f].horsStyle).length;
  const nonSituees = sc.order.filter((f) => !biere.profil[f].valeur).length;
  const deguste = sc.order.some((f) => biere.profil[f].source === 'dégustation');
  const objectifs = [...visees.entries()].sort((a, b) => (a[1] === 'bannir' ? 1 : 0) - (b[1] === 'bannir' ? 1 : 0) || (b[1] as number) - (a[1] as number));

  return (
    <PageShell title="Ma bière" onClose={retour} className="pq-outil pq-outil-biere"
      mobileHeader={<div data-element="biere-onglets"><Onglets actif="biere" /></div>}>
      <div data-ecran="biere" className="pq-biere space-y-2 pb-4">
        <div className="hidden sm:block" data-element="biere-onglets"><Onglets actif="biere" /></div>
        <Bandeau biere={biere} element="biere-bandeau" />

        <div className="flex items-center gap-2" data-element="biere-reglages">
          <span className="min-w-0 flex-1" data-element="biere-alerte"><Alerte biere={biere} ordre={sc.order} /></span>
          <Lentille label="Vue" marques="vue" value={vue} onChange={setVue} options={[{ value: 'barres', label: 'Barres' }, { value: 'radar', label: 'Radar' }]} />
        </div>
        {cause && (
          <p data-role="cause" className="-mt-1 pl-4 text-sm text-cave-400">surtout <span data-houblon={cause.hopKey} {...fiche.appui(cause.hopKey)} {...fiche.nom(cause.hopKey)}
            className="font-semibold text-cave-200 underline decoration-dotted decoration-cave-600 underline-offset-4">{houblon(cause.hopKey).nom}</span>, {nombre(cause.grams, 1)}{' '}g à {nomMoment(quandDe(cause, recette))}</p>
        )}
        <div className="flex items-center gap-2">
          <p data-element="biere-decompte" className="text-base text-cave-200">{auStyle} au style · {nonSituees} non située{nonSituees > 1 ? 's' : ''}</p>
          <span className="ml-auto" />
          <Lentille label="Échelle" marques="e" value={echelle} onChange={setEchelle} options={[{ value: 'style', label: 'Au style' }, { value: 'absolu', label: 'Absolu' }]} />
        </div>
        <div data-element="biere-legende" className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {deguste && <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-cave-700 text-sm text-cave-200"><i className="w-3.5 h-3.5 rounded-full bg-cave-50" />dégusté 18.10</span>}
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-cave-700 text-sm text-cave-200"><i className="w-3.5 h-3.5 rounded-full border-[3px] border-cave-50" />prévu</span>
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-cave-700 text-sm text-cave-200"><i className="w-3.5 h-3.5 rounded-full border border-dashed border-cave-400" />non situé</span>
            <span className="ml-auto"><Legende>
              <p><b>Zone grise</b> : la bande du style {sc.code} ; le pointillé, au-dessus du style.</p>
              <p><b>Prévu</b> : simulé par le moteur (~) avec la levure et les ajouts de la recette.</p>
              <p><b>Toucher une famille</b> : la bannir, la viser en moins ou en plus ; les objectifs ouvrent Suggestions.</p>
            </Legende></span>
          </div>
          {vue === 'barres' && (
            <div aria-hidden="true" className="grid grid-cols-[6.5rem_1fr_3rem] gap-2 text-sm text-cave-400">
              <span /><span className="grid grid-cols-[80%_20%]"><span className="text-center">zone du style</span><span className="text-center text-xs whitespace-nowrap">au-dessus</span></span><span />
            </div>
          )}
        </div>

        {vue === 'radar'
          ? <div data-element="biere-barres biere-hors-style"><RadarBiere profil={biere.profil} echelle={echelle} /></div>
          : (
            <ul data-element="biere-barres" aria-label={`Familles, ${echelle === 'style' ? `au style ${sc.code}` : 'absolu'}`} className="space-y-0.5">
              {sc.order.map((f) => {
                const x = biere.profil[f];
                const hors = x.horsStyle === 'au-dessus';
                const facteur = hors && x.valeur && x.bande ? x.valeur.centre / x.bande[1] : null;
                const v = visees.get(f) ?? 0;
                const ouv = ouverte === f;
                return (
                  <li key={f} data-famille-ligne={f} className={`rounded-lg ${ouv ? 'pq-biere-ouverte' : ''}`}>
                    <button type="button" aria-expanded={ouv} aria-controls={`pq-biere-visee-${f}`} onClick={() => setOuverte(ouv ? null : f)}
                      className="w-full grid grid-cols-[6.5rem_1fr_3rem] items-center gap-2 min-h-[2.5rem] px-1 text-left"
                      {...(hors ? { 'data-element': 'biere-hors-style' } : {})}>
                      <NomFamille x={x} />
                      <PisteBase x={x} echelle={echelle} />
                      <span className="text-right text-sm whitespace-nowrap">
                        {facteur != null ? <b className="font-mono text-alert">×{nombre(facteur, 1)}</b>
                          : !x.valeur ? <i aria-label="non situé" role="img" className="inline-block w-4 h-4 rounded-full border border-dashed border-cave-400" />
                          : x.source === 'dégustation' ? <span className="text-cave-400">dégusté</span> : <span className="text-cave-400">prévu</span>}
                      </span>
                    </button>
                    <div id={`pq-biere-visee-${f}`} hidden={!ouv} {...(ouv ? { 'data-element': 'biere-bannir' } : {})}
                      role="group" aria-label={`Visée pour ${COURT[f]}`} className={ouv ? 'flex items-center justify-center gap-2 pb-2' : 'hidden'}>
                      <button type="button" data-visee="bannir" aria-pressed={v === 'bannir'} onClick={() => poser(f, v === 'bannir' ? 0 : 'bannir')}
                        className={`h-10 px-4 rounded-full border text-base font-semibold ${v === 'bannir' ? 'bg-ebc-straw text-cave-950 border-transparent' : 'border-cave-700 text-cave-50'}`}>bannir</button>
                      <button type="button" data-visee="moins" aria-pressed={v === -1} aria-label={`Moins de ${COURT[f]}`} onClick={() => poser(f, v === -1 ? 0 : -1)}
                        className={`w-10 h-10 rounded-full border text-lg ${v === -1 ? 'bg-ebc-straw text-cave-950 border-transparent' : 'border-cave-700 text-cave-50'}`}>−</button>
                      <span className="text-base text-cave-400 min-w-[5.5rem] text-center">{v === 0 ? 'sans visée' : v === 'bannir' ? 'bannie' : v > 0 ? 'plus' : 'moins'}</span>
                      <button type="button" data-visee="plus" aria-pressed={v === 1} aria-label={`Plus de ${COURT[f]}`} onClick={() => poser(f, v === 1 ? 0 : 1)}
                        className={`w-10 h-10 rounded-full border text-lg ${v === 1 ? 'bg-ebc-straw text-cave-950 border-transparent' : 'border-cave-700 text-cave-50'}`}>+</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

        <div data-element="biere-objectifs" className="flex items-center gap-2 flex-wrap pt-1">
          {objectifs.map(([f, v]) => (
            <button key={f} type="button" data-role={f === 'floral' && v === 1 ? 'pont-floral' : `pont-objectif-${f}`} data-objectif={f} data-outil="Suggérer"
              onClick={() => aller({ ecran: 'suggerer' })}
              className={`h-11 px-4 rounded-full border text-base font-semibold ${v === 'bannir' ? 'border-dashed border-cave-600 text-cave-400' : 'border-cave-700 text-cave-50'}`}>
              {motVisee(v, f)}
            </button>
          ))}
          <button type="button" data-role="pont-objectif-autre" data-outil="Suggérer" aria-label="Autre objectif : ouvrir Suggérer" onClick={() => aller({ ecran: 'suggerer' })}
            className="h-11 px-4 rounded-full border border-cave-700 text-base font-semibold text-cave-50">+ …</button>
        </div>
        <p data-element="biere-levure" className="text-base text-cave-400">
          Prévu avec {nomLevureBase(recette.yeastId)}, caractérisée{recette.additions.length ? ', et ' : ''}
          {recette.additions.map((a, k) => (
            <span key={a.id}>{k ? ', ' : ''}<span data-houblon={a.hopKey} {...fiche.appui(a.hopKey)} {...fiche.nom(a.hopKey)}
              className="text-cave-200 underline decoration-dotted decoration-cave-600 underline-offset-4">{houblon(a.hopKey).nom}</span> {nombre(a.grams, 1)}{' '}g à {nomMoment(quandDe(a, recette))}</span>
          ))}
        </p>
        {fiche.rendu}
      </div>
    </PageShell>
  );
}
