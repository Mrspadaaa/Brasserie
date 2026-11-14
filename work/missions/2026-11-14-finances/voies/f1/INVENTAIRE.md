# Inventaire de s2ap2 (4 images : repos, glisser, après, à cheval) — voie f1

Règle n° 1 : tout ce que la maquette montre est repris ; rien d'ajouté sauf les deux retouches du 14.11 (frise plus compacte, deux champs date à l'ordinateur).
Statut : « code » = écrit dans `src/ui/finance/operations` (Frise.tsx, plage.ts, Bande.tsx) ; « vu » = capture ouverte (planche cap/planche-s2ap2-390-clair.png et cap/*.png).

| # | Élément de la maquette | Image | Où dans le code | Vu |
|---|---|---|---|---|
| 1 | Icône frise 14 px (barres + deux ronds) dans la pilule, à côté de « novembre » | repos | Bande.tsx `.ops-ico-frise` | vu : cap/repos-390-clair (icône à droite de « novembre ») |
| 2 | Frise repliée au repos (v6a intacte, aucune frise) | repos | Bande.tsx `friseOuverte` | vu : repos, aucune frise (controle-frise) |
| 3 | Toucher « novembre » déplie la frise | repos | Bande.tsx `.ops-mois` (aria-expanded) | vu : frise-390-clair/cave ; 2 poignées role=slider |
| 4 | Barres = dépense du jour à l'échelle (matériel compris : 325,40 → 28 px sur 34) | glisser | Frise.tsx `.ops-bk`, `HAUTEUR_MAX` 18 px | vu : barres des 6 opérations du 14 (cap/frise-*) ; échelle sur le plus gros jour |
| 5 | Point vert de la vente posé sur l'axe, sans grandir la barre | glisser | Frise.tsx `.ops-v` (bottom -4 px) | vu : point vert sur l'axe au 14 (cap/frise-390-clair) |
| 6 | Repères des lundis | glisser | Frise.tsx `.ops-lu` | vu : traits plus hauts toutes les semaines sur l'axe |
| 7 | Poignées rondes 24 px, bord 3 px, zone 44 px | glisser | operations.css `.ops-h`, `.ops-gp` | vu : poignées rondes, bord épais, halo (cap/tenue-390-clair, tenue-gauche) |
| 8 | En tenue : halo + bulle « 1er → 15 nov. » | glisser | `.ops-bulle`, `data-tenue` | vu : tenue-390-clair (bulle « 1er → 19 nov. »), tenue-gauche (bulle collée à gauche, corrigée) |
| 9 | Pilule teintée « ‹ 1er → 15 nov. › » (plus de « novembre ») | glisser, après | Bande.tsx `data-plage` | vu : cap/apres-390-clair/cave (pilule teintée) |
| 10 | « × mois entier » ; « 15 jours · 5 opérations » | glisser, après | Frise.tsx `.ops-fr-rd` | vu : « × mois entier », « 14 jours · 6 opérations » |
| 11 | ‹ › glissent la plage de sa durée (17 → 31 oct. / 16 → 30 nov.) | après | plage.ts `glisser` ; Bande `decaler` | testé (FRISE OK : 19 → 31 oct. puis retour) ; pilule non capturée après ‹ |
| 12 | Ligne « hors plage » sous sa catégorie, montant gris, jamais additionnée (loyer 400,00) | glisser, après | TransactionJournal.tsx `.ops-hors` | vu : cap/hors-390-clair (hors plage, loyer 400,00 gris), hors-1280-clair |
| 13 | À cheval : poussée au bord, la frise glisse sur le mois voisin (15 oct. → 10 nov., 27 jours) | à cheval | Frise.tsx `pousser`, plage.ts | vu : cap/acheval-390-cave, pousse-390-clair (frise glisse, 22 oct. → 19 nov.) |
| 14 | Trait pointillé au 1er du mois voisin | à cheval | `.ops-mois-1` | vu : pointillé au 1er nov. (pousse-390-clair) |
| 15 | « du 15 au 31 oct. · aucune opération saisie » pour les jours d'un mois sans opération (inconnu ≠ 0 : ni point ni barre) | à cheval | Frise.tsx `plagesInconnues`, `.ops-fr-note`, `data-inconnu` | NON VU : le jeu n'a pas de mois vide dans la fenêtre ; règle testée en unité (plagesInconnues) |
| 16 | La puce IA suit la plage (poste le plus gros des piles de la plage) | glisser, après | TransactionJournal.tsx `pose` | vu : « Vérifier mes opérations » sur la plage vide (hors-390) ; « Pourquoi les charges fixes pèsent autant ? » sur le mois |
| 17 | Étiquettes de l'axe : poignées en gras, « auj. », 1er du mois, dernier jour | tous | plage.ts `etiquettesAxe` | vu : poignées en gras, « auj. 14 » bleu, dernier jour ; chevauchement « 29 oct. / 1er nov. » corrigé (test unitaire) |
| 18 | Piles, légende « payé · à payer · dépensé » recalculées sur la plage (hors plage : loyer 400 exclu) | glisser | plage.ts `periodeSurJours` | testé (FRISE OK : dépensé 696,80 → à payer −400 hors plage) ; vu hors-390 |
| R1 | Retouche : frise dépliée ≤ 56 px (rangée 18 + piste 24 + axe 12 = 54) | — | operations.css | mesuré : 54 px (FRISE OK) |
| R2 | Retouche : deux champs « du … au … » (`type="date"`) toujours visibles à l'ordinateur (≥ 900 px) | — | Bande.tsx `.ops-champs` | vu : cap/frise-1280-clair/cave, hors-1280-clair ; champs posent la plage tapée (FRISE OK) |

Retiré (la maquette ne l'a pas) : le bouton « … » (Autre période) et sa rangée de deux champs mois d'Opérations. `PlageMois` reste pour la Synthèse et l'analyse (non touché).
