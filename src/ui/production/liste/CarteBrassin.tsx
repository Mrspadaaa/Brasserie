// La carte de brassin d'e6a : barre d'état, pastille de phase, lot et lieu, nom et style, lecture clé, un seul bouton d'action.
import React from 'react';
import { ChevronRight, Star } from 'lucide-react';
import type { Batch, KegItem } from '../../../types';
import type { CatalogEntry } from '../../../domain/productionCatalog';
import type { BatchDetailSection } from '../../../domain/productionInsights';
import { BeerStyleTag } from '../../BeerStyleTag';
import { CatalogItemMenu } from '../CatalogItemMenu';
import { carteModel, styleCourt } from './listeModel';
import './liste.css';

export function CarteBrassin({
  entry,
  now,
  kegs,
  onOpen,
  onBrew,
  onFavorite,
  onArchive
}: {
  entry: CatalogEntry;
  now?: number;
  kegs?: KegItem[];
  onOpen: (b: Batch, section?: BatchDetailSection) => void;
  onBrew: (b: Batch) => void;
  onFavorite: (e: CatalogEntry) => void;
  onArchive: (e: CatalogEntry, archived: boolean) => void;
}) {
  const batch = entry.batch!;
  const m = carteModel(entry, now, kegs);
  return (
    <article className="lst-card" aria-label={`Brassin ${entry.id}, ${entry.name}`}>
      <div className="lst-bar" data-ton={m.ton} aria-hidden />
      <div className="lst-body">
        <button type="button" className="lst-ouvrir" aria-label={`Ouvrir le brassin ${entry.id}`} onClick={() => onOpen(batch)}>
          <span className="lst-l1">
            <span className="lst-pastille" data-ton={m.ton}>{m.pastille}</span>
            <span>{m.lot}</span>
            {m.ou && <span>{m.ou}</span>}
            {entry.archivedAt && <span>· Archivé</span>}
          </span>
          <span className="lst-l2">
            <span className="lst-nom">{m.nom}</span>
            {m.style && <span className="lst-style" title={m.style}><BeerStyleTag style={styleCourt(m.style)} /></span>}
          </span>
        </button>
        <div className="lst-l3">
          <span className="lst-key">
            <span className="lst-reading">{m.cle}</span>
            {m.cleUnite && <span className="lst-unite">{m.cleUnite}</span>}
          </span>
          <button
            type="button"
            className="lst-btn lst-go"
            aria-label={`${m.action.label} · ${entry.id}`}
            onClick={() => (m.action.brew ? onBrew(batch) : onOpen(batch, m.action.section))}
          >
            {m.action.label}
            <ChevronRight aria-hidden />
          </button>
        </div>
      </div>
      <div className="lst-side">
        <button
          type="button"
          className={entry.favorite ? 'lst-fav' : ''}
          aria-pressed={entry.favorite}
          aria-label={entry.favorite ? `Retirer le brassin ${entry.id} des favoris` : `Épingler le brassin ${entry.id}`}
          onClick={() => onFavorite(entry)}
        >
          <Star aria-hidden />
        </button>
        <CatalogItemMenu entry={entry} onArchive={onArchive} />
      </div>
    </article>
  );
}
