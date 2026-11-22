// v5a suite 2 : n° 12 à 1280 à la souris réelle ; temps d'affichage du carnet ouvert à 390.
import { lancer, page, texte, capture, captureSansBlur, log, ecrireJournal, attendre, PORT } from './outil.mjs';
const nav = await lancer();
try {
  for (const th of ['clair']) {
    const p = await page(nav, `&theme=${th}`, 1280);
    await nav.defaultBrowserContext().overridePermissions(`http://localhost:${PORT}`, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
    await p.evaluate(() => navigator.clipboard.writeText('https://exemple.invalid/hotte-140'));
    const c = (await p.evaluateHandle(() => [...document.querySelectorAll('textarea, input[type="text"], input:not([type])')].filter((e) => e.getClientRects().length).pop())).asElement();
    await c.click(); await attendre(1200);
    const r = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Coller ?:/.test(x.innerText.trim()) && x.getClientRects().length); if (!b) return null; const q = b.getBoundingClientRect(); return { x: q.x + q.width / 2, y: q.y + q.height / 2 }; });
    log(`n12-1280 puce ${JSON.stringify(r)}`);
    if (r) { await p.mouse.move(r.x, r.y); await p.mouse.down(); await attendre(120); await p.mouse.up(); await attendre(2500);
      const v = await p.evaluate(() => [...document.querySelectorAll('textarea, input')].map((e) => e.value).filter(Boolean).join(' | '));
      log(`n12-1280 apres souris : champ=${v} ¦ ${(await texte(p)).split('\n').filter((l) => /va dans|exemple.invalid|Ajouter$/.test(l)).join(' / ')}`); await captureSansBlur(p, 'n12m-1280-clair-b');
      const env = (await p.evaluateHandle(() => [...document.querySelectorAll('button')].find((x) => /^Ajouter$/.test(x.innerText.trim()) && x.getClientRects().length) ?? null)).asElement();
      if (env) { await env.click(); await attendre(6000); log(`n12-1280 rangé : ${(await texte(p)).split('\n').filter((l) => /Rangé|votre|Annuler/.test(l)).join(' / ')}`); await capture(p, 'n12m-1280-clair-c-apres'); }
    }
    await p.close();
  }
  for (const L of [390, 1280]) {
    const p = await nav.newPage(); const t = L < 600;
    await p.setViewport({ width: L, height: t ? 844 : 800, deviceScaleFactor: 1, isMobile: t, hasTouch: t });
    const t0 = Date.now(); await p.goto(`http://localhost:${PORT}/?preview=carnets&theme=clair&ouvrir=ventilation`, { waitUntil: 'domcontentloaded' });
    let ok = -1; for (let i = 0; i < 80; i++) { if (await p.evaluate(() => /Hotte inox \+ extracteur/.test(document.body.innerText))) { ok = Date.now() - t0; break; } await attendre(100); }
    const t1 = Date.now(); await p.goto(`http://localhost:${PORT}/?preview=carnets&theme=clair&ouvrir=ventilation`, { waitUntil: 'networkidle0' }); const ni = Date.now() - t1;
    await attendre(900); const vu = await p.evaluate(() => /Hotte inox \+ extracteur/.test(document.body.innerText));
    log(`ventil ${L} : contenu après ${ok} ms (domcontentloaded) ; 2e chargement networkidle ${ni} ms puis +900 ms, contenu=${vu}`); await capture(p, `ventil-t-${L}`); await p.close();
  }
} finally { await nav.close(); ecrireJournal('journal-rejeu3'); }
