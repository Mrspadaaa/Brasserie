// Test en ligne 07.11, n° 39 : TVA « 99999 » CHF et taux « −1 » % acceptés sans message (Référence et TVA du document).
// Attendu, formulaire manuel, 390 clair et cave : total 12,50 ; dans « Référence et TVA du document » : montant « 99999 » → marqué (aria-invalid, title « Au plus 12,5 »), non retenu, la valeur d'avant
// revient en quittant le champ ; « -1 » sur le montant comme sur le taux → marqué « Pas de valeur négative », rien retenu ; taux « 150 » → « Au plus 100 » ; un montant valable (« 0,96 ») et un taux (« 8,1 »)
// se retiennent sans marque.
// Usage : node controle-b2-39-tva.mjs [<build>] [<dossier captures>]   → TVA OK | TVA ECHEC <raisons>
import { demarrer, saisir, dormir } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
const clic = (p, src) => p.evaluate(s => { const r = new RegExp(s, 'i'); const b = [...document.querySelectorAll('button, summary')].find(x => r.test(x.textContent.replace(/\s+/g, ' ').trim())); b?.click(); return !!b; }, src);
for (const theme of ['clair', 'cave']) {
  const p = await ouvrir('difficile', 't390', theme);
  await clic(p, '^Saisir à la main'); await dormir(500);
  await saisir(p, '#purchase-total', '12,50');
  await clic(p, '^Référence et TVA'); await dormir(400);
  const lire = id => p.evaluate(i => { const e = document.querySelector(i); return { v: e.value, invalide: e.getAttribute('aria-invalid'), titre: e.title }; }, id);
  const taper = async (id, texte) => { const h = await p.$(id); await h.click({ clickCount: 3 }); await h.type(texte, { delay: 20 }); await dormir(250); };
  const cas = [['#purchase-vat', '99999', 'Au plus', ''], ['#purchase-vat', '-1', 'Pas de valeur négative', ''], ['#purchase-vat-rate', '-1', 'Pas de valeur négative', ''], ['#purchase-vat-rate', '150', 'Au plus 100', '']];
  for (const [id, texte, motif, retour] of cas) {
    await taper(id, texte);
    const pendant = await lire(id); const ou = `${theme} ${id} « ${texte} »`;
    if (pendant.invalide !== 'true') raisons.push(`${ou} : accepté sans marque (aria-invalid ${pendant.invalide})`);
    if (!pendant.titre.includes(motif)) raisons.push(`${ou} : title « ${pendant.titre} » au lieu de « ${motif}… »`);
    if (texte === '99999' || texte === '-1') await cap(p, `39-${id.slice(10)}-${texte}-${theme}`);
    await p.keyboard.press('Tab'); await dormir(350);
    const apres = await lire(id);
    if (apres.v !== retour) raisons.push(`${ou} : après avoir quitté le champ : « ${apres.v} » au lieu de « ${retour || 'vide'} »`);
    infos.push({ ou, pendant: pendant.invalide, apres: apres.v });
  }
  await taper('#purchase-vat', '0,96'); await taper('#purchase-vat-rate', '8,1'); await p.keyboard.press('Tab'); await dormir(300);
  const ok1 = await lire('#purchase-vat'), ok2 = await lire('#purchase-vat-rate');
  if (ok1.invalide || ok2.invalide || ok1.v !== '0,96' || ok2.v !== '8,1') raisons.push(`${theme} : des valeurs valables ne sont pas retenues proprement (${JSON.stringify([ok1, ok2])})`);
  await p.close();
}
await verdict('TVA', infos.slice(0, 4));
