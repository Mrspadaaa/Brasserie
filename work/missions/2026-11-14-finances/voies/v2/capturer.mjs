// node capturer.mjs <port> <point> [largeur] [theme] : captures de la voie v1 sur le banc ?dev-local&finance-demo (jeu local, « ZZ TEST » seulement).
//   point 20 : l'écriture annulée (chemin du testeur : Corriger ce paiement, puis Annuler cette écriture) n'est plus dans la liste ni la recherche ; « Écritures annulées uniquement » la montre.
//   point 21 : une prévision se supprime (Prévisions > hub « Sorties prévues » > ligne > « Supprimer » + confirmation).
//   point 33 : Plus > Période : « Tout l'historique » puis une plage de 30 jours.
// -> cap/<point>-<largeur>-<thème>-<étape>.png ; sans largeur ni thème : les quatre combinaisons.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
const PORT = process.argv[2] ?? '3000', POINT = process.argv[3] ?? '20', LARG = process.argv[4], THEME = process.argv[5];
const OUT = fileURLToPath(new URL('./cap/', import.meta.url)); mkdirSync(OUT, { recursive: true });
const clic = (page, t, racine = 'body') => page.evaluate(([t, racine]) => {
  const e = [...document.querySelectorAll(`${racine} button, ${racine} summary, ${racine} [role=tab], ${racine} [role=radio]`)].filter((e) => e.offsetParent && (e.getAttribute('aria-label') || e.textContent).replace(/\s+/g, ' ').trim().startsWith(t));
  if (!e.length) return false; e.at(-1).click(); return true;
}, [t, racine]);
const texte = (page, motif) => page.evaluate((m) => new RegExp(m, 'i').test(document.body.innerText), motif);
const boutons = (page) => page.evaluate(() => [...document.querySelectorAll('button, summary')].filter((e) => e.offsetParent).map((e) => (e.getAttribute('aria-label') || e.textContent).replace(/\s+/g, ' ').trim().slice(0, 40)).join(' | '));
const combos = [[390, true, 1100], [1280, false, 900]].filter(([l]) => !LARG || String(l) === LARG);

for (const [largeur, mobile, hauteur] of combos) for (const theme of ['clair', 'cave'].filter((t) => !THEME || t === THEME)) {
  const { browser, page } = await ouvrir({ largeur, hauteur, mobile, echelle: 1 });
  const log = (...a) => console.log(POINT, largeur, theme, ...a);
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  const photo = async (etape) => { await calme(page, 700); await page.screenshot({ path: `${OUT}${POINT}-${largeur}-${theme}-${etape}.png` }); };
  const finances = async () => { await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200); };

  if (POINT === '20') {
    await finances(); await clic(page, 'Opérations'); await calme(page, 1200);
    await clic(page, 'Apport ou prélèvement privé'); await calme(page, 900);
    await page.click('[aria-label="Montant (CHF)"]'); await page.keyboard.type('5'); await page.keyboard.press('Tab');
    await page.click('[aria-label="Motif"]'); await page.keyboard.type('ZZ TEST — Apport');
    await clic(page, 'Enregistrer l’apport'); await calme(page, 1800);
    log('apport visible', await texte(page, 'ZZ TEST — Apport'));
    await page.evaluate(() => [...document.querySelectorAll('button')].filter((e) => e.offsetParent && e.textContent.includes('ZZ TEST — Apport'))[0]?.click()); await calme(page, 900);
    // chemin du testeur : Corriger ce paiement, puis Annuler cette écriture
    await clic(page, 'Corriger ce paiement saisi par erreur'); await clic(page, 'Confirmer la correction'); await calme(page, 900);
    await clic(page, 'Corriger une erreur de saisie'); await clic(page, 'Annuler cette écriture'); await clic(page, 'Confirmer la correction'); await calme(page, 900);
    log('écriture annulée', await texte(page, 'Écriture annulée'), '| avis « Mouvement enregistré » encore là', await texte(page, 'Mouvement enregistré'));
    await clic(page, 'Fermer'); await calme(page, 900);
    log('encore dans la liste', await texte(page, 'ZZ TEST — Apport'));
    await photo('liste');
    // recherche « ZZ » (loupe d'Opérations)
    await clic(page, 'Rechercher'); await calme(page, 500);
    await page.keyboard.type('ZZ'); await calme(page, 900);
    log('encore dans la recherche', await texte(page, 'ZZ TEST — Apport'));
    await photo('recherche');
    await clic(page, 'Filtres'); await calme(page, 500); await clic(page, 'Écritures annulées uniquement'); await calme(page, 800);
    log('visible par « annulées uniquement »', await texte(page, 'ZZ TEST — Apport'));
    await photo('annulees');
  }

  if (POINT === '21') {
    await finances(); await clic(page, 'Prévisions'); await calme(page, 1500);
    const hub = async () => { await page.waitForSelector('.prv-restes', { timeout: 6000 }).catch(() => {}); const ok = await page.evaluate(() => { const e = document.querySelector('.prv-restes'); e?.click(); return !!e; }); await calme(page, 900); if (!ok) console.log('boutons', await boutons(page)); return ok; };
    log('hub ouvert', await hub());
    await clic(page, 'Ajouter une prévision'); await calme(page, 1200);
    await page.click('input[placeholder^="Loyer"]'); await page.keyboard.type('ZZ TEST — Prévision');
    await page.click('[aria-label="Montant (CHF)"]'); await page.keyboard.type('7'); await page.keyboard.press('Tab');
    await clic(page, 'Enregistrer'); await calme(page, 1800);
    log('hub rouvert', await hub());
    await photo('hub');
    const ouverte = await page.evaluate(() => { const b = [...document.querySelectorAll('.prv-liste button')].filter((e) => e.textContent.includes('ZZ TEST')); b[0]?.click(); return b.length; });
    await calme(page, 1500); log('ligne ZZ cliquée', ouverte, '| feuille « Modifier la prévision »', await texte(page, 'Modifier la prévision'));
    await photo('feuille');
    log('boutons', await boutons(page));
    await clic(page, 'Supprimer cette prévision'); await calme(page, 700);
    log('confirmation', await texte(page, 'Oui, supprimer'));
    await photo('confirmation');
    await clic(page, 'Oui, supprimer'); await calme(page, 1500);
    log('après suppression, ZZ encore là', await texte(page, 'ZZ TEST — Prévision'));
    await photo('apres');
  }

  if (POINT === '21p') {
    // la fiche d'un projet de matériel ouverte depuis son étiquette sur l'escalier de Prévisions : « Supprimer » + confirmation
    await finances(); await clic(page, 'Prévisions'); await calme(page, 1800);
    await page.waitForSelector('.prv-restes', { timeout: 6000 }).catch(() => {}); await page.evaluate(() => document.querySelector('.prv-restes')?.click()); await calme(page, 900);
    const ouvert = await page.evaluate(() => { const b = [...document.querySelectorAll('.prv-liste button')].filter((e) => /Fermenteur/i.test(e.textContent)); b[0]?.click(); return b.length; });
    await calme(page, 1200); log('étiquette projet cliquée', ouvert, '| fiche', await texte(page, 'Ouvrir le projet'));
    await photo('fiche');
    log('boutons', (await boutons(page)).slice(-300));
    await clic(page, 'Supprimer ce projet'); await calme(page, 700);
    log('confirmation', await texte(page, 'Oui, supprimer'));
    await photo('confirmation');
    await clic(page, 'Garder'); await calme(page, 500); log('Garder : fiche encore là', await texte(page, 'Ouvrir le projet'));
  }

  if (POINT === '33') {
    await page.evaluate(() => document.querySelector('[aria-label^="Plus :"]')?.click()); await calme(page, 1000);
    await clic(page, 'Tout'); await calme(page, 1000);
    log('Tout : durée en jours affichée', await texte(page, '\\d\\s*jours?\\b'), '| Tout l’historique', await texte(page, 'Tout l’historique'));
    log('frise Tout : jours dessinés', await page.evaluate(() => document.querySelectorAll('.ops-fjours > .ops-fj').length), '| poignées', await page.evaluate(() => [...document.querySelectorAll('.ops-h')].map((h) => h.getAttribute('aria-valuetext')).join(' → ')), '| axe', await page.evaluate(() => [...document.querySelectorAll('.ops-ax span')].map((s) => s.textContent).join(' ')));
    await photo('tout');
    await page.evaluate(() => {
      const f = (d) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      const au = new Date(), du = new Date(au.getTime() - 29 * 86400000);
      window.__plage = [f(du), f(au)];
    });
    const [du, au] = await page.evaluate(() => window.__plage);
    await page.click('[aria-label="Du (jj.mm)"]'); await page.keyboard.type(du);
    await page.click('[aria-label="Au (jj.mm)"]'); await page.keyboard.type(au); await page.keyboard.press('Tab'); await calme(page, 1000);
    log('plage', du, au, '| 30 jours', await texte(page, '30\\s*jours'));
    await photo('plage');
    // la pastille de l'en-tête (le bouton central) : texte entier si scrollWidth <= clientWidth (rien de rogné)
    log('pastille', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.pr-ce')].filter((e) => e.offsetParent).map((e) => ({ texte: [...e.querySelectorAll('span')].find((s) => getComputedStyle(s).display !== 'none')?.textContent, scroll: e.scrollWidth, client: e.clientWidth })))));
    await page.evaluate(() => document.querySelector('[role=dialog] [aria-label="Fermer"], button[aria-label="Fermer"]')?.click()); await calme(page, 800);
    await photo('entete');
  }
  await browser.close();
}
