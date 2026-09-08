import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from 'recharts';
import {
  CatalogEntry,
  CatalogKind,
  countGroups,
  measuredProduction
} from '../../domain/productionCatalog';
import { BATCH_STATUSES, statusOf } from '../../domain/batchStatus';

const number = (value: number) => value.toLocaleString('fr-CH', { maximumFractionDigits: 1 });
const chartTooltip = {
  backgroundColor: '#221D19',
  border: '1px solid #574A42',
  borderRadius: 10,
  color: '#F5F0EA'
};
function Distribution({
  title,
  data,
  total,
  onSelect,
  color
}: {
  title: string;
  data: { name: string; count: number }[];
  total: number;
  onSelect?: (name: string) => void;
  color: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <section className="panel p-4 space-y-3" aria-label={title}>
      <h4 className="font-semibold text-cave-50">{title}</h4>
      {data.length ? (
        <ul className="space-y-1">
          {data.slice(0, 8).map(({ name, count }) => (
            <li key={name}>
              <button
                type="button"
                disabled={!onSelect}
                onClick={() => onSelect?.(name)}
                className="relative w-full min-h-touch text-left px-2.5 rounded-control overflow-hidden group"
                aria-label={
                  onSelect
                    ? `Filtrer : ${name}, ${count} sur ${total}`
                    : `${name} : ${count} sur ${total}`
                }
              >
                <span
                  className="absolute inset-y-1 left-0 rounded-control opacity-15"
                  style={{ width: `${(count / max) * 100}%`, background: color }}
                  aria-hidden
                />
                <span className="relative flex justify-between items-center gap-3 text-sm">
                  <span className="min-w-0 break-words text-cave-200">{name}</span>
                  <span className="shrink-0 reading" style={{ color }}>
                    {count}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-cave-400">Aucune donnée renseignée dans cette sélection.</p>
      )}
      {data.length > 8 && (
        <details className="text-sm text-cave-400">
          <summary className="min-h-touch flex items-center cursor-pointer">
            Voir les {data.length} valeurs
          </summary>
          <ul className="space-y-2">
            {data.map((row) => (
              <li key={row.name} className="flex justify-between gap-4">
                <span>{row.name}</span>
                <span>{row.count}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
export function CatalogAnalysis({
  kind,
  entries,
  onFilter
}: {
  kind: CatalogKind;
  entries: CatalogEntry[];
  onFilter: (field: 'style' | 'hop' | 'status', value: string) => void;
}) {
  const production = measuredProduction(entries);
  const points = entries
    .filter((e) => e.abv !== undefined && e.ibu !== undefined)
    .map((e) => ({ name: e.name, id: e.id, abv: e.abv, ibu: e.ibu, volume: e.volumeL }));
  const noun = kind === 'recipes' ? 'recette' : 'brassin';
  return (
    <div className="space-y-4" aria-label={`Analyses des ${noun}s`}>
      <div className="border-y border-cave-800 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold text-cave-50">Le carnet en chiffres</h3>
          <span className="text-sm text-cave-400 text-right">
            {entries.length} {noun}
            {entries.length > 1 ? 's' : ''}
            <br />
            dans la sélection
          </span>
        </div>
        {kind === 'recipes' ? (
          <dl className="grid grid-cols-3 gap-3">
            <div>
              <dt className="text-sm text-cave-400">Styles</dt>
              <dd className="reading text-xl text-ebc-straw">
                {countGroups(entries, 'style').length}
              </dd>
            </div>
            <div>
                <dt className="text-sm text-cave-400">Avec brassin</dt>
              <dd className="reading text-xl text-cave-50">
                {entries.filter((e) => e.linkedBatches.length).length}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-cave-400">Houblons</dt>
              <dd className="reading text-xl text-hop">{countGroups(entries, 'hops').length}</dd>
            </div>
          </dl>
        ) : (
          <>
            <dl className="grid grid-cols-3 gap-3">
              <div>
                <dt className="text-sm text-cave-400">En cuve</dt>
                <dd className="reading text-xl text-hop">
                  {
                    entries.filter((e) => ['fermentation', 'garde'].includes(e.batch?.status ?? ''))
                      .length
                  }
                </dd>
              </div>
              <div>
                <dt className="text-sm text-cave-400">Brassés</dt>
                <dd className="reading text-xl text-ebc-straw">
                  {number(production.brewed)} <span className="text-sm">L</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-cave-400">Conditionnés</dt>
                <dd className="reading text-xl text-water">
                  {number(production.packaged)} <span className="text-sm">L</span>
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-cave-400">
              Volumes mesurés sur {production.measured} lot{production.measured > 1 ? 's' : ''}. Les
              volumes prévus et les lots annulés ne sont pas comptés.
            </p>
          </>
        )}
      </div>
      {kind === 'batches' && (
        <section className="panel p-4 space-y-3" aria-label="Volumes par mois de brassage">
          <div>
            <h4 className="font-semibold text-cave-50">Production mesurée</h4>
            <p className="text-sm text-cave-400">Lots regroupés par mois de brassage</p>
          </div>
          {production.months.length ? (
            <>
              <div
                className="h-56 w-full"
                role="img"
                aria-label={`Volumes brassés et conditionnés sur ${production.months.length} mois, valeurs détaillées ci-dessous`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={production.months} margin={{ left: -22, right: 0, bottom: 4 }}>
                    <CartesianGrid vertical={false} stroke="#3D342E" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#9A8A7E', fontSize: 12 }}
                      tickFormatter={(value) => `${value.slice(5)}/${value.slice(2, 4)}`}
                    />
                    <YAxis tick={{ fill: '#9A8A7E', fontSize: 12 }} unit=" L" />
                    <Tooltip
                      contentStyle={chartTooltip}
                      formatter={(value: number) => `${number(value)} L`}
                    />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <Bar
                      dataKey="brewed"
                      name="Brassés"
                      fill="#F2C14E"
                      radius={[3, 3, 0, 0]}
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="packaged"
                      name="Conditionnés"
                      fill="#5B8AA6"
                      radius={[3, 3, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <details className="text-sm text-cave-400">
                <summary className="min-h-touch flex items-center cursor-pointer">
                  Valeurs du graphique
                </summary>
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th>Mois</th>
                      <th>Brassés</th>
                      <th>Conditionnés</th>
                    </tr>
                  </thead>
                  <tbody>
                    {production.months.map((row) => (
                      <tr key={row.month}>
                        <td className="py-2">{row.month}</td>
                        <td>{number(row.brewed)} L</td>
                        <td>{number(row.packaged)} L</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          ) : (
            <p className="py-4 text-sm text-cave-400">
              Renseigne le volume brassé ou conditionné d’un lot pour voir la production réelle.
            </p>
          )}
          {production.undated > 0 && (
            <p className="text-sm text-cave-400">
              {production.undated} lot(s) sans date exploitable restent dans les totaux, hors du
              graphique mensuel.
            </p>
          )}
        </section>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <Distribution
          title="Styles de la sélection"
          data={countGroups(entries, 'style')}
          total={entries.length}
          onSelect={(name) => onFilter('style', name)}
          color="#F2C14E"
        />
        <Distribution
          title="Houblons les plus utilisés"
          data={countGroups(entries, 'hops')}
          total={entries.length}
          onSelect={(name) => onFilter('hop', name)}
          color="#8DAE79"
        />
      </div>
      <p className="text-sm text-cave-400 px-1">
        Touche un style ou un houblon pour retrouver les fiches correspondantes. Chaque fiche compte
        une fois par houblon.
      </p>
      {kind === 'batches' && (
        <Distribution
          title="Avancement des lots"
          data={BATCH_STATUSES.map((status) => ({
            name: statusOf(status).label,
            count: entries.filter((e) => e.batch?.status === status).length
          })).filter((row) => row.count)}
          total={entries.length}
          onSelect={(label) =>
            onFilter('status', BATCH_STATUSES.find((s) => statusOf(s).label === label)!)
          }
          color="#5B8AA6"
        />
      )}
      <section className="panel p-4 space-y-3" aria-label="Comparaison alcool et amertume">
        <div>
          <h4 className="font-semibold text-cave-50">Alcool et amertume</h4>
          <p className="text-sm text-cave-400">
            {kind === 'recipes' ? 'Cibles des recettes' : 'Alcool mesuré et IBU cible du lot'} ·{' '}
            {points.length}/{entries.length} fiches renseignées
          </p>
        </div>
        {points.length ? (
          <>
            <div
              className="h-56 w-full"
              role="img"
              aria-label="Nuage de points : alcool en pourcentage, amertume cible en IBU"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 5, left: -15, bottom: 14, right: 10 }}>
                  <CartesianGrid stroke="#3D342E" />
                  <XAxis
                    type="number"
                    dataKey="abv"
                    name="Alcool"
                    unit=" %"
                    tick={{ fill: '#9A8A7E', fontSize: 12 }}
                    label={{
                      value: 'Alcool (%)',
                      position: 'bottom',
                      fill: '#9A8A7E',
                      fontSize: 12
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="ibu"
                    name="Amertume cible"
                    unit=" IBU"
                    tick={{ fill: '#9A8A7E', fontSize: 12 }}
                  />
                  <ZAxis range={[65, 65]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="p-3 rounded-control text-sm" style={chartTooltip}>
                          <strong>{payload[0].payload.name}</strong>
                          <p>
                            {number(payload[0].payload.abv)} % · {number(payload[0].payload.ibu)}{' '}
                            IBU
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Scatter data={points} fill="#F2C14E" isAnimationActive={false} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <details className="text-sm text-cave-400">
              <summary className="min-h-touch flex items-center cursor-pointer">
                Détail des {points.length} points
              </summary>
              <ul className="space-y-2">
                {points.map((p) => (
                  <li key={p.id} className="flex justify-between gap-4">
                    <span>{p.name}</span>
                    <span className="shrink-0">
                      {number(p.abv!)} % · {number(p.ibu!)} IBU
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </>
        ) : (
          <p className="py-4 text-sm text-cave-400">
            Aucune fiche ne possède encore les deux valeurs. Les données absentes ne sont pas
            remplacées par zéro.
          </p>
        )}
      </section>
    </div>
  );
}
