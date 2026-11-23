import { describe, expect, it } from 'vitest';
import * as M from '../../../../src/services/stockLineMatching';
import { art } from './aide';

/**
 * Plan § D-d.4 : la combinaison de la lecture du nom imprimé (I) et de la lecture du nom français (F), 35 cellules.
 * R1 : candidats distincts (meme ou ambigu des deux lectures) ≥ 2 → ambigu ; R2 : exactement 1 → meme ;
 * R3 : sinon le plus sévère de incertain > neuf > inconnu, à égalité la lecture imprimée ; le nom rendu est toujours celui du français.
 */
const X = art('X', 'Article X'), Y = art('Y', 'Article Y'), Z = art('Z', 'Article Z'), V = art('V', 'Voisin V'), W = art('W', 'Voisin W');
const NOM_I = 'nom-imprime', NOM_F = 'nom-francais';
const lecture = (code: string, nom: string): any => {
  switch (code) {
    case 'meme X': return { cas: 'meme', article: X };
    case 'meme Y': return { cas: 'meme', article: Y };
    case 'ambigu{X,Y}': return { cas: 'ambigu', candidats: [X, Y], nom };
    case 'ambigu{X,Z}': return { cas: 'ambigu', candidats: [X, Z], nom };
    case 'incertain V': return { cas: 'incertain', voisin: V, nom, connuUnSeulCote: [] };
    case 'incertain W': return { cas: 'incertain', voisin: W, nom, connuUnSeulCote: [] };
    case 'neuf V': return { cas: 'neuf', nom, ecarts: ['alpha'], voisin: V, motif: 'bis' };
    case 'neuf W': return { cas: 'neuf', nom, ecarts: ['alpha'], voisin: W, motif: 'bis' };
    case 'inconnu': return { cas: 'inconnu', nom };
    default: throw Error(code);
  }
};
const colonnes = ['absent', 'meme X', 'meme Y', 'ambigu{X,Z}', 'incertain W', 'neuf W', 'inconnu'];
const table: Record<string, string[]> = {
  'meme X': ['meme X', 'meme X', 'ambigu{X,Y}', 'ambigu{X,Z}', 'meme X', 'meme X', 'meme X'],
  'ambigu{X,Y}': ['ambigu{X,Y}', 'ambigu{X,Y}', 'ambigu{X,Y}', 'ambigu{X,Y,Z}', 'ambigu{X,Y}', 'ambigu{X,Y}', 'ambigu{X,Y}'],
  'incertain V': ['incertain V', 'meme X', 'meme Y', 'ambigu{X,Z}', 'incertain V', 'incertain V', 'incertain V'],
  'neuf V': ['neuf V', 'meme X', 'meme Y', 'ambigu{X,Z}', 'incertain W', 'neuf V', 'neuf V'],
  'inconnu': ['inconnu', 'meme X', 'meme Y', 'ambigu{X,Z}', 'incertain W', 'neuf W', 'inconnu'],
};
const lire = (r: any): string => r.cas === 'meme' ? `meme ${r.article.ref}` : r.cas === 'ambigu' ? `ambigu{${r.candidats.map((a: any) => a.ref).sort().join(',')}}` : r.cas === 'inconnu' ? 'inconnu' : `${r.cas} ${r.voisin.ref}`;

describe('combinerRegles — imprimé × français (35 cellules)', () => {
  for (const [i, sorties] of Object.entries(table)) {
    colonnes.forEach((f, c) => {
      it(`I = ${i} ; F = ${f} → ${sorties[c]}`, () => {
        // La lecture imprimée porte NOM_I, la française NOM_F : le nom rendu dit laquelle a parlé.
        const rI = lecture(i, NOM_I);
        const rF = f === 'absent' ? undefined : lecture(f, NOM_F);
        const r = (M as any).combinerRegles(rI, rF, [], NOM_I);
        expect(lire(r)).toBe(sorties[c]);
        // Une lecture française existe et le résultat porte un nom : c'est le sien (NOM_F). Un `meme` n'a pas de nom ; sans lecture française, c'est l'imprimé.
        if ('nom' in r) expect(r.nom).toBe(r.cas === 'ambigu' ? (rF && 'nom' in rF ? NOM_F : NOM_I) : r === rF ? NOM_F : NOM_I);
      });
    });
  }
  it('les noms gardés (articles trouvés par le nom gardé) comptent comme candidats', () => {
    const r = (M as any).combinerRegles(lecture('inconnu', NOM_F), undefined, [X, Y], NOM_F);
    expect(lire(r)).toBe('ambigu{X,Y}');
    expect(lire((M as any).combinerRegles(lecture('inconnu', NOM_F), undefined, [X], NOM_F))).toBe('meme X');
  });
  it('imprimé seul (sans français) : le nom de l\'imprimé reste', () => {
    expect((M as any).combinerRegles(lecture('inconnu', NOM_I), undefined, [], NOM_I).nom).toBe(NOM_I);
  });
});
