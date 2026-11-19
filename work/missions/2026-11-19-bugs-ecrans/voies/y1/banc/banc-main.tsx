// Banc local de la voie y1 (dev seulement, jamais livré, données SIMULÉES « ZZ TEST ») : monte le VRAI écran Stocks › Courses
// avec le VRAI bouton + flottant (FloatingActions, ancre « nav ») et une barre d'onglets de 56 px, sans passer par l'App (vide sous ?dev-local).
// ?theme=clair|cave
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../../../src/index.css';
import { StocksTab } from '../../../../../../src/components/tabs/StocksTab';
import { FloatingActions } from '../../../../../../src/ui/FloatingActions';
import { StorageService } from '../../../../../../src/services/storage';
import type { StockItem } from '../../../../../../src/types';

const q = new URLSearchParams(location.search);
const theme = q.get('theme') === 'cave' ? 'cave' : 'clair';
document.documentElement.dataset.theme = theme;
try { localStorage.setItem('laffinee.theme', theme); } catch { /* ignoré */ }
document.documentElement.style.setProperty('--main-navigation-height', '56px');
StorageService.setUiState('stocks_subtab', 'courses');

const art = (n: number, name: string, category: string, unit: string, currentStock: number, minStock: number, supplier: string, extra: Partial<StockItem> = {}): StockItem =>
  ({ id: `ZZ-${n}`, ref: `ZZ-MP-${n}`, name: `ZZ TEST — ${name}`, category, unit, currentStock, minStock, reorder: false, supplier, ...extra }) as StockItem;
const items: StockItem[] = [
  art(1, 'Maris Otter', 'Malt', 'kg', 2, 25, 'Brau-Rauchshop'),
  art(2, 'Flocons d’avoine', 'Malt', 'kg', 0.5, 3, 'Brau-Rauchshop'),
  art(3, 'Citra 12,4 %', 'Houblon', 'g', 66.3, 200, 'Brau-Rauchshop'),
  art(4, 'Acide lactique 80 %', 'Additif', 'L', 0, 2, 'Bauhaus'),
  art(5, 'Lactose', 'Additif', 'g', 120, 133.7, 'Bauhaus'),
  art(6, 'Star San', 'CIP', 'L', 0, 0, 'Bauhaus', { reorder: true }),
  art(7, 'SafAle US-05', 'Levure', 'sachet', 1, 4, 'Bauhaus'),
  art(8, 'Capsule 26 mm', 'Emballage', 'pièce', 150, 1200, 'Bauhaus'),
  art(9, 'Bouteille 33 cl', 'Emballage', 'pièce', 40, 480, 'Bauhaus'),
  art(10, 'Pilsner', 'Malt', 'kg', 1, 50, 'Brau-Rauchshop'),
  art(11, 'Munich', 'Malt', 'kg', 0, 5, 'Brau-Rauchshop'),
  art(12, 'Idaho 7', 'Houblon', 'g', 20, 300, 'Brau-Rauchshop'),
  art(13, 'Mosaic', 'Houblon', 'g', 0, 250, 'Brau-Rauchshop'),
  art(14, 'Gypse', 'Additif', 'g', 10, 100, 'Bauhaus'),
  art(15, 'Étiquette', 'Emballage', 'pièce', 0, 800, 'Bauhaus'),
];
const rien = () => undefined;

const Banc = () => (
  <>
    <div className="min-h-screen"><StocksTab stocks={{ rawMaterials: items, cleaning: [], equipment: [], kegs: [] }} batches={[]} onSuccessMessage={rien} /></div>
    <div className="app-bottom-dock"><nav className="nav-principale fixed left-0 right-0 bottom-0 z-40 flex border-t border-cave-800 bg-cave-950" style={{ height: 56 }} aria-label="Onglets (banc)">
      {['Accueil', 'Stocks', 'Brassins', 'Finances', 'Calendrier'].map((n) => <span key={n} className="flex-1 grid place-items-center text-sm text-cave-400">{n}</span>)}
    </nav></div>
    <FloatingActions action={null} onAction={rien} companionLabel="Stocks" anchor="nav" />
  </>
);
createRoot(document.getElementById('root')!).render(<Banc />);
