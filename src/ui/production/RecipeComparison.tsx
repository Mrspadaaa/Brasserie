import React from 'react';
import { Sheet } from '../Sheet';
import type { CatalogEntry } from '../../domain/productionCatalog';
import { recipeSignature } from '../../domain/productionInsights';

const number = (n: number | undefined, unit = '', digits = 1) =>
  n === undefined
    ? 'Non renseigné'
    : `${n.toLocaleString('fr-CH', { minimumFractionDigits: digits === 3 ? 3 : 0, maximumFractionDigits: digits === 3 ? 5 : digits })}${unit}`;
const stages: Record<string, string> = {
  firstWort: 'Premier moût',
  boil: 'Ébullition',
  whirlpool: 'Whirlpool',
  dryHop: 'À cru'
};

/** Two fixed columns remain readable on a 320px phone; no wide scrolling table. */
export function RecipeComparison({
  entries,
  onClose
}: {
  entries: CatalogEntry[];
  onClose: () => void;
}) {
  if (entries.length !== 2) return null;
  const recipes = entries.map((e) => e.recipe!);
  const signatures = recipes.map(recipeSignature);
  const row = (label: string, values: React.ReactNode[], key = label) => (
    <div key={key} className="py-3 border-b border-cave-800 last:border-0">
      <dt className="text-sm text-cave-400 mb-1.5">{label}</dt>
      <dd className="grid grid-cols-2 gap-5 text-base text-cave-50">
        {values.map((value, i) => (
          <span key={i} className="min-w-0 break-words">
            {value}
          </span>
        ))}
      </dd>
    </div>
  );
  const grain = [...new Map(signatures.flatMap((s) => s.grain).map((g) => [g.key, g])).values()];
  const hops = [...new Map(signatures.flatMap((s) => s.hops).map((h) => [h.key, h])).values()];
  const others = [
    ...new Map(signatures.flatMap((s) => s.otherFermentables).map((f) => [f.key, f])).values()
  ];
  return (
    <Sheet
      open
      onClose={onClose}
      title="Comparer les recettes"
      subtitle="Grains en %, houblons en g/L de volume prévu."
      className="md:max-w-3xl md:mx-auto"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="min-h-touch w-full rounded-control border border-cave-700 text-cave-50"
        >
          Revenir au carnet
        </button>
      }
    >
      <div className="sticky top-0 z-10 bg-cave-900 border-b border-cave-700 grid grid-cols-2 gap-5 py-3 before:absolute before:inset-x-0 before:-top-3 before:h-3 before:bg-cave-900">
        {entries.map((e) => (
          <div key={e.id} className="min-w-0">
            <span className="text-sm text-ebc-straw">
              V{e.version} · {number(e.volumeL, ' L')}
            </span>
            <h3 className="font-semibold text-base text-cave-50 break-words">{e.name}</h3>
            <p className="text-sm text-cave-400 break-words">{e.style}</p>
          </div>
        ))}
      </div>
      <section aria-label="Cibles comparées">
        <h4 className="font-semibold text-ebc-straw mt-4">Profil visé</h4>
        <dl>
          {row(
            'Densité initiale / finale',
            recipes.map((r) => `${number(r.ogTarget, '', 3)} / ${number(r.fgTarget, '', 3)}`)
          )}
          {row(
            'Alcool',
            entries.map((e) => number(e.abv, ' %'))
          )}
          {row(
            'Amertume',
            entries.map((e) => number(e.ibu, ' IBU'))
          )}
          {row(
            'Couleur estimée',
            entries.map((e) => number(e.ebc, ' EBC'))
          )}
          {row(
            'Houblonnage à cru',
            signatures.map((s) => number(s.dryHopPerL, ' g/L', 2))
          )}
        </dl>
      </section>
      <section aria-label="Grains comparés">
        <h4 className="font-semibold text-ebc-straw mt-5">Composition du grain</h4>
        <dl>
          {grain.map((g) =>
            row(
              g.name,
              signatures.map((s) =>
                s.grainKg > 0
                  ? number(s.grain.find((item) => item.key === g.key)?.pct ?? 0, ' %')
                  : 'Non renseigné'
              ),
              g.key
            )
          )}
        </dl>
        {!grain.length && <p className="text-sm text-cave-400 py-3">Aucun grain renseigné.</p>}
        <p className="text-sm text-cave-400 mt-2">
          Les sucres, fruits et autres fermentescibles restent hors de ces pourcentages.
        </p>
      </section>
      {others.length > 0 && (
        <section aria-label="Autres fermentescibles comparés">
          <h4 className="font-semibold text-ebc-straw mt-5">Sucres, fruits et autres apports</h4>
          <dl>
            {others.map((f) =>
              row(
                `${f.name} · ${f.use}`,
                signatures.map((s, i) =>
                  recipes[i].volumeL > 0
                    ? number(
                        s.otherFermentables.find((item) => item.key === f.key)?.gramsPerL ?? 0,
                        ' g/L',
                        2
                      )
                    : 'Volume à renseigner'
                ),
                f.key
              )
            )}
          </dl>
        </section>
      )}
      <section aria-label="Houblons comparés">
        <h4 className="font-semibold text-hop mt-5">Houblons par étape</h4>
        <dl>
          {hops.map((h) =>
            row(
              `${h.name} · ${stages[h.stage] ?? h.stage} · ${h.detail}`,
              signatures.map((s, i) =>
                recipes[i].volumeL > 0
                  ? number(s.hops.find((item) => item.key === h.key)?.gramsPerL ?? 0, ' g/L', 2)
                  : 'Volume à renseigner'
              ),
              h.key
            )
          )}
        </dl>
        {!hops.length && <p className="text-sm text-cave-400 py-3">Aucun houblon renseigné.</p>}
      </section>
      <section aria-label="Procédés comparés">
        <h4 className="font-semibold text-water mt-5">Levure et procédé</h4>
        <dl>
          {row(
            'Levure',
            signatures.map((s) => s.yeast ?? 'Non renseignée')
          )}
          {row(
            'Empâtage',
            recipes.map((r) =>
              r.mash?.steps?.length
                ? r.mash.steps.map((s, i) => (
                    <span className="block mb-1" key={i}>
                      {number(s.tempC, ' °C')} / {number(s.durationMin, ' min')}
                    </span>
                  ))
                : 'Non renseigné'
            )
          )}
          {row(
            'Ébullition',
            recipes.map((r) => number(r.boilMin, ' min'))
          )}
          {row(
            'Fermentation prévue',
            recipes.map((r) =>
              r.fermentation?.length
                ? r.fermentation.map((s, i) => (
                    <span className="block mb-2" key={i}>
                      {s.name} : {number(s.tempC, ' °C')}, {number(s.days, ' j')}
                    </span>
                  ))
                : 'Non renseignée'
            )
          )}
        </dl>
      </section>
    </Sheet>
  );
}
