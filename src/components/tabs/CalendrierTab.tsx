import React, { useMemo, useState } from 'react';
import type { Batch, StockItem, Transaction } from '../../types';
import { StorageService } from '../../services/storage';
import { FinanceService } from '../../services/financeService';
import { useStorageValue } from '../../hooks/useLiveData';
import { buildForecast } from '../../domain/finance/forecast';
import { formatCHF, todayISO } from '../../domain/finance/ledger';
import { joursDepuisBrassage } from '../../domain/productionInsights';
import { fermentationReadings } from '../../domain/fermentationReadings';
import { articlesACommander } from '../../domain/stockLevel';
import { vueHorizon, etiquetteSemaine } from '../../domain/stock/horizon';
import { usePlusPage } from '../../ui/plusPage';
import {
  VOIES, duneSemaine, evenementsAgenda, evenementsArgent, evenementsBrassins, semainesDe, totalVoie,
  type EvenementCalendrier, type VoieCalendrier
} from '../../domain/calendrier';

/**
 * L'onglet Calendrier (choisi le 16.11, maquette onglet/v1 : sixième onglet de la barre, entre Finances et Brassins ; « Bord ne bouge pas »).
 * Dans l'ordre de la maquette : la semaine touchée (« Cette semaine », rangée de ce qui la touche), la rangée des six semaines, puis
 * les voies — une barre par élément, posée à sa semaine, son nom et son montant à côté.
 *
 * Tout vient de l'app : brassins (planifiés, en cuve), événements de l'agenda, lignes datées de la prévision de Finances. Aucun
 * exemple, aucun montant inventé ; un élément sans date n'est pas posé. Voir `domain/calendrier.ts`.
 */

interface CalendrierTabProps {
  transactions: Transaction[];
  batches: Batch[];
  stockItems: StockItem[];
  onOpenBatch: (batchId: string) => void;
  onOpenFinances: () => void;
  onOpenAgenda: () => void;
  /** Les courses (Stocks › Courses), pour la tâche « Commander pour… ». */
  onOpenCourses: () => void;
  /** Le + du calendrier : poser un brassin (le jour se choisit dans la feuille), une fête ou un marché (l'agenda), une dépense prévue. */
  onPoserBrassin: () => void;
  /** Reçoit le lundi (aaaa-mm-jj) de la semaine touchée. */
  onPoserFete: (lundi: string) => void;
  /** Reçoit le lundi (aaaa-mm-jj) de la semaine touchée : la dépense se prévoit à cette date, jamais payée. */
  onPoserDepense: (lundi: string) => void;
}

interface TacheCalendrier { id: string; titre: string; detail: string; ouvrir: () => void }

const lireFinance = () => FinanceService.snapshot();
const lireAgenda = () => StorageService.getCreativeItems();
const lireRecettes = () => StorageService.getRecipes();
/** Voies repliées au-delà : une prévision peut compter des dizaines de lignes, l'écran reste lisible et rien n'est caché sans le dire. */
const LIGNES_VISIBLES = 6;

/** Couleurs par voie (rubriques de l'app : brassins, agenda, ventes en vert « validé », achats en bleu de Finances). */
const STYLE: Record<VoieCalendrier, { texte: string; point: string; barre: string; mont: string }> = {
  brassins: { texte: 'text-area-production', point: 'bg-area-production', barre: 'border-area-production bg-area-production/15', mont: 'text-area-production' },
  evenements: { texte: 'text-area-agenda', point: 'bg-area-agenda', barre: 'border-area-agenda bg-area-agenda/15', mont: 'text-area-agenda' },
  ventes: { texte: 'text-hop-texte', point: 'bg-hop', barre: 'border-hop bg-hop/15', mont: 'text-hop-texte' },
  achats: { texte: 'text-area-finances', point: 'bg-area-finances', barre: 'border-area-finances bg-area-finances/15', mont: 'text-area-finances' }
};

const montant = (centimes: number) => `${centimes < 0 ? '−' : '+'}${formatCHF(Math.abs(centimes)).replace(/^CHF\s?/, '')}`;
const jourLong = (iso: string) => new Intl.DateTimeFormat('fr-CH', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));

export function CalendrierTab({ transactions, batches, stockItems, onOpenBatch, onOpenFinances, onOpenAgenda, onOpenCourses, onPoserBrassin, onPoserFete, onPoserDepense }: CalendrierTabProps) {
  const aujourdhui = todayISO();
  const semaines = useMemo(() => semainesDe(aujourdhui), [aujourdhui]);
  const finance = useStorageValue(lireFinance);
  const agenda = useStorageValue(lireAgenda);
  const recettes = useStorageValue(lireRecettes);
  const [choisie, setChoisie] = useState(0);
  const [toutes, setToutes] = useState<Partial<Record<VoieCalendrier, boolean>>>({});

  const evenements = useMemo(() => {
    const prevision = buildForecast({
      transactions, payments: finance.payments, plans: finance.plans, profile: finance.profile, assets: finance.assets,
      asOf: aujourdhui, months: 3, batches, stockItems
    });
    return [
      ...evenementsBrassins(batches, semaines, aujourdhui, batch => joursDepuisBrassage(batch)),
      ...evenementsAgenda(agenda, semaines),
      ...evenementsArgent(prevision.items, semaines)
    ];
  }, [transactions, finance, agenda, batches, stockItems, semaines, aujourdhui]);

  const ouvrir = (e: EvenementCalendrier) => {
    if (e.batchId) onOpenBatch(e.batchId);
    else if (e.voie === 'evenements') onOpenAgenda();
    else onOpenFinances();
  };

  const semaine = semaines[choisie];

  /* Le + de l'écran (onglet/v1) : trois gestes sous « Sur Calendrier », avec la semaine touchée. Le jour exact se choisit dans la feuille qui s'ouvre. */
  usePlusPage({
    titre: 'Calendrier',
    surOnglets: true,
    actions: [
      { id: 'brassin', label: `Poser un brassin en S${semaine.numero}`, hint: 'tu choisis le jour', genre: 'brasser', lancer: onPoserBrassin },
      { id: 'fete', label: 'Poser une fête ou un marché', genre: 'ajouter', lancer: () => onPoserFete(semaine.debut) },
      { id: 'depense', label: `Prévoir une dépense en S${semaine.numero}`, hint: 'à saisir', genre: 'ajouter', lancer: () => onPoserDepense(semaine.debut) }
    ]
  });

  /* Ce qui est dû, avec son cercle : lu des mêmes données que le Bord et les Stocks, jamais inventé. Une tâche disparaît quand sa cause disparaît. */
  const taches = useMemo<TacheCalendrier[]>(() => {
    const liste: TacheCalendrier[] = [];
    for (const b of batches) {
      if (b.status !== 'fermentation' || b.archivedAt) continue;
      if (fermentationReadings(b).latest === undefined) liste.push({ id: `densite-${b.id}`, titre: `Mesurer la densité de ${b.id}`, detail: `${b.name} · aucune densité relevée`, ouvrir: () => onOpenBatch(b.id) });
    }
    const vue = vueHorizon(articlesACommander(stockItems, batches, recettes), batches, aujourdhui);
    if (vue.brassin && vue.comptes.brassin > 0) {
      liste.push({
        id: 'courses', titre: `Commander pour ${vue.brassin.nom}`,
        detail: `${vue.comptes.brassin} article${vue.comptes.brassin > 1 ? 's' : ''} avant ${etiquetteSemaine(vue.limiteBrassin)}`, ouvrir: onOpenCourses
      });
    }
    return liste;
  }, [batches, stockItems, recettes, aujourdhui, onOpenBatch, onOpenCourses]);
  const dansLaSemaine = duneSemaine(evenements, choisie);
  const vide = evenements.length === 0;

  return (
    <div className="space-y-3 pt-1 pb-[calc(var(--main-navigation-height,2.5rem)+6.5rem)] text-sm">
      <h1 className="sr-only">Calendrier</h1>

      {/* La semaine touchée : « Cette semaine » ou « S50 dès le 07.12 », avec « Aujourd’hui » pour revenir. */}
      <section aria-labelledby="cal-semaine" className="rounded-panel border border-cave-800 bg-cave-900">
        <div className="flex min-h-11 items-center gap-2 px-3">
          <h2 id="cal-semaine" className="text-base font-bold text-cave-50">{choisie === 0 ? 'Cette semaine' : `S${semaine.numero}`}</h2>
          <span className="min-w-0 flex-1 truncate text-sm text-cave-200">{choisie === 0 ? jourLong(aujourdhui) : `dès le ${semaine.jourMois}`}</span>
          {choisie > 0 && (
            <button type="button" onClick={() => setChoisie(0)}
              className="min-h-9 shrink-0 rounded-full border-2 border-area-finances px-3 text-sm font-bold text-area-finances">Aujourd’hui</button>
          )}
        </div>
        <div className="divide-y divide-cave-800 border-t border-cave-800">
          {choisie === 0 && taches.map(t => (
            <button key={t.id} type="button" onClick={t.ouvrir} data-tache className="flex min-h-[52px] w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-cave-850">
              <span aria-hidden="true" className="h-6 w-6 shrink-0 rounded-full border-2 border-cave-400" />
              <span className="min-w-0 flex-1">
                <b className="block text-base font-semibold text-cave-50">{t.titre}</b>
                <span className="block text-sm text-cave-200">{t.detail}</span>
              </span>
            </button>
          ))}
          {vide && taches.length === 0 && <p className="px-3 py-4 text-center text-base text-cave-200"><b className="mb-1 block text-cave-50">Rien de posé sur ces 6 semaines.</b>Un brassin, une fête ou une dépense se pose avec le +.</p>}
          {!vide && dansLaSemaine.length === 0 && (choisie > 0 || taches.length === 0) && <p className="px-3 py-4 text-center text-base text-cave-200">Rien cette semaine.</p>}
          {dansLaSemaine.map(e => (
            <button key={e.id} type="button" onClick={() => ouvrir(e)} className="flex min-h-[52px] w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-cave-850">
              <span aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 rounded-full ${STYLE[e.voie].point}`} />
              <span className="min-w-0 flex-1">
                <b className="block truncate text-base font-semibold text-cave-50">{e.titre}</b>
                <span className="block text-sm text-cave-200">{e.detail}</span>
              </span>
              {e.centimes !== undefined && <span className={`shrink-0 whitespace-nowrap font-mono text-base ${e.centimes < 0 ? 'text-alert-strong' : 'text-hop-texte'}`}>{montant(e.centimes)}</span>}
            </button>
          ))}
        </div>
      </section>

      {/* Les six semaines : toucher une semaine change le bloc du haut. */}
      <div role="tablist" aria-label="Semaines" className="grid grid-cols-6 border-b border-cave-700">
        {semaines.map(s => (
          <button key={s.debut} type="button" role="tab" aria-selected={s.index === choisie} onClick={() => setChoisie(s.index)}
            className={`flex min-h-[54px] flex-col items-center justify-center rounded-t-control py-1.5 ${s.index === choisie ? 'bg-cave-850 shadow-[inset_0_-3px_0_rgb(var(--area-production))]' : 'hover:bg-cave-850'}`}>
            <b className={`text-base ${s.index === 0 ? 'text-area-finances' : 'text-cave-50'}`}>S{s.numero}</b>
            <span className="font-mono text-sm text-cave-200">{s.jourMois}</span>
          </button>
        ))}
      </div>

      {/* Les voies, sur les mêmes six colonnes. */}
      {!vide && (
        <div className="relative">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-6">
            {semaines.map(s => <i key={s.debut} className={`border-l border-cave-800 first:border-l-0 ${s.index === choisie ? 'bg-cave-850/70' : ''}`} />)}
          </div>
          {VOIES.map(voie => {
            const lignes = evenements.filter(e => e.voie === voie.id);
            if (!lignes.length) return null;
            const total = totalVoie(evenements, voie.id);
            const montrees = toutes[voie.id] ? lignes : lignes.slice(0, LIGNES_VISIBLES);
            return (
              <section key={voie.id} aria-label={voie.nom} className="relative pb-1.5 pt-1">
                <h3 className={`relative my-1.5 flex items-center gap-1.5 text-base font-bold ${STYLE[voie.id].texte}`}>
                  <i aria-hidden="true" className={`h-3 w-3 rounded-[3px] ${STYLE[voie.id].point}`} />{voie.nom}
                  <small className="ml-auto font-mono text-sm font-normal text-cave-200">{lignes.length}{total !== null && ` · ${montant(total)}`}</small>
                </h3>
                {montrees.map(e => <Barre key={e.id} e={e} onOpen={ouvrir} />)}
                {lignes.length > LIGNES_VISIBLES && (
                  <button type="button" onClick={() => setToutes(t => ({ ...t, [voie.id]: !t[voie.id] }))} aria-expanded={!!toutes[voie.id]}
                    className="relative min-h-9 px-2 text-sm font-semibold text-cave-200 underline underline-offset-2">
                    {toutes[voie.id] ? 'Réduire' : `Voir les ${lignes.length - LIGNES_VISIBLES} autres`}
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}

      {!vide && <p className="px-1 text-sm text-cave-400">Ventes et achats : les lignes datées de la prévision de Finances. Ce qui n’a pas de date n’est pas posé ici.</p>}
    </div>
  );
}

/** Une barre à sa semaine ; son nom et son montant à côté, du côté où il reste le plus de place (comme la maquette). */
function Barre({ e, onOpen }: { e: EvenementCalendrier; onOpen: (e: EvenementCalendrier) => void }) {
  const col = 100 / 6, gauche = e.a * col, largeur = (e.b - e.a + 1) * col;
  const aGauche = e.b >= 3;
  const libre = aGauche ? gauche : 100 - gauche - largeur;
  return (
    <div className="relative h-[42px]">
      <button type="button" onClick={() => onOpen(e)} aria-label={`${e.titre}, ${e.detail}${e.centimes !== undefined ? `, ${montant(e.centimes)}` : ''}`}
        className={`absolute top-[3px] h-9 rounded-control border-[1.5px] border-l-[5px] ${STYLE[e.voie].barre}`}
        style={{ left: `calc(${gauche}% + 2px)`, width: `calc(${largeur}% - 4px)` }} />
      <span className="pointer-events-none absolute top-[3px] flex h-9 items-center overflow-hidden whitespace-nowrap text-sm font-semibold text-cave-50"
        style={aGauche ? { right: `calc(${100 - gauche}% + 6px)`, maxWidth: `calc(${libre}% - 8px)` } : { left: `calc(${gauche + largeur}% + 6px)`, maxWidth: `calc(${libre}% - 8px)` }}>
        <span className="truncate">{e.titre}</span>{e.centimes !== undefined && <span className={`ml-1.5 shrink-0 font-mono text-sm font-semibold ${STYLE[e.voie].mont}`}>{montant(e.centimes)}</span>}
      </span>
    </div>
  );
}
