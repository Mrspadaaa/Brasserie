import {open,pause} from './lib.mjs';
const A=await open('?vide=1&clavier=300'); const p=A.p;
const blur=async()=>{await p.evaluate(()=>{document.activeElement&&document.activeElement.blur();window.scrollTo(0,0)});await pause(300)};
await A.type('#da-neuf','une tireuse 4 becs');
await (await p.$('#da-note')).tap(); 
await p.evaluate(u=>{window.__ppSim=u},'https://brassage-romandie.ch/iso-4-pre-evacuation');
await A.tap('#ra-dock [data-act=coller]'); await pause(1200);
await blur(); await A.tap('[data-act=article]'); await pause(500); await A.snap('s3-00-article-ouvert');
console.log(await p.evaluate(()=>document.querySelector('.da-sheet')?.innerText)); console.log(await A.ui());
await p.evaluate(()=>{document.querySelector('.da-sheet').scrollTop=9999}); await pause(200); await A.snap('s3-01-article-bas');
await p.evaluate(()=>{document.querySelector('.da-sheet').scrollTop=0});
await p.touchscreen.tap(195,30); await pause(300);
await blur(); await A.snap('s3-02-retour');
// façons
await A.tap('[data-act=facons]'); await pause(400); await A.snap('s3-03-facons-feuille'); console.log('FAC',await p.evaluate(()=>document.querySelector('.da-sheet')?.innerText)); console.log(await A.ui());
await A.type('#da-nf','Tireuse isobarique'); await A.type('#da-nf','Tireuse à gravité'); await A.snap('s3-04-facons-2');
await p.touchscreen.tap(195,30); await pause(300); await blur(); await A.snap('s3-05-fiche-facons'); console.log('FICHE',await A.txt()); console.log(await A.ui());
console.log('touches',A.T());
await A.nav.close();
