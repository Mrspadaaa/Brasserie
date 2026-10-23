// Suggérer, « Quel houblon ajouter à ma bière ? » — q2b (choix du brasseur, 19.10 soir), tel qu'intégré dans la
// base v4.10, porté dans le socle et calculé en direct (moteur v4, `suggerer`).
// Un seul facteur libre : le houblon (L10, D98). Base, dose, moment et levure sont fixés sur la ligne de contexte.
// En tête, les objectifs (« Plus floral », et chaque famille déjà hors style à baisser) avec la piste l5b (D92).
// Puis une voie par houblon du stock : usage en mot (D80, D90), nom, α du lot (D87), stock en icône, gain sur la
// famille visée, sa barre sur la piste de l'objectif, puis le résineux et les autres familles en traits par cran
// (D76, D80). Le « + » l'ajoute à la comparaison (D78) ; « Comparer les N » ouvre Comparer avec les choisis.
// L'appui long sur une voie ouvre la fiche du houblon (composant de src/ecrans/fiche, D25, D49).
import { useEffect, useMemo, useRef, useState } from 'react';
import { CadreOutil, COULEURS, COURT, Legende, LigneContexte, Picto, Pont, ROUE, Inconnu, nombre, signe, type Echelle } from '../../commun';
import { useNavigation } from '../../coquille/navigation';
import { useOuvrir } from '../../coquille/ouvrir';
import type { Route } from '../../coquille/routes';
import { CONDITIONS, VISEE, nomLevure } from '../../donnees/cas';
import { useBiere, useRecette } from '../../etat/EtatParcours';
import { style, suggerer, type Candidat } from '../../moteur';
import type { FamilyId } from '../../../../src/engine';
import Fiche, { useGestesFiche } from '../fiche';
import { AlphaCourt, Calme, CaseInconnue, Lentille, Piste, Stock, Traits, Usage, domaine, position, type Domaine } from './briques';
import './suggerer.css';

/** Le « + » mène à Comparer, qui montre quatre colonnes au plus (r6a : trois, puis « + » pour une 4ᵉ). */
const MAX_CHOISIS = 4;
/** Instantané du moteur (même état de départ) pour controle-autres-ajouts, lu depuis son dossier de cas (voir NOTE). */
const CAS_DIRECT = '../../../../../../prototypes/houblons-v4/parcours/src/ecrans/suggerer/cas-direct';

/** « Muet » : le moteur rend un écart exactement nul partout alors que les fiches citent des familles (Citra cryo :
 * huile du cryo non relevée). C'est un inconnu, pas un zéro : l'écran le dit (hachuré, « ? »), jamais « +0 ». */
function estMuet(c: Candidat): boolean {
  const connus = ROUE.filter((f) => c.lu.ecart[f] != null);
  return connus.length > 0 && connus.every((f) => c.lu.ecart[f]!.bas === 0 && c.lu.ecart[f]!.haut === 0)
    && ROUE.some((f) => c.houblon.familles[f].niveau !== 'non décrit');
}
const raisonMuet = (c: Candidat) => c.lu.apres.confiance.pourquoi.find((x) => x.startsWith(c.houblon.nom)) ?? 'le moteur ne sait pas simuler ce houblon';

interface Objectif { f: FamilyId; sens: 1 | -1; avant: number | null; visee: number | null }

export default function Suggerer() {
  const recette = useRecette();
  const biere = useBiere(recette);
  const ouvrir = useOuvrir();
  const { aller, route } = useNavigation();
  const sc = style(recette.styleCode);
  const candidats = useMemo(() => suggerer(recette, VISEE.famille), [recette]);
  const [echelle, setEchelle] = useState<Echelle>('style');
  // Proposés au départ : les trois meilleurs sur la visée qui ne sont pas des amérisants (on ne dry hoppe pas un
  // amérisant). Le brasseur en retire ou en ajoute d'un toucher.
  const [choisis, setChoisis] = useState<string[]>(() => candidats.filter((c) => c.houblon.role.mot !== 'amérisant' && (c.visee?.centre ?? 0) > 0).slice(0, 3).map((c) => c.cle));
  const basculer = (cle: string) => setChoisis((l) => (l.includes(cle) ? l.filter((x) => x !== cle) : l.length < MAX_CHOISIS ? [...l, cle] : l));

  // Objectifs : la visée du brasseur (+1 cran), puis chaque famille déjà au-dessus du style (−1 cran).
  const objectifs: Objectif[] = useMemo(() => {
    const viser = (f: FamilyId, sens: 1 | -1): Objectif => {
      const avant = biere.profil[f].valeur?.centre ?? null;
      return { f, sens, avant, visee: avant == null ? null : Math.max(0, avant + sens * sc.families[f].cran) };
    };
    const trop = ROUE.filter((f) => f !== VISEE.famille && biere.profil[f].horsStyle === 'au-dessus');
    return [viser(VISEE.famille, VISEE.sens), ...trop.map((f) => viser(f, -1))];
  }, [biere, sc]);
  const cibles = new Set(objectifs.map((o) => o.f));
  // Familles qu'aucun houblon ne sait faire bouger (la bière n'y a pas de valeur : écart inconnu partout) : dites une
  // fois, hachurées, plutôt que quatre cases hachurées par voie.
  const inconnues = ROUE.filter((f) => !cibles.has(f) && candidats.every((c) => c.lu.ecart[f] == null));
  const extras = ROUE.filter((f) => !cibles.has(f) && !inconnues.includes(f));
  const apres = (c: Candidat, f: FamilyId) => (estMuet(c) ? null : c.lu.apres.profil[f].valeur?.centre ?? null);
  const domaines = useMemo(() => Object.fromEntries(objectifs.map((o) => [o.f, domaine(o.f, sc, echelle,
    [o.avant ?? 0, o.visee ?? 0, ...candidats.map((c) => apres(c, o.f) ?? 0)])])) as Record<FamilyId, Domaine>, [objectifs, candidats, sc, echelle]);

  // Fiche à l'appui long : une entrée d'historique (le retour du téléphone la ferme), Suggérer reste ouvert dessous.
  const [fiche, setFiche] = useState<string | null>(null);
  const routeFiche = useRef<Route | null>(null);
  const ouvrirFiche = (cle: string) => {
    if (!fiche) { const r: Route = { ecran: 'suggerer' }; routeFiche.current = r; aller(r); }
    setFiche(cle);
  };
  // Les gestes de la fiche, communs à tous les écrans (voie p1) : appui long sur toute la voie, survol long du nom.
  const gestesFiche = useGestesFiche(ouvrirFiche);
  useEffect(() => { if (fiche && route !== routeFiche.current) setFiche(null); }, [route, fiche]);

  // Cas lu par controle-autres-ajouts (D76) : l'instantané du moteur pour cet état de départ.
  useEffect(() => { document.body.dataset.cas = CAS_DIRECT; return () => { delete document.body.dataset.cas; }; }, []);

  const fv = VISEE.famille;
  const dv = domaines[fv];
  const ov = objectifs[0];
  return (
    <CadreOutil ecran="suggerer" question="Quel houblon ajouter à ma bière ?"
      contexte={<LigneContexte items={[
        { cle: 'base', contenu: `Stout ${sc.code}` },
        { cle: 'dose', contenu: `${nombre(CONDITIONS.doseGL)} g/L` },
        { cle: 'moment', contenu: `après ${CONDITIONS.jours} j` },
        { cle: 'levure', contenu: nomLevure(recette.yeastId) },
      ]} />}
      dock={<Pont nom="comparer" disabled={choisis.length < 2}
        onClick={() => ouvrir({ ecran: 'comparer', houblons: candidats.filter((c) => choisis.includes(c.cle)).map((c) => c.cle) })}>
        Comparer les {choisis.length}
      </Pont>}>
      <div className="flex items-center justify-between gap-2">
        <Legende>
          <p><b>Traits</b> sous un picto : un trait par cran du style gagné, un demi-trait pour moins d’un cran ; en contour si la famille baisse ; orangés si elle sort du style.</p>
          <p><b>Piste</b> : la zone pâle est le style 16D, le rond est ma bière, la barre la bière après le houblon ; le pointillé, la visée (+1 cran).</p>
          <p><b>Usage</b> : amérisant, aromatique ou mixte, selon le fournisseur ; en pointillé, déduit de l’α (règle à valider).</p>
          <p><b>α</b> du lot en stock ; <b>≠</b> : il sort de la plage des fiches. Icône de stock : coche, assez pour 4 g/L ; moins, pas assez.</p>
          <p>~ : simulé par le moteur ; hachuré : inconnu, jamais zéro. Appui long sur un houblon : sa fiche. Quatre houblons au plus dans Comparer.</p>
        </Legende>
        <Lentille echelle={echelle} onChange={setEchelle} />
      </div>

      <section data-role="reponse" aria-label="Objectifs" className="space-y-2.5 px-2 pt-1">
        {objectifs.map((o) => {
          const d = domaines[o.f];
          const valeurs = candidats.map((c) => apres(c, o.f)).filter((x): x is number => x != null);
          const meilleur = valeurs.length ? (o.sens > 0 ? Math.max(...valeurs) : Math.min(...valeurs)) : null;
          const atteignent = o.visee == null ? [] : candidats.filter((c) => { const x = apres(c, o.f); return x != null && (o.sens > 0 ? x >= o.visee! : x <= o.visee!); });
          const atteints = atteignent.length;
          const baisse = o.sens < 0 && o.avant != null && valeurs.some((x) => x < o.avant!);
          const marques = candidats.filter((c) => choisis.includes(c.cle) && apres(c, o.f) != null).map((c) => ({ cle: c.cle, x: apres(c, o.f)! }));
          return (
            <div key={o.f} data-role="objectif" data-objectif={o.f} className="grid grid-cols-[1fr_2.75rem] gap-x-1.5">
              <div className="min-w-0 space-y-1">
                <p className="flex items-center gap-1.5 text-sm leading-tight">
                  <Picto famille={o.f} taille={16} />
                  <b style={{ color: COULEURS[o.f].texte }}>{o.sens > 0 ? 'Plus' : 'Moins'} {COURT[o.f].toLowerCase()}</b>
                  <span className="ml-auto text-xs whitespace-nowrap">
                    {o.sens > 0
                      ? atteints > 0
                        ? <span className="text-cave-200">atteinte par {atteints === 1 ? <b className="font-semibold">{atteignent[0].houblon.nom}</b> : atteints}</span>
                        : <span className="text-cave-400">pas atteinte</span>
                      : baisse ? <span className="text-cave-200">baisse possible</span> : <span className="pq-suggerer-hors font-semibold">aucun houblon ne le baisse</span>}
                  </span>
                </p>
                <span className={`relative block pt-3`}>
                  {o.visee != null && <span aria-hidden="true" className="pq-suggerer-visee-mot absolute top-0 -translate-x-1/2 text-[0.625rem] leading-none text-cave-400" style={{ left: position(o.visee, d) }}>{o.sens > 0 ? 'visée +1 cran' : ''}</span>}
                  <Piste f={o.f} d={d} barre={meilleur} avant={o.avant} visee={o.visee} marques={marques} epaisse />
                </span>
              </div>
            </div>
          );
        })}
        {inconnues.length > 0 && (
          <p data-role="inconnues" className="flex items-center gap-1 text-xs text-cave-400">
            {inconnues.map((f) => (
              <span key={f} data-inconnu="" role="img" aria-label={`${COURT[f]} : inconnu`} className="pq-suggerer-inconnue inline-flex">
                <Picto famille={f} taille={14} nomme={false} />
              </span>
            ))}
            <span>inconnus</span>
          </p>
        )}
      </section>

      <div className="relative">
        {/* La visée traverse la liste (q2b) : le pointillé sous lequel chaque barre se lit d'un coup d'œil. */}
        {ov.visee != null && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-2 right-[3.625rem]">
            <i className="pq-suggerer-ligne-visee absolute inset-y-0" style={{ left: position(ov.visee, dv) }} />
          </span>
        )}
        <ul data-libre="houblon" data-role="candidats" aria-label="Houblons à comparer" className="relative divide-y divide-cave-800">
          {candidats.map((c, i) => (
            <Voie key={c.cle} n={i + 1} c={c} choisi={choisis.includes(c.cle)} plein={!choisis.includes(c.cle) && choisis.length >= MAX_CHOISIS}
              onBasculer={() => basculer(c.cle)} gestesFiche={gestesFiche}
              fv={fv} dv={dv} avantV={ov.avant} echelle={echelle} cibles={objectifs.filter((o) => o.f !== fv).map((o) => o.f)} extras={extras} cran={(f) => sc.families[f].cran} />
          ))}
        </ul>
      </div>
      {fiche && <Fiche houblon={fiche} />}
    </CadreOutil>
  );
}

function Voie({ n, c, choisi, plein, onBasculer, gestesFiche, fv, dv, avantV, echelle, cibles, extras, cran }: {
  n: number; c: Candidat; choisi: boolean; plein: boolean; onBasculer: () => void; gestesFiche: ReturnType<typeof useGestesFiche>;
  fv: FamilyId; dv: Domaine; avantV: number | null; echelle: Echelle; cibles: FamilyId[]; extras: FamilyId[]; cran: (f: FamilyId) => number;
}) {
  const h = c.houblon;
  const muet = estMuet(c);
  const ecartDe = (f: FamilyId) => (muet ? null : c.lu.ecart[f]);
  const ev = ecartDe(fv);
  const crans = (f: FamilyId) => { const e = ecartDe(f); return e ? e.centre / cran(f) : null; };
  const hors = (f: FamilyId) => c.lu.apres.profil[f].horsStyle != null;
  const cv = crans(fv);
  const caseDe = (f: FamilyId, role: 'extra' | 'cible') => {
    const e = ecartDe(f);
    if (!e) return muet && h.familles[f].niveau === 'non décrit' ? <Calme key={f} /> : <CaseInconnue key={f} f={f} />;
    if (Math.abs(e.centre) < 0.5) return <Calme key={f} />;
    return <Traits key={f} f={f} crans={crans(f)!} hors={hors(f)} role={role} />;
  };
  return (
    <li data-voie={n} data-role="ligne-houblon" data-candidat={c.cle} {...(choisi ? { 'data-choisi': '' } : {})} {...(muet ? { 'data-muet': '' } : {})} {...gestesFiche.appui(c.cle)}
      className={`pq-suggerer-voie grid grid-cols-[1fr_2.75rem] items-center gap-x-1.5 px-2 py-1.5 select-none ${choisi ? 'pq-suggerer-voie-choisie' : ''}`}>
      <div className="min-w-0 space-y-1">
        <p className="flex items-center gap-1.5 min-w-0 leading-tight">
          <span data-houblon={h.cle} data-role="ouvrir-fiche" {...gestesFiche.nom(h.cle)} className={`truncate text-[0.9375rem] text-cave-50 ${choisi ? 'font-bold' : 'font-semibold'}`}>{h.nom}</span>
          <AlphaCourt h={h} />
          <Usage h={h} />
          <Stock stock={h.stock} besoin={c.besoin} />
          <span data-role="gain" className="ml-auto shrink-0 text-sm font-semibold">
            {ev == null || cv == null
              ? <Inconnu raison={muet ? raisonMuet(c) : 'écart inconnu sur la famille visée'} />
              : echelle === 'style'
                ? <span data-simule="" data-unite="crans" className="font-mono tabular-nums" style={{ color: COULEURS[fv].texte }}>{`~${signe(cv, 1)}`}</span>
                : <span data-simule="" data-unite="points" className="font-mono tabular-nums" style={{ color: COULEURS[fv].texte }}>{`~${signe(ev.centre, 0)}`}</span>}
          </span>
        </p>
        <span className="block" {...(ev && cv != null ? { 'data-role': 'cible', 'data-famille': fv, 'data-crans': cv.toFixed(2) } : {})}>
          <Piste f={fv} d={dv} barre={ev ? (avantV ?? 0) + ev.centre : null} avant={avantV} inconnu={ev ? null : muet ? raisonMuet(c) : 'écart inconnu sur la famille visée'} />
        </span>
        <span className="flex items-center gap-0.5" aria-label="Effet sur les autres familles">
          {cibles.map((f) => caseDe(f, 'cible'))}
          {cibles.length > 0 && <i aria-hidden="true" className="pq-suggerer-separe mx-1 self-stretch" />}
          {extras.map((f) => caseDe(f, 'extra'))}
        </span>
      </div>
      <button type="button" data-role="ajouter" aria-pressed={choisi} disabled={plein}
        aria-label={choisi ? `Retirer ${h.nom} de la comparaison` : `Ajouter ${h.nom} à la comparaison`}
        onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onBasculer(); }}
        className="touch-target justify-self-end w-11 h-11 rounded-full disabled:opacity-30">
        <span className={`flex items-center justify-center w-9 h-9 rounded-full border-2 ${choisi ? 'pq-suggerer-choisi' : 'border-cave-50 text-cave-50'}`}>
          <i aria-hidden="true" className={choisi ? 'pq-suggerer-coche' : 'pq-suggerer-plus'} />
        </span>
      </button>
    </li>
  );
}
