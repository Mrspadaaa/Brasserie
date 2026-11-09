// Contrôles de la passe 4 : node controle-p4.mjs <dossier p2>
import { readFileSync } from 'node:fs';
const p2 = process.argv[2];
const lire = (id) => readFileSync(`${p2}/${id}/etat.html`, 'utf8');
const PREMIER = ['boisson', 'famille', 'style', 'temperature', 'attenuation', 'tolerance', 'effets', 'floculation', 'forme', 'disponibilite', 'en-stock'];
const SECOND = ['sans-sta1', 'labo', 'vitesse', 'rondeur', 'soufre', 'nutriments', 'sans-alcool'];
let ok = true;
for (const id of ['c6a', 'c6b']) {
  const h = lire(id);
  const manque = [...PREMIER, ...SECOND].filter((f) => !h.includes(`data-filtre="${f}"`));
  // US-05 en tête au cadre 1 : première ligne de nom dans la table du cadre 1
  const c1 = h.split('data-cadre="1056-repos"')[1].split('data-cadre=')[0];
  const premiere = (c1.match(/class="[a-z0-9]+-nm">([^<]+)</) || [])[1]?.trim();
  const tri = h.includes('Trier');
  const r = manque.length === 0 && premiere === 'SafAle US-05' && tri;
  ok &&= r;
  console.log(id, r ? 'OK' : 'ECHEC', `premier rang ${PREMIER.length - manque.filter((f) => PREMIER.includes(f)).length}/11 · second ${SECOND.length - manque.filter((f) => SECOND.includes(f)).length}/7 · en tête : ${premiere} · trier ${tri}`, manque.join(' '));
}
const BUTS = /Plus de banane|Plus de girofle|Plus fruité|Plus net|Plus sec|Plus rond|Houblon en avant|Moins de soufre/;
for (const id of ['s6a', 's7a', 's7b']) {
  const h = lire(id);
  const c1 = h.split('</section>')[0];
  const axes = [...c1.matchAll(/data-axe="([a-z]+)"[\s\S]*?(?=data-axe=|<\/div>\s*<\/div>\s*<div class="[a-z0-9]+-lg")/g)];
  const replies = axes.filter((a) => a[0].includes("data-sans-donnee")).map((a) => a[1]);
  const sans = axes.filter((a) => !a[0].includes("data-sans-donnee") && !(/[−-]\s*<b>|<small[^>]*>−/.test(a[0]) && /\+\s*<b>|<small[^>]*>\+/.test(a[0]))).map((a) => a[1]);
  const buts = (h.match(new RegExp(BUTS, 'g')) || []).length;
  const r = axes.length >= 10 && sans.length === 0 && buts === 0;
  if (id !== 's6a') ok &&= r;
  console.log(id, r ? 'OK' : 'ECHEC', `axes ${axes.length} (repliés sans donnée : ${replies.join(',') || 0}) · sans + et − : ${sans.length ? sans.join(',') : 0} · buts nommés ${buts}`);
}
console.log(ok ? 'P4 OK' : 'P4 ECHEC');
