# Revue visuelle du catalogue de levures

Application réelle avec adaptateurs locaux isolés, Chrome installé, captures examinées sur téléphone puis ordinateur. L’état avant provient du commit `58b9c20`, sans données privées. Le script `scripts/check-yeast-breadth-ui.mjs` reproduit les parcours et produit les captures complètes et leurs contrôles de débordement dans le dossier temporaire `laffinee-yeast-breadth-evidence`.

| Vue retenue | Capture | Observation |
|---|---|---|
| Avant · 375 px | [Sélection initiale](before-375.png) | Périmètre de quelques profils éditoriaux |
| Catalogue · 320 px | [Comparaison compacte](style-picker-320.png) | Forme, laboratoire et plages lisibles ; six lignes par page |
| Recherche · 375 px | [Hydra chez Escarpment](hazy-filter-375.png) | Laboratoire et forme réduisent la liste sans changer le scénario |
| Objectif · 375 px | [Omega Hefeweizen I](omega-wheat-375.png) | Description banane/girofle et usages sous un détail |
| Fiche · 375 px | [Préparation NovaLager](novalager-preparation-375.png) | Protocole, valeurs contradictoires et sources restent consultables |
| Confirmation · 375 px | [Forme de Dieter](form-to-confirm-375.png) | Erreur explicite, application du scénario indisponible avant correction |
| Vide · 375 px | [Scénario conservé](empty-preserved-375.png) | Les filtres vides ne détruisent pas le choix |
| Import · 430 px | [Prévisualisation](import-preview-430.png) | Recette et intention prévisualisées puis restaurées |
| Overview · 375 px | [Recette Dieter](overview-375.png) | Quantité, programme et contacts de houblons cohérents |
| Brassage · 320 px | [Dieter figée](brew-day-320.png) | La fiche suit le snapshot du brassin |
| Comparaison · 1280 px | [Catalogue sur ordinateur](style-picker-1280.png) | Tableau dense, aucune carte supplémentaire inutile |
| Overview · 1280 px | [Conduite et fiche](overview-1280.png) | Courbe lisible et détails repliables |
| Zoom texte · 375 px | [200 %](text-200-percent-375.png) | Recomposition des champs et figures, sans débordement horizontal |

L’en-tête de l’assistant occupe environ 66 px aux tailles usuelles, 96 px au zoom texte de 200 %. Les commandes de navigation restent accessibles. Les vues longues se parcourent verticalement ; les actions fixes des vues recette/brassin n’empêchent pas d’atteindre les sources en fin de contenu.
