// Rejeu des lignes v2 au banc ?preview=carnets (port 5182). Usage : node banc.mjs [scenario,...] [390|1280] [clair|sombre]
import { lancer, page, toucher, taper, texte, verifier, haut, capture, captureSansBlur, log, ecrireJournal, attendre, trouver } from './outil.mjs';

const mesurer = (p, nom, fn, arg) => p.evaluate(fn, arg).then((r) => log(`mesure [${nom}] ${JSON.stringify(r)}`)).catch((e) => log(`mesure [${nom}] ERREUR ${e.message.slice(0, 80)}`));
const rectTexte = (t) => {
  const els = [...document.querySelectorAll('body *')].filter((e) => (e.innerText ?? '').replace(/[  ]/g, ' ').trim() === t && e.getClientRects().length);
  const e = els[els.length - 1]; if (!e) return null; const r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) };
};
const champTop = () => { const c = [...document.querySelectorAll('textarea')].find((e) => e.getClientRects().length); return c ? Math.round(c.getBoundingClientRect().top) : null; };
const nbCarnets = () => { const b = [...document.querySelectorAll('button,[role=tab]')].find((e) => /^Carnets\s*\d+/.test((e.innerText || '').trim())); return b ? b.innerText.replace(/\s+/g, ' ') : null; };
const retourListe = async (p) => { if (!(await toucher(p, 'Carnets', { exact: true, sel: 'button, a' }))) await toucher(p, '‹'); await attendre(800); };

const S = {
  /* PCN-52, 85, 131 : liste, coller un lien d'article de ventilation, puis un lien qui fait naître un carnet */
  lienListe: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}`, L);
    log(`compteur avant ${await p.evaluate(nbCarnets)}`);
    await taper(p, 'https://exemple.invalid/hotte-140', { attente: 4000 });
    const t = await verifier(p, `lienListe-${L}`, ['Rangé dans', 'sur '], []);
    log(`occurrences URL hotte-140 : ${(t.match(/exemple\.invalid\/hotte-140/g) ?? []).length} ; compteur après ${await p.evaluate(nbCarnets)}`);
    log(`texte lienListe-${L} : ${t.slice(0, 900).replace(/\n+/g, ' ¦ ')}`);
    await capture(p, `lienListe-${L}-${th}-a`);
    await p.close();
    const q = await page(nav, `&theme=${th}`, L);
    await taper(q, 'https://exemple.invalid/pompe-inox', { attente: 4000 });
    const t2 = await texte(q);
    log(`pompe depuis liste ${L} : compteur ${await q.evaluate(nbCarnets)} ; ${t2.slice(0, 900).replace(/\n+/g, ' ¦ ')}`);
    await capture(q, `lienListe-${L}-${th}-b-pompe`);
    await q.close();
  },
  /* PCN-54, 74, 110, 75 : article ouvert (avec et sans photo), vignette */
  article: async (nav, L, th) => {
    for (const [nom, ligne] of [['hotte', 'Hotte inox 120 cm'], ['murale', 'Hotte murale 100 cm'], ['helico', 'Extracteur mural hélicoïde'], ['v5', 'Lien sans aperçu']]) {
      const p = await page(nav, `&theme=${th}&ouvrir=ventilation`, L);
      const ok = await toucher(p, ligne, { sel: 'button, [role="button"], a' });
      if (!ok) { await p.close(); continue; }
      await haut(p);
      await mesurer(p, `article-${nom}-${L}`, () => {
        const v = document.querySelector('.cn-vignette-fiche'); const img = document.querySelector('.cn-vignette-fiche img, [class*="photo"] img');
        const r = v?.getBoundingClientRect(); const s = v?.querySelector('svg')?.getBoundingClientRect();
        return { cadre: r && [Math.round(r.width), Math.round(r.height)], svg: s && [Math.round(s.top - r.top), Math.round(s.bottom - r.top), Math.round(s.width), Math.round(s.height)], overflow: v && getComputedStyle(v).overflow, img: !!img,
          caract: [...document.querySelectorAll('[aria-label="Caractéristiques"] *')].filter((e) => !e.children.length).map((e) => e.innerText.trim()).filter(Boolean).slice(0, 24) };
      });
      log(`texte article-${nom}-${L} : ${(await texte(p)).slice(0, 700).replace(/\n+/g, ' ¦ ')}`);
      await capture(p, `article-${nom}-${L}-${th}`);
      await p.evaluate(() => { const m = document.querySelector('main') ?? document.scrollingElement; window.scrollTo(0, 400); for (const e of document.querySelectorAll('*')) if (e.scrollHeight > e.clientHeight + 50 && getComputedStyle(e).overflowY !== 'visible') e.scrollTop = 400; });
      await attendre(300);
      await capture(p, `article-${nom}-${L}-${th}-bas`);
      await p.close();
    }
  },
  /* PCN-55, 107, 75 : Comparer de la Ventilation (4 articles), colonnes, écartés en bas */
  comparer: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}&ouvrir=ventilation`, L);
    await toucher(p, 'Comparer', { sel: 'button, a, [role="button"]' });
    await haut(p);
    await mesurer(p, `comparer-${L}`, (W) => {
      const noms = ['Hotte inox', 'Hotte murale', 'Extracteur mural', 'Extracteur centrifuge'];
      const r = {};
      for (const n of noms) {
        const e = [...document.querySelectorAll('th, [role="columnheader"], .cn-comparer *')].filter((x) => !x.children.length && (x.innerText || '').startsWith(n) && x.getClientRects().length)[0];
        if (e) { const b = e.getBoundingClientRect(); r[n] = [Math.round(b.left), Math.round(b.right), Math.round(b.top), Math.round(b.bottom)]; }
      }
      return { largeur: W, noms: r };
    }, L);
    await capture(p, `comparer-${L}-${th}`);
    const t = await texte(p);
    log(`texte comparer-${L} : ${t.slice(0, 1500).replace(/\n+/g, ' ¦ ')}`);
    log(`ecartes : ${/Écartés · \d/.test(t)} ; raison : ${t.includes('brasse la buée sans la sortir')}`);
    const e = await trouver(p, 'Écartés', { sel: 'h2,h3,h4,section,div,p,span' });
    if (e) { await e.evaluate((x) => x.scrollIntoView({ block: 'center' })); await attendre(400); await capture(p, `comparer-${L}-${th}-ecartes`); }
    await p.close();
  },
  /* PCN-58 : À venir avec un carnet choisi envoyé */
  avenir: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}`, L);
    await toucher(p, 'À venir', { sel: 'button, [role="tab"]' });
    await attendre(800);
    log(`texte avenir-${L} : ${(await texte(p)).slice(0, 900).replace(/\n+/g, ' ¦ ')}`);
    await capture(p, `avenir-${L}-${th}`);
    await p.close();
  },
  /* PCN-59 (D-35), 108, 132 : pompe-inox puis pompe-magnetique, la puce proposée, le tableau sous la flottaison ? */
  d35: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}`, L);
    await taper(p, 'https://exemple.invalid/pompe-inox', { attente: 4000 });
    await capture(p, `d35-${L}-${th}-1`);
    await taper(p, 'https://exemple.invalid/pompe-magnetique', { attente: 4500 });
    await haut(p);
    await mesurer(p, `d35-2-${L}`, () => ({ tableau: (() => { const e = [...document.querySelectorAll('body *')].filter((x) => /rang · article/.test(x.innerText ?? '') && !x.children.length)[0]; return e ? Math.round(e.getBoundingClientRect().top) : null; })(), champ: (() => { const c = [...document.querySelectorAll('textarea')].find((e) => e.getClientRects().length); return c ? Math.round(c.getBoundingClientRect().top) : null; })(), hauteur: innerHeight,
      puces: [...document.querySelectorAll('button')].map((b) => b.innerText.replace(/\s+/g, ' ')).filter((s) => /Comparer sur|Ajouter/.test(s)) }));
    log(`texte d35-2-${L} : ${(await texte(p)).slice(0, 1200).replace(/\n+/g, ' ¦ ')}`);
    await capture(p, `d35-${L}-${th}-2`);
    const puce = await trouver(p, 'Comparer sur', { sel: 'button, [role="button"]' });
    if (puce) {
      const lib = await puce.evaluate((e) => e.closest('div,li,p')?.innerText.replace(/\s+/g, ' '));
      log(`puce : ${lib}`);
      const aj = await p.evaluateHandle((e) => (e.closest('div,li,p')?.querySelector('button:not(:first-child)') ?? e), puce);
      try { await aj.asElement().tap(); } catch { await aj.asElement().click(); }
      await attendre(1200);
      log(`après puce ${L} : ${(await texte(p)).slice(0, 700).replace(/\n+/g, ' ¦ ')}`);
      await capture(p, `d35-${L}-${th}-3`);
    } else log(`puce Comparer sur introuvable ${L}`);
    await p.close();
  },
  /* PCN-60, 102 : scénario de zéro, 3 phrases tapées l'une après l'autre (dans le carnet ouvert), puis la liste */
  zero: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}&zero=1`, L);
    await capture(p, `zero-${L}-${th}-0`);
    const phrases = ['frigo de garde pour 6 fûts', 'évier 2 bacs pour laver les fûts', 'hotte au-dessus de la cuve'];
    for (const [i, ph] of phrases.entries()) {
      await taper(p, ph, { attente: 3500 });
      log(`zero ${L} après « ${ph} » : ${(await texte(p)).slice(0, 500).replace(/\n+/g, ' ¦ ')}`);
      await capture(p, `zero-${L}-${th}-${i + 1}`);
    }
    await retourListe(p);
    log(`zero ${L} liste : ${await p.evaluate(nbCarnets)} ; ${(await texte(p)).slice(0, 800).replace(/\n+/g, ' ¦ ')}`);
    await capture(p, `zero-${L}-${th}-4`);
    await p.close();
  },
  /* PCN-61 : « Ventilation de la salle » depuis la liste : pendant (IA lente) puis après */
  d131: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}&ia=lent`, L);
    await taper(p, 'Ventilation de la salle', { attente: 1200 });
    log(`d131 pendant ${L} : ${(await texte(p)).slice(0, 600).replace(/\n+/g, ' ¦ ')}`);
    await captureSansBlur(p, `d131-${L}-${th}-pendant`);
    await attendre(5000);
    log(`d131 après ${L} : ${(await texte(p)).slice(0, 600).replace(/\n+/g, ' ¦ ')}`);
    await capture(p, `d131-${L}-${th}-apres`);
    if (await toucher(p, 'Y ajouter', { sel: 'button' })) { await attendre(1500); log(`d131 y-ajouter ${L} : ${(await texte(p)).slice(0, 400).replace(/\n+/g, ' ¦ ')}`); await capture(p, `d131-${L}-${th}-ajoute`); }
    await p.close();
  },
  /* PCN-62, 63 : modifier puis supprimer une note */
  notes: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}&ouvrir=ventilation`, L);
    await toucher(p, 'Note : il faudrait au moins 1 500', { label: true, sel: 'button' });
    await captureSansBlur(p, `notes-${L}-${th}-feuille`);
    await toucher(p, 'Modifier', { sel: '[role="menuitem"], button' });
    await attendre(500);
    log(`modifier ${L} : ${(await texte(p)).slice(-500).replace(/\n+/g, ' ¦ ')}`);
    await captureSansBlur(p, `notes-${L}-${th}-modifier`);
    await p.keyboard.down('Control'); await p.keyboard.press('a'); await p.keyboard.up('Control');
    await p.keyboard.type('il faudrait au moins 1 600 m³/h', { delay: 2 });
    if (!(await toucher(p, 'Enregistrer', { sel: 'button' }))) await p.keyboard.press('Enter');
    await attendre(1200);
    const t = await texte(p);
    log(`modifiée ${L} : 1600=${t.includes('1 600 m³/h')} 1500=${t.includes('au moins 1 500')} ; ${t.slice(-600).replace(/\n+/g, ' ¦ ')}`);
    await capture(p, `notes-${L}-${th}-modifiee`);
    await toucher(p, 'Note : surtout la buée', { label: true, sel: 'button' });
    await toucher(p, 'Supprimer', { sel: '[role="menuitem"], button' });
    await attendre(600);
    const t2 = await texte(p);
    log(`supprimée ${L} : buée=${t2.includes('surtout la buée')} annuler=${t2.includes('Annuler')} ; ${t2.slice(-500).replace(/\n+/g, ' ¦ ')}`);
    await capture(p, `notes-${L}-${th}-supprimee`);
    await toucher(p, 'Annuler', { sel: 'button' });
    await attendre(800);
    const t3 = await texte(p);
    log(`annulée ${L} : buée=${t3.includes('surtout la buée')} bandeau=${t3.includes('Note supprimée')}`);
    await capture(p, `notes-${L}-${th}-annulee`);
    await p.close();
  },
  /* PCN-64 : Frigo envoyé dans À venir : pastilles « lié à » */
  lie: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}&lien-retient=a-venir`, L);
    await haut(p);
    const t = await texte(p);
    log(`lie ${L} : « À venir » ×${(t.match(/À venir ·/g) ?? []).length}, « Dans À venir depuis » ×${(t.match(/Dans À venir depuis/g) ?? []).length} ; ${t.slice(0, 800).replace(/\n+/g, ' ¦ ')}`);
    await capture(p, `lie-${L}-${th}`);
    await p.close();
  },
  /* PCN-71, 75 : Choisi · pourquoi (Frigo choisi) */
  choisi: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}&ouvrir=frigo`, L);
    await capture(p, `choisi-${L}-${th}-haut`);
    const e = await trouver(p, 'Pourquoi ce choix', { sel: 'h3' });
    if (e) { await e.evaluate((x) => x.scrollIntoView({ block: 'start' })); await attendre(400); }
    await mesurer(p, `choisi-${L}-${th}`, () => {
      const s = document.querySelector('.cn-pourquoi'); if (!s) return null;
      return [...s.querySelectorAll('*')].filter((x) => { const c = getComputedStyle(x); return c.backgroundColor !== 'rgba(0, 0, 0, 0)' && x.getClientRects().length; }).slice(0, 8)
        .map((x) => ({ c: x.className.toString().slice(0, 40), bg: getComputedStyle(x).backgroundColor, r: getComputedStyle(x).borderRadius, h: Math.round(x.getBoundingClientRect().height), w: Math.round(x.getBoundingClientRect().width) }));
    });
    log(`choisi ${L} : ${(await texte(p)).slice(0, 900).replace(/\n+/g, ' ¦ ')}`);
    await capture(p, `choisi-${L}-${th}-pourquoi`);
    await p.close();
  },
  /* PCN-72 : renommer à 390 */
  renommer: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}&ouvrir=ventilation`, L);
    await toucher(p, 'Renommer', { label: true, sel: 'button' });
    await attendre(600);
    await mesurer(p, `renommer-${L}`, () => ({ champs: [...document.querySelectorAll('textarea,input')].filter((e) => e.getClientRects().length).map((e) => { const r = e.getBoundingClientRect(); return [e.value.slice(0, 40), Math.round(r.top), Math.round(r.bottom)]; }), hauteur: innerHeight, vv: visualViewport?.height }));
    await captureSansBlur(p, `renommer-${L}-${th}`);
    await p.close();
  },
  /* PCN-76, 92, 112 : notes en vrac depuis la liste */
  vrac: async (nav, L, th) => {
    const notes = {
      banc: 'Pour le bac : 2 bacs de lavage.\nPour la hotte : tient 80 °C.\nPour la pompe : 3 m³/h.',
      levure: 'Sachets de levure x2. Prochain brassage mardi. Tient 80 °C pour la hotte.',
      sol: 'résine pour le sol du local\nPour la hotte : tient 80 °C.\nacheter 2 sachets de levure'
    };
    for (const [nom, n] of Object.entries(notes)) {
      const p = await page(nav, `&theme=${th}`, L);
      const champ = await p.$('textarea');
      await champ.click();
      for (const [i, ligne] of n.split('\n').entries()) { if (i) { await p.keyboard.down('Shift'); await p.keyboard.press('Enter'); await p.keyboard.up('Shift'); } await p.keyboard.type(ligne, { delay: 2 }); }
      await attendre(300);
      await p.keyboard.press('Enter');
      await attendre(4500);
      await haut(p);
      log(`vrac-${nom} ${L} : ${await p.evaluate(nbCarnets)} ; ${(await texte(p)).slice(0, 1400).replace(/\n+/g, ' ¦ ')}`);
      await capture(p, `vrac-${nom}-${L}-${th}`);
      await p.close();
    }
  },
  /* PCN-87 : largeurs à 1280 */
  largeurs: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}`, L);
    await mesurer(p, `largeurs-${L}`, () => {
      const seg = [...document.querySelectorAll('button,[role=tab]')].find((e) => /^Carnets\s*\d+/.test((e.innerText || '').trim()))?.parentElement;
      const carte = [...document.querySelectorAll('button')].find((e) => /Ventilation de la salle/.test(e.innerText));
      const champ = document.querySelector('textarea');
      const plus = document.querySelector('[aria-label="Actions rapides"]');
      const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), Math.round(r.width)]; };
      return { segment: R(seg), carte: R(carte), champ: R(champ?.closest('form') ?? champ), plus: R(plus) };
    });
    await capture(p, `largeurs-${L}-${th}`);
    await p.close();
  },
  /* PCN-93, 123 : texte puis lien dans un carnet ouvert, pendant (IA lente) et après */
  pendant: async (nav, L, th) => {
    for (const [nom, saisie] of [['texte', 'hotte inox 140 cm, 1 900 m³/h, tient 80 °C, 2 400 CHF'], ['lien', 'https://exemple.invalid/hotte-140']]) {
      const p = await page(nav, `&theme=${th}&ouvrir=ventilation&ia=lent`, L);
      await taper(p, saisie, { attente: 1300 });
      await mesurer(p, `pendant-${nom}-${L}`, () => {
        const c = document.querySelector('[aria-label^="Arrive ici"]'); if (!c) return null;
        const r = c.getBoundingClientRect(); const enf = [...c.querySelectorAll('*')].filter((e) => e.getClientRects().length && !e.children.length);
        const bas = Math.max(...enf.map((e) => e.getBoundingClientRect().bottom));
        return { cadre: [Math.round(r.top), Math.round(r.bottom)], basContenu: Math.round(bas), vide: Math.round(r.bottom - bas), texte: c.innerText.replace(/\s+/g, ' ').slice(0, 200) };
      });
      log(`pendant-${nom} ${L} : ${(await texte(p)).slice(0, 900).replace(/\n+/g, ' ¦ ')}`);
      await captureSansBlur(p, `pendant-${nom}-${L}-${th}-a`);
      await attendre(6000);
      log(`apres-${nom} ${L} : ${(await texte(p)).slice(0, 900).replace(/\n+/g, ' ¦ ')}`);
      await capture(p, `pendant-${nom}-${L}-${th}-b`);
      await p.close();
    }
  },
  /* PCN-103 : bulle G8 au focus du champ */
  g8: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}&ouvrir=ventilation&g8=1`, L);
    const c = await p.$('textarea'); await c.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    try { await c.tap(); } catch { await c.click(); }
    await attendre(900);
    await mesurer(p, `g8-${L}`, () => { const b = [...document.querySelectorAll('body *')].find((e) => /peut trancher|trancher/.test(e.innerText ?? '') && e.children.length < 4 && e.getClientRects().length); if (!b) return null; const r = b.getBoundingClientRect(); return { texte: b.innerText, scrollW: b.scrollWidth, clientW: b.clientWidth, title: b.getAttribute('title') ?? b.closest('[title]')?.getAttribute('title'), rect: [Math.round(r.top), Math.round(r.bottom)] }; });
    await captureSansBlur(p, `g8-${L}-${th}`);
    await p.close();
  },
  /* PCN-113 : hors ligne, « acheter 2 sachets de levure » */
  horsligne: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}&hors-ligne=1`, L);
    await taper(p, 'acheter 2 sachets de levure', { attente: 3000 });
    await haut(p);
    log(`horsligne ${L} : ${(await texte(p)).slice(0, 900).replace(/\n+/g, ' ¦ ')}`);
    await capture(p, `horsligne-${L}-${th}`);
    await p.close();
  },
  /* PCN-126 : carnet Pompe ouvert, trois phrases d'autres objets */
  pompe: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}`, L);
    await taper(p, 'https://exemple.invalid/pompe-inox', { attente: 4000 });
    for (const [i, ph] of ['autre projet, sans rapport : un frigo de garde pour 20 fûts', 'tuyau silicone 8 mm, 5 m', 'résine du sol'].entries()) {
      await taper(p, ph, { attente: 4000 });
      log(`pompe ${L} après « ${ph} » : ${(await texte(p)).slice(0, 700).replace(/\n+/g, ' ¦ ')}`);
      await capture(p, `pompe-${L}-${th}-${i + 1}`);
      // revenir au carnet Pompe si on en est sorti
      const t = await texte(p);
      if (!/Pompe/i.test(t.slice(0, 300))) { await retourListe(p); await toucher(p, 'Pompe', { sel: 'button' }); await attendre(800); }
    }
    await retourListe(p);
    log(`pompe ${L} liste : ${await p.evaluate(nbCarnets)} ; ${(await texte(p)).slice(0, 1200).replace(/\n+/g, ' ¦ ')}`);
    await capture(p, `pompe-${L}-${th}-liste`);
    await toucher(p, 'Pompe', { sel: 'button' }); await attendre(800);
    log(`pompe ${L} rouvert : ${(await texte(p)).slice(0, 900).replace(/\n+/g, ' ¦ ')}`);
    await capture(p, `pompe-${L}-${th}-rouvert`);
    await p.close();
  },
  /* PCN-134, 135, 119 : la hotte à 1 200 m³/h depuis la liste et dans le carnet ; « hotte qui tient 80 °C » à 390 */
  hotte: async (nav, L, th) => {
    const p = await page(nav, `&theme=${th}`, L);
    await taper(p, 'hotte murale à 1 200 m³/h au moins', { attente: 4000 });
    log(`hotte liste ${L} : ${await p.evaluate(nbCarnets)} ; ${(await texte(p)).slice(0, 900).replace(/\n+/g, ' ¦ ')}`);
    await capture(p, `hotte-${L}-${th}-liste`);
    await p.close();
    const q = await page(nav, `&theme=${th}&ouvrir=ventilation`, L);
    await taper(q, 'hotte murale à 1 200 m³/h au moins', { attente: 4000 });
    await haut(q);
    log(`hotte carnet ${L} : ${(await texte(q)).slice(0, 900).replace(/\n+/g, ' ¦ ')}`);
    await capture(q, `hotte-${L}-${th}-carnet`);
    await q.close();
    const r = await page(nav, `&theme=${th}&zero=1`, L);
    await taper(r, 'une hotte qui tient 80 °C au-dessus de la cuve', { attente: 4000 });
    await haut(r);
    log(`hotte80 ${L} : ${(await texte(r)).slice(0, 700).replace(/\n+/g, ' ¦ ')}`);
    await capture(r, `hotte80-${L}-${th}`);
    await r.close();
  },
  /* PCN-86 : préfixe ZZ TEST sur Liste, Comparer, Choisi, Réalisés */
  prefixe: async (nav, L, th) => {
    const titres = async (p) => (await texte(p)).split('\n').filter((l) => /Ventilation de la salle|Embouteillage|Frigo de garde/.test(l)).slice(0, 6);
    const a = await page(nav, `&theme=${th}`, L); log(`prefixe liste : ${JSON.stringify(await titres(a))}`); await a.close();
    const b = await page(nav, `&theme=${th}&ouvrir=ventilation`, L); await toucher(b, 'Comparer', { sel: 'button, a' }); log(`prefixe comparer : ${JSON.stringify(await titres(b))}`); await capture(b, `prefixe-comparer-${L}-${th}`); await b.close();
    const c = await page(nav, `&theme=${th}&ouvrir=frigo`, L); log(`prefixe choisi : ${JSON.stringify(await titres(c))}`); await c.close();
    const d = await page(nav, `&theme=${th}&realise=1`, L); log(`prefixe realises : ${JSON.stringify(await titres(d))}`); await capture(d, `prefixe-realises-${L}-${th}`); await d.close();
    const e = await page(nav, `&theme=${th}`, L); await toucher(e, 'À venir', { sel: 'button,[role=tab]' }); log(`prefixe avenir : ${JSON.stringify(await titres(e))}`); await e.close();
  }
};

const [choix, larg, them] = process.argv.slice(2);
const noms = choix ? choix.split(',') : Object.keys(S);
const tailles = larg ? larg.split(',').map(Number) : [1280, 390];
const themes = them ? them.split(',') : ['clair'];
const nav = await lancer();
try {
  for (const n of noms) for (const L of tailles) for (const th of themes) {
    log(`=== ${n} ${L} ${th}`);
    try { await S[n](nav, L, th); } catch (e) { log(`ERREUR ${n} ${L} ${th} : ${e.message.slice(0, 160)}`); }
  }
} finally { await nav.close(); ecrireJournal(`journal-${(choix ?? 'tout').replace(/,/g, '+').slice(0, 60)}-${larg ?? 'tout'}-${them ?? 'clair'}`); }
