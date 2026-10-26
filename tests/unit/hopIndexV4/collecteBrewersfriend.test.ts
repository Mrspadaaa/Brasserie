// Voie c3d (#180) : l'index des houblons de Brewer's Friend (HTML synthétique).
import { describe, expect, it } from 'vitest';
import { lireIndexBrewersFriend } from '../../../scripts/collecte-hop/brewersfriend.mjs';

const ligne = (nom: string, chemin: string, forme: string, aa: string, emploi: string, n: string) =>
  `<tr><td><font><a href="${chemin}">${nom}</a></font></td><td><font>${forme}</font></td><td><font>${aa}</font></td><td><font>${emploi}</font></td><td><font>${n}</font></td></tr>`;

describe('lireIndexBrewersFriend', () => {
  it('lit une ligne par houblon et par forme, et ignore l’en-tête', () => {
    const html = `<table><tr><th>Name</th><th>Type</th><th>Average AA</th><th>Use</th><th>Recipes</th></tr>${ligne('Essai', '/hops/essai/', 'Pellet', '14.3', 'Boil', '6,408')}${ligne('Essai', '/hops/essai-2/', 'Leaf/Whole', '', 'Dry Hop', '12')}</table>`;
    const l = lireIndexBrewersFriend(html);
    expect(l).toHaveLength(2);
    expect(l[0]).toMatchObject({ nom: 'Essai', forme: 'Pellet', alpha: '14.3', emploi: 'Boil', recettes: '6408' });
    expect(l[1].alpha).toBe('');
  });
});
