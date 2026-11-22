// STOCK-TRI-INUTILE (22.11) : « Cette écran là est inutile » — le sélecteur « Trié par couleur (malts), amertume (houblons), date (levures) ▾ » et sa liste de 4 choix
// sous le mur de l'Étagère sont retirés ; le tri par défaut reste. (La puce « ↕ couleur » de la barre du rayon, choisie en D2a, est un autre geste : elle n'est pas ce sélecteur.)
// Rouge sur tour9 (`--ref en-ligne/2026-11-22-tour9 --rouge TRI-1`), vert sur l'arbre.
export const passes = ['390-clair', '1280-clair'];
const lire = () => {
  const texte = document.body.innerText ?? '';
  const vu = (e) => !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0;
  const listes = [...document.querySelectorAll('[role=radiogroup],[role=listbox],select,[data-tri],.sz-tri')].filter(vu).map((e) => (e.textContent ?? '').trim().slice(0, 60));
  return { trie: /Tri[ée] par/i.test(texte), listes: listes.filter((t) => /couleur|amertume|nom, A/i.test(t)) };
};
export default async function (c) {
  await c.etape('TRI STOCK-TRI-INUTILE : plus de « Trié par » sous le mur', async () => {
    await c.demarrer(); await c.versStocks(); await c.sleep(800);
    const a = await c.mesure(lire);
    await c.cap('tri-repos');
    c.controle('TRI-1', !a.trie && a.listes.length === 0, `texte « Trié par … » visible : ${a.trie} ; liste de tris visible : ${JSON.stringify(a.listes)}`);
  });
}
