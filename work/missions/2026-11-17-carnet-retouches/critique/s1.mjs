import {open,pause} from './lib.mjs';
const A=await open('?vide=1&clavier=300');
await A.snap('s1-00'); console.log(await A.ui());
await A.type('#da-neuf','une tireuse 4 becs',false); await A.snap('s1-01-tape');
await A.p.keyboard.press('Enter'); await pause(500); await A.snap('s1-02-cree');
console.log(await A.txt()); console.log('---'); console.log(await A.ui()); console.log('touches',A.T());
await A.nav.close();
