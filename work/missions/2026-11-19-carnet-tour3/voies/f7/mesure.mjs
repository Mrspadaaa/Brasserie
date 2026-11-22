// Voie f7 : mesures des rangées du champ (n° 1 et 3) et du bouton +. Usage : node mesure.mjs
import { lancer, page, taper, attendre, PORT } from './outil.mjs';
const R = (r) => r && [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)];
const mes = (p) => p.evaluate(() => {
  const R = (r) => r && [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)];
  const z = document.querySelector('.cn-champ-zone');
  const fab = [...document.querySelectorAll('button, a')].filter((e) => e.getClientRects().length && getComputedStyle(e).position === 'fixed' || (e.closest('[style*="fixed"], .fixed'))).map((e) => [e.getAttribute('aria-label') ?? e.innerText.slice(0, 12), R(e.getBoundingClientRect())]).slice(0, 4);
  return { zone: R(z?.getBoundingClientRect()), form: R(z?.querySelector('form')?.getBoundingClientRect()),
    rangs: [...(z?.children ?? [])].filter((e) => e.tagName !== 'FORM').map((e) => ({ c: e.className, r: R(e.getBoundingClientRect()), sw: e.scrollWidth, cw: e.clientWidth, enf: [...e.children].map((x) => [x.innerText?.slice(0, 30), R(x.getBoundingClientRect())]) })), fab };
});
const nav = await lancer();
try {
  let p = await page(nav, '&theme=clair&ouvrir=ventilation&ia=lent', 390);
  await taper(p, 'autre projet, sans rapport : un frigo de garde pour 20 fûts', { envoyer: false }); await attendre(1500);
  console.log('n1', JSON.stringify(await mes(p))); await p.close();
  p = await page(nav, '&theme=clair&ouvrir=ventilation&g8=1', 390);
  await nav.defaultBrowserContext().overridePermissions(`http://localhost:${PORT}`, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
  await p.evaluate(async () => navigator.clipboard.writeText('https://exemple.invalid/hotte-140'));
  const t = await p.evaluateHandle(() => [...document.querySelectorAll('textarea')].filter((e) => e.getClientRects().length).pop());
  await t.asElement().tap(); await attendre(1200);
  console.log('g8coller', JSON.stringify(await mes(p))); await p.close();
} finally { await nav.close(); }
