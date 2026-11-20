// Voie v5a : rejeu des 13 problèmes de v4 sur port-carnet HEAD (f5..f5d) + ensemble du carnet. Usage : node rejeu.mjs [etats] [tailles] [themes]
import { lancer, page, toucher, trouver, taper, texte, haut, capture, captureSansBlur, log, ecrireJournal, attendre, PORT } from './outil.mjs';
const T = async (p, nom, n = 900) => log(`texte ${nom} : ${(await texte(p)).slice(0, n).replace(/\n+/g, ' ¦ ')}`);
const lignes = async (p, re) => (await texte(p)).split('\n').filter((l) => re.test(l)).map((l) => l.trim()).join(' / ');
const champ = async (p) => (await p.evaluateHandle(() => [...document.querySelectorAll('textarea')].filter((e) => e.getClientRects().length).pop() ?? null)).asElement();
const presse = async (nav, p) => {
  await nav.defaultBrowserContext().overridePermissions(`http://localhost:${PORT}`, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
  return p.evaluate(async () => { try { await navigator.clipboard.writeText('https://exemple.invalid/hotte-140'); return true; } catch (e) { return String(e); } });
};
const tap = async (el) => { try { await el.tap(); } catch { await el.click(); } };
const S = {
  /* n° 1 : autre projet tapé dans Ventilation, puis le Frigo */
  n1: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}&ouvrir=ventilation&ia=lent`, L);
    await taper(p, 'autre projet, sans rapport : un frigo de garde pour 20 fûts', { envoyer: false }); await attendre(1500);
    log(`n1-frappe ${L} ${th} : ${await lignes(p, /va dans|Ce qui compte|Note|autre projet/)}`); await captureSansBlur(p, `n1-${L}-${th}-a-frappe`);
    await p.keyboard.press('Enter'); await attendre(6000);
    log(`n1-apres ${L} ${th} : ${await lignes(p, /Rangé|Annuler|autre projet|Note/)}`); await capture(p, `n1-${L}-${th}-b-apres`);
    if (await toucher(p, 'Frigo', { sel: 'button, a' })) { await attendre(1200); await haut(p); log(`n1-frigo ${L} ${th} : ${await lignes(p, /Note|frigo de garde|Ce qui compte|autre projet/)}`); await capture(p, `n1-${L}-${th}-c-frigo`, { plein: true }); }
    await p.close();
  },
  /* n° 2 et 4 : bulle G8, page en haut, champ touché ; puis page en bas */
  g8: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}&ouvrir=ventilation&g8=1`, L); await haut(p);
    await tap(await champ(p)); await attendre(1000);
    const m = await p.evaluate(() => {
      const b = [...document.querySelectorAll('body *')].find((e) => /trancher/.test(e.innerText ?? '') && e.children.length < 4 && e.getClientRects().length);
      const h = [...document.querySelectorAll('h1, h2')].find((e) => e.getClientRects().length);
      return { bulle: b?.innerText.replace(/\s+/g, ' '), sw: b?.scrollWidth, cw: b?.clientWidth, sh: b?.scrollHeight, ch: b?.clientHeight, titre: h ? [h.innerText.slice(0, 60), Math.round(h.getBoundingClientRect().top)] : null };
    });
    log(`g8-haut ${L} ${th} : ${JSON.stringify(m)}`); await captureSansBlur(p, `g8-${L}-${th}-haut`);
    await p.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 1e6); for (const e of document.querySelectorAll('*')) if (e.scrollHeight > e.clientHeight + 20 && getComputedStyle(e).overflowY !== 'visible') e.scrollTop = 1e6; });
    await attendre(600); await tap(await champ(p)); await attendre(1000);
    await captureSansBlur(p, `g8-${L}-${th}-bas`); await p.close();
  },
  /* n° 13 bis : dans Ventilation avec bulle G8, presse-papier = lien */
  g8coller: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}&ouvrir=ventilation&g8=1`, L); await presse(nav, p);
    await haut(p); await tap(await champ(p)); await attendre(1200);
    log(`g8coller ${L} ${th} : ${await lignes(p, /Coller|trancher/)}`); await captureSansBlur(p, `g8coller-${L}-${th}`); await p.close();
  },
  /* n° 3 : liste, « Ventilation de la salle », puis Ouvrir ce carnet */
  n3: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}`, L); await taper(p, 'Ventilation de la salle', { envoyer: false }); await attendre(1500);
    log(`n3 ${L} ${th} : ${await lignes(p, /Ouvrir ce carnet|façon|Déjà un carnet|va dans/)}`); await captureSansBlur(p, `n3-${L}-${th}-a`);
    if (await toucher(p, 'Ouvrir ce carnet', { sel: 'button' })) { await attendre(1200); await T(p, `n3-ouvert-${L}`, 400); await capture(p, `n3-${L}-${th}-b-ouvert`); }
    await p.close();
  },
  /* n° 12 et 13 : liste, puce Coller, puis Ajouter */
  coller: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}`, L); const ok = await presse(nav, p);
    const c = (await champ(p)) ?? (await p.evaluateHandle(() => [...document.querySelectorAll('input[type="text"], input:not([type])')].filter((e) => e.getClientRects().length).pop() ?? null)).asElement();
    await tap(c); await attendre(1200);
    const puce = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Coller/.test(x.innerText) && x.getClientRects().length); return b ? { t: b.innerText.replace(/\s+/g, ' '), sw: b.scrollWidth, cw: b.clientWidth } : null; });
    log(`coller-a ${L} ${th} : presse=${ok} ${JSON.stringify(puce)}`); await captureSansBlur(p, `coller-${L}-${th}-a`);
    if (await toucher(p, 'Coller', { sel: 'button', ms: 2500 })) {
      log(`coller-b ${L} ${th} : ${await lignes(p, /va dans|Articles|Nom, prix|Nouveau carnet|façon|exemple/)}`); await captureSansBlur(p, `coller-${L}-${th}-b`);
      const env = (await p.evaluateHandle(() => [...document.querySelectorAll('button')].find((x) => /^(Ajouter|Ranger|Envoyer)$/.test(x.innerText.trim()) && x.getClientRects().length) ?? null)).asElement();
      if (env) { await tap(env); await attendre(5000); log(`coller-c ${L} ${th} : ${await lignes(p, /Rangé|Annuler|exemple|Nouveau/)}`); await capture(p, `coller-${L}-${th}-c-apres`); }
    }
    await p.close();
  },
  /* n° 5 : moulin créé */
  moulin: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}`, L); await taper(p, 'Moulin à malt 2 cylindres, 150 kg/h', { attente: 4500 }); await haut(p);
    await T(p, `moulin-${L}`, 600); await capture(p, `moulin-${L}-${th}`); await p.close();
  },
  /* n° 6 et 7 : Comparer Ventilation, puis défiler à droite */
  comparer: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}&ouvrir=ventilation`, L);
    if (!(await toucher(p, 'Comparer', { sel: 'button, a, [role="button"]' }))) await toucher(p, 'Comparer', { label: true });
    await haut(p); await attendre(600);
    log(`comparer ${L} ${th} : ${await lignes(p, /Ce qui compte|proposé par|classées|égalité|min\.|minimum|Compromis|moins bien/)}`);
    const cols = await p.evaluate(() => [...document.querySelectorAll('*')].filter((e) => e.scrollWidth > e.clientWidth + 4 && getComputedStyle(e).overflowX !== 'visible' && e.clientWidth > 100).map((e) => [e.className.toString().slice(0, 30), e.scrollWidth, e.clientWidth]));
    log(`comparer-defile ${L} ${th} : ${JSON.stringify(cols)}`);
    await capture(p, `comparer-${L}-${th}`); await capture(p, `comparer-${L}-${th}-plein`, { plein: true });
    if (L < 600) { await p.evaluate(() => { for (const e of document.querySelectorAll('*')) if (e.scrollWidth > e.clientWidth + 4 && getComputedStyle(e).overflowX !== 'visible' && e.clientWidth > 100) e.scrollLeft = 1e5; }); await attendre(500); await capture(p, `comparer-${L}-${th}-droite`); }
    await p.close();
  },
  /* n° 8 : Choisir carte pointillée, puis choisi */
  choisir: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}&ouvrir=ventilation`, L); await toucher(p, 'Comparer', { sel: 'button, a, [role="button"]' });
    const b = await trouver(p, 'Choisir', { sel: 'button' }); if (!b) { log('Choisir introuvable'); await p.close(); return; }
    await tap(b); await attendre(1500); log(`choisir ${L} ${th} : ${await lignes(p, /Critère|Pourquoi|Compromis|exemple/)}`); await capture(p, `choisir-${L}-${th}-a`);
    for (const t of ['Confirmer', 'Choisir celle-ci', 'Oui, choisir']) if (await toucher(p, t, { sel: 'button' })) { await attendre(1200); break; }
    await haut(p); log(`choisi ${L} ${th} : ${await lignes(p, /Critère|Pourquoi|Choisi/)}`); await capture(p, `choisir-${L}-${th}-b-choisi`, { plein: true }); await p.close();
  },
  /* n° 8 bis : Frigo choisi */
  frigo: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}&lien-retient=a-venir`, L); await haut(p);
    log(`frigo ${L} ${th} : ${await lignes(p, /Critère|À venir|Choisi/)}`); await capture(p, `frigo-${L}-${th}`, { plein: true }); await p.close();
  },
  /* n° 9 : Réalisés, Embouteillage réalisé */
  realises: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}&realise=1`, L); log(`realises ${L} ${th} : ${await lignes(p, /CHF|Payé|prévu/)}`); await capture(p, `realises-${L}-${th}`, { plein: true }); await p.close();
    const q = await page(nav, `&theme=${th}&lien-retient=realise`, L); await haut(q); log(`realise ${L} ${th} : ${await lignes(q, /Réalisé|Payé|CHF/)}`);
    const coup = await q.evaluate(() => [...document.querySelectorAll('td, [class*="nom"]')].filter((e) => e.getClientRects().length && (e.scrollWidth > e.clientWidth + 2 || e.scrollHeight > e.clientHeight + 2)).map((e) => e.innerText.slice(0, 40)).slice(0, 8));
    log(`realise-coupes ${L} ${th} : ${JSON.stringify(coup)}`); await capture(q, `realise-${L}-${th}`, { plein: true }); await q.close();
  },
  /* n° 10 et 11 : Pompe, deux liens, tableau puis Comparer */
  pompe: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}`, L);
    await taper(p, 'https://exemple.invalid/pompe-inox', { attente: 4500 }); await taper(p, 'https://exemple.invalid/pompe-magnetique', { attente: 5000 }); await haut(p);
    log(`pompe ${L} ${th} : ${await lignes(p, /moins bien|votre lien|votre phrase|Article rangé|Comparer sur|L\/min/)}`);
    await capture(p, `pompe-${L}-${th}`); await capture(p, `pompe-${L}-${th}-plein`, { plein: true });
    if (await toucher(p, 'Comparer', { sel: 'button, a, [role="button"]' })) { await haut(p); await attendre(600); log(`pompe-comparer ${L} ${th} : ${await lignes(p, /moins bien|L\/min|Ce qui compte|égalité/)}`); await capture(p, `pompe-${L}-${th}-comparer`, { plein: true }); }
    await p.close();
  },
  /* ensemble : liste, À venir, Réalisés, carnet ouvert */
  ecrans: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}`, L); await capture(p, `ens-liste-${L}-${th}`, { plein: true });
    if (await toucher(p, 'À venir', { sel: 'button, [role="tab"]' })) { await attendre(900); await capture(p, `ens-avenir-${L}-${th}`, { plein: true }); }
    if (await toucher(p, 'Réalisés', { sel: 'button, [role="tab"]' })) { await attendre(900); await capture(p, `ens-realises-${L}-${th}`, { plein: true }); }
    await p.close();
    const q = await page(nav, `&theme=${th}&ouvrir=ventilation`, L); await capture(q, `ens-ventil-${L}-${th}`, { plein: true }); await q.close();
  },
};
const [choix, larg, them] = process.argv.slice(2);
const noms = choix ? choix.split(',') : Object.keys(S);
const tailles = larg ? larg.split(',').map(Number) : [390, 1280];
const themes = them ? them.split(',') : ['clair', 'sombre'];
const nav = await lancer();
try { for (const n of noms) for (const L of tailles) for (const th of themes) { log(`=== ${n} ${L} ${th}`); try { await S[n](nav, L, th); } catch (e) { log(`ERREUR ${n} ${L} ${th} : ${e.message.slice(0, 160)}`); } } }
finally { await nav.close(); ecrireJournal(`journal-${(choix ?? 'tout').replace(/,/g, '+').slice(0, 40)}`); }
