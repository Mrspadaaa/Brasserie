// Le pied de la fiche, celui de flu2b (« le footer doit être aussi avec tout ces informations comme 4 · Les cartes de
// famille · flu2b », 24.10) : sous ♡ ⊘ Comparer, « Styles › · Huiles › · Sources › · Substituts › » ; un toucher déplie
// l'un (et replie l'autre) dans le flux de la fiche, sous la matrice ; un second le replie (consolide NOTE § 5, D25, D49 ;
// relevé p21a, états etat-fiche-styles… -substituts). Tout ce que le dépôt sait du houblon y est, à un toucher (la fiche
// exhaustive qu'il demande : « la carte du houblons doit bien contenir de façon exhaustive TOUTES ses informations ») :
// Styles : où un fournisseur range ce houblon, et sa source. Huiles : l'huile totale par fiche et leur accord, ses
// composants avec leur source, la classe de thiols de Hopsteiner. Sources : α et β de chaque fiche datée et leur accord,
// mon lot et mon stock (articles, d'où vient l'α), dans ma recette, l'origine et les alias, les auteurs de chaque famille
// (et qui la nomme en premier), les descripteurs de Beer Maverick et les textes des autres fiches tels qu'écrits.
// Substituts : les remplaçants du même calcul que l'outil Substituer (lireRemplacants, D35 : la fiche et u4 ne classent
// jamais autrement les mêmes houblons ; huit, comme g1), au moment de l'ajout, ou sans moment hors de ma recette (comme
// la matrice), et le pont « Remplacer › » vers cet outil quand il est dans ma recette. L'inconnu s'écrit « ? » ou
// « non renseigné », jamais 0 (D65). Classes préfixées pq-fiche- (L26).
import { useEffect, useRef, useState } from 'react';
import { Package } from 'lucide-react';
import { nombre } from './commun';
import { Pont } from '../Pont';
import { nomMoment, ibuAjout, type HoublonLu } from '../parcours/adaptateur';
import { quandDe } from '../parcours/quand';
import { useRemplacants } from '../substituer/donnees';
import type { AjoutParcours, RecetteParcours } from '../parcours/types';
import { ibuByMoment } from '../parcours/v4';
import type { SourcesFiche } from './sources';
import { ContenuSources, Etiquettes, LienUrl, NomPlage, Rangee, pl } from './SourcesFiche';

export type Section = 'styles' | 'huiles' | 'sources' | 'substituts';
const TITRES: [Section, string][] = [['styles', 'Styles'], ['huiles', 'Huiles'], ['sources', 'Sources'], ['substituts', 'Substituts']];
/** L'état des replis, partagé par les quatre boutons du pied et la section dépliée dans le flux. */
export function useReplis() {
  const [ouverte, setOuverte] = useState<Section | null>(null);
  return { ouverte, basculer: (id: Section) => setOuverte((o) => (o === id ? null : id)) };
}

/** Les quatre boutons du pied de flu2b, sous ♡ ⊘ Comparer. D135 (« Substitut doit tout de suite ouvrir l'onglet ») :
 * pour un houblon de ma recette, « Substituts › » ouvre Substituer ; hors de ma recette, la liste se déplie ici. */
export function ReplisBoutons({ h, ouverte, basculer, onRemplacer }: { h: HoublonLu; ouverte: Section | null; basculer: (id: Section) => void; onRemplacer: (() => void) | null }) {
  return (
    <div data-element="g1-replis" data-etat="etat-fiche-bas" role="group" aria-label="Détail de la fiche" className="pq-fiche-plus">
      {TITRES.map(([id, titre]) => {
        const on = ouverte === id;
        const outil = id === 'substituts' && onRemplacer;
        const label = id === 'substituts' ? `Ouvrir les remplaçants de ${h.nom}` : `${on ? 'Replier' : 'Déplier'} ${titre.toLowerCase()}`;
        return (
          <button key={id} type="button" data-etat={`etat-fiche-${id}`} aria-label={label}
            {...(outil ? { 'data-role': 'pont-substituer-fiche', 'data-outil': 'Substituer' } : { 'aria-expanded': on, 'aria-controls': 'pq-fiche-repli' })}
            onClick={() => (outil ? onRemplacer() : basculer(id))} className={`pq-fiche-plus-b${on ? ' pq-fiche-plus-on' : ''}`}>
            <span>{titre} <span aria-hidden="true" className={`inline-block ${on ? 'rotate-90' : ''}`}>›</span></span>
          </button>
        );
      })}
    </div>
  );
}

/** La section dépliée, dans le flux de la fiche, sous la matrice. */
export function Replis({ h, cle, s, recette, ouverte, onRemplacer }: {
  h: HoublonLu; cle: string; s: SourcesFiche; recette: RecetteParcours; ouverte: Section | null; onRemplacer: (() => void) | null;
}) {
  const zone = useRef<HTMLDivElement | null>(null);
  // Déplié : la section vient sous le doigt (g1 : scrollIntoView « nearest »).
  useEffect(() => { if (ouverte) zone.current?.querySelector('section')?.scrollIntoView({ block: 'nearest' }); }, [ouverte]);
  const ajouts = recette.additions.filter((a) => a.hopKey === cle);
  const ajout = ajouts[0] ?? null;
  // Hors de ma recette, les remplaçants sans moment (contexte « défaut » du moteur), comme la matrice.
  const pour = ajout ?? ({ id: `fiche-${cle}`, hopKey: cle } as unknown as AjoutParcours);
  // D40 point 3 (D35) : les remplaçants de u4, du même calcul que Substituer (lireRemplacants) : huit, rangés par le pire cas,
  // la plage dessinée quand une composante est inconnue (« 79 ▨ 99 »), Zenia comprise.
  const liste = useRemplacants(recette, ouverte === 'substituts' ? pour : null)?.candidats ?? [];
  const lot = h.alpha && !/^plage/.test(h.alpha.source) ? h.alpha.valeur : null;

  const contenu = (() => {
    switch (ouverte) {
      case 'styles': return (
        <>
          {s.styles.length ? <Etiquettes mots={s.styles} /> : <p className="text-sm text-cave-400">{s.stylesRaison}</p>}
          {s.usages.some((u) => u.source) && <p className="mt-1.5 text-sm text-cave-400">{s.usages.filter((u) => u.source).map((u, i) => <span key={i}>{i > 0 ? ' ; ' : ''}<LienUrl nom={u.source!} url={u.url && /^https?:\/\//i.test(u.url) ? u.url : null} /></span>)}</p>}
        </>
      );
      case 'huiles': return (
        <>
          <div className="divide-y divide-cave-800">
            {s.huileTotale.length ? s.huileTotale.map((x) => <Rangee key={x.source} nom={<>totale, <NomPlage x={x} /></>} valeur={`${pl(x)} mL/100 g`} />) : <Rangee nom="totale" valeur="non renseigné" />}
            {s.composants.map((c) => <Rangee key={c.nom} nom={c.nom} valeur={c.plage ? <>{pl(c.plage)} %, <NomPlage x={c.plage} /></> : c.raison ?? 'non renseigné'} />)}
            <Rangee nom="thiols, Hopsteiner" valeur={s.thiol ? `classe ${s.thiol}` : 'non publié'} />
          </div>
          {s.accord.huile && <p className="mt-1 text-xs text-cave-400">Huile totale : fiches {s.accord.huile}. Composants en % de l’huile.</p>}
        </>
      );
      case 'sources': return <ContenuSources h={h} cle={cle} s={s} recette={recette} />;
      case 'substituts': {
        const q = ajout ? quandDe(ajout, recette) : null;
        return (
          <>
            <p className="flex items-baseline justify-between gap-2 text-sm">
              <b className="font-semibold text-cave-50">{q ? `Remplaçants à ${nomMoment(q)}` : 'Remplaçants, hors de ma recette'}</b>
              <span className="text-xs text-cave-400 whitespace-nowrap">pire cas · 50 à 100</span>
            </p>
            {liste.length === 0
              ? <p className="mt-1 text-sm text-cave-400">Aucun remplaçant calculé.</p>
              : (
                <ol data-role="fiche-remplacants" aria-label={`Remplaçants de ${h.nom}${q ? ` à ${nomMoment(q)}` : ''}`} className="mt-1 divide-y divide-cave-800">
                  {liste.map((c) => {
                    const x = (v: number) => `${Math.max(0, Math.min(100, ((v - 50) / 50) * 100)).toFixed(1)}%`;
                    return (
                      <li key={c.cle} data-houblon-cle={c.cle} data-min={c.min} data-max={c.max} className="flex items-center gap-3 py-1.5">
                        <span className="w-[7.5rem] shrink-0 flex items-center gap-1 min-w-0">
                          <span className="truncate text-sm text-cave-50 font-semibold">{c.nom}</span>
                          {(c.stock === 'suffisant' || c.stock === 'insuffisant') && (
                            <Package role="img" aria-label={c.stock === 'insuffisant' ? 'en stock, pas assez pour la dose' : 'en stock'}
                              className={`w-3.5 h-3.5 shrink-0 ${c.stock === 'insuffisant' ? 'text-attention' : 'text-cave-400'}`} />
                          )}
                        </span>
                        <span aria-hidden="true" className="relative flex-1 h-2 rounded-full bg-cave-850">
                          <i className="absolute inset-y-0 left-0 rounded-full bg-cave-400" style={{ width: x(c.min) }} />
                          {c.max > c.min && <i className="pq-hachure absolute inset-y-0 rounded-r-full" style={{ left: x(c.min), width: `calc(${x(c.max)} - ${x(c.min)})` }} />}
                        </span>
                        <span className="w-14 shrink-0 text-right font-mono text-sm text-cave-50" title={`moteur ${c.moteur} (${c.palier})`}>
                          {c.min === c.max ? c.min : `${c.min}–${c.max}`}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            <p className="mt-1 text-xs text-cave-400">Comme dans Substituer : rangés par le pire cas ; hachuré, une composante inconnue (de 0 à 100). Scores de Beer Maverick non importés. Prix inconnu.</p>
            {onRemplacer && <div className="mt-2 flex justify-end"><Pont nom="remplacer-fiche" onClick={onRemplacer}>Remplacer {h.nom}</Pont></div>}
          </>
        );
      }
      default: return null;
    }
  })();

  return (
    <div ref={zone} id="pq-fiche-repli">
      {ouverte && <section aria-label={TITRES.find((t) => t[0] === ouverte)![1]} className="pt-2.5 pb-1 border-t border-cave-800">{contenu}</section>}
    </div>
  );
}
