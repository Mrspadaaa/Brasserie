// Reprise v4 (port 5189) : captures manquantes seulement. v1-neuf 2 + PCN-108/132 à 390 (puce), PCN-19, PCN-62/63 à 1280, PCN-102 (lien avant).
import { lancer, page, toucher, taper, texte, haut, capture, captureSansBlur, log, ecrireJournal, attendre, PORT } from './outil5189.mjs';

const t1 = (s, n = 700) => s.slice(0, n).replace(/\n+/g, ' ¦ ');
const ligneCritere = async (p) => (await texte(p)).split('\n').filter((l) => /Critère|Ce qui compte/.test(l)).join(' / ');
const nav = await lancer();
try {
  for (const L of [390, 1280]) {
    /* v1-neuf 2, PCN-108, 132 : Pompe, 2e lien, puis la puce « Comparer sur … · Ajouter » */
    try {
      const p = await page(nav, '&theme=clair', L);
      await taper(p, 'https://exemple.invalid/pompe-inox', { attente: 4000 });
      await taper(p, 'https://exemple.invalid/pompe-magnetique', { attente: 4500 });
      await haut(p);
      const m = await p.evaluate(() => { const e = [...document.querySelectorAll('body *')].find((x) => /rang · article/.test(x.innerText ?? '') && !x.children.length); const c = [...document.querySelectorAll('textarea')].find((x) => x.getClientRects().length); return { tableau: e ? Math.round(e.getBoundingClientRect().top) : null, champ: c ? Math.round(c.getBoundingClientRect().top) : null }; });
      log(`puce-avant ${L} : ${JSON.stringify(m)} ; critère : ${await ligneCritere(p)}`);
      await capture(p, `puce-${L}-clair-avant`);
      const aj = (await p.evaluateHandle(() => [...document.querySelectorAll('button')].find((b) => (b.innerText || '').trim() === 'Ajouter' && /Comparer sur/.test(b.parentElement?.parentElement?.innerText ?? '') && b.getClientRects().length) ?? null)).asElement();
      if (aj) {
        try { await aj.tap(); } catch { await aj.click(); }
        await attendre(1500); await haut(p);
        log(`puce-apres ${L} : critère : ${await ligneCritere(p)} ; « Comparer sur » restant=${(await texte(p)).includes('Comparer sur')}`);
        await capture(p, `puce-${L}-clair-apres`);
      } else log(`puce-apres ${L} : bouton Ajouter de la puce introuvable`);
      await p.close();
    } catch (e) { log(`ERREUR puce ${L} : ${e.message.slice(0, 150)}`); }

    /* PCN-19 : ··· sur la note « il faudrait au moins 1 500 m³/h » */
    for (const aides of ['', '&aides=1']) {
      try {
        const p = await page(nav, `&theme=clair&ouvrir=ventilation${aides}`, L);
        await attendre(1500);
        const ok = await toucher(p, 'Note : il faudrait au moins 1 500', { label: true, sel: 'button' });
        await attendre(800);
        const vu = await p.evaluate(() => { const e = [...document.querySelectorAll('body *')].filter((x) => /Ressemble à un critère/.test(x.innerText ?? '') && x.getClientRects().length).pop(); if (e) e.scrollIntoView({ block: 'center' }); return e ? e.innerText.replace(/\s+/g, ' ').slice(0, 200) : null; });
        await attendre(400);
        log(`p19${aides} ${L} : menu=${ok} ; feuille=${vu}`);
        await captureSansBlur(p, `p19-${L}-clair${aides ? '-aides' : ''}`);
        await p.close();
        if (vu) break;
      } catch (e) { log(`ERREUR p19 ${L} : ${e.message.slice(0, 150)}`); }
    }

    /* PCN-102 : lien avant, puce « Coller : … » au focus du champ */
    try {
      await nav.defaultBrowserContext().overridePermissions(`http://localhost:${PORT}`, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
      const p = await page(nav, '&theme=clair', L);
      const ecrit = await p.evaluate(async () => { try { await navigator.clipboard.writeText('https://exemple.invalid/hotte-140'); return true; } catch (e) { return String(e); } });
      const champ = (await p.evaluateHandle(() => [...document.querySelectorAll('textarea, input[type="text"], input:not([type])')].filter((e) => e.getClientRects().length && !e.disabled).pop() ?? null)).asElement();
      if (champ) { try { await champ.tap(); } catch { await champ.click(); } }
      await attendre(1200);
      const t = await texte(p);
      log(`coller ${L} : presse-papier=${ecrit} ; puce=${t.includes('Coller :')}`);
      await captureSansBlur(p, `coller-${L}-clair-a`);
      if (await toucher(p, 'Coller :', { sel: 'button' , ms: 4500 })) {
        log(`coller-apres ${L} : ${t1(await texte(p), 600)}`);
        await capture(p, `coller-${L}-clair-b`);
      }
      await p.close();
    } catch (e) { log(`ERREUR coller ${L} : ${e.message.slice(0, 150)}`); }
  }

  /* PCN-62, 63 à 1280 (les captures d'avant étaient sur « Chargement… ») */
  try {
    const L = 1280;
    const p = await page(nav, '&theme=clair&ouvrir=ventilation', L);
    await attendre(2500);
    log(`notes1280 chargé : ${(await texte(p)).includes('Ventilation')}`);
    await toucher(p, 'Note : il faudrait au moins 1 500', { label: true, sel: 'button' });
    await captureSansBlur(p, `notes-${L}-clair-feuille`);
    await toucher(p, 'Modifier', { sel: '[role="menuitem"], button' });
    await attendre(600);
    await captureSansBlur(p, `notes-${L}-clair-modifier`);
    await p.keyboard.down('Control'); await p.keyboard.press('a'); await p.keyboard.up('Control');
    await p.keyboard.type('il faudrait au moins 1 600 m³/h', { delay: 2 });
    if (!(await toucher(p, 'Enregistrer', { sel: 'button' }))) await p.keyboard.press('Enter');
    await attendre(1200);
    const t = await texte(p);
    log(`modifiée ${L} : 1600=${t.includes('1 600 m³/h')} 1500=${t.includes('au moins 1 500')} bandeau=${t.includes('Note modifiée')}`);
    await capture(p, `notes-${L}-clair-modifiee`);
    await toucher(p, 'Note : surtout la buée', { label: true, sel: 'button' });
    await toucher(p, 'Supprimer', { sel: '[role="menuitem"], button' });
    await attendre(600);
    const t2 = await texte(p);
    log(`supprimée ${L} : buée=${t2.includes('surtout la buée')} bandeau=${t2.includes('Note supprimée')}`);
    await capture(p, `notes-${L}-clair-supprimee`);
    await toucher(p, 'Annuler', { sel: 'button' });
    await attendre(800);
    const t3 = await texte(p);
    log(`annulée ${L} : buée=${t3.includes('surtout la buée')} bandeau=${t3.includes('Note supprimée')}`);
    await capture(p, `notes-${L}-clair-annulee`);
    await p.close();
  } catch (e) { log(`ERREUR notes 1280 : ${e.message.slice(0, 150)}`); }
} finally { await nav.close(); ecrireJournal('journal-rejeu5189'); }
