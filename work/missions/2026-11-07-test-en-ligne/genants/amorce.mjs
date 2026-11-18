// Outil commun des contrôles de la voie c-genants (07.11) : fabrique, par le vrai brouillon de l'assistant, une recette « telle que le brasseur l'a saisie ».
// Parcours : fixture `?dev-local&etape=houblons&recette=identite` → un vrai geste (le nom, un caractère ajouté puis retiré) fait écrire le brouillon par l'app
// → on réécrit ce brouillon (noms de houblons, malts sans couleur…) → rechargement : l'assistant reprend le brouillon → étapes → « Enregistrer la recette ».
// Les données ne quittent pas le navigateur de test (localStorage du banc) ; aucune donnée réelle.
import { ouvrir, dormir } from '../../2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';

export const cliquerTexte = (p, src) => p.evaluate((s) => {
  const r = new RegExp(s, 'i');
  const vis = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const b = [...document.querySelectorAll('button, a, [role=button], [role=menuitem]')].filter(vis).find((x) => r.test(x.textContent.replace(/\s+/g, ' ').trim()) || r.test(x.getAttribute('aria-label') ?? ''));
  if (b) b.click(); return b ? b.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : null;
}, src);

export async function allerEtape(p, nom) {
  await p.evaluate((n) => { [...document.querySelectorAll('nav[aria-label="Étapes"] button')].filter((b) => b.getBoundingClientRect().width > 0).find((b) => (b.getAttribute('aria-label') ?? b.textContent.trim()).startsWith(n))?.click(); }, nom);
  await dormir(1600);
}

/** Ouvre le banc, force l'écriture du brouillon, le transforme (`transformer(recipe)` modifie la recette en place), recharge. */
export async function ouvrirAmorce(construit, { theme = 'clair', largeur = 390, transformer } = {}) {
  const { nav, p } = await ouvrir(construit, { theme, largeur, url: '/?dev-local&etape=houblons&recette=identite' });
  await dormir(3000);
  await allerEtape(p, 'Identité');
  const champ = await p.$('[aria-label="Nom de la bière"]');
  if (!champ) throw new Error('aucun champ texte à l\'étape Identité');
  await champ.click({ clickCount: 3 });
  await p.keyboard.type('Recette de banc', { delay: 10 });
  await dormir(2500);
  const cle = await p.evaluate(() => Object.keys(localStorage).find((k) => k.startsWith('laffinee_recipe_draft_v1:')) ?? null);
  if (!cle) throw new Error('le brouillon n\'a pas été écrit');
  await p.evaluate((k, src) => {
    const brut = JSON.parse(localStorage.getItem(k));
    const f = new Function('recipe', src);
    f(brut.draft.recipe);
    if (brut.draft.details) { brut.draft.details.hops = brut.draft.recipe.hops; brut.draft.details.fermentables = brut.draft.recipe.fermentables; if (!('boilMin' in brut.draft.recipe)) delete brut.draft.details.boilMin; else brut.draft.details.boilMin = brut.draft.recipe.boilMin; if (brut.draft.recipe.nolo) brut.draft.details.nolo = brut.draft.recipe.nolo; }
    localStorage.removeItem(k);
    localStorage.setItem(k.replace(/:[^:]+$/, ':new'), JSON.stringify(brut));
  }, cle, transformer ?? '');
  // Retour à l'app sans le banc `?etape=` (qui ressèmerait la fixture) : « + » → « Nouvelle recette » reprend le brouillon sous la clé « new ».
  await p.goto(`${p.hote}/?dev-local`, { waitUntil: 'networkidle0' });
  await dormir(2500);
  await cliquerTexte(p, '^Actions rapides'); await dormir(800);
  const entree = await cliquerTexte(p, 'Créer une recette|Nouvelle recette'); await dormir(2500);
  if (!entree) throw new Error('« Nouvelle recette » introuvable dans le menu +');
  return { nav, p };
}

/** Du brouillon à la fiche : récapitulatif → Enregistrer → Recettes → première fiche. */
export async function jusquALaFiche(p, sortie, nom) {
  for (let i = 0; i < 8; i++) {
    if (await p.evaluate(() => [...document.querySelectorAll('button')].some((b) => /Enregistrer la recette/.test(b.textContent)))) break;
    const fait = await cliquerTexte(p, '^(Suivant|Continuer|Étape suivante)');
    if (!fait) await p.evaluate(() => { [...document.querySelectorAll('nav[aria-label="Étapes"] button')].filter((b) => b.getBoundingClientRect().width > 0).at(-1)?.click(); });
    await dormir(1200);
  }
  await cliquerTexte(p, '^Enregistrer la recette'); await dormir(2500);
  await cliquerTexte(p, '^Brassins$'); await dormir(1500);
  await cliquerTexte(p, '^Recettes'); await dormir(2000);
  if (sortie) await p.screenshot({ path: `${sortie}/${nom}-liste.png`, fullPage: true });
  await p.evaluate(() => { document.querySelector('[data-recipe-id], [data-recette], article button, li button')?.click(); });
  await dormir(2000);
  if (sortie) await p.screenshot({ path: `${sortie}/${nom}-fiche.png`, fullPage: true });
}
