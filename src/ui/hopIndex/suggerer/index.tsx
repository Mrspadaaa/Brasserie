// Suggérer — q2b tel qu'il l'a choisi (« C'est effectivement qb2 reprise le mieux », 19.10 ; « Ça oui, c'est
// effectivement l'un de mes choix », 23.10), avec tous ses états (reprise D124 : « certaines de mes choix ont été
// perdue »), dans l'onglet Suggestions de sa base v4.10.
// En tête : la croix et les trois onglets (D109, D118, D119), le bandeau IBU · OG · EBC, « Au style | Absolu » et
// « Barres | Radar ». Les trois cartes d'objectif de q2b (Moins résineux · Plus floral · Plus agrumes), chacune avec
// son verdict et sa piste. Puis les voies du moteur autour de l'axe central noir de q2b, la visée en tirets : les
// groupes « = même effet » (leur barre une fois, « +1 cran », « +2 crans », puis le cadre à bord noir), « Assembler
// 5 + 5 g », « Remplacer Nugget », « Dry hop · actif » (pastilles de biotransformation, « creep ») ; chaque voie hors
// cadre a sa barre l5b à droite de l'axe. Le ♡ ouvre « aimer · neutre · exclure ». En bas : « IBU après chaque voie »,
// « Hors houblon », la barre noire « Comparer (n) ». En Radar : le mode Radar de la base v4.10 (vue-radar.tsx).
// Écarts voulus par lui : la croix (D109), le « ? » (D113), l'usage en mot (D90), les traits lus au toucher (D110) ; la
// bande « ‹ visée | visée › » ne revient pas (D91). Le groupe « Changer de levure » de q2b revient (D44, 24.10 : « Celle
// ci aussi est toujours meilleures ») ; chaque houblon dit ses mots hors des familles de la 16D (« lui seul : … », flb5b,
// D130), chaque levure ce que sa fiche dit d'elle en propre.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { COULEURS, COURT, Legende, nombre, Picto, ROUE, type Echelle } from './commun';
import { CadreOutil, FicheHote as Fiche, useBiere, useCas, useComparaison, useGestes, useNavigation, useOuvrir, useRecette, useVisee, type RouteSuggerer } from './hote';
import { nomLevure } from '../comparer/cas';
import { style } from '../parcours/adaptateur';
import type { FamilyId } from '../../../domain/hopIndex/v4';
import { offModelLeads } from '../parcours/v4';
import { useCalcul } from '../parcours/useCalcul';
import { useGestesFiche } from '../fiche/gestes';
import { Bandeau } from '../maBiere/Base';
import { AlphaCourt, Calme, CaseInconnue, Lecture, Stock, Traits, traitsDe, Usage, type NiveauFiches } from './briques';
import { BulleTraitsProvider, useCodeStyle } from './bulle';
import { Divergent, Graphe, type NiveauBarre } from './divergent';
import { bannisDe, directionDe, dryhopActif, levuresDe, objectifsDe, verdict, voiesDe, type Groupe, type Ligne, type Objectif } from './voies';
import { horsDesFamilles, motsLevure } from './hors16d';
import { VueRadar } from './vue-radar';
import './suggerer.css';
import './reprise.css';

/** Mes goûts, en mémoire (maquette) : aimer, neutre, exclure (base v4.10). Au portage : la table des goûts de la fiche (D20). */
type Gout = 'aimer' | 'neutre' | 'exclure';
const GOUTS = new Map<string, Gout>();

const RANG: Record<NiveauFiches, number> = { 'non décrit': 0, cité: 1, marqué: 2 };
/** Le niveau des fiches d'une famille sur la voie : le plus haut de ses houblons. */
const niveauFiches = (l: Ligne, f: FamilyId): NiveauFiches => l.houblons.map((h) => h.familles[f].niveau).sort((a, b) => RANG[b] - RANG[a])[0] ?? 'non décrit';
/** La barre de q2b : pleine si une fiche marque la famille, pâle si elle la cite, blanche sinon ou quand elle baisse. */
const niveauBarre = (l: Ligne) => (f: FamilyId, e: number): NiveauBarre => {
  if (e < 0) return 'sf';
  const n = niveauFiches(l, f);
  return n === 'marqué' ? 'mq' : n === 'cité' ? 'ci' : 'sf';
};
const nomsVoie = (l: Ligne) => l.houblons.map((h) => h.nom).join(' + ');

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
  const [gouts, setGouts] = useState(() => new Map(GOUTS));
  const [goutOuvert, setGoutOuvert] = useState<string | null>(null);
  const noter = (cle: string, g: Gout) => {
    if (g === 'neutre') GOUTS.delete(cle); else GOUTS.set(cle, g);
    setGouts(new Map(GOUTS)); setGoutOuvert(null);
  };

  // La visée commune (Ma bière) ; sans visée, la demande de q2b (+ floral, + agrumes, − résineux).
  const visee = useVisee();
  const objectifs = useMemo(() => objectifsDe(recette, biere, visee), [recette, biere, visee]);
  const bannis = useMemo(() => bannisDe(visee), [visee]);
  // Les calculs lourds des voies passent par le client asynchrone (#165) : tout de suite sur le fil principal ; d'un
  // worker, l'écran garde ses voies d'avant jusqu'à la réponse (aucun état d'attente : ses maquettes n'en ont pas).
  const direction = useMemo(() => directionDe(objectifs), [objectifs]);
  const proposes = useCalcul('proposer', [recette, direction]);
  const leviers = useCalcul('leviers', [recette, direction]);
  const lus = useMemo(() => (proposes && leviers ? { recette: proposes.args[0], calculs: { proposes: proposes.valeur, leviers: leviers.valeur } } : null), [proposes, leviers]);
  const tous = useMemo(() => (lus ? voiesDe(lus.recette, objectifs, ROUE, bannis, 4, lus.calculs) : []), [lus, objectifs, bannis]);
  // « exclure » (♡) : les voies de ce houblon quittent la liste ; « Exclus » les rend.
  const exclus = [...gouts].filter(([, g]) => g === 'exclure').map(([c]) => c);
  const groupes = useMemo(() => tous.map((g) => ({ ...g, lignes: g.lignes.filter((l) => !l.houblons.some((h) => exclus.includes(h.cle))) })).filter((g) => g.lignes.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tous, exclus.join()]);
  const lignes = groupes.flatMap((g) => g.lignes);
  // « Changer de levure » (q2b), après les voies houblon, à part (ni verdict, ni radar, ni comparaison de houblons).
  const levures = useMemo(() => (lus ? levuresDe(lus.recette, objectifs, ROUE, lignes.length, lus.calculs) : null), [lus, objectifs, lignes.length]);
  // D130 : ses mots hors des familles, sur la première ligne où chaque houblon paraît (une fois : mots modérés, D41).
  const hors16d = useMemo(() => {
    const parCle = horsDesFamilles(lignes.flatMap((l) => l.houblons.map((h) => h.cle)));
    const vu = new Set<string>(), m = new Map<string, Hors[]>();
    for (const l of lignes) {
      const ici = l.houblons.filter((h) => !vu.has(h.cle) && parCle.has(h.cle)).map((h) => ({ cle: h.cle, ...parCle.get(h.cle)! }));
      l.houblons.forEach((h) => vu.add(h.cle));
      if (ici.length) m.set(l.id, ici);
    }
    return m;
  }, [lignes]);
  const cran = (f: FamilyId) => sc.families[f].cran;
  const bande = (f: FamilyId) => sc.families[f].band ?? null;
  const colonnes = Math.max(1, Math.min(3, objectifs.length));
  const teinte = (f: FamilyId) => `linear-gradient(160deg, rgb(var(--cave-950)), color-mix(in srgb, ${COULEURS[f].base} 18%, ${COULEURS[f].fond}))`;

  // Les cartes dans l'ordre de q2b : « Moins résineux » d'abord (sa plainte, « trop résineuse »), puis les « plus ».
  // Proposés au départ, comme q2b (des voies cochées) : la meilleure voie du stock de chacun des deux groupes au même
  // effet, et le dry hop actif (Motueka, déjà compté).
  useEffect(() => {
    if (aComparer.length) return;
    const premier = (g?: Groupe) => g?.lignes.find((l) => l.stock !== 'à acheter')?.houblons.map((h) => h.cle) ?? [];
    const choix = [...new Set([...premier(groupes.find((g) => g.id === 'meme-0')), ...premier(groupes.find((g) => g.id === 'meme-1')), ...premier(groupes.find((g) => g.geste === 'dryhop'))])];
    if (choix.length) fixerComparaison(choix);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const choisie = (l: Ligne) => l.houblons.every((h) => aComparer.includes(h.cle));
  const basculer = (l: Ligne) => {
    const tousDedans = choisie(l);
    for (const h of l.houblons) if (tousDedans || !aComparer.includes(h.cle)) basculerComparaison(h.cle);
  };
  // Le « + » joué par controle-etats (etat-sugg-plus) : Aurum, comme sa maquette, sinon la première voie non retenue.
  const lignePlus = lignes.find((l) => l.houblons.length === 1 && /aurum/.test(l.houblons[0].cle) && !choisie(l)) ?? lignes.find((l) => !choisie(l));

  // Fiche à l'appui long : une entrée d'historique (le retour du téléphone la ferme), Suggérer reste ouvert dessous.
  const [fiche, setFiche] = useState<string | null>(null);
  const routeFiche = useRef<RouteSuggerer | null>(null);
  const ouvrirFiche = (cle: string) => {
    if (!fiche) { const r: RouteSuggerer = { ecran: 'suggerer' }; routeFiche.current = r; aller(r); }
    setFiche(cle);
  };
  useEffect(() => { if (fiche && route !== routeFiche.current) setFiche(null); }, [route, fiche]);
  const gestesFiche = useGestesFiche(ouvrirFiche);

  // Cas lu par controle-autres-ajouts (D76) ; le levier « dry hop actif » du moteur, pour jeu.mjs et instantane.mjs
  // (le crochet du socle n'expose que proposer).
  const cas = useCas();
  useEffect(() => {
    if (!cas) return;
    document.body.dataset.cas = cas;
    (window as unknown as { __suggerer?: unknown }).__suggerer = { dryhopActif };
    return () => { delete document.body.dataset.cas; };
  }, [cas]);
  // Un toucher hors du menu du goût le ferme.
  useEffect(() => {
    if (!goutOuvert) return;
    const f = (e: PointerEvent) => { if (!(e.target as Element).closest?.('[data-role="gout"],[data-role="gout-choix"]')) setGoutOuvert(null); };
    document.addEventListener('pointerdown', f, true);
    return () => document.removeEventListener('pointerdown', f, true);
  }, [goutOuvert]);

  const leads = offModelLeads(Object.fromEntries(objectifs.map((o) => [o.f, o.sens])));
  const pistesHors = leads.flatMap((x) => x.leads);
  const famHors = leads[0]?.family as FamilyId | undefined;
  const montrerHorsHoublon = () => {
    setHorsHoublon(true);
    requestAnimationFrame(() => refHorsHoublon.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  };
  const avecIbu = lignes.filter((l) => l.ibuApres != null);
  // La piste regardée par controle-etats (etat-sugg-piste-objectif) : celle d'un objectif atteint, comme sa maquette.
  const fPiste = (objectifs.find((o) => o.sens > 0 && verdict(o, groupes).mot === 'Atteint') ?? objectifs.find((o) => o.sens > 0))?.f;
  const groupe2 =groupes.filter((g) => g.id.startsWith('meme-'))[1] ?? groupes.find((g) => g.id.startsWith('meme-'));

  return (
    <CadreOutil ecran="suggerer" question="Quel houblon ajouter à ma bière ?" questionVisible={false} elementTete="q2b-onglets" etat="etat-acquis-couleur-aromes etat-acquis-picto-epice">
      <BulleTraitsProvider code={sc.code}>
        <div className="pq-suggerer-haut" data-etat="etat-sugg-bandeau-ibu">
          <Bandeau biere={biere} element="q2b-bandeau-ibu" />
        </div>
        <div data-element="q2b-reglages" className="flex items-center gap-1.5">
          <Lecture<Echelle> label="Échelle" valeur={echelle} onChange={setEchelle} e={['style', 'absolu']} etats={[undefined, 'etat-sugg-absolu']}
            options={[{ value: 'style', label: 'Au style' }, { value: 'absolu', label: 'Absolu' }]} />
          {/* D89 : « il faut un bouton légende un peu caché pour pas que ça gêne ». Les traits se lisent aussi au toucher (D110). */}
          <Legende>
            <p><b>Carte</b> : le verdict de la meilleure voie qui reste au style ; Atteint, la visée ; Approche, la moitié du chemin.</p>
            <p><b>Barres</b> : à droite de l’axe, ce qui monte ; à gauche, ce qui baisse ; tirets, la visée ; trait fin, jusqu’au haut du style {sc.code} ; orangé, hors du style ; hachures, effet non établi.</p>
            <p><b>Sous un picto</b> : un trait par cran du style, puis, en creux, les crans qui manquent jusqu’au plus grand du groupe ; toucher le picto dit sa famille et sa valeur. Cerclés : tes objectifs.</p>
            <p><b>Usage</b> : amer, arôme ou mixte ; souligné en pointillé, déduit de l’α. Appui long sur une voie : sa fiche.</p>
          </Legende>
          <span className="flex-1" aria-hidden="true" />
          <Lecture<'barres' | 'radar'> label="Vue" valeur={vue} onChange={setVue} e={['barres', 'radar']} etats={[undefined, 'etat-sugg-radar etat-acquis-bascule-barres-radar']}
            options={[{ value: 'barres', label: 'Barres' }, { value: 'radar', label: 'Radar' }]} />
        </div>

        {objectifs.length === 0 ? (
          // t12e (#184) : sans visée posée dans Ma bière ni demande dégustée, rien à viser : il le dit et ne propose rien d'inventé
          // (ni voie houblon, ni levure : une levure « estimée » sans but serait une proposition au hasard).
          <p data-role="suggerer-sans-visee" className="rounded-lg px-3 py-3 text-sm text-cave-200 leading-snug" style={{ background: 'rgb(var(--cave-900))' }}>
            <b className="text-cave-50">Aucune visée.</b> Rien n'est visé dans Ma bière, et aucune dégustation ne porte de demande : Suggérer n'a rien à proposer.
          </p>
        ) : vue === 'radar' ? (
          <VueRadar biere={biere} sc={sc} echelle={echelle} objectifs={objectifs} groupes={groupes} onHorsHoublon={montrerHorsHoublon} famHors={famHors} pistesHors={pistesHors.length} />
        ) : (
          <>
            <section aria-label="Objectifs" data-element="q2b-cartes-objectifs q2b-piste-objectif" data-etat="etat-sugg-repos etat-acquis-disposition-l8 etat-acquis-theme-blanc-gris-noir" className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${colonnes}, minmax(0, 1fr))` }}>
              {[...objectifs].sort((x, y) => x.sens - y.sens).map((o) => <Carte key={o.f} o={o} groupes={groupes} biere={biere} teinte={teinte(o.f)} famHors={famHors} pistesHors={pistesHors.length}
                horsHoublon={horsHoublon} onHorsHoublon={montrerHorsHoublon} etatPiste={o.f === fPiste} />)}
            </section>

            <div data-libre="houblon" aria-label="Voies du moteur" data-etat="etat-acquis-barres-l5b etat-acquis-q2b-suite-s5 etat-acquis-levure-bio-cumul etat-acquis-stock-icone"
              data-direction={JSON.stringify(Object.fromEntries(objectifs.map((o) => [o.f, o.requis / o.cran])))}>
              {exclus.length > 0 && (
                <p className="flex flex-wrap items-center gap-1.5 px-1 pb-1 text-sm text-cave-200">
                  Exclus :
                  {exclus.map((c) => {
                    const h = tous.flatMap((g) => g.lignes).flatMap((l) => l.houblons).find((x) => x.cle === c);
                    return <button key={c} type="button" onClick={() => noter(c, 'neutre')} aria-label={`Ne plus exclure ${h?.nom ?? c}`} className="h-8 px-3 rounded-full border border-cave-700 font-semibold">{h?.nom ?? c} ×</button>;
                  })}
                </p>
              )}
              <Graphe objectifs={objectifs} echelle={echelle} cran={cran}>
                {groupes.map((g) => (
                  <BlocGroupe key={g.id} g={g} objectifs={objectifs} echelle={echelle} cran={cran} bande={bande} choisie={choisie} basculer={basculer}
                    gestesFiche={gestesFiche} etat={g === groupe2 ? 'etat-sugg-groupes-effet' : g.geste === 'assembler' ? 'etat-sugg-assembler' : g.geste === 'remplacer' ? 'etat-sugg-remplacer' : g.geste === 'dryhop' ? 'etat-sugg-dry-hop' : undefined}
                    premiere={g === groupes[0]} lignePlus={lignePlus?.id ?? null} gouts={gouts} goutOuvert={goutOuvert} setGoutOuvert={setGoutOuvert} noter={noter} hors16d={hors16d} />
                ))}
                {levures && <BlocLevure g={levures} objectifs={objectifs} echelle={echelle} cran={cran} bande={bande} />}
              </Graphe>
            </div>
          </>
        )}

        {avecIbu.length > 0 && (
          <details data-lecture="" className="pq-suggerer-repli rounded-lg">
            <summary data-etat="etat-sugg-ibu-details" className="flex items-center gap-2 px-3 min-h-[44px] text-[0.9375rem] font-semibold text-cave-50 cursor-pointer">
              IBU après chaque voie (ma bière {nombre(biere.ibu.valeur, 1)}{biere.bandeIbu ? ` ; style ${biere.bandeIbu[0]}–${biere.bandeIbu[1]}` : ''})
            </summary>
            <p data-role="ibu-voies" className="px-3 pb-3 text-sm text-cave-200 leading-snug">
              {avecIbu.map((l, i) => (
                <span key={l.id}>{i > 0 ? ' · ' : ''}{nomsVoie(l)} {l.voie.actions[0].momentLabel.replace(/^dry hop.*$/i, 'actif')} <b className="font-mono text-cave-50">{nombre(l.ibuApres!, 1)}</b></span>
              ))}
            </p>
          </details>
        )}
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
          <button type="button" data-role="pont-comparer" data-etat="etat-sugg-comparer-n" disabled={aComparer.length < 1} onClick={() => ouvrir({ ecran: 'comparer', houblons: aComparer })}
            className="pq-suggerer-comparer w-full rounded-full text-base font-bold disabled:opacity-40">
            Comparer <span className="pq-suggerer-comparer-n">({aComparer.length})</span>
          </button>
        </div>
        {fiche && <Fiche houblon={fiche} onFermer={() => setFiche(null)} />}
      </BulleTraitsProvider>
    </CadreOutil>
  );
}

/** Une carte d'objectif de q2b : flèche et picto, « Plus floral », le verdict en un mot, et sa piste (ce que la
 * meilleure voie atteint, la visée en tirets) ; « Aucune voie houblon » et « Hors houblon › » sinon. */
function Carte({ o, groupes, biere, teinte, famHors, pistesHors, horsHoublon, onHorsHoublon, etatPiste }: {
  o: Objectif; groupes: Groupe[]; biere: ReturnType<typeof useBiere>; teinte: string; famHors: FamilyId | undefined; pistesHors: number;
  horsHoublon: boolean; onHorsHoublon: () => void; etatPiste: boolean;
}) {
  const v = verdict(o, groupes);
  const mot = o.bannie ? 'Sans' : o.sens > 0 ? 'Plus' : 'Moins';
  const nom = `${mot} ${COURT[o.f].toLowerCase()}`;
  const fr = (x: number) => nombre(x, 1);
  const apres = o.avant != null && v.effet != null ? o.avant + v.effet : null;
  const dit = v.mot === 'Aucune'
    ? 'aucune voie houblon ne l’y ramène'
    : `la meilleure voie, ${v.meilleure ? nomsVoie(v.meilleure) : '?'}, ${v.mot === 'Atteint' ? 'atteint' : 'approche'} la visée${o.avant != null && apres != null && o.visee != null ? ` (${fr(o.avant)} → ${fr(apres)}, visée ${fr(o.visee)})` : ''}`;
  // La piste de la carte (q2b, cible) : ce que la meilleure voie fait, en part du chemin voulu, et la visée en tirets.
  const frac = v.effet != null && o.sens > 0 ? Math.max(0, v.effet / Math.abs(o.requis)) : null;
  const max = Math.max(1, frac ?? 0) * 1.12;
  return (
    <div data-role="objectif" data-objectif={o.f} {...(o.bannie ? { 'data-banni': o.f } : {})}
      className="pq-suggerer-carte pq-sg-carte rounded-lg px-2.5 py-2 flex flex-col gap-1 min-w-0" style={{ background: teinte }} aria-label={`${nom} : ${dit}`}>
      <span className="flex items-start gap-1 text-[0.8125rem] font-bold leading-tight" style={{ color: COULEURS[o.f].texte }}>
        <span className="relative inline-flex shrink-0"><Picto famille={o.f} taille={17} nomme={false} />{biere.profil[o.f].horsStyle && <i className="pq-suggerer-alerte" aria-hidden="true" />}</span>
        <span className="min-w-0">{nom}</span>
      </span>
      <span data-role="reponse" data-verdict={v.mot} className={`pq-sg-verdict pq-suggerer-verdict-${v.mot.toLowerCase()} leading-none`}>
        {v.mot}{v.mot === 'Aucune' && <small className="pq-sg-verdict-suite">voie houblon</small>}
      </span>
      {v.mot === 'Aucune' && o.f === famHors && pistesHors > 0 ? (
        <button type="button" data-element="q2b-hors-houblon" data-role="hors-houblon" data-etat="etat-sugg-hors-houblon" aria-label={`Hors houblon : les pistes pour le ${COURT[o.f].toLowerCase()}`}
          aria-expanded={horsHoublon} aria-controls="pq-suggerer-hors-houblon" onClick={onHorsHoublon}
          className="pq-suggerer-hh mt-auto self-start h-8 px-2.5 rounded-full text-xs font-bold whitespace-nowrap" style={{ color: COULEURS[o.f].texte, borderColor: COULEURS[o.f].texte }}>Hors houblon</button>
      ) : frac != null ? (
        <span data-role="piste" data-famille-piste={o.f} {...(etatPiste ? { 'data-etat': 'etat-sugg-piste-objectif' } : {})} className="pq-sg-cible mt-auto" aria-hidden="true">
          <i className="pq-sg-cible-barre" style={{ width: `${(Math.min(frac, max) / max) * 100}%`, background: COULEURS[o.f].base }} />
          <i className="pq-sg-cible-visee" style={{ left: `${(1 / max) * 100}%` }} />
        </span>
      ) : null}
    </div>
  );
}

function BlocGroupe({ g, objectifs, echelle, cran, bande, choisie, basculer, gestesFiche, etat, premiere, lignePlus, gouts, goutOuvert, setGoutOuvert, noter, hors16d }: {
  g: Groupe; objectifs: Objectif[]; echelle: Echelle; cran: (f: FamilyId) => number; bande: (f: FamilyId) => [number, number] | null;
  choisie: (l: Ligne) => boolean; basculer: (l: Ligne) => void; gestesFiche: ReturnType<typeof useGestesFiche>; etat?: string; premiere: boolean;
  lignePlus: string | null; gouts: Map<string, Gout>; goutOuvert: string | null; setGoutOuvert: (c: string | null) => void; noter: (c: string, g: Gout) => void;
  hors16d: Map<string, Hors[]>;
}) {
  const cibles = objectifs.map((o) => o.f);
  // Cases alignées du groupe (q2b) : les familles hors objectifs qu'au moins une voie fait bouger.
  const slots = ROUE.filter((f) => !cibles.includes(f) && g.lignes.some((l) => l.effets[f] != null && Math.abs(l.effets[f]!) >= 0.5));
  const meme = g.id.startsWith('meme');
  // Le cadre à bord noir de q2b : les voies au même effet (plusieurs lignes, une seule barre d'effet).
  const cadre = meme && g.lignes.length > 1;
  // gr5 c, les crans comptés : chaque case montre ses crans vides jusqu'au plus grand effet du groupe (sa liste), en places
  // de trait comme elles sont dessinées ; un effet inconnu ou calme ne compte pas (l'inconnu n'est pas 0).
  const plafond = Math.max(1, ...g.lignes.flatMap((l) => [...cibles, ...slots].map((f) => {
    const e = l.effets[f];
    return e == null || Math.abs(e) < 0.5 ? 0 : traitsDe(e / cran(f)).places;
  })));
  const element = meme && g.id === 'meme-0' ? 'q2b-groupes-effet' : g.geste === 'assembler' ? 'q2b-assembler' : g.geste === 'remplacer' ? 'q2b-remplacer' : undefined;
  const moment = g.geste === 'dryhop'
    ? <span className="pq-suggerer-moment pq-sg-sur-axe gap-1"><svg width="12" height="14" viewBox="0 0 14 16" aria-hidden="true"><path d="M2 1 H12 V9 L7 15 L2 9 Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><circle cx="5.5" cy="7" r="1.2" fill="currentColor" /><circle cx="8.5" cy="4.5" r="1.2" fill="currentColor" /></svg>{g.moment}</span>
    : <span className="pq-suggerer-moment pq-sg-sur-axe">{g.moment}</span>;
  return (
    <section data-groupe={g.id} {...(element ? { 'data-element': element } : {})} {...(etat ? { 'data-etat': etat } : {})} className="relative pt-2">
      <h3 className="relative flex items-center gap-2 px-1 min-h-[1.875rem] text-[0.9375rem] font-bold text-cave-50 leading-tight">
        <span className="pq-sg-sur-axe inline-flex items-center gap-1.5">
          {meme && g.titre !== 'Ajouter' && <span aria-hidden="true" className="pq-suggerer-egal" />}
          <span>{g.titre}</span>
        </span>
        {g.dose && <span className="pq-sg-sur-axe font-semibold text-cave-200">{g.dose}</span>}
        {moment}
        {g.estime && <span className="pq-sg-sur-axe text-sm font-normal text-cave-400">estimé</span>}
      </h3>
      {cadre && (
        // L'effet du groupe, dessiné une fois (q2b : « +1 cran », « +2 crans »).
        <div className="pt-1 pb-1.5">
          <Divergent objectifs={objectifs} effets={g.lignes[0].effets} hors={g.lignes[0].hors} niveau={niveauBarre(g.lignes[0])} echelle={echelle} cran={cran} bande={bande} etiquettes />
        </div>
      )}
      <ul className={cadre ? 'pq-suggerer-cadre' : 'pq-suggerer-liste'} {...(cadre ? { 'data-role': 'cadre-voies' } : {})} {...(cadre && g.id === 'meme-0' ? { 'data-element': 'q2b-cadre-liste' } : {})}>
        {g.lignes.map((l, i) => (
          <LigneVoie key={l.id} l={l} premiere={premiere && i === 0} cibles={cibles} slots={slots} cran={cran} choisie={choisie(l)} basculer={() => basculer(l)}
            gestesFiche={gestesFiche} barres={!cadre} objectifs={objectifs} echelle={echelle} bande={bande} plus={l.id === lignePlus}
            gouts={gouts} goutOuvert={goutOuvert} setGoutOuvert={setGoutOuvert} noter={noter} cadre={cadre} plafond={plafond} hors={hors16d.get(l.id) ?? []} />
        ))}
      </ul>
    </section>
  );
}

/** Les pastilles de biotransformation de q2b : chaque signal par les pictos de son effet, le hop creep par son mot. */
function Bio({ l }: { l: Ligne }) {
  if (!l.bio.length) return null;
  const a = (id: string) => l.bio.some((s) => s.id === id);
  return (
    <details className="pq-sg-bio" data-role="bio" onPointerDown={(e) => e.stopPropagation()}>
      <summary aria-label="Biotransformation possible, ampleur non quantifiée" className="pq-hachure">
        {a('geraniol-citronellol') && <span className="pq-sg-bt"><Picto famille="floral" taille={13} nomme={false} /><b aria-hidden="true">→</b><Picto famille="citrus" taille={13} nomme={false} /></span>}
        {a('thiols') && <span className="pq-sg-bt"><Picto famille="tropical" taille={13} nomme={false} /><Picto famille="berries" taille={13} nomme={false} /></span>}
        {a('hop-creep') && <span className="pq-sg-bt pq-sg-bt-mot">creep</span>}
      </summary>
      <ul className="pq-sg-bio-liste">
        {l.bio.map((s) => <li key={s.id}><b>{s.titre}</b> · {s.statut}. <span className="text-cave-400">{s.pourquoi}</span></li>)}
      </ul>
    </details>
  );
}

function LigneVoie({ l, premiere, cibles, slots, cran, choisie, basculer, gestesFiche, barres, objectifs, echelle, bande, plus, gouts, goutOuvert, setGoutOuvert, noter, cadre, plafond, hors }: {
  l: Ligne; premiere: boolean; cibles: FamilyId[]; slots: FamilyId[]; cran: (f: FamilyId) => number; choisie: boolean; basculer: () => void;
  gestesFiche: ReturnType<typeof useGestesFiche>; barres: boolean; objectifs: Objectif[]; echelle: Echelle; bande: (f: FamilyId) => [number, number] | null;
  plus: boolean; gouts: Map<string, Gout>; goutOuvert: string | null; setGoutOuvert: (c: string | null) => void; noter: (c: string, g: Gout) => void; cadre: boolean; plafond: number;
  /** D130 : ses mots hors des familles de la 16D, pour les houblons qui paraissent ici pour la première fois. */
  hors: Hors[];
}) {
  const noms = l.houblons.map((h) => h.nom).join(' et ');
  const cleGout = l.houblons[0].cle;
  const gout = gouts.get(cleGout) ?? 'neutre';
  const ouvert = goutOuvert === `${l.id}:${cleGout}`;
  // « avec Motueka » dans la bulle (gr5 b) : les houblons de la voie, comme sur sa ligne.
  const avec = l.houblons.map((h) => h.nom).join(' + ');
  const montre = (f: FamilyId) => { const e = l.effets[f]; return e != null && Math.abs(e) >= 0.5; };
  // Contrat de controle-etats.mjs, sur la première voie : le toucher de gr5 b sur son objectif le plus marqué (Agrumes de
  // Motueka dans sa page gr5), le repos de gr5 c sur son premier cran vide.
  const fCran = premiere ? [...cibles].filter(montre).sort((a, b) => Math.abs(l.effets[b]! / cran(b)) - Math.abs(l.effets[a]! / cran(a)))[0] : undefined;
  const fVide = premiere ? [...cibles, ...slots].find((f) => montre(f) && traitsDe(l.effets[f]! / cran(f)).places < plafond) : undefined;
  const caseDe = (f: FamilyId, role: 'extra' | 'cible') => {
    const e = l.effets[f];
    const cle = `${l.id}:${f}`;
    if (e == null) return role === 'cible' ? <CaseInconnue key={f} f={f} cle={cle} avec={avec} /> : <Calme key={f} f={f} cle={cle} avec={avec} />;
    if (Math.abs(e) < 0.5) return <Calme key={f} f={f} cle={cle} cible={role === 'cible'} avec={avec} />;
    return <Traits key={f} f={f} crans={e / cran(f)} hors={l.hors.includes(f)} role={role} niveau={niveauFiches(l, f)} cle={cle} avec={avec} plafond={plafond}
      etat={f === fCran ? 'etat-sugg-gr5-cran' : undefined} etatVide={f === fVide ? 'etat-sugg-gr5-crans-comptes' : undefined} />;
  };
  return (
    <li data-voie={l.n} data-id={l.id} data-role="ligne-houblon" {...(premiere ? { 'data-element': 'q2b-ligne-voie' } : {})} {...(choisie ? { 'data-choisi': '' } : {})}
      {...gestesFiche.appui(l.houblons[0].cle)}
      className={`pq-suggerer-voie relative select-none ${cadre ? 'pl-2 pr-1' : ''} py-1 ${choisie ? 'pq-suggerer-voie-choisie' : ''}`}>
      <div className="grid grid-cols-[1fr_auto] gap-x-1">
        <div className="min-w-0 space-y-0.5">
          <p className="pq-sg-l1 flex items-center gap-x-1.5 gap-y-0.5 min-w-0 min-h-[1.625rem] leading-tight flex-wrap">
            <span className="pq-sg-sur-axe inline-flex items-baseline gap-1 shrink-0">{l.houblons.map((h) => <Usage key={h.cle} h={h} />)}</span>
            <span className="pq-sg-sur-axe pq-sg-noms text-base text-cave-50 font-semibold">
              {/* Les noms d'abord, d'un seul tenant comme q2b (« Motueka + Nelson Sauvin »), puis l'α de chacun (D87). */}
              {l.houblons.map((h, j) => (
                <span key={h.cle}>{j > 0 ? ' + ' : ''}<span data-houblon={h.cle} data-role="ouvrir-fiche" {...(premiere && j === 0 ? { 'data-etat': 'etat-sugg-fiche' } : {})} {...gestesFiche.nom(h.cle)} className="pq-suggerer-nom">{h.nom}</span></span>
              ))}
              {l.houblons.map((h) => <span key={h.cle}> <AlphaCourt h={h} /></span>)}
            </span>
            {l.dose && <span className={`pq-sg-sur-axe shrink-0 font-mono text-xs text-cave-200 whitespace-nowrap ${l.dose.includes('+') ? 'pq-suggerer-estime' : ''}`}>{l.dose}</span>}
            <span className="pq-sg-sur-axe inline-flex"><Stock etat={l.stock} /></span>
            <Bio l={l} />
            {/* D130 : sur la carte, sous le nom et au-dessus des pictos (les traits restent muets au repos, D110). */}
            {hors.map((x) => <Hors16D key={x.cle} x={x} nom={l.houblons.length > 1 ? l.houblons.find((h) => h.cle === x.cle)?.nom : undefined} />)}
          </p>
          <span className="flex items-center gap-0.5" aria-label="Effet sur les familles" {...(premiere ? { 'data-element': 'q2b-cercle-objectif' } : {})}>
            {cibles.map((f) => caseDe(f, 'cible'))}
            <i aria-hidden="true" className="pq-suggerer-separe mx-1 self-stretch" />
            {slots.map((f) => caseDe(f, 'extra'))}
            {/* « Intégré les infos icône subtil des gros changement hors 16d. Exemple neslon sauvin on voit pas que c'est
                Sauvignon blanc » (24.10, soir) : au bout des cases, le ◇ et le premier mot hors des 12, discrets. */}
            {hors.length > 0 && (
              <span role="img" aria-label={`hors des 12 familles : ${hors.flatMap((x) => x.mots).join(', ')}`} title={hors.flatMap((x) => x.mots).join(', ')} className="pq-sg-hors-case">
                <i aria-hidden="true">◇</i>
              </span>
            )}
          </span>
        </div>
        <div className="relative flex items-start gap-0.5">
          <button type="button" data-role="gout" {...(premiere ? { 'data-element': 'q2b-coeur', 'data-etat': 'etat-sugg-coeur' } : {})} aria-expanded={ouvert}
            aria-label={`Mon goût pour ${noms} : ${gout}`}
            onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setGoutOuvert(ouvert ? null : `${l.id}:${cleGout}`); }}
            className={`pq-suggerer-aime pq-sg-sur-axe w-8 h-11 inline-flex items-start justify-center pt-1.5 ${gout === 'aimer' ? 'pq-sg-aime' : ''}`}>
            <Heart aria-hidden="true" className={`w-4 h-4 ${gout === 'aimer' ? 'fill-current' : ''}`} strokeWidth={1.8} />
          </button>
          {ouvert && (
            <span role="group" data-role="gout-choix" aria-label={`Mon goût pour ${noms}`} className="pq-sg-gout-choix" onPointerDown={(e) => e.stopPropagation()}>
              {(['aimer', 'neutre', 'exclure'] as const).map((c) => (
                <button key={c} type="button" aria-pressed={gout === c} onClick={(e) => { e.stopPropagation(); noter(cleGout, c); }}>{c}</button>
              ))}
            </span>
          )}
          <button type="button" data-role="ajouter" data-element="q2b-plus-coche" {...(plus || noms === 'Aurum' ? { 'data-etat': [plus && 'etat-sugg-plus', noms === 'Aurum' && 'etat-acquis-plus-comparer'].filter(Boolean).join(' ') } : {})} aria-pressed={choisie}
            aria-label={choisie ? `Retirer ${noms} de la comparaison` : `Ajouter ${noms} à la comparaison`}
            onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); basculer(); }}
            className="touch-target pq-sg-sur-axe w-11 h-11 rounded-full flex items-start justify-center">
            <span className={`flex items-center justify-center w-10 h-10 rounded-full border-[2.5px] ${choisie ? 'pq-suggerer-choisi' : 'border-cave-50 text-cave-50 bg-cave-950'}`}>
              <i aria-hidden="true" className={choisie ? 'pq-suggerer-coche' : 'pq-suggerer-plus'} />
            </span>
          </button>
        </div>
      </div>
      {barres && (
        <div className="pt-1 pb-1.5" data-role="barres-voie">
          <Divergent objectifs={objectifs} effets={l.effets} hors={l.hors} niveau={niveauBarre(l)} echelle={echelle} cran={cran} bande={bande} />
        </div>
      )}
    </li>
  );
}

/** Les mots d'un houblon hors des familles de la 16D (D130). */
type Hors = { cle: string; seul: boolean; mots: string[] };
/** « lui seul : mojito, zeste de citron » (flb5b) : les mots de ses fiches qu'aucune famille ne dessine et qu'aucun autre
 * houblon de l'écran n'a ; sinon « hors 16D : … » (ses mots hors familles, qu'un autre a aussi). Une ligne courte. */
function Hors16D({ x, nom }: { x: Hors; nom?: string }) {
  const code = useCodeStyle();
  return (
    <span data-role="hors-16d" data-houblon={x.cle} className="pq-sg-hors16d pq-sg-sur-axe">
      {/* « Ah si là mais ajoute icone » (24.10, soir) : le ◇ des mots hors des 12 familles, comme la fiche et Comparer. */}
      <i aria-hidden="true" className="pq-sg-hors16d-ic">◇</i>
      <span className="pq-sg-hors16d-cle">{nom ? `${nom}, ` : ''}{x.seul ? 'lui seul' : `hors ${code ?? 'familles'}`} :</span> {x.mots.join(', ')}
    </span>
  );
}

/** « Changer de levure » de q2b : chaque souche, son effet (traits et barre ; modèle seul, estimé) et ce que sa fiche
 * technique dit d'elle en propre (« elle : abricot dominant, POF négative » ; « ? » si aucune fiche ne le dit). */
function BlocLevure({ g, objectifs, echelle, cran, bande }: {
  g: Groupe; objectifs: Objectif[]; echelle: Echelle; cran: (f: FamilyId) => number; bande: (f: FamilyId) => [number, number] | null;
}) {
  const cibles = objectifs.map((o) => o.f);
  const slots = ROUE.filter((f) => !cibles.includes(f) && g.lignes.some((l) => l.effets[f] != null && Math.abs(l.effets[f]!) >= 0.5));
  const plafond = Math.max(1, ...g.lignes.flatMap((l) => [...cibles, ...slots].map((f) => {
    const e = l.effets[f];
    return e == null || Math.abs(e) < 0.5 ? 0 : traitsDe(e / cran(f)).places;
  })));
  const [retenues, setRetenues] = useState<string[]>([]);
  return (
    <section data-groupe="levure" data-element="q2b-levure" data-etat="etat-sugg-levure" className="relative pt-2">
      <h3 className="relative flex items-center gap-2 px-1 min-h-[1.875rem] text-[0.9375rem] font-bold text-cave-50 leading-tight">
        <span className="pq-sg-sur-axe">{g.titre}</span>
        <span className="pq-suggerer-moment pq-sg-sur-axe gap-1">
          <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true"><circle cx="6" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1.2" /><circle cx="12.2" cy="3.8" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.2" /><circle cx="5" cy="7" r="1.2" fill="currentColor" /></svg>
          levure
        </span>
        <span className="pq-sg-sur-axe text-sm font-normal text-cave-400">estimé</span>
      </h3>
      <ul className="pq-suggerer-liste">
        {g.lignes.map((l) => {
          const y = l.levure!;
          const mots = motsLevure(y.id);
          const retenue = retenues.includes(y.id);
          const caseDe = (f: FamilyId, role: 'extra' | 'cible') => {
            const e = l.effets[f], cle = `${l.id}:${f}`;
            if (e == null) return role === 'cible' ? <CaseInconnue key={f} f={f} cle={cle} avec={y.nom} /> : <Calme key={f} f={f} cle={cle} avec={y.nom} />;
            if (Math.abs(e) < 0.5) return <Calme key={f} f={f} cle={cle} cible={role === 'cible'} avec={y.nom} />;
            return <Traits key={f} f={f} crans={e / cran(f)} hors={l.hors.includes(f)} role={role} niveau="non décrit" cle={cle} avec={y.nom} plafond={plafond} />;
          };
          return (
            <li key={l.id} data-levure={y.id} data-role="ligne-levure" className="pq-suggerer-voie relative select-none py-1">
              <div className="grid grid-cols-[1fr_auto] gap-x-1">
                <div className="min-w-0 space-y-0.5">
                  <p className="pq-sg-l1 flex items-center flex-wrap min-h-[1.625rem] leading-tight">
                    <span className="pq-sg-sur-axe text-base text-cave-50 font-semibold">{y.nom}</span>
                    <span data-role="hors-16d" data-houblon={y.id} data-levure-propre="" className="pq-sg-hors16d pq-sg-sur-axe">
                      <span className="pq-sg-hors16d-cle">elle :</span> {mots ? mots.join(', ') : <span aria-label="inconnu, pas zéro">?</span>}
                    </span>
                  </p>
                  <span className="flex items-center gap-0.5" aria-label="Effet sur les familles">
                    {cibles.map((f) => caseDe(f, 'cible'))}
                    <i aria-hidden="true" className="pq-suggerer-separe mx-1 self-stretch" />
                    {slots.map((f) => caseDe(f, 'extra'))}
                  </span>
                </div>
                {/* Le « + » de q2b. Comparer ne compare que des houblons : la levure est retenue ici, sans entrer dans
                    « Comparer (n) » (comparer des levures : l'écran Levure, au choix ouvert). */}
                <button type="button" data-role="ajouter-levure" aria-pressed={retenue}
                  aria-label={retenue ? `Ne plus retenir ${y.nom}` : `Retenir ${y.nom}`}
                  onClick={() => setRetenues((m) => (m.includes(y.id) ? m.filter((x) => x !== y.id) : [...m, y.id]))}
                  className="touch-target pq-sg-sur-axe w-11 h-11 rounded-full flex items-start justify-center">
                  <span className={`flex items-center justify-center w-10 h-10 rounded-full border-[2.5px] ${retenue ? 'pq-suggerer-choisi' : 'border-cave-50 text-cave-50 bg-cave-950'}`}>
                    <i aria-hidden="true" className={retenue ? 'pq-suggerer-coche' : 'pq-suggerer-plus'} />
                  </span>
                </button>
              </div>
              <div className="pt-1 pb-1.5" data-role="barres-voie">
                <Divergent objectifs={objectifs} effets={l.effets} hors={l.hors} niveau={() => 'sf'} echelle={echelle} cran={cran} bande={bande} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
