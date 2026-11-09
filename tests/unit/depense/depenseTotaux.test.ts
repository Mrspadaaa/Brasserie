import {describe,it,expect} from 'vitest';
import {controlesCroises,chercherLignes,phraseDuManque,montant,type EntreeControles} from '../../../src/ui/finance/controlesCroises';
import type {PurchaseLineDraft} from '../../../src/services/purchaseEntry';
import {LIGNES_TICKET} from '../../integration/depenseTotaux.fixture';

const lignes=():PurchaseLineDraft[]=>LIGNES_TICKET.map(([nom,montantLigne],i)=>({id:`line-${i+1}`,description:nom,kind:'other',unit:'pièce',stockAction:'none',equipmentAction:'none',quantity:1,unitPrice:montantLigne,amount:montantLigne,sourceReference:`4005556${String(i).padStart(6,'0')}`} as PurchaseLineDraft));
const base:EntreeControles={lignesCents:27760,nLignes:29,nAjoutes:0,ajoutsCents:0,totalCents:35205,attendus:29,attendusIndependant:29,payeCents:35205,moyen:'TWINT',qte:{ok:true,valeur:'29/29'}};

describe('contrôles croisés : la règle',()=>{
  it('ticket du brasseur : drapeau, écart 74,45, Qté × prix pas au vert, payé lu',()=>{
    const c=controlesCroises(base);
    expect(c.drapeau).toBe(true);
    expect(c.ecartCents).toBe(-7445);
    expect(c.ecartArticles).toBe(0);
    expect(c.resume).toBe('74,45 CHF');
    const par=Object.fromEntries(c.rangs.map(r=>[r.cle,r]));
    expect(par.articles.verdict).toBe('ok');
    expect(par.somme).toMatchObject({verdict:'ecart',valeurs:'277,60 / 352,05',ecart:'−74,45',renvoi:'montants',geste:'Vérifier les montants'}); // d2, critique 2 : 29 comptées = 29 lues, une ligne ne manque pas
    expect(par.paye).toMatchObject({verdict:'ok',valeurs:'352,05'});
    expect(par.qte.verdict).toBe('inconnu');
  });
  it('un nombre non imprimé n’est jamais 0 : « non imprimé », payé « — »',()=>{
    const c=controlesCroises({...base,attendus:null,attendusIndependant:null,payeCents:null,moyen:null,totalCents:27760});
    const par=Object.fromEntries(c.rangs.map(r=>[r.cle,r]));
    expect(par.articles).toMatchObject({verdict:'inconnu',valeurs:'29 lus · non imprimé'});
    expect(par.paye).toMatchObject({verdict:'inconnu',valeurs:'—'});
    expect(c.drapeau).toBe(false);
    expect(par.qte.verdict).toBe('ok');
  });
  it('total non imprimé (calculé) : rien à comparer, pas de drapeau',()=>{
    const c=controlesCroises({...base,totalCents:null,payeCents:null});
    expect(c.rangs.find(r=>r.cle==='somme')).toMatchObject({verdict:'inconnu',texte:'Total non imprimé'});
    expect(c.ecartCents).toBeNull();
  });
  it('une ligne ajoutée à la main qui explique exactement l’écart n’est pas une erreur (SM, 08.11)',()=>{
    const c=controlesCroises({...base,lignesCents:5680,totalCents:5180,nLignes:6,nAjoutes:1,ajoutsCents:500,attendus:5,attendusIndependant:5,payeCents:null,moyen:null});
    expect(c.rangs.find(r=>r.cle==='somme')).toMatchObject({verdict:'ok',valeurs:'51,80 + 5,00'});
    expect(c.rangs.find(r=>r.cle==='articles')).toMatchObject({verdict:'ok',valeurs:'5'});
    expect(c.drapeau).toBe(false);
  });
  it('trop d’articles ou de CHF : « ligne en trop » (fausse)',()=>{
    const c=controlesCroises({...base,lignesCents:36000,nLignes:31,totalCents:35205});
    expect(c.rangs.find(r=>r.cle==='somme')).toMatchObject({verdict:'ecart',ecart:'+7,95',renvoi:'fausse'});
    expect(c.rangs.find(r=>r.cle==='articles')).toMatchObject({verdict:'ecart',ecart:'+2',renvoi:'fausse'});
  });
  it('la phrase du manque dit ce qui manque, pas « de moins »',()=>{
    expect(phraseDuManque(27760,35205)).toBe('74,45 CHF non retrouvés dans les lignes');
    expect(montant(123456)).toBe('1 234,56');
  });
});

describe('mini recherche : chercherLignes',()=>{
  it('« serre » trouve SERRE-JOINT seul ; accents et casse ne comptent pas',()=>{
    expect(chercherLignes(lignes(),'serre')).toEqual(['line-25']);
    expect(chercherLignes(lignes(),'SERRÉ')).toEqual(['line-25']);
  });
  it('« 14,90 » et « 14.90 » trouvent les lignes à 14,90 (dont SERRE-JOINT)',()=>{
    expect(chercherLignes(lignes(),'14,90')).toContain('line-25');
    expect(chercherLignes(lignes(),'14.90')).toContain('line-25');
  });
  it('« marteau » : aucune ligne ; vide : toutes',()=>{
    expect(chercherLignes(lignes(),'marteau')).toEqual([]);
    expect(chercherLignes(lignes(),'  ')).toHaveLength(29);
  });
  it('trouve par la référence (EAN) ; tous les mots dans la même ligne',()=>{
    expect(chercherLignes(lignes(),'4005556000003')).toEqual(['line-4']);
    expect(chercherLignes(lignes(),'brosse 4,80')).toHaveLength(1);
  });
});

describe('banc b1 (09.11) : P2 pas de vert sans comptage indépendant, P3 lignes d’une seule lecture, P4 rabais',()=>{
  const tache={...base,nLignes:23,lignesCents:23440,attendus:23,attendusIndependant:null,qte:{ok:true,valeur:'23/23'}};
  const art=(c:ReturnType<typeof controlesCroises>)=>c.rangs.find(r=>r.cle==='articles')!;
  it('P2 : le modèle annonce 23 et en transcrit 23 (tache : 29 imprimées) : jamais vert, dit « annoncé par la lecture »',()=>{
    const a=art(controlesCroises(tache));
    expect(a.verdict).not.toBe('ok');
    expect(a.verdict).toBe('inconnu');
    expect(a.valeurs).toMatch(/annoncé par la lecture/);
  });
  it('P2 : un comptage indépendant (nombre imprimé) concordant donne le vert, discordant (29 contre 23) lève l’écart',()=>{
    expect(art(controlesCroises({...tache,attendusIndependant:23})).verdict).toBe('ok');
    const faux=art(controlesCroises({...tache,attendusIndependant:29}));
    expect(faux).toMatchObject({verdict:'ecart',valeurs:'23 / 29',ecart:'−6',renvoi:'manquante'});
  });
  it('P2 : une annonce qui avoue l’écart (24 annoncées, 23 lues) reste une pastille d’erreur',()=>{
    expect(art(controlesCroises({...tache,attendus:24})).verdict).toBe('ecart');
  });
  it('P4 : un rabais n’est pas un article (3 articles + 2 rabais = 5 lignes annoncées) : 3 articles, 2 rabais, aucun écart',()=>{
    const a=art(controlesCroises({...base,nLignes:5,nRabais:2,attendus:5,attendusIndependant:null,lignesCents:14925,totalCents:14925,payeCents:null,moyen:null}));
    expect(a.verdict).toBe('inconnu');
    expect(a.valeurs).toMatch(/^3 · 2 rabais/);
    const indep=art(controlesCroises({...base,nLignes:5,nRabais:2,attendus:5,attendusIndependant:5,lignesCents:14925,totalCents:14925}));
    expect(indep).toMatchObject({verdict:'ok'});
    expect(indep.valeurs).toBe('3 · 2 rabais');
  });
  it('P3 : des lignes d’une seule lecture qui comblent une part de l’écart s’affichent à part, avec le reste',()=>{
    const c=controlesCroises({...tache,vusUneLecture:{n:5,cents:3430}});
    const r=c.rangs.find(x=>x.cle==='une-lecture')!;
    expect(r).toMatchObject({verdict:'ecart',valeurs:'5 · +34,30',renvoi:'perdues'});
    expect(r.geste).toMatch(/Les garder/);
    expect(r.geste).toMatch(/83,35/);
    expect(c.resume).toMatch(/dont 34,30 vus par une seule lecture/);
    expect(c.rangs.map(x=>x.cle).indexOf('une-lecture')).toBe(c.rangs.map(x=>x.cle).indexOf('somme')+1);
  });
  it('P3 : des lignes d’une seule lecture qui dépassent le manque ne le comblent pas : pas de rangée',()=>{
    expect(controlesCroises({...tache,vusUneLecture:{n:9,cents:20000}}).rangs.some(x=>x.cle==='une-lecture')).toBe(false);
  });
});
