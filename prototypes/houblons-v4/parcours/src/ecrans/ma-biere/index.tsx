// Ma bière, étape Houblons : le point d'entrée du parcours. Dans l'ordre du brasseur (penser-brasseur) :
// IBU, OG, EBC et l'alerte de dégustation ; les 12 familles au style (barres l5b, radar m4 à un toucher) ;
// puis chaque houblon : nom, α (lot d'abord), usage en mot, dose, moment glissé par 5′, IBU recalculé en
// direct, les familles qu'il fait bouger (crans du style) ; le stock en icône. Ponts : « + floral » → Suggérer,
// « Je n'ai pas <houblon> » → Substituer, la ligne d'un houblon → Dryhopper, la levure → l'étape Levure.
// Au retour d'un outil, ce qui vient de changer porte un repère discret (« nouveau », « à la place de… »,
// l'IBU d'avant, le rond « avant » sur les barres). Classes propres préfixées pq-ma-biere- (L26).
import { useMemo, useState } from 'react';
import { ChevronRight, Minus, Plus } from 'lucide-react';
import { BarreStyle, CadreRecette, Inconnu, Legende, Pont, Simule, nombre, type Echelle } from '../../commun';
import { ActionsCoquille, useOuvrir } from '../../coquille/ouvrir';
import { useNavigation } from '../../coquille/navigation';
import { useBiere, useGestes, useRecette } from '../../etat/EtatParcours';
import { quandDe } from '../../etat/operations';
import type { AjoutParcours, RecetteParcours } from '../../etat/types';
import { nomLevure } from '../../donnees/cas';
import { houblon, lireBiere, style, type BiereLue, type IbuLu } from '../../moteur';
import type { FamilyId } from '../../../../src/engine';
import { AlphaLu, Autres, Intensite, StockIcone, Usage } from '../fiche/briques';
import { useGestesFiche } from '../fiche/gestes';
import { Lentille } from './Lentille';
import { RadarBiere } from './RadarBiere';
import { useRepere } from './repere';
import { Rail } from './Rail';
import './ma-biere.css';

const ADJ: Record<FamilyId, string> = {
  resin: 'résineuse', herbal: 'herbacée', earthy: 'terreuse', floral: 'florale', spice: 'épicée', green: 'végétale',
  citrus: 'agrumée', tropical: 'tropicale', stoneFruit: 'fruitée', pomeFruit: 'fruitée', berries: 'fruitée', melon: 'fruitée',
};
const SEUIL = 0.5;

/** Les familles qu'un ajout fait bouger d'au moins 0,5 point : ma bière avec et sans lui (D80). */
function effetDe(recette: RecetteParcours, a: AjoutParcours, avec: BiereLue) {
  const sans = lireBiere({ ...recette, additions: recette.additions.filter((x) => x.id !== a.id) });
  return (Object.keys(avec.profil) as FamilyId[])
    .map((f) => {
      const x = avec.profil[f].valeur, y = sans.profil[f].valeur;
      return { f, e: x && y ? x.centre - y.centre : null, crans: avec.profil[f].crans };
    })
    .filter((x): x is { f: FamilyId; e: number; crans: number } => x.e != null && x.crans != null && Math.abs(x.e) >= SEUIL)
    .sort((p, q) => Math.abs(q.e) - Math.abs(p.e));
}

const memeAjout = (a: AjoutParcours, b: AjoutParcours) => JSON.stringify(a) === JSON.stringify(b);

function ibuTexte(i: IbuLu) {
  return i.ibu ? nombre(i.ibu.valeur) : null;
}

/** Une ligne de houblon de la recette : une « voie » (data-voie) au sens des contrôles. */
function LigneHoublon({ a, recette, biere, avant, onGeste }: {
  a: AjoutParcours; recette: RecetteParcours; biere: BiereLue; avant: RecetteParcours | null; onGeste: () => void;
}) {
  const ouvrir = useOuvrir();
  const { route } = useNavigation();
  const gestes = useGestes();
  const h = houblon(a.hopKey);
  const fiche = useGestesFiche((cle) => { if (route.ecran !== 'fiche') ouvrir({ ecran: 'fiche', houblon: cle }); });
  const q = quandDe(a, recette);
  const ibu = biere.ibuParAjout[a.id];
  const effet = useMemo(() => effetDe(recette, a, biere), [recette, a, biere]);
  const nonSimule = biere.nonSimules.find((x) => x.ajoutId === a.id);
  const avantA = avant?.additions.find((x) => x.id === a.id) ?? null;
  const repere = avant ? (!avantA ? 'nouveau' : avantA.hopKey !== a.hopKey ? `à la place de ${houblon(avantA.hopKey).nom}` : !memeAjout(avantA, a) ? 'changé' : null) : null;
  const stop = { onPointerDown: (e: React.PointerEvent) => e.stopPropagation(), onClick: (e: React.MouseEvent) => e.stopPropagation() };
  return (
    <li data-role="ligne-houblon" data-voie={a.id} data-ajout={a.id} data-houblon-ligne={a.hopKey}
      {...fiche.appui(a.hopKey, () => ouvrir({ ecran: 'dryhopper', ajout: a.id }))}
      className={`pq-ma-biere-ligne relative px-2.5 pt-1.5 pb-2 space-y-0.5 rounded-lg border bg-cave-900 ${repere ? 'pq-ma-biere-change border-cave-600' : 'border-cave-800'}`}>
      <div className="flex items-center gap-x-1.5 gap-y-0.5 flex-wrap">
        <span data-role="ouvrir-fiche" data-houblon={a.hopKey} {...fiche.nom(a.hopKey)}
          className="shrink-0 font-semibold text-base text-cave-50 underline decoration-dotted decoration-cave-600 underline-offset-4">{h.nom}</span>
        <AlphaLu h={h} />
        <Usage h={h} />
        <StockIcone h={h} />
        <span className="ml-auto inline-flex items-center shrink-0">
          <span className="text-right font-mono text-sm whitespace-nowrap">
            {ibuTexte(ibu) != null
              ? <><output data-role="ibu-ajout" data-valeur={ibu.ibu!.valeur.toFixed(2)} className="text-base font-semibold text-cave-50">{ibuTexte(ibu)}</output><span className="font-sans text-xs text-cave-400">{' '}IBU</span></>
              : <><Inconnu raison={ibu.raison ?? 'inconnu'} /><span className="font-sans text-xs text-cave-400">{' '}IBU</span></>}
          </span>
          <span {...stop}>
            <button type="button" data-role="pont-dryhopper" aria-label={"Dryhopper : le moment de " + h.nom} onClick={() => ouvrir({ ecran: 'dryhopper', ajout: a.id })}
              className="w-6 h-7 -mr-1 inline-flex items-center justify-center text-cave-400"><ChevronRight className="w-4 h-4" aria-hidden="true" /></button>
          </span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <Rail recette={recette} quand={q} nom={h.nom} onMoment={(m) => { onGeste(); gestes.moment('recette', a.id, m); }} />
        </div>
        <span className="inline-flex items-center shrink-0" {...stop}>
          <button type="button" data-role="dose-moins" aria-label={h.nom + " : 1 g de moins"} onClick={() => { onGeste(); gestes.dose('recette', a.id, a.grams - 1); }}
            className="w-7 h-7 inline-flex items-center justify-center rounded-full border border-cave-700 text-cave-200"><Minus className="w-3.5 h-3.5" aria-hidden="true" /></button>
          <output data-role="dose" className="min-w-[3.25rem] text-center font-mono text-sm text-cave-50 tabular-nums">{nombre(a.grams, 1)}<span className="font-sans text-cave-400">{' '}g</span></output>
          <button type="button" data-role="dose-plus" aria-label={h.nom + " : 1 g de plus"} onClick={() => { onGeste(); gestes.dose('recette', a.id, a.grams + 1); }}
            className="w-7 h-7 inline-flex items-center justify-center rounded-full border border-cave-700 text-cave-200"><Plus className="w-3.5 h-3.5" aria-hidden="true" /></button>
        </span>
      </div>
      <div className="flex items-center gap-1 flex-wrap min-h-[1.5rem]">
        {repere && <span data-role="vient-de-changer" className="pq-ma-biere-repere text-xs whitespace-nowrap">{repere}</span>}
        {effet.map((x) => <Intensite key={x.f} famille={x.f} crans={x.crans} signe={x.e > 0 ? 1 : -1} />)}
        {nonSimule && <span className="inline-flex items-center gap-1 text-xs text-cave-400"><Inconnu raison={nonSimule.raison} />arôme</span>}
        {h.partSansFamille != null && h.partSansFamille >= 0.25 && <Autres h={h} largeur={56} />}
        <span className="ml-auto" {...stop}>
          <button type="button" data-role="pont-substituer" data-houblon={a.hopKey} onClick={() => ouvrir({ ecran: 'substituer', houblon: a.hopKey })}
            className="min-h-[2rem] px-2.5 rounded-full border border-cave-700 bg-cave-850 text-xs font-semibold text-cave-50 whitespace-nowrap">
            Je n’ai pas {h.nom} <span aria-hidden="true">›</span>
          </button>
        </span>
      </div>
    </li>
  );
}

function Lectures({ biere, avant }: { biere: BiereLue; avant: BiereLue | null }) {
  const ibu = biere.ibu.valeur;
  const b = biere.bandeIbu;
  const max = b ? Math.max(b[1] * 1.4, ibu * 1.1) : ibu * 1.5;
  const pc = (x: number) => `${Math.max(0, Math.min(100, (x / max) * 100)).toFixed(1)}%`;
  const ibuAvant = avant && Math.abs(avant.ibu.valeur - ibu) >= 0.5 ? avant.ibu.valeur : null;
  return (
    <div data-role="lectures" className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-cave-800 bg-cave-900">
      <span className="inline-flex items-baseline gap-1.5">
        <span className="text-sm text-cave-400">IBU</span>
        <output data-role="ibu" data-valeur={ibu.toFixed(2)} className="reading text-xl">{nombre(ibu)}</output>
        {ibuAvant != null && <s data-role="vient-de-changer" className="font-mono text-xs text-cave-400">{nombre(ibuAvant)}</s>}
        {b && (
          <span aria-label={`style ${b[0]}–${b[1]} IBU`} role="img" className="relative self-center w-12 h-1.5 ml-1 rounded-full bg-cave-800">
            <i className="absolute inset-y-0 rounded-full bg-cave-600" style={{ left: pc(b[0]), width: `calc(${pc(b[1])} - ${pc(b[0])})` }} />
            <i className="absolute -top-1 -bottom-1 w-0.5 rounded-sm bg-cave-50" style={{ left: pc(ibu) }} />
          </span>
        )}
      </span>
      <span className="inline-flex items-baseline gap-1.5"><span className="text-sm text-cave-400">OG</span><span className="reading text-xl">{nombre(biere.og, 3)}</span></span>
      <span className="inline-flex items-baseline gap-1.5">
        <span className="text-sm text-cave-400">EBC</span>
        {biere.ebc == null ? <Inconnu raison="couleur non calculée" /> : <span className="reading text-xl">{nombre(biere.ebc)}</span>}
      </span>
    </div>
  );
}

export default function MaBiere() {
  const recette = useRecette();
  const biere = useBiere();
  const ouvrir = useOuvrir();
  const sc = style(recette.styleCode);
  const [vue, setVue] = useState<'barres' | 'radar'>('barres');
  const [echelle, setEchelle] = useState<Echelle>('style');
  // Ma bière est à l'écran sur sa route et sous la fiche ; la coquille ne la monte pas sous un outil plein écran.
  const { route } = useNavigation();
  const { avant, effacer } = useRepere(recette, route.ecran === 'ma-biere' || route.ecran === 'fiche');
  const biereAvant = useMemo(() => (avant ? lireBiere(avant) : null), [avant]);

  const trop = sc.order.filter((f) => biere.profil[f].horsStyle === 'au-dessus');
  const deguste = trop.some((f) => biere.profil[f].source === 'dégustation');
  // La levure : l'étape Levure de l'ajout à froid le plus récent (la biotransformation), sinon du premier ajout.
  const froids = recette.additions.filter((a) => quandDe(a, recette).type === 'dryhop');
  const ajoutLevure = (froids.at(-1) ?? recette.additions[0])?.id ?? null;
  const levureChangee = avant && avant.yeastId !== recette.yeastId;

  return (
    <CadreRecette titre={recette.name} sousTitre={`${sc.code} · ${nombre(recette.volumeL)} L · houblons`} actions={<ActionsCoquille />}>
      <div data-ecran="ma-biere" className="pq-ma-biere space-y-2 pb-4">
        <Lectures biere={biere} avant={biereAvant} />

        <div className="flex items-center gap-2 min-h-[2.25rem]">
          {trop.length > 0
            ? <p data-role="alerte" className="flex items-center gap-1.5 min-w-0 text-sm font-semibold text-alert">
                <span aria-hidden="true" className="w-2 h-2 rounded-full bg-alert shrink-0" />
                <span className="truncate">Trop {trop.map((f) => ADJ[f]).filter((x, k, t) => t.indexOf(x) === k).join(' et ')}{deguste ? ' · dégustée 18.10' : ''}</span>
              </p>
            : <p data-role="alerte" className="flex items-center gap-1.5 text-sm font-semibold text-hop"><span aria-hidden="true" className="w-2 h-2 rounded-full bg-hop" />Au style</p>}
          <span className="ml-auto shrink-0"><Pont nom="floral" onClick={() => ouvrir({ ecran: 'suggerer' })}>+ floral</Pont></span>
        </div>

        <div className="flex items-center gap-2">
          <Legende>
            <p><b>Barre</b> : ma bière, simulée (~) ; la famille dégustée part de ma dégustation.</p>
            <p><b>Zone grise</b> : la bande du style {sc.code} ; à droite, au-dessus du style.</p>
            <p><b>Rond</b> : ma bière avant le dernier changement. <b>Hachuré</b> : inconnu, jamais zéro.</p>
            <p><b>Rail</b> : glisser le moment, par 5′ à l’ébullition, puis whirlpool et dry hop en jours.</p>
            <p><b>Traits</b> : crans du style que la famille atteint avec ce houblon.</p>
          </Legende>
          <span className="ml-auto" />
          <Lentille label="Vue" marques="vue" value={vue} onChange={setVue} options={[{ value: 'barres', label: 'Barres' }, { value: 'radar', label: 'Radar' }]} />
          <Lentille label="Échelle" marques="e" value={echelle} onChange={setEchelle} options={[{ value: 'style', label: 'Au style' }, { value: 'absolu', label: 'Absolu' }]} />
        </div>

        <section data-role="profil" aria-label={`Profil, ${echelle === 'style' ? `au style ${sc.code}` : 'absolu'}`} className="px-2 py-1 rounded-lg border border-cave-800 bg-cave-900">
          {vue === 'barres'
            ? sc.order.map((f) => {
                const x = biere.profil[f], y = biereAvant?.profil[f];
                const d = x.valeur && y?.valeur ? x.valeur.centre - y.valeur.centre : null;
                return (
                  <BarreStyle key={f} apres={x} avant={d != null && Math.abs(d) >= SEUIL ? y : undefined} echelle={echelle}
                    valeur={d != null && Math.abs(d) >= SEUIL ? <Simule valeur={d} ecart couleur={x.horsStyle ? '#c2410c' : undefined} /> : undefined} />
                );
              })
            : <RadarBiere profil={biere.profil} avant={biereAvant?.profil} echelle={echelle} />}
          {biere.nonSimules.length > 0 && (
            <p data-role="non-simule" className="flex items-center gap-1.5 pt-1 text-xs text-cave-400">
              <Inconnu raison={biere.nonSimules.map((n) => n.raison).join(' ; ')} />
              arôme non simulé : {biere.nonSimules.map((n) => houblon(recette.additions.find((a) => a.id === n.ajoutId)?.hopKey ?? '').nom).join(', ')}
            </p>
          )}
        </section>

        <ul data-role="houblons-recette" aria-label="Houblons" className="space-y-1.5">
          {recette.additions.map((a) => <LigneHoublon key={a.id} a={a} recette={recette} biere={biere} avant={avant} onGeste={effacer} />)}
        </ul>

        {ajoutLevure && (
          <button type="button" data-role="pont-etape-levure" onClick={() => ouvrir({ ecran: 'levure', ajout: ajoutLevure })}
            className={`w-full flex items-center gap-2 min-h-[2.5rem] px-3 rounded-lg border bg-cave-900 text-left ${levureChangee ? 'pq-ma-biere-change border-cave-600' : 'border-cave-800'}`}>
            <span className="text-sm text-cave-400">levure</span>
            <span className="font-semibold text-cave-50">{nomLevure(recette.yeastId)}</span>
            {levureChangee && <span data-role="vient-de-changer" className="pq-ma-biere-repere text-xs">à la place de {nomLevure(avant!.yeastId)}</span>}
            <ChevronRight className="ml-auto w-4 h-4 text-cave-400" aria-hidden="true" />
          </button>
        )}
      </div>
    </CadreRecette>
  );
}
