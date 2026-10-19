# Lot 17 · Boosters sur q2b (#138, #142)

Maquettes statiques, en français. Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash. Pas de git.
Écris seulement dans `work/refonte-frontend/v4/ecran-1/fils17-standard/b1` … `b6`, et dans `fils17-standard/captures/`.

## La demande du brasseur

> « regarde aussi pour la standardisation, UX booster, petit icone et autres »

Dès le 18.10 : « D'autres type de UX booster du genre doivent être mis en avant. C'est pas assez encourager » ; « Actuellement l'application est très textuel ».

## Où trouver quoi

- **Le catalogue** : `docs/ux-boosters.md`. Lis-le : identifiants, test d'admission en quatre questions, règles de durée (100 ms, 200–300 ms, jamais plus de 400), mouvement réduit, alternative au toucher.
- **La priorité** (`.claude/rules/affinee-frontend.md`) : densité utile sur mobile. Lis aussi les parties utiles de `PRODUCT.md`, `DESIGN.md` et `docs/ui-compacte.md`.
- **Le point de départ** : `fils15-s5-complexe/q2b/` (ton générateur `q2b/generateur-q2b.mjs`), la variante retenue par le brasseur. Ses données sont dans `fils15-s5-complexe/donnees/c1.json`.

q2b a déjà quatre boosters :
- C5, le panier de comparaison (« + » puis Comparer) ;
- L6, le compteur des moments ;
- C1, la bascule au style / absolu ;
- L1, la piste au style.

## Les six boosters à essayer

Pour chacun, une page `bN/etat-b.html`, qui montre q2b **juste après le geste**. Sa `NOTE.md` répond en une ligne à chacune des quatre questions d'admission.

- **b1 · L5, chiffre qui roule et delta** : après « + » sur une voie, le compteur « Comparer (3) » et l'IBU de la recette avec cette voie s'animent, avec un « +1,8 IBU » éphémère. Les chiffres sont ceux de `ibu` dans c1.json.
- **b2 · A2, annuler en un geste** : « Ajouté à Comparer · Annuler » apparaît en bas, quelques secondes, sans bloquer.
- **b3 · C6, focus et contexte** : toucher un picto de famille dans les tuiles d'objectif, par exemple le floral, met cette famille en avant dans toutes les voies ; les autres pâlissent.
- **b4 · H4, filtres par moment avec compteur** : la frise des moments filtre la liste. On touche « 60′ ×3 » et il ne reste que les trois voies à 60′.
- **b5 · X3, appui long pour prévisualiser** : maintenir un houblon montre un aperçu de sa fiche, la fiche g1 de la base (`ecran-1/base/consolide/fiche.html`). Relâcher le referme.
- **b6 · J6, aperçu fantôme** : toucher une voie projette ses barres en fantôme sur les tuiles d'objectif en haut, pour voir où elle mènerait.

## Règles

- Garde tout q2b, avec ses dix contrôles.
- Au plus 70 mots au premier écran.
- Aucun sens qui ne passe que par le survol.
- Au style par défaut.
- Mouvement réduit respecté (`@media (prefers-reduced-motion: reduce)`).
- Aucune légende écrite.
- Les pictos et le picto épicé en grains de poivre viennent de `fils15-s5-complexe/pictos-familles.html`.

## Contrôles

Pour chaque `bN`, avec `D = work/refonte-frontend/v4/ecran-1/fils17-standard` :

```
node work/refonte-frontend/v4/tournoi/outils/controle-fil6.mjs D bN --objet=suggestions --pages=etat-b.html
node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs D bN --max=70 --page=etat-b.html
node work/refonte-frontend/v4/tournoi/outils/controle-couleurs.mjs D bN
node work/refonte-frontend/v4/tournoi/outils/controle-au-style.mjs D bN --pages=etat-b.html
node work/refonte-frontend/v4/tournoi/outils/controle-autres-ajouts.mjs D bN
node work/refonte-frontend/v4/tournoi/outils/controle-moments.mjs D bN
node work/refonte-frontend/v4/tournoi/outils/controle-ma-biere.mjs D bN
node work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs D bN
node work/refonte-frontend/v4/tournoi/outils/controle-sens-survol.mjs D bN --pages=etat-b.html
node work/refonte-frontend/v4/tournoi/outils/controle-gros-blocs.mjs D bN
```

Tous à OK. Puis la capture :

`node work/refonte-frontend/v4/tournoi/outils/capture-page.mjs work/refonte-frontend/v4/ecran-1/fils17-standard/bN/etat-b.html work/refonte-frontend/v4/ecran-1/fils17-standard/captures/bN-b-390.png 1688`

**Regarde-la** : le geste doit se voir sur la capture (mémoire « un geste doit se voir »).

## Réponse

Une ligne par booster : ce qui tient, ce qui casse, les contrôles.
