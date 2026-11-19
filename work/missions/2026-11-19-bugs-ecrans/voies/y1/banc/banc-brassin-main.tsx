// Banc local de la voie y1 (dev seulement, jamais livré, données SIMULÉES « ZZ TEST ») : monte la VRAIE fiche de brassin (BatchDetailSheet) sur un brassin
// planifié sans lien, avec le VRAI bouton + et une barre de 56 px. Sert à rejouer « Plus › Supprimer ce brassin » (T3-12). ?theme=clair|cave
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../../../src/index.css';
import { BatchDetailSheet } from '../../../../../../src/ui/BatchDetailSheet';
import { FloatingActions } from '../../../../../../src/ui/FloatingActions';
import { StorageService } from '../../../../../../src/services/storage';
import type { Batch } from '../../../../../../src/types';

const q = new URLSearchParams(location.search);
const theme = q.get('theme') === 'cave' ? 'cave' : 'clair';
document.documentElement.dataset.theme = theme;
try { localStorage.setItem('laffinee.theme', theme); } catch { /* ignoré */ }
document.documentElement.style.setProperty('--main-navigation-height', '56px');

const lot = { id: 'ZZ-LOT-020', name: 'ZZ TEST — recette', style: 'Pale Ale', volumeL: 20, brewDate: '20.11.2026', plannedBrewDate: '2026-11-20', status: 'planifie' } as unknown as Batch;
StorageService.addBatch(lot);
const rien = () => undefined;

const Banc = () => {
  const [ouvert, setOuvert] = React.useState(true);
  return (
    <>
      <div data-banc-etat={ouvert ? 'fiche' : 'fermee'} className="min-h-screen p-4 text-sm">Carnet des brassins (banc) : {StorageService.getBatches().length} brassin(s)</div>
      {ouvert && <BatchDetailSheet batch={lot} initialSection="overview" onClose={() => setOuvert(false)} />}
      <div className="app-bottom-dock"><nav className="nav-principale fixed left-0 right-0 bottom-0 z-40 flex border-t border-cave-800 bg-cave-950" style={{ height: 56 }} aria-label="Onglets (banc)">
        {['Accueil', 'Stocks', 'Brassins', 'Finances', 'Calendrier'].map((n) => <span key={n} className="flex-1 grid place-items-center text-sm text-cave-400">{n}</span>)}
      </nav></div>
      <FloatingActions action={null} onAction={rien} companionLabel="Brassins" anchor="nav" />
    </>
  );
};
createRoot(document.getElementById('root')!).render(<Banc />);
