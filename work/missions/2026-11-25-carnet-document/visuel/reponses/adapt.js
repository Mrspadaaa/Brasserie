/* Rendu générique des 12 cas (25.11 soir) : convertit une réponse au format de la consigne (jouable/m4b.html)
   en un objet D que chaque variante lit. Aucune donnée ajoutée : tout vient de reponses/<cas>.json. */
(function(){
const GENRES={probleme:'problème',achat:'achat',memo:'mémo',idee:'idée',planning:'planning'};
function emo(s){const m=String(s||'').match(/^(\S+)\s+(.*)$/);return m&&!/[A-Za-z0-9]/.test(m[1])?[m[1],m[2]]:['',String(s||'')];}
window.GEN=function(cas){
  const x=(window.REPONSES||{})[cas];if(!x)return null;const r=x.reponse;const it={};
  const add=(k,o)=>{o.k=k;it[k]=o;return o;};
  const D={titre:x.carnetTitre,genre:r.genre,ic:r.emoji,lignes:x.lignes,conseil:r.conseil||'',resume:r.resume,prio:r.priorite,etatPropose:r.etatPropose,resolu:r.resolu,
    meta:(GENRES[r.genre]||r.genre)+' · '+r.categorie.nom+(r.categorie.sous?' › '+r.categorie.sous:'')+' · rangé (réponse écrite à la main)',
    aide:[],etapes:[['⚖️','comparé'],['✋','choisi'],['📦','commandé']],etape:0,it};
  D.pistes=r.pistes.map((p,i)=>add('p'+i,{ic:p.emoji,mot:p.texte,ok:p.statut==='trouve'?'trouve':p.statut==='pas_trouve'?'non':'verif',ligne:p.ligne,cit:p.citation}));
  D.options=r.options.map((o,i)=>add('o'+i,{ic:o.emoji,mot:o.titre,cout:o.cout,ia:o.source==='ia',conseil:!!o.conseille,ligne:o.ligne,cit:o.citation}));
  D.tache=r.tache?add('tache',{ic:r.tache.emoji,mot:r.tache.titre,quand:r.tache.quand||'',ligne:r.tache.ligne,cit:r.tache.citation}):null;
  D.ech=r.echeance?add('ech',{ic:'⏳',mot:r.echeance.quand,quoi:r.echeance.quoi,ligne:r.echeance.ligne,cit:r.echeance.quand}):null;
  D.chiffres=r.chiffres.map((c,i)=>add('c'+i,{ic:c.emoji,mot:c.valeur,label:c.label,ligne:c.ligne,cit:c.valeur}));
  D.liste=r.liste.map((l,i)=>add('l'+i,{ic:'☐',mot:l.texte,ligne:l.ligne,cit:l.citation}));
  D.retenir=r.retenir.map((l,i)=>add('r'+i,{ic:l.emoji,mot:l.texte,ligne:l.ligne,cit:l.citation}));
  D.comp=null;
  if(r.comparaison){const cp=r.comparaison;const L='ABCDEF';
    const arts=cp.articles.map((a,i)=>{const o=r.options.find(o=>o.ligne===a.ligne);const A={k:L[i],nom:a.nom,ic:o?o.emoji:'',ligne:a.ligne,cit:a.citation,vals:a.valeurs.map(v=>v.texte),gagne:cp.gagnant.filter(g=>g===i).length};D[L[i]]=A;return A;});
    D.comp={crit:cp.criteres.map((c,j)=>{const [ic,nom]=emo(c);return {ic,nom,g:cp.gagnant[j]};}),arts,compromis:cp.compromis||''};
    /* une option qui est déjà un article n'est pas répétée */
    D.options=D.options.filter(o=>!arts.some(a=>a.ligne===o.ligne));
  }
  return D;
};
})();
