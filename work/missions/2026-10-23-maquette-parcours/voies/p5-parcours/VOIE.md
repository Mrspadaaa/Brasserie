# Voie p5-parcours — le parcours entier, joué et capturé

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : p1-ma-biere, p2-suggerer, p3-comparer, p4-dryhopper
- Décideur en cas de doute : pilote

## Objectif
Un script, `prototypes/houblons-v4/parcours/outils/parcours-complet.mjs`, qui construit la maquette intégrée et
joue le parcours de MISSION (points 1 à 5) dans une seule session de navigateur. Il vérifie l'état de la recette
et l'écran après chaque geste, au téléphone (390 × 844, tactile) puis à l'ordinateur (1280 × 800, souris), et
capture chaque étape.

## Entrées
- `work/missions/2026-10-23-maquette-parcours/MISSION.md` : le parcours et ce que « fini » veut dire.
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md` et `prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs`
  (`--ponts`, `--etape`, `window.__parcours`) : réutiliser, sans recopier.
- Les `src/ecrans/*/jeu.mjs` des voies p1 à p4 : leurs gestes et attentes.
- Les RESULTAT.md de p1 à p4 (`work/missions/2026-10-23-maquette-parcours/voies/*/RESULTAT.md`).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `prototypes/houblons-v4/parcours/outils/parcours-complet.mjs`
- `work/missions/2026-10-23-maquette-parcours/voies/p5-parcours/**` (captures dans `captures/`, RESULTAT.md)
- Ne rien changer aux écrans ni au socle : un défaut trouvé se rapporte (écran, geste, attendu, obtenu, capture).

## Consignes
1. Construire dans la sortie par défaut (`construire.mjs`), puis partir de `index.html`.
2. Le parcours, dans cet ordre et sans recharger la page :
   1. Ma bière : lire l'IBU et les familles, appui long sur Nugget → fiche → fermer.
   2. « + floral » → Suggérer → cocher trois houblons → « Comparer les 3 ».
   3. Comparer : retenir Idaho 7, ouvrir le dock, « Placer Idaho 7 ».
   4. Dryhopper : glisser de 60′ au dry hop actif, 2 jours → « Puis la levure ».
   5. Levure : changer de levure, revenir à US-05 → « Ajouter à ma bière ».
   6. Ma bière : Idaho 7 est dans la recette avec son moment et sa levure ; l'IBU et le floral ont bougé dans le
      bon sens.
   7. Nugget → Substituer → un remplaçant → « Remplacer » → Ma bière : l'IBU reste à 0,5 près.
   8. Un « ‹ » dans un outil abandonne son brouillon, et la recette ne change pas.
   9. « Recommencer » rend la recette du départ.
3. Après chaque geste : aucune erreur de page, aucun défilement horizontal, l'écran attendu (`data-ecran`), l'état
   attendu (`window.__parcours`). Garder le temps du recalcul.
4. Le même parcours à 1280 px, à la souris (le survol long ouvre la fiche).
5. Captures : `captures/<nn>-<étape>-390.png` et `-1280.png`. Ouvrir chaque capture en image et écrire en une ligne
   ce qu'elle montre dans RESULTAT.md (L12).
6. Sortie : `PARCOURS OK (n gestes à 390, m à 1280, recalcul médian x ms)`, ou `PARCOURS ECHEC` et la liste.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Un effet doit se voir (L12) : vérifier que chaque changement de la recette est visible à l'écran, pas seulement
  dans l'état.
- Inconnu ≠ 0 : un « ? » attendu reste un « ? ».

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` :
- une ligne par capture ;
- les défauts trouvés (écran, geste, attendu, obtenu) ;
- le temps de recalcul ;
- `LEÇON PROPOSÉE : …` s'il y a lieu.

Réponse finale au pilote : une ligne.
