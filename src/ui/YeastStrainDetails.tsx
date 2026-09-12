import { ChevronDown } from 'lucide-react';
import type { YeastStrainInformation } from '../domain/yeastStrainInformation';
import type { HopSource } from '../../functions/src/hopIndexSchema';

function SourceLink({ source }: { source: HopSource }) {
  const label = `${source.author} · ${source.title}`;
  return /^https?:\/\//.test(source.reference) ? <a className="yeast-source" href={source.reference} target="_blank" rel="noreferrer">{label}</a> : <span>{label}</span>;
}

/** A single closed row keeps practical manufacturer evidence available in every brewing view. */
export function YeastStrainDetails({ information }: { information: YeastStrainInformation | null }) {
  if (!information) return null;
  const info = information;
  const missing = info.facts.filter(f => !f.values.length).map(f => f.label);
  const sourceLinks = [...new Map(info.sources.map(source => [source.reference, source])).values()];
  const groups = [
    { label: 'Préparer la levure', notes: info.practical.filter(n => n.phase === 'preparation') },
    { label: 'Comportement et usages', notes: [...info.practical.filter(n => n.phase === 'fermentation'), ...info.behaviour] },
    { label: 'Conserver le produit', notes: info.practical.filter(n => n.phase === 'storage') },
  ];
  return <details className="yeast-strain-details" data-yeast-information={info.yeastId}>
    <summary>Fiche de la souche · repères pratiques<ChevronDown size={14} aria-hidden="true" /></summary>
    <div>
      <p className="yeast-small">{info.name} · {info.form ?? 'forme non documentée'}. Repères fabricant pour ce produit.</p>
      <dl className="yeast-strain-facts">{info.facts.filter(f => f.values.length).map(fact => <div key={fact.key}>
        <dt>{fact.label}</dt><dd>{[...new Set(fact.values.map(v => v.value))].join(' / ')}{fact.multiple && <span className="block yeast-small">Plusieurs valeurs publiées · voir les conditions</span>}</dd>
      </div>)}</dl>
      {missing.length > 0 && <p className="yeast-small" data-missing-facts>Non documenté : {missing.join(' · ')}.</p>}
      <p className="yeast-small">L’atténuation dépend aussi du moût. La tolérance à l’alcool ne prédit pas le degré final. Un statut absent reste inconnu.</p>
      {info.preparationWithheld ? <p className="yeast-notice">Confirmer la forme du produit avant d’utiliser son protocole de préparation.</p>
        : !info.preparationDocumented && <p className="yeast-small">Préparation : suivre la notice du conditionnement ; aucun protocole propre à ce produit n’est renseigné ici.</p>}
      {groups.filter(g => g.notes.length).map(group => <section key={group.label} aria-label={group.label}>
        <h4>{group.label}</h4><dl className="yeast-strain-notes">{group.notes.map(note => <div key={note.id}><dt>{note.title}</dt><dd>{note.detail}</dd></div>)}</dl>
      </section>)}
      <details><summary>Conditions et sources des repères<ChevronDown size={14} aria-hidden="true" /></summary><div>
        <p className="yeast-small">Les notices du lot et du conditionnement précisent l’utilisation. Ces informations n’attestent ni la viabilité du lot ni la fin de fermentation du brassin.</p>
        <dl className="yeast-strain-notes">{info.facts.flatMap(f => f.values.map((v, i) => <div key={`${f.key}-${i}`}><dt>{f.label} · {v.value}</dt><dd>{v.reported}{v.condition ? ` · ${v.condition}` : ''}<span className="block"><SourceLink source={v.source} /></span></dd></div>))}</dl>
        {sourceLinks.map(s => <p key={s.reference} className="yeast-small"><SourceLink source={s} /></p>)}
      </div></details>
    </div>
  </details>;
}
