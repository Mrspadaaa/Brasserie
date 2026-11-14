// Contrôle d'une série de mini maquettes : node controle-serie.mjs <voie> <v1,v2,v3,v4>
// Refuse : html manquant, capture manquante ou vide, ressource externe autre que Google Fonts, script de jeu, NOTE sans ligne par variante.
import fs from 'node:fs';
const [, , voie, liste] = process.argv;
const vues = process.argv.includes('--vues');
const dir = new URL(`./voies/${voie}/`, import.meta.url);
const fautes = [];
const note = fs.existsSync(new URL('NOTE.md', dir)) ? fs.readFileSync(new URL('NOTE.md', dir), 'utf8') : '';
if (!note) fautes.push('NOTE.md absent');
for (const v of (liste || '').split(',').filter(Boolean)) {
  const h = new URL(`${v}.html`, dir);
  if (!fs.existsSync(h)) { fautes.push(`${v}.html absent`); continue; }
  const html = fs.readFileSync(h, 'utf8');
  for (const m of html.matchAll(/(?:src|href)=["'](https?:[^"']+)/g)) if (!/fonts\.(googleapis|gstatic)\.com/.test(m[1])) fautes.push(`${v} ressource externe ${m[1]}`);
  if (/addEventListener|onclick=/i.test(html)) fautes.push(`${v} script de jeu (maquette non jouable)`);
  for (const c of ['a-390', 'b-390', 'cave-390', '1280', ...(vues ? ['vues-390'] : [])]) {
    const p = new URL(`${v}-${c}.png`, dir);
    if (!fs.existsSync(p) || fs.statSync(p).size < 5000) fautes.push(`${v}-${c}.png absente ou vide`);
  }
  if (!new RegExp('^\\W*' + v + '\\b', 'm').test(note)) fautes.push(`NOTE sans ligne ${v}`);
}
if (!liste) fautes.push('aucune variante');
console.log(fautes.length ? 'SERIE ECHEC\n' + fautes.join('\n') : 'SERIE OK');
process.exit(fautes.length ? 1 : 0);
