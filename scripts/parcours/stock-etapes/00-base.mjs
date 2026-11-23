// V0 — la base du banc Stock : les captures 01 (Articles) et 02 (fiche d'un article) du brasseur, rejouées aux quatre passes
// (390 tactile et 1280 souris, clair et cave), et la fixture vérifiée (elle est celle de la chasse : 19 malts, 22 houblons, 11 levures).
// Chaque voie ajoute son fichier (quantite.mjs, mur.mjs, barre-courses.mjs, fiche.mjs, materiel.mjs) dans ce dossier.
export const passes = ['390-clair', '390-cave', '1280-clair', '1280-cave'];

export default async function (c) {
  await c.etape('00 fixture et captures 01-02', async () => {
    await c.demarrer(); await c.versStocks();
    const t0 = await c.texte();
    if (!/Articles/.test(t0) || !/Recompter/.test(t0) || !/Courses/.test(t0)) throw new Error(`l'écran Stocks n'est pas là : « ${t0.slice(0, 160)} »`);
    await c.cap('01-articles');
    // la fixture est celle du brasseur : les rayons du mur disent leurs comptes
    c.controle('V0-fixture', /Malts\s*\d+/.test(t0) && /Houblons\s*\d+/.test(t0), `rayons lus : ${(t0.match(/(Malts|Houblons|Levures)\s*\d+/g) ?? []).join(' · ') || 'aucun'} (attendu ${c.fx.ids.comptes.malts}+ malts, ${c.fx.ids.comptes.houblons} houblons, ${c.fx.ids.comptes.levures} levures)`);
    // la capture 02 : la fiche de Cryo (houblon compté en paquet, nom de facture)
    await c.chercher('Cryo');
    await c.ouvrirFiche(c.fx.ids.nomCryo);
    await c.cap('02-fiche-article');
    const t1 = await c.texte();
    c.controle('V0-fiche', /Cryo/.test(t1) && /Pck/.test(t1), `fiche de Cryo ouverte : ${/Pck/.test(t1) ? '« Pck » lu' : 'pas de « Pck »'}`);
  });
  await c.etape('00 Recompter', async () => {
    await c.demarrer(); await c.versStocks(); await c.sousOnglet('Recompter');
    await c.cap('03-recompter');
    const t = await c.texte();
    c.controle('V0-recompter', /comptés/.test(t), `Recompter affiche ses tuiles : ${(t.match(/\d+\/\d+ comptés/g) ?? []).slice(0, 3).join(' · ') || 'aucune'}`);
  });
}
