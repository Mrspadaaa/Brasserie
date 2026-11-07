// Gestes B2 : état 3 (facture lue, points) et `difficile`, 390 tactile clair (puis cave et 1280 pour quelques vues).
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { ouvrirEtat, dormir, mesurer } from 'file:///C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-10-31-ecran-depense/banc-b2/scenes.mjs';
const puppeteer = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json')('puppeteer-core');
const construit = process.env.TEMP + '/depense-b2';
const sortie = process.env.TEMP + '/affinee-test-b2/gestes'; fs.mkdirSync(sortie, { recursive: true });
const J = []; const log = (etape, x) => { J.push({ etape, ...x }); console.log(etape, JSON.stringify(x).slice(0, 700)); };
const cap = (p, nom) => p.screenshot({ path: path.join(sortie, nom + '.png') });
const texte = (p, sel) => p.evaluate(s => document.querySelector(s)?.innerText ?? null, sel);
const lignes = p => p.evaluate(() => [...document.querySelectorAll('[data-dp-ligne]')].map((a, i) => ({ i, id: a.dataset.dpLigne, groupe: a.dataset.dpGroupe, nom: a.querySelector('summary')?.innerText.replace(/\s+/g, ' ').slice(0, 70), niveau: a.dataset.dpNiveau ?? null, lien: a.querySelector('[data-dp-lien]')?.dataset.dpNiveau ?? null, ouverte: a.querySelector('details')?.open })));
const ouvrirLigne = async (p, nom) => {
  const ok = await p.evaluate(n => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes(n)); if (!a) return false; a.querySelector('summary').click(); a.scrollIntoView({ block: 'start' }); return true; }, nom);
  await dormir(500); return ok;
};
const plateau = (p, nom) => p.evaluate(n => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes(n)); if (!a) return null; const d = a.querySelector('details');
  return { texte: d.innerText.replace(/\n+/g, ' | ').slice(0, 900), boutons: [...d.querySelectorAll('button')].map(b => ({ t: (b.getAttribute('aria-label') || b.innerText).replace(/\s+/g, ' ').slice(0, 40), pressed: b.getAttribute('aria-pressed'), checked: b.getAttribute('aria-checked'), h: Math.round(b.getBoundingClientRect().height), w: Math.round(b.getBoundingClientRect().width) })), champs: [...d.querySelectorAll('input')].map(i => ({ aria: i.getAttribute('aria-label'), v: i.value, type: i.type, mode: i.inputMode })) }; }, nom);
const totaux = p => p.evaluate(() => ({ total: document.querySelector('[data-dp="total-niveau"]')?.innerText ?? document.querySelector('#purchase-total')?.value, bandes: [...document.querySelectorAll('[data-dp-bande]')].map(b => ({ b: b.dataset.dpBande, qte: b.querySelector('[data-dp-sous-qte]')?.innerText, m: b.querySelector('[data-dp-sous-montant]')?.innerText, doute: b.querySelector('[data-dp-sous-montant]')?.dataset.dpNiveau })), detail: document.querySelector('[data-dp-detail]')?.innerText ?? [...document.querySelectorAll('section[aria-label="Lignes de la facture"] *')].map(e => e.innerText).find(t => /^Détail/.test(t || '')) }));
async function saisir(p, aria, valeur) {
  const h = await p.$(`input[aria-label="${aria}"]`); if (!h) return 'absent';
  await h.click({ clickCount: 3 }); await p.keyboard.press('Backspace'); if (valeur !== '') await h.type(String(valeur), { delay: 10 }); await p.keyboard.press('Tab'); await dormir(300);
  return p.evaluate(a => document.querySelector(`input[aria-label="${a}"]`)?.value, aria);
}
const rangee = (p, nom) => p.evaluate(n => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes(n)); return a?.querySelector('summary')?.innerText.replace(/\s+/g, ' '); }, nom);

const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  // ---------- état 3, 390 clair ----------
  let p = await ouvrirEtat(nav, construit, '3', 't390', 'clair');
  log('S1 lignes', { lignes: await lignes(p) });
  // S2 : ligne à l'article proposé (Weizenmalz hell) → face à face D374
  log('S2 ouvrir Weizenmalz', { ok: await ouvrirLigne(p, 'Weizenmalz') }); await cap(p, '3-weizen-ouvert'); log('S2 plateau', await plateau(p, 'Weizenmalz'));
  const idx = (await lignes(p)).find(l => l.nom?.includes('Weizenmalz')).i + 1;
  // S3 : q × prix (D373)
  log('S3 avant', { r: await rangee(p, 'Weizenmalz'), t: await totaux(p) });
  for (const [aria, v] of [[`Quantité ligne ${idx}`, '3'], [`Prix ligne ${idx}`, '2'], [`Montant ligne ${idx}`, '10'], [`Quantité ligne ${idx}`, '0'], [`Quantité ligne ${idx}`, '-1'], [`Quantité ligne ${idx}`, 'abc'], [`Quantité ligne ${idx}`, '1,5'], [`Quantité ligne ${idx}`, '1.5'], [`Quantité ligne ${idx}`, ''], [`Prix ligne ${idx}`, '99999999'], [`Montant ligne ${idx}`, '3,1'], [`Quantité ligne ${idx}`, '2']]) {
    const val = await saisir(p, aria, v); const pl = await plateau(p, 'Weizenmalz');
    log('S3 ' + aria + ' := ' + JSON.stringify(v), { champ: val, champs: pl?.champs.filter(c => /Quantité|Prix|Montant/.test(c.aria || '')), r: await rangee(p, 'Weizenmalz'), t: (await totaux(p)).bandes.find(b => b.b === 'malt'), total: (await totaux(p)).total });
  }
  await cap(p, '3-weizen-apres-saisies');
  // S4 : les actionneurs du plateau, un par un
  const pl = await plateau(p, 'Weizenmalz'); log('S4 boutons', { b: pl?.boutons });
  for (const t of ['Retirer', 'Garder', 'Suivre au stock', 'Service', 'Ingrédient', 'Kg', 'g', 'extrait']) {
    const r = await p.evaluate((n, t) => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes(n)); const b = [...a.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') || b.innerText).trim().startsWith(t)); if (!b) return 'absent'; b.click(); return 'cliqué'; }, 'Weizenmalz', t);
    await dormir(400); log('S4 ' + t, { r, plateau: (await plateau(p, 'Weizenmalz'))?.texte?.slice(0, 400), r2: await rangee(p, 'Weizenmalz'), menus: await p.evaluate(() => [...document.querySelectorAll('[role=dialog],[role=menu],[role=alertdialog]')].length) }); await cap(p, '3-weizen-' + t.replace(/\s/g, '_'));
  }
  // S5 : Target bis (bis ?) et une ligne nouvelle (Goldings)
  for (const n of ['Target bis', 'Goldings', 'LALLEMAND Windsor']) { log('S5 ouvrir ' + n, { ok: await ouvrirLigne(p, n) }); await cap(p, '3-' + n.split(' ')[0]); log('S5 plateau ' + n, await plateau(p, n)); }
  // S6 : TVA (D375)
  await p.evaluate(() => document.querySelector('[data-dp="tuile-tva"]')?.scrollIntoView({ block: 'center' })); await p.click('[data-dp="tuile-tva"]'); await dormir(400); await cap(p, '3-tva-panneau');
  const cases = await p.evaluate(() => [...document.querySelectorAll('[data-dp="tuile-tva"] ~ * button, [aria-expanded="true"][data-dp="tuile-tva"] + * button')].map(b => ({ t: b.innerText.replace(/\s+/g, ' '), pressed: b.getAttribute('aria-pressed') })));
  log('S6 cases', { cases, tuile: await texte(p, '[data-dp="tuile-tva"]'), total: (await totaux(p)).total });
  for (let k = 0; k < 4; k++) {
    const r = await p.evaluate(k => { const bs = [...document.querySelectorAll('button')].filter(b => b.closest('[data-dp="tuile-tva"] ~ *') && /sans TVA|lu|posée|colonne|lecture|N \+ R/.test(b.innerText)); const b = bs[k]; if (!b) return 'absent'; const t = b.innerText.replace(/\s+/g, ' '); b.click(); return t; }, k);
    await dormir(350); log('S6 case ' + k, { r, tuile: await texte(p, '[data-dp="tuile-tva"]'), total: (await totaux(p)).total, panneauOuvert: await p.evaluate(() => document.querySelector('[data-dp="tuile-tva"]')?.getAttribute('aria-expanded')) }); await cap(p, '3-tva-case' + k);
    if (r !== 'absent') { await p.click('[data-dp="tuile-tva"]'); await dormir(300); }
  }
  // S7 : Plié | Déplié (D378) et chevron
  await p.evaluate(() => scrollTo(0, 0)); await p.click('[data-dp-plier-bouton="plie"]'); await dormir(400); await cap(p, '3-plie');
  log('S7 plié', { seg: await p.evaluate(() => [...document.querySelectorAll('[data-dp-plier-bouton]')].map(b => b.innerText + ':' + b.getAttribute('aria-pressed'))), corps: await p.evaluate(() => [...document.querySelectorAll('[data-dp-sg-corps],[id$="-corps"]')].map(c => c.id + ':' + c.hidden)), lignesVisibles: await p.evaluate(() => [...document.querySelectorAll('[data-dp-ligne]')].filter(a => a.offsetParent).length) });
  await p.click('[data-dp-plier-bouton="deplie"]'); await dormir(400); log('S7 déplié', { seg: await p.evaluate(() => [...document.querySelectorAll('[data-dp-plier-bouton]')].map(b => b.innerText + ':' + b.getAttribute('aria-pressed'))), lignesVisibles: await p.evaluate(() => [...document.querySelectorAll('[data-dp-ligne]')].filter(a => a.offsetParent).length) });
  const ch = await p.evaluate(() => { const b = document.querySelector('[data-dp-bande="hop"] [data-dp-bande-pli], [data-dp-bande-pli]'); if (!b) return 'absent'; const t = b.getAttribute('aria-label'); b.click(); return t; }); await dormir(400); await cap(p, '3-chevron');
  log('S7 chevron', { ch, seg: await p.evaluate(() => [...document.querySelectorAll('[data-dp-plier-bouton]')].map(b => b.innerText + ':' + b.getAttribute('aria-pressed'))), lignesVisibles: await p.evaluate(() => [...document.querySelectorAll('[data-dp-ligne]')].filter(a => a.offsetParent).length) });
  // badge « 7 +5 ↳ » : géométrie
  log('S8 badge malts', await p.evaluate(() => { const e = document.querySelector('[data-dp-bande="malt"] [data-dp-bande-entete]'); const c = e?.querySelector('[data-dp-bande-compte]'); const r = c?.getBoundingClientRect(); const er = e?.getBoundingClientRect(); return { badge: c?.innerText, h: r?.height, enteteH: er?.height, deborde: r && er ? r.bottom - er.bottom : null, boutons: [...(e?.querySelectorAll('button') ?? [])].map(b => (b.getAttribute('aria-label') || b.innerText) + ' ' + Math.round(b.getBoundingClientRect().height) + 'px') }; }));
  // S9 : deux retraits puis Annuler / rétablir
  await p.click('[data-dp-plier-bouton="deplie"]'); await dormir(300);
  const n0 = (await lignes(p)).length;
  for (const n of ['Haferflocken', 'Motueka']) { await ouvrirLigne(p, n); const r = await p.evaluate(n => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes(n)); const b = [...a.querySelectorAll('button')].find(b => /Retirer la ligne|supprimer/i.test(b.getAttribute('aria-label') || b.innerText)); if (!b) return 'absent'; b.click(); return b.getAttribute('aria-label') || b.innerText; }, n); await dormir(500); log('S9 retrait ' + n, { r, n: (await lignes(p)).length, retablir: await texte(p, '[data-dp-retablir]'), total: (await totaux(p)).total, menus: await p.evaluate(() => [...document.querySelectorAll('[role=dialog],[role=alertdialog]')].length) }); }
  await cap(p, '3-deux-retraits');
  const ann = await p.evaluate(() => { const b = document.querySelector('[data-dp-retablir]') || [...document.querySelectorAll('button')].find(b => /Annuler|Rétablir/.test(b.innerText)); if (!b) return 'absent'; const t = b.innerText; b.click(); return t; }); await dormir(400); log('S9 annuler', { ann, n: (await lignes(p)).length, n0, total: (await totaux(p)).total }); await cap(p, '3-apres-annuler');
  // S10 : rechargement en cours d'édition
  await ouvrirLigne(p, 'Gerstenflocken'); const i2 = (await lignes(p)).find(l => l.nom?.includes('Gerstenflocken')).i + 1; await saisir(p, `Quantité ligne ${i2}`, '7'); log('S10 avant reload', { r: await rangee(p, 'Gerstenflocken') });
  await p.reload({ waitUntil: 'domcontentloaded' }); await dormir(4000); log('S10 après reload', { feuille: await p.evaluate(() => Boolean(document.querySelector('[data-dp-ligne]'))), apercu: await p.evaluate(() => document.body.dataset.apercu), titre: await p.evaluate(() => document.title), texte: await p.evaluate(() => document.body.innerText.slice(0, 300).replace(/\n/g, ' | ')) }); await cap(p, '3-apres-reload');
  await p.close();
  // ---------- état difficile (D381) ----------
  p = await ouvrirEtat(nav, construit, 'difficile', 't390', 'clair');
  log('D1 difficile', { erreur: await texte(p, '[data-dp="erreur-lecture"]'), texte: await p.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').slice(0, 1200)), boutons: await p.evaluate(() => [...document.querySelectorAll('button')].map(b => (b.getAttribute('aria-label') || b.innerText).replace(/\s+/g, ' ').slice(0, 30)).filter(Boolean)) });
  const sm = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => /Saisir à la main/.test(b.innerText)); if (!b) return 'absent'; b.click(); return 'cliqué'; }); await dormir(500); log('D2 saisir à la main', { sm, actif: await p.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName) }); await cap(p, 'difficile-saisir');
  await saisir(p, 'Total TTC en CHF', '261,65'); log('D3 total saisi', { total: await p.evaluate(() => document.querySelector('#purchase-total')?.value), confirmer: await p.evaluate(() => { const b = document.querySelector('[data-primary]'); return { t: b?.innerText, off: b?.disabled, aria: b?.getAttribute('aria-label') }; }) }); await cap(p, 'difficile-total-saisi');
  const rl = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => /^Relire$/.test(b.innerText.trim())); if (!b) return 'absent'; b.click(); return 'cliqué'; }); await dormir(1500); log('D4 relire', { rl, texte: await p.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').slice(0, 500)) }); await cap(p, 'difficile-relire');
  await p.close();
  // ---------- cave 390 et 1280 clair : Weizenmalz ouvert, TVA ----------
  for (const [mode, theme] of [['t390', 'cave'], ['pc1280', 'clair'], ['pc1280', 'cave']]) {
    p = await ouvrirEtat(nav, construit, '3', mode, theme); await ouvrirLigne(p, 'Weizenmalz'); await cap(p, `3-weizen-${mode}-${theme}`);
    await ouvrirLigne(p, 'Target bis'); await cap(p, `3-target-${mode}-${theme}`);
    await p.evaluate(() => document.querySelector('[data-dp="tuile-tva"]')?.scrollIntoView({ block: 'center' })); await p.click('[data-dp="tuile-tva"]'); await dormir(400); await cap(p, `3-tva-${mode}-${theme}`);
    await p.close();
  }
} catch (e) { log('ERREUR', { e: String(e.stack).slice(0, 600) }); }
fs.writeFileSync(path.join(sortie, 'journal.json'), JSON.stringify(J, null, 1));
await nav.close();
