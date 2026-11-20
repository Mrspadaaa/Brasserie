// v5b g3 : rejeux au bon geste (v3-5 dès t=0, LR1-9 bouton du bloc Lectures, v3-7/v3-8 « supprimer » au doigt, E1-2, BE-23, LR1-14, TE-35). Lecture seule du code.
import { lancer, ouvrir, feuilleDepense, capture, log, toucher, ecrireJournal, dormir } from './outil.mjs';
const nav = await lancer();
const seul = process.argv[2] ?? 'tout'; const fait = (k) => seul === 'tout' || seul.split(',').includes(k);
const feuille = (p, n = 1500) => p.evaluate((n) => (document.querySelector('[role=dialog]')?.innerText ?? document.body.innerText).replace(/[  ]/g, ' ').replace(/\n+/g, ' ¦ ').slice(0, n), n);
const dialog = (p) => p.evaluate(() => !!document.querySelector('[role=dialog]'));
const pied = (p) => p.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.getClientRects().length && /lecture|Confirmer|Enregistrer/i.test(b.innerText)).map((b) => `${b.innerText.trim()}${b.disabled ? ' (inactif)' : ''}`).join(' | '));
// Toucher un élément par handle : scroll, contrôle elementFromPoint, tap au doigt (390) ou clic.
async function doigt(p, h, nom) {
  if (!h) { log(`  introuvable : ${nom}`); return false; }
  const r = await h.evaluate((e) => { e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2; const d = document.elementFromPoint(x, y); return { x, y, ok: !!d && (d === e || e.contains(d)), dessus: d ? (d.getAttribute('aria-label') || d.innerText || d.tagName).slice(0, 40) : '—', vh: innerHeight }; });
  if (!r.ok) log(`  ${nom} masqué au point (${Math.round(r.x)},${Math.round(r.y)}) par « ${r.dessus} » (vh ${r.vh})`);
  if (p.L < 600) await p.touchscreen.tap(r.x, r.y); else await p.mouse.click(r.x, r.y);
  await dormir(800); return r.ok;
}
const parSel = (p, sel, idx = -1) => p.evaluateHandle((s, i) => { const l = [...document.querySelectorAll(s)].filter((e) => e.getClientRects().length); return l.at(i) ?? null; }, sel, idx).then((h) => h.asElement());
const parTexte = (p, sel, re, dans) => p.evaluateHandle((s, r, d) => { const racine = d ? [...document.querySelectorAll(d)].filter((e) => e.getClientRects().length).at(-1) : document; if (!racine) return null; return [...racine.querySelectorAll(s)].filter((e) => e.getClientRects().length && new RegExp(r).test((e.innerText || e.textContent || '').trim())).at(0) ?? null; }, sel, re, dans).then((h) => h.asElement());
async function taper(p, sel, v) { const h = await parSel(p, sel); if (!h) { log(`  champ introuvable ${sel}`); return false; } await h.evaluate((x) => { x.scrollIntoView({ block: 'center' }); x.focus(); x.select?.(); }); await p.keyboard.down('Control'); await p.keyboard.press('a'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace'); if (v !== '') await p.keyboard.type(String(v), { delay: 5 }); await p.keyboard.press('Tab'); await dormir(450); return true; }
const annuel = async (p) => { await toucher(p, 'Finances', { exact: true, ms: 1800 }); await toucher(p, 'Annuel', { ms: 1500 }); return p.evaluate(() => (document.body.innerText.match(/Clôture \d{4}[^\n]*\n?[^\n]*/) ?? ['—'])[0].replace(/\n/g, ' ') + ' | ' + ([...document.querySelectorAll('[aria-label^="Clôture"]')].map((e) => e.getAttribute('aria-label')).join(' / ') || '—')); };
try {
  { const p = await ouvrir(nav, '?dev-local', 1280, 'clair'); await dormir(3000); await p.close(); }
  // v3-5 : pied relevé toutes les 150 ms dès le toucher de « Facture, photo ou PDF »
  if (fait('v35')) for (const [L, th] of [[390, 'clair'], [1280, 'cave']]) {
    const p = await ouvrir(nav, '?dev-local&depense=v3-lent', L, th);
    await p.waitForSelector('[aria-label="Actions rapides"]', { timeout: 90000 }); await p.click('[aria-label="Actions rapides"]'); await dormir(800);
    const b = await parSel(p, '[aria-label="Facture, photo ou PDF"]'); const t0 = Date.now(); await b.evaluate((x) => x.click());
    let avant = ''; let k = 0;
    while (Date.now() - t0 < 30000) { const pd = await pied(p); if (pd !== avant) { log(`v3-5 ${L} t=${Date.now() - t0}ms pied : ${pd} · lectures=${await p.evaluate(() => (document.body.innerText.match(/Lectures[^\n]*/) ?? [''])[0])}`); if (k < 4) log('  ' + await capture(p, `v35b-${k++}`)); avant = pd; } if (await p.evaluate(() => document.body.dataset.apercu === 'v3-lent')) break; await dormir(150); }
    await p.close();
  }
  // LR1-9 : doc2 390, « Voir le désaccord » du bloc Lectures, 4 touchers
  if (fait('lr19')) for (const th of ['clair', 'cave']) {
    const q = await feuilleDepense(nav, 'reel-doc2', 390, th);
    log(`LR1-9 ${th} candidats : ${JSON.stringify(await q.evaluate(() => [...document.querySelectorAll('button, a, [role=button], summary, span')].filter((e) => e.getClientRects().length && /Voir le désaccord/.test(e.innerText || '') && e.children.length < 3).map((e) => `${e.tagName}:${(e.parentElement?.innerText || '').replace(/\n+/g, ' ').slice(0, 70)}`)))}`);
    for (let k = 1; k <= 4; k++) {
      const h = await q.evaluateHandle(() => { const c = [...document.querySelectorAll('button, a, [role=button], summary, span')].filter((e) => e.getClientRects().length && /Voir le désaccord/.test(e.innerText || '') && e.children.length < 3); return c.find((e) => /Lectures/.test(e.closest('li, div')?.innerText || '')) ?? c.at(-1) ?? null; }).then((x) => x.asElement());
      const ok = await doigt(q, h, `Voir le désaccord ${k}`);
      const ouv = await q.evaluate(() => ({ jaune: [...document.querySelectorAll('[data-dp-desaccord-ligne]')].filter((e) => e.getClientRects().length).map((e) => `${e.innerText.replace(/\n+/g, ' ').slice(0, 90)} @y${Math.round(e.getBoundingClientRect().top)}`), ouverts: [...document.querySelectorAll('details[open] summary')].filter((s) => s.getClientRects().length).map((s) => `${s.innerText.replace(/\n+/g, ' ').slice(0, 50)} @y${Math.round(s.getBoundingClientRect().top)}`), focus: (document.activeElement?.getAttribute('aria-label') || document.activeElement?.innerText || document.activeElement?.tagName || '').replace(/\n+/g, ' ').slice(0, 80), desaccord: (document.body.innerText.match(/[^\n]*(diffèrent|divergent|désaccord)[^\n]*/g) ?? []).slice(0, 6) }));
      log(`LR1-9 ${th} toucher ${k} (atteint=${ok}) : ${JSON.stringify(ouv)}`); log('  ' + await capture(q, `lr19b-${k}`));
    }
    await q.close();
  }
  // v3-7 / v3-8 : banc 3 390, rangée Gerstenflocken, « supprimer » dans la ligne ouverte, au doigt
  if (fait('v37')) for (const th of ['clair', 'cave']) {
    const s = await feuilleDepense(nav, '3', 390, th);
    const compte = () => s.evaluate(() => ({ g: document.body.innerText.match(/Gerstenflocken/g)?.length ?? 0, pastille: (document.body.innerText.match(/\d+ lignes/) ?? ['—'])[0], resumes: document.querySelectorAll('details summary').length }));
    const n0 = await compte();
    await doigt(s, await parTexte(s, 'summary, [role=button], button', 'Gerstenflocken'), 'rangée Gerstenflocken'); log('  ' + await capture(s, 'v37b-ouverte'));
    const h = await parTexte(s, 'button', '^supprimer$', 'details[open]');
    log(`v3-7 ${th} « supprimer » : ${h ? await h.evaluate((e) => `${e.innerText.trim()} · aria=${e.getAttribute('aria-label')} · ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`) : 'absent'}`);
    if (h) { await h.evaluate((e) => e.scrollIntoView({ block: 'center' })); await dormir(300); log('  ' + await capture(s, 'v37b-supprimer')); const ok = await doigt(s, h, 'supprimer'); log(`  atteint au doigt=${ok}`); await dormir(600); }
    log(`v3-8 ${th} avant ${JSON.stringify(n0)} après ${JSON.stringify(await compte())} ; ${(await feuille(s, 300))}`); log('  ' + await capture(s, 'v38b-apres')); await s.close();
  }
  // E1-2 : saisie à la main, 3 lignes, « pièce » par la case (1, 3) et par le menu de ligne (2), Enregistrer, rouvrir
  if (fait('e12')) for (const [L, th] of [[390, 'clair'], [1280, 'cave']]) {
    const p = await ouvrir(nav, '?dev-local', L, th);
    await p.waitForSelector('[aria-label="Actions rapides"]', { timeout: 90000 }); await p.click('[aria-label="Actions rapides"]'); await dormir(800);
    await toucher(p, 'Facture, photo ou PDF', { label: true, ms: 1200 }); await toucher(p, 'Saisir sans justificatif', { ms: 1200 });
    await taper(p, '#purchase-total', '3');
    await toucher(p, 'Articles, stock et matériel', { ms: 1000 });
    for (let n = 1; n <= 3; n++) {
      if (n > 1 && !(await p.$(`[aria-label="Libellé ligne ${n}"]`))) await toucher(p, 'Ajouter une ligne', { ms: 900, dernier: true });
      await taper(p, `[aria-label="Libellé ligne ${n}"]`, `ZZ TEST e12 art ${n}`);
      await taper(p, `[aria-label="Quantité ligne ${n}"]`, '1');
      await taper(p, `[aria-label="Montant ligne ${n}"]`, '1');
      const caseU = await parSel(p, `[aria-label="Unité à remplir, ligne ${n}"]`);
      const unites = caseU ? await caseU.evaluate((c) => [...c.querySelectorAll('button')].map((b) => b.innerText.replace(/\n+/g, ' '))) : [];
      log(`E1-2 ${L} ligne ${n} case unité=${!!caseU} ${JSON.stringify(unites)}`);
      if (n === 2) {
        if (caseU) await doigt(p, await parTexte(p, 'button', '^kg', `[aria-label="Unité à remplir, ligne ${n}"]`), 'kg');
        await doigt(p, await parSel(p, `[aria-label="Unité ligne ${n}"]`), `menu Unité ligne ${n}`);
        log(`  menu ligne 2 : ${JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('[role=menu] *, [role=listbox] *, [role=option], [role=menuitem], [role=menuitemradio]')].filter((e) => e.getClientRects().length).map((e) => e.innerText.trim()).filter(Boolean).slice(0, 12)))}`);
        const opt = await parTexte(p, '[role=option], [role=menuitem], [role=menuitemradio], button', '^pièce');
        await doigt(p, opt, 'pièce (menu)');
      } else await doigt(p, await parTexte(p, 'button', '^pièce', `[aria-label="Unité à remplir, ligne ${n}"]`), `pièce ligne ${n}`);
      log(`  ligne ${n} unité lue : ${await p.evaluate((n) => [...document.querySelectorAll(`[aria-label="Unité ligne ${n}"], [aria-label="Unité à remplir, ligne ${n}"]`)].map((e) => `${e.tagName}:${(e.value ?? e.innerText).replace(/\n+/g, ' ').slice(0, 40)}`).join(' / ') || '—', n)}`);
    }
    await toucher(p, 'Pour quoi ?', { ms: 700 }); await taper(p, '#purchase-description', 'ZZ TEST e12 saisie à la main');
    log('  ' + await capture(p, 'e12b-saisie', { plein: L > 600 }));
    await toucher(p, 'Enregistrer la dépense', { label: true, ms: 2500 });
    const ouvert = await dialog(p); log(`E1-2 ${L} après Enregistrer : dialog=${ouvert} · ${(await feuille(p, 400))}`); log('  ' + await capture(p, 'e12b-apres'));
    if (!ouvert) {
      await toucher(p, 'Finances', { exact: true, ms: 1800 });
      log(`  onglets Finances : ${JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('[role=tab], nav button')].filter((e) => e.getClientRects().length).map((e) => e.innerText.trim()).filter(Boolean)))}`);
      let h = await parTexte(p, 'button, a, [role=button], li, tr', 'ZZ TEST e12 saisie');
      if (!h) for (const t of ['Mois', 'Dépenses', 'Journal', 'Opérations']) { if (await toucher(p, t, { ms: 1200 })) { h = await parTexte(p, 'button, a, [role=button], li, tr', 'ZZ TEST e12 saisie'); if (h) break; } }
      const ok = await doigt(p, h, 'dépense ZZ TEST e12'); await dormir(1200);
      log(`  rouvert=${ok && await dialog(p)} : ${(await feuille(p, 900))}`);
      await toucher(p, 'Articles, stock et matériel', { ms: 900 });
      log(`  unités rouvertes : ${JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('[aria-label^="Unité ligne"], [aria-label^="Unité à remplir"]')].filter((e) => e.getClientRects().length).map((e) => `${e.getAttribute('aria-label')}=${(e.value ?? e.innerText).replace(/\n+/g, ' ').slice(0, 30)}`)))} · rangées : ${JSON.stringify(await p.evaluate(() => (document.body.innerText.match(/[^\n]*ZZ TEST e12 art[^\n]*\n?[^\n]*/g) ?? []).map((s) => s.replace(/\n/g, ' ¦ '))))}`);
      log('  ' + await capture(p, 'e12b-rouvert', { plein: L > 600 }));
    }
    await p.close();
  }
  // BE-23 : medicament, ligne 1 ouverte, « Ajouter au stock, ligne 1 » touché par label
  if (fait('be23')) for (const [L, th] of [[390, 'cave'], [1280, 'clair']]) {
    const r = await feuilleDepense(nav, 'medicament', L, th);
    await toucher(r, 'MEFENACIDE', { ms: 900 });
    await doigt(r, await parSel(r, '[aria-label="Ajouter au stock, ligne 1"]'), 'Ajouter au stock'); await dormir(600);
    const vu = await r.evaluate(() => { const t = document.body.innerText.replace(/[  ]/g, ' '); return { imprime: (t.match(/imprimé[^\n]*(\n[^\n]*){0,3}/g) ?? []).map((s) => s.replace(/\n/g, ' ¦ ').slice(0, 160)).slice(0, 3), stk: /\bStk\b/.test(t), unites: (t.match(/[^\n]*\?[^\n]*·[^\n]*(g|kg|pièce)[^\n]*/g) ?? []).slice(0, 3) }; });
    log(`BE-23 ${L} : ${JSON.stringify(vu)}`); log('  ' + await capture(r, 'be23b-barre')); await r.close();
  }
  // LR1-14 : Annuel « n / 9 prêtes » avant et après Confirmer (pied, par aria-label), feuille fermée
  if (fait('lr114')) for (const [L, th] of [[1280, 'cave'], [390, 'clair']]) {
    const r = await feuilleDepense(nav, 'medicament', L, th);
    log(`LR1-14 ${L} pied : ${JSON.stringify(await r.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.getClientRects().length && /Confirmer/.test(b.innerText + (b.getAttribute('aria-label') || ''))).map((b) => `${b.innerText.trim()} aria=${b.getAttribute('aria-label')}${b.disabled ? ' (inactif)' : ''} y=${Math.round(b.getBoundingClientRect().top)}`)))}`);
    for (let k = 1; k <= 2 && await dialog(r); k++) {
      const h = await r.evaluateHandle(() => [...document.querySelectorAll('button')].filter((b) => b.getClientRects().length && /^Confirmer/.test(b.innerText.trim())).sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0] ?? null).then((x) => x.asElement());
      await doigt(r, h, `Confirmer ${k}`); await dormir(2500);
      log(`  après Confirmer ${k} : dialog=${await dialog(r)} · ${(await feuille(r, 350))}`); log('  ' + await capture(r, `lr114b-confirmer${k}`));
    }
    log(`LR1-14 ${L} après : ${await annuel(r)}`); log('  ' + await capture(r, 'lr114b-apres')); await r.close();
  }
  // TE-35 : Prévoir du matériel, saisies « abc », « −5 », « -5 » par focus et clavier
  if (fait('te35')) for (const [L, th] of [[390, 'clair'], [1280, 'cave']]) {
    const p = await ouvrir(nav, '?dev-local&preview=carnets', L, th);
    await toucher(p, 'À venir', { ms: 900 }); const m = await toucher(p, 'Modifier ZZ TEST', { label: true, ms: 1200 }) || await toucher(p, 'Modifier', { ms: 1200 });
    log(`TE-35 ${L} feuille ouverte=${m && await dialog(p)} · champs : ${JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('input')].filter((e) => e.getClientRects().length).map((e) => e.getAttribute('aria-label') || e.id).slice(0, 15)))}`);
    log('  ' + await capture(p, 'te35b-feuille'));
    for (const [lab, v] of [['Livraison TTC (CHF)', 'abc'], ['Prix estimé TTC (CHF)', '−5'], ['Installation TTC (CHF)', '-5']]) {
      const ok = await taper(p, `[aria-label="${lab}"]`, v);
      const msg = ok && await p.evaluate((l) => { const e = [...document.querySelectorAll(`[aria-label="${l}"]`)].at(-1); let x = e; for (let i = 0; i < 4 && x; i++) x = x.parentElement; return `valeur=${e.value} · ${(x?.innerText ?? '').replace(/\n+/g, ' ').slice(0, 200)}`; }, lab);
      log(`TE-35 ${L} ${lab} « ${v} » : ${msg}`); if (ok) log('  ' + await capture(p, `te35b-${lab.split(' ')[0].toLowerCase()}`));
    }
    log(`  budget : ${await p.evaluate(() => (document.body.innerText.match(/Budget[^\n]*\n?[^\n]*/) ?? ['—'])[0].replace(/\n/g, ' '))}`);
    await p.close();
  }
} catch (e) { log('ERREUR ' + e.message.slice(0, 300)); } finally { await nav.close(); ecrireJournal('journal-g3'); }
