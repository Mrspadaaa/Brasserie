// V1 — quantité et lignes : STC-2, STC-17, STE-10, STG-9 (et la part vide de STE-9), l'étoile de STG-NOTE-1.
// Rouge sur tour8, vert sur l'arbre. Se joue à 390 tactile, clair (`--seulement quantite`).
export const passes = ['390-clair'];

export default async function (c) {
  const nomCryo = c.fx.ids.nomCryo;

  await c.etape('STC-2 STC-17 ligne Cryo (1 Pck de 25 g)', async () => {
    await c.demarrer(); await c.versStocks(); await c.chercher('Cryo');
    const ligne = await c.mesure((nom) => {
      const a = [...document.querySelectorAll('article[data-ligne]')].find((x) => x.innerText.includes(nom));
      if (!a) return null;
      return { texte: a.innerText.replace(/\s+/g, ' ').trim(), et: a.getAttribute('data-et') ?? '', pot: a.querySelector('.l1-mk')?.textContent ?? '', barre: !!a.querySelector('.l1-kg') };
    }, nomCryo);
    await c.cap('quantite-ligne-cryo');
    if (!ligne) throw new Error(`la ligne de « ${nomCryo} » n'est pas dans la liste`);
    c.controle('STC-2', !/\?/.test(ligne.pot) && !/à compter/.test(ligne.texte) && !ligne.et.includes('compter') && /1 Pck/.test(ligne.texte) && ligne.barre,
      `ligne Cryo : « ${ligne.texte.slice(0, 120)} » ; pot « ${ligne.pot} » ; états « ${ligne.et} » ; barre ${ligne.barre ? 'oui' : 'non'}`);
    c.controle('STC-17', (ligne.texte.match(/à compter/g) ?? []).length <= 1, `« à compter » écrit ${(ligne.texte.match(/à compter/g) ?? []).length} fois dans la ligne`);
    const pastille = (await c.texte()).match(/à compter\s*\d+/)?.[0] ?? 'absente';
    c.controle('STC-2', !/à compter\s*1\b/.test(pastille), `pastille « ${pastille} » (Cryo n'est plus à compter ; la fixture n'a pas d'autre article à compter)`);
  });

  await c.etape('STC-2 Recompter : Cryo garde sa quantité', async () => {
    await c.demarrer(); await c.versStocks(); await c.sousOnglet('Recompter'); await c.chercher('Cryo');
    const t = await c.mesure((nom) => { const b = [...document.querySelectorAll('button.sz-r-row')].find((x) => x.innerText.includes(nom)); return b ? b.innerText.replace(/\s+/g, ' ').trim() : null; }, nomCryo);
    await c.cap('quantite-recompter-cryo');
    if (t === null) throw new Error('la ligne de Cryo manque dans Recompter');
    c.controle('STC-2', !/quantité inconnue/.test(t) && /1\s*Pck/.test(t), `Recompter : « ${t.slice(0, 120)} »`);
  });

  await c.etape('STG-9 STE-9 les tuiles de Recompter suivent la recherche', async () => {
    await c.demarrer(); await c.versStocks(); await c.sousOnglet('Recompter');
    const tout = await c.mesure(() => [...document.querySelectorAll('.sz-r-som button')].map((b) => b.innerText.replace(/\s+/g, ' ').trim()));
    await c.chercher('Cryo');
    const vues = await c.mesure(() => [...document.querySelectorAll('.sz-r-som button')].map((b) => b.innerText.replace(/\s+/g, ' ').trim()));
    await c.cap('quantite-tuiles-recherche');
    c.controle('STG-9', vues.length < tout.length && !vues.some((v) => /Malts|Levures/.test(v)) && vues.some((v) => /Houblons\s*1\b/.test(v)),
      `tuiles sans recherche : ${tout.join(' | ')} ; avec « Cryo » : ${vues.join(' | ') || 'aucune'}`);
    c.controle('STE-9', !tout.some((v) => /\b0\/0\b/.test(v)), `tuile vide « 0/0 » : ${tout.filter((v) => /\b0\/0\b/.test(v)).join(' | ') || 'aucune'}`);
  });

  await c.etape('STE-10 Recompter > Compter : le nom sur une ligne', async () => {
    await c.demarrer(); await c.versStocks(); await c.sousOnglet('Recompter');
    await c.toucher('Compter', { exact: true, i: 0 }); await c.sleep(900);
    const m = await c.mesure(() => {
      const lignes = [...document.querySelectorAll('.sz-r-cr')].map((r) => { const b = r.querySelector('.sz-r-nm b'); const lh = parseFloat(getComputedStyle(b).lineHeight) || 19; return { h: Math.round(r.getBoundingClientRect().height), nomH: Math.round(b.getBoundingClientRect().height), lh: Math.round(lh), nomW: Math.round(b.getBoundingClientRect().width), t: b.innerText }; });
      return lignes;
    });
    await c.cap('quantite-compter');
    if (!m.length) throw new Error('aucune rangée de saisie (Compter n\'a pas ouvert le rayon)');
    const hauteurs = new Set(m.map((l) => l.h));
    const surUneLigne = m.every((l) => l.nomH <= l.lh + 2);
    c.controle('STE-10', surUneLigne && hauteurs.size === 1,
      `${m.length} rangées : hauteurs ${[...hauteurs].join('/')} px ; nom sur une ligne : ${surUneLigne ? 'oui' : 'non'} (${m.filter((l) => l.nomH > l.lh + 2).map((l) => `« ${l.t} » ${l.nomW}px`).slice(0, 2).join(' ; ')}) ; nom le plus étroit : ${Math.min(...m.map((l) => l.nomW))} px`);
  });

  await c.etape('STG-NOTE-1 l\'étoile : zone de toucher d\'au moins 44 px', async () => {
    await c.demarrer(); await c.versStocks(); await c.chercher('Cryo'); // la liste ne monte ses lignes qu'à l'approche de l'écran
    let etoiles = await c.rects('article[data-ligne] button[aria-pressed]');
    await c.sleep(1500); // la liste reste invisible le temps de sa mesure (trois images)
    const etoiles2 = await c.rects('article[data-ligne] button[aria-pressed]'); etoiles.splice(0, etoiles.length, ...etoiles2);
    await c.cap('quantite-etoile');
    if (!etoiles.length) throw new Error(`aucune étoile dans la liste (${(await c.rects('article[data-ligne]')).length} lignes, ${(await c.rects('[aria-pressed]')).length} boutons à état)`);
    const petite = etoiles.filter((e) => e.w < 44 || e.h < 44);
    c.controle('STG-NOTE-1', petite.length === 0, `${etoiles.length} étoiles ; plus petite : ${Math.round(Math.min(...etoiles.map((e) => e.w)))} × ${Math.round(Math.min(...etoiles.map((e) => e.h)))} px`);
  });
}
