// V0 (Chasse Carnet, 21.11) : le banc rejoue les captures 02, 03 et 04 du brasseur sur la fixture « ZZ TEST — Chambre froide ».
// Ces étapes ne jugent aucun défaut (les contrôles par id sont dans les fichiers des voies V2, V3, V4) : elles prouvent que le geste
// du brasseur se joue (ouvrir le carnet, voir ses 2 articles, ouvrir Comparer) et elles RAPPORTENT ce qu'on voit, pour que le pilote
// compare au constat : sur tour8 « Épaisseur de l&apos;isolation » et « Couleur : » sont là, aucun prix, aucune ligne prix.
import { TITRE_CHAMBRE, ouvrirChambre, ouvrirComparer, lireArticles, lireComparer } from './_chambre.mjs';

export default async function (c) {
  await c.etape('V0-02 le carnet « Chambre froide » : 2 articles, rien d\'autre', async () => {
    await ouvrirChambre(c); await c.cap('v0-02-chambre');
    await c.verifier('V0-02', { contient: ['Chambre froide', /2 articles/], carnets: true });
    const a = await lireArticles(c);
    c.ok('V0-02', `${a.texte.slice(0, 110)}…`);
  });
  await c.etape('V0-03 la liste des articles : deux chambres, « en stock »', async () => {
    await ouvrirChambre(c); await c.cap('v0-03-articles');
    const a = await lireArticles(c);
    const n = (a.texte.match(/Chambre froide - /g) ?? []).length;
    if (n < 2) throw new Error(`2 articles « Chambre froide - … » attendus dans la liste, ${n} vu(s) : « ${a.texte.slice(0, 200)} »`);
    if (!/en stock/.test(a.texte)) throw new Error('« en stock » absent de la liste des articles');
    c.ok('V0-03', `${n} articles ; prix CHF dans le carnet : ${/CHF/.test(a.texte) ? 'oui' : 'aucun'} ; pastilles de rang : ${a.rangs.length}`);
  });
  await c.etape('V0-04 Comparer : le tableau des deux articles', async () => {
    await ouvrirChambre(c); await ouvrirComparer(c); await c.cap('v0-04-comparer');
    const t = await lireComparer(c);
    if (!t) throw new Error('aucun tableau de Comparer');
    const libelles = t.lignes.map((l) => l.libelle);
    if (t.entetes.length < 2) throw new Error(`2 colonnes d'articles attendues, entêtes : ${t.entetes.join(' | ')}`);
    if (libelles.length < 8) throw new Error(`les 10 caractéristiques de la fixture ne sont pas toutes des lignes (${libelles.length} lignes : ${libelles.join(' | ')})`);
    const aPrix = libelles.some((l) => /^prix/i.test(l));
    const brut = libelles.filter((l) => /&[a-z]+;|&#\d+;/i.test(l));
    const deuxPoints = libelles.filter((l) => /:\s*$/.test(l));
    c.ok('V0-04', `${libelles.length} lignes, tableau ${t.largeur}×${t.hauteur} px (écran ${t.hauteurEcran}), ligne prix : ${aPrix ? 'oui' : 'non'}, entité brute : ${brut.join(' ; ') || 'aucune'}, deux-points : ${deuxPoints.join(' ; ') || 'aucun'}`);
    void TITRE_CHAMBRE;
  });
}
