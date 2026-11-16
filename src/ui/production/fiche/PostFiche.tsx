import React from 'react';
import { AlertTriangle, ChevronRight, Pencil } from 'lucide-react';
import type { Batch } from '../../../types';
import { abvFromGravities } from '../../../domain/gravityBounds';
import { formatDecimal, parseDecimal } from '../../numericInput';
import { nombreFr } from '../../../domain/nombreAffiche';
import { breweryDay, hasBrewStarted } from '../../../domain/batchSchedule';
import { avecVerdict, ecartJours, fgBande, jourN, palierStable, releves, verdictDe, VERDICTS, volumesConditionnes } from './ficheModel';
import { Cible, Curseur, Mono, Panneau, Pastille, Pas, Puce, TON_BLOC, type Ton } from './ui';

/** e2a : la fiche après la fermentation (garde, conditionné, terminé, annulé). Aucun calcul réécrit : OG/FG/alcool viennent du brassin et de `abvFromGravities`. */

const sg3 = (v: number) => formatDecimal(v, 3);
/** « jj.mm » d'une date suisse (jj.mm.aaaa) ou ISO (aaaa-mm-jj : brewDate). */
export const jjmm = (d: string) => /^\d{4}-\d{2}-\d{2}/.test(d) ? `${d.slice(8, 10)}.${d.slice(5, 7)}` : d.slice(0, 5);

/** Alcool recalculé depuis l'OG et la FG réelles du brassin (k1 : jamais un alcool d'une autre densité). */
export function alcoolDuBrassin(b: Batch): number | null {
  if (b.nolo || b.recipeSnapshot?.nolo) return null;
  return abvFromGravities(parseDecimal(b.og || ''), parseDecimal(b.fg || ''));
}

const Etat: React.FC<{ b: string; v: string }> = ({ b, v }) => (
  <span className="rounded-[10px] border-2 border-current bg-cave-950 px-1.5 py-0.5 text-center leading-tight">
    <b className="block font-mono text-sm font-semibold text-cave-50">{b}</b><i className="block font-mono text-xs not-italic text-cave-400">{v}</i>
  </span>
);

/** Le bloc de l'état : une phrase-réponse en titre, les preuves en puces. */
export const HeroEtat: React.FC<{ batch: Batch; now: number }> = ({ batch, now }) => {
  const og = parseDecimal(batch.og || ''), fg = parseDecimal(batch.fg || ''), abv = alcoolDuBrassin(batch);
  const j = jourN(batch, now), rel = releves(batch), palier = palierStable(batch, now);
  let ton: Ton = 'water', petit: React.ReactNode = null, grand = '', puces: React.ReactNode = null;
  if (batch.status === 'garde') {
    const confirmee = fg !== null;
    ton = confirmee ? 'hop' : 'water';
    petit = <>{j ? <><b className="font-mono font-semibold text-cave-50">J+{j.n}</b> · </> : null}en garde</>;
    grand = confirmee ? 'Prête à conditionner' : 'FG à confirmer';
    const serie = (palier?.releves ?? []).slice(-3);
    puces = (
      <div data-stabilite className="flex flex-wrap items-center gap-1 text-cave-200">
        {serie.map((r, i) => <React.Fragment key={r.date}>{i > 0 && palier?.egaux && <em className="font-semibold not-italic text-cave-400">=</em>}<Etat b={sg3(r.sg)} v={jjmm(r.swiss)} /></React.Fragment>)}
        {!serie.length && <span className="text-sm text-cave-400">Aucun relevé de densité</span>}
        {confirmee && <strong className="ml-1 text-sm text-cave-50">✓ FG {sg3(fg!)}</strong>}
        {!confirmee && palier?.egaux && <strong className="ml-1 text-sm text-cave-50">stable {palier.jours} j</strong>}
        {!confirmee && palier && !palier.egaux && <strong className="ml-1 text-sm text-cave-50">pas encore stable</strong>}
      </div>
    );
  } else if (batch.status === 'conditionne') {
    ton = 'copper';
    const depuis = batch.bottlingDate ? ecartJours(batch.bottlingDate, breweryDay(now)) : null;
    petit = <>bouteilles et fût{depuis !== null && <> · depuis <b className="font-mono font-semibold text-cave-50">{depuis} j</b></>}</>;
    grand = batch.volumePackagedL != null ? `${nombreFr(batch.volumePackagedL, 1)} L en place` : 'Volume à renseigner';
    puces = <div className="flex flex-wrap items-center gap-1"><Etat b={abv !== null ? `${nombreFr(abv, 1)} %` : '—'} v="alcool" /><Etat b={og !== null ? sg3(og) : '—'} v="OG" /><em className="not-italic text-cave-400">→</em><Etat b={fg !== null ? sg3(fg) : '—'} v="FG" /></div>;
  } else if (batch.status === 'termine') {
    ton = 'gold';
    petit = <>du <Mono>{batch.brewDate ? jjmm(batch.brewDate) : '—'}</Mono> à son dernier verre</>;
    grand = `Écoulée · ${abv !== null ? `${nombreFr(abv, 1)} %` : 'alcool —'}`;
    puces = <div className="flex flex-wrap items-center gap-1"><Etat b={og !== null ? sg3(og) : '—'} v="OG" /><em className="not-italic text-cave-400">→</em><Etat b={fg !== null ? sg3(fg) : '—'} v="FG" /><Etat b={batch.volumePackagedL != null ? `${nombreFr(batch.volumePackagedL, 1)} L` : '—'} v="condit." /></div>;
  } else {
    ton = 'neutre';
    const brasse = !!batch.brewDay?.pitchedAt || !!batch.stockConsumption?.appliedAt || hasBrewStarted(batch);
    petit = <>annulée</>;
    grand = brasse ? 'Abandonnée en cours de route' : 'Abandonnée, jamais brassée';
    puces = <div className="flex flex-wrap items-center gap-1"><Etat b={batch.stockConsumption?.appliedAt ? 'déstocké' : 'intact'} v="stock" /><Etat b={og !== null ? sg3(og) : '—'} v="OG" /></div>;
  }
  return (
    <section aria-label="État du brassin" data-hero={batch.status} className={`rounded-2xl border px-3 pb-3 pt-2.5 ${TON_BLOC[ton]}`}>
      <p className="text-sm text-cave-200">{petit}</p>
      <h2 className="mb-2 mt-0.5 text-2xl font-semibold leading-tight text-cave-50">{grand}</h2>
      {puces}
    </section>
  );
};

/** Courbe de densité : tailles fixes (viewBox 344 × 150), bande visée en vert, palier stable en trait épais, jamais de décimale flottante. */
export const CourbeGarde: React.FC<{ batch: Batch }> = ({ batch }) => {
  const rel = releves(batch);
  const og = parseDecimal(batch.og || '');
  const pts = [...(og !== null && rel.length && rel[0].sg < og - 1e-9 ? [{ sg: og, swiss: rel[0].swiss }] : []), ...rel.map(r => ({ sg: r.sg, swiss: r.swiss }))];
  if (pts.length < 2) return <p className="mt-1 text-sm text-cave-400">Courbe dès deux relevés de densité.</p>;
  const bande = fgBande(batch);
  const hi = Math.max(...pts.map(p => p.sg), bande?.[1] ?? 0) + 0.002, lo = Math.min(...pts.map(p => p.sg), bande?.[0] ?? 9) - 0.002;
  const W = 344, H = 150, l = 44, r = 8, t = 10, bt = 24;
  const t0 = pts[0].swiss, span = Math.max(1, ecartJours(t0, pts[pts.length - 1].swiss) ?? 1);
  const x = (s: string) => l + 8 + (W - l - r - 16) * ((ecartJours(t0, s) ?? 0) / span);
  const y = (v: number) => t + (H - t - bt) * ((hi - v) / (hi - lo));
  const palier = palierStable(batch, Date.now());
  const stable = palier?.egaux ? pts.filter(p => p.sg <= palier.sg + 0.0005 && (ecartJours(palier.depuis, p.swiss) ?? -1) >= 0) : [];
  const fgFait = parseDecimal(batch.fg || '') !== null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Courbe de densité du brassin" data-courbe className="mt-1 text-cave-400">
      {bande && <rect x={l} y={y(bande[1])} width={W - l - r} height={Math.max(2, y(bande[0]) - y(bande[1]))} className="fill-hop/30" />}
      {[hi, (hi + lo) / 2, lo].map(v => <text key={v} x={l - 4} y={y(v) + 4} fontSize="12" textAnchor="end" className="fill-cave-400 font-mono">{sg3(Math.round(v * 1000) / 1000)}</text>)}
      <polyline points={pts.map(p => `${x(p.swiss)},${y(p.sg)}`).join(' ')} fill="none" strokeWidth="2.5" strokeLinejoin="round" className="stroke-cave-50" />
      {stable.length > 1 && <polyline points={stable.map(p => `${x(p.swiss)},${y(p.sg)}`).join(' ')} fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-hop" />}
      {pts.map((p, i) => <g key={`${p.swiss}-${i}`}>
        <circle cx={x(p.swiss)} cy={y(p.sg)} r="4.5" strokeWidth="2" className={`stroke-cave-50 ${i === pts.length - 1 && fgFait ? 'fill-hop' : 'fill-cave-900'}`} />
        <text x={x(p.swiss)} y={H - 6} fontSize="12" textAnchor="middle" className="fill-cave-400 font-mono">{jjmm(p.swiss)}</text>
      </g>)}
    </svg>
  );
};

/** La carte Densité : titre, alcool provisoire tant que la FG n'est pas confirmée, courbe. */
export const CarteDensite: React.FC<{ batch: Batch }> = ({ batch }) => {
  const rel = releves(batch), abv = alcoolDuBrassin(batch), og = parseDecimal(batch.og || ''), fgDone = parseDecimal(batch.fg || '') !== null;
  const provisoire = !fgDone && rel.length ? abvFromGravities(og, rel[rel.length - 1].sg) : null;
  return (
    <Panneau label="Densité" className="p-2.5">
      <div className="flex min-h-5 items-center gap-1.5 text-sm font-semibold text-cave-50">
        Densité <span className="font-normal text-cave-400">{og !== null ? <>OG {sg3(og)} · </> : null}{rel.length} relevé{rel.length > 1 ? 's' : ''}</span>
        {!fgDone && provisoire !== null && <Pastille className="ml-auto">alcool <Mono>{nombreFr(provisoire, 1)} %</Mono> provisoire</Pastille>}
        {fgDone && abv !== null && <Pastille ton="hop" className="ml-auto">alcool <Mono>{nombreFr(abv, 1)} %</Mono></Pastille>}
      </div>
      <CourbeGarde batch={batch} />
    </Panneau>
  );
};

/** Les quatre étapes : Ferm. · Garde · Cond. · Terminé. `courante` = index, -1 hors cycle (annulé). */
export const EtapesPills: React.FC<{ courante: number; annulee?: boolean }> = ({ courante, annulee }) => (
  <div className="my-2 flex gap-1" aria-label="Étapes du brassin" role="list">
    {annulee && <span role="listitem" data-annulee className="grid h-7 flex-1 place-items-center rounded-[10px] border border-cave-600 bg-cave-800 text-[13px] font-semibold text-cave-200"
      style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 5px, rgb(var(--cave-600) / 0.55) 5px 7px)' }}>Annulée</span>}
    {['Ferm.', 'Garde', 'Cond.', 'Terminé'].map((t, i) => (
      <span key={t} role="listitem" aria-current={i === courante ? 'step' : undefined}
        className={`grid h-7 flex-1 place-items-center rounded-[10px] text-[13px] font-semibold ${i === courante ? 'border border-ebc-copper/60 bg-ebc-copper/20 text-cave-50' : i < courante ? 'bg-cave-800 text-cave-200' : 'bg-cave-850 text-cave-400'}`}>{t}</span>
    ))}
  </div>
);

/** Densité finale (m2) : un curseur sur 1,000 – 1,020 avec la bande visée, −/+ d'un millième, confirmer. */
export const CurseurFg: React.FC<{ batch: Batch; valeur: number; onValeur: (milliemes: number) => void; onConfirmer: () => void; erreur?: string }> = ({ batch, valeur, onValeur, onConfirmer, erreur }) => {
  const bande = fgBande(batch);
  const min = Math.min(1000, valeur), max = Math.max(1020, valeur);
  const m = (v: number) => Math.round(v * 1000);
  return (
    <Panneau label="Densité finale" className="p-2.5">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-cave-50">Densité finale {bande && <span className="font-normal text-cave-400">visée {sg3(bande[0])} – {sg3(bande[1])}</span>}</div>
      <div className="my-1.5 flex items-center gap-2">
        <Cible aria-label="Moins" onClick={() => onValeur(Math.max(min, valeur - 1))} className="w-10 px-0 text-xl">−</Cible>
        <span className="flex-1 text-center font-mono text-3xl font-semibold tabular-nums text-cave-50">{sg3(valeur / 1000)}</span>
        <Cible aria-label="Plus" onClick={() => onValeur(Math.min(max, valeur + 1))} className="w-10 px-0 text-xl">+</Cible>
      </div>
      <Curseur label="Densité finale" min={min} max={max} value={valeur} onChange={onValeur} format={v => sg3(v / 1000)}
        cible={bande ? [m(bande[0]), m(bande[1])] : null}
        grads={[{ at: min, text: sg3(min / 1000) }, ...(bande ? [{ at: m(bande[0]), text: sg3(bande[0]), cible: true }, { at: m(bande[1]), text: sg3(bande[1]), cible: true }] : []), { at: max, text: sg3(max / 1000) }]} />
      {erreur && <p role="alert" className="text-xs text-alert-strong">{erreur}</p>}
      <Cible ton="prim" plein className="mt-2" onClick={onConfirmer}>Confirmer la FG {sg3(valeur / 1000)}</Cible>
    </Panneau>
  );
};

/** FG confirmée + alcool + atténuation apparente, puis « Conditionner ». */
export const TuilesFg: React.FC<{ batch: Batch; onConditionner: () => void }> = ({ batch, onConditionner }) => {
  const og = parseDecimal(batch.og || ''), fg = parseDecimal(batch.fg || ''), abv = alcoolDuBrassin(batch);
  const att = og !== null && fg !== null && og > 1 ? Math.round(((og - fg) / (og - 1)) * 100) : null;
  const dernier = releves(batch).slice(-1)[0];
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Panneau className="p-2.5"><div className="flex items-center gap-1.5 text-sm font-semibold text-cave-50">FG <Pastille ton="hop">confirmée</Pastille></div>
          <div className="font-mono text-3xl font-semibold tabular-nums text-cave-50">{fg !== null ? sg3(fg) : '—'}</div>
          <div className="font-mono text-xs text-cave-400">{dernier ? `${jjmm(dernier.swiss)} · ` : ''}OG {og !== null ? sg3(og) : '—'}</div></Panneau>
        <Panneau className="p-2.5"><div className="text-sm font-semibold text-cave-50">Alcool</div>
          <div className="font-mono text-3xl font-semibold tabular-nums text-cave-50">{abv !== null ? `${nombreFr(abv, 1)} %` : '—'}</div>
          <div className="text-xs text-cave-400">atténuation <Mono>{att !== null ? `${att} %` : '—'}</Mono></div></Panneau>
      </div>
      <Cible ton="prim" plein onClick={onConditionner}>Conditionner · bouteilles et fût <ChevronRight size={16} aria-hidden="true" /></Cible>
    </>
  );
};

export const Bouteille: React.FC = () => (
  <svg viewBox="0 0 12 30" className="h-[30px] w-full" aria-hidden="true"><path d="M4.5 1h3v7c0 1 3 2 3 5v15.5c0 .5-.4 1-1 1h-7c-.6 0-1-.5-1-1V13c0-3 3-4 3-5z" strokeWidth=".6" className="fill-ebc-stout stroke-cave-600" /></svg>
);

/** Conditionné : les bouteilles dessinées une à une, le fût et sa capacité. Litres par fût non stockés : seule la capacité est dite. */
export const Contenants: React.FC<{ batch: Batch; futs: Array<{ id: string; capacityL: number }>; onCorriger: () => void }> = ({ batch, futs, onCorriger }) => {
  const p = batch.packaging, n = p?.bottles33 ?? 0;
  const vol = volumesConditionnes(batch, futs);
  return (
    <Panneau label="Contenants" className="p-2.5" >
      <div className="flex min-h-5 items-center gap-1.5 text-sm font-semibold text-cave-50">
        Bouteilles <span className="font-mono font-normal text-cave-400">{n} × 33 cl · {nombreFr(n * 0.33, 1)} L</span>
        <Cible aria-label="Corriger" onClick={onCorriger} className="ml-auto min-h-8 w-9 px-0"><Pencil size={14} aria-hidden="true" /></Cible>
      </div>
      {n > 0 && <div className="my-2 grid grid-cols-10 gap-[3px]">{Array.from({ length: Math.min(n, 120) }, (_, i) => <Bouteille key={i} />)}</div>}
      {futs.map(f => (
        <div key={f.id} className="mt-2 flex items-center gap-2.5 border-t border-cave-800 pt-2">
          <svg width="44" height="52" viewBox="0 0 44 52" aria-hidden="true"><rect x="4" y="4" width="36" height="44" rx="6" strokeWidth=".8" className="fill-ebc-stout stroke-cave-600" /><rect x="4" y="14" width="36" height="3" className="fill-ebc-copper" /><rect x="4" y="35" width="36" height="3" className="fill-ebc-copper" /><rect x="16" y="0" width="12" height="6" rx="2" className="fill-cave-600" /></svg>
          <div><div className="text-sm font-semibold text-cave-50">Fût {f.id}</div>
            <div className="font-mono text-lg font-semibold text-cave-50">
              {futs.length === 1 && vol?.enFutL != null ? <>{nombreFr(vol.enFutL, 1)} L <span className="font-sans text-xs font-normal text-cave-400">dedans · {nombreFr(f.capacityL, 0)} L de capacité</span></>
                : <>{nombreFr(f.capacityL, 0)} L <span className="font-sans text-xs font-normal text-cave-400">de capacité</span></>}
            </div></div>
        </div>
      ))}
      {vol && vol.nonRepartisL > 0 && <p role="status" data-non-repartis className="mt-2 flex items-start gap-1.5 border-t border-cave-800 pt-2 text-sm text-attention"><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /><span><Mono className="font-semibold">{nombreFr(vol.nonRepartisL, 1)} L</Mono> non répartis (volume conditionné supérieur aux contenants)</span></p>}
    </Panneau>
  );
};

/** Lignes « °C cuve » et « Volume » : consigne de garde absente du modèle, « hier » = le relevé précédent qui a une température. */
export const LignesCuve: React.FC<{ batch: Batch; onReleve: () => void; onVolume: () => void }> = ({ batch, onReleve, onVolume }) => {
  const avecT = releves(batch).filter(r => typeof r.tempC === 'number');
  const dernier = avecT[avecT.length - 1];
  return (
    <Panneau className="px-2.5">
      <div className="flex min-h-12 items-center gap-2.5">
        <span className="w-16 shrink-0 text-sm text-cave-400">°C cuve</span>
        <span className="font-mono text-base font-semibold text-cave-50">{dernier ? nombreFr(dernier.tempC!, 1) : '—'}<small className="block font-sans text-xs font-normal text-cave-400">{dernier ? `relevé le ${jjmm(dernier.swiss)}` : 'pas de température relevée'}</small></span>
        <Cible onClick={onReleve} className="ml-auto min-h-8">Relever</Cible>
      </div>
      <div className="flex min-h-12 items-center gap-2.5 border-t border-cave-800">
        <span className="w-16 shrink-0 text-sm text-cave-400">Volume</span>
        <span className="font-mono text-base font-semibold text-cave-50">{batch.volumeBrewedL != null ? `${nombreFr(batch.volumeBrewedL, 1)} L` : '—'}<small className="block font-sans text-xs font-normal text-cave-400">brassés · {batch.volumePackagedL != null ? `${nombreFr(batch.volumePackagedL, 1)} L conditionnés` : 'en cuve —'}</small></span>
        <Cible aria-label="Corriger le volume" onClick={onVolume} className="ml-auto min-h-8 w-9 px-0"><Pencil size={14} aria-hidden="true" /></Cible>
      </div>
    </Panneau>
  );
};

/**
 * e2a, le verdict en trois puces exclusives « à refaire · à corriger · sans suite ». Aucun champ neuf : une ligne « Verdict : … »
 * dans la note de dégustation (`notesTasting`). Re-toucher la puce posée retire la ligne.
 */
export const VerdictPuces: React.FC<{ notes: string | undefined; onChange: (notes: string) => void }> = ({ notes, onChange }) => {
  const actuel = verdictDe(notes);
  return (
    <div role="group" aria-label="Verdict sur la bière" data-verdict className="flex flex-wrap gap-1.5">
      {VERDICTS.map(v => <Puce key={v} actif={actuel === v} onClick={() => onChange(avecVerdict(notes, actuel === v ? null : v))}>{v}</Puce>)}
    </div>
  );
};

/** e2a, une note secondaire repliée en ligne « libellé — ✎ » ; le crayon déplie le champ. Une valeur présente se montre tronquée. */
export const LigneRepliee: React.FC<{ label: string; valeur: string; children: React.ReactNode }> = ({ label, valeur, children }) => {
  const [ouvert, setOuvert] = React.useState(false);
  return (
    <div className="rounded-xl border border-cave-800 bg-cave-900 px-2.5">
      <div className="flex min-h-11 items-center gap-2">
        <span className="shrink-0 text-sm text-cave-200">{label}</span>
        <span className="min-w-0 flex-1 truncate text-sm text-cave-400">{valeur.trim() ? `— ${valeur.trim().split('\n')[0]}` : '—'}</span>
        <Cible aria-label={`${ouvert ? 'Replier' : 'Écrire'} : ${label}`} aria-expanded={ouvert} onClick={() => setOuvert(o => !o)} className="min-h-8 w-9 shrink-0 px-0"><Pencil size={14} aria-hidden="true" /></Cible>
      </div>
      {ouvert && <div className="pb-2">{children}</div>}
    </div>
  );
};
export { Pas };
