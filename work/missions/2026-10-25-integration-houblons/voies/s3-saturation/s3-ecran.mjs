// s3 : lit l'écran Suggérer (cartes, rangées, familles « hors du style ») et prend une capture pleine page.
//   node scripts/with_server.mjs --server "npm run dev -- --port P --strictPort" --port P --env VITE_HOP_V4=on -- node s3-ecran.mjs <cas> <famille> <fichier.png>
// cas : saturation (Lotus 78 g à 20′ + 144 g au dry hop actif) ou colum (Lotus 84 g à 40′ + Columbus 100 g au dry hop). Famille : citrus, tropical…
const [cas = 'saturation', famille = 'citrus', png] = process.argv.slice(2);
process.env.M9_HOPS = JSON.stringify(cas === 'colum'
  ? [{ name: 'Lotus', alpha: 15, weightG: 84, stage: 'boil', timeMin: 40, hopVarietyId: 'beermaverick-lotus' }, { name: 'Columbus', alpha: 15, weightG: 100, stage: 'dryHop', timeMin: 0, hopVarietyId: 'beermaverick-columbus' }]
  : [{ name: 'Lotus', alpha: 15, weightG: 78, stage: 'boil', timeMin: 20, hopVarietyId: 'beermaverick-lotus' }, { name: 'Lotus', alpha: 15, weightG: 144, stage: 'dryHop', timeMin: 0, hopVarietyId: 'beermaverick-lotus' }]);
const base = 'C:/Users/mrspa/AppData/Local/Temp/claude/C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/ecran-bannir.mjs';
const { ouvrirEcran } = await import(new URL(`file:///${base}`).href);
const { browser, page } = await ouvrirEcran({ combo: 'typicité', famille, moment: 'dryActive' });
try {
  await new Promise((r) => setTimeout(r, 3000));
  const lu = await page.evaluate(() => {
    const t = (e) => (e?.textContent || '').replace(/\s+/g, ' ').trim();
    const cartes = [...document.querySelectorAll('[data-ecran="suggerer"] [data-role="objectif"]')].map((o) => t(o).slice(0, 60));
    const groupes = [...document.querySelectorAll('[data-ecran="suggerer"] section[data-groupe]:not([data-groupe="levure"])')].map((g) => ({
      titre: t(g.querySelector('h3')).slice(0, 50),
      lignes: [...g.querySelectorAll('[data-role="ligne-houblon"]')].slice(0, 8).map((li) => ({ nom: t(li.querySelector('[data-houblon]')), hors: li.querySelector('[data-role="hors-16d"]') ? (li.querySelector('[data-role="hors-16d"]').getAttribute('title') || t(li.querySelector('[data-role="hors-16d"]'))) : null })),
    }));
    return { cartes, groupes };
  });
  console.log(JSON.stringify(lu));
  if (png) await page.screenshot({ path: png, fullPage: true });
} finally { await browser.close(); }
