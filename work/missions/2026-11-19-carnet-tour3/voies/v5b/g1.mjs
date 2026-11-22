// v5b g1 : rejeu des correctifs f6a/f6b (LR1-5, v3-3, v3-4, LR3-3, LR2-3, LR1-9, v3-1, LR1-6, v3-5, LR1-7, v3-2, v3-7/v3-8). Lecture seule du code.
import { lancer, ouvrir, feuilleDepense, capture, log, toucher, ecrireJournal, dormir } from './outil.mjs';
const nav = await lancer();
const barres = (p) => p.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && getComputedStyle(e).textDecorationLine.includes('line-through') && e.getClientRects().length).map((e) => e.textContent.trim()).filter(Boolean).slice(0, 30));
const feuille = (p, n = 1800) => p.evaluate((n) => (document.querySelector('[role=dialog]')?.innerText ?? document.body.innerText).replace(/[  ]/g, ' ').replace(/\n+/g, ' ¦ ').slice(0, n), n);
const tirets = (p) => p.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => { const s = getComputedStyle(e); return e.getClientRects().length && (s.borderBottomStyle === 'dashed' || /dashed|wavy|dotted/.test(s.textDecorationStyle) && s.textDecorationLine !== 'none'); }).map((e) => { const s = getComputedStyle(e); return `${e.innerText.trim().slice(0, 30)} [bord ${s.borderBottomStyle} ${s.borderBottomColor} / déco ${s.textDecorationLine} ${s.textDecorationStyle} ${s.textDecorationColor}]`; }).slice(0, 12));
const voir = (p, t) => p.evaluate((t) => { const e = [...document.querySelectorAll('[role=dialog] *, body *')].filter((x) => x.getClientRects().length && x.children.length < 4 && (x.innerText ?? '').includes(t)).at(-1); if (e) e.scrollIntoView({ block: 'center' }); return !!e; }, t);
const pied = (p) => p.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.getClientRects().length && /lecture|Confirmer|Enregistrer/i.test(b.innerText)).map((b) => `${b.innerText.trim()}${b.disabled ? ' (inactif)' : ''}`).join(' | '));
async function saisirDernier(p, label, v) {
  const els = (await p.$$(`[aria-label="${label}"]`)); const e = els.at(-1); if (!e) { log(`  champ introuvable ${label}`); return false; }
  await e.evaluate((x) => x.scrollIntoView({ block: 'center' })); await e.click({ clickCount: 3 }); await p.keyboard.press('Backspace');
  if (v !== '') await p.keyboard.type(String(v), { delay: 5 }); await p.keyboard.press('Tab'); await dormir(500); return true;
}
const COMBOS = [[390, 'clair'], [390, 'cave'], [1280, 'cave'], [1280, 'clair']];
try {
  { const p = await ouvrir(nav, '?dev-local', 1280, 'clair'); await dormir(4000); await p.close(); log('chauffé'); }
  for (const [L, th] of COMBOS) {
    log(`\n===== ${L} ${th}`);
    // LR1-6, v3-5, LR1-5 (Sabro)
    if (!(L === 1280 && th === 'clair')) {
      const p = await feuilleDepense(nav, 'v3-lent', L, th, { attendreFinal: false });
      let avant = ''; const t0 = Date.now();
      for (let k = 0; k < 22; k++) {
        const pd = await pied(p); const fini = await p.evaluate(() => document.body.dataset.apercu === 'v3-lent');
        if (pd !== avant) { log(`v3-5 t=${((Date.now() - t0) / 1000).toFixed(0)}s pied : ${pd}`); log('  ' + await capture(p, `v35-pied-${k}`)); avant = pd; }
        if (k === 2) { log(`LR1-6 prov : ${await feuille(p, 900)}`); log(`  tirets : ${JSON.stringify(await tirets(p))}`); log('  ' + await capture(p, 'lr16-provisoire')); }
        if (fini) break; await dormir(1500);
      }
      await dormir(1000); log(`LR1-6 final pied : ${await pied(p)} ; tirets : ${JSON.stringify(await tirets(p))}`); log('  ' + await capture(p, 'lr16-final'));
      log(`LR1-5 Sabro barrés : ${JSON.stringify(await barres(p))}`); if (await voir(p, 'Sabro')) log('  ' + await capture(p, 'lr15-sabro'));
      await p.close();
    }
    for (const e of ['reel-doc14', 'reel-doc2', 'reel-doc25']) {
      const q = await feuilleDepense(nav, e, L, th);
      log(`${e} : ${await feuille(q, 1400)}`); log(`  barrés : ${JSON.stringify(await barres(q))}`); log(`  erreurs : ${JSON.stringify(q.erreurs)}`);
      log('  ' + await capture(q, e));
      if (e === 'reel-doc14') {
        log(`  v3-1 largeurs : ${JSON.stringify(await q.evaluate(() => { const d = document.querySelector('[role=dialog]') ?? document.body; return [...d.querySelectorAll('*')].filter((x) => /Premi/.test(x.innerText ?? '') && x.children.length < 6).slice(-3).map((x) => Math.round(x.getBoundingClientRect().width)); }))}`);
        const hauts = await q.evaluate(() => [...document.querySelectorAll('body *')].filter((x) => x.children.length === 0 && getComputedStyle(x).textDecorationLine.includes('line-through') && x.getClientRects().length).map((x) => `${x.textContent.trim().slice(0, 25)}:${x.getClientRects().length}l/${Math.round(x.getBoundingClientRect().height)}px`));
        log(`  v3-1 barrés (lignes/hauteur) : ${JSON.stringify(hauts)}`);
        if (await voir(q, 'Premi')) log('  ' + await capture(q, 'v31-lignes'));
      }
      if (e === 'reel-doc2') {
        if (await voir(q, 'Règlement')) log('  ' + await capture(q, 'v34-reglement'));
        log(`  v3-4 règlement : ${await q.evaluate(() => { const e = [...document.querySelectorAll('*')].filter((x) => x.children.length < 8 && /Règlement/.test(x.innerText ?? '')).at(-1); return (e?.innerText ?? '—').replace(/\n+/g, ' ¦ ').slice(0, 200); })}`);
        if (L === 390) for (let k = 1; k <= 4; k++) {
          if (!(await toucher(q, 'Voir le désaccord', { ms: 1300 }))) break;
          const ouv = await q.evaluate(() => ({ jaune: [...document.querySelectorAll('[data-dp-desaccord-ligne]')].filter((e) => e.getClientRects().length).map((e) => { const r = e.getBoundingClientRect(); return `${e.innerText.replace(/\n+/g, ' ').slice(0, 90)} @y${Math.round(r.top)}`; }), ouverts: [...document.querySelectorAll('details[open] summary')].map((s) => s.innerText.replace(/\n+/g, ' ').slice(0, 50)), focus: (document.activeElement?.getAttribute('aria-label') || document.activeElement?.innerText || '').slice(0, 60) }));
          log(`  LR1-9 toucher ${k} : ${JSON.stringify(ouv)}`); log('  ' + await capture(q, `lr19-${k}`));
        }
      }
      if (e === 'reel-doc25') {
        log(`  LR2-3 : ${await q.evaluate(() => (document.body.innerText.match(/Lectures[^\n]*\n?[^\n]*/) ?? ['—'])[0].replace(/\n/g, ' ¦ '))}`);
        log(`  LR3-3 retirées : ${await q.evaluate(() => (document.body.innerText.match(/[^\n]*retiré[^\n]*/g) ?? []).join(' || '))}`);
        const deb = await q.evaluate(() => { const h = [...document.querySelectorAll('*')].filter((x) => x.children.length < 8 && /^Rénovation/.test((x.innerText ?? '').trim())).at(-1); if (!h) return 'bande introuvable'; const r = h.getBoundingClientRect(); return [...h.querySelectorAll('*')].filter((c) => c.getClientRects().length).map((c) => { const b = c.getBoundingClientRect(); return `${c.textContent.trim().slice(0, 20)}:${Math.round(b.left)}-${Math.round(b.right)}${b.right > r.right + 0.5 ? ' DEBORDE' : ''}${c.scrollWidth > c.clientWidth + 1 ? ' coupé' : ''}`; }).concat(`cadre ${Math.round(r.left)}-${Math.round(r.right)}`).join(' ; '); });
        log(`  v3-2 bande : ${deb}`); if (await voir(q, 'Rénovation')) log('  ' + await capture(q, 'v32-renovation'));
        if (await voir(q, 'MASQUE')) log('  ' + await capture(q, 'lr33-masque'));
        if (await voir(q, 'BROSSE')) log('  ' + await capture(q, 'lr33-brosse'));
        if (await voir(q, 'Lectures')) log('  ' + await capture(q, 'lr23-bloc'));
      }
      await q.close();
    }
    // LR1-7 : medicament, ligne 1 ouverte, prix vidé, quantité 4
    if (!(L === 1280 && th === 'clair')) {
      const r = await feuilleDepense(nav, 'medicament', L, th);
      await toucher(r, 'MEFENACIDE', { ms: 900 });
      log(`LR1-7 avant : ${JSON.stringify(await r.evaluate(() => [...document.querySelectorAll('[aria-label$="ligne 1"]')].filter((e) => e.getClientRects().length && 'value' in e).map((e) => `${e.getAttribute('aria-label')}=${e.value}`)))}`);
      await saisirDernier(r, 'Prix ligne 1', ''); await saisirDernier(r, 'Quantité ligne 1', '4');
      log(`LR1-7 après : ${JSON.stringify(await r.evaluate(() => [...document.querySelectorAll('[aria-label$="ligne 1"]')].filter((e) => e.getClientRects().length && 'value' in e).map((e) => `${e.getAttribute('aria-label')}=${e.value}${e.hasAttribute('data-dp-prix-deduit') ? ' [déduit]' : ''} title=${e.title} couleur=${getComputedStyle(e).color} fond=${getComputedStyle(e).backgroundColor}`)))}`);
      log(`  marques déduit : ${JSON.stringify(await r.evaluate(() => [...document.querySelectorAll('[data-dp-prix-deduit]')].map((e) => `${e.tagName}:${(e.innerText || e.value || '').slice(0, 40)}`)))}`);
      await r.evaluate(() => document.querySelectorAll('[aria-label="Prix ligne 1"]')[document.querySelectorAll('[aria-label="Prix ligne 1"]').length - 1]?.scrollIntoView({ block: 'center' }));
      log('  ' + await capture(r, 'lr17-deduit')); await r.close();
    }
    // v3-7 / v3-8 : banc 3, toucher Gerstenflocken, « supprimer » au doigt
    if (L === 390) {
      const s = await feuilleDepense(nav, '3', L, th);
      const n0 = await s.evaluate(() => document.body.innerText.match(/Gerstenflocken/g)?.length ?? 0);
      await toucher(s, 'Gerstenflocken', { ms: 1000 }); log('  ' + await capture(s, 'v37-ouverte'));
      const cible = await s.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => x.getClientRects().length && /supprimer|Retirer la ligne/i.test((x.innerText || '') + (x.getAttribute('aria-label') || ''))); const e = b[0]; if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const dessus = document.elementFromPoint(x, y); return { x, y, txt: (e.innerText || e.getAttribute('aria-label')).trim(), atteint: dessus === e || e.contains(dessus), h: Math.round(r.height), w: Math.round(r.width), vh: innerHeight }; });
      log(`v3-7 cible : ${JSON.stringify(cible)}`);
      if (cible) { log('  ' + await capture(s, 'v37-supprimer')); await s.touchscreen.tap(cible.x, cible.y); await dormir(1000); }
      const n1 = await s.evaluate(() => document.body.innerText.match(/Gerstenflocken/g)?.length ?? 0);
      log(`v3-8 Gerstenflocken avant ${n0} après ${n1} ; ${(await feuille(s, 500))}`); log('  ' + await capture(s, 'v38-apres')); await s.close();
    }
  }
} finally { await nav.close(); ecrireJournal('journal-g1'); }
