// Contrôle MM-1 (10.11, « On voit pas vraiment ce que on ajoute, et petit problème front », capture mon-mois-0834.jpg).
// Usage : node controle-mm1.mjs <port> [dossier-captures]. Banc local `?dev-local&finance-demo=reel` (ventes 5 695,00, données d'exemple, aucune donnée réelle).
// M1 : une dépense de 14,60 (Autre) face à 5 695 de ventes : le segment cerné de la pièce fait au moins 10 px de haut, et son écart « +14,60 » est écrit sur sa pile.
// M2 : pied du banc Dépense lu (`&depense=3`, bascule « Catégorie | Papier » présente) à 390 : la pastille du bouton « Mon mois » est entière (dans le bouton,
//      sans chevaucher la bascule). Rend « MM-1 OK » ou « MM-1 ECHEC » avec la liste.
import { ouvrir, calme } from '../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import path from 'node:path';

const PORT = process.argv[2] ?? '3001';
const CAPT = process.argv[3] ?? null;
const BASE = `http://localhost:${PORT}/?dev-local&finance-demo=reel`;
const echecs = [];
const shot = async (page, nom) => { if (CAPT) await page.screenshot({ path: path.join(CAPT, `${nom}.png`) }); };

async function setText(page, sel, texte) {
  await page.waitForSelector(sel, { timeout: 30000 });
  await page.click(sel, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.keyboard.type(texte, { delay: 15 });
}

// M1
{
  const { browser, page } = await ouvrir({ largeur: 390, hauteur: 844, mobile: true, echelle: 2 });
  try {
    await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
    await calme(page, 1200);
    await page.waitForSelector('button[aria-label="Actions rapides"]', { timeout: 30000 });
    await page.evaluate(() => document.querySelector('button[aria-label="Actions rapides"]').click());
    await calme(page, 500);
    await page.locator('::-p-text(Nouvelle écriture)').click();
    await calme(page, 600);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Saisir sans justificatif')?.click());
    await calme(page, 800);
    await setText(page, '[aria-label="Pour quoi ?"]', 'ZZ TEST Ibuprofène');
    await setText(page, '[name="num_purchase-total"]', '14,60');
    await page.evaluate(() => { const s = [...document.querySelectorAll('select')].find(x => [...x.options].some(o => o.textContent.trim() === 'Autre')); if (s) { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, [...s.options].find(o => o.textContent.trim() === 'Autre').value); s.dispatchEvent(new Event('change', { bubbles: true })); } });
    await calme(page, 500);
    await page.evaluate(() => document.querySelector('button.om-mo')?.click());
    await calme(page, 700);
    await shot(page, 'mm1-echelle-390');
    const m = await page.evaluate(() => {
      const seg = document.querySelector('.om-carte [data-piece]');
      const pile = seg?.closest('[data-pile]');
      const ecrit = pile ? [...pile.querySelectorAll('[data-om="ecart-pile"]')].map(e => e.textContent.trim()) : [];
      return { h: seg ? seg.getBoundingClientRect().height : -1, pile: pile?.getAttribute('data-pile') ?? null, ecrit };
    });
    if (m.h < 10) echecs.push(`M1 segment de la pièce ${m.h.toFixed(1)} px (< 10) sur la pile ${m.pile}`);
    if (!m.ecrit.some(t => t.replace(/\s/g, '') === '+14,60')) echecs.push(`M1 écart « +14,60 » absent de la pile (${JSON.stringify(m.ecrit)})`);
  } catch (e) { echecs.push(`M1 parcours : ${String(e?.message ?? e).slice(0, 160)}`); }
  finally { await browser.close(); }
}

// M2
{
  const { browser, page } = await ouvrir({ largeur: 390, hauteur: 844, mobile: true, echelle: 2 });
  try {
    await page.goto(`${BASE}&depense=3`, { waitUntil: 'load', timeout: 120000 });
    await calme(page, 1500);
    await page.waitForSelector('button[aria-label="Actions rapides"]', { timeout: 30000 });
    await page.evaluate(() => document.querySelector('button[aria-label="Actions rapides"]').click());
    await calme(page, 600);
    await page.locator('::-p-text(Nouvelle écriture)').click();
    await calme(page, 3000);
    await page.waitForSelector('button.om-mo', { timeout: 60000 });
    await page.waitForSelector('[aria-label="Ordre des lignes"]', { timeout: 60000 });
    await calme(page, 600);
    await shot(page, 'mm1-pied-390');
    const m = await page.evaluate(() => {
      const b = document.querySelector('button.om-mo'), em = b?.querySelector('em'), o = document.querySelector('[aria-label="Ordre des lignes"]');
      if (!b || !em) return { manque: !b ? 'bouton' : 'pastille' };
      const rb = b.getBoundingClientRect(), re = em.getBoundingClientRect(), ro = o.getBoundingClientRect();
      return { dedans: re.left >= rb.left - 0.5 && re.right <= rb.right + 0.5 && re.width > 0, chevauche: re.right > ro.left + 0.5, re: [re.left, re.right], rb: [rb.left, rb.right], ro: ro.left };
    });
    if (m.manque) echecs.push(`M2 ${m.manque} absent`);
    else {
      if (!m.dedans) echecs.push(`M2 pastille hors du bouton (pastille ${m.re.map(Math.round)}, bouton ${m.rb.map(Math.round)})`);
      if (m.chevauche) echecs.push(`M2 pastille sous la bascule Catégorie | Papier (pastille → ${Math.round(m.re[1])}, bascule ← ${Math.round(m.ro)})`);
    }
  } catch (e) { echecs.push(`M2 parcours : ${String(e?.message ?? e).slice(0, 160)}`); }
  finally { await browser.close(); }
}

console.log(echecs.length ? `MM-1 ECHEC\n- ${echecs.join('\n- ')}` : 'MM-1 OK');
process.exitCode = echecs.length ? 1 : 0;
