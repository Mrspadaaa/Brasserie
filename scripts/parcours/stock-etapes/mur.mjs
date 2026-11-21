// V2 — le mur (l'étagère) : STG-1 (colonne « Autres » coupée), STG-2 (la bulle cache la rangée voisine), STG-3 (zone de toucher des marques),
// STG-6 (libellé « +1 10 »), et de STG-NOTE-1 : « Lire l'échelle » et « Replier » (44 px). Rouge sur tour8, vert sur l'arbre.
// L'étagère ne change pas d'aspect : chaque passe prend la capture du mur, à ouvrir à côté de celle de tour8.
export const passes = ['390-clair', '390-cave', '1280-clair', '1280-cave'];

/** Mesures du mur, faites dans la page. Chaque rangée `.l1e-r[data-f]` : ce qui dépasse le bord du mur, et la planche (défilement, indice). */
const lireRangees = () => {
  const mur = document.querySelector('[data-mur]'); if (!mur) return null;
  const M = mur.getBoundingClientRect();
  return [...mur.querySelectorAll('.l1e-r[data-f]')].map((r) => {
    const pl = r.querySelector('.l1e-pl'); const P = pl.getBoundingClientRect();
    const cs = getComputedStyle(pl);
    const visibles = [...pl.querySelectorAll('[data-art],.l1e-w,.l1e-t,.sx-vd')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; });
    const droite = Math.max(...visibles.map((e) => e.getBoundingClientRect().right));
    const defile = pl.scrollWidth > pl.clientWidth + 1 && /auto|scroll/.test(cs.overflowX);
    const indice = !!r.querySelector('[data-suite][data-on]'); // l'indice « › » est allumé (la planche défile et n'est pas au bout)
    const marques = [...pl.querySelectorAll('[data-art]')];
    // une marque est atteignable si elle est dans la planche, ou si la planche défile jusqu'à elle
    const hors = marques.filter((a) => { const b = a.getBoundingClientRect(); return b.right > P.right + 0.5 || b.left < P.left - 0.5; }).length;
    return { f: r.dataset.f, nom: r.querySelector('.l1e-n b')?.textContent ?? '', depasse: Math.round(droite - M.right), defile, indice, nbMarques: marques.length, hors, scrollW: pl.scrollWidth, clientW: pl.clientWidth, murScrollW: mur.scrollWidth, murClientW: mur.clientWidth };
  });
};

export default async function (c) {
  await c.etape('STG-1 le mur : aucune colonne coupée, ou le défilement le dit', async () => {
    await c.demarrer(); await c.versStocks(); await c.sleep(600);
    const rangees = await c.mesure(lireRangees);
    await c.cap('mur-repos');
    if (!rangees) throw new Error('le mur [data-mur] n\'est pas dans la page');
    // une rangée est entière quand rien ne dépasse le mur, ou quand elle défile ET qu'un indice de suite le dit
    const coupees = rangees.filter((r) => r.depasse > 1 && !(r.defile && r.indice));
    c.controle('STG-1', coupees.length === 0,
      rangees.map((r) => `${r.nom} ${r.nbMarques} marques : dépasse de ${r.depasse} px, ${r.defile ? 'défile' : 'ne défile pas'}, ${r.indice ? 'indice de suite' : 'sans indice'}, ${r.hors} marque(s) hors planche`).join(' ; '));
    // chaque marque se joue : la dernière de chaque rangée doit pouvoir être visée (rect dans la fenêtre ET reçue par la planche)
    const visees = await c.mesure(() => [...document.querySelectorAll('.l1e-r[data-f]')].map((r) => {
      const arts = [...r.querySelectorAll('[data-art]')]; if (!arts.length) return null;
      const a = arts[arts.length - 1]; if (a.scrollIntoView) a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const b = a.getBoundingClientRect(); const pl = r.querySelector('.l1e-pl').getBoundingClientRect();
      const h = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      return { nom: r.querySelector('.l1e-n b')?.textContent, dansPlanche: b.right <= pl.right + 0.5 && b.left >= pl.left - 0.5, vise: !!h && !!h.closest('.l1e-pl') };
    }).filter(Boolean));
    c.controle('STG-1', visees.every((v) => v.dansPlanche && v.vise), `dernière marque de chaque rangée atteignable : ${visees.map((v) => `${v.nom} ${v.dansPlanche && v.vise ? 'oui' : 'NON'}`).join(', ')}`);
  });

  await c.etape('STG-2 la bulle ne recouvre aucune rangée', async () => {
    await c.demarrer(); await c.versStocks(); await c.sleep(600);
    // une marque de la rangée Houblons, au milieu (la bulle de tour8 montait sur Malts et sur « Houblons 22 »)
    const cible = await c.mesure(() => {
      const arts = [...document.querySelectorAll('.l1e-r[data-f=f1] [data-art]')]; const a = arts[Math.floor(arts.length / 2)]; if (!a) return null;
      a.scrollIntoView({ block: 'center' }); const b = a.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, nom: a.getAttribute('data-art') };
    });
    if (!cible) throw new Error('aucune marque de houblon');
    await c.sleep(200); await c.frapper(cible.x, cible.y);
    const m = await c.mesure(() => {
      const bul = document.querySelector('.l1x-bul'); if (!bul || bul.hidden) return null;
      const B = bul.getBoundingClientRect();
      const rangs = [...document.querySelectorAll('.l1e-r[data-f]')].map((r) => { const R = r.getBoundingClientRect(); const ox = Math.max(0, Math.min(B.right, R.right) - Math.max(B.left, R.left)); const oy = Math.max(0, Math.min(B.bottom, R.bottom) - Math.max(B.top, R.top)); return { nom: r.querySelector('.l1e-n b')?.textContent, recouvre: Math.round(ox * oy) }; });
      return { bulle: { x: Math.round(B.x), y: Math.round(B.y), w: Math.round(B.width), h: Math.round(B.height) }, rangs, texte: bul.innerText.replace(/\s+/g, ' ').trim(), dansEcran: B.left >= 0 && B.right <= innerWidth && B.top >= 0 && B.bottom <= innerHeight };
    });
    await c.cap('mur-bulle');
    if (!m) throw new Error('le toucher sur une marque n\'a ouvert aucune bulle');
    const touches = m.rangs.filter((r) => r.recouvre > 0);
    c.controle('STG-2', touches.length === 0 && m.dansEcran, `bulle « ${m.texte.slice(0, 50)} » ${m.bulle.w}×${m.bulle.h} en (${m.bulle.x}, ${m.bulle.y}) ; recouvre : ${touches.map((r) => `${r.nom} ${r.recouvre} px²`).join(', ') || 'aucune rangée'} ; dans l'écran : ${m.dansEcran ? 'oui' : 'non'}`);
    c.controle('STG-3', m.bulle.h >= 44, `la bulle qui confirme (toucher ici : la fiche) fait ${m.bulle.h} px de haut (≥ 44)`);
  });

  await c.etape('STG-3 zone de toucher de chaque marque', async () => {
    await c.demarrer(); await c.versStocks(); await c.sleep(600);
    // pour chaque marque : le plateau reçoit-il le geste ? hauteur de la zone (balayage vertical de son centre) et largeur de sa cellule (la marque la plus proche prend le geste)
    const z = await c.mesure(() => [...document.querySelectorAll('.l1e-r[data-f]')].map((r) => {
      const pl = r.querySelector('.l1e-pl'); const arts = [...pl.querySelectorAll('[data-art]')].filter((a) => a.getBoundingClientRect().width > 0);
      const P = pl.getBoundingClientRect(); // seules les marques dans la planche : une marque défilée hors champ n'est pas touchable
      arts.splice(0, arts.length, ...arts.filter((a) => { const b = a.getBoundingClientRect(); return b.left >= P.left - 0.5 && b.right <= P.right + 0.5; }));
      const centres = arts.map((a) => { const b = a.getBoundingClientRect(); return b.left + b.width / 2; });
      const hauteurs = arts.map((a, i) => {
        const b = a.getBoundingClientRect(); const x = centres[i]; let haut = 0;
        for (let d = 0; d < 80; d++) { const e = document.elementFromPoint(x, b.y + b.height / 2 - d); if (e && e.closest('.l1e-pl') === pl) haut++; else break; }
        for (let d = 1; d < 80; d++) { const e = document.elementFromPoint(x, b.y + b.height / 2 + d); if (e && e.closest('.l1e-pl') === pl) haut++; else break; }
        return haut;
      });
      const larg = centres.map((x, i) => { const g = i > 0 ? (x - centres[i - 1]) / 2 : 12; const d = i < centres.length - 1 ? (centres[i + 1] - x) / 2 : 12; return Math.min(g, 12) + Math.min(d, 12); });
      return { nom: r.querySelector('.l1e-n b')?.textContent, n: arts.length, hMin: Math.min(...hauteurs), lMin: Math.round(Math.min(...larg) * 10) / 10, lMed: Math.round([...larg].sort((a, b) => a - b)[Math.floor(larg.length / 2)] * 10) / 10 };
    }));
    const maigres = z.filter((r) => r.hMin < 44);
    c.controle('STG-3', maigres.length === 0, `hauteur de la zone de toucher (≥ 44) : ${z.map((r) => `${r.nom} ${r.hMin} px`).join(', ')} ; largeur de cellule (pas des marques, plafonné à 24) : ${z.map((r) => `${r.nom} min ${r.lMin} médiane ${r.lMed} px`).join(', ')}`);
  });

  await c.etape('STG-6 libellé de colonne sans « +1 10 »', async () => {
    // la fixture n'a qu'une souche par colonne : trois levures de souches distinctes en « Autres » (ZZ TEST) donnent « Hornindal · Voss +1 » puis le compte de sachets
    await c.p.evaluateOnNewDocument(() => {
      const k = 'parcours-chaines:fixture'; const e = JSON.parse(localStorage.getItem(k) || '[]');
      if (e.some((x) => x.id === 'ZZ-LX0')) return;
      ['Hornindal', 'Voss', 'Oslo'].forEach((n, i) => { const id = `ZZ-LX${i}`; e.push({ name: 'stockItems', id, data: { id, ref: id, name: `${n} ZZ TEST kveik`, category: 'Levure', unit: 'sachet', currentStock: 10 + i, reorder: true, supplier: 'ZZ TEST' } }); });
      localStorage.setItem(k, JSON.stringify(e));
    });
    await c.demarrer(); await c.versStocks(); await c.sleep(600);
    const t = await c.mesure(() => [...document.querySelectorAll('.l1e-r[data-f=f2] .l1e-t')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()));
    await c.cap('mur-levures');
    const mauvais = t.filter((x) => /\+\d+\s*\d/.test(x));
    c.controle('STG-6', t.length > 0 && mauvais.length === 0, `libellés des colonnes Levures : ${t.map((x) => `« ${x} »`).join(' ; ') || 'aucun'}${mauvais.length ? ` ; ambigus : ${mauvais.join(' ; ')}` : ''}`);
  });

  await c.etape('STG-NOTE-1 Lire l\'échelle et Replier : 44 px', async () => {
    await c.demarrer(); await c.versStocks(); await c.sleep(900);
    const r = await c.mesure(() => [...document.querySelectorAll('[aria-label="Lire l\'échelle"],[aria-label^="Replier"],[aria-label^="Déplier"]')].map((e) => { const b = e.getBoundingClientRect(); return { a: e.getAttribute('aria-label'), w: Math.round(b.width), h: Math.round(b.height) }; }).filter((x) => x.w > 0));
    await c.cap('mur-entete-liste');
    if (!r.length) throw new Error('aucun bouton « Lire l\'échelle » ni « Replier » dans la liste');
    const petits = r.filter((x) => x.w < 44 || x.h < 44);
    c.controle('STG-NOTE-1', petits.length === 0, `${r.length} boutons d'en-tête : ${[...new Set(r.map((x) => `${x.a} ${x.w}×${x.h}`))].join(', ')}`);
  });
}
