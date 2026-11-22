import {open,pause} from './lib.mjs';
const A=await open('?vide=1&clavier=300'); const p=A.p;
await A.type('#da-neuf','une tireuse 4 becs');
await p.evaluate(()=>{document.activeElement.blur();window.scrollTo(0,0)}); await pause(400); await A.snap('s2-00-fiche-repos');
console.log(await A.txt()); console.log(await A.ui());
// lien
await (await p.$('#da-note')).tap(); await pause(300);
await p.evaluate(u=>{window.__ppSim=u},'https://brassage-romandie.ch/iso-4-pre-evacuation');
await A.snap('s2-01-clavier-fiche');
await A.tap('#ra-dock [data-act=coller]'); await pause(1300); await A.snap('s2-02-lien-colle');
console.log('--- apres lien'); console.log(await A.txt()); console.log(await A.ui());
await A.tap('#ra-dock [data-act=photo]').catch(e=>console.log('photo',e.message)); await pause(600); await A.snap('s2-03-photo');
console.log('--- apres photo'); console.log(await A.txt()); console.log(await A.ui());
await p.evaluate(()=>{document.activeElement&&document.activeElement.blur();window.scrollTo(0,0)}); await pause(300); await A.snap('s2-04-fiche-apres');
console.log('touches',A.T());
await A.nav.close();
