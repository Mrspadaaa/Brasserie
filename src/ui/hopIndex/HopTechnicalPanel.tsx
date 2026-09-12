import React, { useEffect, useState } from 'react';
import type { HopVariety, HopLot, HopSource } from '../../../functions/src/hopIndexSchema';
import { resolveHopFacts } from '../../domain/hopIndex/facts';
import { HOP_ANALYTE_LABELS, HOP_UNIT_LABELS, formatHopMeasurement } from '../../domain/hopIndex/labels';
import research from '../../data/hopResearchBootstrap.json';
import technical from '../../data/hopTechnicalBootstrap.json';
import { useStorageValue } from '../../hooks/useLiveData';
import { StorageService } from '../../services/storage';
import { usableHopKnowledge } from '../../domain/hopIndex/engine';

export function HopSourceLink({ source }: { source: HopSource }) {
  return <span className="text-xs text-cave-400 break-words">{source.author} · {source.year ?? 'année inconnue'} · {source.kind === 'manufacturer' ? 'fabricant' : source.kind === 'research' ? 'recherche' : source.kind === 'judgment' ? 'choix éditorial' : source.kind}
    {/^https?:\/\//i.test(source.reference) && <> · <a className="text-water underline" href={source.reference} target="_blank" rel="noreferrer">Lire la source</a></>}</span>;
}

function BeerMaverickLink({ variety }: { variety: HopVariety }) {
  const [reference, setReference] = useState<string>();
  useEffect(() => {
    let active = true;
    setReference(undefined);
    const normalize = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().trim();
    const names = new Set([variety.name, ...variety.aliases].map(normalize));
    import('../../data/hopBeerMaverickBootstrap.json').then(pack => {
      const matches = pack.default.hopVarieties.filter(v => names.has(normalize(v.name)));
      if (!active || matches.length !== 1) return;
      const source = [...matches[0].descriptions.map(d => d.source), ...matches[0].analysis.map(a => a.source)]
        .find(s => /^https:\/\/beermaverick\.com\/hop\/[^/]+\/$/.test(s.reference));
      setReference(source?.reference);
    }).catch(() => { /* Optional external reading never prevents local analysis. */ });
    return () => { active = false; };
  }, [variety.id, variety.name, variety.aliases]);
  return reference ? <a href={reference} target="_blank" rel="noreferrer" className="inline-flex min-h-touch items-center text-sm text-water underline">Fiche complète de {variety.name} sur Beer Maverick</a> : null;
}

/** Each small plot has one unit AND one matrix basis. Points are observations, not CIs. */
export function HopChemistryChart({ variety, lot }: { variety?: HopVariety; lot?: HopLot }) {
  const facts = resolveHopFacts(lot, variety).filter(f => f.measurement);
  const groups = [...new Set(facts.map(f => `${f.measurement!.unit}:${f.measurement!.basis}`))];
  return <section aria-label="Composition analytique" className="space-y-4">
    <h4 className="font-semibold text-cave-50">Composition · {lot?.name ?? variety?.name ?? 'référence à choisir'}</h4>
    {!facts.length && <p className="text-sm text-cave-400">Pas d’analyse exploitable sur cette fiche. Les composés absents ne sont pas considérés comme nuls.</p>}
    {groups.map(group => {
      const rows = facts.filter(f => `${f.measurement!.unit}:${f.measurement!.basis}` === group);
      const max = Math.max(0, ...rows.map(f => f.range?.max ?? f.measurement!.value ?? f.measurement!.limit ?? 0));
      return <div key={group} className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-cave-400">{HOP_UNIT_LABELS[rows[0].measurement!.unit]} · {({ asIs: 'produit en l’état', dryMatter: 'matière sèche', oil: 'huile', beer: 'bière analysée', unknown: 'base inconnue' })[rows[0].measurement!.basis]}</p>
        {rows.map(f => {
          const m = f.measurement!, range = f.range ?? (m.kind === 'point' ? { min: m.value!, max: m.value! } : null);
          return <details key={f.analyte}>
            <summary className="cursor-pointer list-none space-y-1 py-1">
              <span className="flex flex-wrap justify-between gap-x-3 text-sm"><span className="text-cave-200">{HOP_ANALYTE_LABELS[f.analyte]}</span><span className="font-mono text-water">{formatHopMeasurement(m)}</span></span>
              <span className="relative block h-3 rounded bg-cave-800 overflow-hidden" aria-hidden="true">
                {range && max > 0 && <span className="absolute inset-y-0 bg-water/70 rounded min-w-[2px]" style={{ left: `${100 * range.min / max}%`, width: `${100 * (range.max - range.min) / max}%`, transform: range.min === range.max ? 'translateX(-2px)' : undefined }} />}
              </span>
            </summary>
            <div className="text-xs text-cave-400 space-y-1 pb-2"><p>{f.origin === 'lot' ? 'COA du lot' : 'Valeur de référence variété'} · confiance {({ low: 'faible', medium: 'moyenne', high: 'élevée' })[f.confidence]}. {m.kind === 'point' && !m.range ? 'Point mesuré ; incertitude non publiée.' : m.kind === 'below' ? 'Sous la limite analytique, sans valeur de substitution.' : 'Plage de la source.'}</p><HopSourceLink source={m.source} />{m.note && <p>{m.note}</p>}</div>
          </details>;
        })}
      </div>;
    })}
    {!!facts.length && <p className="text-xs text-cave-400">Échelles séparées par unité et matrice. Ces analyses ne mesurent pas l’intensité d’arôme de ta bière.</p>}
  </section>;
}

const topics = [
  { name: 'Thiols', ids: ['research-malt-precursors-2023', 'research-atf1-thiol-acetate-2006', 'research-yeast-temperature-2024', 'technical-thiol-pathways'] },
  { name: 'Terpènes', ids: ['technical-terpenes'] },
  { name: 'Esters et lactones', ids: ['research-branched-esters-transfer-2018', 'research-lactones-beer-fruit-2017', 'research-lactone-biosynthesis-2008'] },
  { name: 'Phénols et polyphénols', ids: ['technical-pof', 'technical-polyphenols'] }
];
export function HopTechnicalPanel({ variety, lot }: { variety?: HopVariety; lot?: HopLot }) {
  const [topic, setTopic] = useState(topics[0].name);
  const selected = topics.find(t => t.name === topic)!;
  const knowledge = useStorageValue(StorageService.getHopKnowledge);
  const saved = usableHopKnowledge(knowledge).valid.filter(k => k.kind === 'note');
  const notes = [...new Map([...technical, ...research, ...saved].map(n => [n.id, n])).values()].filter(n => selected.ids.includes(n.id));
  return <section aria-label="Chimie et biotransformation" className="space-y-4">
    {(variety || lot) && <HopChemistryChart variety={variety} lot={lot} />}
    {variety && <BeerMaverickLink variety={variety} />}
    <h3 className="text-lg font-semibold text-cave-50">Comprendre les transformations</h3>
    <div className="flex flex-wrap gap-1" role="group" aria-label="Familles chimiques">{topics.map(t => <button key={t.name} type="button" aria-pressed={topic === t.name} onClick={() => setTopic(t.name)} className={`min-h-touch px-3 rounded-control text-sm ${topic === t.name ? 'bg-cave-700 text-ebc-straw' : 'text-cave-200 bg-cave-850'}`}>{t.name}</button>)}</div>
    {topic === 'Thiols' && <details><summary className="min-h-touch cursor-pointer text-sm text-cave-200">Voies des thiols</summary><div className="grid gap-1 sm:grid-cols-3 text-sm" aria-label="Voies des thiols">
      {['Précurseurs GSH / Cys · réservoir', 'Libération → 3SH (3MH) / 4MSP (4MMP)', 'Acétylation du 3SH → 3SHA (3MHA)'].map(label => <div key={label} className="border-l-2 border-hop pl-3 py-3 text-cave-50 bg-hop/5">{label}</div>)}
    </div></details>}
    {notes.map(n => <details key={n.id} className="border-b border-cave-800"><summary className="cursor-pointer min-h-touch py-2 text-sm font-semibold text-cave-50">{n.name}</summary><div className="space-y-2 pb-3"><p className="text-sm text-cave-200">{n.summary}</p><p className="text-xs text-cave-400">{n.limitation}</p><HopSourceLink source={n.source as HopSource} /></div></details>)}
  </section>;
}
