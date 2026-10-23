// Suggérer — q2b tel que le brasseur l'a choisi (« C'est effectivement qb2 reprise le mieux », 19.10 ; redit le 23.10
// sur sa capture : « Ça oui, c'est effectivement l'un de mes choix »), reprise D105, calculé en direct.
// En tête : les onglets Ma bière · Suggestions · Comparer ; Au style / Absolu et Barres / Radar ; les cartes d'objectif
// de la dégustation, verdict en un mot (Aucune voie houblon · Hors houblon ›, Approche, Atteint) et leur piste l5b (D92).
// Puis les voies du moteur groupées par effet (« = même effet sur tes objectifs · 10 g · 10′ »), Assembler 5 + 5 g,
// Remplacer Nugget à 60′, Dry hop ; chaque voie en une ligne (usage en mot, nom, α, stock en icône, familles en traits
// par cran), son « + » ou son ✓ branché sur la liste de comparaison du socle ; en bas, « Comparer (n) ».
// La bande « ‹ visée | visée » de q2b est écartée : « Ça c'est inutile » (D91).
import { useEffect, useMemo, useRef, useState } from 'react';
import { CadreOutil, COULEURS, COURT, Feuille, Legende, LigneContexte, Onglets, Picto, Pont, ROUE, signe, type Echelle } from '../../commun';
import { useNavigation } from '../../coquille/navigation';
import { useOuvrir } from '../../coquille/ouvrir';
import type { Route } from '../../coquille/routes';
import { VISEE, nomLevure } from '../../donnees/cas';
import { useBiere, useComparaison, useGestes, useRecette } from '../../etat/EtatParcours';
import { style } from '../../moteur';
import { offModelLeads, type FamilyId } from '../../../../src/engine';
import Fiche, { useGestesFiche } from '../fiche';
import { AlphaCourt, Calme, CaseInconnue, Lecture, Piste, Stock, Traits, Usage, domaine, position, type Domaine } from './briques';
import { Radar } from './radar';
import { objectifsDe, verdict, voiesDe, type Groupe, type Ligne, type Objectif } from './voies';
import './suggerer.css';

/** Instantané du moteur (même état de départ) pour controle-autres-ajouts, lu depuis son dossier de cas (voir NOTE). */
const CAS_DIRECT = '../../../../../../prototypes/houblons-v4/parcours/src/ecrans/suggerer/cas-direct';
declare global { interface Window { __suggerer?: { groupes: Groupe[]; objectifs: Objectif[] } } }

export default function Suggerer() {
  const recette = useRecette();
  const biere = useBiere(recette);
  const sc = style(recette.styleCode);
  const ouvrir = useOuvrir();
  const { aller, route } = useNavigation();
  const aComparer = useComparaison();
  const { basculerComparaison, fixerComparaison } = useGestes();
  const [echelle, setEchelle] = useState<Echelle>('style');
  const [vue, setVue] = useState<'barres' | 'radar'>('barres');
  const [horsHoublon, setHorsHoublon] = useState(false);

  const objectifs = useMemo(() => objectifsDe(recette, biere, VISEE.famille), [recette, biere]);
  const groupes = useMemo(() => voiesDe(recette, objectifs, ROUE), [recette, objectifs]);
  const lignes = groupes.flatMap((g) => g.lignes);
  const ov = objectifs[0];
  // Cartes et pistes dans l'ordre de q2b : « Moins … » d'abord, puis la visée.
  const enTete = [...objectifs].sort((a, b) => a.sens - b.sens);
  const domaines = useMemo(() => Object.fromEntries(objectifs.map((o) => [o.f, domaine(o.f, sc, echelle,
    [o.avant ?? 0, o.visee ?? 0, ...lignes.map((l) => (o.avant ?? 0) + (l.effets[o.f] ?? 0))])])) as Record<FamilyId, Domaine>, [objectifs, lignes, sc, echelle]);

  // Proposés au départ, comme q2b (une voie cochée) : la meilleure voie du stock à 10′ et le meilleur dry hop.
  useEffect(() => {
    if (aComparer.length) return;
    const premier = (g?: Groupe) => g?.lignes.find((l) => l.stock !== 'à acheter' && (l.effets[ov.f] ?? 0) > 0)?.houblons.map((h) => h.cle) ?? [];
    const choix = [...new Set([...premier(groupes.find((g) => g.geste === 'meme')), ...premier(groupes.find((g) => g.geste === 'dryhop'))])];
    if (choix.length) fixerComparaison(choix);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const choisie = (l: Ligne) => l.houblons.every((h) => aComparer.includes(h.cle));
  const basculer = (l: Ligne) => {
    const tous = choisie(l);
    for (const h of l.houblons) if (tous || !aComparer.includes(h.cle)) basculerComparaison(h.cle);
  };

  // Fiche à l'appui long : une entrée d'historique (le retour du téléphone la ferme), Suggérer reste ouvert dessous.
  const [fiche, setFiche] = useState<string | null>(null);
  const routeFiche = useRef<Route | null>(null);
  const ouvrirFiche = (cle: string) => {
    if (!fiche) { const r: Route = { ecran: 'suggerer' }; routeFiche.current = r; aller(r); }
    setFiche(cle);
  };
  useEffect(() => { if (fiche && route !== routeFiche.current) setFiche(null); }, [route, fiche]);
  const gestesFiche = useGestesFiche(ouvrirFiche);

  // Cas lu par controle-autres-ajouts (D76), et vue des voies pour outils/instantane.mjs (maquette seulement).
  useEffect(() => { document.body.dataset.cas = CAS_DIRECT; return () => { delete document.body.dataset.cas; }; }, []);
  useEffect(() => { window.__suggerer = { groupes, objectifs }; }, [groupes, objectifs]);

  const leads = offModelLeads(Object.fromEntries(objectifs.map((o) => [o.f, o.sens])));
  const series = lignes.filter((l) => choisie(l)).filter((l, i, t) => t.findIndex((x) => x.houblons.map((h) => h.cle).join() === l.houblons.map((h) => h.cle).join()) === i)
    .map((l) => ({ cle: l.id, nom: l.houblons.map((h) => h.nom).join(' + '), effets: l.effets }));

  return (
    <CadreOutil ecran="suggerer" question="Quel houblon ajouter à ma bière ?"
      contexte={<nav aria-label="Parties" data-element="q2b-onglets" className="pq-suggerer-onglets"><Onglets actif="suggerer" /></nav>}
      dock={<span data-element="q2b-comparer-n" className="inline-flex">
        <Pont nom="comparer" disabled={aComparer.length < 1} onClick={() => ouvrir({ ecran: 'comparer', houblons: aComparer })}>{`Comparer (${aComparer.length})`}</Pont>
      </span>}>
      <div data-element="q2b-reglages" className="flex items-center gap-1.5">
        <Legende>
          <p><b>Carte</b> : le verdict de la meilleure voie sur un objectif ; Atteint, le cran entier ; Approche, la moitié au moins.</p>
          <p><b>Piste</b> : zone pâle, le style 16D ; rond, ma bière ; barre, la meilleure voie ; pointillé, la visée ; orangé, hors du style.</p>
          <p><b>Traits</b> sous un picto : un trait par cran du style, un demi-trait pour moins ; contour, la famille baisse ; orangés, hors du style.</p>
          <p><b>Usage</b> : amer, arôme ou mixte (fournisseur) ; souligné en pointillé, déduit de l’α. <b>≠</b> : α du lot hors des fiches.</p>
          <p>Stock : coche, assez ; moins, pas assez ; chariot, à acheter. ~ simulé ; hachuré, inconnu. Appui long : la fiche.</p>
        </Legende>
        <Lecture<Echelle> label="Échelle" valeur={echelle} onChange={setEchelle} e={['style', 'absolu']}
          options={[{ value: 'style', label: 'Au style' }, { value: 'absolu', label: 'Absolu' }]} />
        <span className="flex-1" aria-hidden="true" />
        <Lecture<'barres' | 'radar'> label="Vue" valeur={vue} onChange={setVue} e={['barres', 'radar']}
          options={[{ value: 'barres', label: 'Barres' }, { value: 'radar', label: 'Radar' }]} />
      </div>
      <LigneContexte items={[
        { cle: 'base', contenu: `Stout ${sc.code}` },
        { cle: 'levure', contenu: nomLevure(recette.yeastId) },
      ]} />

      <section aria-label="Objectifs" data-element="q2b-cartes-objectifs q2b-piste-objectif" className="grid grid-cols-2 gap-x-2 gap-y-1.5">
        {enTete.map((o, i) => {
          const v = verdict(o, groupes);
          const d = domaines[o.f];
          const marques = vue === 'barres' ? series.map((s) => ({ cle: s.cle, x: (o.avant ?? 0) + (s.effets[o.f] ?? 0) })) : [];
          return (
            <div key={o.f} data-role="objectif" data-objectif={o.f} className="contents">
              <div className="pq-suggerer-carte rounded-lg px-2.5 py-2 flex flex-col gap-1 min-w-0" style={{ gridRow: 1, gridColumn: i + 1, background: COULEURS[o.f].fond }}
                aria-label={`${o.sens > 0 ? 'Plus' : 'Moins'} ${COURT[o.f].toLowerCase()} : ${v.mot}${v.meilleure ? `, ${v.meilleure.houblons.map((h) => h.nom).join(' + ')}` : ''}`}>
                <span className="flex items-center gap-1 text-sm font-bold leading-tight" style={{ color: COULEURS[o.f].texte }}>
                  <span className="relative inline-flex"><Picto famille={o.f} taille={16} nomme={false} />{biere.profil[o.f].horsStyle && <i className="pq-suggerer-alerte" aria-hidden="true" />}</span>
                  {o.sens > 0 ? 'Plus' : 'Moins'} {COURT[o.f].toLowerCase()}
                </span>
                <span data-role="reponse" data-verdict={v.mot} className={`pq-suggerer-verdict pq-suggerer-verdict-${v.mot.toLowerCase()} leading-none`}>
                  {v.mot}{v.mot === 'Aucune' && <small className="block text-xs font-bold mt-0.5">voie houblon</small>}
                </span>
                {v.mot === 'Aucune' && o.sens < 0 && leads.length > 0
                  ? <button type="button" data-element="q2b-hors-houblon" data-role="hors-houblon" aria-haspopup="dialog" onClick={() => setHorsHoublon(true)}
                      aria-label="Lecture des pistes hors houblon pour le résineux" className="pq-suggerer-hh self-start mt-auto h-7 px-2 rounded-full text-xs font-bold whitespace-nowrap">Hors houblon</button>
                  : v.meilleure && <span className="text-xs text-cave-200 truncate">{v.meilleure.houblons.map((h) => h.nom).join(' + ')}</span>}
              </div>
              {vue === 'barres' && (
                <span className="relative flex items-center gap-1.5 pt-1.5" style={{ gridRow: i + 2, gridColumn: '1 / -1' }}>
                  <Picto famille={o.f} taille={14} nomme={false} />
                  <span className="relative flex-1">
                                        <Piste f={o.f} d={d} barre={v.effet == null || o.avant == null ? null : o.avant + v.effet} avant={o.avant} visee={o.visee} marques={marques} epaisse />
                  </span>
                </span>
              )}
            </div>
          );
        })}
      </section>
      {vue === 'radar' && <Radar biere={biere} sc={sc} echelle={echelle} series={series} />}

      <div data-libre="houblon" aria-label="Voies du moteur" className="space-y-1">
        {groupes.map((g) => (
          <BlocGroupe key={g.id} g={g} objectifs={objectifs} domaines={domaines} echelle={echelle} cran={(f) => sc.families[f].cran}
            choisie={choisie} basculer={basculer} gestesFiche={gestesFiche} barres={vue === 'barres'} />
        ))}
      </div>
      <p className="text-xs text-cave-400 px-2">{nomLevure(recette.yeastId)} · les voies viennent du moteur ; « ~ » simulé.</p>
      {fiche && <Fiche houblon={fiche} />}
      {horsHoublon && <Feuille ouverte titre="Hors houblon · résineux" sousTitre="pistes hors modèle, sans chiffres" onFermer={() => setHorsHoublon(false)}>
        <ul data-role="pistes-hors-houblon" className="space-y-2 text-sm">
          {leads.flatMap((x) => x.leads).map((l) => (
            <li key={l.id}><b className="text-cave-50">{l.title}</b> : {l.action.charAt(0).toLowerCase() + l.action.slice(1)} <span className="text-xs text-cave-400">{l.evidence}</span></li>
          ))}
        </ul>
      </Feuille>}
    </CadreOutil>
  );
}

function BlocGroupe({ g, objectifs, domaines, echelle, cran, choisie, basculer, gestesFiche, barres }: {
  g: Groupe; objectifs: Objectif[]; domaines: Record<FamilyId, Domaine>; echelle: Echelle; cran: (f: FamilyId) => number;
  choisie: (l: Ligne) => boolean; basculer: (l: Ligne) => void; gestesFiche: ReturnType<typeof useGestesFiche>; barres: boolean;
}) {
  const cibles = [...objectifs].sort((a, b) => a.sens - b.sens).map((o) => o.f);
  // Cases alignées du groupe (q2b) : les familles hors objectifs qu'au moins une voie fait bouger.
  const slots = ROUE.filter((f) => !cibles.includes(f) && g.lignes.some((l) => l.effets[f] != null && Math.abs(l.effets[f]!) >= 0.5));
  const meme = g.id.startsWith('meme');
  const ov = objectifs[0];
  const element = meme && g.id === 'meme-0' ? 'q2b-groupes-effet' : g.geste === 'assembler' ? 'q2b-assembler' : g.geste === 'remplacer' ? 'q2b-remplacer' : undefined;
  const ecrireGain = (e: number, f: FamilyId) => (echelle === 'style' ? `~${signe(e / cran(f), 1)}` : `~${signe(e, 0)}`);
  return (
    <section data-groupe={g.id} {...(element ? { 'data-element': element } : {})} className="pt-1">
      <h3 className="flex items-center gap-1.5 px-2 text-sm font-bold text-cave-50 leading-tight">
        {meme && g.titre !== 'Ajouter' && <span aria-hidden="true" className="pq-suggerer-egal">=</span>}
        <span>{g.titre}</span>
        {g.dose && <span className="font-normal text-cave-200">{g.dose}</span>}
        <span className="pq-suggerer-moment">{g.moment}</span>
        {g.estime && <span className="text-xs font-normal text-cave-400">estimé</span>}
      </h3>
      {meme && g.lignes.length > 1 && barres && (
        // L'effet du groupe sur les objectifs, dessiné une fois (q2b : « +1 cran »).
        <div className="px-2 pt-1 space-y-0.5">
          {objectifs.filter((o) => g.lignes[0].effets[o.f] != null).map((o) => (
            <div key={o.f} className="grid grid-cols-[1fr_2.75rem] items-center gap-x-1.5">
              <Piste f={o.f} d={domaines[o.f]} barre={(o.avant ?? 0) + g.lignes[0].effets[o.f]!} avant={o.avant} visee={o.visee} />
              <span className="font-mono text-xs font-semibold text-right" style={{ color: COULEURS[o.f].texte }}>{ecrireGain(g.lignes[0].effets[o.f]!, o.f)}</span>
            </div>
          ))}
        </div>
      )}
      <ul className="divide-y divide-cave-800">
        {g.lignes.map((l, i) => (
          <LigneVoie key={l.id} l={l} premiere={i === 0} cibles={cibles} slots={slots} cran={cran} choisie={choisie(l)} basculer={() => basculer(l)}
            gestesFiche={gestesFiche} piste={!meme && barres ? { f: ov.f, d: domaines[ov.f], avant: ov.avant, visee: ov.visee } : null} gain={!meme ? ecrireGain : null} />
        ))}
      </ul>
    </section>
  );
}

function LigneVoie({ l, premiere, cibles, slots, cran, choisie, basculer, gestesFiche, piste, gain }: {
  l: Ligne; premiere: boolean; cibles: FamilyId[]; slots: FamilyId[]; cran: (f: FamilyId) => number; choisie: boolean; basculer: () => void;
  gestesFiche: ReturnType<typeof useGestesFiche>; piste: { f: FamilyId; d: Domaine; avant: number | null; visee: number | null } | null;
  gain: ((e: number, f: FamilyId) => string) | null;
}) {
  const noms = l.houblons.map((h) => h.nom).join(' et ');
  const caseDe = (f: FamilyId, role: 'extra' | 'cible') => {
    const e = l.effets[f];
    if (e == null) return role === 'cible' ? <CaseInconnue key={f} f={f} /> : <Calme key={f} />;
    if (Math.abs(e) < 0.5) return <Calme key={f} />;
    return <Traits key={f} f={f} crans={e / cran(f)} hors={l.hors.includes(f)} role={role} />;
  };
  const ef = piste ? l.effets[piste.f] : null;
  return (
    <li data-voie={l.n} data-id={l.id} data-role="ligne-houblon" {...(premiere ? { 'data-element': 'q2b-ligne-voie' } : {})} {...(choisie ? { 'data-choisi': '' } : {})}
      {...gestesFiche.appui(l.houblons[0].cle)}
      className={`pq-suggerer-voie grid grid-cols-[1fr_2.75rem] items-center gap-x-1.5 px-2 py-2 select-none ${choisie ? 'pq-suggerer-voie-choisie' : ''}`}>
      <div className="min-w-0 space-y-1.5">
        <p className={`flex items-center gap-x-1.5 gap-y-0.5 min-w-0 leading-tight ${l.houblons.length > 1 ? 'flex-wrap' : ''}`}>
          {l.houblons.map((h, j) => (
            <span key={h.cle} className="inline-flex items-baseline gap-1 min-w-0">
              {j > 0 && <span className="text-cave-400">+</span>}
              <Usage h={h} />
              <span data-houblon={h.cle} data-role="ouvrir-fiche" {...gestesFiche.nom(h.cle)} className={`${l.houblons.length > 1 ? 'whitespace-nowrap' : 'truncate'} text-[0.9375rem] text-cave-50 ${choisie ? 'font-bold' : 'font-semibold'}`}>{h.nom}</span>
              <AlphaCourt h={h} />
            </span>
          ))}
          {l.dose && <span className={`shrink-0 font-mono text-xs text-cave-200 whitespace-nowrap ${l.dose.includes('+') ? 'pq-suggerer-estime' : ''}`}>{l.dose.split(' ').join(' ')}</span>}
          <Stock etat={l.stock} />
          {gain && ef != null && piste && <span data-simule="" className="ml-auto shrink-0 font-mono text-sm font-semibold" style={{ color: COULEURS[piste.f].texte }}>{gain(ef, piste.f)}</span>}
        </p>
        {piste && (
          <span className="block" {...(ef != null ? { 'data-role': 'cible', 'data-famille': piste.f, 'data-crans': (ef / cran(piste.f)).toFixed(2) } : {})}>
            <Piste f={piste.f} d={piste.d} barre={ef == null ? null : (piste.avant ?? 0) + ef} avant={piste.avant} visee={piste.visee} inconnu={ef == null ? 'effet inconnu sur la visée' : null} />
          </span>
        )}
        <span className="flex items-center gap-0.5" aria-label="Effet sur les familles">
          {cibles.map((f) => (piste && f === piste.f ? null : caseDe(f, 'cible')))}
          <i aria-hidden="true" className="pq-suggerer-separe mx-1 self-stretch" />
          {slots.map((f) => caseDe(f, 'extra'))}
        </span>
      </div>
      <button type="button" data-role="ajouter" data-element="q2b-plus-coche" aria-pressed={choisie}
        aria-label={choisie ? `Retirer ${noms} de la comparaison` : `Ajouter ${noms} à la comparaison`}
        onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); basculer(); }}
        className="touch-target justify-self-end w-11 h-11 rounded-full">
        <span className={`flex items-center justify-center w-9 h-9 rounded-full border-2 ${choisie ? 'pq-suggerer-choisi' : 'border-cave-50 text-cave-50'}`}>
          <i aria-hidden="true" className={choisie ? 'pq-suggerer-coche' : 'pq-suggerer-plus'} />
        </span>
      </button>
    </li>
  );
}

