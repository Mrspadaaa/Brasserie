/**
 * Critique 7 (18.11), correctif chirurgical : bloquants 1 à 4, chacun prouvé seul sur sa règle.
 */
import { describe, expect, it } from 'vitest';
import { analyserTexte, decouper, objetDe, phrasesDe } from '../../src/domain/carnets/analyseLocale';
import { reponseSimulee } from '../../src/domain/carnets/iaSimulee';
import { planVrac } from '../../src/ui/carnets/rangement';
import { enteteCourt } from '../../src/ui/carnets/CarnetOuvert';
import { versRubrique } from '../../src/ui/carnets/CarnetsVue';
import type { ContexteRangerCarnet } from '../../functions/src/carnetIA';

const NOTE = 'Sachets de levure x2. Prochain brassage mardi. Tient 80 °C pour la hotte.';

describe('critique 7, n° 1 : une note en vrac tapée sur une ligne est découpée', () => {
  it('trois phrases sans étiquette : trois lignes', () => {
    expect(decouper(NOTE)).toEqual(['Sachets de levure x2', 'Prochain brassage mardi', 'Tient 80 °C pour la hotte']);
  });
  it('une seule idée en plusieurs phrases reste entière', () => {
    expect(decouper('Hotte inox 120 cm. Doit tenir 80 °C.')).toHaveLength(1);
    expect(decouper('Frigo de garde. Il tient 2 °C en été.')).toHaveLength(1);
    expect(decouper('Moulin à malt : 2 cylindres. 150 kg/h minimum.')).toHaveLength(1);
  });
  it('une abréviation ne coupe pas une phrase', () => {
    expect(phrasesDe('Ventilateur Fr. 189,90 CHF, env. 30 L')).toHaveLength(1);
    expect(phrasesDe('Moteur EC p. ex. Ziehl')).toHaveLength(1);
  });
  it('depuis une liste vide : 3 lignes rangées dans 2 carnets, le brassin ensemble', () => {
    const plan = planVrac(analyserTexte(NOTE), () => null);
    expect(plan.decompte).toBe('3 lignes · 2 carnets');
    expect(plan.neufs.sort()).toEqual(['Hotte', 'Prochain brassin']);
  });
  it('l’objet d’une exigence est ce qu’elle nomme : « Tient 80 °C pour la hotte » → Hotte', () => {
    expect(objetDe('Tient 80 °C pour la hotte')).toBe('Hotte');
  });
});

describe('critique 7, n° 2 : un critère ne passe jamais à un carnet sans rapport', () => {
  it('l’IA simulée ne donne pas « 80 °C » aux levures', () => {
    const ctx = { texte: NOTE, carnets: [], depuis: null, pages: [] } as unknown as ContexteRangerCarnet;
    const lignes = reponseSimulee(ctx)!.lignes as Array<{ texte: string; sorte: string; carnetNeuf?: string }>;
    expect(lignes).toHaveLength(3);
    const levure = lignes.filter(l => /levure|brassage/i.test(l.texte));
    expect(levure.every(l => l.carnetNeuf === 'Prochain brassin')).toBe(true);
    expect(levure.some(l => /80/.test(l.texte))).toBe(false);
    expect(lignes.find(l => /80 °C/.test(l.texte))?.carnetNeuf).toBe('Hotte');
  });
});

describe('critique 7, n° 3 : le critère annoncé devient un critère', () => {
  it('une note de l’IA passe dans la rubrique annoncée', () => {
    const phrase = 'un fût de 30 L couché doit entrer dans le bac';
    const l = versRubrique({ sorte: 'note', genre: 'note', texte: phrase }, 'critere', phrase);
    expect(l.sorte).toBe('critere');
    expect(l.source).toBe('phrase');
  });
  it('un article reste un article', () => {
    const l = versRubrique({ sorte: 'article', texte: 'Pompe' }, 'critere', 'x');
    expect(l.sorte).toBe('article');
  });
});

describe('critique 7, n° 4 : une température dit ce qu’elle mesure', () => {
  it('« température ambiante max » : « amb. max °C », jamais « °C » seul', () => {
    expect(enteteCourt({ nom: 'température ambiante max', unite: '°C' })).toBe('amb. max °C');
    expect(enteteCourt({ nom: 'température max', unite: '°C' })).toBe('max °C');
    expect(enteteCourt({ nom: 'débit', unite: 'm³/h' })).toBe('m³/h');
  });
});
