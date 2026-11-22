// D8a — port de la maquette choisie st1-d8a (22.11, D420) : Matériel, le parc. « Parc » et son total, une ligne par appareil
// (tuile, nom, sous-ligne, prix en mono ou « ? »), puis « À venir ». Plus de frise « aujourd'hui » ni de filtre Tout / À traiter.
// Rouge sur tour9 (`--ref en-ligne/2026-11-22-tour9 --seulement d8a --rouge D8A-1`), vert sur l'arbre.
export const passes = ['390-clair', '1280-clair']; // 22.11 : un thème (clair), 390 en profondeur, 1280 en simple contrôle
const lire = () => {
  const txt = (e) => (e?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const tete = document.querySelector('.mp-h');
  const lignes = [...document.querySelectorAll('[data-parc-ligne]')];
  const l = lignes[0];
  const seg = [...document.querySelectorAll('nav[aria-label="Vue du matériel"] button')].find((b) => /^À venir/.test(txt(b)));
  const nSeg = Number((txt(seg).match(/\d+/) ?? [0])[0]);
  const frise = [...document.querySelectorAll('.mt-auj, .mt-av, .mt-filtres')].length;
  return {
    tete: txt(tete), lignes: lignes.length,
    prix: l ? txt(l.querySelector('.mp-pr')) : null,
    chevron: !!l?.querySelector('.mp-chev'), tuile: !!l?.querySelector('.mp-pi svg'),
    nom: l ? txt(l.querySelector('.mp-nm b')) : null, sous: l ? txt(l.querySelector('.mp-sl')) : null,
    avenir: document.querySelectorAll('[data-avenir]').length, nSeg, frise,
    ronds: [...document.querySelectorAll('.mp-h .mp-o')].map((b) => Math.round(b.getBoundingClientRect().width)),
    deborde: document.documentElement.scrollWidth > window.innerWidth + 1,
  };
};
export default async function (c) {
  await c.etape('D8A d8a : Matériel, le parc', async () => {
    await c.demarrer(); await c.versStocks(); await c.sousOnglet('Matériel'); await c.sleep(700);
    const a = await c.mesure(lire);
    await c.cap('d8a-materiel');
    c.controle('D8A-1', /^Parc/.test(a.tete) && a.lignes >= 1 && !!a.prix && a.chevron && a.tuile && a.frise === 0 && a.ronds.length === 2 && a.ronds.every((w) => w >= 40) && a.avenir === a.nSeg && !a.deborde,
      `en-tête « ${a.tete} » ; ${a.lignes} ligne(s), 1re « ${a.nom} » / « ${a.sous} » / prix « ${a.prix} », tuile ${a.tuile}, › ${a.chevron} ; frise ou filtres : ${a.frise} (attendu 0) ; ronds ${a.ronds.join('/')} px ; À venir : ${a.avenir} ligne(s) pour ${a.nSeg} au segment ; débordement ${a.deborde}`);
  });
}
