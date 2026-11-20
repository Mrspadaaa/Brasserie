# Corrections f1, tour 2 (critique k2, 20.11)

Liste figée (L18) : chaque point est corrigé et prouvé seul (test si c’est une règle ; capture 390 et 1280, clair et cave, ouverte), ou écarté avec raison. Un point « hors voie » de la critique se corrige s’il est dans ton « Possède » (voies/f1/VOIE.md) ; sinon « ouvert — hors voie : fichier ». Même contrat que voies/f1/VOIE.md : COMMUN.md, test rouge d’abord, commit par chemins « Bugs T3B (f1) k2 : … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> », jamais de déploiement ni de données réelles, jamais stash/reset/checkout.

## Problèmes (RAPPORT.md, même dossier)
10. f1 / hors voie / fiche-390-{clair,cave}-1, fiche-1280-clair-1 : sur le graphique d'Empâtage, les étiquettes « 66 °C · 60′ » et « 44 °C · 15′ » sont barrées par la ligne de grille. Elles sont aussi dans une police à empattements, différente de tout le reste / gênant
11. f1 / fiche-{390,1280}-*-0 : la carte affiche « Wyeast 3068 · 125 mL », puis « Produit exact non choisi » juste en dessous. Les deux se contredisent / gênant
12. f1 / T3B-12 / fiche-*-3 : redites. « Ébullition 60′ » est suivi de « Ébullition de 60 min. » ; le titre « Fermentation » est suivi du sous-titre « Fermentation » ; les pastilles « Primaire » et « Garde » répètent le mot qui est juste à côté / détail
13. f1 / T3B-11 / fiche-390-*-4, fiche-1280-*-3 : la densité du brassin s'écrit « 1.062 » (avec un point), alors que le bandeau dit « 1,062 » / détail
14. f1 / fiche-*-4 : le Déroulé finit par « FIN DE RECETTE » en capitales, après une ligne vide (reste de l'import). Le Bilan écrit aussi « AVANT la fin de l'ébullition » / détail
15. f1 / fiche-1280-* : à 1280, la colonne fait environ 970 px, mais la barre « Préparer un brassin » est plus large qu'elle. Les deux ne sont pas alignées / détail

## Doutes à trancher
- f1, T3B-6 : la capture « simuler » est restée sur le Bilan (« onglet trouvé false »). Le correctif n'est donc pas vu. Je ne vois pas non plus d'onglet « Simuler » dans « Détail des ajouts et IBU » à 390.
- f1 : ABV 6,5 % pour OG 1,062 et FG 1,015. La formule simple donne 6,2 %, la formule alternative 6,4 %. À vérifier.
- f1 : la fixture (Milk Stout, Wyeast 3068, objectif « Girofle · épices », repos férulique) n'est pas une recette crédible. Ce n'est pas un défaut de l'app, mais la fiche n'est pas jugée sur une vraie pièce (L28).
- f1 : je ne vois pas si les 300 g de lactose, désormais en « Additifs », comptent encore dans l'OG et la FG.
- Les 300 g de lactose passés en Additifs doivent rester comptés dans l’OG (sucre non fermentescible : OG oui, atténuation non). Test qui le prouve. ABV 6,5 % pour 1,062/1,015 : vérifier la formule de l’app (ne rien changer si c’est la formule documentée).

## Preuves demandées (à produire toi-même)
1. f1, T3B-6 (Simuler) : dans `voies/f1/banc/capturer.mjs`, ouvrir « Détail des ajouts et IBU », puis cliquer l'onglet dont le nom est exactement « Simuler » (rôle tab ; repli : le bouton au texte exact « Simuler », jamais « Simuler une variante de levure »). Capturer `fiche-{390,1280}-{clair,cave}-simuler.png` (4) et écrire dans EXECUTANT.md : onglet trouvé true/false, présence de « durée d'ébullition » (attendu : absente), et le texte de « Viser des IBU ». Commande : `node scripts/with_server.mjs --server "npx vite --port 3108 --strictPort" --port 3108 --timeout 120 -- node work/missions/2026-11-19-bugs-ecrans/voies/f1/banc/capturer.mjs`.

## Rendre
En bas de ce fichier, « ## Fait » : une ligne par point « n° | corrigé <sha> / écarté <raison> / ouvert <raison> | capture ». Mettre à jour voies/f1/RESULTAT.md si un verdict change, puis tests.txt ; `node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs f1` et `--tests` OK. Réponse : une ligne.

## Fait
10 | ouvert — hors voie : src/ui/recette/Dessins.tsx (voie r1), `CourbeEmpatage` : (a) `fontFamily="IBM Plex Mono"` et `"Source Sans 3"` sans repli générique, d'où la police à empattements quand la police manque : ajouter `, ui-monospace, monospace` et `, system-ui, sans-serif` ; (b) le halo des étiquettes (`strokeWidth="3"`) laisse passer la grille entre les lettres : un `<rect>` de fond (fill `rgb(var(--cave-950))`, largeur ≈ 8,4 px × nombre de caractères + 8, hauteur 18, centré sur le texte) ou `strokeWidth="8"` | fiche-390-clair-1 (vu)
11 | ouvert — hors voie : src/ui/YeastRecipeWorkbench.tsx:340 et src/ui/YeastPitchingPanel.tsx:875 (zone Levure) : « Produit exact non choisi » sous « Wyeast 3068 · 125 mL » se lit comme une contradiction ; proposé « Sachet ou lot précis à choisir » (la souche est choisie, le produit commercial non) ou ligne retirée tant qu'aucun produit n'est choisi | fiche-390-clair-0 (vu)
12 | corrigé f80595f5b : « Ébullition de 60 min. » retirée (seule la densité de début d'ébullition reste, si connue) ; sous-titre « Fermentation » retiré ; pastille cachée quand elle redit le nom de la phase, gardée sinon (« Fermentation principale » → Primaire) | fiche-390-clair-4, fiche-1280-cave-3 (ouvertes)
13 | corrigé f80595f5b : `densiteLue` (« 1.062 » → « 1,062 », illisible gardé tel quel) | fiche-390-clair-4, fiche-1280-cave-3
14 | corrigé f80595f5b pour « FIN DE RECETTE » (`instructionsAffichees` : marqueur et lignes vides de la fin retirés ; Déroulé absent s'il ne reste rien) ; « AVANT » : ouvert — hors voie : src/domain/hopStage.ts:43 (`'Compté en minutes AVANT la fin de l’ébullition.'` → « avant ») ; ce texte s'affiche dans « Détail des ajouts et IBU » (pas dans le Bilan) et dans BrewWizard | fiche-390-clair-4
15 | corrigé f80595f5b : le pied de page prend la colonne de la fiche à partir de 700 px (`min-[700px]:max-w-[540px] mx-auto`) ; mesuré 540 px = 540 px, même x | fiche-1280-cave-3, fiche-1280-clair-simuler, sortie-k2.txt

Doutes : T3B-6 Simuler : onglet trouvé true aux 4 combinaisons, « durée d'ébullition » absente (EXECUTANT.md) ; l'onglet est dans « Potentiel aromatique », pas dans « Détail des ajouts et IBU ». ABV 6,5 % : écarté, valeur retenue `abvTarget` 6,49 de la fixture de base, pas la formule ; la formule documentée (ASBC Beer-4, alcohol.ts) donne 6,28 % pour 1,062/1,015 ; banc corrigé (abvTarget 6,3, fgTarget 1,015). Fixture : simulée, non jugée sur une vraie pièce (L28), limite connue. Lactose : test vert (OG calculée +≈3 points, FG qui monte, atténuation inchangée sur le lactose via la projection ; OG retenue 1,062 inchangée avec le lactose rangé parmi les houblons) ; limite : donnée abîmée du brasseur sans `ogTarget`, le lactose rangé dans `recipe.hops` ne compte pas dans l'OG calculée (avant comme après).
