import React, { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import {
  CatalogEntry,
  CatalogKind,
  batchEntries,
  countGroups
} from '../../domain/productionCatalog';
import type { Batch } from '../../types';
import { type BatchDetailSection, isPackaged, isProduced } from '../../domain/productionInsights';
import { BatchOutcomeAnalysis } from './BatchOutcomeAnalysis';
import { isArchived } from '../../domain/catalogOrganization';
import { horsBilan, houblonsBilan, moisBilan, nombre, resumeNote } from './bilan/bilanModel';
import './bilan/bilan.css';

const number = (value: number) => value.toLocaleString('fr-CH', { maximumFractionDigits: 1 });
const CHIPS_VISIBLES = 10;

function Titre({ children, note }: { children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <h4 className="bil-h3">
      {children}
      {note !== undefined && <span>{note}</span>}
    </h4>
  );
}

/** Une puce : au toucher elle filtre la liste (comme avant), sinon elle se lit seulement. */
function Puce({
  children,
  onClick,
  label,
  vide
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label?: string;
  vide?: boolean;
}) {
  const cls = `bil-chip${vide ? ' vide' : ''}`;
  return onClick ? (
    <button type="button" className={cls} onClick={onClick} aria-label={label}>
      {children}
    </button>
  ) : (
    <span className={cls}>{children}</span>
  );
}

export function CatalogAnalysis({
  kind,
  entries,
  onFilter,
  onOpenBatch,
  includeArchivedBatches = true,
  onBack,
  onFolder
}: {
  kind: CatalogKind;
  entries: CatalogEntry[];
  onFilter: (field: 'style' | 'hop' | 'status', value: string) => void;
  onOpenBatch: (batch: Batch, section?: BatchDetailSection) => void;
  includeArchivedBatches?: boolean;
  /** « ‹ Le bilan » : retour à la liste des brassins (e7a). */
  onBack?: () => void;
  /** L'interrupteur « Archives » pilote le dossier de l'app (un seul réglage) ; sans lui, il reste local. */
  onFolder?: (folder: 'current' | 'all') => void;
}) {
  const [localArchives, setLocalArchives] = useState(includeArchivedBatches);
  useEffect(() => setLocalArchives(includeArchivedBatches), [includeArchivedBatches]);
  const withArchives = onFolder ? includeArchivedBatches : localArchives;
  const basculerArchives = () => {
    if (onFolder) onFolder(withArchives ? 'current' : 'all');
    else setLocalArchives((v) => !v);
  };
  const [tousHoublons, setTousHoublons] = useState(false);
  const noun = kind === 'recipes' ? 'recette' : 'brassin';
  const associatedEntries =
    kind === 'batches'
      ? entries
      : batchEntries([
          ...new Map(entries.flatMap((e) => e.linkedBatches).map((b) => [b.id, b])).values()
        ]);
  const archivedCount = associatedEntries.filter(isArchived).length;
  const resultEntries = (kind === 'batches' ? withArchives : includeArchivedBatches)
    ? associatedEntries
    : associatedEntries.filter((e) => !isArchived(e));
  const tastingEntries = resultEntries.filter(
    (e) => e.batch && isPackaged(e.batch) && e.batch.notesTasting?.trim()
  );
  // Un lot planifié ou annulé n'entre pas dans le bilan ; pour les recettes, la sélection entière.
  const bilanEntries = kind === 'batches' ? resultEntries.filter((e) => e.batch && isProduced(e.batch)) : entries;
  const styles = countGroups(bilanEntries, 'style');
  const houblons = houblonsBilan(bilanEntries);
  const horsLots = kind === 'batches' ? horsBilan(resultEntries) : [];
  const alcool = bilanEntries.filter((e) => e.abv !== undefined || e.ibu !== undefined);
  const production = moisBilan(resultEntries);

  return (
    <div className="space-y-4" aria-label={`Analyses des ${noun}s`}>
      {kind === 'recipes' ? (
        <div className="border-y border-cave-800 py-4">
          {associatedEntries.some(isArchived) && (
            <p className="text-sm text-cave-400 mb-3">
              Historique des brassins associés · {associatedEntries.filter(isArchived).length} archive(s)
              {includeArchivedBatches ? ' incluse(s)' : ' exclue(s)'} dans les résultats.
            </p>
          )}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-lg font-semibold text-cave-50">Les résultats de mes recettes</h3>
            <span className="text-sm text-cave-400 text-right">
              {entries.length} {noun}
              {entries.length > 1 ? 's' : ''}
              <br />
              dans la sélection
            </span>
          </div>
          <dl className="grid grid-cols-3 gap-3">
            <div>
              <dt className="text-sm text-cave-400">Brassées</dt>
              <dd className="reading text-xl text-ebc-straw">
                {entries.filter((e) => e.linkedBatches.some(isProduced)).length}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-cave-400">À essayer</dt>
              <dd className="reading text-xl text-cave-50">
                {entries.filter((e) => !e.linkedBatches.some(isProduced)).length}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-cave-400">Dégustations</dt>
              <dd className="reading text-xl text-hop">{tastingEntries.length}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="bil-outils">
          {onBack && (
            <button type="button" className="bil-back" onClick={onBack} aria-label="Retour aux brassins">
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
          )}
          <h3 className="bil-h3" style={{ margin: 0, fontSize: 18 }}>
            Le bilan
          </h3>
          <button
            type="button"
            className="bil-arch"
            aria-pressed={withArchives && archivedCount > 0}
            onClick={basculerArchives}
            aria-label={
              archivedCount === 0
                ? `Archives : aucun brassin archivé pour l’instant, ${withArchives ? 'inclus' : 'exclus'}`
                : `Archives : ${archivedCount} brassin${archivedCount > 1 ? 's' : ''} archivé${archivedCount > 1 ? 's' : ''}, ${withArchives ? 'inclus' : 'exclus'}`
            }
          >
            <span className="bil-sw" aria-hidden />
            Archives
          </button>
        </div>
      )}
      {(kind === 'batches' || resultEntries.length > 0) && (
        <BatchOutcomeAnalysis entries={resultEntries} onOpenBatch={onOpenBatch}>
          {kind === 'batches' && (
            <>
              <Titre
                note={
                  <>
                    <span className="font-mono tabular-nums">{nombre(production.brewed)} L</span> brassés
                  </>
                }
              >
                Par mois de brassage
              </Titre>
              {production.mois.length ? (
                <>
                  <div className="bil-leg">
                    <span>
                      <i style={{ background: 'rgb(var(--cave-texte-200))' }} />
                      brassé
                    </span>
                    <span>
                      <i style={{ background: 'rgb(var(--hop))' }} />
                      conditionné
                    </span>
                  </div>
                  <div
                    className="bil-panneau bil-month"
                    role="img"
                    aria-label={`Volumes brassés et conditionnés par mois : ${production.mois
                      .map((m) => `${m.libelle} ${number(m.brewed)} L brassés, ${number(m.packaged)} L conditionnés`)
                      .join(' ; ')}`}
                  >
                    {production.mois.map((m) => (
                      <div className="bil-mo" key={m.mois}>
                        <div className="bil-cols">
                          <i
                            className="bil-c"
                            style={{ height: `${(m.brewed / production.max) * 64}px`, background: 'rgb(var(--cave-texte-200))' }}
                          />
                          <i
                            className="bil-c"
                            style={{
                              height: `${Math.max((m.packaged / production.max) * 64, 3)}px`,
                              background: m.packaged ? 'rgb(var(--hop))' : 'rgb(var(--cave-700))'
                            }}
                          />
                        </div>
                        <span>
                          <b className="font-mono tabular-nums">{nombre(m.brewed)}</b> · {m.libelle}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="bil-vide">Renseigne le volume brassé ou conditionné d’un lot pour voir la production réelle.</p>
              )}
              {production.undated > 0 && (
                <p className="bil-note">
                  {production.undated} lot(s) sans date exploitable restent dans les totaux, hors des mois.
                </p>
              )}
            </>
          )}
          <Titre>{kind === 'batches' ? 'Styles et avancement' : 'Styles'}</Titre>
          {styles.length || horsLots.length ? (
            <div className="bil-chips">
              {styles.slice(0, 12).map(({ name, count }) => (
                <Puce key={name} onClick={() => onFilter('style', name)} label={`Filtrer : ${name}, ${count} sur ${bilanEntries.length}`}>
                  {name} <span className="font-mono tabular-nums">{count}</span>
                </Puce>
              ))}
              {horsLots.map((h) => (
                <Puce
                  key={`${h.status}|${h.style}`}
                  vide
                  onClick={() => onFilter('status', h.status)}
                  label={`Filtrer : ${h.style} ${h.status === 'planifie' ? 'prévu' : 'annulé'}`}
                >
                  {h.style}
                  {h.n > 1 ? ` ×${h.n}` : ''} {h.status === 'planifie' ? 'prévu' : 'annulé'} · hors bilan
                </Puce>
              ))}
            </div>
          ) : (
            <p className="bil-vide">Aucune donnée renseignée dans cette sélection.</p>
          )}
          <Titre>Houblons</Titre>
          {houblons.length ? (
            <div className="bil-chips">
              {(tousHoublons ? houblons : houblons.slice(0, CHIPS_VISIBLES)).map((h) => (
                <Puce key={h.nom} onClick={() => onFilter('hop', h.nom)} label={`Filtrer : ${h.nom}`}>
                  {h.nom}{' '}
                  <span className="font-mono tabular-nums">
                    {kind === 'batches' && h.grammes > 0
                      ? `${nombre(h.grammes, 0)} g`
                      : `${h.fiches} fiche${h.fiches > 1 ? 's' : ''}`}
                  </span>
                </Puce>
              ))}
              {houblons.length > CHIPS_VISIBLES && (
                <Puce onClick={() => setTousHoublons(!tousHoublons)} label={tousHoublons ? 'Réduire les houblons' : 'Voir tous les houblons'}>
                  {tousHoublons ? 'Réduire' : `+ ${houblons.length - CHIPS_VISIBLES}`}
                </Puce>
              )}
            </div>
          ) : (
            <p className="bil-vide">Aucun houblon renseigné dans cette sélection.</p>
          )}
          <Titre>Alcool et amertume</Titre>
          {alcool.length ? (
            <div className="bil-chips">
              {alcool.slice(0, 12).map((e) => (
                <Puce key={e.id}>
                  {e.name}{' '}
                  <span className="font-mono tabular-nums">
                    {e.abv !== undefined ? `${nombre(e.abv)} %` : 'alcool —'}
                    {e.batch?.status === 'fermentation' && e.abv !== undefined ? ' provisoire' : ''}
                  </span>
                  {' · '}IBU {e.ibu !== undefined ? <span className="font-mono tabular-nums">{nombre(e.ibu, 0)} cible</span> : '—'}
                </Puce>
              ))}
            </div>
          ) : (
            <p className="bil-vide">Aucune fiche ne possède encore ces valeurs. Une donnée absente n’est jamais comptée comme zéro.</p>
          )}
          {tastingEntries.length > 0 && (
            <>
              <Titre note={<span className="font-mono tabular-nums">{tastingEntries.length}</span>}>
                Retours de dégustation
              </Titre>
              <div className="bil-chips">
                {tastingEntries.slice(0, 6).map((e) => (
                  <Puce
                    key={e.id}
                    onClick={() => onOpenBatch(e.batch!, 'tasting')}
                    label={`Dégustation de ${e.name} : ${e.batch!.notesTasting}`}
                  >
                    <span className="txt">
                      {e.name} · {resumeNote(e.batch!.notesTasting!)}
                    </span>
                  </Puce>
                ))}
              </div>
            </>
          )}
        </BatchOutcomeAnalysis>
      )}
      {kind === 'recipes' && resultEntries.length === 0 && (
        <p className="text-sm text-cave-200 border-l-2 border-water pl-3 py-1">
          Les résultats apparaîtront après les premiers brassins. Pour choisir entre deux recettes, utilise
          « Comparer » dans le carnet.
        </p>
      )}
    </div>
  );
}
