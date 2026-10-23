// Suggérer — l'onglet Suggestions de la base v4.10, q2b tel qu'il l'a choisi (« C'est effectivement qb2 reprise le
// mieux », 19.10 ; « Ça oui, c'est effectivement l'un de mes choix », 23.10), repris élément par élément sur
// consolide-b-390.png (D117 : « J'ai l'impression que cette vue suggestions et pas la bonne que j'ai vraiment choisir ?? »).
// En tête, la tête des trois onglets (croix, Ma bière · Suggestions · Comparer ; D109, D118, D119, CadreOutil) ; le
// bandeau IBU · OG · EBC ; Au style / Absolu et Barres / Radar ; les cartes d'objectif (verdict en un mot, « Aucune voie
// houblon · Hors houblon › ») et leur piste l5b (D92). Puis les voies du moteur groupées par effet : « = même effet sur
// tes objectifs · 10 g · 10′ » dans leur cadre à bord noir, Assembler, Remplacer Nugget, Dry hop ; chaque voie en deux
// lignes (usage en mot D90, nom, α, stock en icône, ♡, « + » ou ✓ ; les objectifs cerclés puis les extras, en traits par
// cran, lisibles au toucher D110). En bas, « Hors houblon » et la barre noire « Comparer (n) ».
// Écarts qui ont ses mots : l'usage en mot (D90), la bande « ‹ visée | visée › » retirée (D91), les pistes l5b (D92).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { CadreOutil, COULEURS, COURT, Legende, Picto, ROUE, signe, type Echelle } from '../../commun';
import { useNavigation } from '../../coquille/navigation';
import { useOuvrir } from '../../coquille/ouvrir';
import type { Route } from '../../coquille/routes';
import { nomLevure } from '../../donnees/cas';
import { useBiere, useComparaison, useGestes, useRecette, useVisee } from '../../etat/EtatParcours';
import { style } from '../../moteur';
import { offModelLeads, type FamilyId } from '../../../../src/engine';
import Fiche, { useGestesFiche } from '../fiche';
import { Bandeau } from '../ma-biere/Base';
import { AlphaCourt, Calme, CaseInconnue, Lecture, Piste, Stock, Traits, Usage, domaine, type Domaine, type NiveauFiches } from './briques';
import { BulleTraitsProvider } from './bulle';
import { Radar } from './radar';
import { bannisDe, objectifsDe, verdict, voiesDe, type Groupe, type Ligne, type Objectif } from './voies';
import './suggerer.css';

/** Instantané du moteur (même état de départ) pour controle-autres-ajouts, lu depuis son dossier de cas (voir NOTE). */
const CAS_DIRECT = '../../../../../../prototypes/houblons-v4/parcours/src/ecrans/suggerer/cas-direct';

/** Mes goûts, en mémoire (maquette), comme la fiche : ♡ d'une voie. Au portage : la même table que la fiche (D20). */
const AIMES = new Set<string>();

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
  const refHorsHoublon = useRef<HTMLDetailsElement>(null);

  // La visée commune (état du parcours) : réglée dans l'onglet Ma bière ; sans visée, la demande dégustée (+ floral, − résineux).
  const visee = useVisee();
  const objectifs = useMemo(() => objectifsDe(recette, biere, visee), [recette, biere, visee]);
  const bannis = useMemo(() => bannisDe(visee), [visee]);
  const groupes = useMemo(() => voiesDe(recette, objectifs, ROUE, bannis), [recette, objectifs, bannis]);
  const lignes = groupes.flatMap((g) => g.lignes);
  const ov = objectifs.find((o) => o.sens > 0) ?? objectifs[0];
  // Cartes et pistes dans l'ordre de la base v4.10 : la visée « plus » d'abord (objectifsDe), deux par rang au téléphone.
  const colonnes = Math.max(1, Math.min(2, objectifs.length));
  const rangsCartes = Math.ceil(objectifs.length / colonnes);
  const place = (k: number) => ({ gridRow: Math.floor(k / colonnes) + 1, gridColumn: (k % colonnes) + 1 });
  // Teinte de la carte, celle de q2b et de sa base (q-tuile : dégradé du blanc vers --fd, #e6d2f2 floral, #cfe5de
  // résineux) : le fond pâle de la famille, relevé de 18 % de sa couleur (D74, « trop limité au niveau des couleurs »).
  const teinte = (f: FamilyId) => `linear-gradient(160deg, rgb(var(--cave-950)), color-mix(in srgb, ${COULEURS[f].base} 18%, ${COULEURS[f].fond}))`;
  const domaines = useMemo(() => Object.fromEntries(objectifs.map((o) => [o.f, domaine(o.f, sc, echelle,
    [o.avant ?? 0, o.visee ?? 0, ...lignes.map((l) => (o.avant ?? 0) + (l.effets[o.f] ?? 0))])])) as Record<FamilyId, Domaine>, [objectifs, lignes, sc, echelle]);

  // Proposés au départ, comme la base (des voies cochées) : la meilleure voie du stock à 10′ et le meilleur dry hop.
  useEffect(() => {
    if (aComparer.length) return;
    const premier = (g?: Groupe) => g?.lignes.find((l) => l.stock !== 'à acheter' && ov && (l.effets[ov.f] ?? 0) > 0)?.houblons.map((h) => h.cle) ?? [];
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

  // Cas lu par controle-autres-ajouts (D76).
  useEffect(() => { document.body.dataset.cas = CAS_DIRECT; return () => { delete document.body.dataset.cas; }; }, []);

  const leads = offModelLeads(Object.fromEntries(objectifs.map((o) => [o.f, o.sens])));
  const pistesHors = leads.flatMap((x) => x.leads);
  const famHors = leads[0]?.family as FamilyId | undefined;
  const series = lignes.filter((l) => choisie(l)).filter((l, i, t) => t.findIndex((x) => x.houblons.map((h) => h.cle).join() === l.houblons.map((h) => h.cle).join()) === i)
    .map((l) => ({ cle: l.id, nom: l.houblons.map((h) => h.nom).join(' + '), effets: l.effets }));
  const montrerHorsHoublon = () => {
    setHorsHoublon(true);
    requestAnimationFrame(() => refHorsHoublon.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  };

  return (
    <CadreOutil ecran="suggerer" question="Quel houblon ajouter à ma bière ?" questionVisible={false} elementTete="q2b-onglets">
      <BulleTraitsProvider>
        <div className="pq-suggerer-haut">
          <Bandeau biere={biere} element="q2b-bandeau-ibu" />
        </div>
        <div data-element="q2b-reglages" className="flex items-center gap-1.5">
          <Lecture<Echelle> label="Échelle" valeur={echelle} onChange={setEchelle} e={['style', 'absolu']}
            options={[{ value: 'style', label: 'Au style' }, { value: 'absolu', label: 'Absolu' }]} />
          {/* D89 : « il faut un bouton légende un peu caché pour pas que ça gêne ». Les traits se lisent aussi au toucher (D110). */}
          <Legende>
            <p><b>Carte</b> : le verdict de la meilleure voie ; Atteint, le cran entier ; Approche, la moitié au moins.</p>
            <p><b>Piste</b> : zone pâle, le style {sc.code} ; rond, ma bière ; barre, la meilleure voie ; pointillé, la visée ; orangé, hors du style.</p>
            <p><b>Sous un picto</b> : un trait par cran du style ; toucher le picto dit sa famille et sa valeur. Cerclés : tes objectifs.</p>
            <p><b>Usage</b> : amer, arôme ou mixte ; souligné en pointillé, déduit de l’α. Appui long sur une voie : sa fiche.</p>
          </Legende>
          <span className="flex-1" aria-hidden="true" />
          <Lecture<'barres' | 'radar'> label="Vue" valeur={vue} onChange={setVue} e={['barres', 'radar']}
            options={[{ value: 'barres', label: 'Barres' }, { value: 'radar', label: 'Radar' }]} />
        </div>

        <section aria-label="Objectifs" data-element="q2b-cartes-objectifs q2b-piste-objectif" className="grid gap-x-2 gap-y-1.5"
          style={{ gridTemplateColumns: `repeat(${colonnes}, minmax(0, 1fr))` }}>
          {objectifs.map((o, i) => {
            const v = verdict(o, groupes);
            const d = domaines[o.f];
            const marques = vue === 'barres' ? series.map((s) => ({ cle: s.cle, x: (o.avant ?? 0) + (s.effets[o.f] ?? 0) })) : [];
            const mot = o.bannie ? 'Sans' : o.sens > 0 ? 'Plus' : 'Moins';
            return (
              <div key={o.f} data-role="objectif" data-objectif={o.f} {...(o.bannie ? { 'data-banni': o.f } : {})} className="contents">
                <div className="pq-suggerer-carte rounded-lg px-3 py-2 flex flex-col gap-1 min-w-0" style={{ ...place(i), background: teinte(o.f) }}
                  aria-label={`${mot} ${COURT[o.f].toLowerCase()} : ${v.mot}${v.meilleure ? `, ${v.meilleure.houblons.map((h) => h.nom).join(' + ')}` : ''}`}>
                  <span className="flex items-center gap-1 text-[0.9375rem] font-bold leading-tight" style={{ color: COULEURS[o.f].texte }}>
                    <span className="relative inline-flex"><Picto famille={o.f} taille={17} nomme={false} />{biere.profil[o.f].horsStyle && <i className="pq-suggerer-alerte" aria-hidden="true" />}</span>
                    {mot} {COURT[o.f].toLowerCase()}
                  </span>
                  <span data-role="reponse" data-verdict={v.mot} className={`pq-suggerer-verdict pq-suggerer-verdict-${v.mot.toLowerCase()} leading-none`}>
                    {v.mot}{v.mot === 'Aucune' && <small className="pq-suggerer-verdict-suite"> voie houblon</small>}
                  </span>
                  {v.mot === 'Aucune' && o.f === famHors && pistesHors.length > 0
                    ? <button type="button" data-element="q2b-hors-houblon" data-role="hors-houblon" aria-label={`Lecture des pistes hors houblon pour le ${COURT[o.f].toLowerCase()}`} aria-expanded={horsHoublon} aria-controls="pq-suggerer-hors-houblon" onClick={montrerHorsHoublon}
                        className="pq-suggerer-hh self-start h-8 px-3 rounded-full text-sm font-bold whitespace-nowrap" style={{ color: COULEURS[o.f].texte, borderColor: COULEURS[o.f].texte }}>Hors houblon</button>
                    : null}
                </div>
                {vue === 'barres' && (
                  <span className="relative flex items-center gap-1.5 pt-0.5" style={{ gridRow: rangsCartes + i + 1, gridColumn: '1 / -1' }}>
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

        <div data-libre="houblon" aria-label="Voies du moteur" className="space-y-1"
          data-direction={JSON.stringify(Object.fromEntries(objectifs.map((o) => [o.f, o.requis / o.cran])))}>
          {groupes.map((g) => (
            <BlocGroupe key={g.id} g={g} objectifs={objectifs} domaines={domaines} echelle={echelle} cran={(f) => sc.families[f].cran}
              choisie={choisie} basculer={basculer} gestesFiche={gestesFiche} barres={vue === 'barres'} />
          ))}
        </div>

        {pistesHors.length > 0 && famHors && (
          <details ref={refHorsHoublon} id="pq-suggerer-hors-houblon" open={horsHoublon} onToggle={(e) => setHorsHoublon((e.target as HTMLDetailsElement).open)}
            data-lecture="" className="pq-suggerer-repli rounded-lg">
            <summary className="flex items-center gap-2 px-3 min-h-[44px] text-[0.9375rem] font-semibold text-cave-50 cursor-pointer">
              Hors houblon · {COURT[famHors].toLowerCase()} ({pistesHors.length} pistes)
            </summary>
            <ul data-role="pistes-hors-houblon" className="space-y-2 px-3 pb-3 text-sm text-cave-200">
              {pistesHors.map((l) => (
                <li key={l.id}><b className="text-cave-50">{l.title}</b> : {l.action.charAt(0).toLowerCase() + l.action.slice(1)} <span className="text-xs text-cave-400">{l.evidence}</span></li>
              ))}
            </ul>
          </details>
        )}
        <p className="text-xs text-cave-400 px-1">{nomLevure(recette.yeastId)} · les voies viennent du moteur ; « ~ » simulé.</p>

        <div className="pq-suggerer-barre-bas" data-element="q2b-comparer-n">
          <button type="button" data-role="pont-comparer" disabled={aComparer.length < 1} onClick={() => ouvrir({ ecran: 'comparer', houblons: aComparer })}
            className="pq-suggerer-comparer w-full rounded-full text-base font-bold disabled:opacity-40">
            Comparer <span className="pq-suggerer-comparer-n">({aComparer.length})</span>
          </button>
        </div>
        {fiche && <Fiche houblon={fiche} />}
      </BulleTraitsProvider>
    </CadreOutil>
  );
}

function BlocGroupe({ g, objectifs, domaines, echelle, cran, choisie, basculer, gestesFiche, barres }: {
  g: Groupe; objectifs: Objectif[]; domaines: Record<FamilyId, Domaine>; echelle: Echelle; cran: (f: FamilyId) => number;
  choisie: (l: Ligne) => boolean; basculer: (l: Ligne) => void; gestesFiche: ReturnType<typeof useGestesFiche>; barres: boolean;
}) {
  const cibles = objectifs.map((o) => o.f);
  // Cases alignées du groupe (q2b) : les familles hors objectifs qu'au moins une voie fait bouger.
  const slots = ROUE.filter((f) => !cibles.includes(f) && g.lignes.some((l) => l.effets[f] != null && Math.abs(l.effets[f]!) >= 0.5));
  const meme = g.id.startsWith('meme');
  // Le cadre à bord noir de la base : les voies au même effet (plusieurs lignes, une seule barre d'effet).
  const cadre = meme && g.lignes.length > 1;
  const ov = objectifs.find((o) => o.sens > 0) ?? objectifs[0];
  const element = meme && g.id === 'meme-0' ? 'q2b-groupes-effet' : g.geste === 'assembler' ? 'q2b-assembler' : g.geste === 'remplacer' ? 'q2b-remplacer' : undefined;
  const ecrireGain = (e: number, f: FamilyId) => (echelle === 'style' ? `~${signe(e / cran(f), 1)}` : `~${signe(e, 0)}`);
  return (
    <section data-groupe={g.id} {...(element ? { 'data-element': element } : {})} className="pt-2">
      <h3 className="flex items-center gap-2 px-1 text-[0.9375rem] font-bold text-cave-50 leading-tight">
        {meme && g.titre !== 'Ajouter' && <span aria-hidden="true" className="pq-suggerer-egal" />}
        <span>{g.titre}</span>
        {g.dose && <span className="font-normal text-cave-200">{g.dose}</span>}
        <span className="pq-suggerer-moment">{g.moment}</span>
        {g.estime && <span className="text-sm font-normal text-cave-400">estimé</span>}
      </h3>
      {cadre && barres && (
        // L'effet du groupe sur les objectifs, dessiné une fois (q2b : « +1 cran »).
        <div className="px-1 pt-1.5 pb-1 space-y-0.5">
          {objectifs.filter((o) => g.lignes[0].effets[o.f] != null).map((o) => (
            <div key={o.f} className="grid grid-cols-[1fr_2.75rem] items-center gap-x-1.5">
              <Piste f={o.f} d={domaines[o.f]} barre={(o.avant ?? 0) + g.lignes[0].effets[o.f]!} avant={o.avant} visee={o.visee} />
              <span className="font-mono text-xs font-semibold text-right" style={{ color: COULEURS[o.f].texte }}>{ecrireGain(g.lignes[0].effets[o.f]!, o.f)}</span>
            </div>
          ))}
        </div>
      )}
      <ul className={cadre ? 'pq-suggerer-cadre' : 'pq-suggerer-liste'} {...(cadre ? { 'data-role': 'cadre-voies' } : {})} {...(cadre && g.id === 'meme-0' ? { 'data-element': 'q2b-cadre-liste' } : {})}>
        {g.lignes.map((l, i) => (
          <LigneVoie key={l.id} l={l} premiere={i === 0} cibles={cibles} slots={slots} cran={cran} choisie={choisie(l)} basculer={() => basculer(l)}
            gestesFiche={gestesFiche} piste={!cadre && barres && ov ? { f: ov.f, d: domaines[ov.f], avant: ov.avant, visee: ov.visee } : null} gain={!cadre ? ecrireGain : null} />
        ))}
      </ul>
    </section>
  );
}

const RANG: Record<NiveauFiches, number> = { 'non décrit': 0, cité: 1, marqué: 2 };

function LigneVoie({ l, premiere, cibles, slots, cran, choisie, basculer, gestesFiche, piste, gain }: {
  l: Ligne; premiere: boolean; cibles: FamilyId[]; slots: FamilyId[]; cran: (f: FamilyId) => number; choisie: boolean; basculer: () => void;
  gestesFiche: ReturnType<typeof useGestesFiche>; piste: { f: FamilyId; d: Domaine; avant: number | null; visee: number | null } | null;
  gain: ((e: number, f: FamilyId) => string) | null;
}) {
  const noms = l.houblons.map((h) => h.nom).join(' et ');
  const cleAime = l.houblons.map((h) => h.cle).join('+');
  const [aime, setAime] = useState(() => AIMES.has(cleAime));
  // Le niveau des fiches d'une famille sur la voie : le plus haut de ses houblons (picto plein si une fiche la marque).
  const niveau = (f: FamilyId): NiveauFiches => l.houblons.map((h) => h.familles[f].niveau).sort((a, b) => RANG[b] - RANG[a])[0] ?? 'non décrit';
  const caseDe = (f: FamilyId, role: 'extra' | 'cible') => {
    const e = l.effets[f];
    const cle = `${l.id}:${f}`;
    if (e == null) return role === 'cible' ? <CaseInconnue key={f} f={f} cle={cle} /> : <Calme key={f} f={f} cle={cle} />;
    if (Math.abs(e) < 0.5) return <Calme key={f} f={f} cle={cle} cible={role === 'cible'} />;
    return <Traits key={f} f={f} crans={e / cran(f)} hors={l.hors.includes(f)} role={role} niveau={niveau(f)} cle={cle} />;
  };
  const ef = piste ? l.effets[piste.f] : null;
  return (
    <li data-voie={l.n} data-id={l.id} data-role="ligne-houblon" {...(premiere ? { 'data-element': 'q2b-ligne-voie' } : {})} {...(choisie ? { 'data-choisi': '' } : {})}
      {...gestesFiche.appui(l.houblons[0].cle)}
      className={`pq-suggerer-voie grid grid-cols-[1fr_auto] gap-x-1 pl-2 pr-1 py-1 select-none ${choisie ? 'pq-suggerer-voie-choisie' : ''}`}>
      <div className="min-w-0 space-y-0.5">
        <p className={`flex items-center gap-x-1.5 gap-y-0.5 min-w-0 min-h-[1.625rem] leading-tight ${l.houblons.length > 1 ? 'flex-wrap' : ''}`}>
          {l.houblons.map((h, j) => (
            <span key={h.cle} className="inline-flex items-baseline gap-1 min-w-0">
              {j > 0 && <span className="text-cave-400">+</span>}
              <Usage h={h} />
              <span data-houblon={h.cle} data-role="ouvrir-fiche" {...gestesFiche.nom(h.cle)} className={`pq-suggerer-nom ${l.houblons.length > 1 ? 'whitespace-nowrap' : 'truncate'} text-base text-cave-50 font-semibold`}>{h.nom}</span>
              <AlphaCourt h={h} />
            </span>
          ))}
          {l.dose && <span className={`shrink-0 font-mono text-xs text-cave-200 whitespace-nowrap ${l.dose.includes('+') ? 'pq-suggerer-estime' : ''}`}>{l.dose}</span>}
          <Stock etat={l.stock} />
          {gain && ef != null && piste && <span data-simule="" className="ml-auto shrink-0 font-mono text-sm font-semibold" style={{ color: COULEURS[piste.f].texte }}>{gain(ef, piste.f)}</span>}
        </p>
        <span className="flex items-center gap-0.5" aria-label="Effet sur les familles" {...(premiere ? { 'data-element': 'q2b-cercle-objectif' } : {})}>
          {cibles.map((f) => caseDe(f, 'cible'))}
          <i aria-hidden="true" className="pq-suggerer-separe mx-1 self-stretch" />
          {slots.map((f) => caseDe(f, 'extra'))}
        </span>
        {piste && (
          <span className="block pt-0.5 pb-1" {...(ef != null ? { 'data-role': 'cible', 'data-famille': piste.f, 'data-crans': (ef / cran(piste.f)).toFixed(2) } : {})}>
            <Piste f={piste.f} d={piste.d} barre={ef == null ? null : (piste.avant ?? 0) + ef} avant={piste.avant} visee={piste.visee} inconnu={ef == null ? 'effet inconnu sur la visée' : null} />
          </span>
        )}
      </div>
      <div className="flex items-start gap-0.5">
        <button type="button" data-role="aime" {...(premiere ? { 'data-element': 'q2b-coeur' } : {})} aria-pressed={aime} aria-label={`J’aime ${noms}`}
          onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); if (aime) AIMES.delete(cleAime); else AIMES.add(cleAime); setAime(!aime); }}
          className="pq-suggerer-aime w-8 h-11 inline-flex items-start justify-center pt-1.5">
          <Heart aria-hidden="true" className={`w-4 h-4 ${aime ? 'fill-current' : ''}`} strokeWidth={1.8} />
        </button>
        <button type="button" data-role="ajouter" data-element="q2b-plus-coche" aria-pressed={choisie}
          aria-label={choisie ? `Retirer ${noms} de la comparaison` : `Ajouter ${noms} à la comparaison`}
          onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); basculer(); }}
          className="touch-target w-11 h-11 rounded-full flex items-start justify-center">
          <span className={`flex items-center justify-center w-10 h-10 rounded-full border-[2.5px] ${choisie ? 'pq-suggerer-choisi' : 'border-cave-50 text-cave-50'}`}>
            <i aria-hidden="true" className={choisie ? 'pq-suggerer-coche' : 'pq-suggerer-plus'} />
          </span>
        </button>
      </div>
    </li>
  );
}
