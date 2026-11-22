// Parcours réel dans l'app (?dev-local, IA simulée, aucune donnée réelle) : Stocks › Matériel › Carnets. Usage : node app.mjs [390|1280]
import { lancer, page, toucher, taper, texte, haut, capture, captureSansBlur, log, ecrireJournal, attendre, boutons } from './outil.mjs';

const larg = process.argv[2] ? process.argv[2].split(',').map(Number) : [1280, 390];
const nav = await lancer();
const etape = async (p, nom, L) => { log(`app ${nom} ${L} : ${(await texte(p)).slice(0, 700).replace(/\n+/g, ' ¦ ')}`); await capture(p, `app-${L}-${nom}`); };
try {
  for (const L of larg) {
    log(`=== app ${L}`);
    try {
      const p = await page(nav, '?dev-local', L, { racine: true });
      await attendre(2500);
      await capture(p, `app-${L}-0-accueil`);
      if (!(await toucher(p, 'Stocks', { exact: true, sel: 'button, a, [role="tab"]' }))) log('BOUTONS ' + JSON.stringify(await boutons(p)));
      await attendre(1500);
      if (!(await toucher(p, 'Matériel', { sel: 'button, a, [role="tab"]' }))) log('BOUTONS stocks ' + JSON.stringify(await boutons(p)));
      await attendre(1200);
      if (!(await toucher(p, 'Carnets', { sel: 'button, a, [role="tab"]' }))) log('BOUTONS materiel ' + JSON.stringify(await boutons(p)));
      await attendre(2500);
      await etape(p, '1-liste-vide', L);
      await taper(p, 'frigo de garde pour 6 fûts', { attente: 4000 });
      await etape(p, '2-frigo', L);
      await toucher(p, 'Carnets', { exact: true, sel: 'button, a' }); await attendre(900);
      await taper(p, 'https://exemple.invalid/pompe-inox', { attente: 4500 });
      await etape(p, '3-pompe-lien1', L);
      await taper(p, 'https://exemple.invalid/pompe-magnetique', { attente: 4500 });
      await haut(p);
      await etape(p, '4-pompe-lien2', L);
      await taper(p, 'attendre le devis du plombier', { attente: 3500 });
      await haut(p);
      await etape(p, '5-pompe-note', L);
      if (await toucher(p, 'Comparer', { sel: 'button, a' })) { await haut(p); await etape(p, '6-comparer', L); await toucher(p, 'Pompe', { sel: 'button, a' }) || await p.goBack().catch(() => {}); await attendre(800); }
      const ligne = await p.evaluateHandle(() => [...document.querySelectorAll('button')].find((b) => /^\s*1\s/.test(b.innerText) && b.getClientRects().length) ?? null);
      if (ligne.asElement()) { try { await ligne.asElement().tap(); } catch { await ligne.asElement().click(); } await attendre(900); await haut(p); await etape(p, '7-article', L); await toucher(p, 'Pompe', { sel: 'button, a' }); await attendre(800); }
      else log(`app ${L} : ligne d'article 1 introuvable ; ${JSON.stringify(await boutons(p))}`);
      if (await toucher(p, 'Note : attendre le devis', { label: true, sel: 'button' })) { await toucher(p, 'Modifier', { sel: '[role="menuitem"], button' }); await captureSansBlur(p, `app-${L}-8-modifier`); await p.keyboard.press('Escape'); await attendre(500); }
      if (await toucher(p, 'Renommer', { label: true, sel: 'button' })) { await attendre(500); await captureSansBlur(p, `app-${L}-9-renommer`); await p.keyboard.press('Escape'); await attendre(500); }
      await toucher(p, 'À venir', { sel: 'button, [role="tab"]' }); await attendre(1200);
      await etape(p, '10-avenir', L);
      await p.close();
    } catch (e) { log(`ERREUR app ${L} : ${e.message.slice(0, 200)}`); }
  }
} finally { await nav.close(); ecrireJournal(`journal-app-${larg.join('+')}`); }
