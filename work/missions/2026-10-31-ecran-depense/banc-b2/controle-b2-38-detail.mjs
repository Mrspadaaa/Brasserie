// Test en ligne 07.11, n° 38 : « Détail : 18,50 CHF / 12,50 CHF » puis « 20012,30 CHF / 12,50 CHF » : un détail au-dessus du total ne s'allumait pas (jaune discret), et sans séparateur de milliers.
// Attendu, formulaire manuel (état `difficile` → « Saisir à la main »), 390 clair et cave, 1280 : total 12,50, une ligne à 18,50 : le détail dit l'écart en mots (« dépasse le total de 6,00 CHF », rouge,
// role=status) ; à 20 000 : « 20 018,50 » avec séparateur de milliers ; détail = total : aucune alerte ; détail en dessous du total : « manque », jaune.
// Usage : node controle-b2-38-detail.mjs [<build>] [<dossier captures>]   → DETAIL OK | DETAIL ECHEC <raisons>
import { demarrer, saisir, dormir, ouvrirLigneN } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
const clic = (p, src) => p.evaluate(s => { const r = new RegExp(s, 'i'); const b = [...document.querySelectorAll('button, summary')].find(x => r.test(x.textContent.replace(/\s+/g, ' ').trim())); b?.click(); return !!b; }, src);
const detail = p => p.evaluate(() => { const e = document.querySelector('[data-dp-detail]'); const a = e?.querySelector('[data-dp-detail-ecart]'); return { texte: e?.innerText.replace(/\s+/g, ' ').trim() ?? null, ecart: a?.innerText.replace(/\s+/g, ' ').trim() ?? null, niveau: a?.dataset.dpNiveau ?? null, role: a?.getAttribute('role') ?? null, couleur: e ? getComputedStyle(e).color : null }; });
for (const [mode, theme] of [['t390', 'clair'], ['t390', 'cave'], ['pc1280', 'clair']]) {
  const p = await ouvrir('difficile', mode, theme);
  const ou = `${mode} ${theme}`;
  await clic(p, '^Saisir à la main'); await dormir(500);
  await clic(p, '^Articles, stock'); await dormir(300);
  await clic(p, 'Ajouter une ligne'); await dormir(500);
  await saisir(p, '#purchase-total', '12,50');
  await ouvrirLigneN(p, 1); await saisir(p, '[aria-label="Montant ligne 1"]', '18,50');
  const a = await detail(p); infos.push({ ou, a });
  if (!a.texte) { raisons.push(`${ou} : la ligne « Détail » est absente`); await p.close(); continue; }
  if (!a.ecart || !/dépasse le total de 6,00 CHF/.test(a.ecart)) raisons.push(`${ou} : détail 18,50 > total 12,50 : l'écart n'est pas dit en mots (« ${a.texte} »)`);
  if (a.niveau !== 'inconnu' || a.role !== 'status') raisons.push(`${ou} : l'écart n'est pas marqué rouge / role=status (niveau ${a.niveau}, role ${a.role})`);
  await cap(p, `38-ecart-${mode}-${theme}`);
  await ouvrirLigneN(p, 2); await saisir(p, '[aria-label="Montant ligne 2"]', '20000');
  const b = await detail(p);
  if (!/20\s018,50/.test(b.texte ?? '')) raisons.push(`${ou} : « ${b.texte} » : pas de séparateur de milliers (attendu 20 018,50)`);
  await saisir(p, '[aria-label="Montant ligne 2"]', '');
  await ouvrirLigneN(p, 1); await saisir(p, '[aria-label="Montant ligne 1"]', '5');
  const c = await detail(p);
  if (!c.ecart || !/manque 7,50 CHF/.test(c.ecart) || c.niveau !== 'repris') raisons.push(`${ou} : détail 5,00 < total 12,50 : « ${c.ecart} » (niveau ${c.niveau}) au lieu de « manque 7,50 CHF » jaune`);
  await ouvrirLigneN(p, 1); await saisir(p, '[aria-label="Montant ligne 1"]', '12,50');
  const d = await detail(p);
  if (d.ecart) raisons.push(`${ou} : détail = total : une alerte reste (« ${d.ecart} »)`);
  await p.close();
}
await verdict('DETAIL', infos.slice(0, 1));
