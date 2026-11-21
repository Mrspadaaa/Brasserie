// Aides partagées des étapes « Chambre froide » (V0 du lot Chasse Carnet, 21.11) : ouvrir le carnet des captures 02 et 03 du brasseur,
// ouvrir Comparer (capture 04), en lire le tableau. Les voies V2, V3 et V4 les importent :
//   import { ouvrirChambre, ouvrirComparer, lireComparer, lireArticles } from './_chambre.mjs';
// Elles ne jugent rien : elles rendent ce que l'écran montre, mesuré, que le contrôle de la voie compare à son attendu.

/** Titre du carnet dans la fixture (`fixtures/carnet.mjs`, CHAMBRE_FROIDE.titre). */
export const TITRE_CHAMBRE = 'ZZ TEST — Chambre froide';

/** Page neuve, liste du Carnet, carnet « Chambre froide » ouvert (captures 02 et 03). */
export async function ouvrirChambre(c) {
  await c.demarrer(); await c.versAtelier(); await c.attendreListe();
  await c.ouvrirCarnetDeListe(TITRE_CHAMBRE);
}

/** Depuis le carnet ouvert : « Comparer › » (capture 04). Attend le tableau. */
export async function ouvrirComparer(c) {
  await c.toucher('Comparer');
  for (let k = 0; k < 20; k++) {
    if (await c.p.evaluate(() => !!document.querySelector('.cn-tableau-comparer'))) return;
    await c.sleep(300);
  }
  throw new Error('Comparer ne s\'ouvre pas : aucun tableau .cn-tableau-comparer');
}

/**
 * Le tableau de Comparer, tel qu'on le voit : `entetes` (noms d'articles), `lignes` [{ libelle, cellules: [{ texte, police }] }],
 * `largeur` et `hauteur` du tableau en px, `hauteurEcran`. `police` est la famille calculée de la valeur (mono ou non).
 */
export function lireComparer(c) {
  return c.p.evaluate(() => {
    const t = document.querySelector('.cn-tableau-comparer');
    if (!t) return null;
    const n = (x) => String(x ?? '').replace(/\s+/g, ' ').trim();
    const r = t.getBoundingClientRect();
    return {
      largeur: Math.round(r.width), hauteur: Math.round(r.height), hauteurEcran: innerHeight,
      entetes: [...t.querySelectorAll('thead th')].map((e) => n(e.innerText)).filter(Boolean),
      lignes: [...t.querySelectorAll('tbody tr')].map((tr) => ({
        libelle: n(tr.querySelector('th')?.innerText),
        cellules: [...tr.querySelectorAll('td')].map((td) => ({ texte: n(td.innerText), police: getComputedStyle(td.querySelector('span') ?? td).fontFamily.slice(0, 40) }))
      }))
    };
  });
}

/** Le carnet ouvert : le texte de la section « Articles » (lignes de la liste) et si une pastille de rang est dessinée. */
export function lireArticles(c) {
  return c.p.evaluate(() => {
    const n = (x) => String(x ?? '').replace(/\s+/g, ' ').trim();
    const zone = document.querySelector('.cn-ouvert');
    return { texte: n(zone?.innerText ?? ''), rangs: [...document.querySelectorAll('.cn-ouvert [class*="rang"]')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => n(e.innerText)) };
  });
}
