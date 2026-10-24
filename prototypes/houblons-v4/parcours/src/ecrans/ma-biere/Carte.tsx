// La carte d'un ajout posée sur le rail (base v4.10, consolide/index.html ; etape-consolide.js, blocRail) : nom (appui
// long → fiche), type (« ébullition ⟳ », « whirlpool ⟳ », « à froid ⟳ », « premier moût ⟳ »), dose « − 46 g + » au pas
// de 2 g, × ; α (lot d'abord), usage (« double », le mot de sa base, r7), stock en icône, signal de la famille marquée (« résine 2/4 »),
// ce que l'ajout fait bouger s'il vient d'être ajouté (« floral +1 »), IBU de l'ajout recalculé en direct (« aucun
// IBU » à froid) ; bande des 12 familles en couleur, avec, sous chaque famille que l'ajout fait bouger d'au moins
// 0,5 point, un trait de son intensité en crans du style (D80) ; les réglages qui restent sur la carte : la durée du
// whirlpool (« − 20 min + ») et le jour à froid (« − J+3 + ») ; à froid en fermentation, la biotransformation
// possible et ses signaux (géraniol, thiols, hop creep : yeastSignals du moteur). La ligne entière (poignée + carte)
// est [data-role="ligne-houblon"] dans Frise.tsx ; ici, le corps de la carte. Pendant le geste, le corps se réduit à
// son nom (classes pq-mb-leve et pq-mb-jeton de la ligne, ma-biere.css).
import { useMemo, useRef, useState } from 'react';
import { Minus, Plus, RotateCw, X } from 'lucide-react';
import { COULEURS, COURT, Inconnu, nombre } from '../../commun';
import { useOuvrir } from '../../coquille/ouvrir';
import { useNavigation } from '../../coquille/navigation';
import { useGestes } from '../../etat/EtatParcours';
import { placer, quandDe } from '../../etat/operations';
import type { AjoutParcours, Quand, RecetteParcours } from '../../etat/types';
import { houblon, lireBiere, style, type BiereLue } from '../../moteur';
import { additionEffect, FAMILY_NAMES, yeastSignals, type FamilyId } from '../../../../src/engine';
import { AlphaLu, Autres, StockIcone, Usage } from '../fiche/briques';
import { useGestesFiche } from '../fiche/gestes';
import { BoutonLegende, useLegende } from './LegendeGroupe';
import { BandeOuverte, LignesV2a, TonsV2a } from './legende-bande';
import { nomLevureBase } from './Base';
import { WP_MINUTES, J_MAX } from './rail';
import { useModifier } from './Frise';

const SEUIL = 0.5;
const COURT_SIGNAL: Partial<Record<FamilyId, string>> = { resin: 'résine', herbal: 'herbe', earthy: 'terre', spice: 'épice', stoneFruit: 'noyau', pomeFruit: 'pépins', tropical: 'tropical', citrus: 'agrumes' };
const PAS_DOSE = 2;

/** Les familles qu'un ajout fait bouger d'au moins 0,5 point : ma bière avec et sans lui (D80) ; et le changement de
 * crans du style de ma bière (l'effet prévu de la base, « floral +1 »). */
export function effetDe(recette: RecetteParcours, a: AjoutParcours, avec: BiereLue) {
  const sans = lireBiere({ ...recette, additions: recette.additions.filter((x) => x.id !== a.id) });
  const r = {} as Partial<Record<FamilyId, { e: number; crans: number; delta: number }>>;
  for (const f of Object.keys(avec.profil) as FamilyId[]) {
    const x = avec.profil[f].valeur, y = sans.profil[f].valeur, c = avec.profil[f].crans, c0 = sans.profil[f].crans;
    if (x && y && c != null && Math.abs(x.centre - y.centre) >= SEUIL) r[f] = { e: x.centre - y.centre, crans: c, delta: c0 == null ? 0 : Math.round(c) - Math.round(c0) };
  }
  return r;
}

const typeDe = (q: Quand) => (q.type === 'ebullition' ? 'ébullition' : q.type === 'whirlpool' ? 'whirlpool' : q.type === 'premierMout' ? 'premier moût' : 'à froid');
/** ⟳ comme sa base (TYPES) : ébullition → whirlpool (80 °C, 20 min) → à froid (fermentation, J+3) → premier moût → ébullition. */
function typeSuivant(a: AjoutParcours, r: RecetteParcours): AjoutParcours {
  const q = quandDe(a, r);
  if (q.type === 'ebullition') return placer(a, { type: 'whirlpool' }, r);
  if (q.type === 'whirlpool') return { ...placer(a, { type: 'dryhop', phase: 'actif', jours: 3 }, r), day: 3 };
  if (q.type === 'dryhop') return placer(a, { type: 'premierMout' }, r);
  return placer(a, { type: 'ebullition', minutes: r.boilMin }, r);
}

/** Un réglage qui reste sur la carte (base : reglage) : « − valeur + », deux boutons de part et d'autre. */
function Reglage({ libelle, valeur, moins, plus }: { libelle: string; valeur: string; moins: (() => void) | null; plus: (() => void) | null }) {
  const b = 'pq-mb-regl-b w-7 h-7 inline-flex items-center justify-center rounded-full border border-cave-700 text-cave-200 disabled:opacity-35';
  return (
    <span role="group" aria-label={libelle} className="inline-flex items-center gap-0.5">
      <button type="button" aria-label={`${libelle} : moins`} disabled={!moins} onClick={() => moins?.()} className={b}><Minus className="w-3.5 h-3.5" aria-hidden="true" /></button>
      <span className="min-w-[2.6rem] text-center font-mono text-sm text-cave-50 tabular-nums whitespace-nowrap">{valeur}</span>
      <button type="button" aria-label={`${libelle} : plus`} disabled={!plus} onClick={() => plus?.()} className={b}><Plus className="w-3.5 h-3.5" aria-hidden="true" /></button>
    </span>
  );
}

export function Carte({ a, recette, biere, repere, nouveau, premier, onGeste }: {
  a: AjoutParcours; recette: RecetteParcours; biere: BiereLue; repere: string | null; nouveau: boolean; premier: boolean; onGeste: () => void;
}) {
  const ouvrir = useOuvrir();
  const { route } = useNavigation();
  const gestes = useGestes();
  const modifier = useModifier();
  const h = houblon(a.hopKey);
  const sc = style(recette.styleCode);
  const fiche = useGestesFiche((cle) => { if (route.ecran !== 'fiche') ouvrir({ ecran: 'fiche', houblon: cle }); });
  const q = quandDe(a, recette);
  const ibu = biere.ibuParAjout[a.id];
  const effet = useMemo(() => effetDe(recette, a, biere), [recette, a, biere]);
  const nonSimule = biere.nonSimules.find((x) => x.ajoutId === a.id);
  const signaux = useMemo(() => (q.type === 'dryhop' && q.phase === 'actif' ? yeastSignals(a, recette)?.signaux ?? [] : []), [a, recette, q.type, q.type === 'dryhop' && q.phase]);
  // Signal : la famille la plus citée par les fiches, entourée de rouge si elle est hors du style dans ma bière.
  const signal = sc.order.filter((f) => h.familles[f].niveau !== 'non décrit')
    .sort((x, y) => (biere.profil[y].horsStyle ? 1 : 0) - (biere.profil[x].horsStyle ? 1 : 0) || h.familles[y].fiches - h.familles[x].fiches)[0];
  // L'effet prévu d'un ajout qui vient d'entrer (base : effetTag, build.mjs effetEtabli) : l'effet établi du moteur pour cet
  // ajout (additionEffect, sur la recette sans lui), en crans du style arrondis ; la famille attendue qui bouge d'abord.
  // D40 point 2 : « floral +1 » pour Motueka à 10′, comme sa base (le décompte des crans du profil disait « ≈ inchangé »).
  const effetMoteur = useMemo(() => (nouveau ? additionEffect(a as never, { ...recette, additions: recette.additions.filter((x) => x.id !== a.id) } as never) : null), [nouveau, a, recette]);
  const effetTag = (() => {
    if (!nouveau) return null;
    if (nonSimule || !effetMoteur) return { texte: 'effet non établi', long: 'non établi' };
    const crans = (f: FamilyId) => { const e = (effetMoteur as Record<string, { established: boolean; central: number | null }>)[f]; return e && e.established && e.central != null ? Math.round(Math.round((e.central / sc.families[f].cran) * 100) / 100) : 0; };
    const effet = Object.fromEntries(sc.order.map((f) => [f, { delta: crans(f) }])) as Record<FamilyId, { delta: number }>;
    const fs = sc.order.filter((f) => effet[f].delta !== 0);
    const f = fs.find((x) => sc.families[x].status === 'attendue') ?? fs[0];
    if (!f) return { texte: '≈ inchangé', long: '≈ inchangé' };
    const d = effet[f]!.delta;
    return { texte: `${COURT[f].toLowerCase()} ${d > 0 ? '+' : '−'}${Math.abs(d)}`, long: `${FAMILY_NAMES[f]} ${d > 0 ? '+' : '−'}${Math.abs(d)} cran${Math.abs(d) > 1 ? 's' : ''}` };
  })();
  // Seules les commandes (boutons) gardent leur geste ; le reste de la carte garde l'appui long (D49).
  const surBouton = (e: React.SyntheticEvent) => !!(e.target as Element).closest('button');
  const stop = { onPointerDown: (e: React.PointerEvent) => { if (surBouton(e)) e.stopPropagation(); }, onClick: (e: React.MouseEvent) => { if (surBouton(e)) e.stopPropagation(); } };
  // D112 : comme la base, le nom se remplit pendant l'appui (500 ms), retour visible dès le doigt posé.
  const [presse, setPresse] = useState(false);
  const appui = fiche.appui(a.hopKey, () => ouvrir({ ecran: 'dryhopper', ajout: a.id })) as Record<string, (e: never) => void>;
  const relache = () => setPresse(false);
  const gesteCarte = {
    ...appui,
    onPointerDown: (e: React.PointerEvent) => { appui.onPointerDown?.(e as never); if (e.button <= 0 && !surBouton(e)) setPresse(true); },
    onPointerUp: (e: React.PointerEvent) => { appui.onPointerUp?.(e as never); relache(); },
    onPointerCancel: (e: React.PointerEvent) => { appui.onPointerCancel?.(e as never); relache(); },
    onPointerLeave: (e: React.PointerEvent) => { appui.onPointerLeave?.(e as never); relache(); },
  };
  const [legende, basculerLegende] = useLegende();
  // D140 : leg3-v2a telle quelle. Toucher la bande l'ouvre (bande, lignes, tons) ; le « ? » l'ouvre aussi, avec la ligne des
  // autres icônes en plus (v2a.html).
  const [bandeTouchee, setBandeTouchee] = useState(false);
  // L'appui long sur les carrés ouvre toujours la fiche (D111) : seul un toucher court ouvre la bande.
  const appuiBande = useRef(0);
  const ouverte = bandeTouchee || legende;
  const fermer = () => { setBandeTouchee(false); if (legende) basculerLegende(); };
  const idLegende = `pq-ma-biere-legende-${a.id}`;
  const bouton = 'w-7 h-7 inline-flex items-center justify-center rounded-full border border-cave-700 text-cave-200';
  const doser = (d: number) => { onGeste(); gestes.dose('recette', a.id, Math.max(0, Math.round((a.grams + d) * 10) / 10)); };
  const minutesWp = a.minutes ?? 20;
  const iWp = WP_MINUTES.indexOf(minutesWp);
  const jour = a.day ?? 3;
  const regler = (f: (x: AjoutParcours) => AjoutParcours) => { onGeste(); modifier(a.id, f); };
  return (
    <div data-element="etape-carte-ajout" data-voie={a.id} data-houblon-ligne={a.hopKey} data-etat={premier ? 'etat-fiche-appui-long-carte etat-fiche-appui-en-cours etat-fiche-survol-1280' : undefined}
      {...gesteCarte}
      className={`pq-mb-corps pq-ma-biere-carte pq-ma-biere-sans-selection relative min-w-0 px-2.5 pt-1.5 pb-2 space-y-1 rounded-lg ${repere ? 'pq-ma-biere-change' : ''}`}>
      {repere && <p data-role="vient-de-changer" className="pq-mb-l2 pq-ma-biere-repere text-xs leading-none">{repere}</p>}
      {/* « Ça créé un slider horizontal ??? À enlever » (24.10, soir, Falconer's Flight) : un nom long renvoie la dose à la
          ligne, jamais au-delà de la carte. */}
      <div className="pq-mb-l1 flex flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0">
        <span data-role="ouvrir-fiche" data-houblon={a.hopKey} {...fiche.nom(a.hopKey)}
          className={`pq-mb-nom-h shrink-0 font-semibold text-base text-cave-50 underline decoration-dotted decoration-cave-600 underline-offset-4 ${presse ? 'pq-ma-biere-appui' : ''}`}>{h.nom}</span>
        <span className="pq-mb-avec" />
        <span className="pq-mb-type" {...stop}>
          <button type="button" data-role="type-ajout" data-etat={premier ? 'etat-etape-type-whirlpool' : undefined}
            aria-label={`Type d'ajout : ${typeDe(q)}, toucher pour passer au suivant`}
            onClick={() => { onGeste(); modifier(a.id, typeSuivant); }}
            className="inline-flex items-center gap-1 h-7 px-2 rounded-full border border-cave-700 text-sm text-cave-200 whitespace-nowrap">
            <span data-etat={premier ? 'etat-etape-type-froid' : undefined}>{typeDe(q)}</span><RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </span>
        <span className="pq-mb-pas ml-auto inline-flex items-center gap-1 shrink-0" {...stop}>
          <button type="button" data-role="dose-moins" data-etat={premier ? 'etat-etape-dose-moins' : undefined} aria-label={`Retirer ${PAS_DOSE} g de ${h.nom}`} onClick={() => doser(-PAS_DOSE)} className={bouton}>
            <Minus className="w-4 h-4" aria-hidden="true" /></button>
          <output data-role="dose" className="min-w-[2.5rem] text-center font-mono font-semibold text-base text-cave-50 tabular-nums">{nombre(a.grams, a.grams % 1 ? 1 : 0)}<span className="font-sans font-normal text-sm text-cave-400">{' '}g</span></output>
          <button type="button" data-role="dose-plus" data-etat={premier ? 'etat-etape-dose-plus' : undefined} aria-label={`Ajouter ${PAS_DOSE} g de ${h.nom}`} onClick={() => doser(PAS_DOSE)} className={bouton}>
            <Plus className="w-4 h-4" aria-hidden="true" /></button>
          <button type="button" data-role="retirer" data-etat={premier ? 'etat-etape-retirer' : undefined} aria-label={`Retirer ${h.nom} de la recette`} onClick={() => { onGeste(); gestes.retirer('recette', a.id); }}
            className="w-6 h-7 inline-flex items-center justify-center text-cave-400"><X className="w-4 h-4" aria-hidden="true" /></button>
        </span>
      </div>
      <div className="pq-mb-l2 flex items-center gap-x-1.5 gap-y-1 flex-wrap min-w-0">
        <AlphaLu h={h} mode="court" />
        <Usage h={h} mot />
        <StockIcone h={h} />
        {signal && (
          <span data-role="signal" className={`inline-flex items-center h-6 px-2 rounded-full border-2 text-sm whitespace-nowrap ${biere.profil[signal].horsStyle ? 'border-alert text-alert' : 'border-cave-700 text-cave-200'}`}>
            {COURT_SIGNAL[signal] ?? COURT[signal].toLowerCase()} {h.familles[signal].fiches}/{h.familles[signal].sur}
          </span>
        )}
        {effetTag && <span data-role="effet" aria-label={`Effet prévu : ${effetTag.long}`} className="inline-flex items-center h-6 px-2 rounded-full bg-cave-850 text-sm font-semibold text-cave-50 whitespace-nowrap">{effetTag.texte}</span>}
        <span className="ml-auto font-mono text-sm whitespace-nowrap">
          {q.type === 'dryhop'
            ? <span className="font-sans text-cave-400">aucun IBU</span>
            : ibu.ibu
              ? <><output data-role="ibu-ajout" data-valeur={ibu.ibu.valeur.toFixed(2)} className="text-cave-50">{nombre(ibu.ibu.valeur)}</output><span className="font-sans text-cave-400">{' '}IBU</span></>
              : <><Inconnu raison={ibu.raison ?? 'inconnu'} /><span className="font-sans text-cave-400">{' '}IBU</span></>}
        </span>
      </div>
      <div className="pq-mb-l3 flex items-center gap-x-2 gap-y-1 flex-wrap min-w-0">
        {/* Légende leg3-v2a (D140) : toucher la bande l'ouvre case à case ; dessous, les lignes de v2a, puis la rangée des tons
            avec « ? » et « Sans X › ». */}
        {ouverte && <BandeOuverte h={h} ordre={sc.order} onFermer={fermer}
          effet={Object.fromEntries(Object.entries(effet).map(([f, e]) => [f, { crans: e!.crans, hors: biere.profil[f as FamilyId].horsStyle }]))} />}
        {ouverte && <LignesV2a h={h} />}
        {ouverte && <TonsV2a />}
        {!ouverte && <span role="img" aria-label={`Arômes de ${h.nom}`} data-role="bande" className="inline-flex items-start gap-0.5 shrink-0 cursor-pointer"
          onPointerDown={() => { appuiBande.current = Date.now(); }} onClick={(e) => { e.stopPropagation(); if (Date.now() - appuiBande.current < 450) setBandeTouchee(true); }}>
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
        </span>}
        {nonSimule && q.type !== 'dryhop' && <span className="inline-flex items-center gap-1 text-xs text-cave-400"><Inconnu raison={nonSimule.raison} />arôme</span>}
        {h.partSansFamille != null && h.partSansFamille >= 0.25 && <Autres h={h} largeur={48} petit />}
        <span className="ml-auto inline-flex items-center gap-1" {...stop}>
          {q.type === 'whirlpool' && (
            <Reglage libelle="Durée du whirlpool" valeur={`${minutesWp} min`}
              moins={iWp > 0 ? () => regler((x) => ({ ...x, minutes: WP_MINUTES[iWp - 1], tempC: x.tempC ?? 80 })) : null}
              plus={iWp >= 0 && iWp < WP_MINUTES.length - 1 ? () => regler((x) => ({ ...x, minutes: WP_MINUTES[iWp + 1], tempC: x.tempC ?? 80 })) : null} />
          )}
          {q.type === 'dryhop' && (
            <Reglage libelle="Jour du houblonnage à froid" valeur={`J+${jour}`}
              moins={jour > 0 ? () => regler((x) => ({ ...x, day: jour - 1 })) : null}
              plus={jour < J_MAX ? () => regler((x) => ({ ...x, day: jour + 1 })) : null} />
          )}
          {q.type !== 'whirlpool' && q.type !== 'dryhop' && (
            <>
              <BoutonLegende ouverte={legende} onBasculer={basculerLegende} groupe={`les icônes de la carte de ${h.nom}`} controle={idLegende} />
              <button type="button" data-role="pont-substituer" data-houblon={a.hopKey} onClick={() => ouvrir({ ecran: 'substituer', houblon: a.hopKey })}
                className="h-7 px-2 rounded-full text-xs font-semibold text-cave-200 underline decoration-dotted underline-offset-4 whitespace-nowrap">
                Sans {h.nom} <span aria-hidden="true">›</span>
              </button>
            </>
          )}
        </span>
      </div>
      {q.type === 'dryhop' && q.phase === 'actif' && (
        <div className="pq-mb-bio flex items-center gap-1 flex-wrap" data-role="biotransformation"
          aria-label={`Avec ${nomLevureBase(recette.yeastId)} : biotransformation possible, non quantifiée`}>
          <span className="inline-flex items-center h-6 px-2 rounded-full border border-cave-600 text-xs text-cave-200 whitespace-nowrap">biotransformation possible, non quantifiée</span>
          {signaux.map((s) => (
            <span key={s.id} title={`${s.titre} : ${s.statut}`} aria-label={`${s.titre.split(' : ')[0]} : ${s.statut}`}
              className={`inline-flex items-center h-6 px-2 rounded-full text-xs whitespace-nowrap ${s.statut === 'possible' ? 'bg-cave-850 text-cave-50' : 'border border-dashed border-cave-600 text-cave-400'}`}>
              {({ 'geraniol-citronellol': 'géraniol', thiols: 'thiols', 'hop-creep': 'hop creep' } as const)[s.id]}
            </span>
          ))}
        </div>
      )}
      {(q.type === 'whirlpool' || q.type === 'dryhop') && (
        <div className="pq-mb-l3 flex items-center justify-end gap-1" {...stop}>
          <BoutonLegende ouverte={legende} onBasculer={basculerLegende} groupe={`les icônes de la carte de ${h.nom}`} controle={idLegende} />
          <button type="button" data-role="pont-substituer" data-houblon={a.hopKey} onClick={() => ouvrir({ ecran: 'substituer', houblon: a.hopKey })}
            className="h-7 px-2 rounded-full text-xs font-semibold text-cave-200 underline decoration-dotted underline-offset-4 whitespace-nowrap">
            Sans {h.nom} <span aria-hidden="true">›</span>
          </button>
        </div>
      )}
      {/* Le « ? » : la ligne des autres icônes de la carte, sous la rangée (v2a.html). */}
      <div id={idLegende} data-role="legende" hidden={!legende} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} className="pq-mb-lg-legende">
        <p className="pq-mb-lg-reste">
          <span><RotateCw className="w-3.5 h-3.5" aria-hidden="true" /> type</span>
          <span><b>− g +</b> {PAS_DOSE} g</span>
          <span><b>×</b> retirer</span>
          <span><b className="pq-mb-lg-pill">{COURT_SIGNAL[signal ?? 'resin'] ?? 'résine'} {signal ? `${h.familles[signal].fiches}/${h.familles[signal].sur}` : ''}</b> la plus citée</span>
          <span><b>α</b> du lot</span>
          <span>en stock</span>
          <span><b className="pq-mb-lg-inc">?</b> inconnu</span>
        </p>
      </div>
    </div>
  );
}
