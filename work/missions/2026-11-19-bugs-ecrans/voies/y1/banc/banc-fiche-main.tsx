// Banc local de la voie y1 (dev seulement, jamais livré, données SIMULÉES « ZZ TEST ») : la VRAIE fiche recette (RecipePage) avec le VRAI + (FloatingActions,
// ancre « page » comme sur une page plein écran). Sert à rejouer BR-103 / TL-31 / BE-56 en défilant. ?theme=clair|cave
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../../../src/index.css';
import { RecipePage } from '../../../../../../src/pages/RecipePage';
import { FloatingActions } from '../../../../../../src/ui/FloatingActions';
import { defaultConfig } from '../../../../../../src/services/storage';
import { fullRecipe } from '../../../../../../tests/fixtures/fullRecipe';
import type { Recipe } from '../../../../../../src/types';

const q = new URLSearchParams(location.search);
const theme = q.get('theme') === 'cave' ? 'cave' : 'clair';
document.documentElement.dataset.theme = theme;
try { localStorage.setItem('laffinee.theme', theme); } catch { /* ignoré */ }
const recette: Recipe = { ...structuredClone(fullRecipe), id: 'ZZ-Y1', name: 'ZZ TEST — fiche', volumeL: 20 };
const rien = () => undefined;
createRoot(document.getElementById('root')!).render(
  <>
    <RecipePage recipe={recette} batches={[]} config={defaultConfig} onClose={rien} onEdit={rien} onDuplicate={rien} onDelete={rien} onBrew={rien} onOpenBatch={rien} />
    <FloatingActions action={null} onAction={rien} companionLabel="Recettes" anchor="page" />
  </>
);
