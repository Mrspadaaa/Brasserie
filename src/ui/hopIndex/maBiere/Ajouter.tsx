// Les ajouts proposés, hors du rail (base v4.10 ; commun.js : zoneAjouts, rapidesVisibles, rapideLigne, goutBouton ;
// D29, D41) : le champ « Ajouter — houblon… », puis les houblons que le moteur propose, chacun à son moment suggéré
// (pastille en pointillé), sa dose, ce qu'il ajoute en IBU, ses arômes en couleur, le stock en icône (D23 ter), et le
// goût du brasseur (♡ : aimer · neutre · exclure ; exclu, il ne se propose plus). Les propositions viennent du moteur,
// comme dans sa base : `quickAdds` (QUICK_ADD_RULE : le stock d'abord, puis un houblon du catalogue, à acheter) ; une
// recette vide est construite comme un brasseur (`buildFromEmpty`, CONSTRUCTION_RULE : deux amérisants à 60′ au choix,
// « ou », dosés au milieu de la bande d'IBU du style, puis trois aromatiques). Autant de propositions que de place :
// 5 pour une recette vide, puis 3, 2, 1. Le champ cherche dans tout le catalogue, pas seulement le stock (D21 : « je
// fais une recette puis ensuite j'achète les ingrédients, souvent pas présent »).
import { useDeferredValue, useMemo, useRef, useState } from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
import { Input, type InputElement } from '../../Input';
import { COULEURS, nombre } from './commun';
import { useOuvrir } from './hote';
import { useNavigation } from './hote';
import { useGestes } from './hote';
import { nouvelId, placer } from '../parcours/operations';
import type { AjoutParcours, RecetteParcours } from '../parcours/types';
import { donnees, houblon, ibuAjout, style } from '../parcours/adaptateur';
import type { QuickAdd } from '../../../domain/hopIndex/v4';
import { buildFromEmpty, hopRole, quickAdds } from '../parcours/v4';
import { AlphaLu, StockIcone, titreUsage } from './briques';
import { useGestesFiche } from './gestesFiche';
import { BoutonLegende } from './LegendeGroupe';
import { useEtatCartes } from './carteOuverte';
import { BandeOuverte, effetSiAjoute, LignesV2a, TonsV2a } from './legende-bande';
import { libelleDe, momentLong, valeurDe } from './Frise';
import { MarquesCatalogue, useCataloguePlein } from '../fiche/marques';
import { cataloguePleinCharge } from '../../../domain/hopIndex/v4/data';

type Gout = 'aimer' | 'neutre' | 'exclure';
/** Mes goûts (base : ETAT.gouts), pour la page : un houblon exclu ne se propose plus. */
const GOUTS = new Map<string, Gout>();

interface Proposition { cle: string; ajout: AjoutParcours; alternative: boolean; statut: 'stock' | 'manque' | 'epuise' | 'catalogue' }

const cleRecette = (r: RecetteParcours) => JSON.stringify([r.styleCode, r.volumeL, r.og, r.boilMin, r.yeastId, r.additions]);
const memoire = new Map<string, ReturnType<typeof quickAdds>>();
function propositionsMoteur(r: RecetteParcours) {
  // La clé lit aussi le catalogue (317 puis 505) et le stock des données courantes : un stock qui change (snapshot) ou les ajouts qui arrivent refont les propositions.
  const k = cleRecette(r) + (cataloguePleinCharge() ? ':plein:' : ':base:') + donnees().stock.map((s) => `${s.key}=${s.grams}`).join(',');
  if (!memoire.has(k)) {
    if (memoire.size > 24) memoire.clear();
    memoire.set(k, quickAdds(r, style(r.styleCode), donnees().degustation?.tasting ?? null, { catalogueLimit: 10000, aromatique: true }));
  }
  return memoire.get(k)!;
}
const statutDe = (q: QuickAdd): Proposition['statut'] => (q.stock.status === 'à acheter' ? 'catalogue' : q.stock.status === 'épuisé' ? 'epuise' : q.stock.status === 'manque' ? 'manque' : 'stock');
const momentDe = (m: string) => (m === 'b60' ? 60 : 10);

export function Ajouter({ recette, onGeste, onAjout, champRef }: {
  recette: RecetteParcours; onGeste: () => void; onAjout: (id: string) => void; champRef: React.RefObject<InputElement | null>;
}) {
  const gestes = useGestes();
  // c7 : les variétés ajoutées arrivent au repos ; la recherche et les propositions se recalculent à leur arrivée.
  const pleinVu = useCataloguePlein();
  const ouvrir = useOuvrir();
  const { route } = useNavigation();
  const fiche = useGestesFiche((cle) => { if (route.ecran !== 'fiche') ouvrir({ ecran: 'fiche', houblon: cle }); });
  const [cherche, setCherche] = useState('');
  // La légende leg3-v2a (D140) : la bande d'une ligne s'ouvre case à case sous ses pastilles (toucher la bande, ou le « ? »
  // pour la première ligne). D169 : une seule carte dépliée dans toute l'étape (les cartes du rail comprises), fermée quand on
  // change de vue : l'état est celui de l'étape (carteOuverte.tsx), l'identifiant d'une ligne est `rapide:<clé>`.
  const { etat: etatCartes, poser } = useEtatCartes();
  const bandeOuverte = etatCartes?.bande && etatCartes.id.startsWith('rapide:') ? etatCartes.id.slice(7) : null;
  const legende = !!etatCartes?.legende && bandeOuverte != null;
  const setBandeOuverte = (cle: string | null) => poser(cle ? { id: `rapide:${cle}`, bande: true, legende: false } : null);
  const basculerLegende = () => poser(legende ? null : liste[0] ? { id: `rapide:${liste[0].cle}`, bande: true, legende: true } : null);
  // L'appui long sur les carrés ouvre toujours la fiche : seul un toucher court ouvre la bande.
  const appuiBande = useRef(0);
  const [goutOuvert, setGoutOuvert] = useState<string | null>(null);
  const [, maj] = useState(0);
  // D40 point 1 : une recette vide à l'ouverture (sa page cas-k2) se construit (buildFromEmpty) ; vidée par « retirer », elle
  // garde les propositions aromatiques de sa base, à 10′ (quickAdds aromatique : jamais de compensation à 60′).
  const videOuverture = useRef(recette.additions.length === 0);
  const sc = style(recette.styleCode);
  const ebu = recette.boilMin;
  // D134 (« il y a un peu de délai pour "sortir" du mode rail ») : les propositions reclassent tout le catalogue (66 ms
  // à chaque recette nouvelle). Elles se recalculent après la première image de la recette nouvelle (useDeferredValue) :
  // le rail sort au lever du doigt, les propositions suivent aussitôt. Mêmes fonctions, mêmes résultats.
  const recetteProposee = useDeferredValue(recette);
  const calculees = useMemo((): Proposition[] => {
    const recette = recetteProposee;
    const pris = new Set(recette.additions.map((a) => a.hopKey));
    const ok = (cle: string) => !pris.has(cle) && GOUTS.get(cle) !== 'exclure';
    const poser = (cle: string, grams: number, minutes: number, alternative: boolean, statut: Proposition['statut']): Proposition => ({
      cle, alternative, statut,
      ajout: placer({ id: nouvelId(recette, cle), hopKey: cle, grams, moment: 'b10' }, { type: 'ebullition', minutes: Math.min(ebu, minutes) }, recette),
    });
    const q = cherche.trim().toLowerCase();
    if (q) {
      // Le champ : tout le catalogue du moteur (stock, épuisés, à acheter), classé par la même règle.
      const m = propositionsMoteur(recette);
      return [...m.disponibles, ...m.epuises, ...m.catalogue].filter((r) => ok(r.key) && r.name.toLowerCase().includes(q)).slice(0, 4)
        .map((r) => poser(r.key, r.dose?.grams ?? 10, momentDe(r.moment), false, statutDe(r)));
    }
    if (!recette.additions.length && videOuverture.current) {
      const c = buildFromEmpty(recette, sc);
      const stock = (s: { etat: string }): Proposition['statut'] => (/hors stock/.test(s.etat) ? 'catalogue' : /épuis/.test(s.etat) ? 'epuise' : 'stock');
      const amers = c.amerisants.filter((r) => ok(r.key) && r.dose);
      // Un amérisant choisi retire l'autre (au choix).
      const choisi = c.amerisants.some((r) => pris.has(r.key));
      return [...(choisi ? [] : amers.map((r) => poser(r.key, r.dose!.grams, 60, true, stock(r.stock)))),
        ...c.aromatiques.filter((r) => ok(r.key)).map((r) => poser(r.key, r.dose.grams, momentDe(r.moment), false, stock(r.stock)))].slice(0, 5);
    }
    // Propositions selon la place : 3, 2, 1 ; au-delà, le champ reste. Le stock d'abord, puis un houblon à acheter.
    // Vidée par « retirer » : les cinq de sa base (capture etat-etape-retirer-choisie : Motueka, Citra cryo, Cascade, Target, Saaz Late).
    const n = recette.additions.length ? Math.max(0, 4 - recette.additions.length) : 5;
    if (!n) return [];
    const m = propositionsMoteur(recette);
    const st = m.disponibles.filter((r) => ok(r.key)), ca = m.catalogue.filter((r) => ok(r.key)).slice(0, 1);
    return [...st.slice(0, n - ca.length), ...ca].map((r) => poser(r.key, r.dose?.grams ?? 10, momentDe(r.moment), false, statutDe(r)));
  }, [recetteProposee, cherche, ebu, sc, pleinVu, donnees().stock]); // eslint-disable-line react-hooks/exhaustive-deps
  // Le temps d'un rendu, la liste vient de la recette d'avant : un houblon que la recette vient de prendre n'y paraît pas.
  const liste = useMemo(() => {
    const pris = new Set(recette.additions.map((a) => a.hopKey));
    return calculees.filter((p) => !pris.has(p.cle));
  }, [calculees, recette]);
  const premierMarque = liste[0]?.cle;
  return (
    <section data-element="etape-ajouter" data-role="ajouts-proposes" data-etat={recette.additions.length ? undefined : 'etat-etape-cas-k2-vide'}
      aria-label="Ajouter un houblon" className="space-y-1 pt-1.5">
      {!recette.additions.length && videOuverture.current && <JaugeVide recette={recette} />}
      <div className="flex items-center gap-1">
        {/* Le champ protégé de l'app (audit_inputs : pas d'accessoire Android) ; au doigt, une ligne de textarea, d'où py-2 et
            leading-6 : le texte reste centré dans ses 40 px comme dans le champ natif. */}
        <Input ref={champRef} inputMode="search" value={cherche} onChange={(e) => setCherche(e.target.value)} placeholder="Ajouter — houblon…"
          data-etat="etat-etape-champ-ajouter" aria-label="Ajouter un houblon : stock ou catalogue"
          className="flex-1 min-w-0 h-10 px-4 py-2 leading-6 rounded-full border border-cave-700 bg-cave-900 text-base text-cave-50 placeholder:text-cave-400" />
        {liste.length > 0 && <BoutonLegende ouverte={legende} onBasculer={basculerLegende} groupe="les icônes des ajouts proposés" controle="pq-ma-biere-legende-rapides" />}
      </div>
      <ul className="space-y-1" aria-label="Ajouts proposés par le moteur, chacun à son moment suggéré">
        {liste.flatMap((p, k) => {
          const h = houblon(p.cle);
          const v = valeurDe(p.ajout, recette);
          const ibu = ibuAjout(p.ajout, { ...recette, additions: [...recette.additions, p.ajout] }).ibu;
          const ibuTxt = ibu ? `+${nombre(ibu.valeur)} IBU` : 'IBU inconnu';
          const gout = GOUTS.get(p.cle) ?? 'neutre';
          const ouvert = goutOuvert === p.cle;
          const ouvreBande = bandeOuverte === p.cle;
          const li = (
            <li key={p.cle} data-role="ajout-rapide" data-houblon-ajout={p.cle} data-etat={p.cle === 'beermaverick-citra:cryo' ? 'etat-fiche-appui-long-citra etat-acquis-fiche-citra-cryo' : undefined} {...fiche.appui(p.cle)}
              className={`relative flex items-center gap-2 pl-1.5 pr-1 py-1 rounded-lg bg-cave-900 border border-cave-800 ${ouvreBande ? 'flex-wrap' : ''}`}>
              <span onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                <button type="button" data-role="ajout-rapide-plus" data-etat={k === 0 ? 'etat-etape-ajout-rapide' : undefined}
                  aria-label={`Ajouter ${h.nom}, ${nombre(p.ajout.grams, p.ajout.grams % 1 ? 1 : 0)} g, suggéré à ${momentLong(v, ebu)} : ${ibuTxt}`}
                  onClick={() => { onGeste(); gestes.ajouter('recette', p.ajout); onAjout(p.ajout.id); setCherche(''); }}
                  className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-cave-50" style={{ color: 'rgb(var(--cave-950))' }}><Plus className="w-4 h-4" aria-hidden="true" /></button>
              </span>
              <span className="flex-1 min-w-0 space-y-0.5">
                <span className="flex items-center gap-x-1.5 flex-wrap min-w-0">
                  <span data-houblon={h.cle} {...fiche.nom(h.cle)} className="shrink-0 font-semibold text-[15px] leading-5 text-cave-50 underline decoration-dotted decoration-cave-600 underline-offset-4">{h.nom}</span>
                  <AlphaLu h={h} mode="court" />
                  <UsageMot cle={h.cle} />
                  {p.statut === 'catalogue' ? <ShoppingCart role="img" aria-label="à acheter" className="w-3.5 h-3.5 text-cave-400 shrink-0" /> : <StockIcone h={h} />}
                  <MarquesCatalogue cle={h.cle} />
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-sm text-cave-200">{nombre(p.ajout.grams, p.ajout.grams % 1 ? 1 : 0)}<span className="font-sans text-cave-400">{' '}g</span> {ibu ? `+${nombre(ibu.valeur)}` : '?'}<span className="font-sans text-cave-400">{' '}IBU</span></span>
                  {!ouvreBande && <span role="img" aria-label={`Arômes de ${h.nom}`} data-role="bande" className="ml-auto inline-flex items-center gap-px cursor-pointer"
                    onPointerDown={() => { appuiBande.current = Date.now(); }} onClick={(e) => { e.stopPropagation(); if (Date.now() - appuiBande.current < 450) setBandeOuverte(p.cle); }}>
                    {sc.order.map((f) => {
                      const n = h.familles[f].niveau;
                      return <i key={f} className="block w-2 h-2.5 rounded-sm" style={{ background: n === 'non décrit' ? 'rgb(var(--cave-800))' : COULEURS[f].base, opacity: n === 'cité' ? 0.55 : 1 }} />;
                    })}
                  </span>}
                  {/* « Plus utilisé les icône hors 16d » (24.10, soir) : le ◇ des mots hors des 12 familles, en treizième case
                      de la bande (dessin, pas texte : la ligne ne grandit pas, D5, D41) ; ses mots au toucher. */}
                  {!ouvreBande && h.motsSansFamille.length > 0 && (
                    <svg role="img" data-houblon-hors={h.cle} aria-label={`hors des 12 familles : ${h.motsSansFamille.join(', ')}`} viewBox="0 0 10 10" width="10" height="10" className="shrink-0 -ml-1 text-cave-200">
                      <title>{h.motsSansFamille.join(', ')}</title>
                      <path d="M5 0.8 L9.2 5 L5 9.2 L0.8 5 Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </span>
              <span data-role="quand" title={`Moment suggéré : ${libelleDe(v)}`}
                className="inline-flex items-center justify-center min-w-[3rem] h-8 px-2 rounded-full border-2 border-dashed border-cave-600 font-mono text-sm font-semibold text-cave-50">{libelleDe(v)}</span>
              <span className="relative" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                <button type="button" data-role="gout" data-etat={p.cle === premierMarque ? 'etat-etape-gout-coeur' : undefined}
                  aria-expanded={ouvert} aria-label={`Mon goût pour ${h.nom} : ${gout}`}
                  onClick={() => setGoutOuvert(ouvert ? null : p.cle)}
                  className="w-8 h-9 inline-flex items-center justify-center text-cave-400">
                  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className={gout === 'aimer' ? 'text-cave-50' : ''}>
                    <path d="M8 14s-5.5-3.3-5.5-7.2C2.5 4.6 4 3.2 5.6 3.2c1 0 1.9.5 2.4 1.3.5-.8 1.4-1.3 2.4-1.3 1.6 0 3.1 1.4 3.1 3.6C13.5 10.7 8 14 8 14z"
                      fill={gout === 'aimer' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                </button>
                {ouvert && (
                  <span role="group" aria-label={`Mon goût pour ${h.nom}`}
                    className="pq-mb-gout absolute right-full top-1/2 -translate-y-1/2 mr-1 z-30 inline-flex gap-0.5 p-1 rounded-full border border-cave-700 bg-cave-950 shadow-lg">
                    {(['aimer', 'neutre', 'exclure'] as Gout[]).map((c) => (
                      <button key={c} type="button" aria-pressed={gout === c}
                        onClick={() => { if (c === 'neutre') GOUTS.delete(p.cle); else GOUTS.set(p.cle, c); setGoutOuvert(null); maj((x) => x + 1); }}
                        className={`h-8 px-3 rounded-full text-sm whitespace-nowrap ${gout === c ? 'bg-cave-50 font-semibold' : 'text-cave-200'}`}
                        style={gout === c ? { color: 'rgb(var(--cave-950))' } : undefined}>{c}</button>
                    ))}
                  </span>
                )}
              </span>
              {ouvreBande && (
                <div className="pq-mb-lg-li" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <BandeOuverte h={h} ordre={sc.order} onFermer={() => setBandeOuverte(null)} />
                  <LignesV2a h={h} siAjoute={{ moment: libelleDe(v), effet: effetSiAjoute(p.ajout, recette) }} />
                  <TonsV2a />
                  {legende && (
                    <div id="pq-ma-biere-legende-rapides" data-role="legende" className="pq-mb-lg-legende">
                      <p className="pq-mb-lg-reste">
                        <span><b className="pq-mb-lg-plus">+</b> ajouter</span>
                        <span><b className="pq-mb-lg-quand">{libelleDe(v)}</b> proposé</span>
                        <span>en stock, à acheter</span>
                        <span>♡ goût</span>
                        <span><b>◇</b> hors des 12 familles</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
          const ou = p.alternative && liste[k + 1]?.alternative ? <li key={p.cle + '-ou'} aria-hidden="true" className="pl-11 -my-0.5 text-sm text-cave-400">ou</li> : null;
          return ou ? [li, ou] : [li];
        })}
        {cherche.trim() && !liste.length && <li className="px-2 text-sm text-cave-400">aucun houblon du catalogue à ce nom</li>}
      </ul>
      {[...GOUTS].some(([, g]) => g !== 'neutre') && (
        <p aria-label="Mes goûts" className="flex items-center gap-1.5 flex-wrap text-sm text-cave-400">Mes goûts
          {[...GOUTS].map(([cle, g]) => (
            <button key={cle} type="button" onClick={() => { GOUTS.delete(cle); maj((x) => x + 1); }} aria-label={`${houblon(cle).nom} ${g === 'aimer' ? 'aimé' : 'exclu'}, remettre neutre`}
              className="h-7 px-2 rounded-full border border-cave-700 text-cave-200">{g === 'aimer' ? '♥' : '⊘'} {houblon(cle).nom}</button>
          ))}
        </p>
      )}
    </section>
  );
}

/** L'usage en mot, comme les ajouts de sa base (« double », « aromatique », « amérisant ») : D90. */
function UsageMot({ cle }: { cle: string }) {
  const r = hopRole(cle);
  return <span data-role="usage" data-usage={r.value ?? 'inconnu'} data-source={/^fournisseur/.test(r.source) ? 'fournisseur' : 'règle'} title={titreUsage(r.source)}
    className="text-xs text-cave-400 whitespace-nowrap">{r.value ?? 'usage ?'}</span>;
}

/** Recette vide : la jauge d'IBU à vide face à la bande du style (base : noteIbu). */
function JaugeVide({ recette }: { recette: RecetteParcours }) {
  const b = style(recette.styleCode).ibu;
  if (!b) return null;
  const [lo, hi] = b, max = hi + (hi - lo), pc = (v: number) => `${(2 + Math.max(0, Math.min(1, v / max)) * 96).toFixed(2)}%`;
  return (
    <div role="img" aria-label={`IBU 0 face à la bande du style, ${lo} à ${hi}`} className="relative h-6">
      <i className="absolute top-2 h-2 rounded-full bg-cave-800" style={{ left: '2%', width: '96%' }} />
      <i className="absolute top-2 h-2 bg-cave-600" style={{ left: pc(lo), width: `${(((hi - lo) / max) * 96).toFixed(2)}%` }} />
      <i className="absolute top-0.5 w-1 h-5 -ml-0.5 rounded-sm" style={{ left: pc(0), background: '#c2410c' }} />
    </div>
  );
}
