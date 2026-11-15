// controle-annuel.mjs <port> : Annuel au banc (?dev-local&finance-demo=reel, 390, clair).
// Une pièce de matériel/travaux sans classement ne se range pas dans « Dépensé + usure » ferme :
// segment hachuré « à classer », tête en attente (pas de « CHF perdus » ferme), renvoi touchable vers le classement.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
const PORT = process.argv[2] ?? '3000';
const norm = (s) => (s ?? '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 1000, mobile: true, echelle: 1 });
const echecs = [], infos = [];
const verifier = (ok, texte) => { (ok ? infos : echecs).push((ok ? 'ok  ' : 'KO  ') + texte); };
try {
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo=reel`); await calme(page, 1500);
  await page.evaluate(() => localStorage.setItem('laffinee.theme', 'clair')); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find(e => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  await page.evaluate(() => [...document.querySelectorAll('[role=tab],button')].find(e => e.offsetParent && e.textContent.trim().startsWith('Annuel'))?.click()); await calme(page, 1200);

  const etat = await page.evaluate(() => {
    const scene = document.querySelector('.ann-scene');
    const pile = scene?.querySelectorAll('.ann-col')[1]?.querySelector('.ann-pile');
    const segs = [...(pile?.children ?? [])].map(e => ({ tag: e.tagName, classe: e.className, texte: e.textContent, hachure: /ann-hachA/.test(e.className) }));
    const entetes = [...(scene?.querySelectorAll('.ann-hc') ?? [])].map(e => e.textContent);
    const boutonsTete = [...(scene?.querySelectorAll('button') ?? [])].filter(b => b.offsetParent).map(b => ({ texte: b.textContent, aria: b.getAttribute('aria-label') }));
    return { scene: scene?.textContent ?? null, segs, entetes, boutonsTete };
  });
  if (etat.scene == null) { echecs.push('KO  scène Annuel introuvable'); throw new Error('scène'); }
  const scene = norm(etat.scene);
  infos.push('scène : ' + scene);

  // 1. Pas de perte ou de gain ferme sans marque d'attente.
  const ferme = /CHF (perdus|gagnés)/.test(scene);
  verifier(!ferme, 'la tête ne dit pas « CHF perdus / gagnés » ferme tant qu’une pièce attend son classement');
  verifier(/à classer/i.test(scene) && /résultat/i.test(scene), 'la tête dit que le résultat attend le classement (mots « résultat » et « à classer »)');

  // 2. « Local et travaux » dans un segment hachuré « à classer », pas dans un segment plein.
  const seg = etat.segs.find(s => /Local et travaux/.test(s.texte));
  verifier(!!seg, 'un segment « Local et travaux » existe dans la colonne Dépensé');
  verifier(!!seg && seg.hachure && /à classer/i.test(seg.texte) && /5 500,00/.test(norm(seg.texte)), `ce segment est hachuré, marqué « à classer », avec 5 500,00 (vu : ${seg ? norm(seg.texte) + ' / ' + seg.classe : 'rien'})`);
  verifier(!!seg && seg.tag === 'BUTTON', 'le segment « à classer » est un bouton (renvoi touchable)');

  // 3. « Dépensé + usure » ne contient plus les 5 500,00.
  const entete = norm(etat.entetes.find(e => /Dépensé/.test(e)) ?? '');
  const chiffre = Number((entete.match(/([\d ]+,\d\d)\s*$/)?.[1] ?? '').replace(/ /g, '').replace(',', '.'));
  verifier(Number.isFinite(chiffre) && chiffre > 0 && chiffre < 1000, `« Dépensé + usure » ne compte plus la pièce à classer (vu : ${entete})`);

  // 4. Le renvoi mène au classement : étape 4 (matériel et usure), la pièce y est avec son geste.
  const clic = async (sel, filtre) => page.evaluate((sel, filtre) => { const e = [...document.querySelectorAll(sel)].filter(b => b.offsetParent && new RegExp(filtre).test(b.textContent.replace(/\s+/g, ' '))); if (!e.length) return false; e[0].click(); return true; }, sel, filtre);
  const okSeg = await clic('.ann-scene .ann-pile button', 'Local et travaux');
  await calme(page, 700);
  const e4 = await page.evaluate(() => { const e = document.querySelector('.ann-etape'); return e ? { n: e.getAttribute('data-etape'), texte: e.textContent, boutons: [...e.querySelectorAll('button')].filter(b => b.offsetParent).map(b => b.textContent.trim()) } : null; });
  verifier(okSeg && e4?.n === '4', `le toucher du segment ouvre l’étape 4 (vu : ${e4?.n ?? 'aucune étape'})`);
  verifier(!!e4 && /Local et travaux/.test(e4.texte) && e4.boutons.includes('Matériel'), 'l’étape 4 montre « Local et travaux » avec le geste « Matériel »');
  verifier(!!e4 && e4.boutons.some(b => /la pièce/i.test(b)), 'l’étape 4 offre aussi d’ouvrir la pièce (la passer en charge)');
  // La puce de la tête renvoie au même endroit.
  await page.evaluate(() => [...document.querySelectorAll('.ann-back')].find(b => b.offsetParent)?.click()); await calme(page, 600);
  const okPuce = await clic('.ann-scene button', 'à classer');
  await calme(page, 700);
  const e4b = await page.evaluate(() => document.querySelector('.ann-etape')?.getAttribute('data-etape') ?? null);
  verifier(okPuce && e4b === '4', `la puce « à classer » de la tête ouvre aussi l’étape 4 (vu : ${e4b})`);
} catch (e) { echecs.push('KO  exception : ' + (e?.message ?? e)); }
await browser.close();
console.log(infos.concat(echecs).join('\n'));
console.log(echecs.length ? `ANNUEL ECHEC (${echecs.length})` : 'ANNUEL OK');
process.exit(0);
