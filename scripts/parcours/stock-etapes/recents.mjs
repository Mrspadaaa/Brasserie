// D420 point 2 (22.11) : la pastille « récents » (mouvement de moins de 14 jours) et la teinte de la barre d'un rayon de Recompter (st1-d1a-recompter :
// Malts beige, Houblons vert, Levures fauve ; une barre par famille, pas un fond neutre unique). Rouge sur tour9 (`--ref en-ligne/2026-11-22-tour9 --rouge RECENTS-1,RECOMPTER-TEINTE`).
// 22.11 : un thème (clair), 390 tactile en profondeur, 1280 en simple contrôle.
export const passes = ['390-clair', '1280-clair'];

const pastilles = () => [...document.querySelectorAll('.sz-pu')].map((b) => ({ f: b.dataset.f, n: Number(b.querySelector('b')?.textContent.trim()), actif: b.getAttribute('aria-pressed') === 'true' }));
const lignes = () => [...document.querySelectorAll('.stock-liste [data-ref], .stock-liste [data-item]')].length;
const teintes = () => {
  const lire = (nom) => { const h = document.querySelector(`.sz-r-ray[aria-label="${nom}"] .sz-r-rh`); if (!h) return null; const m = getComputedStyle(h).backgroundColor.match(/[\d.]+/g)?.slice(0, 3).map(Number); return m ?? null; };
  const jauge = (nom) => { const b = document.querySelector(`.sz-r-ray[aria-label="${nom}"] .sz-r-bar i`); return b ? getComputedStyle(b).backgroundColor.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? null : null; }; const bb = jauge('Malts');
  return { malts: lire('Malts'), houblons: lire('Houblons'), levures: lire('Levures'), barre: bb, jaugeHoublons: jauge('Houblons'), entetes: [...document.querySelectorAll('.sz-r-rh')].map((h) => getComputedStyle(h).backgroundColor) };
};

export default async function (c) {
  // un article de plus et un mouvement daté d'aujourd'hui (ZZ TEST), posés dans l'étape (comme fiche.mjs) : la fixture n'a aucun mouvement récent
  await c.p.evaluateOnNewDocument(() => {
    const k = 'parcours-chaines:fixture'; const e = JSON.parse(localStorage.getItem(k) || '[]');
    if (e.some((x) => x.id === 'ZZ-REC')) return;
    const date = new Date().toISOString().slice(0, 10);
    const poser = (name, id, data) => e.push({ name, id, data: { ...data, id } });
    poser('stockItems', 'ZZ-REC', { ref: 'ZZ-REC', name: 'ZZ TEST Récent', category: 'Emballage', unit: 'pièce', currentStock: 40, reorder: false, supplier: 'ZZ TEST' });
    poser('movements', 'ZZ-MVREC', { type: 'inventory-adjustment', stockItemRef: 'ZZ-REC', stockKind: 'rawMaterials', unit: 'pièce', previousStock: 30, delta: 10, newStock: 40, reasonCode: 'comptage', reason: 'Inventaire physique', date, createdAt: `${date}T10:00:00.000Z` });
    localStorage.setItem(k, JSON.stringify(e));
  });

  await c.etape('RECENTS-1 : la pastille « récents »', async () => {
    await c.demarrer(); await c.versStocks(); await c.sleep(700);
    const a = await c.mesure(pastilles);
    await c.cap('recents-pastilles');
    const r = a.find((p) => p.f === 'recents');
    c.controle('RECENTS-1', !!r && r.n >= 1, `pastilles ${a.map((p) => `${p.f} ${p.n}`).join(' · ')} ; « récents » ${r ? r.n : 'absente'} (attendu ≥ 1 : un mouvement posé aujourd'hui)`);
    if (!r) return;
    const avant = await c.mesure(lignes);
    await c.toucher('récents', { sel: '.sz-pu[data-f=recents]' }); await c.sleep(500);
    const t = await c.texte(); const apres = await c.mesure(lignes); const b = await c.mesure(pastilles);
    await c.cap('recents-filtre');
    c.controle('RECENTS-1', /ZZ TEST Récent/.test(t) && b.find((p) => p.f === 'recents')?.actif === true && apres <= avant,
      `filtre récents touché : l'article au mouvement du jour est montré ${/ZZ TEST Récent/.test(t)} ; pastille active ${b.find((p) => p.f === 'recents')?.actif} ; lignes ${avant} → ${apres}`);
  });

  await c.etape('RECOMPTER-TEINTE : la barre de chaque rayon prend la teinte de sa famille', async () => {
    await c.demarrer(); await c.versStocks(); await c.sousOnglet('Recompter'); await c.sleep(700);
    const t = await c.mesure(teintes);
    await c.cap('recompter-barre');
    // teintes exactes de la maquette st1-d1a-recompter (écart ≤ 4 par canal) : Malts beige #F6EBD9, Houblons vert #EAF0DF, jauge Malts brun #9A6A2A, jauge Houblons #5B7D2A
    const proche = (m, ref) => !!m && ref.every((v, i) => Math.abs(m[i] - v) <= 4);
    const distincts = new Set(t.entetes).size >= 2;
    const maltsOk = proche(t.malts, [246, 235, 217]); const houbOk = !t.houblons || proche(t.houblons, [234, 240, 223]);
    const jaugeOk = proche(t.barre, [154, 106, 42]) && (!t.jaugeHoublons || proche(t.jaugeHoublons, [91, 125, 42]));
    c.controle('RECOMPTER-TEINTE', maltsOk && houbOk && jaugeOk && distincts,
      `barre Malts ${t.malts?.join(',') ?? 'absente'} (maquette 246,235,217 ±4 : ${maltsOk}) ; Houblons ${t.houblons?.join(',') ?? 'absente'} (234,240,223 : ${houbOk}) ; jauge Malts ${t.barre ?? 'absente'} (154,106,42 : ${jaugeOk}) ; barres distinctes ${distincts} (${[...new Set(t.entetes)].join(' | ')})`);
  });
}
