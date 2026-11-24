import fs from 'node:fs';
import { R } from './r.mjs';

R('tests/unit/carnetsLiensReprise.test.ts', [
  ["    expect(page.etapes?.find((e) => e.nom === 'ia')?.detail).toMatch(/^lite/);", "    /* T30-11 : l'étape dit ce qu'elle a fait, jamais un nom de modèle */\n    expect(page.etapes?.find((e) => e.nom === 'ia')?.detail).not.toMatch(/lite|fort|modèle/i);"],
]);
R('tests/unit/carnetsRangement.test.ts', [
  ["      undefined, expect.objectContaining({ url: 'https://pompe-inox.ch/p/12' }), expect.objectContaining({ url: 'https://pompe-inox.ch/p/12', statut: 'lue' })\n    ]);",
   "      undefined, expect.objectContaining({ url: 'https://pompe-inox.ch/p/12' }), expect.objectContaining({ url: 'https://pompe-inox.ch/p/12', statut: 'lue' }),\n      /* T30-10 : pendant que l'IA range, l'étape « Rangement » tourne */\n      expect.objectContaining({ url: 'https://pompe-inox.ch/p/12', statut: 'lue', rangement: true })\n    ]);"],
]);

fs.appendFileSync('tests/unit/carnetsFix30.test.ts', `
/* ---------- T30-9, T30-10, T30-11, T30-13, T30-14 : les étapes et les libellés en mots du brasseur ---------- */
import { lignesEtapes } from '../../src/domain/carnets/lecture';
import { libelleFrancais } from '../../functions/src/lienLibelles';
import { valeurFrancaise } from '../../functions/src/lienValeurs';
import { extraireProduit } from '../../functions/src/lienProduit';

describe('T30-10 : l’étape en cours se voit jusqu’au rangement', () => {
  const six = ['page', 'donnees', 'prix', 'photos', 'caract', 'controle'].map(nom => ({ nom, statut: 'trouve' as const }));
  it('page lue, six étapes trouvées : l’étape « Rangement » tourne, ce n’est pas « 6 sur 6 » muet', () => {
    const l = lignesEtapes(six, { rangement: true });
    expect(l.at(-1)).toMatchObject({ cle: 'rangement', statut: 'en-cours' });
    expect(l.filter(x => x.statut === 'trouve')).toHaveLength(6);
  });
  it('fini : plus d’étape « Rangement » ; lien mort : jamais', () => {
    expect(lignesEtapes(six, { rangement: true, fini: true }).some(x => x.cle === 'rangement')).toBe(false);
    expect(lignesEtapes([{ nom: 'page', statut: 'absent', detail: 'introuvable' }], { rangement: true }).some(x => x.cle === 'rangement')).toBe(false);
    expect(lignesEtapes(six).some(x => x.cle === 'rangement')).toBe(false);
  });
});

describe('T30-13, T30-14 : libellé et valeur en français', () => {
  it('« Height without extension legs » : « Hauteur sans pieds d’extension »', () => {
    expect(libelleFrancais('Height without extension legs')).toBe('Hauteur sans pieds d’extension');
    expect(libelleFrancais('Height with extension legs')).toBe('Hauteur avec pieds d’extension');
  });
  it('« Hopfenpellets Typ 90 » : « Pellets type 90 » ; le français ne bouge pas', () => {
    expect(valeurFrancaise('Hopfenpellets Typ 90')).toBe('Pellets type 90');
    expect(valeurFrancaise('Pellets type 90')).toBe('Pellets type 90');
    expect(valeurFrancaise('Mehrzweckhopfen')).toBe('Houblon mixte');
  });
});

describe('T30-9 : « 8 caractéristiques », sans « mesures » ni « ailleurs dans la page » seul', () => {
  const tableau = (n: number) => '<table>' + Array.from({ length: n }, (_, i) => '<tr><th>Mesure ' + i + '</th><td>' + (10 + i) + ' cm</td></tr>').join('') + '</table>';
  it('l’étape dit le nombre de caractéristiques', () => {
    const e = extraireProduit('<html><head><title>Produit</title></head><body><h1>Produit test</h1>' + tableau(8) + '</body></html>', new URL('https://exemple.test/p/1'));
    const caract = e.etapes.find(x => x.nom === 'caract');
    expect(caract?.detail ?? '').toMatch(/caractéristiques?/);
    expect(caract?.detail ?? '').not.toMatch(/mesure/);
    expect(caract?.detail ?? '').not.toMatch(/^\\d+ caractéristiques : \\d+ ailleurs dans la page$/);
  });
});
`);
