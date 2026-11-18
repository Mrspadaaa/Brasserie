// Dette de vision D375 et D377 (03.11, « Non vu au banc ») : état `3`, 390 tactile, clair puis cave.
// D375 : ouvrir le panneau TVA, choisir « sans TVA », le rouvrir : la TVA lue doit rester offerte (« SI je click en ht, je peux plus revenir ? »).
// D377 : une ligne au montant en doute → le total de sa bande porte le même niveau (« Item en rouge mais pas total ?? »).
// Usage : node vision-d375-d377.mjs <dossier construit> <sortie>   → captures + VISION D375 OK|ECHEC, VISION D377 OK|ECHEC|SANS CAS
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { ouvrirEtat, dormir } from './scenes.mjs';
const [construit, sortie] = process.argv.slice(2);
fs.mkdirSync(sortie, { recursive: true });
const puppeteer = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json')('puppeteer-core');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const cliquerTexte = (p, re) => p.evaluate(src => { const r = new RegExp(src, 'i'); const b = [...document.querySelectorAll('button, summary, [role=button]')].find(x => r.test(x.textContent.replace(/\s+/g, ' ').trim())); if (b) b.click(); return !!b; }, re.source);
const verdicts = [];
for (const theme of ['clair', 'cave']) {
  const p = await ouvrirEtat(nav, construit, '3', 't390', theme);
  // D377 : ouvrir toutes les bandes, puis comparer lignes en doute et totaux de bande.
  await p.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));
  await cliquerTexte(p, /^Articles, stock/); await dormir(500);
  await p.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; })); await dormir(300);
  const d377 = await p.evaluate(() => {
    const totaux = [...document.querySelectorAll('[data-dp-sous-montant], [data-dp-sg-montant]')].map(e => ({ t: e.textContent.trim(), doute: e.getAttribute('data-dp-niveau') === 'inconnu' }));
    const lignesDoute = document.querySelectorAll('[data-dp-montant][data-dp-niveau="inconnu"], [data-dp-ligne] [data-dp-niveau="inconnu"]').length;
    return { totaux, lignesDoute };
  });
  await p.screenshot({ path: path.join(sortie, `d377-${theme}.png`), fullPage: true });
  if (theme === 'clair') verdicts.push(d377.lignesDoute === 0 ? `VISION D377 SANS CAS (aucune ligne en doute dans l'état 3 ; totaux : ${d377.totaux.length})` : d377.totaux.some(x => x.doute) ? 'VISION D377 OK' : 'VISION D377 ECHEC (ligne en doute, aucun total marqué)');
  // D375 : le panneau TVA.
  const ouvert = await cliquerTexte(p, /^Référence et TVA/); await dormir(400);
  await cliquerTexte(p, /^TVA\b/); await dormir(400);
  const avant = await p.evaluate(() => [...document.querySelectorAll('[data-dp="panneau-tva"] button')].map(b => `${b.textContent.replace(/\s+/g, ' ').trim()}${b.getAttribute('aria-pressed') === 'true' ? ' [posé]' : ''}`));
  await p.screenshot({ path: path.join(sortie, `d375-avant-${theme}.png`) });
  await cliquerTexte(p, /sans TVA/); await dormir(400);
  await cliquerTexte(p, /^TVA\b/); await dormir(400);
  const apres = await p.evaluate(() => [...document.querySelectorAll('[data-dp="panneau-tva"] button')].map(b => `${b.textContent.replace(/\s+/g, ' ').trim()}${b.getAttribute('aria-pressed') === 'true' ? ' [posé]' : ''}`));
  await p.screenshot({ path: path.join(sortie, `d375-apres-${theme}.png`) });
  if (theme === 'clair') verdicts.push(`D375 panneau ${ouvert ? 'ouvert' : 'introuvable'} ; avant : ${avant.join(' | ')} ; après « sans TVA » : ${apres.join(' | ')}`,
    apres.length >= 2 && apres.some(x => /sans TVA.*\[posé\]/.test(x)) && apres.some(x => !/sans TVA/.test(x)) ? 'VISION D375 OK' : 'VISION D375 ECHEC (la TVA lue n\'est plus offerte, ou rien n\'est posé)');
  await p.close();
}
await nav.close();
console.log(verdicts.join('\n'));
