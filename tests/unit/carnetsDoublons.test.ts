import { describe, expect, it } from 'vitest';
import { doublonsDe, memeTexte, notesEnDouble, similarite, uniquesParTexte, SEUIL_DOUBLON } from '../../src/domain/carnets/doublons';

describe('P11 : même texte normalisé (critères)', () => {
  it('casse, accents, espaces et ponctuation ne comptent pas ; une valeur différente, si ; le vide n’égale rien', () => {
    expect(memeTexte('plus de condensation au plafond', 'Plus de condensation  au plafond.')).toBe(true);
    expect(memeTexte('évier à 2 bacs', 'EVIER A 2 BACS')).toBe(true);
    expect(memeTexte('tient 80 °C', 'tient 90 °C')).toBe(false);
    expect(memeTexte('le débit', 'débit')).toBe(false);
    expect(memeTexte('', '  ')).toBe(false);
  });
  it('uniquesParTexte garde le premier (la source) et les ids qu’il couvre, dans l’ordre', () => {
    const u = uniquesParTexte([
      { id: 'K1', texte: 'plus de condensation au plafond' }, { id: 'K2', texte: 'tient 80 °C' },
      { id: 'K3', texte: 'le débit' }, { id: 'K4', texte: 'Plus de condensation au plafond' }
    ]);
    expect(u.map(x => x.el.id)).toEqual(['K1', 'K2', 'K3']);
    expect(u[0].ids).toEqual(['K1', 'K4']);
  });
});
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet } from '../../src/domain/carnets/modele';

/** 20 paires : [a, b, doublon ?]. Les 10 premières règlent le seuil (5 doublons, 5 voisines), les 10 autres le jugent (L20, A10). */
const REGLAGE: [string, string, boolean][] = [
  ['attendre l’avis du ferblantier', 'demander l’avis au ferblantier', true],
  ['acheter une douchette pour l’évier', 'douchette évier à acheter', true],
  ['la porte du local fait 80 cm', 'porte du local : 80 cm de large', true],
  ['gravité 4 becs vu chez un collègue', 'un collègue a une gravité 4 becs', true],
  ['vérifier le débit de la hotte', 'contrôler le débit de la hotte', true],
  ['acheter une douchette pour l’évier', 'nettoyer l’évier après le brassage', false],
  ['la porte du local fait 80 cm', 'repeindre le local', false],
  ['attendre l’avis du ferblantier', 'payer la facture du ferblantier', false],
  ['minimiser l’oxygène', 'mesurer l’oxygène dissous', false],
  ['commander des fûts de 20 L', 'laver les fûts de 30 L', false]
];
const JUGEMENT: [string, string, boolean][] = [
  ['penser à demander un devis pour la hotte', 'demander un devis hotte', true],
  ['chambre froide en kit trop chère', 'chambre froide kit : trop cher', true],
  ['nettoyer les bacs après usage', 'après usage, nettoyer les bacs', true],
  ['SAV en Suisse pour l’isobarique', 'isobarique avec SAV suisse', true],
  ['regarder l’extracteur mural', 'regarder un extracteur mural hélicoïde', true],
  ['nettoyer les bacs après usage', 'acheter deux bacs neufs', false],
  ['regarder l’extracteur mural', 'regarder la hotte inox', false],
  ['chambre froide en kit trop chère', 'chambre à air du vélo', false],
  ['SAV en Suisse pour l’isobarique', 'livraison en Suisse', false],
  ['demander un devis hotte', 'demander un devis pour l’évier', false]
];

const juger = (cas: [string, string, boolean][], seuil: number) => {
  const trouves = cas.filter(([a, b, d]) => d && similarite(a, b) >= seuil).length;
  const faux = cas.filter(([a, b, d]) => !d && similarite(a, b) >= seuil).length;
  return { trouves, faux };
};

describe('doublons (A10)', () => {
  it('le seuil du module est dans la plage optimale de la moitié de réglage', () => {
    const grille = Array.from({ length: 21 }, (_, i) => i / 20);
    const notes = grille.map(s => { const j = juger(REGLAGE, s); return j.trouves - j.faux; });
    const meilleur = Math.max(...notes);
    const optimaux = grille.filter((_, i) => notes[i] === meilleur);
    console.info(`A10 réglage : seuils optimaux ${optimaux[0]} à ${optimaux.at(-1)} (${JSON.stringify(juger(REGLAGE, SEUIL_DOUBLON))}) ; module ${SEUIL_DOUBLON}`);
    console.info('A10 similarités réglage :', REGLAGE.map(([a, b, d]) => `${d ? 'D' : 'v'} ${similarite(a, b).toFixed(2)}`).join(' '));
    expect(optimaux).toContain(SEUIL_DOUBLON);
  });
  it('jugé sur l’autre moitié : au moins 4 doublons sur 5, au plus 1 faux sur 5', () => {
    const j = juger(JUGEMENT, SEUIL_DOUBLON);
    console.info(`A10 jugement : ${j.trouves}/5 doublons trouvés, ${j.faux}/5 faux, au seuil ${SEUIL_DOUBLON}`);
    console.info('A10 similarités jugement :', JUGEMENT.map(([a, b, d]) => `${d ? 'D' : 'v'} ${similarite(a, b).toFixed(2)}`).join(' '));
    expect(j.trouves).toBeGreaterThanOrEqual(4);
    expect(j.faux).toBeLessThanOrEqual(1);
  });
  it('doublonsDe et notesEnDouble sur la fixture', () => {
    const c = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION))!;
    expect(doublonsDe('demander l’avis au ferblantier', c.carnet.notes).map(d => d.noteId)).toEqual(['ZZ-V-N1']);
    expect(doublonsDe('acheter une hotte', c.carnet.notes)).toEqual([]);
    const avec = { ...c, carnet: { ...c.carnet, notes: [...c.carnet.notes, { id: 'N2', texte: 'demander l’avis au ferblantier', genre: 'note' as const }] } };
    expect(notesEnDouble(avec)).toEqual([['ZZ-V-N1', 'N2']]);
    expect(notesEnDouble(c)).toEqual([]);
  });
});
