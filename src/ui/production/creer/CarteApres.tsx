// c2a, état « après » : le brassin neuf en tête de la liste des brassins (e6a), ses effets en rangées, « Défaire » (suppression du brassin créé, geste existant).
// ACCORD : le modèle ne porte pas l'annulation d'UN effet seul (réservation, achats et cuve se déduisent du brassin) : pas de ↶ par rangée, un seul « Défaire ».
import { nombreFr } from '../../../domain/nombreAffiche';
import React, { useMemo } from 'react';
import { Boxes, Calendar, Check, ChevronRight, ShoppingCart, Undo2 } from 'lucide-react';
import type { Batch, Recipe, StockItem } from '../../../types';
import { effetsDe, type Effet } from './creerModel';
import { BeerStyleTag } from '../../BeerStyleTag';
import { styleCourt } from '../liste/listeModel';
import './creer.css';

const ICONE: Record<Effet['cle'], React.ReactNode> = { date: <Calendar aria-hidden="true" />, stock: <Boxes aria-hidden="true" />, achats: <ShoppingCart aria-hidden="true" /> };

interface Props {
  batch: Batch;
  recipe?: Recipe;
  batches: Batch[];
  stock: StockItem[];
  onDefaire: () => void;
  onOuvrir: () => void;
}

export function CarteApres({ batch, recipe, batches, stock, onDefaire, onOuvrir }: Props) {
  const effets = useMemo(() => effetsDe(batch, recipe, batches, stock), [batch, recipe, batches, stock]);
  return (
    <article className="c2a-cree" aria-live="polite" data-lot={batch.id}>
      <div className="c2a-ct">
        <span className="c2a-pastille"><Check aria-hidden="true" />Brassin créé</span>
        <span className="c2a-lot">{batch.id}</span>
        <span className="c2a-vol">{nombreFr(batch.volumeL, 1)} L</span>
      </div>
      <p className="c2a-rh"><span className="c2a-rn">{batch.name}</span>{(batch.style || recipe?.style) && <span className="c2a-style"><BeerStyleTag style={styleCourt(batch.style || recipe!.style)} /></span>}</p>
      <ul className="c2a-ef">
        {effets.map((e) => (
          <li key={e.cle} data-ton={e.ton}>
            <span className="c2a-ei">{ICONE[e.cle]}</span>
            <span className="c2a-et"><b>{e.titre}</b><small>{e.detail}</small></span>
          </li>
        ))}
      </ul>
      <div className="c2a-cp">
        <button type="button" className="c2a-btn" onClick={onDefaire}><Undo2 aria-hidden="true" />Défaire</button>
        <button type="button" className="c2a-btn c2a-primaire" onClick={onOuvrir}>Ouvrir {batch.id}<ChevronRight aria-hidden="true" /></button>
      </div>
    </article>
  );
}
