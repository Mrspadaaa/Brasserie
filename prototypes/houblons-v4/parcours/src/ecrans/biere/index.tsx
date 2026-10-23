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
import { style } from '../../moteur';
import type { FamilyId } from '../../../../src/engine';
import { Alerte, Bandeau, NomFamille, PisteBase, nomLevureBase } from '../ma-biere/Base';
import { Lentille } from '../ma-biere/Lentille';
import { RadarBiere } from '../ma-biere/RadarBiere';
import '../ma-biere/ma-biere.css';
import { DEMANDE_DEGUSTEE, descendre, enNiveau, enPoints, monter, nomPalier, sensDe, type Sens } from '../../etat/visee';

/** La puce d'un objectif : « + floral », « − résineux », « bannir agrumes ». */
const motObjectif = (s: Sens, f: FamilyId) => `${s === 'banni' ? 'bannir' : s > 0 ? '+' : '−'} ${COURT[f].toLowerCase()}`;

export default function Biere() {
  const recette = useRecette();
  const biere = useBiere();
  const { retour, aller } = useNavigation();
  const sc = style(recette.styleCode);
  const [vue, setVue] = useState<'barres' | 'radar'>('barres');
  const [echelle, setEchelle] = useState<Echelle>('style');
  const visee = useVisee();
  const gestes = useGestes();
  // La famille hors du style est ouverte au repos (comme la base) ; toucher une autre famille l'ouvre.
  const [ouverte, setOuverte] = useState<FamilyId | null>(() => sc.order.find((f) => biere.profil[f].horsStyle === 'au-dessus') ?? null);
  // La visée de la base v4.10 (viserAbs, D108) : un palier sur 0 à 3 ; « + » et « − » partent de la visée, ou de ma bière.
  const niveau = (f: FamilyId) => { const v = biere.profil[f].valeur; return v ? enNiveau(v.centre) : 0; };
  const viser = (f: FamilyId, geste: 'bannir' | 'moins' | 'plus' | 'retirer') => {
    const depuis = visee[f] ?? niveau(f);
    gestes.fixerVisee(f, geste === 'retirer' ? null : geste === 'bannir' ? 0 : geste === 'moins' ? descendre(depuis) : monter(depuis));
  };
  // Les puces suivent les visées ; sans visée, la demande dégustée (« + floral · − résineux »), comme la base.
  const sens = sensDe(visee, (f) => biere.profil[f].valeur?.centre ?? null);
  const premiers = Object.keys(DEMANDE_DEGUSTEE) as FamilyId[];
  const objectifs = (Object.entries(sens) as [FamilyId, Sens][])
    .sort(([a], [b]) => (premiers.includes(a) ? premiers.indexOf(a) : 9 + sc.order.indexOf(a)) - (premiers.includes(b) ? premiers.indexOf(b) : 9 + sc.order.indexOf(b)));

  const auStyle = sc.order.filter((f) => biere.profil[f].valeur && !biere.profil[f].horsStyle).length;
  const nonSituees = sc.order.filter((f) => !biere.profil[f].valeur).length;
  const deguste = sc.order.some((f) => biere.profil[f].source === 'dégustation');

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
              <p><b>Toucher une famille</b> : ma visée, le losange, d'un palier (faible, moyen, marqué) par « − » ou « + » ; bannir, à 0 ; « × » la retire. Les objectifs ouvrent Suggestions.</p>
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
                const vi = visee[f];
                const s = sens[f];
                const posee = vi != null;
                const bannie = vi === 0;
                const ouv = ouverte === f;
                const etiquette = `${COURT[f]}${posee ? ` ; ma visée ${nomPalier(vi)}` : ''}`;
                return (
                  <li key={f} data-famille-ligne={f} {...(bannie ? { 'data-bannie': '' } : {})} className={`rounded-lg ${ouv ? 'pq-biere-ouverte' : ''}`}>
                    <button type="button" aria-expanded={ouv} aria-controls={`pq-biere-visee-${f}`} onClick={() => setOuverte(ouv ? null : f)}
                      aria-label={`${etiquette} ; ${ouv ? 'refermer' : 'ouvrir bannir, moins, plus'}`}
                      className="w-full grid grid-cols-[6.5rem_1fr_3rem] items-center gap-2 min-h-[2.5rem] px-1 text-left"
                      {...(hors ? { 'data-element': 'biere-hors-style' } : {})}>
                      <NomFamille x={x} bannie={bannie} />
                      <PisteBase x={x} echelle={echelle} visee={posee ? enPoints(vi) : null} crans />
                      <span className="text-right text-sm whitespace-nowrap">
                        {facteur != null ? <b className="font-mono text-alert">×{nombre(facteur, 1)}</b>
                          : !x.valeur ? <i aria-label="non situé" role="img" className="inline-block w-4 h-4 rounded-full border border-dashed border-cave-400" />
                          : x.source === 'dégustation' ? <span className="text-cave-400">dégusté</span> : <span className="text-cave-400">prévu</span>}
                      </span>
                    </button>
                    <div id={`pq-biere-visee-${f}`} hidden={!ouv} {...(ouv ? { 'data-element': 'biere-bannir' } : {})}
                      role="group" aria-label={`Visée pour ${COURT[f]}`} className={ouv ? 'flex items-center justify-center gap-2 pb-2' : 'hidden'}>
                      {/* Comme la base : « + » et « − » d'un palier, le palier nommé entre eux, « × » retire. Le bouton du sens
                          posé a l'encre pleine (aria-pressed) ; le losange sur la piste dit le niveau. */}
                      <button type="button" data-visee="bannir" aria-pressed={bannie} aria-label={`Bannir ${COURT[f]} : visée absente`} onClick={() => viser(f, 'bannir')}
                        className={`h-10 px-4 rounded-full border text-base font-semibold ${bannie ? 'pq-biere-sens' : 'border-cave-700 text-cave-50'}`}>bannir</button>
                      <button type="button" data-visee="moins" aria-pressed={posee && !bannie && s === -1} aria-label={`Réduire ma visée de ${COURT[f]} d'un palier`} onClick={() => viser(f, 'moins')}
                        className={`w-10 h-10 rounded-full border text-lg ${posee && !bannie && s === -1 ? 'pq-biere-sens' : 'border-cave-700 text-cave-50'}`}>−</button>
                      <span data-palier={posee ? nomPalier(vi) : ''} aria-live="polite"
                        className={`text-base min-w-[5.5rem] text-center ${posee ? 'font-semibold text-cave-50' : 'text-cave-400'}`}>{posee ? nomPalier(vi) : 'sans visée'}</span>
                      <button type="button" data-visee="plus" aria-pressed={posee && s === 1} aria-label={`Augmenter ma visée de ${COURT[f]} d'un palier`} onClick={() => viser(f, 'plus')}
                        className={`w-10 h-10 rounded-full border text-lg ${posee && s === 1 ? 'pq-biere-sens' : 'border-cave-700 text-cave-50'}`}>+</button>
                      {posee && (
                        <button type="button" data-visee="retirer" aria-label={`Retirer ma visée de ${COURT[f]}`} onClick={() => viser(f, 'retirer')}
                          className="w-10 h-10 rounded-full border border-cave-700 text-lg text-cave-50">×</button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

        <div data-element="biere-objectifs" className="flex items-center gap-2 flex-wrap pt-1">
          {objectifs.map(([f, s]) => (
            // Pleine quand une visée est posée (la puce noire de la base), au trait pour la demande dégustée.
            <button key={f} type="button" data-role={f === 'floral' && s === 1 ? 'pont-floral' : `pont-objectif-${f}`} data-objectif={f} data-outil="Suggérer"
              {...(visee[f] != null ? { 'data-visee-posee': '' } : {})} onClick={() => aller({ ecran: 'suggerer' })}
              className={`h-11 px-4 rounded-full border text-base font-semibold ${visee[f] != null ? 'pq-biere-puce-posee' : 'border-cave-700 text-cave-50'}`}>
              {motObjectif(s, f)}
            </button>
          ))}
          <button type="button" data-role="pont-objectif-autre" data-outil="Suggérer" aria-label="Autre objectif : ouvrir Suggérer" onClick={() => aller({ ecran: 'suggerer' })}
            className="h-11 px-4 rounded-full border border-cave-700 text-base font-semibold text-cave-50">+ …</button>
        </div>
        <p data-element="biere-levure" className="text-base text-cave-400">
          Prévu avec {nomLevureBase(recette.yeastId)}, caractérisée
        </p>
      </div>
    </PageShell>
  );
}
