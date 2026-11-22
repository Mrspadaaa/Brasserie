// v5b g2 : états non joués par v3 (E1-2, BE-23, LR1-14, TE-35). BR-27 et TE-36 : ../f3/captures.mjs. Lecture seule du code.
import { lancer, ouvrir, feuilleDepense, capture, log, toucher, ecrireJournal, dormir } from './outil.mjs';
const nav = await lancer();
const feuille = (p, n = 1500) => p.evaluate((n) => (document.querySelector('[role=dialog]')?.innerText ?? document.body.innerText).replace(/[  ]/g, ' ').replace(/\n+/g, ' ¦ ').slice(0, n), n);
const labels = (p, re) => p.evaluate((r) => [...document.querySelectorAll('[aria-label],[title]')].filter((e) => e.getClientRects().length).map((e) => `${e.tagName.toLowerCase()}:${e.getAttribute('aria-label') ?? ('title=' + e.title)}${'value' in e ? '=' + e.value : ''}`).filter((l) => new RegExp(r, 'i').test(l)).slice(0, 40), re);
const manuel = async (L, th) => { const p = await ouvrir(nav, '?dev-local', L, th); await p.waitForSelector('[aria-label="Actions rapides"]', { timeout: 90000 }); await p.click('[aria-label="Actions rapides"]'); await dormir(800); await toucher(p, 'Facture, photo ou PDF', { label: true, ms: 1200 }); await toucher(p, 'Saisir sans justificatif', { ms: 1200 }); return p; };
async function taper(p, sel, v) { const e = (await p.$$(sel)).at(-1); if (!e) { log(`  champ introuvable ${sel}`); return false; } await e.evaluate((x) => x.scrollIntoView({ block: 'center' })); await e.click({ clickCount: 3 }); await p.keyboard.press('Backspace'); if (v !== '') await p.keyboard.type(String(v), { delay: 5 }); await p.keyboard.press('Tab'); await dormir(450); return true; }
const choisir = (p, label, texte) => p.evaluate((l, t) => { const s = [...document.querySelectorAll(`select[aria-label="${l}"]`)].at(-1); if (!s) return 'select absent'; const o = [...s.options].find((o) => o.text.includes(t)); if (!o) return 'option absente : ' + [...s.options].map((o) => o.text).join('/'); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, o.value); s.dispatchEvent(new Event('change', { bubbles: true })); return 'ok ' + o.text; }, label, texte);
const annuel = async (p) => { await toucher(p, 'Finances', { exact: true, ms: 1800 }); await toucher(p, 'Annuel', { ms: 1500 }); return p.evaluate(() => (document.body.innerText.match(/Clôture \d{4}[^\n]*\n?[^\n]*/) ?? ['—'])[0].replace(/\n/g, ' ') + ' | ' + ([...document.querySelectorAll('[aria-label^="Clôture"]')].map((e) => e.getAttribute('aria-label')).join(' / ') || '—')); };
try {
  { const p = await ouvrir(nav, '?dev-local', 1280, 'clair'); await dormir(3000); await p.close(); }
  // E1-2 : saisie à la main de 3 lignes, « pièce » sur chacune, Enregistrer, rouvrir
  for (const [L, th] of [[390, 'clair'], [1280, 'cave']]) {
    const p = await manuel(L, th);
    await taper(p, '#purchase-total', '3');
    await toucher(p, 'Articles, stock et matériel', { ms: 1000 });
    for (let n = 1; n <= 3; n++) {
      if (n > 1) await toucher(p, 'Ajouter une ligne', { exact: true, ms: 900, dernier: true });
      log(`E1-2 ${L} ligne ${n} stock : ${await choisir(p, `Stock ligne ${n}`, 'Nouvel article')}`); await dormir(600);
      log(`  champs : ${JSON.stringify(await labels(p, `ligne ${n}|Unité`))}`);
      for (const lab of [`Nom ligne ${n}`, `Article ligne ${n}`, `Désignation ligne ${n}`]) if (await p.$(`[aria-label="${lab}"]`)) await taper(p, `[aria-label="${lab}"]`, `ZZ TEST e1 art ${n}`);
      await taper(p, `[aria-label="Quantité ligne ${n}"]`, '1');
      // « pièce » : par la case « Unité à remplir » (ligne 1, 3), sinon par le champ de ligne (ligne 2)
      const caseU = n !== 2 && await p.$(`[aria-label="Unité à remplir, ligne ${n}"]`);
      if (caseU) { await caseU.evaluate((x) => x.scrollIntoView({ block: 'center' })); await caseU.click(); await dormir(600); log(`  case unité ${n} ouverte : ${JSON.stringify(await labels(p, 'pièce|unité'))}`); await toucher(p, 'pièce', { exact: true, ms: 600 }); }
      else await taper(p, `[aria-label="Unité ligne ${n}"]`, 'pièce');
      if (await p.$(`[aria-label="Montant ligne ${n}"]`)) await taper(p, `[aria-label="Montant ligne ${n}"]`, '1');
    }
    log(`E1-2 ${L} avant Enregistrer : ${JSON.stringify(await labels(p, 'ligne \\d'))}`); log('  ' + await capture(p, 'e12-saisie'));
    await toucher(p, 'Enregistrer la dépense', { label: true, ms: 2500 });
    log(`  après Enregistrer : dialog=${await p.evaluate(() => !!document.querySelector('[role=dialog]'))} · ${(await feuille(p, 500))}`); log('  ' + await capture(p, 'e12-apres'));
    await toucher(p, 'Finances', { exact: true, ms: 1800 }); await toucher(p, 'Opérations', { ms: 1200 });
    const ok = await toucher(p, '3,00', { sel: 'button, a, [role=button], li, tr', ms: 1500 });
    log(`  rouvert=${ok} : ${(await feuille(p, 1500))}`); log(`  unités : ${JSON.stringify(await labels(p, 'Unité|Quantité ligne'))}`); log('  ' + await capture(p, 'e12-rouvert', { plein: L > 600 }));
    await p.close();
  }
  // BE-23 : medicament, ligne ouverte, « Ajouter au stock » : barre « imprimé … ? · g kg pièce » sans « Stk »
  for (const [L, th] of [[390, 'cave'], [1280, 'clair']]) {
    const r = await feuilleDepense(nav, 'medicament', L, th);
    await toucher(r, 'MEFENACIDE', { ms: 900 });
    log(`BE-23 ${L} boutons stock : ${JSON.stringify(await r.evaluate(() => [...document.querySelectorAll('button, select')].filter((b) => b.getClientRects().length && /stock/i.test((b.innerText || '') + (b.getAttribute('aria-label') || ''))).map((b) => (b.getAttribute('aria-label') || b.innerText).slice(0, 50))))}`);
    let t = await toucher(r, 'Ajouter au stock', { ms: 900 }); if (!t) log(`  choix stock : ${await choisir(r, 'Stock ligne 1', 'Nouvel article')}`); await dormir(800);
    const barre = await r.evaluate(() => [...document.querySelectorAll('span')].filter((s) => /imprimé .*\? ·/.test(s.innerText) && s.getClientRects().length).map((s) => { s.scrollIntoView({ block: 'center' }); return s.parentElement.innerText.replace(/\n+/g, ' '); }).slice(0, 3));
    log(`  barre : ${JSON.stringify(barre)} · Stk=${await r.evaluate(() => /\bStk\b/.test(document.body.innerText))}`); log('  ' + await capture(r, 'be23-barre')); await r.close();
  }
  // LR1-14 : Finances › Annuel « n / 9 prêtes » avant et après Confirmer d'une dépense (banc medicament)
  for (const [L, th] of [[1280, 'cave'], [390, 'clair']]) {
    const a = await ouvrir(nav, '?dev-local', L, th); log(`LR1-14 ${L} avant : ${await annuel(a)}`); log('  ' + await capture(a, 'lr114-avant')); await a.close();
    const r = await feuilleDepense(nav, 'medicament', L, th);
    log(`  pied : ${await r.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.getClientRects().length && /Confirmer|Enregistrer/.test(b.innerText)).map((b) => b.innerText.trim() + (b.disabled ? ' (inactif)' : '')).join(' | '))}`);
    await toucher(r, 'Confirmer', { ms: 2500, dernier: true }); log(`  après Confirmer : dialog=${await r.evaluate(() => !!document.querySelector('[role=dialog]'))} ${(await feuille(r, 300))}`);
    log(`LR1-14 ${L} après : ${await annuel(r)}`); log('  ' + await capture(r, 'lr114-apres')); await r.close();
  }
  // TE-35 : feuille du projet (À venir › Modifier ZZ TEST), saisies « abc », « −5 », « -5 »
  for (const [L, th] of [[390, 'clair'], [1280, 'cave']]) {
    const p = await ouvrir(nav, '?dev-local&preview=carnets', L, th);
    await toucher(p, 'À venir', { ms: 900 }); await toucher(p, 'Modifier ZZ TEST', { label: true, ms: 1200 }) || await toucher(p, 'Modifier', { ms: 1200 });
    for (const [lab, v] of [['Livraison TTC (CHF)', 'abc'], ['Prix estimé TTC (CHF)', '−5'], ['Installation TTC (CHF)', '-5']]) {
      const ok = await taper(p, `[aria-label="${lab}"]`, v);
      const msg = ok && await p.evaluate((l) => { const e = [...document.querySelectorAll(`[aria-label="${l}"]`)].at(-1); let x = e; for (let i = 0; i < 4 && x; i++) x = x.parentElement; return `valeur=${e.value} · ${(x?.innerText ?? '').replace(/\n+/g, ' ').slice(0, 200)}`; }, lab);
      log(`TE-35 ${L} ${lab} « ${v} » : ${msg}`); if (ok) log('  ' + await capture(p, `te35-${lab.split(' ')[0].toLowerCase()}`));
    }
    await p.close();
  }
} finally { await nav.close(); ecrireJournal('journal-g2'); }
