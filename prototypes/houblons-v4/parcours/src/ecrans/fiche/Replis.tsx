// Le pied de g1 : « Styles › · Huiles › · Sources › · Substituts › », repliés ; un toucher déplie l'un (et replie
// l'autre), un second le replie (consolide NOTE § 5, D25, D49 ; relevé p21a, états etat-fiche-styles… -substituts).
// Styles : où un fournisseur range ce houblon. Huiles : l'huile totale et ses composants, avec leur source. Sources :
// d'où vient chaque valeur (α et β de chaque fiche, mon lot, l'origine, les auteurs de chaque famille). Substituts :
// les remplaçants au moment de l'ajout, sortis du même calcul que l'outil Substituer (remplacants du moteur, « en stock
// d'abord », même recette et même ajout : la fiche et u4 ne classent jamais autrement les mêmes houblons, D35 ; la fiche en
// montre 8 comme g1, u4 les 6 premiers), et le pont
// « Remplacer › » vers cet outil, qui reste tel quel (u4, D34). Classes préfixées pq-fiche- (L26).
import { useEffect, useRef, useState } from 'react';
import { Package } from 'lucide-react';
import { COURT, Picto, nombre, plage } from '../../commun';
import { Pont } from '../../commun/Pont';
import { nomMoment, remplacants, type HoublonLu, type Remplacant } from '../../moteur';
import { quandDe } from '../../etat/quand';
import type { RecetteParcours } from '../../etat/types';
import { nomSource, type PlageSource, type SourcesFiche } from './sources';

type Section = 'styles' | 'huiles' | 'sources' | 'substituts';
const TITRES: [Section, string][] = [['styles', 'Styles'], ['huiles', 'Huiles'], ['sources', 'Sources'], ['substituts', 'Substituts']];
const pl = (s: PlageSource) => plage(s.min, s.max, 1);

function Rangee({ nom, valeur }: { nom: string; valeur: string }) {
  return (
    <div className="pq-fiche-rangee flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <span className="text-cave-200 shrink-0 max-w-[55%]">{nom}</span>
      <span className="text-cave-50 text-right tabular-nums min-w-0">{valeur}</span>
    </div>
  );
}

function Etiquettes({ mots }: { mots: string[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {mots.map((m) => <span key={m} className="inline-flex items-center h-6 px-2 rounded-full bg-cave-850 border border-cave-800 text-sm text-cave-50">{m}</span>)}
    </span>
  );
}

/** Le score d'un remplaçant sur l'échelle de Substituer (50 à 100, paliers proche 65 et très proche 80). */
function Score({ r }: { r: Remplacant }) {
  const pc = (v: number) => `${Math.max(0, Math.min(100, ((v - 50) / 50) * 100)).toFixed(1)}%`;
  const inconnue = Object.values(r.composantes).some((x) => x == null);
  return (
    <span className="relative block h-4 flex-1 min-w-[5rem]" aria-hidden="true">
      <i className="absolute inset-x-0 top-1/2 h-px bg-cave-800" />
      <i className="absolute top-0 bottom-0 w-px bg-cave-700" style={{ left: pc(65) }} />
      <i className="absolute top-0 bottom-0 w-px bg-cave-700" style={{ left: pc(80) }} />
      <i className={`absolute top-1/2 w-2.5 h-2.5 -mt-[5px] -ml-[5px] rounded-full ${inconnue ? 'bg-cave-950 border-2 border-cave-200' : 'bg-cave-50'}`} style={{ left: pc(r.score) }} />
    </span>
  );
}

export function Replis({ h, cle, s, recette, onRemplacer }: {
  h: HoublonLu; cle: string; s: SourcesFiche; recette: RecetteParcours; onRemplacer: (() => void) | null;
}) {
  const [ouverte, setOuverte] = useState<Section | null>(null);
  const zone = useRef<HTMLDivElement | null>(null);
  // Déplié : la section vient sous le doigt (g1 : scrollIntoView « nearest »).
  useEffect(() => { if (ouverte) zone.current?.querySelector('section')?.scrollIntoView({ block: 'nearest' }); }, [ouverte]);
  const ajout = recette.additions.find((a) => a.hopKey === cle) ?? null;
  const liste = ouverte === 'substituts' && ajout ? remplacants(recette, ajout.id, 8) : [];
  const lot = h.alpha && !/^plage/.test(h.alpha.source) ? h.alpha.valeur : null;

  const contenu = (() => {
    switch (ouverte) {
      case 'styles': return (
        <>
          {s.styles.length ? <Etiquettes mots={s.styles} /> : <p className="text-sm text-cave-400">{s.stylesRaison}</p>}
          {s.stylesSources.length > 0 && <p className="mt-1.5 text-sm text-cave-400">{s.stylesSources.join(' ; ')}</p>}
        </>
      );
      case 'huiles': return (
        <div className="divide-y divide-cave-800">
          {s.huileTotale.length ? s.huileTotale.map((x) => <Rangee key={x.source} nom={`totale, ${nomSource(x)}`} valeur={`${pl(x)} mL/100 g`} />) : <Rangee nom="totale" valeur="non renseigné" />}
          {s.composants.map((c) => <Rangee key={c.nom} nom={c.nom} valeur={c.plage ? `${pl(c.plage)} %, ${c.plage.source}` : c.raison ?? 'non renseigné'} />)}
        </div>
      );
      case 'sources': return (
        <>
          <div className="divide-y divide-cave-800">
            {s.alpha.map((x) => <Rangee key={x.source} nom={`α ${nomSource(x)}`} valeur={`${pl(x)} %`} />)}
            {lot != null && <Rangee nom="α mon lot" valeur={`${nombre(lot, 1)} %`} />}
            {s.beta.length ? s.beta.map((x) => <Rangee key={x.source} nom={`β ${nomSource(x)}`} valeur={`${pl(x)} %`} />) : <Rangee nom="β" valeur="non renseigné" />}
          </div>
          <p className="mt-2 text-sm text-cave-200">
            Origine : {s.origine ?? 'non renseigné'} ; IBU : {nombre(recette.volumeL, 1)} L, DI {nombre(recette.og, 3)}, ébullition {recette.boilMin} min
          </p>
          <ul className="mt-1.5 space-y-1">
            {s.auteurs.map((a) => (
              <li key={a.famille} data-famille={a.famille} className="flex items-start gap-1.5 text-sm text-cave-200">
                <Picto famille={a.famille} taille={14} />
                <span><b className="font-semibold text-cave-50">{COURT[a.famille]}{a.sur > 1 ? ` ${a.fiches}/${a.sur}` : ''}</b> {a.auteurs.join(', ') || 'non renseigné'}</span>
              </li>
            ))}
          </ul>
          {s.descripteurs.length > 0 && <div className="mt-2"><p className="mb-1 text-xs text-cave-400">Descripteurs Beer Maverick</p><Etiquettes mots={s.descripteurs} /></div>}
        </>
      );
      case 'substituts': {
        if (!ajout) return <p className="text-sm text-cave-400">{h.nom} n’est pas dans ma recette : ses remplaçants se calculent sur un ajout, à son moment.</p>;
        const q = quandDe(ajout, recette);
        return (
          <>
            <p className="flex items-baseline justify-between gap-2 text-sm">
              <b className="font-semibold text-cave-50">Remplaçants à {nomMoment(q)}</b>
              <span className="text-xs text-cave-400 whitespace-nowrap">partiel · proche · très proche</span>
            </p>
            {liste.length === 0
              ? <p className="mt-1 text-sm text-cave-400">Aucun remplaçant calculé pour cet ajout.</p>
              : (
                <ol data-role="fiche-remplacants" aria-label={`Remplaçants de ${h.nom} à ${nomMoment(q)}`} className="mt-1 divide-y divide-cave-800">
                  {liste.map((r) => (
                    <li key={r.cle} data-houblon-cle={r.cle} className="flex items-center gap-3 py-1.5">
                      <span className="w-[7.5rem] shrink-0 flex items-center gap-1 min-w-0">
                        <span className="truncate text-sm text-cave-50 font-semibold">{r.houblon.nom}</span>
                        {r.stock.etat === 'en stock' && (
                          <Package role="img" aria-label={r.stock.suffisant === false ? 'en stock, pas assez pour la dose' : 'en stock'}
                            className={`w-3.5 h-3.5 shrink-0 ${r.stock.suffisant === false ? 'text-cave-600' : 'text-cave-400'}`} />
                        )}
                      </span>
                      <Score r={r} />
                      <span className="w-12 shrink-0 text-right font-mono text-sm text-cave-50" title={`${r.palier} : ${r.raison}`}>
                        {r.score}{Object.values(r.composantes).some((x) => x == null) ? <span className="text-cave-400"> ?</span> : null}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            <p className="mt-1 text-xs text-cave-400">Classés comme dans Substituer : en stock d’abord, puis par score ; ○ et « ? » : une composante inconnue. Prix inconnu.</p>
            {onRemplacer && <div className="mt-2 flex justify-end"><Pont nom="remplacer-fiche" onClick={onRemplacer}>Remplacer {h.nom}</Pont></div>}
          </>
        );
      }
      default: return null;
    }
  })();

  return (
    <div ref={zone} data-element="g1-replis" className="pt-2 border-t border-cave-800">
      <div data-etat="etat-fiche-bas" role="group" aria-label="Détail de la fiche" className="grid grid-cols-4 gap-1.5">
        {TITRES.map(([id, titre]) => {
          const on = ouverte === id;
          const label = id === 'substituts' && ajout ? `Ouvrir les remplaçants de ${h.nom}` : `${on ? 'Replier' : 'Déplier'} ${titre.toLowerCase()}`;
          return (
            <button key={id} type="button" data-etat={`etat-fiche-${id}`} aria-expanded={on} aria-label={label}
              onClick={() => setOuverte(on ? null : id)}
              className={`min-h-touch px-1 rounded-full text-sm font-semibold whitespace-nowrap ${on ? 'bg-ebc-straw text-cave-950' : 'bg-cave-900 border border-cave-800 text-cave-50'}`}>
              {titre} <span aria-hidden="true" className={`inline-block ${on ? 'rotate-90' : ''}`}>›</span>
            </button>
          );
        })}
      </div>
      {ouverte && <section aria-label={TITRES.find((t) => t[0] === ouverte)![1]} className="pt-2.5 pb-1">{contenu}</section>}
    </div>
  );
}
