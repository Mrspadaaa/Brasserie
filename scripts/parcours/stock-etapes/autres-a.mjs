// Autres stocks A (D423, D424) : liste du port Brasserie/work/missions/2026-11-21-stock-maquettes/A-PORT-LISTE.md, un contrôle par bloc (AA-1 à AA-8).
// Rouge sur tour9 : `node scripts/parcours/stock.mjs <dossier> --ref en-ligne/2026-11-22-tour9 --rouge AA-1,AA-2,AA-3,AA-4,AA-5 --seulement autres-a` ; vert sur l'arbre.
// Données : la fixture du banc + des articles « ZZ TEST » de Additifs, Emballage, Nettoyage posés ici (retirés à la fin de l'étape).
export const passes = ['390-clair', '390-cave', '1280-clair'];

const EXTRA = [
  ['ZZ-SULF', 'ZZ TEST Sulfate de magnésium', 'Sels', 'g', 300, { minStock: 200 }],
  ['ZZ-A1', 'ZZ TEST Whirlfloc', 'Clarification', 'pièce', 6, { minStock: 10 }],
  ['ZZ-A2', 'ZZ TEST Nutriment levure', 'Additifs', 'g', 0, { minStock: 20 }],
  ['ZZ-A3', 'ZZ TEST Coriandre', 'Additifs', 'g', null, {}],
  ['ZZ-CAN', 'ZZ TEST Canette 33 cl', 'Emballage', 'pièce', 480, {}],
  ['ZZ-ETIQ', 'ZZ TEST Étiquette IPA', 'Emballage', 'pièce', 150, { minStock: 100 }],
  ['ZZ-PERA', 'ZZ TEST Acide peracétique', 'Désinfectant', 'ml', 250, { minStock: 500 }],
  ['ZZ-SOUDE', 'ZZ TEST Soude PBW', 'Détergent', 'g', 1200, { minStock: 500 }],
];

const lire = () => {
  const num = (s) => parseFloat(s);
  const rg = [...document.querySelectorAll('.sa-r')];
  const pots = [...document.querySelectorAll('.sa-p')];
  const t = (e) => (e?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const nom = (n) => pots.find((p) => p.dataset.art === n);
  const h = (e) => (e ? Math.round(e.getBoundingClientRect().height * 10) / 10 : null);
  const sel = document.querySelector('.sa-mur');
  const gb = document.querySelector('.sa-mur .l1e-gb');
  const rect = (e) => { const r = e?.getBoundingClientRect(); return r ? { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, top: r.top } : null; };
  return {
    mur: !!sel, rangees: rg.map((r) => r.dataset.rangeeAutre),
    seuilMots: [...document.querySelectorAll('.sa-r')].map((r) => [...r.querySelectorAll('.sw-rl')].map(t)),
    hc: gb ? getComputedStyle(document.documentElement).getPropertyValue('--x') + getComputedStyle(sel).getPropertyValue('--hc') : null,
    tiretContinu: (() => { const g = document.querySelector('.sa-r[data-rangee-autre=Nettoyage] .sa-g:not(.sa-nt) .l1e-gb'); return g ? getComputedStyle(g, '::after').bottom : null; })(),
    tiretsPots: document.querySelectorAll('.sa-td').length,
    hPera: h(nom('ZZ TEST Acide peracétique')), hSoude: h(nom('ZZ TEST Soude PBW')), hMax: num(getComputedStyle(sel ?? document.body).getPropertyValue('--hm')),
    hEtiq: h(nom('ZZ TEST Étiquette IPA')), hCan: h(nom('ZZ TEST Canette 33 cl')), hCaps: h(nom('ZZ TEST Capsule 26 mm')),
    totaux: Object.fromEntries([...document.querySelectorAll('.sa-g')].map((g) => [g.querySelector('.l1e-w').dataset.long ?? t(g.querySelector('.l1e-w')), t(g.querySelector('.l1e-t'))])),
    ligneMots: /Détartrant\s*0|Peracét\.\s*\d/.test(t(sel)),
    fx: !!document.querySelector('.sa-mur [class*="fx-"]'), formes: [...new Set(pots.map((p) => p.dataset.forme).filter(Boolean))].sort(),
    clip: Object.fromEntries(['bouteille', 'canette', 'flacon', 'bidon'].map((f) => [f, !!pots.find((p) => p.dataset.forme === f && getComputedStyle(p).clipPath !== 'none')])),
    fills: Object.fromEntries(rg.map((r) => [r.dataset.rangeeAutre, [...r.querySelectorAll('.sa-p:not(.sa-ep):not(.sv-ac)')].map((p) => getComputedStyle(p).backgroundColor)])),
    largeurs: [...new Set(pots.filter((p) => !p.classList.contains('sa-ep')).map((p) => Math.round(p.getBoundingClientRect().width * 10) / 10))],
    ep: rect(pots.find((p) => p.classList.contains('sa-ep'))), epBord: (() => { const e = pots.find((p) => p.classList.contains('sa-ep')); return e ? getComputedStyle(e).boxShadow : null; })(),
    compter: !!pots.find((p) => p.classList.contains('sv-ac')),
    nomR: (() => { const b = document.querySelector('.sa-mur .l1e-n b'); const s = b && getComputedStyle(b); return s ? `${s.fontWeight}/${s.fontSize}/${s.letterSpacing}` : null; })(),
    titreC: (() => { const w = document.querySelector('.sa-mur .l1e-w'); const s = w && getComputedStyle(w); return s ? `${s.fontWeight}/${s.fontSize}/${s.lineHeight}` : null; })(),
    hRangees: rg.map((r) => Math.round(r.getBoundingClientRect().height)), hMur: Math.round(sel?.getBoundingClientRect().height ?? 0),
    vides: [...document.querySelectorAll('.sa-mur .sx-v')].map(t),
    depasse: rg.some((r) => r.scrollWidth > r.clientWidth + 1 || [...r.querySelectorAll('.l1e-pl')].some((p) => p.scrollWidth > p.clientWidth + 1)),
    depDetail: rg.map((r) => { const p = r.querySelector('.l1e-pl'); return `${r.dataset.rangeeAutre} ${r.scrollWidth}/${r.clientWidth} pl ${p?.scrollWidth}/${p?.clientWidth} pot ${Math.round(r.querySelector('.sa-p')?.getBoundingClientRect().width ?? 0)} occupé ${p ? Math.round(Math.max(...[...p.children].map((x) => x.getBoundingClientRect().right)) - p.getBoundingClientRect().left) : 0} titres ${[...r.querySelectorAll('.l1e-w')].map((x) => Math.round(x.getBoundingClientRect().width))}`; }),
    btnLeg: (() => { const b = document.querySelector('.sa-mur .sx-q'); const r = b?.getBoundingClientRect(); return b ? { rangee: b.closest('.sa-r')?.dataset.rangeeAutre, w: Math.round(r.width), h: Math.round(r.height) } : null; })(),
    nomBtn: rect(document.querySelector('.sa-mur .l1e-n')),
  };
};

// Un geste absent d'une version (le banc rouge sur tour9) ne coupe pas l'étape : le contrôle qui le lit échoue de lui-même.
const essayer = async (f) => { try { await f(); } catch { /* geste introuvable */ } };

export default async function (c) {
  // les articles de l'étape, posés avant le chargement de la page (puis retirés)
  const cles = c.fx.entrees.filter((e) => !EXTRA.some((x) => x[0] === e.id));
  const ajouts = EXTRA.map(([id, name, category, unit, currentStock, extra]) => ({ name: 'stockItems', id, data: { id, ref: id, name, category, unit, currentStock, reorder: true, supplier: 'ZZ TEST', pricePerUnit: 1, ...extra } }));
  const script = await c.p.evaluateOnNewDocument((j) => { try { localStorage.setItem('parcours-chaines:fixture', j); } catch { /* sans stockage */ } }, JSON.stringify([...cles, ...ajouts]));
  try {
    await c.etape('AA autres-a : le mur', async () => {
      await c.demarrer(); await c.versStocks(); await c.toucher('Autres stocks', { sel: '[role=tab]' }); await c.sleep(900);
      const a = await c.mesure(lire);
      await c.cap('autres-a-mur');
      const hm = a.hMax || (c.largeur >= 1000 ? 50 : 22); const fois = c.largeur >= 1000 ? 31 / 14 : 1;
      // Bloc 1 : le seuil (n° 1 à 5)
      c.controle('AA-1', a.mur && a.seuilMots.filter((m) => m.length === 1 && m[0] === 'seuil').length >= 2 && a.seuilMots.every((m) => m.length <= 1) && a.tiretContinu === `${Math.round(14 * fois)}px`
        && Math.abs((a.hPera ?? 0) - Math.round(14 * fois * 250 / 500)) <= 1.5 && (a.hSoude ?? 0) >= hm - 1 && a.tiretsPots >= 1,
      `rangées ${a.rangees}, « seuil » ${JSON.stringify(a.seuilMots)}, tiret continu à ${a.tiretContinu}, tirets de pot ${a.tiretsPots}, pot à moitié ${a.hPera} px (≈ ${Math.round(14 * fois * 0.5)}), plein ${a.hSoude} sur ${hm}`);
      // Bloc 2 : pieds de colonnes (n° 10, 11)
      const T = a.totaux;
      c.controle('AA-2', a.mur && T['Sels'] === '1,2 kg' && T['Capsules'] === '300' && T['Canettes'] === '480' && !a.ligneMots && Object.values(T).every((v) => !/[A-Za-zé]{4,}/.test(v.replace(/ (kg|ml)$/, ''))),
        `totaux ${JSON.stringify(T)} ; ligne de mots du nettoyage : ${a.ligneMots}`);
      // Bloc 3 : aplats, silhouettes, couleurs, largeur, épuisé, à compter (n° 12 à 19)
      const clair = (s) => s.replace(/[^\d,]/g, '');
      const unique = (l) => new Set(l).size === 1;
      c.controle('AA-3', a.mur && !a.fx && a.formes.join() === 'bidon,bouteille,canette,flacon' && a.clip.canette && a.clip.bouteille && a.clip.flacon && a.clip.bidon && a.fills.Additifs.length > 0
        && a.fills.Additifs.every((f) => !a.fills.Emballage.includes(f)) && a.largeurs.length === 1 && !!a.ep && a.ep.w === 10 && a.ep.h === 8 && /rgb\((200, 56, 47|214, 69, 61)\)/.test(a.epBord ?? '') && a.compter,
      `textures ${a.fx}, silhouettes ${a.formes}, largeurs de pot ${JSON.stringify(a.largeurs)}, épuisé ${JSON.stringify(a.ep)} ${a.epBord?.slice(0, 30)}, à compter ${a.compter}, teintes ${Object.keys(a.fills).map((k) => `${k}:${[...new Set(a.fills[k])].length}`)}`);
      // Bloc 4 : typographie et rythme (n° 20 à 23)
      c.controle('AA-4', a.mur && /^700\/13px\/(normal|0px)$/.test(a.nomR ?? '') && /^700\/12px\/14px$/.test(a.titreC ?? '') && a.hRangees.every((x) => x >= 56) && (c.largeur >= 1000 || a.hMur <= 260) && !a.depasse && a.vides.some((v) => /Cartons/.test(v)),
        `nom de rangée ${a.nomR}, titre de colonne ${a.titreC}, rangées ${a.hRangees} px, mur ${a.hMur} px, rien ne déborde : ${!a.depasse} ${a.depDetail.join(' ; ')}, vides ${a.vides}`);
      // Bloc 5 : rangée active, légende (n° 24 à 27)
      await essayer(() => c.toucher('Nettoyage', { sel: '.sa-mur .l1e-n' })); await c.sleep(600);
      const act = await c.mesure(() => { const r = document.querySelector('.sa-mur .l1e-r:has(.l1e-n[aria-pressed=true])'); return r ? { ombre: getComputedStyle(r).boxShadow, ouverte: r.dataset.rangeeAutre } : null; });
      await essayer(() => c.toucher('Légende', { sel: '.sa-mur .sx-q' })); await c.sleep(500);
      const leg = await c.mesure(() => document.querySelector('.sa-mur .sv-leg')?.textContent.replace(/\s+/g, ' ') ?? '');
      await c.cap('autres-a-legende');
      c.controle('AA-5', a.mur && !!act && act.ouverte === 'Nettoyage' && a.btnLeg?.rangee === 'Nettoyage' && a.btnLeg.h >= 17 && a.nomBtn.h >= 44
        && /tirets : le seuil/.test(leg) && /sans seuil : contre le plus gros/.test(leg) && /cadre rouge : épuisé/.test(leg) && /pointillé : à compter/.test(leg) && /barré : DDM dépassée/.test(leg) && /rien en stock/.test(leg),
      `rangée active ${JSON.stringify(act)}, bouton de légende ${JSON.stringify(a.btnLeg)}, nom ${a.nomBtn?.h} px de haut, légende « ${leg.slice(0, 90)} »`);
      // Bloc 6 : la ligne (n° 28 à 32) : 2e ligne « état · seuil », ligne ouverte sur place, seuil réglé dans la ligne (texte décimal, jamais number)
      const lireLigne = (nom) => c.mesure((n) => {
        const l = [...document.querySelectorAll('[data-ligne-autre]')].find((x) => x.querySelector('.l1-n1')?.textContent.includes(n));
        const t = (e) => (e?.textContent ?? '').replace(/\s+/g, ' ').trim();
        const o = l?.querySelector('[data-ligne-ouverte]'); const inp = o?.querySelector('input');
        return l ? { n2: t(l.querySelector('.l1-n2')), ouvert: !!o, input: inp ? { type: inp.type, mode: inp.inputMode, v: inp.value } : null, nombres: l.querySelectorAll('input[type=number]').length, fiche: !!o?.querySelector('.la-fiche'), box: Math.round(l.getBoundingClientRect().height), star: !!l.querySelector('[data-etoile]'), liseret: getComputedStyle(l.querySelector('.l1-li')).boxShadow } : null;
      }, nom);
      const avant = await lireLigne('Soude PBW'); const ep = await lireLigne('Nutriment levure');
      await essayer(() => c.toucher('Soude PBW', { sel: '[data-ligne-autre] .l1-row' })); await c.sleep(500);
      const ouv = await lireLigne('Soude PBW');
      await essayer(() => c.toucherSel('[data-ligne-ouverte] .la-seuil .la-pm:last-child')); await c.sleep(700);
      const apres = await lireLigne('Soude PBW');
      await c.cap('autres-a-liste-ouverte');
      c.controle('AA-6', !!avant && /assez/.test(avant.n2) && /seuil 500 g/.test(avant.n2) && !!ep && /épuisé/.test(ep.n2) && /seuil 20 g/.test(ep.n2)
        && ouv?.ouvert === true && ouv.input?.type === 'text' && ouv.input.mode === 'decimal' && ouv.nombres === 0 && ouv.fiche && ouv.star && /3px/.test(ouv.liseret) && /seuil 550 g/.test(apres?.n2 ?? ''),
      `ligne ${JSON.stringify(avant?.n2)} / épuisé ${JSON.stringify(ep?.n2)} ; ouverte ${JSON.stringify(ouv)} ; après « + » ${JSON.stringify(apres?.n2)} ${JSON.stringify(apres?.input)}`);
    });
  } finally { await c.p.removeScriptToEvaluateOnNewDocument(script.identifier).catch(() => {}); }
}
