// v5b g4 : E1-2 (rangées ouvertes au doigt), LR1-14 (Terminé puis Annuel), TE-35 (Modifier le devis), titres « À vérifier ». Lecture seule du code.
import { lancer, ouvrir, feuilleDepense, capture, log, toucher, ecrireJournal, dormir } from './outil.mjs';
const nav = await lancer();
const seul = process.argv[2] ?? 'tout'; const fait = (k) => seul === 'tout' || seul.split(',').includes(k);
const feuille = (p, n = 1500) => p.evaluate((n) => (document.querySelector('[role=dialog]')?.innerText ?? document.body.innerText).replace(/[  ]/g, ' ').replace(/\n+/g, ' ¦ ').slice(0, n), n);
const dialog = (p) => p.evaluate(() => !!document.querySelector('[role=dialog]'));
async function doigt(p, h, nom) {
  if (!h) { log(`  introuvable : ${nom}`); return false; }
  const r = await h.evaluate((e) => { e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2; const d = document.elementFromPoint(x, y); return { x, y, ok: !!d && (d === e || e.contains(d)), dessus: d ? (d.getAttribute('aria-label') || d.innerText || d.tagName).slice(0, 40) : '—' }; });
  if (!r.ok) { log(`  ${nom} masqué au point (${Math.round(r.x)},${Math.round(r.y)}) par « ${r.dessus} » : non touché`); return false; }
  if (p.L < 600) await p.touchscreen.tap(r.x, r.y); else await p.mouse.click(r.x, r.y);
  await dormir(800); return true;
}
const parSel = (p, sel) => p.evaluateHandle((s) => [...document.querySelectorAll(s)].filter((e) => e.getClientRects().length).at(-1) ?? null, sel).then((h) => h.asElement());
const parTexte = (p, sel, re, dans) => p.evaluateHandle((s, r, d) => { const racine = d ? [...document.querySelectorAll(d)].filter((e) => e.getClientRects().length).at(-1) : document; if (!racine) return null; return [...racine.querySelectorAll(s)].filter((e) => e.getClientRects().length && new RegExp(r).test((e.innerText || e.textContent || '').trim())).at(0) ?? null; }, sel, re, dans).then((h) => h.asElement());
async function taper(p, sel, v) { const h = await parSel(p, sel); if (!h) { log(`  champ introuvable ${sel}`); return false; } await h.evaluate((x) => { x.scrollIntoView({ block: 'center' }); x.focus(); }); await p.keyboard.down('Control'); await p.keyboard.press('a'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace'); if (v !== '') await p.keyboard.type(String(v), { delay: 5 }); await p.keyboard.press('Tab'); await dormir(450); return true; }
const rangees = (p) => p.evaluate(() => [...document.querySelectorAll('details > summary')].filter((s) => s.getClientRects().length && /sans libellé|ZZ TEST e12/.test(s.innerText)).map((s) => `${s.innerText.replace(/\n+/g, ' ').slice(0, 60)}${s.parentElement.open ? ' [ouverte]' : ''}`));
const ouvrirRangee = async (p, i) => { const h = await p.evaluateHandle((i) => [...document.querySelectorAll('details > summary')].filter((s) => s.getClientRects().length && /sans libellé|ZZ TEST e12/.test(s.innerText))[i] ?? null, i).then((x) => x.asElement()); if (!h) return false; if (await h.evaluate((s) => s.parentElement.open)) return true; return doigt(p, h, `rangée ${i + 1}`); };
try {
  { const p = await ouvrir(nav, '?dev-local', 1280, 'clair'); await dormir(3000); await p.close(); }
  if (fait('e12')) for (const [L, th] of [[390, 'clair'], [1280, 'cave']]) {
    const p = await ouvrir(nav, '?dev-local', L, th);
    await p.waitForSelector('[aria-label="Actions rapides"]', { timeout: 90000 }); await p.click('[aria-label="Actions rapides"]'); await dormir(800);
    await toucher(p, 'Facture, photo ou PDF', { label: true, ms: 1200 }); await toucher(p, 'Saisir sans justificatif', { ms: 1200 });
    await taper(p, '#purchase-total', '3');
    log(`E1-2 ${L} rangées au départ : ${JSON.stringify(await rangees(p))}`);
    for (let n = 1; n <= 3; n++) {
      if ((await rangees(p)).length < n) await doigt(p, await parTexte(p, 'button', '^\\+?\\s*Ajouter une ligne$'), 'Ajouter une ligne');
      await ouvrirRangee(p, n - 1);
      await taper(p, `[aria-label="Libellé ligne ${n}"]`, `ZZ TEST e12 art ${n}`);
      await taper(p, `[aria-label="Quantité ligne ${n}"]`, '1');
      await taper(p, `[aria-label="Montant ligne ${n}"]`, '1');
      const cs = `[aria-label="Unité à remplir, ligne ${n}"]`;
      log(`E1-2 ${L} ligne ${n} cases : ${JSON.stringify(await p.evaluate((s) => [...(document.querySelector(s)?.querySelectorAll('button') ?? [])].map((b) => b.innerText.replace(/\n+/g, ' ')), cs))}`);
      if (n === 2) {
        await doigt(p, await parTexte(p, 'button', '^kg', cs), 'kg (case)');
        const u = await parSel(p, `[aria-label="Unité ligne ${n}"]`);
        log(`  ligne 2 après kg : ${u ? await u.evaluate((e) => `${e.tagName} ${e.innerText || e.value} role=${e.getAttribute('role')} parent=${e.parentElement.tagName}`) : 'pas d’« Unité ligne 2 »'}`);
        await doigt(p, u, 'menu Unité ligne 2');
        log(`  menu : ${JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('[role=menu], [role=listbox], [data-dp-cases-unite], select')].filter((e) => e.getClientRects().length).map((e) => `${e.getAttribute('role') || e.tagName}:${(e.innerText || [...(e.options ?? [])].map((o) => o.text).join('/')).replace(/\n+/g, ' ').slice(0, 80)}`)))}`);
        if (!(await doigt(p, await parTexte(p, '[role=option], [role=menuitem], [role=menuitemradio], button', '^pièce'), 'pièce (menu)'))) log('  « pièce » du menu non touché');
      } else await doigt(p, await parTexte(p, 'button', '^pièce', cs), `pièce (case) ligne ${n}`);
      log(`  ligne ${n} : ${await p.evaluate((n) => [...document.querySelectorAll(`[aria-label="Unité ligne ${n}"], [aria-label="Unité à remplir, ligne ${n}"], [aria-label="Quantité ligne ${n}"], [aria-label="Montant ligne ${n}"], [aria-label="Libellé ligne ${n}"]`)].filter((e) => e.getClientRects().length).map((e) => `${e.getAttribute('aria-label')}=${(e.value ?? e.innerText).replace(/\n+/g, ' ').slice(0, 30)}`).join(' / ') || '—', n)}`);
    }
    log(`  rangées : ${JSON.stringify(await rangees(p))}`);
    await taper(p, '#purchase-description', 'ZZ TEST e12 saisie à la main');
    log('  ' + await capture(p, 'e12c-saisie', { plein: L > 600 }));
    await doigt(p, await parSel(p, '[aria-label="Enregistrer la dépense"]'), 'Enregistrer'); await dormir(2500);
    log(`E1-2 ${L} après Enregistrer : dialog=${await dialog(p)} · ${(await feuille(p, 400))}`); log('  ' + await capture(p, 'e12c-apres'));
    if (await dialog(p)) await doigt(p, await parTexte(p, 'button', '^Terminé$'), 'Terminé');
    if (!(await dialog(p))) {
      await toucher(p, 'Finances', { exact: true, ms: 2000 });
      let h = await parTexte(p, 'button, a, [role=button], li, tr', 'ZZ TEST e12 saisie');
      if (!h) { log(`  Finances (extrait) : ${(await p.evaluate(() => document.body.innerText.replace(/\n+/g, ' ¦ ').slice(0, 700)))}`); for (const t of ['Mois', 'Dépenses', 'Journal', 'Opérations', 'Achats']) { if (await toucher(p, t, { exact: true, ms: 1300 })) { h = await parTexte(p, 'button, a, [role=button], li, tr', 'ZZ TEST e12 saisie'); if (h) { log(`  trouvée sous « ${t} »`); break; } } } }
      const ok = await doigt(p, h, 'dépense ZZ TEST e12'); await dormir(1500);
      log(`  rouvert=${ok && await dialog(p)} : ${(await feuille(p, 700))}`);
      for (let i = 0; i < 3; i++) await ouvrirRangee(p, i);
      log(`  unités rouvertes : ${JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('[aria-label^="Unité ligne"], [aria-label^="Unité à remplir"]')].filter((e) => e.getClientRects().length).map((e) => `${e.getAttribute('aria-label')}=${(e.value ?? e.innerText).replace(/\n+/g, ' ').slice(0, 30)}`)))} · rangées ${JSON.stringify(await rangees(p))}`);
      log('  ' + await capture(p, 'e12c-rouvert', { plein: L > 600 }));
    }
    await p.close();
  }
  if (fait('lr114')) for (const [L, th] of [[1280, 'cave'], [390, 'clair']]) {
    const a = await ouvrir(nav, '?dev-local', L, th); await toucher(a, 'Finances', { exact: true, ms: 1800 }); await toucher(a, 'Annuel', { ms: 1500 });
    const lire = (p) => p.evaluate(() => (document.body.innerText.match(/Clôture \d{4}[^\n]*\n?[^\n]*/) ?? ['—'])[0].replace(/\n/g, ' ') + ' | ' + (document.body.innerText.match(/[^\n]*(comptes ont changé|à refaire)[^\n]*/) ?? ['—'])[0]);
    log(`LR1-14 ${L} avant : ${await lire(a)}`); await a.close();
    const r = await feuilleDepense(nav, 'medicament', L, th);
    await doigt(r, await parSel(r, '[aria-label="Confirmer et enregistrer"]'), 'Confirmer'); await dormir(2500);
    await doigt(r, await parTexte(r, 'button', '^Terminé$'), 'Terminé'); await dormir(1200);
    log(`  feuille fermée=${!(await dialog(r))}`);
    await toucher(r, 'Finances', { exact: true, ms: 1800 }); await toucher(r, 'Annuel', { ms: 1500 });
    log(`LR1-14 ${L} après : ${await lire(r)}`); log('  ' + await capture(r, 'lr114c-apres')); await r.close();
  }
  if (fait('te35')) for (const [L, th] of [[390, 'clair'], [1280, 'cave']]) {
    const p = await ouvrir(nav, '?dev-local&preview=carnets', L, th);
    await toucher(p, 'À venir', { ms: 900 }); await toucher(p, 'Modifier ZZ TEST', { label: true, ms: 1200 }) || await toucher(p, 'Modifier', { ms: 1200 });
    await doigt(p, await parTexte(p, 'button', '^Modifier le devis'), 'Modifier le devis'); await dormir(600);
    const ins = await p.evaluate(() => [...document.querySelectorAll('input')].filter((e) => e.getClientRects().length).map((e) => `${e.getAttribute('aria-label') || e.id || e.name}=${e.value}`));
    log(`TE-35 ${L} champs : ${JSON.stringify(ins)}`); log('  ' + await capture(p, 'te35c-devis'));
    const cible = async (re) => p.evaluate((r) => { const e = [...document.querySelectorAll('input')].filter((x) => x.getClientRects().length).find((x) => new RegExp(r, 'i').test(`${x.getAttribute('aria-label')} ${x.id} ${x.name} ${x.closest('label, div')?.innerText ?? ''}`)); if (!e) return null; e.setAttribute('data-v5b', r); return `[data-v5b="${r}"]`; }, re);
    for (const [re, v] of [['livraison', 'abc'], ['prix|achat|estim', '−5'], ['installation|pose', '-5']]) {
      const s = await cible(re); if (!s) { log(`  champ ${re} absent`); continue; }
      await taper(p, s, v);
      const msg = await p.evaluate((s) => { const e = document.querySelector(s); let x = e; for (let i = 0; i < 4 && x; i++) x = x.parentElement; return `${e.getAttribute('aria-label') || e.id} valeur=« ${e.value} » · ${(x?.innerText ?? '').replace(/\n+/g, ' ').slice(0, 220)}`; }, s);
      log(`TE-35 ${L} « ${v} » → ${msg}`); log('  ' + await capture(p, `te35c-${re.split('|')[0]}`));
    }
    log(`  total : ${await p.evaluate(() => (document.body.innerText.match(/[^\n]*(Budget|Total)[^\n]*\n?[^\n]*/g) ?? ['—']).slice(0, 3).join(' || ').replace(/\n/g, ' '))}`);
    await p.close();
  }
  if (fait('titres')) for (const e of ['reel-doc14', 'reel-doc25']) for (const L of [390, 1280]) {
    const q = await feuilleDepense(nav, e, L, 'clair');
    log(`titre ${e} ${L} : ${await q.evaluate(() => (document.body.innerText.match(/À vérifier[^\n]*/g) ?? []).join(' || '))}`); await q.close();
  }
} catch (e) { log('ERREUR ' + e.message.slice(0, 300)); } finally { await nav.close(); ecrireJournal('journal-g4'); }
