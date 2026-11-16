// node capturer-ecritures.mjs <port> : points 19 (apport annulable) et 20 (retirer une écriture payée), sur le banc ?dev-local&finance-demo (jeu local, « ZZ TEST » seulement).
// -> cap/apport-<largeur>-<thème>-<étape>.png  (a1 fiche, a2 correction du paiement, a3 annulation, a4 écriture annulée)
//    cap/retrait-<largeur>-<thème>-<étape>.png (r1 confirmation « Retirer », r2 fiche annulée, r3 liste sans l'écriture, r4 « Écritures annulées uniquement »)
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
const PORT = process.argv[2] ?? '3000';
const OUT = fileURLToPath(new URL('./cap/', import.meta.url)); mkdirSync(OUT, { recursive: true });
const clic = (page, t, racine = 'body') => page.evaluate(([t, racine]) => {
  const e = [...document.querySelectorAll(`${racine} button, ${racine} summary, ${racine} [role=tab], ${racine} [role=radio]`)].filter((e) => e.offsetParent && (e.getAttribute('aria-label') || e.textContent).replace(/\s+/g, ' ').trim().startsWith(t));
  if (!e.length) return false; e.at(-1).click(); return true;
}, [t, racine]);
const texte = (page, motif) => page.evaluate((m) => new RegExp(m, 'i').test(document.body.innerText), motif);

for (const [largeur, mobile, hauteur] of [[390, true, 1100], [1280, false, 900]]) for (const theme of ['clair', 'cave']) {
  const { browser, page } = await ouvrir({ largeur, hauteur, mobile, echelle: 1 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  await clic(page, 'Opérations'); await calme(page, 1200);
  const photo = async (point, etape) => { await calme(page, 700); await page.screenshot({ path: `${OUT}${point}-${largeur}-${theme}-${etape}.png` }); };
  /** Un apport de 5,00 « ZZ TEST — <nom> » écrit comme l'app (feuille de l'apport), puis sa fiche ouverte depuis la liste. */
  const apport = async (nom) => {
    await clic(page, 'Apport ou prélèvement privé'); await calme(page, 900);
    await page.click('[aria-label="Montant (CHF)"]'); await page.keyboard.type('5'); await page.keyboard.press('Tab');
    await page.click('[aria-label="Motif"]'); await page.keyboard.type(`ZZ TEST — ${nom}`);
    await clic(page, 'Enregistrer l’apport'); await calme(page, 1800);
    const ouverte = await page.evaluate((n) => {
      const b = [...document.querySelectorAll('button')].filter((e) => e.offsetParent && e.textContent.includes(`ZZ TEST — ${n}`));
      if (!b.length) return false; b[0].click(); return true;
    }, nom);
    await calme(page, 900); return ouverte;
  };
  // --- 19 : l'apport se corrige puis s'annule
  const o1 = await apport('Apport');
  console.log(largeur, theme, 'fiche apport ouverte', o1, 'bouton Corriger', await texte(page, 'Corriger ce paiement saisi par erreur'));
  await photo('apport', 'a1');
  await clic(page, 'Corriger ce paiement saisi par erreur'); await photo('apport', 'a2');
  await clic(page, 'Confirmer la correction'); await calme(page, 900);
  await clic(page, 'Corriger une erreur de saisie'); await clic(page, 'Annuler cette écriture'); await photo('apport', 'a3');
  await clic(page, 'Confirmer la correction'); await calme(page, 900); await photo('apport', 'a4');
  console.log(largeur, theme, 'apport annulé', await texte(page, 'Écriture annulée'));
  await clic(page, 'Fermer'); await calme(page, 800);
  // --- 20 : un second apport se retire en un geste
  const o2 = await apport('Apport retiré');
  await clic(page, 'Corriger une erreur de saisie'); await clic(page, 'Retirer cette écriture'); await photo('retrait', 'r1');
  console.log(largeur, theme, 'fiche 2 ouverte', o2, 'phrase suppression', await texte(page, 'ne se supprime jamais'));
  await clic(page, 'Confirmer le retrait'); await calme(page, 1200); await photo('retrait', 'r2');
  console.log(largeur, theme, 'retrait fait', await texte(page, 'Écriture annulée'));
  await clic(page, 'Fermer'); await calme(page, 900);
  console.log(largeur, theme, 'écriture encore dans la liste', await texte(page, 'ZZ TEST — Apport retiré'));
  await photo('retrait', 'r3');
  await clic(page, 'Filtres'); await calme(page, 500); await clic(page, 'Écritures annulées uniquement'); await calme(page, 800); await photo('retrait', 'r4');
  console.log(largeur, theme, 'visible par « annulées uniquement »', await texte(page, 'ZZ TEST — Apport retiré'));
  await browser.close();
}
