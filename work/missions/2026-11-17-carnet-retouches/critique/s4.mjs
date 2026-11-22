import {open,pause} from './lib.mjs';
const A=await open('?vide=1&clavier=300'); const p=A.p;
const blur=async()=>{await p.evaluate(()=>{document.activeElement&&document.activeElement.blur();window.scrollTo(0,0)});await pause(300)};
const sheet=()=>p.evaluate(()=>document.querySelector('.da-sheet')?.innerText);
const close=async()=>{await p.touchscreen.tap(195,30);await pause(300)};
await A.type('#da-neuf','une tireuse 4 becs');
await A.type('#da-note','gravité, pas cher'); await A.type('#da-note','isobarique, mieux pour la mousse');
for (const [i,u] of ['https://brassage-romandie.ch/iso-4-pre-evacuation','https://brew-equip-lyon.fr/isobare-4-compact'].entries()){
 await p.evaluate(u=>{window.__ppSim=u},u); await A.tap('#ra-dock [data-act=coller]'); await pause(1200);}
await blur(); await A.snap('s4-00-fiche');
// Comparer
await A.tap('[data-act=comparer]'); await pause(400); await A.snap('s4-01-comparer'); console.log('COMP',await A.txt()); console.log(await A.ui());
await p.evaluate(()=>window.scrollTo(0,9999)); await A.snap('s4-02-comparer-bas');
await close(); await blur();
// articles
await A.tap('[data-act=articles]'); await pause(400); await A.snap('s4-03-articles'); console.log('ART',await sheet());
await close(); await blur();
// ouvrir un article puis choisir
await A.tap('[data-act=article]'); await pause(300); await A.tap('.da-sheet [data-act=choisir]'); await pause(500); await A.snap('s4-04-choisir'); console.log('CHOIX',await sheet()); console.log(await A.ui());
await p.evaluate(()=>{const s=document.querySelector('.da-sheet');s.scrollTop=9999}); await A.snap('s4-05-choisir-bas');
console.log('touches',A.T());
await A.nav.close();
