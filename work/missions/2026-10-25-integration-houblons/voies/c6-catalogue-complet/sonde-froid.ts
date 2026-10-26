// Sonde jetable de la voie c6 : les nombres des tests « froid » après le changement des descriptions (Freestyle Hops NZ hors de Cascade, c6).
import { famillesProchesDeLaLimite } from '../../../../../src/domain/hopIndex/v4/froid';
import { froidVue } from '../../../../../src/ui/hopIndex/dryhopper/froidVue';

const r21 = { name: 'Hazy du jeudi', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05',
  additions: [{ id: 'a60', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }] } as never;
const r16 = { name: 'Stout', styleCode: '16D', volumeL: 20, og: 1.065, boilMin: 60, yeastId: 'fermentis-us05',
  additions: [{ id: 'a60', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] } as never;
const f1 = famillesProchesDeLaLimite(r21, { id: 'dry', hopKey: 'beermaverick-cascade', moment: 'dryPost', grams: 80, day: 7, dureeJours: 3 } as never);
console.log('CASCADE', JSON.stringify(f1.familles.map((x) => ({ f: x.famille, apport: x.apport, valeur: x.valeur, marge: x.marge, cran: x.cran, approche: x.approche, depasse: x.depasse, statut: x.statut }))));
const f2 = famillesProchesDeLaLimite(r16, { id: 'dry', hopKey: 'beermaverick-nugget', moment: 'dryPost', grams: 80, day: 7, dureeJours: 3 } as never);
console.log('NUGGET', JSON.stringify(f2.familles.map((x) => ({ f: x.famille, apport: x.apport, valeur: x.valeur, marge: x.marge, approche: x.approche }))));
const ajout = { id: 'dry', hopKey: 'beermaverick-cascade', moment: 'dryPost', grams: 80, day: 7, jours: 3 } as never;
const rec = { name: 'Hazy du jeudi', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05',
  additions: [{ id: 'a60', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20, minutes: 60 }, ajout] } as never;
const l = froidVue(rec, ajout).limite;
console.log('DRYHOPPER', JSON.stringify(l.lignes.map((x) => ({ f: x.famille, valeur: x.valeur, depasse: x.depasse, borne: x.borne }))));
