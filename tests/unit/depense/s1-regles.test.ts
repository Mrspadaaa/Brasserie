import {describe,it,expect} from 'vitest';
import {metUn,quantiteGardantMontant,choixUnite,CINQ_UNITES,nombresRapides} from '../../../src/ui/depense/calculPlateau';
import {quantiteImpliciteDuTicket} from '../../../src/ui/depense/finale';
import {sansMotsBruts} from '../../../src/ui/depense/phrasePied';
import {familleHorsBrassage} from '../../../src/ui/depense/familles';
import {chercherLignes} from '../../../src/ui/finance/controlesCroises';

/* s1 (09.11) : les règles pures. Les parcours à l'écran sont dans tests/integration/depenseS1*.test.tsx. */
describe('s1 : quantité posée d’un toucher, le montant imprimé reste',()=>{
  it('metUn : montant connu → prix = montant ; sans montant → montant = prix ; ni l’un ni l’autre → seule la quantité (jamais 0)',()=>{
    expect(metUn({unitPrice:3,amount:8.9})).toEqual({quantity:1,unitPrice:8.9});
    expect(metUn({unitPrice:8.9})).toEqual({quantity:1,amount:8.9});
    expect(metUn({})).toEqual({quantity:1});
  });
  it('une tuile (5) garde le montant : 5 × 1,78 = 8,90',()=>{
    expect(quantiteGardantMontant({amount:8.9},5)).toEqual({quantity:5,unitPrice:1.78});
    expect(quantiteGardantMontant({unitPrice:2},3)).toEqual({quantity:3,amount:6});
  });
});

describe('s1 : l’ordre des unités du brasseur, pièce · g · Kg · L · sachet',()=>{
  it('les cinq cases',()=>{expect(CINQ_UNITES.map(u=>u.valeur)).toEqual(['pièce','g','kg','l','sachet']);});
  it('les segments : la pièce d’abord, partout',()=>{
    for(const g of ['malt','houblon','levure','sucre','materiel'] as const)expect(choixUnite(g,'').map(c=>c.label)[0]).toBe('pièce');
  });
  it('les nombres d’une unité illisible suivent l’unité du genre (la pièce première au segment ne change pas les nombres d’un malt)',()=>{
    expect(nombresRapides('','malt')).toEqual([1,5,10,25]);
    expect(nombresRapides('','materiel')).toEqual([1,2,3,5,10]);
  });
});

describe('s1 : la quantité implicite d’un ticket (prix unitaire = montant)',()=>{
  it('prix = montant en CHF → 1',()=>{expect(quantiteImpliciteDuTicket({price:86.85,amountTTC:86.85},'CHF')).toBe(1);});
  it('prix ≠ montant → inconnue (jamais inventée)',()=>{expect(quantiteImpliciteDuTicket({price:2.6,amountTTC:5.2},'CHF')).toBeUndefined();});
  it('prix absent, montant absent, ou devise étrangère → inconnue',()=>{
    expect(quantiteImpliciteDuTicket({price:null,amountTTC:5},'CHF')).toBeUndefined();
    expect(quantiteImpliciteDuTicket({price:5,amountTTC:null},'CHF')).toBeUndefined();
    expect(quantiteImpliciteDuTicket({price:5,amountTTC:5},'EUR')).toBeUndefined();
  });
});

describe('s1 : un mot brut du code ne s’affiche pas',()=>{
  it('« (other / equipment) » → « (autre / matériel) »',()=>{
    expect(sansMotsBruts('VITRIFIC — nature : lectures divergentes (other / equipment), vérifier.')).toBe('VITRIFIC — nature : lectures divergentes (autre / matériel), vérifier.');
  });
  it('hors parenthèses rien ne change : « service » dans un nom reste « service »',()=>{
    expect(sansMotsBruts('Contrat service : lectures divergentes (12,50 / 13,50)')).toBe('Contrat service : lectures divergentes (12,50 / 13,50)');
  });
});

describe('s1 : la famille hors brassage',()=>{
  it('rénovation et services : oui ; matériel de brassage, « autres » (inconnu) et ingrédients : non',()=>{
    expect(familleHorsBrassage('renovation')).toBe(true);
    expect(familleHorsBrassage('service')).toBe(true);
    for(const f of ['materiel','autres','malt','houblon','levure','sucre','additif','emballage','nettoyage','consommable'] as const)expect(familleHorsBrassage(f)).toBe(false);
  });
});

describe('s1 : la recherche lit aussi l’étiquette de groupe',()=>{
  const l=(id:string,description:string)=>({id,description} as any);
  it('« peinture » trouve une ligne au nom abîmé via son sous-groupe',()=>{
    const lignes=[l('a','PNCEAU PL4T'),l('b','CHARNIERE')];
    expect(chercherLignes(lignes,'peinture')).toEqual([]);
    expect(chercherLignes(lignes,'peinture',(_x,i)=>i===0?'Rénovation Peinture et sols':'Rénovation Quincaillerie')).toEqual(['a']);
  });
});
