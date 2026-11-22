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
    mur: !!sel, murCols: (() => { const w = [...document.querySelectorAll('.sa-r')].map((r) => r.getBoundingClientRect().width); return w.length === 3 ? [Math.round(w[0] / w[2] * 100) / 100, Math.round(w[1] / w[2] * 100) / 100] : null; })(), rangees: rg.map((r) => r.dataset.rangeeAutre),
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
      // Bloc 7 : les pastilles de filtre (n° 33, 34) : une seule ligne, pas de « +n », « manque N » sans tasse ni liseré, pointillé pour « à compter » seulement
      const pu = await c.mesure(() => {
        const g = document.querySelector('.sz-puces'); const ps = [...document.querySelectorAll('.sz-puces .sz-pu')]; const et = document.querySelector('.sz-puces .sz-etoile');
        const t = (e) => (e?.textContent ?? '').replace(/\s+/g, ' ').trim(); const st = (e) => getComputedStyle(e);
        const manque = ps.find((p) => p.dataset.f === 'manque'); const autre = ps.find((p) => p.dataset.f !== 'manque' && p.dataset.f !== 'compter');
        const bord = (e) => (e ? `${st(e).borderTopStyle} ${st(e).borderTopWidth} ${st(e).borderTopColor}` : null);
        const r = (e) => e.getBoundingClientRect();
        return {
          n: ps.length, mots: ps.map((p) => t(p)), plus: ps.some((p) => /\+\s*\d/.test(t(p))) || /\+\s*\d/.test(t(g)),
          tops: new Set(ps.concat(et ? [et] : []).map((p) => Math.round(r(p).top / 3))).size, debord: g ? g.scrollWidth > g.clientWidth + 1 : null, etoile: !!et && r(et).right <= innerWidth,
          largeur: ps.length ? Math.round(Math.max(...ps.concat(et ? [et] : []).map((p) => r(p).right)) - Math.min(...ps.map((p) => r(p).left))) : 0,
          manqueSvg: manque ? manque.querySelectorAll('svg,img').length : null, manqueBord: bord(manque), autreBord: bord(autre), manqueFond: manque ? st(manque).backgroundColor : null, autreFond: autre ? st(autre).backgroundColor : null,
          compterBord: bord(ps.find((p) => p.dataset.f === 'compter')), autresBords: ps.filter((p) => p.dataset.f !== 'compter').map((p) => st(p).borderTopStyle),
          ordre: ps.map((p) => p.dataset.f),
        };
      });
      c.controle('AA-7', pu.n >= 2 && !pu.plus && pu.tops === 1 && !pu.debord && pu.etoile && pu.manqueSvg === 0 && pu.manqueBord === pu.autreBord && pu.manqueFond === pu.autreFond
        && /^dashed/.test(pu.compterBord ?? '') && pu.autresBords.every((b) => b === 'solid'),
      `pastilles ${JSON.stringify(pu.mots)} (ordre ${pu.ordre}), « +n » : ${pu.plus}, lignes ${pu.tops}, déborde : ${pu.debord}, étoile visible : ${pu.etoile}, largeur ${pu.largeur} px, manque : ${pu.manqueSvg} icône, bord ${pu.manqueBord} / autre ${pu.autreBord}, à compter : ${pu.compterBord}`);
      // Bloc 8 : 1280, une table par rayon (n° 35 à 42) ; à 390 la liste reste plate, sans table
      const tb = await c.mesure(() => {
        const g = document.querySelector('.sz-tables.sz-autres'); if (!g) return { absent: true, plat: !!document.querySelector('[data-ligne-autre]') };
        const t = (e) => (e?.textContent ?? '').replace(/\s+/g, ' ').trim(); const tables = [...g.querySelectorAll('.sz-table')];
        const rang = (l) => { const m = t(l.querySelector('.la-mot')); return m === 'épuisé' ? 0 : m === 'bas' ? 1 : m === 'à compter' ? 2 : 3; };
        const w = tables.map((x) => x.getBoundingClientRect().width);
        const th = tables.map((x) => x.querySelector('.l1-th')); const pseudo = (e, i) => (e ? getComputedStyle(e.children[i], '::before').content : null);
        const rows = (x) => [...x.querySelectorAll('[data-ligne-autre]')];
        const lig = [...g.querySelectorAll('[data-ligne-autre]')]; const fs = (l, s) => parseFloat(getComputedStyle(l.querySelector(s)).fontSize);
        const pera = lig.find((l) => t(l.querySelector('.l1-n1')).includes('Acide peracétique')); const nutri = lig.find((l) => t(l.querySelector('.l1-n1')).includes('Nutriment levure'));
        const kg = pera?.querySelector('.l1-kg'); const piste = pera?.querySelector('.l1-ec-c');
        return {
          murCols: (() => { const w = [...document.querySelectorAll('.sa-r')].map((r) => r.getBoundingClientRect().width); return w.length === 3 ? [Math.round(w[0] / w[2] * 100) / 100, Math.round(w[1] / w[2] * 100) / 100] : null; })(), colonnes: tables.map((x) => x.dataset.table), largeursT: w.map(Math.round), gap: getComputedStyle(g).columnGap, ratios: [Math.round(w[0] / w[2] * 100) / 100, Math.round(w[1] / w[2] * 100) / 100],
          titres: tables.map((x) => t(x.querySelector('.l1-eh h2'))), seuilTh: th.map((e) => pseudo(e, 2)), echelleTh: th.map((e) => pseudo(e, 4)),
          tri: tables.map((x) => { const r = rows(x).map(rang); return r.every((v, i) => i === 0 || v >= r[i - 1]); }),
          nom: lig.length ? fs(lig[0], '.l1-n1') : null, stock: lig.length ? fs(lig[0], '.l1-q') : null,
          seuilCol: pera ? t(pera.querySelector('.l1-rp')) : null, etat: pera ? t(pera.querySelector('.la-mot')) : null, nutri: nutri ? t(nutri.querySelector('.l1-q')) : null,
          barreH: kg ? Math.round(kg.getBoundingClientRect().height) : null, barreX: kg && piste ? Math.round(kg.getBoundingClientRect().width / piste.getBoundingClientRect().width * 1000) / 1000 : null,
          nbSansBarre: lig.filter((l) => !l.querySelector('.l1-kg')).length, nbLignes: lig.length,
        };
      });
      let table = null;
      if (c.largeur >= 1000) {
        await essayer(() => c.toucher('ZZ TEST Acide peracétique', { sel: '.sz-autres [data-ligne-autre] .l1-row' })); await c.sleep(500);
        table = await c.mesure(() => { const l = [...document.querySelectorAll('.sz-autres [data-ligne-autre]')].find((x) => x.querySelector('.l1-n1')?.textContent.includes('Acide peracétique')); const o = l?.querySelector('[data-ligne-ouverte]'); return { ouverte: !!o, fournisseur: o?.querySelector('.la-four')?.textContent ?? null, input: o?.querySelector('input')?.type ?? null }; });
        await c.cap('autres-a-table-ouverte');
        await essayer(() => c.toucher('ZZ TEST Acide peracétique', { sel: '.sz-autres [data-ligne-autre] .l1-row' })); await c.sleep(300);
      }
      await c.cap('autres-a-liste');
      if (c.largeur >= 1000) {
        c.controle('AA-8', !tb.absent && tb.colonnes.join() === 'Sels et additifs,Emballage,Nettoyage et gaz' && tb.gap === '12px' && Math.abs((tb.murCols?.[0] ?? 0) - 5 / 3) < 0.1 && Math.abs((tb.murCols?.[1] ?? 0) - 4 / 3) < 0.1 && Math.abs(tb.ratios[0] - 5 / 3) < 0.08 && Math.abs(tb.ratios[1] - 4 / 3) < 0.08
          && tb.seuilTh.every((x) => x === '"seuil"') && tb.echelleTh.every((x, i) => x === (tb.largeursT[i] >= 400 ? '"0 · seuil · 1,6×"' : '"jauge"')) && tb.tri.every(Boolean) && tb.nom === 15 && tb.stock === 16 && tb.barreH === 14 && Math.abs(tb.barreX - 250 / 800) < 0.02
          && tb.seuilCol === '500 ml' && tb.etat === 'bas' && tb.nutri === '0 g' && table?.ouverte === true && /ZZ TEST/.test(table.fournisseur ?? '') && table.input === 'text',
        `tables ${tb.colonnes}, écart ${tb.gap}, mur ${tb.murCols}, largeurs ${tb.ratios} (cible 1,67 et 1,33), titres ${tb.titres}, en-têtes ${tb.seuilTh} / ${tb.echelleTh}, tri ${tb.tri}, police nom ${tb.nom} stock ${tb.stock}, barre ${tb.barreH} px à ${tb.barreX} (cible 0,313), seuil ${tb.seuilCol} état ${tb.etat}, zéro ${tb.nutri}, ligne ouverte ${JSON.stringify(table)}, sans barre ${tb.nbSansBarre}/${tb.nbLignes}`);
      } else {
        c.controle('AA-8', !!tb.absent && tb.plat, `à ${c.largeur} px : pas de table, liste plate ${tb.plat}`);
      }
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
        return !l ? { absent: [...document.querySelectorAll('[data-ligne-autre] .l1-n1')].map((x) => t(x)).slice(0, 12), pressed: [...document.querySelectorAll('.sa-mur .l1e-n[aria-pressed=true]')].map((x) => x.dataset.filtre) } : { n2: t(l.querySelector('.l1-n2')), ouvert: !!o, input: inp ? { type: inp.type, mode: inp.inputMode, v: inp.value } : null, nombres: l.querySelectorAll('input[type=number]').length, fiche: !!o?.querySelector('.la-fiche'), box: Math.round(l.getBoundingClientRect().height), star: !!l.querySelector('[data-etoile]'), liseret: getComputedStyle(l.querySelector('.l1-li')).boxShadow };
      }, nom);
      // La liste est virtualisée : une ligne hors fenêtre n'est pas dans le DOM. On filtre d'abord sur sa rangée (toucher le nom de rangée du mur), seulement si elle n'est pas déjà la rangée active.
      const filtrer = async (rangee) => {
        const deja = await c.mesure((r) => document.querySelector(`.sa-r[data-rangee-autre="${r}"] .l1e-n`)?.getAttribute('aria-pressed') === 'true', rangee);
        if (!deja) { await essayer(() => c.toucherSel(`.sa-r[data-rangee-autre="${rangee}"] .l1e-n`)); await c.sleep(600); }
      };
      await filtrer('Nettoyage');
      const avant = await lireLigne('Soude PBW');
      await filtrer('Additifs');
      // la fenêtre de la liste suit le défilement de la page : on la parcourt jusqu'à voir la ligne
      let ep = await lireLigne('Nutriment levure');
      await c.mesure(() => window.scrollTo(0, 0)); await c.sleep(300);
      for (let i = 0; i < 8 && ep?.absent; i++) { ep = await lireLigne('Nutriment levure'); if (!ep.absent) break; await c.mesure(() => window.scrollBy(0, 220)); await c.sleep(300); ep = await lireLigne('Nutriment levure'); }
      await filtrer('Nettoyage');
      await essayer(() => c.toucher('ZZ TEST Soude PBW', { sel: '[data-ligne-autre] .l1-row' })); await c.sleep(500);
      const ouv = await lireLigne('Soude PBW');
      await essayer(() => c.toucherSel('[data-ligne-ouverte] .la-seuil .la-pm:last-child')); await c.sleep(700);
      const apres = await lireLigne('Soude PBW');
      await c.cap('autres-a-liste-ouverte');
      c.controle('AA-6', !!avant && /assez/.test(avant.n2) && /seuil 500 g/.test(avant.n2) && !!ep && /épuisé/.test(ep.n2) && /seuil 20 g/.test(ep.n2)
        && ouv?.ouvert === true && ouv.input?.type === 'text' && ouv.input.mode === 'decimal' && ouv.nombres === 0 && ouv.fiche && ouv.star && /3px/.test(ouv.liseret) && /seuil 550 g/.test(apres?.n2 ?? ''),
      `ligne ${JSON.stringify(avant)} / épuisé ${JSON.stringify(ep)} ; ouverte ${JSON.stringify(ouv)} ; après « + » ${JSON.stringify(apres?.n2)} ${JSON.stringify(apres?.input)}`);
    });
  } finally {
    await c.p.removeScriptToEvaluateOnNewDocument(script.identifier).catch(() => {});
    // le localStorage de l'origine garde la fixture de l'étape : sans ce retrait, les étapes suivantes (STC-2 : « à compter 1 » = Coriandre) la lisent ; le banc repose la sienne au chargement suivant
    await c.p.evaluate(() => { try { localStorage.removeItem('parcours-chaines:fixture'); localStorage.removeItem('parcours-chaines:cache'); } catch { /* sans stockage */ } }).catch(() => {});
  }
}
