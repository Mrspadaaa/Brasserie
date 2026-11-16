OK — point 37 : le manque d'une recette est plafonné à son besoin (5 kg, plus 49) ; stock négatif signalé à part

## Cause
- Ce n'est ni un stock négatif ni un calcul faux de l'unité : `compareRecipeWithStock` (src/domain/stockLevel.ts, l. 268) donne `shortage = besoin de la recette + prévu ailleurs − stock`. C'est voulu (R1, « même chiffre que À commander », tests k2MemeManque). Avec 0 en stock et 44 kg de Pilsner Malz dans d'autres brassins planifiés : 5 + 44 − 0 = 49.
- Le carnet (`lignees`) et la feuille Brasser (`FeuilleBrasser`, « Il manque … ») affichaient ce chiffre tel quel via `besoinsDe` (src/ui/production/recettes/recettesModel.ts). Sur une recette, il dépasse ce qu'elle demande.
- Stock négatif : `physical` et `enStock` valent `null` (currentStock < 0) → ligne « à vérifier », jamais un manque gonflé. Il n'était pas dit à part.
- Sacs : l'unité `sac` ne se convertit pas en kg → « à vérifier », pas de manque inventé. Nom proche : « Pilsner » ne prend pas « Pilsner Malz » (nom exact, ou référence). Rien à corriger là.
- Domaine du stock : inchangé, rien à corriger. À commander garde son chiffre.

## Fichiers écrits
- src/ui/production/recettes/recettesModel.ts (`besoinsDe` : manque = min(shortage, besoin), même unité de l'article ; stock négatif → « stock négatif : à corriger »).
- tests/unit/recettes/m2ManqueRecette.test.ts (11 cas : stock 0, 44 kg ailleurs, partiel, couvert, négatif, g, sacs, noms proches, lignée du carnet).
- Journaux : avant.txt, apres.txt, apres2.txt, tsc.txt, build.txt dans ce dossier.

## Preuves
- Avant correction : 4 échecs sur 11, dont « Pilsner Malz 49 kg » reproduit (avant.txt).
- Après : m2ManqueRecette + port-s1-recettes + k2Disponibilite + k2MemeManque : 44 tests verts ; fix-nuit-1611-1, fix-nuit-1611-5, port-sb-brasser-creer : 41 verts.
- `tsc --noEmit` : 0 erreur. `npm run build` : code 0, DRAPEAUX OK.
- Essais : 1 par critère.

## Limites
- Pas de capture : aucun rendu changé hors texte ; non joué en ligne (pas de déploiement).
- `StockDetailSheet` (écran Stock, l. 324, « · manque … ») utilise encore `shortage` complet : volontaire (même chiffre que À commander), autre session.
- Le 49 vient de 44 kg prévus ailleurs ; reste à voir quels brassins (probablement des ZZ TEST planifiés) les portent : à vérifier en ligne.

DÉCISION À PRENDRE : la fiche Stock doit-elle aussi plafonner « manque » au besoin de la recette ? Options : garder le chiffre À commander (cohérent avec la liste) ou plafonner. Recommandation : garder, et dire « dont X pour d'autres brassins ».
CONNAISSANCE : le manque de la recette (carnet, feuille Brasser) est plafonné à son besoin ; le chiffre complet reste celui de À commander.
LEÇON PROPOSÉE : aucune
