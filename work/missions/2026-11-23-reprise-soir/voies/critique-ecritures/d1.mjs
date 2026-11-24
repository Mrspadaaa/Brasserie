import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
const champs = () => page.evaluate(() => [...document.querySelectorAll('input,textarea,select,[role=slider],[role=switch],[role=checkbox],[contenteditable=true]')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0; }).map((e) => { const r = e.getBoundingClientRect(); return `${e.tagName}/${e.type || e.getAttribute('role')} «${e.getAttribute('aria-label') || e.placeholder || e.name || ''}» val=${e.value ?? e.getAttribute('aria-checked')} @${Math.round(r.left)},${Math.round(r.top)}`; }));
const sortes = [['Achat', 0], ['Loyer', 0], ['Abonnement', 0], ['Salaire', 0], ['Impôts', 0], ['Pour moi', 0], ['Autre', 0], ['Vente', 0], ['Apport', 0], ['Autre', 1], ['Remboursement', 0]];
let i = 0;
for (const [s, k] of sortes) {
  i++;
  // choisir la k-ième tuile de ce nom dans la feuille
  const r = await page.evaluate((s, k) => { const els = [...document.querySelectorAll('button')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.top > 60 && (b.textContent || '').trim().startsWith(s) && !/Plus : /.test(b.getAttribute('aria-label') || ''); }); const e = els[k]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, s, k);
  if (!r) { log('pas de tuile', s, k); continue; }
  await toucher(cdp, r.x, r.y); await sleep(1200);
  const n = `D1-${String(i).padStart(2, '0')}-${s.replace(/ /g, '')}${k}`;
  await photo(page, n);
  log(n, 'boutons', (await o.b()).filter((x) => !/@\d+,(3|6|41|80|142|2\d\d|[3-8]\d\d) /.test('') ).filter((x) => !/(Synthèse|Opérations|Prévisions|Annuel|Période|Rechercher|tableau de bord|Nettoyage|Brassage|Autres frais|Matériel 5|Pourquoi|Revoir|Solde et|Confirmer les|Vérifier les|Date à corriger|paiements historiques|^Bord|^Finances|^Calendrier|^Brassins|^Stocks|^Clients|^sept|^oct|^nov|^tout|Autre période|Plus : )/.test(x)));
  log(n, 'champs', await champs());
  await o.tap('changer', 'button'); await sleep(900);
}
lacher();
