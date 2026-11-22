// Chasse Carnet, correctifs D417, CRN-LISTE et V4 (21.11). Chaque étape est rouge sur en-ligne/2026-11-21-tour8 et verte sur l'arbre :
//   node scripts/parcours/carnet.mjs <captures> --seulement v4 [--ref en-ligne/2026-11-21-tour8]
// D417 : depuis la liste, aucune fiche provisoire : « L'IA range… » sur la liste, puis la fiche de destination s'ouvre seule, une fois.
// CRN-LISTE : à 390×844, 8 carnets au moins au premier écran, « Coller un lien » une fois au plus, un filtre ou une recherche, aucun
// trou de plus de 24 px sous le champ, le + volant ne double pas le champ.
// V4 : fiche sans ligne vide (« rien encore », « aucune »), Quand sur une rangée, 3 tailles de texte au plus, cibles de 24 px au moins.
import { TITRE_CHAMBRE } from './_chambre.mjs';

const TITRE_VENTILATION = 'ZZ TEST — Ventilation';

export default async function (c) {
  const theme = async (nom) => { await c.toucher('Plus : saisie'); await c.toucher(nom, { exact: true }); await c.sleep(500); };
  const listeAtelier = async () => { await c.demarrer(); await c.versAtelier(); await c.attendreListe(); };

  /* ---------- D417 ---------- */
  await c.etape('V4-D417-creation-depuis-liste', async () => {
    await c.ouvrirPage(390, 844, true);
    await listeAtelier();
    /* Une phrase que NI la fixture NI une étape précédente (prix-plan-creation écrit « réfractomètre… », et la base persiste d'une étape à
       l'autre) ne rattache à un carnet existant : sinon le geste ouvre ce carnet aussitôt, sans création ni attente de l'IA. */
    await c.focaliserChamp(); await c.taper('ZZ TEST — pH-mètre de poche pour contrôler le moût');
    /* Un observateur de page note chaque changement de vue et de « L'IA range… » avec son instant : la lecture ne dépend plus de la
       vitesse d'un sondage (l'IA simulée répond en 600 ms). */
    await c.p.evaluate(() => {
      window.__d417 = [];
      const t0 = performance.now();
      const noter = () => {
        const r = document.querySelector('[data-carnets]');
        const e = [Math.round(performance.now() - t0), r?.getAttribute('data-vue') ?? null, /L.IA range/.test(r?.innerText ?? '')];
        const d = window.__d417[window.__d417.length - 1];
        if (!d || d[1] !== e[1] || d[2] !== e[2]) window.__d417.push(e);
      };
      new MutationObserver(noter).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
      noter();
    });
    await c.p.keyboard.press('Enter');
    await c.sleep(300); await c.cap('D417a-ia-range');
    await c.sleep(2200);
    const trace = await c.p.evaluate(() => window.__d417);
    const suite = trace.map((t) => t[1]).filter((v, i, l) => v !== l[i - 1]);
    const rangeVu = trace.some((t) => t[1] === 'liste' && t[2]);
    const rangeAvantOuverture = rangeVu && trace.findIndex((t) => t[1] === 'carnet') > trace.findIndex((t) => t[1] === 'liste' && t[2]);
    await c.cap('D417b-destination');
    console.log(`  D417 : vues ${suite.join(' → ')} ; « L'IA range… » sur la liste : ${rangeVu} ; trace ${JSON.stringify(trace)}`);
    if (suite[0] !== 'liste' || !rangeVu || !rangeAvantOuverture) throw new Error(`D417 : la liste doit d'abord montrer « L'IA range… » (vues ${suite.join(' → ')})`);
    if (suite.length !== 2 || suite[1] !== 'carnet') throw new Error(`D417 : la fiche de destination doit s'ouvrir seule, une fois (vues ${suite.join(' → ')})`);
  });

  /* ---------- CRN-LISTE ---------- */
  const mesureListe = () => c.p.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const zone = document.querySelector('.cn-champ-zone');
    const zr = zone?.getBoundingClientRect();
    const barre = [...document.querySelectorAll('nav')].filter(vis).map((n) => n.getBoundingClientRect()).filter((r) => r.top > innerHeight / 2).sort((a, b) => a.top - b.top)[0];
    const bas = barre ? barre.top : innerHeight;
    const lignes = [...document.querySelectorAll('.cn-liste .cn-carnet')].filter(vis).filter((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= (zr ? zr.top : bas) + 1; });
    const coller = [...document.querySelectorAll('button')].filter(vis).filter((b) => /Coller un lien/.test(b.innerText)).length;
    const filtre = !!document.querySelector('.cn-liste [role=search], .cn-liste input[type=search], .cn-liste [data-filtre]');
    const plus = [...document.querySelectorAll('.floating-actions button')].filter(vis).map((b) => `${b.getAttribute('aria-label') ?? ''} ${b.title ?? ''} ${b.innerText}`).join(' | ');
    const hauteurs = [...document.querySelectorAll('.cn-liste .cn-carnet')].filter(vis).slice(0, 6).map((e) => Math.round(e.getBoundingClientRect().height));
    return { lignes: lignes.length, coller, filtre, trou: zr ? Math.round(bas - zr.bottom) : null, plus, hauteurs };
  });
  await c.etape('V4-CRN-LISTE-390', async () => {
    await c.ouvrirPage(390, 844, true);
    await listeAtelier();
    const m = await mesureListe();
    await c.cap('LISTE-390');
    console.log(`  CRN-LISTE : ${m.lignes} carnets visibles, hauteurs ${m.hauteurs.join('/')}, « Coller un lien » ×${m.coller}, filtre ${m.filtre}, trou ${m.trou} px, + « ${m.plus} »`);
    const ko = [];
    /* 8 avant la fixture D421 « Prix en euros » (une ligne de 100 px de plus, au-dessus de l'Idée) : le seuil garde la même densité, 7 lignes + celle-ci */
    if (m.lignes < 7) ko.push(`${m.lignes} carnets au premier écran (7 au moins avec la fixture « Prix en euros », 8 sans)`);
    if (m.coller > 1) ko.push(`« Coller un lien » ×${m.coller}`);
    if (!m.filtre) ko.push('ni filtre ni recherche');
    if (m.trou === null || m.trou > 24) ko.push(`trou de ${m.trou} px sous le champ`);
    if (/id[ée]e/i.test(m.plus)) ko.push(`le + volant double le champ (« ${m.plus} »)`);
    if (ko.length) throw new Error(`CRN-LISTE : ${ko.join(' ; ')}`);
  });
  await c.etape('V4-CRN-LISTE-filtre', async () => {
    /* le filtre agit : « À comparer » ne laisse que ses carnets ; la recherche trouve un carnet par un mot de son titre */
    const puce = await c.p.evaluate(() => !!document.querySelector('.cn-liste [data-filtre="research"]'));
    if (!puce) throw new Error('CRN-LISTE : aucune puce de filtre « À comparer »');
    await c.toucherSel('.cn-liste [data-filtre="research"]');
    const t = await c.p.evaluate(() => [...document.querySelectorAll('.cn-liste section[aria-label]')].map((s) => s.getAttribute('aria-label')));
    await c.cap('LISTE-390-filtre');
    if (t.length !== 1 || t[0] !== 'À comparer') throw new Error(`CRN-LISTE : le filtre « À comparer » laisse ${t.join(', ')}`);
    await c.toucherSel('.cn-liste [data-filtre="research"]');
    await c.toucherSel('.cn-liste input[type=search]');
    await c.taper('chambre');
    const n = await c.p.evaluate(() => [...document.querySelectorAll('.cn-liste .cn-carnet')].map((e) => e.innerText.split('\n')[0]));
    await c.cap('LISTE-390-recherche');
    console.log(`  recherche « chambre » : ${n.join(' ; ')}`);
    if (!n.length || !n.every((x) => /chambre/i.test(x))) throw new Error(`CRN-LISTE : la recherche « chambre » rend ${n.join(' ; ') || 'rien'}`);
  });

  /* ---------- V4 fiche ---------- */
  const mesureFiche = () => c.p.evaluate(() => {
    const fiche = document.querySelector('article.cn-ouvert');
    if (!fiche) return null;
    const zone = document.querySelector('.cn-champ-zone')?.getBoundingClientRect();
    const basEcran = zone ? zone.top : innerHeight;
    const dansEcran = (r) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < basEcran;
    const tailles = new Set(); const parTaille = {}; const vides = []; const petits = [];
    const w = document.createTreeWalker(fiche, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const s = w.currentNode.textContent.replace(/\s+/g, ' ').trim(); if (!s) continue;
      const e = w.currentNode.parentElement; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      if (!dansEcran(r) || cs.visibility === 'hidden') continue;
      tailles.add(cs.fontSize);
      (parTaille[cs.fontSize] ??= new Set()).add(`${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`);
    }
    const tx = fiche.innerText;
    for (const m of tx.matchAll(/[^\n]*(rien encore|· aucune|· aucun\b|aucune :)[^\n]*/g)) vides.push(m[0].trim());
    for (const b of fiche.querySelectorAll('button, a, [role=button]')) {
      const r = b.getBoundingClientRect();
      if (!dansEcran(r)) continue;
      if (r.height < 24 || r.width < 24) petits.push(`« ${(b.innerText || b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 30)} » ${Math.round(r.width)}×${Math.round(r.height)}`);
    }
    const quand = fiche.querySelector('section[aria-label="Quand"]');
    return { tailles: [...tailles].sort(), parTaille: Object.fromEntries(Object.entries(parTaille).map(([k, v]) => [k, [...v].slice(0, 6).join(' ')])), vides, petits, quand: quand ? Math.round(quand.getBoundingClientRect().height) : null };
  });
  for (const [l, h, tact] of [[390, 844, true], [1280, 800, false]]) {
    await c.etape(`V4-fiche-${l}`, async () => {
      await c.ouvrirPage(l, h, tact);
      const ko = [];
      for (const titre of [TITRE_CHAMBRE, TITRE_VENTILATION]) {
        await listeAtelier(); await c.ouvrirCarnetDeListe(titre);
        const m = await mesureFiche();
        await c.cap(`FICHE-${l}-${titre.includes('Chambre') ? 'chambre' : 'ventilation'}`);
        if (!m) { ko.push(`${titre} : aucune fiche`); continue; }
        console.log(`  ${titre} ${l} : tailles ${m.tailles.join(' ')}, vides ${m.vides.length}, cibles < 24 : ${m.petits.length}, Quand ${m.quand} px ${JSON.stringify(m.parTaille)}`);
        if (m.vides.length) ko.push(`${titre} : lignes vides ${m.vides.map((v) => `« ${v.slice(0, 40)} »`).join(', ')}`);
        if (m.tailles.length > 3) ko.push(`${titre} : ${m.tailles.length} tailles de texte (${m.tailles.join(' ')})`);
        if (m.petits.length) ko.push(`${titre} : cibles < 24 px ${m.petits.slice(0, 4).join(', ')}`);
        if (m.quand !== null && m.quand > 52) ko.push(`${titre} : Quand sur ${m.quand} px (une rangée attendue)`);
      }
      if (ko.length) throw new Error(`V4 : ${ko.join(' ; ')}`);
    });
  }

  /* ---------- captures : 390 et 1280, deux thèmes (rien n'est jugé ici, les captures s'ouvrent) ---------- */
  await c.etape('V4-captures-themes', async () => {
    for (const [l, h, tact] of [[390, 844, true], [1280, 800, false]]) {
      await c.ouvrirPage(l, h, tact);
      for (const nom of ['Clair', 'Cave']) {
        await c.demarrer(); await theme(nom); await c.versAtelier(); await c.attendreListe();
        await c.cap(`T-${nom}-liste`);
        await c.ouvrirCarnetDeListe(TITRE_CHAMBRE); await c.cap(`T-${nom}-chambre`);
      }
    }
  });
}
