// node controle-frise.mjs <port> : Opérations au banc reprend la frise des jours de s2ap2 (14.11).
// Jeu : la brasserie complète `?dev-local&finance-demo` (jamais de donnée réelle) : opérations du jour, loyer à payer le 25, « Solde atelier » en retard.
// Règle de s2ap2 vérifiée (f3, 14.11) : dans la frise et la plage, une opération à payer se place à son ÉCHÉANCE (la barre hachurée du loyer est au 25,
// « 1er → 14 » le sort en « hors plage », « 1er → 25 » le compte), une opération payée à la date de son PAIEMENT. La vue du mois range par la date de la pièce.
// 390 tactile :
//  - au repos : pilule v6a (‹ novembre ›) et AUCUNE frise ; le bouton « Déplier les jours de novembre » existe ;
//  - toucher « novembre » : la frise paraît, deux role=slider, hauteur ≤ 56 px (« plus compact ») ;
//  - la plage se pose au clavier sur la poignée Fin : la pilule la dit, les opérations payées du jour sortent, le loyer à payer le 25 reste en ligne
//    « hors plage », la légende payé · à payer · dépensé est recalculée et juste (dépensé = payé + à payer, plus petite qu'avant) ;
//  - ‹ et › décalent la plage de sa durée ; la poussée au bord (Début au-delà du 1er) fait glisser la frise sur le mois voisin ; « × mois entier » défait la plage.
// 1280 : deux champs date « Du » et « Au » visibles qui posent la plage tapée. Aucun input[type=number] dans la bande.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';

const PORT = process.argv[2] ?? '3000';
const URL = `http://localhost:${PORT}/?dev-local&finance-demo`;
const fautes = [], sortie = [];
const ok = (cond, msg) => { sortie.push(`${cond ? 'ok ' : 'KO '} ${msg}`); if (!cond) fautes.push(msg); };

async function vers(page) {
  // Horloge figée au 14.11.2026 midi : le banc date « aujourd'hui » ses opérations payées (contrôle rejouable tout jour).
  await page.evaluateOnNewDocument(() => { const T = new Date(2026, 10, 14, 12).getTime(), D = Date, d0 = D.now(); class F extends D { constructor(...a) { super(...(a.length ? a : [T + (D.now() - d0)])); } static now() { return T + (D.now() - d0); } } globalThis.Date = F; });
  await page.goto(URL); await calme(page, 1500);
  await page.evaluate(() => localStorage.setItem('laffinee.theme', 'clair')); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  await page.evaluate(() => [...document.querySelectorAll('[role=tab],button')].filter((e) => e.offsetParent && e.textContent.trim().startsWith('Opérations'))[0]?.click()); await calme(page, 1200);
}
const etat = (page) => page.evaluate(() => {
  const nombre = (t) => Number((t ?? '').replace(/[’'\s]/g, '').replace(',', '.'));
  const leg = document.querySelector('.ops-legende');
  const [paye, aPayer, depense] = leg ? [...leg.querySelectorAll('b')].map((b) => nombre(b.textContent)) : [NaN, NaN, NaN];
  return {
    pill: document.querySelector('.ops-pill')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
    plage: document.querySelector('.ops-plage-titre')?.textContent ?? null,
    frise: document.querySelectorAll('[data-testid=frise]').length,
    friseH: document.querySelector('.ops-frise')?.getBoundingClientRect().height ?? 0,
    sliders: [...document.querySelectorAll('[role=slider]')].map((s) => s.getAttribute('aria-valuetext')),
    jours: document.querySelector('.ops-fjours')?.getAttribute('aria-label') ?? '',
    lignes: [...document.querySelectorAll('.ops-row .ops-nom')].map((e) => e.textContent.trim()),
    hors: [...document.querySelectorAll('.ops-hors')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()),
    paye, aPayer, depense, vide: !!document.querySelector('.ops-vide'),
    nombres: document.querySelectorAll('.ops-bande input[type=number], input[type=number]').length,
    deplier: !!document.querySelector('button[aria-label^="Déplier les jours de"]'),
    icone: !!document.querySelector('.ops-pill .ops-ico-frise'),
  };
});
const touches = async (page, selecteur, touche, n) => { await page.focus(selecteur); for (let i = 0; i < n; i++) await page.keyboard.press(touche); await calme(page, 500); };

async function mobile() {
  const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 2300, mobile: true, echelle: 1 });
  try {
    await vers(page);
    const repos = await etat(page);
    ok(repos.pill.includes('novembre') && repos.deplier && repos.icone, `repos : pilule ‹ novembre › avec l'icône frise (${repos.pill})`);
    ok(repos.frise === 0, `repos : aucune frise (${repos.frise})`);
    await page.click('button[aria-label^="Déplier les jours"]'); await calme(page, 600);
    const ouverte = await etat(page);
    ok(ouverte.frise === 1 && ouverte.sliders.length === 2, `frise dépliée : 1 frise, ${ouverte.sliders.length} poignées role=slider`);
    ok(ouverte.friseH > 0 && ouverte.friseH <= 56, `frise dépliée compacte : ${ouverte.friseH.toFixed(1)} px (≤ 56)`);
    ok(/^1er nov/.test(ouverte.sliders[0] ?? '') && /^30 nov/.test(ouverte.sliders[1] ?? ''), `poignées au mois entier (${ouverte.sliders.join(' → ')})`);
    // RÈGLE DE s2ap2 (test d'écran 14.11, point 2) : une opération À PAYER se place à son ÉCHÉANCE, une opération PAYÉE à la date de son PAIEMENT.
    // Au banc, tout est payé le 14 (aujourd'hui) et le loyer (daté du 14) est à payer le 25 : sa barre hachurée est au 25, pas au 14.
    const barres = await page.evaluate(() => [...document.querySelectorAll('.ops-fjours .ops-fj')].map((c) => ({ hach: !!c.querySelector('.ops-hach'), h: c.querySelector('.ops-bk')?.getBoundingClientRect().height ?? 0 })));
    ok(barres[24]?.hach === true && barres.every((b, i) => i === 24 || !b.hach), `frise : la barre hachurée du loyer à payer est au 25 nov., nulle part ailleurs (jour(s) hachuré(s) : ${barres.map((b, i) => (b.hach ? i + 1 : 0)).filter(Boolean).join(', ') || 'aucun'})`);
    ok((barres[13]?.h ?? 0) > 0, `frise : les opérations payées sont à leur date de paiement, le 14 nov. (barre de ${barres[13]?.h ?? 0} px)`);
    // plage posée au clavier : Fin 30 → 14 nov. (2 × Page−7, 2 × flèche gauche) : les opérations payées le 14 restent, le loyer à payer le 25 sort
    await touches(page, '[role=slider][aria-label=Fin]', 'PageDown', 2); await touches(page, '[role=slider][aria-label=Fin]', 'ArrowLeft', 2);
    const q = await etat(page);
    ok(q.plage === '1er → 14 nov.', `la pilule dit la plage (« ${q.plage} »)`);
    ok(q.lignes.length === repos.lignes.length - 1 && !q.lignes.some((l) => /Loyer/.test(l)) && q.hors.some((h) => /Loyer/.test(h) && /à payer 25 nov/.test(h)),
      `1er → 14 nov. : le loyer à payer le 25 sort en ligne « hors plage » (${q.lignes.length} lignes sur ${repos.lignes.length}, hors : ${q.hors.join(' | ')})`);
    ok(Number.isFinite(q.depense) && Math.abs(q.paye + q.aPayer - q.depense) < 0.011 && q.aPayer === 0 && Math.abs(q.depense - (repos.depense - 400)) < 0.011,
      `légende recalculée : payé ${q.paye} + à payer ${q.aPayer} = dépensé ${q.depense} (le mois : ${repos.depense}, moins le loyer 400,00)`);
    // point 4 : à 1er → 14, la poignée Fin borde la seule barre du jour : son fond laisse voir la barre (jamais un disque plein par-dessus)
    const jour14 = await page.evaluate(() => {
      const b = document.querySelectorAll('.ops-fjours .ops-fj')[13]?.querySelector('.ops-bk')?.getBoundingClientRect();
      const g = document.querySelector('[role=slider][aria-label=Fin] .ops-gp'), fond = g ? getComputedStyle(g).backgroundColor : '';
      const alpha = /rgba?\(([^)]+)\)/.exec(fond)?.[1].split(/[ ,/]+/).filter(Boolean)[3];
      return { barre: !!b && b.height > 0, alpha: alpha === undefined ? 1 : Number(alpha) };
    });
    ok(jour14.barre && jour14.alpha < 0.5, `la barre du 14 reste visible sous la poignée Fin (fond de la poignée : opacité ${jour14.alpha})`);
    // Fin → 24 : le loyer reste « hors plage » ; Fin → 25 : il entre (en ligne, à payer 400,00)
    await touches(page, '[role=slider][aria-label=Fin]', 'PageUp', 1); await touches(page, '[role=slider][aria-label=Fin]', 'ArrowRight', 3);
    const v24 = await etat(page);
    ok(v24.plage === '1er → 24 nov.' && v24.hors.some((h) => /Loyer/.test(h)) && v24.aPayer === 0, `1er → 24 nov. : le loyer reste hors plage, à payer ${v24.aPayer} (« ${v24.plage} »)`);
    await touches(page, '[role=slider][aria-label=Fin]', 'ArrowRight', 1);
    const v25 = await etat(page);
    ok(v25.plage === '1er → 25 nov.' && v25.lignes.some((l) => /Loyer/.test(l)) && !v25.hors.some((h) => /Loyer/.test(h)) && Math.abs(v25.aPayer - 400) < 0.011 && Math.abs(v25.depense - repos.depense) < 0.011,
      `1er → 25 nov. : le loyer entre en ligne, à payer ${v25.aPayer}, dépensé ${v25.depense} (le mois : ${repos.depense})`);
    await touches(page, '[role=slider][aria-label=Fin]', 'PageDown', 1); await touches(page, '[role=slider][aria-label=Fin]', 'ArrowLeft', 4);
    const q14 = await etat(page);
    ok(q14.plage === '1er → 14 nov.', `retour à 1er → 14 nov. (« ${q14.plage} »)`);
    // une plage sans opération saisie : « ni vente ni dépense », jamais un 0 inventé
    await touches(page, '[role=slider][aria-label=Fin]', 'ArrowLeft', 1);
    const p = await etat(page);
    ok(p.plage === '1er → 13 nov.' && !p.lignes.some((l) => /Électricité|Joints|Nettoyant|Malt/.test(l)) && p.lignes.some((l) => /Solde/.test(l)), `1er → 13 nov. : les opérations du 14 sortent, le solde en retard reste (${p.lignes.join(' | ')})`);
    ok(p.hors.some((h) => /Loyer/.test(h) && /hors plage/.test(h) && /25 nov/.test(h)) && !p.lignes.some((l) => /Loyer/.test(l)), `le loyer à payer le 25 reste en ligne « hors plage » (à payer 25 nov.), hors des lignes (${p.hors.join(' | ')})`);
    ok(!Number.isFinite(p.depense) && p.vide, `sans opération dans la plage : « ni vente ni dépense », pas de légende à 0 (vide ${p.vide})`);
    ok(p.nombres === 0, `aucun input[type=number] (${p.nombres})`);
    // ‹ › : la plage glisse de sa durée (13 jours)
    await page.click('button[aria-label="13 jours plus tôt"]'); await calme(page, 500);
    const g = await etat(page);
    ok(/^19 oct/.test(g.sliders[0] ?? '') && /^31 oct/.test(g.sliders[1] ?? ''), `‹ glisse de 13 jours (${g.sliders.join(' → ')})`);
    await page.click('button[aria-label="13 jours plus tard"]'); await calme(page, 500);
    const r = await etat(page);
    ok(/^1er nov/.test(r.sliders[0] ?? '') && /^13 nov/.test(r.sliders[1] ?? ''), `› la ramène (${r.sliders.join(' → ')})`);
    // à cheval : Début poussé au-delà du 1er, la frise glisse sur le mois voisin
    await touches(page, '[role=slider][aria-label=Début]', 'ArrowLeft', 3);
    const c = await etat(page);
    ok(/^29 oct/.test(c.sliders[0] ?? '') && c.plage?.startsWith('29 oct.') && c.frise === 1 && /oct\./.test(c.jours), `à cheval : plage « ${c.plage} », frise « ${c.jours} »`);
    // × mois entier
    await page.click('button[aria-label="Revenir au mois entier"]'); await calme(page, 600);
    const m = await etat(page);
    ok(m.plage === null && m.pill.includes('novembre') && m.depense === repos.depense, `« × mois entier » : retour à novembre (${m.pill}, dépensé ${m.depense})`);
    ok(journal.erreurs.length === 0, `aucune erreur console (${journal.erreurs.slice(0, 2).join(' | ')})`);
  } finally { await browser.close(); }
}

async function ordinateur() {
  const { browser, page, journal } = await ouvrir({ largeur: 1280, hauteur: 1500, mobile: false, echelle: 1 });
  try {
    await vers(page);
    const vis = await page.evaluate(() => ['Du', 'Au'].map((n) => { const e = document.querySelector(`input[type=date][aria-label=${n}]`); return !!e && e.offsetParent !== null && e.getBoundingClientRect().width > 40; }));
    ok(vis[0] && vis[1], `1280 : deux champs date « Du » et « Au » visibles (${vis.join(', ')})`);
    const pose = (nom, valeur) => page.evaluate((nom, valeur) => {
      const e = document.querySelector(`input[type=date][aria-label=${nom}]`);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, valeur); e.dispatchEvent(new Event('input', { bubbles: true }));
    }, nom, valeur);
    await pose('Du', '2026-11-03'); await calme(page, 500); await pose('Au', '2026-11-10'); await calme(page, 600);
    const p = await etat(page);
    ok(p.plage === '3 → 10 nov.' && /^3 nov/.test(p.sliders[0] ?? '') && /^10 nov/.test(p.sliders[1] ?? ''), `les champs posent la plage tapée (« ${p.plage} », ${p.sliders.join(' → ')})`);
    const champs = await page.evaluate(() => ['Du', 'Au'].map((n) => document.querySelector(`input[type=date][aria-label=${n}]`).value));
    ok(champs[0] === '2026-11-03' && champs[1] === '2026-11-10', `les champs montrent la plage (${champs.join(' → ')})`);
    ok(p.lignes.length === 0 || !p.lignes.some((l) => /Électricité/.test(l)), `la liste suit la plage tapée (${p.lignes.length} lignes)`);
    await pose('Du', '2026-10-05'); await calme(page, 500); await pose('Au', '2026-10-05'); await calme(page, 600);
    const o = await etat(page);
    ok(o.plage === '5 oct.' && o.lignes.some((l) => /Petits achats/.test(l)) && o.hors.some((h) => /Loyer/.test(h)), `5 oct. seul : les Petits achats du 5, le loyer en « hors plage » (« ${o.plage} », ${o.lignes.join(' | ')}, ${o.hors.join(' | ')})`);
    ok(Number.isFinite(o.depense) && o.depense > 0 && o.depense < 100 && Math.abs(o.paye + o.aPayer - o.depense) < 0.011 && o.aPayer === 0, `légende de la plage recalculée : payé ${o.paye} + à payer ${o.aPayer} = dépensé ${o.depense} (le loyer hors plage n'y est pas)`);
    ok(p.nombres === 0, `aucun input[type=number] à 1280 (${p.nombres})`);
    ok(journal.erreurs.length === 0, `aucune erreur console à 1280 (${journal.erreurs.slice(0, 2).join(' | ')})`);
  } finally { await browser.close(); }
}

for (const [nom, f] of [['390', mobile], ['1280', ordinateur]]) {
  try { await f(); } catch (e) { ok(false, `${nom} : le parcours s'arrête (${String(e.message).split('\n')[0].slice(0, 140)})`); }
}
console.log(sortie.join('\n'));
console.log(fautes.length ? `FRISE ECHEC\n${fautes.map((f) => '  - ' + f).join('\n')}` : 'FRISE OK');
process.exit(fautes.length ? 1 : 0);
