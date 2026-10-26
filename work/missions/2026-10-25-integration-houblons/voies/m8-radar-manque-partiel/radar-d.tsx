// Voie m8, variante D (reprise après la critique : D180 et D181) : le radar de Substituer dessiné par le radar commun de l'app
// (RadarBase), avec le manque partiel passé comme un inconnu de la série (null) au lieu de 0. C'est la grammaire de Comparer :
// pas de point, le trait qui l'enjambe en tireté le long de l'anneau ou du bord (r2), une pastille « ? » à sa couleur au bord.
// Chargé par capturer.mjs dans la page de l'app (servi par Vite) ; rien de l'app n'est modifié.
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { RadarBase, type SerieRadar } from '../../../../../src/ui/hopIndex/commun/RadarBase';
import type { FamilyId } from '../../../../../src/domain/hopIndex/v4';

const AXES: FamilyId[] = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
let racine: Root | null = null;

export function rendre(boite: HTMLElement, series: SerieRadar[], marquees: FamilyId[]) {
  racine = createRoot(boite);
  racine.render(createElement(RadarBase, {
    familles: AXES, mode: 'absolu', objet: 'm8r-d', className: 'pq-substituer-radar', series, marquees,
    echelleAbsolue: { pas: 1, nb: 2, etiquettes: ['0', 'cité', 'marqué'] },
    label: 'Variante D : le manque partiel en inconnu de la série',
  }));
}
export function defaire() { racine?.unmount(); racine = null; }
