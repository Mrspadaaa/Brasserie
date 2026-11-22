import React, { useId } from 'react';
import type { StockItem } from '../../types';
import type { StockLevel } from '../../domain/stockLevel';
import type { InfoLigne } from '../../domain/stock/liste';
import { barreLigne, etatDit, familleTeinte, quantiteDeLigne, repereLigne, texteSousLeNom } from '../../domain/stock/ligne';
import { Star } from 'lucide-react';
import type { ArticleACommander } from '../../domain/stockLevel';
import { rayonDuMur } from '../../domain/stock/murRayon';
import { couleurMalt } from '../../domain/stock/mur';
import './liste.css';

/**
 * L'étoile d'épinglage de l'article (STG-NOTE-1) : le même dessin que `FavoriteToggle` (étoile de 16 px, mêmes couleurs, même geste, même libellé), avec une zone de
 * toucher de 44 × 44 px au lieu des 28 du jeton `touch`. Le dessin ne change pas ; seule la zone qui reçoit le doigt s'agrandit.
 */
export const EtoileStock: React.FC<{ active: boolean; onToggle: () => void; label: string }> = ({ active, onToggle, label }) => (
  <button type="button" data-etoile onClick={(e) => { e.stopPropagation(); onToggle(); }}
    aria-label={active ? `Retirer ${label} des favoris` : `Épingler ${label}`} aria-pressed={active}
    style={{ minWidth: 44, minHeight: 44 }}
    className="rounded-control shrink-0 inline-flex items-center justify-center transition-colors text-cave-400 hover:text-ebc-straw">
    <Star className={`w-4 h-4 transition-colors ${active ? 'fill-ebc-straw text-ebc-straw' : ''}`} />
  </button>
);

interface LigneStockProps {
  item: StockItem;
  info: InfoLigne;
  cmd?: ArticleACommander;
  level: StockLevel;
  /** Le niveau en mots (jauge lue par les lecteurs d'écran). */
  niveauDit: string;
  /** Texte lu par les lecteurs d'écran (quantité, niveau, réserves). */
  description: string;
  /** Une phrase de plus sous la ligne (réserve en fermentation) : dite, jamais cachée. */
  reserve?: { texte: string; connue: boolean };
  durabilite?: { texte: string; perime: boolean } | null;
  aujourdhui: string;
  /** Le dernier mouvement de l'article, dit (colonne visible à partir de 900 px) ; absent = « — ». */
  mouvementDit?: string;
  /** pe3 (règle « chaque geste décompte ce qu'il use ») : la trace du dernier geste, ↺ l'annule. */
  trace?: { texte: string; gesteId: string; annuler: () => void };
  /** Autres stocks (D423) : remplace la 2e ligne (état et seuil) par la sienne, pastille utile comprise. */
  sousNom?: React.ReactNode;
  onOpen: (item: StockItem) => void;
  onToggleFavorite: (item: StockItem) => void;
}

/**
 * Une ligne de la liste, telle que la maquette choisie sy/fA la dessine : pot et seuil à gauche, nom et état en mots, repère (EBC, α, DDM),
 * quantité à droite ; pour les trois rayons, une barre derrière la ligne à deux régimes (à l'échelle jusqu'au coude, resserrée au-delà,
 * coupure « ⫽ » et trait du coude), teintée de la famille (c3b) avec son liseré à gauche.
 */
export const LigneStock: React.FC<LigneStockProps> = ({ item, info, cmd, level, niveauDit, description, reserve, durabilite, aujourdhui, mouvementDit, trace, sousNom, onOpen, onToggleFavorite }) => {
  const descriptionId = useId();
  const fam = familleTeinte(item);
  const rayon = rayonDuMur(item);
  const barre = barreLigne(item);
  const dit = etatDit(item, info, cmd, aujourdhui);
  const repere = repereLigne(item, info, couleurMalt);
  const inconnu = info.classe === 'compter';
  const pot = info.pot;
  const niveauConnu = level.source !== 'aucune';
  return (
    <article className="stock-liste l1-li" data-ligne data-fam={fam} data-et={info.etats.join(' ')} data-rayon={rayon ?? undefined}>
      <button type="button" className="l1-row" onClick={() => onOpen(item)} aria-label={`Ouvrir ${item.name}`} aria-describedby={descriptionId}>
        <span className={`l1-mk ${inconnu ? 'l1-mk-q' : info.classe === 'epuise' ? 'l1-mk-ep' : pot === null || pot.seuil === null ? 'l1-mk-ss' : info.classe === 'bas' || info.classe === 'manque' ? 'l1-mk-bas' : ''}`}
          role={niveauConnu && !inconnu ? 'meter' : undefined}
          aria-valuenow={niveauConnu && !inconnu ? Math.round(level.fillPercent) : undefined}
          aria-valuemin={niveauConnu && !inconnu ? 0 : undefined}
          aria-valuemax={niveauConnu && !inconnu ? 100 : undefined}
          aria-valuetext={niveauConnu && !inconnu ? niveauDit : undefined}
          aria-label={niveauConnu && !inconnu ? (level.source === 'minStock' ? 'Niveau face au seuil minimum' : 'Couverture des brassins') : undefined}
          aria-hidden={niveauConnu && !inconnu ? undefined : true}>
          {inconnu ? '?' : <>
            {pot && pot.rempli > 0 && <i style={{ height: `${Math.round(pot.rempli * 100)}%` }} />}
            {pot && pot.seuil !== null && <b style={{ bottom: `${Math.round(pot.seuil * 100)}%` }} />}
          </>}
        </span>
        <span className="l1-nm">
          <span className="l1-n1">{item.name}</span>
          {sousNom ? <span className="l1-n2 la-sous">{sousNom}</span> : <span className={`l1-n2 l1-s-${dit.classe}`}>{texteSousLeNom(dit)}</span>}
        </span>
        {repere
          ? <span title={repere.titre} className={`l1-rp${repere.inconnu ? ' l1-rp-q' : ''}${repere.alerte ? ' l1-rp-w' : ''}`}>
              {repere.couleur && <i className="l1-sw" style={{ background: repere.couleur }} />}{repere.texte}
            </span>
          : <span />}
        <span className="l1-qt">
          {inconnu
            ? <b className="l1-q l1-q-c">à compter</b>
            : <b className={`l1-q${item.currentStock <= 0 ? ' l1-q-0' : ''}`}>{quantiteDeLigne(item)}</b>}
        </span>
        {/* La colonne « échelle » du tableau (≥ 900 px) ; en dessous elle n'a pas de boîte (display:contents) et la barre reste derrière la ligne. */}
        <span className="l1-ec-c" aria-hidden="true">
          {barre && <i className="l1-kg" style={{ ['--x' as string]: barre.x.toFixed(4) }}>
            {barre.coupe !== null && <b className="l1-cut" style={{ left: `${barre.coupe.toFixed(2)}%` }} />}
          </i>}
        </span>
        <span className="l1-c-mv">{mouvementDit ?? '—'}</span>
        <span className="l1-c-fo">{item.supplier?.trim() || '—'}</span>
      </button>
      {/* la DDM qui compte est déjà dite, avec ses jours, au deuxième rang de la ligne (etatDit) : pas de seconde phrase dessous */}
      {(reserve || trace || (durabilite && !info.etats.includes('ddm'))) && <div className="l1-plus">
        {reserve && <p className={reserve.connue ? 'l1-plus-r' : 'l1-plus-r l1-plus-w'}>{reserve.texte}</p>}
        {trace && <p data-stock-trace><button type="button" className="l1-trace" onClick={trace.annuler} aria-label={`Annuler : ${trace.texte}`}><span>{trace.texte}</span><span aria-hidden="true">↺</span></button></p>}
        {durabilite && !info.etats.includes('ddm') && <p data-stock-durabilite className={durabilite.perime ? 'l1-plus-a' : 'l1-plus-w'}>{durabilite.texte}</p>}
      </div>}
      <span id={descriptionId} className="sr-only">{description}</span>
      <div className="l1-fav"><EtoileStock active={!!item.favorite} onToggle={() => onToggleFavorite(item)} label={item.name} /></div>
    </article>
  );
};
