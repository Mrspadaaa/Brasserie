// Voie v5a, suite : n° 12 (puce « Coller : »), captures manquantes, carnet ouvert à 390. Usage : PORT_BANC=5192 node rejeu2.mjs
import { lancer, page, toucher, taper, texte, haut, capture, captureSansBlur, log, ecrireJournal, attendre, PORT } from './outil.mjs';
const lignes = async (p, re) => (await texte(p)).split('\n').filter((l) => re.test(l)).map((l) => l.trim()).join(' / ');
const champ = async (p) => (await p.evaluateHandle(() => [...document.querySelectorAll('textarea, input[type="text"], input:not([type])')].filter((e) => e.getClientRects().length && !e.disabled).pop() ?? null)).asElement();
const tap = async (el) => { try { await el.tap(); } catch { await el.click(); } };
const bouton = async (p, re) => (await p.evaluateHandle((s) => [...document.querySelectorAll('button')].find((x) => new RegExp(s).test(x.innerText.replace(/[  ]/g, ' ').trim()) && x.getClientRects().length) ?? null, re)).asElement();
const frappe = async (p, txt) => { const c = await champ(p); await tap(c); await attendre(400); await c.type(txt, { delay: 15 }); };
const S = {
  n12: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}`, L);
    await nav.defaultBrowserContext().overridePermissions(`http://localhost:${PORT}`, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
    log(`presse ${await p.evaluate(async () => { try { await navigator.clipboard.writeText('https://exemple.invalid/hotte-140'); return 'ok'; } catch (e) { return String(e); } })}`);
    await tap(await champ(p)); await attendre(1200);
    const puce = await bouton(p, '^Coller ?:');
    log(`n12-a ${L} ${th} : puce=${puce ? await puce.evaluate((e) => e.innerText.replace(/\s+/g, ' ')) : 'ABSENTE'}`); await captureSansBlur(p, `n12-${L}-${th}-a`);
    if (!puce) return p.close();
    await tap(puce); await attendre(2500);
    log(`n12-b ${L} ${th} : champ=${await (await champ(p))?.evaluate((e) => e.value)} ¦ ${await lignes(p, /va dans|Nouveau carnet|Ventilation|exemple|hotte|façon|Ajouter/i)}`); await captureSansBlur(p, `n12-${L}-${th}-b`);
    const env = await bouton(p, '^(Ajouter|Ranger|Envoyer)$');
    if (env) await tap(env); else await p.keyboard.press('Enter');
    await attendre(6000);
    log(`n12-c ${L} ${th} : ${await lignes(p, /Rangé|Annuler|exemple|Nouveau|Ventilation/)}`); await capture(p, `n12-${L}-${th}-c-apres`);
    await p.close();
  },
  n9: async (nav, L, th) => {
    const q = await page(nav, `&theme=${th}&lien-retient=realise`, L); await attendre(1500); await haut(q);
    log(`n9 ${L} ${th} : ${await lignes(q, /Réalisé|Payé|CHF/)}`); await capture(q, `n9-${L}-${th}-realise`); await q.close();
  },
  n1: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}&ouvrir=ventilation&ia=lent`, L); await attendre(1500);
    await frappe(p, 'autre projet, sans rapport : un frigo de garde pour 20 fûts'); await attendre(2000);
    log(`n1-frappe ${L} ${th} : ${await lignes(p, /va dans|Ce qui compte|Note|autre projet/)}`); await captureSansBlur(p, `n1b-${L}-${th}-a-frappe`);
    await p.keyboard.press('Enter'); await attendre(6000);
    log(`n1-apres ${L} ${th} : ${await lignes(p, /Rangé|Annuler|autre projet|Note|votre message/)}`); await capture(p, `n1b-${L}-${th}-b-apres`); await p.close();
  },
  n3: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}`, L); await attendre(1000); await frappe(p, 'Ventilation de la salle'); await attendre(2000);
    log(`n3 ${L} ${th} : ${await lignes(p, /Ouvrir ce carnet|façon|Déjà un carnet|va dans|Nouveau carnet/)}`); await captureSansBlur(p, `n3b-${L}-${th}-a`);
    if (await toucher(p, 'Ouvrir ce carnet', { sel: 'button' })) { await attendre(1500); log(`n3-ouvert ${L} ${th} : ${(await texte(p)).slice(0, 200).replace(/\n+/g, ' ¦ ')}`); await capture(p, `n3b-${L}-${th}-b-ouvert`); }
    await p.close();
  },
  pompe: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}`, L);
    await taper(p, 'https://exemple.invalid/pompe-inox', { attente: 6000 });
    log(`pompe-1 ${L} ${th} : ${await lignes(p, /Rangé|Pompe|votre lien|Ajouter/)}`);
    await taper(p, 'https://exemple.invalid/pompe-magnetique', { attente: 7000 }); await haut(p);
    log(`pompe-2 ${L} ${th} : ${await lignes(p, /moins bien|votre lien|Rangé|Comparer sur|L\/min|articles?/)}`);
    await capture(p, `pompe2-${L}-${th}`);
    if (await toucher(p, 'Comparer', { sel: 'button, a, [role="button"]' })) { await haut(p); await attendre(800); log(`pompe-comparer ${L} ${th} : ${await lignes(p, /moins bien|L\/min|Ce qui compte|égalité/)}`); await capture(p, `pompe2-${L}-${th}-comparer`); }
    await p.close();
  },
  ventil: async (nav, L, th) => {
    const q = await page(nav, `&theme=${th}&ouvrir=ventilation`, L); await attendre(3000); await haut(q);
    log(`ventil ${L} ${th} : ${(await texte(q)).slice(0, 300).replace(/\n+/g, ' ¦ ')}`); await capture(q, `ens2-ventil-${L}-${th}`);
    const bas = await q.evaluate(() => { let n = 0; for (const e of document.querySelectorAll('*')) if (e.scrollHeight > e.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(e).overflowY)) { e.scrollTop = 1e6; n++; } window.scrollTo(0, 1e6); return n; });
    await attendre(600); log(`ventil-bas ${L} ${th} : conteneurs=${bas}`); await capture(q, `ens2-ventil-${L}-${th}-bas`); await q.close();
  },
  listebas: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}`, L);
    await p.evaluate(() => { for (const e of document.querySelectorAll('*')) if (e.scrollHeight > e.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(e).overflowY)) e.scrollTop = 1e6; window.scrollTo(0, 1e6); });
    await attendre(600); log(`liste-bas ${L} ${th} : ${(await texte(p)).slice(-500).replace(/\n+/g, ' ¦ ')}`); await capture(p, `ens2-liste-${L}-${th}-bas`); await p.close();
  },
};
const plan = [['n12', 390, 'clair'], ['n12', 1280, 'clair'], ['n9', 390, 'sombre'], ['n1', 390, 'clair'], ['n3', 1280, 'sombre'], ['pompe', 1280, 'clair'],
  ['ventil', 390, 'clair'], ['ventil', 390, 'sombre'], ['listebas', 390, 'clair'], ['listebas', 1280, 'sombre']];
const nav = await lancer();
try { for (const [n, L, th] of plan) { log(`=== ${n} ${L} ${th}`); try { await S[n](nav, L, th); } catch (e) { log(`ERREUR ${n} ${L} ${th} : ${e.message.slice(0, 160)}`); } } }
finally { await nav.close(); ecrireJournal('journal-rejeu2'); }
