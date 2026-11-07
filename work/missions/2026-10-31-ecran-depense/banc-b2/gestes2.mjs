// Gestes B2, second jeu : q × prix (champs retrouvés), cases TVA, rechargement puis réouverture, total à la main (difficile), ligne ajoutée.
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { ouvrirEtat, dormir } from 'file:///C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-10-31-ecran-depense/banc-b2/scenes.mjs';
const puppeteer = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json')('puppeteer-core');
const construit = process.env.TEMP + '/depense-b2';
const sortie = process.env.TEMP + '/affinee-test-b2/gestes'; fs.mkdirSync(sortie, { recursive: true });
const J = []; const log = (etape, x) => { J.push({ etape, ...x }); console.log(etape, JSON.stringify(x).slice(0, 900)); };
const cap = (p, nom) => p.screenshot({ path: path.join(sortie, nom + '.png') });
const ouvrirLigne = async (p, nom) => { const ok = await p.evaluate(n => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes(n)); if (!a) return false; if (!a.querySelector('details').open) a.querySelector('summary').click(); a.scrollIntoView({ block: 'start' }); return true; }, nom); await dormir(500); return ok; };
const rangee = (p, nom) => p.evaluate(n => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes(n)); return a?.querySelector('summary')?.innerText.replace(/\s+/g, ' '); }, nom);
const inputs = p => p.evaluate(() => [...document.querySelectorAll('input')].map(i => ({ aria: i.getAttribute('aria-label'), id: i.id, v: i.value, type: i.type, mode: i.inputMode })).filter(i => i.aria || i.id));
const etat = p => p.evaluate(() => ({ total: document.querySelector('#purchase-total')?.value, malt: { qte: document.querySelector('[data-dp-bande="malt"] [data-dp-sous-qte]')?.innerText, m: document.querySelector('[data-dp-bande="malt"] [data-dp-sous-montant]')?.innerText, doute: document.querySelector('[data-dp-bande="malt"] [data-dp-sous-montant]')?.dataset.dpNiveau, droite: Math.round(document.querySelector('[data-dp-bande="malt"] [data-dp-sous-montant]')?.getBoundingClientRect().right ?? 0), w: innerWidth }, detail: [...document.querySelectorAll('section[aria-label="Lignes de la facture"] span, section[aria-label="Lignes de la facture"] div')].map(e => e.innerText).find(t => /^Détail/.test(t || ''))?.replace(/\n/g, ' '), champs: [...document.querySelectorAll('input')].filter(i => /^(Quantité|Prix|Montant) ligne/.test(i.getAttribute('aria-label') || '')).map(i => i.getAttribute('aria-label').split(' ')[0] + '=' + i.value + (i.closest('[data-dp-niveau]') ? '(' + i.closest('[data-dp-niveau]').dataset.dpNiveau + ')' : '')) }));
async function saisir(p, sel, valeur) { const h = await p.$(sel); if (!h) return 'absent'; await h.click({ clickCount: 3 }); await p.keyboard.press('Backspace'); if (valeur !== '') await h.type(String(valeur), { delay: 15 }); const avantTab = await p.evaluate(s => document.querySelector(s)?.value, sel); await p.keyboard.press('Tab'); await dormir(300); return { avantTab, apres: await p.evaluate(s => document.querySelector(s)?.value, sel) }; }

const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  let p = await ouvrirEtat(nav, construit, '3', 't390', 'clair');
  await ouvrirLigne(p, 'Weizenmalz'); log('A0 inputs', { inputs: await inputs(p) });
  const q = await p.evaluate(() => [...document.querySelectorAll('input')].find(i => /^Quantité ligne/.test(i.getAttribute('aria-label') || ''))?.getAttribute('aria-label'));
  const n = q?.replace('Quantité ligne ', ''); const Q = `input[aria-label="Quantité ligne ${n}"]`, P = `input[aria-label="Prix ligne ${n}"]`, M = `input[aria-label="Montant ligne ${n}"]`;
  log('A0 champs', { q, n, e: await etat(p) });
  const seq = [[Q, '3'], [P, '2'], [M, '10'], [Q, '4'], [M, '3,1'], [P, '0,5'], [Q, '0'], [Q, '-1'], [Q, 'abc'], [Q, '1.5'], [Q, '1,5'], [Q, ''], [P, '99999999'], [Q, '2'], [P, '1,55']];
  for (const [sel, v] of seq) { const r = await saisir(p, sel, v); log('A1 ' + sel.replace(/input\[aria-label="|"\]/g, '') + ' := ' + JSON.stringify(v), { r, e: await etat(p), rangee: await rangee(p, 'Weizenmalz') }); }
  await cap(p, '3-qxp-fin');
  // A2 : unité g → prix, quantité ; puis retour Kg
  for (const u of ['g', 'Kg']) { await p.evaluate(u => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes('Weizenmalz')); [...a.querySelectorAll('[data-dp-unite-segments] button')].find(b => b.innerText.trim() === u)?.click(); }, u); await dormir(400); log('A2 unité ' + u, { e: await etat(p), rangee: await rangee(p, 'Weizenmalz') }); await cap(p, '3-unite-' + u); }
  // A3 : TVA
  await p.evaluate(() => document.querySelector('[data-dp="tuile-tva"]')?.scrollIntoView({ block: 'center' })); await p.click('[data-dp="tuile-tva"]'); await dormir(400);
  const cases = await p.evaluate(() => [...document.querySelectorAll('button[aria-pressed]')].filter(b => /sans TVA|N \+ R|colonne|lecture|posée|^lu/.test(b.innerText)).map(b => ({ t: b.innerText.replace(/\s+/g, ' '), pressed: b.getAttribute('aria-pressed'), h: Math.round(b.getBoundingClientRect().height) })));
  log('A3 cases', { cases, tuile: await p.evaluate(() => document.querySelector('[data-dp="tuile-tva"]')?.innerText.replace(/\n/g, ' ')), total: await p.evaluate(() => document.querySelector('#purchase-total')?.value) });
  for (const k of [1, 2, 0]) {
    const r = await p.evaluate(k => { const bs = [...document.querySelectorAll('button[aria-pressed]')].filter(b => /sans TVA|N \+ R|colonne|lecture|posée|^lu/.test(b.innerText)); const b = bs[k]; if (!b) return 'absent'; const t = b.innerText.replace(/\s+/g, ' '); b.click(); return t; }, k); await dormir(400);
    log('A3 case ' + k, { r, tuile: await p.evaluate(() => document.querySelector('[data-dp="tuile-tva"]')?.innerText.replace(/\n/g, ' ')), total: await p.evaluate(() => document.querySelector('#purchase-total')?.value), ouvert: await p.evaluate(() => document.querySelector('[data-dp="tuile-tva"]')?.getAttribute('aria-expanded')), ref: await p.evaluate(() => [...document.querySelectorAll('details, div')].map(e => e.innerText).find(t => /^Référence et TVA du document/.test(t || ''))?.replace(/\n/g, ' ').slice(0, 80)) }); await cap(p, '3-tva-k' + k);
    await p.evaluate(() => { const t = document.querySelector('[data-dp="tuile-tva"]'); if (t?.getAttribute('aria-expanded') !== 'true') t?.click(); }); await dormir(300);
  }
  // A4 : + Ajouter une ligne, nom absurde
  await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /Ajouter une ligne/.test(b.innerText))?.scrollIntoView({ block: 'center' })); await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /Ajouter une ligne/.test(b.innerText))?.click()); await dormir(500);
  log('A4 ajout', { inputs: (await inputs(p)).filter(i => /Nom|ligne/.test(i.aria || '')).slice(-6), n: await p.evaluate(() => document.querySelectorAll('[data-dp-ligne]').length) }); await cap(p, '3-ajout');
  const nomSel = await p.evaluate(() => { const i = [...document.querySelectorAll('input')].filter(i => /^Nom de l’article/.test(i.getAttribute('aria-label') || '')).pop(); return i ? `input[aria-label="${i.getAttribute('aria-label')}"]` : null; });
  if (nomSel) for (const v of ['Crystal 60', '123', 'Malt Pilsner 25kg ' + 'x'.repeat(80), '']) { const r = await saisir(p, nomSel, v); log('A4 nom := ' + v.slice(0, 20), { r: { ...r, apres: r.apres?.slice(0, 40) }, neuve: await p.evaluate(() => document.querySelector('[data-dp-neuve] summary')?.innerText.replace(/\s+/g, ' ')), n: await p.evaluate(() => document.querySelectorAll('[data-dp-ligne]').length) }); }
  await cap(p, '3-ajout-nom');
  // A5 : rechargement puis réouverture de la feuille
  await ouvrirLigne(p, 'Gerstenflocken'); const qg = await p.evaluate(() => [...document.querySelectorAll('input')].map(i => i.getAttribute('aria-label')).filter(a => /^Quantité ligne/.test(a || '')));
  log('A5 qg', { qg }); if (qg[0]) await saisir(p, `input[aria-label="${qg[0]}"]`, '7'); log('A5 avant reload', { rangee: await rangee(p, 'Gerstenflocken'), total: await p.evaluate(() => document.querySelector('#purchase-total')?.value) });
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => document.querySelector('[aria-label="Actions rapides"]'), { timeout: 60000 }); await p.click('[aria-label="Actions rapides"]'); await dormir(600);
  log('A5 actions rapides', { boutons: await p.evaluate(() => [...document.querySelectorAll('button')].map(b => b.innerText.replace(/\s+/g, ' ')).filter(t => /facture|dépense|brouillon|Reprendre/i.test(t))) }); await cap(p, '3-reload-actions');
  await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /Entrer une facture/.test(b.textContent))?.click()); await dormir(5000);
  log('A5 après réouverture', { rangee: await rangee(p, 'Gerstenflocken'), lignes: await p.evaluate(() => document.querySelectorAll('[data-dp-ligne]').length), texte: await p.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').slice(0, 400)) }); await cap(p, '3-reload-reouvert');
  await p.close();
  // B : difficile, total à la main
  p = await ouvrirEtat(nav, construit, 'difficile', 't390', 'clair');
  await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /Saisir à la main/.test(b.innerText))?.click()); await dormir(300);
  for (const v of ['261,65', '261.65', '261', '0', '-5', 'abc', '']) { const h = await p.$('#purchase-total'); await h.click({ clickCount: 3 }); await p.keyboard.press('Backspace'); const frappes = []; for (const c of v) { await p.keyboard.type(c); frappes.push(await p.evaluate(() => document.querySelector('#purchase-total').value)); } await p.keyboard.press('Tab'); await dormir(250); log('B1 total := ' + v, { frappes, apresTab: await p.evaluate(() => document.querySelector('#purchase-total').value), enregistrerOff: await p.evaluate(() => document.querySelector('[data-primary]')?.disabled) }); }
  await cap(p, 'difficile-total-vide');
  await p.evaluate(() => [...document.querySelectorAll('button, summary')].find(b => /Articles, stock et matériel/.test(b.innerText))?.click()); await dormir(400); await cap(p, 'difficile-articles');
  log('B2 articles', { texte: await p.evaluate(() => { const e = [...document.querySelectorAll('details, section, div')].find(e => /^Articles, stock et matériel/.test(e.innerText || '')); return e?.innerText.replace(/\n+/g, ' | ').slice(0, 500); }), lignes: await p.evaluate(() => document.querySelectorAll('[data-dp-ligne], [data-purchase-line]').length) });
  await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /^Enregistrer/.test(b.innerText.trim()))?.click()); await dormir(800); log('B3 enregistrer sans total', { alerte: await p.evaluate(() => document.querySelector('[role=alert]')?.innerText.replace(/\n+/g, ' | ')), actif: await p.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute('aria-label')) }); await cap(p, 'difficile-enregistrer-vide');
  await p.close();
} catch (e) { log('ERREUR', { e: String(e.stack).slice(0, 600) }); }
fs.writeFileSync(path.join(sortie, 'journal2.json'), JSON.stringify(J, null, 1)); await nav.close();
