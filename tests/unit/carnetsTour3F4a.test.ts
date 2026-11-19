/**
 * Carnet tour 3, voie f4a : constats de la vision locale du 19.11 (v1, v2). Un test par constat, rouge sur le code d'avant.
 */
import { describe, expect, it } from 'vitest';
import { extraireCriteres } from '../../src/domain/carnets/analyseLocale';
import { fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnet, lireCarnets } from '../../src/domain/carnets/modele';
import { accepterProposition, ranger, type LigneARanger, type Resultat } from '../../src/domain/carnets/operations';
import { detailDe } from '../../src/ui/carnets/CarnetsVue';
import type { CreativeItem } from '../../src/types';

const F = fixtureCarnets();
const LE = '2026-11-19T10:00:00.000Z';
const ok = (r: Resultat) => { if (!r.ok) throw new Error(r.raison); return r; };
function appliquer(etat: readonly CreativeItem[], r: Resultat): CreativeItem[] {
  const parId = new Map(etat.map(d => [d.id, d]));
  for (const e of ok(r).ecritures) { if (e.op === 'put') parId.set(e.doc.id, e.doc); else parId.delete(e.id); }
  return [...parId.values()];
}
const message = (id: string, texte: string, depuis: string) => ({ id, texte, le: LE, depuis, rangement: 'locale' as const });
const premier = lireCarnets(F)[0];

describe('v1-neuf 1 : « 2 cylindres » ne se perd pas', () => {
  it('« Moulin à malt 2 cylindres, 150 kg/h » : le débit en critère, « 2 cylindres » en façon ; « 2 pièces » jamais une façon', () => {
    const lu = extraireCriteres('Moulin à malt 2 cylindres, 150 kg/h');
    expect(lu.criteres.map(k => k.texte)).toEqual(['Débit : 150 kg/h au moins']);
    expect(lu.facons).toEqual(['2 cylindres']);
    expect(extraireCriteres('filtre à air G4 2 pièces, 60 dB').facons).toEqual([]);
  });
});

describe('v1-neuf 2 = v2-neuf 2 : la puce acceptée ne recopie pas son verbe', () => {
  it('« Comparer sur débit » accepté → critère « le débit » (comme « tient 80 °C, puis le débit »)', () => {
    const lignes: LigneARanger[] = [{ carnetId: premier.id, sorte: 'critere', texte: 'Comparer sur débit', caracteristique: { nom: 'débit', unite: 'L/min', sens: 'plus' }, origine: 'exemple', propose: true }];
    const etat = appliquer(F, ranger(F, { message: message('M-F4A', 'https://exemple.invalid/pompe-magnetique', premier.id), lignes }));
    const apres = appliquer(etat, accepterProposition(etat, { messageId: 'M-F4A', index: 0 }));
    const textes = lireCarnet(apres.find(d => d.id === premier.id))!.carnet.criteres.map(k => k.texte);
    expect(textes).toContain('le débit');
    expect(textes.some(t => /comparer sur/i.test(t))).toBe(false);
  });
});

describe('PCN-22 : IA éteinte, la ligne rangée dit son genre', () => {
  it('« filtre à air G4, 2 pièces » rangé en note « à acheter » : le détail dit « À acheter : … », pas « Notes : … »', () => {
    const lignes: LigneARanger[] = [{ carnetId: premier.id, sorte: 'note', texte: 'filtre à air G4, 2 pièces', genre: 'a-acheter' }];
    const r = ranger(F, { message: message('M-F4A-2', 'filtre à air G4, 2 pièces', premier.id), lignes });
    const apres = appliquer(F, r);
    const effets = (apres.find(d => d.id === 'M-F4A-2') as unknown as { carnetMessage: { effets: { carnetId: string; cible: string; id?: string }[] } }).carnetMessage.effets;
    const d = detailDe(apres, effets)!;
    expect(d).toMatch(/^À acheter : « filtre à air G4, 2 pièces » · dans /);
  });
});
