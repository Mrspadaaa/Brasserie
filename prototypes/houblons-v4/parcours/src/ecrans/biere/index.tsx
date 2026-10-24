// Onglet Ma bière (route biere), reprise de la base v4.10 que le brasseur a confirmée (« Ça aussi » ;
// consolide/biere.html, capture consolide-biere-390.png ; D105), TOUS SES ÉTATS (D124, voie r2) :
// - Barres : les onglets, le bandeau, l'alerte dégustée, « Barres / Radar » et « Au style / Absolu », le décompte, la
//   légende « dégusté · prévu · non situé », l'en-tête « zone du style · au-dessus » (en absolu : « faible · moyen ·
//   marqué »), une barre par famille, la famille hors du style en rouge avec son facteur, la famille touchée ouverte
//   sur « bannir · − · sans visée · + » (D108) ;
// - Radar : le grand radar m4 de sa dégustation face à la zone du style, la bulle au toucher d'un sommet, et dessous la
//   grille « pas senti · faible · moyen · marqué » ; le décompte, la légende et la levure se replient, comme la base ;
// - les objectifs « + floral · − résineux · + … » posent la visée sur la barre, sans quitter l'onglet ; la ligne
//   « Plus floral : 8 voies, 2 faibles › » s'écrit dessous (résumé du moteur, voiesSummary) et ouvre Suggérer.
// Moteur en direct. Chaque état porte data-etat sur son déclencheur (controle-etats.mjs). Classes pq-biere- (L26).
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageShell } from '@app/pages/PageShell';
import { COURT, Legende, Onglets, ROUE, nombre, type Echelle } from '../../commun';
import { useNavigation } from '../../coquille/navigation';
import { useBiere, useGestes, useRecette, useVisee } from '../../etat/EtatParcours';
import { donnees, proposer, style } from '../../moteur';
import { voiesSummary, type FamilyId } from '../../../../src/engine';
import { Alerte, Bandeau, NomFamille, PisteBase, nomLevureBase } from '../ma-biere/Base';
import { Lentille } from '../ma-biere/Lentille';
import { RadarBiere, auDessus, type Note } from '../ma-biere/RadarBiere';
import { objectifsDe } from '../suggerer/voies';
import { GrilleDegustation } from './Degustation';
import '../ma-biere/ma-biere.css';
import './biere.css';
import { DEMANDE_DEGUSTEE, descendre, enNiveau, enPoints, monter, nomPalier, sensDe, type Sens } from '../../etat/visee';

/** La puce d'un objectif : « + floral », « − résineux », « bannir agrumes ». */
const motObjectif = (s: Sens, f: FamilyId) => `${s === 'banni' ? 'bannir' : s > 0 ? '+' : '−'} ${COURT[f].toLowerCase()}`;
const NOTE_PERCUE: Record<string, Note> = { faible: 1, moyen: 2, marqué: 3 };
/** Les classes de l'échelle absolue (0–33, 33–66, 66–100 points), à leur milieu sur la piste de la base (0 → 110). */
const CLASSES_ABSOLU = [['faible', 50 / 3], ['moyen', 50], ['marqué', 250 / 3]] as const;

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
  // « + … » : l'aide « Autres directions », la famille suivante à viser ouverte.
  const [autre, setAutre] = useState(false);
  // Ma dégustation (grille m4), notée sous le radar : au départ celle des données (le 18.10 : résineux marqué).
  const [notes, setNotes] = useState<Record<FamilyId, Note>>(() => {
    const t = donnees().degustation?.tasting;
    return Object.fromEntries(ROUE.map((f) => {
      const p = t?.axes.find((a) => a.family === f)?.perceived;
      return [f, p ? NOTE_PERCUE[p] ?? null : null];
    })) as Record<FamilyId, Note>;
  });
  const haut = useMemo(() => Object.fromEntries(ROUE.map((f) => {
    const b = biere.profil[f].bande;
    return [f, b ? enNiveau(b[1]) : 3];
  })) as Record<FamilyId, number>, [biere]);
  const attendues = useMemo(() => sc.order.filter((f) => biere.profil[f].statut === 'attendue'), [sc, biere]);

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
  // Une puce pose la visée de son sens (la base : chipsDirection) ; posée, elle la retire.
  const basculer = (f: FamilyId, s: Sens) => {
    if (visee[f] != null) viser(f, 'retirer');
    else viser(f, s === 'banni' ? 'bannir' : s > 0 ? 'plus' : 'moins');
  };
  // Sous les puces, pour chaque visée posée : le résumé des voies du moteur (voiesSummary, comme la base), sur la même
  // direction que Suggérer (objectifsDe), et le « › » qui l'ouvre.
  const liens = useMemo(() => {
    const dirs = Object.keys(visee) as FamilyId[];
    if (!dirs.length) return [];
    const obj = objectifsDe(recette, biere, visee);
    const res = proposer(recette, Object.fromEntries(obj.map((o) => [o.f, o.requis / o.cran])));
    return voiesSummary(res).byFamily.filter((r) => dirs.includes(r.family));
  }, [recette, biere, visee]);
  // « + … » ouvre la famille suivante à viser (dans l'ordre du style, située, sans visée, hors des puces).
  const ouvrirAutre = () => {
    const candidates = sc.order.filter((f) => biere.profil[f].valeur && visee[f] == null && !(f in sens));
    const i = ouverte ? candidates.indexOf(ouverte) : -1;
    const f = candidates[(i + 1) % candidates.length] ?? null;
    setAutre(true);
    setVue('barres');
    setOuverte(f);
  };

  const auStyle = sc.order.filter((f) => biere.profil[f].valeur && !biere.profil[f].horsStyle).length;
  const nonSituees = sc.order.filter((f) => !biere.profil[f].valeur).length;
  const deguste = sc.order.some((f) => biere.profil[f].source === 'dégustation');
  const radar = vue === 'radar';
  // La famille goûtée au-dessus du style (le 18.10 : résineux marqué) ; l'alerte touchée l'ouvre sur le radar.
  const tropDeguste = ROUE.find((f) => auDessus(notes[f], haut[f])) ?? null;
  const [sommet, setSommet] = useState<FamilyId | null>(null);
  const voirAlerte = () => { setSommet(tropDeguste); setVue('radar'); };
  const changerVue = (v: 'barres' | 'radar') => { setSommet(null); setVue(v); };

  // Le contrat de controle-etats.mjs sur les commandes de l'app (SegmentedControl, croix des onglets) : data-etat posé
  // après le rendu, comme Lentille pose data-vue. « Radar » déclenche le radar, ou le radar en absolu si l'absolu est pris ;
  // il ouvre aussi la grille de dégustation m4 (acquis « Radar: m4 h4 très bien », joué depuis les barres, comme sa base).
  const reglages = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const r = reglages.current;
    r?.querySelector('[data-vue="radar"]')?.setAttribute('data-etat', echelle === 'absolu' ? 'etat-biere-radar-absolu' : 'etat-biere-radar etat-acquis-radars-m4-h4');
    r?.querySelector('[data-e="absolu"]')?.setAttribute('data-etat', 'etat-biere-absolu');
    const croix = [...document.querySelectorAll('[data-role="retour"]')].find((e) => e.getClientRects().length > 0);
    croix?.setAttribute('data-etat', 'etat-biere-retour');
  });

  return (
    <PageShell title="Ma bière" onClose={retour} className="pq-outil pq-outil-biere"
      mobileHeader={<div data-element="biere-onglets"><Onglets actif="biere" /></div>}>
      <div ref={reglages} data-ecran="biere" data-vue-biere={vue} className="pq-biere space-y-2 pb-4">
        <div className="hidden sm:block" data-element="biere-onglets"><Onglets actif="biere" /></div>
        <Bandeau biere={biere} element="biere-bandeau" />

        <div className="flex items-center gap-2" data-element="biere-reglages">
          {/* L'alerte touchée ouvre le radar de ma dégustation, la bulle sur la famille trop marquée (« Résineux : marqué,
              au-dessus du style ») ; au radar, le sommet porte l'état. D121 : l'alerte ne faisait rien. */}
          <span className="min-w-0 flex-1" data-element="biere-alerte">
            {tropDeguste && !radar ? (
              <span role="button" tabIndex={0} data-role="alerte-radar" data-etat="etat-biere-radar-sommet" className="block min-w-0 min-h-[2.75rem] content-center cursor-pointer"
                aria-label={`${COURT[tropDeguste]} trop marqué : voir ma dégustation sur le radar`}
                onClick={voirAlerte} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); voirAlerte(); } }}>
                <Alerte biere={biere} ordre={sc.order} long />
              </span>
            ) : <Alerte biere={biere} ordre={sc.order} long />}
          </span>
          <Lentille label="Vue" marques="vue" value={vue} onChange={changerVue} options={[{ value: 'barres', label: 'Barres' }, { value: 'radar', label: 'Radar' }]} />
        </div>
        {!radar && (
          <div className="flex items-center gap-2">
            <p data-element="biere-decompte" className="text-base text-cave-200">{auStyle} au style · {nonSituees} non située{nonSituees > 1 ? 's' : ''}</p>
            <span className="ml-auto" />
            <Lentille label="Échelle" marques="e" value={echelle} onChange={setEchelle} options={[{ value: 'style', label: 'Au style' }, { value: 'absolu', label: 'Absolu' }]} />
          </div>
        )}
        {!radar && (
          <div data-element="biere-legende" className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {deguste && <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-cave-700 text-sm text-cave-200"><i className="w-3.5 h-3.5 rounded-full bg-cave-50" />dégusté 18.10</span>}
              <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-cave-700 text-sm text-cave-200"><i className="w-3.5 h-3.5 rounded-full border-[3px] border-cave-50" />prévu</span>
              <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-cave-700 text-sm text-cave-200"><i className="w-3.5 h-3.5 rounded-full border border-dashed border-cave-400" />non situé</span>
              <span className="ml-auto"><Legende>
                <p><b>Zone grise</b> : la bande du style {sc.code} ; le pointillé, au-dessus du style. En absolu : faible, moyen, marqué.</p>
                <p><b>Prévu</b> : simulé par le moteur (~) avec la levure et les ajouts de la recette.</p>
                <p><b>Toucher une famille</b> : ma visée, le losange, d'un palier (faible, moyen, marqué) par « − » ou « + » ; bannir, à 0 ; « × » la retire. Une puce pose sa visée ; la ligne dessous ouvre Suggestions.</p>
              </Legende></span>
            </div>
            {echelle === 'style' ? (
              <div aria-hidden="true" className="grid grid-cols-[6.5rem_1fr_3rem] gap-2 text-sm text-cave-400">
                <span /><span className="grid grid-cols-[80%_20%]"><span className="text-center">zone du style</span><span className="text-center text-xs whitespace-nowrap">au-dessus</span></span><span />
              </div>
            ) : (
              // L'absolu de la base : les trois classes en tête, à la place de « zone du style · au-dessus ».
              <div aria-hidden="true" data-role="tete-absolu" className="grid grid-cols-[6.5rem_1fr_3rem] gap-2 text-sm text-cave-400">
                <span /><span className="relative h-5">
                  {CLASSES_ABSOLU.map(([mot, pts]) => (
                    <span key={mot} className="absolute top-0 -translate-x-1/2 whitespace-nowrap" style={{ left: `${((pts / 110) * 100).toFixed(1)}%` }}>{mot}</span>
                  ))}
                </span><span />
              </div>
            )}
          </div>
        )}

        {radar ? (
          <div data-element="biere-barres biere-hors-style" className="space-y-1">
            <div className="relative">
              <RadarBiere notes={notes} haut={haut} attendues={attendues} etatSommet="etat-biere-radar-sommet" ouvrirSur={sommet} />
              {/* Un « ? » par groupe (D113) ; la base n'écrit pas de légende sur le radar (« Pas besoin d'écrire la légende »). */}
              <span className="absolute left-0 top-0"><Legende>
                <p><b>Zone grise</b> : la bande du style {sc.code}.</p>
                <p><b>Bleu</b> : ma dégustation, de pas senti à marqué ; l'orangé, au-dessus du style.</p>
                <p><b>« ? » et hachuré</b> : pas goûté, inconnu (ce n'est pas zéro).</p>
                <p><b>Toucher un sommet</b> : la famille en mots. <b>Une pastille</b> : la note ; la retoucher, pas goûté.</p>
              </Legende></span>
            </div>
            <GrilleDegustation notes={notes} haut={haut} attendues={attendues} noter={(f, n) => setNotes((x) => ({ ...x, [f]: n }))} />
          </div>
        ) : (
          <ul data-element="biere-barres" data-etat="etat-biere-repos" aria-label={`Familles, ${echelle === 'style' ? `au style ${sc.code}` : 'absolu'}`} className="space-y-0.5">
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
              // Tropicaux, la famille que la base fait jouer : ses déclencheurs portent leur état.
              const tr = f === 'tropical';
              const etat = (id: string) => (tr ? { 'data-etat': id } : {});
              return (
                <li key={f} data-famille-ligne={f} {...(bannie ? { 'data-bannie': '' } : {})} className={`rounded-lg ${ouv ? 'pq-biere-ouverte' : ''}`}>
                  <button type="button" aria-expanded={ouv} aria-controls={`pq-biere-visee-${f}`} onClick={() => setOuverte(ouv ? null : f)}
                    aria-label={`${etiquette} ; ${ouv ? 'refermer' : 'ouvrir bannir, moins, plus'}`}
                    className="w-full grid grid-cols-[6.5rem_1fr_3rem] items-center gap-2 min-h-[2.5rem] px-1 text-left"
                    {...etat(ouv && posee ? 'etat-biere-visee-refermee' : 'etat-biere-famille-ouverte')}
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
                      {...etat('etat-biere-bannir')}
                      className={`h-10 px-4 rounded-full border text-base font-semibold ${bannie ? 'pq-biere-sens' : 'border-cave-700 text-cave-50'}`}>bannir</button>
                    <button type="button" data-visee="moins" aria-pressed={posee && !bannie && s === -1} aria-label={`Réduire ma visée de ${COURT[f]} d'un palier`} onClick={() => viser(f, 'moins')}
                      {...etat('etat-biere-visee-moins')}
                      className={`w-10 h-10 rounded-full border text-lg ${posee && !bannie && s === -1 ? 'pq-biere-sens' : 'border-cave-700 text-cave-50'}`}>−</button>
                    <span data-palier={posee ? nomPalier(vi) : ''} aria-live="polite"
                      className={`text-base min-w-[5.5rem] text-center ${posee ? 'font-semibold text-cave-50' : 'text-cave-400'}`}>{posee ? nomPalier(vi) : 'sans visée'}</span>
                    <button type="button" data-visee="plus" aria-pressed={posee && s === 1} aria-label={`Augmenter ma visée de ${COURT[f]} d'un palier`} onClick={() => viser(f, 'plus')}
                      {...etat('etat-biere-visee-plus')}
                      className={`w-10 h-10 rounded-full border text-lg ${posee && s === 1 ? 'pq-biere-sens' : 'border-cave-700 text-cave-50'}`}>+</button>
                    {posee && (
                      <button type="button" data-visee="retirer" aria-label={`Retirer ma visée de ${COURT[f]}`} onClick={() => viser(f, 'retirer')}
                        {...etat('etat-biere-visee-retirer')}
                        className="w-10 h-10 rounded-full border border-cave-700 text-lg text-cave-50">×</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div data-element="biere-objectifs" className="flex items-center gap-2 flex-wrap pt-1">
          {objectifs.map(([f, s]) => {
            const posee = visee[f] != null;
            const mot = `${s === 'banni' ? 'Bannir' : s > 0 ? 'Plus' : 'Moins'} ${COURT[f].toLowerCase()}`;
            return (
              // Pleine quand une visée est posée (la puce noire de la base), au trait pour la demande dégustée.
              <button key={f} type="button" data-role={`pont-objectif-${f}`} data-objectif={f} data-outil="Suggérer" aria-pressed={posee}
                aria-label={posee ? `${mot} : retirer ma visée` : mot} {...(f === 'floral' && s === 1 ? { 'data-etat': 'etat-biere-objectif-floral' } : {})}
                {...(posee ? { 'data-visee-posee': '' } : {})} onClick={() => basculer(f, s)}
                className={`h-11 px-4 rounded-full border text-base font-semibold ${posee ? 'pq-biere-puce-posee' : 'border-cave-700 text-cave-50'}`}>
                {motObjectif(s, f)}
              </button>
            );
          })}
          <button type="button" data-role="pont-objectif-autre" data-etat="etat-biere-objectif-autre" aria-label="Autres directions : glisser la visée sur une famille"
            aria-expanded={autre} onClick={ouvrirAutre}
            className="h-11 px-4 rounded-full border border-cave-700 text-base font-semibold text-cave-50">+ …</button>
        </div>
        {autre && !liens.length && (
          <p data-role="aide-autre" className="text-sm text-cave-400">Autres directions : touche une famille, puis − ou +.</p>
        )}
        {liens.length ? (
          <div data-role="liens-voies" className="flex flex-col items-start">
            {liens.map((l) => (
              <button key={l.family} type="button" data-role={l.family === 'floral' && l.label.startsWith('Plus') ? 'pont-floral' : `pont-voies-${l.family}`} data-outil="Suggérer"
                data-sensibles={l.sensible} data-faibles={l.weak} onClick={() => aller({ ecran: 'suggerer' })} className="pq-biere-lien">
                {l.text}<span aria-hidden="true" className="pq-biere-lien-chevron">›</span>
              </button>
            ))}
          </div>
        ) : !radar && (
          <p data-element="biere-levure" data-etat="etat-biere-pied" className="text-base text-cave-400">
            Prévu avec {nomLevureBase(recette.yeastId)}, caractérisée
          </p>
        )}
      </div>
    </PageShell>
  );
}
