// Chasse Carnet V2 (21.11) : CRU-3a (le banc simulé ne range pas ailleurs : la fiche s'ouvre aussitôt, +1, titre tapé, stable 8 s)
// et CRN-ONGLET-RETOUR (l'onglet actif « Carnets » ramène à la liste, la saisie reste). Le rangement ailleurs se contrôle au vitest
// tests/unit/carnetsChasseV2.test.tsx ; les prix et les noms, aussi.
export default async function (c) {
  const lire = () => c.p.evaluate(() => {
    const n = (x) => String(x ?? '').replace(/\s+/g, ' ').trim();
    const compte = [...document.querySelectorAll('button')].map((b) => /^Carnets\s*(\d+)$/.exec(n(b.innerText))).find(Boolean);
    return { vue: document.querySelector('[data-carnets]')?.getAttribute('data-vue'), compte: compte ? Number(compte[1]) : null,
      champ: document.querySelector('.cn-champ textarea')?.value ?? '' };
  });
  await c.etape('V2-CRU-3a-creation', async () => {
    await c.demarrer(); await c.toucher('Stocks', { exact: true, sel: 'nav button' }); await c.toucher('Matériel', { exact: true }); await c.toucher('Carnets 2'); await c.attendreListe();
    const a = await lire();
    await c.focaliserChamp(); await c.taper('ZZ TEST — réfractomètre pour mesurer la densité'); await c.entree();
    await c.sleep(1800); const b = await lire(); await c.sleep(6000); const d = await lire();
    console.log(`  CRU-3a : vue ${b.vue} → ${d.vue} ; compte ${a.compte} → ${b.compte} → ${d.compte}`);
    if (b.vue !== 'carnet' || d.vue !== 'carnet' || b.compte !== a.compte + 1 || d.compte !== b.compte) throw new Error('CRU-3a : la fiche doit s\'ouvrir aussitôt et rester, compte +1 puis stable');
  });
  await c.etape('V2-CRN-ONGLET-RETOUR', async () => {
    const av = await lire();
    await c.p.evaluate(() => [...document.querySelectorAll('nav[aria-label="Vue du matériel"] button')].find((b) => /^Carnets/.test((b.innerText || '').trim()))?.click());
    await c.sleep(600);
    const ap = await lire();
    console.log(`  CRN-ONGLET-RETOUR : vue ${av.vue} → ${ap.vue}`);
    if (av.vue !== 'carnet' || ap.vue !== 'liste') throw new Error('CRN-ONGLET-RETOUR : toucher l\'onglet actif doit ramener à la liste des carnets');
  });
}
