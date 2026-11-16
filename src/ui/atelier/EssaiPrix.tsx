import React, { useState } from 'react';
import { CurseurPrix } from './CurseurPrix';
import { FORMATS_PRIX, chf, marge } from './atelierModel';

interface Saisie { prix?: number; cout?: number }

export interface TarifGarde { format: string; prix: number; cout?: number }

/** « Essayer un prix » (e9na, état tarifs) : le format, le prix et le coût au curseur, la marge qui en sort, un geste pour garder. */
export const EssaiPrix: React.FC<{ tva: number; onGarder: (t: TarifGarde) => void }> = ({ tva, onGarder }) => {
  const [formatId, setFormatId] = useState(FORMATS_PRIX[0].id);
  const [saisies, setSaisies] = useState<Record<string, Saisie>>({});
  const format = FORMATS_PRIX.find(f => f.id === formatId) ?? FORMATS_PRIX[0];
  const { prix, cout } = saisies[format.id] ?? {};
  const m = marge(prix, cout, tva);
  const net = prix != null && prix > 0 ? prix / (1 + tva) : undefined;
  const partCout = net != null && cout != null && m != null ? Math.max(0, Math.min(100, (cout / net) * 100)) : undefined;
  const regler = (champ: keyof Saisie, v: number) => setSaisies(s => ({ ...s, [format.id]: { ...s[format.id], [champ]: Math.round(v * 100) / 100 } }));

  return (
    <section aria-label="Essayer un prix" className="flex flex-col gap-2.5 rounded-2xl border border-cave-800 bg-cave-900 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-cave-50">Essayer un prix</h2>
        <span className="text-xs text-cave-400">{tva > 0 ? 'TVA retirée, selon tes réglages' : 'sans TVA, selon tes réglages'}</span>
      </div>
      <div role="group" aria-label="Format" className="flex gap-1.5">
        {FORMATS_PRIX.map(f => (
          <button key={f.id} type="button" aria-pressed={f.id === format.id} onClick={() => setFormatId(f.id)}
            className={`relative min-h-8 flex-1 rounded-full border px-2 text-sm after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[''] ${f.id === format.id ? 'border-cave-50 bg-cave-850 font-semibold text-cave-50' : 'border-cave-700 bg-cave-850 text-cave-200'}`}>
            {f.label}
          </button>
        ))}
      </div>
      <div>
        <p className="flex items-baseline justify-between text-sm text-cave-200">Prix de vente
          {prix == null ? <span className="text-sm text-cave-400">non saisi</span> : <span className="font-mono text-base font-semibold tabular-nums text-cave-50">{chf(prix)} CHF</span>}
        </p>
        <CurseurPrix label={`Prix de vente (${format.label})`} max={format.max} pas={format.pas} grads={format.grads} valeur={prix} onChange={v => regler('prix', v)} />
      </div>
      <div>
        <p className="flex items-baseline justify-between text-sm text-cave-200">Coût de revient {format.coutLabel}
          {cout == null ? <span className="text-sm text-cave-400">non saisi</span> : <span className="font-mono text-base font-semibold tabular-nums text-cave-50">{chf(cout)} CHF</span>}
        </p>
        <CurseurPrix label={`Coût de revient (${format.label})`} max={format.max} pas={format.pas} grads={format.grads} valeur={cout} onChange={v => regler('cout', v)} />
      </div>
      {partCout != null && (
        <div className="flex h-2.5 overflow-hidden rounded-sm" aria-hidden="true">
          <span className="bg-ebc-copper" style={{ width: `${partCout}%` }} />
          <span className="bg-hop" style={{ width: `${100 - partCout}%` }} />
        </div>
      )}
      <div className="flex items-baseline justify-between rounded-control bg-hop/10 px-3 py-2.5">
        <p className="text-sm text-cave-200">Marge par {format.id === '33cl' ? 'bouteille' : format.id === 'carton24' ? 'carton' : 'fût'}</p>
        {m == null
          ? <span className="text-sm text-cave-400">{prix == null ? 'saisis le prix et le coût' : 'saisis le coût'}</span>
          : <span><span className="font-mono text-[28px] font-semibold leading-none tabular-nums text-hop">{chf(m)}</span> <span className="font-mono text-sm text-cave-400">CHF</span></span>}
      </div>
      <button type="button" disabled={prix == null}
        onClick={() => prix != null && onGarder({ format: format.label, prix, cout })}
        className="min-h-9 w-full rounded-control bg-ebc-straw px-3 text-sm font-semibold text-cave-950 disabled:opacity-50">
        Garder ce tarif dans le carnet
      </button>
    </section>
  );
};
