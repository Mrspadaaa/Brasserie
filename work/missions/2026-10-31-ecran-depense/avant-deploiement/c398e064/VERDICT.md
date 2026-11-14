OK — 14 problèmes, 3 bloquants

# Test d'écran — Finances (Opérations v6a + frise s2ap2, Synthèse g3a, Annuel g6)

Version : c398e064 (arbre propre, aucun code modifié). Banc local `?dev-local&finance-demo` (brasserie complète : frise, ✓ Payé,
Annuel g6) et `?dev-local&finance-demo=reel` (états de la vraie app : « à classer », Archives, mois vide, + pièce). 390 tactile
(Puppeteer mobile, plus une prise 390 × 844 en défilant) et 1280 ; clair et sombre (`cave`). Gestes joués au clavier sur les
poignées (`role=slider`), comme `controle-frise.mjs`. Console sans erreur sur les quatre passes.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| ops-repos-390-clair.png | clair | 390 | Opérations repos | 0 | 0 |
| ops-tel-defile-390-clair.png | clair | 390 | Opérations défilé (390 × 844) | 0 | 0 |
| ops-frise-390-clair.png | clair | 390 | frise dépliée | 1 | 1 |
| ops-frise-390-sombre.png | sombre | 390 | frise dépliée | 1 | 1 |
| ops-plage14-390-clair.png | clair | 390 | plage 1er → 14 | 2 | 1 |
| ops-plage14-1280-clair.png | clair | 1280 | plage 1er → 14 | 2 | 1 |
| ops-plage13-hors-390-clair.png | clair | 390 | plage 1er → 13, hors plage | 2 | 1 |
| ops-plage-prec-390-clair.png | clair | 390 | ‹ en plage (19 → 31 oct.) | 1 | 0 |
| ops-acheval-390-clair.png | clair | 390 | à cheval 29 oct. → 13 nov. | 1 | 0 |
| ops-acheval-390-sombre.png | sombre | 390 | à cheval 29 oct. → 13 nov. | 1 | 0 |
| ops-acheval-1280-sombre.png | sombre | 1280 | à cheval 29 oct. → 13 nov. | 2 | 0 |
| ops-champs-1280-clair.png | clair | 1280 | champs du … au … (3 → 10 nov.) | 2 | 1 |
| ops-paye-390-clair.png | clair | 390 | ✓ Payé | 0 | 0 |
| ops-paye-1280-sombre.png | sombre | 1280 | ✓ Payé | 1 | 0 |
| ops-annule-390-clair.png | clair | 390 | Annuler | 1 | 1 |
| syn-nov-390-clair.png | clair | 390 | Synthèse nov., réel | 1 | 0 |
| syn-nov-390-sombre.png | sombre | 390 | Synthèse nov., réel | 1 | 0 |
| syn-complete-390-clair.png | clair | 390 | Synthèse nov., brasserie complète | 0 | 0 |
| syn-sept-390-clair.png | clair | 390 | Synthèse sept. | 0 | 0 |
| syn-sept-1280-sombre.png | sombre | 1280 | Synthèse sept. | 0 | 0 |
| syn-materiel-390-clair.png | clair | 390 | lien Matériel à part | 1 | 0 |
| ann-repos-390-clair.png | clair | 390 | Annuel tête « à classer » | 2 | 0 |
| ann-repos-390-sombre.png | sombre | 390 | Annuel tête « à classer » | 2 | 0 |
| ann-repos-1280-clair.png | clair | 1280 | Annuel tête « à classer » | 2 | 0 |
| ann-etape4-390-clair.png | clair | 390 | à classer › étape 4 | 1 | 0 |
| ann-tva-390-clair.png | clair | 390 | TVA | 1 | 0 |
| ann-tva-1280-sombre.png | sombre | 1280 | TVA | 1 | 0 |
| ann-complete-390-clair.png | clair | 390 | Annuel g6, brasserie complète | 1 | 1 |
| ann-complete-1280-sombre.png | sombre | 1280 | Annuel g6, brasserie complète | 1 | 1 |
| ann-stock-390-clair.png | clair | 390 | Stock au 31 déc. › étape 3 | 0 | 0 |
| ann-mois-390-clair.png | clair | 390 | Mois par mois | 1 | 0 |
| opsr-archives-390-clair.png | clair | 390 | Archives | 1 | 1 |
| opsr-oct-390-clair.png | clair | 390 | mois vide (oct.) | 1 | 0 |
| opsr-piece-390-clair.png | clair | 390 | + pièce | 2 | 0 |
| opsr-vente-390-clair.png | clair | 390 | fiche de la vente | 1 | 0 |

Bloquants : 3

Gestes vus et justes : déplier la frise (icône dans la pilule) ; poignée Fin → « ‹ 1er → 14 nov. › » puis 13 ; ‹ › glissent la
plage de 13 jours (19 → 31 oct., retour) ; poussée de Début au-delà du 1er → « 29 oct. → 13 nov. », trait du 1er nov. ; « × mois
entier » ; champs du … au … à 1280 (3 → 10 nov., les champs suivent les poignées) ; ✓ Payé (payé 696,80, à payer 0,00, Fixes
pleine, « Annuler ») puis Annuler (retour 296,80 / 400,00) ; sept. ; Matériel à part → Opérations filtrées sur la pièce ;
« à classer › » → étape 4 ; TVA → feuille remplie ; Stock au 31 déc. › → étape 3 ; Mois par mois ; Archives ; mois précédent ;
+ pièce ; fiche de la vente.

## Problèmes

1. **Bloquant — illisible, élément de g6 absent.** Annuel, brasserie complète : la pastille « Stock au 31 déc. ? » se pose sur
   le résultat ; « −506,40 » est coupé à mi-hauteur et « CHF perdus » a disparu (ann-complete-390-clair, ann-complete-1280-sombre).
   Dans g6, le nombre, puis « CHF perdus », puis la pastille du stock, empilés sans se toucher. Le brasseur : « on lit même plus
   combien je perds ».
2. **Bloquant — écart à s2ap2, valeur à la mauvaise date.** Le loyer porte « à payer · 25 nov. · dans 11 j », mais la frise
   dessine sa barre hachurée sur le 14 (« auj. 14 »), et la plage « 1er → 14 nov. » le compte : à payer 400,00, Fixes hachurée
   (ops-frise-*, ops-plage14-390-clair, ops-plage14-1280-clair, ops-annule-390-clair, ops-champs-1280-clair). À « 1er → 13 » il
   passe « hors plage · à payer 25 nov. » (ops-plage13-hors-390-clair) : la ligne donne le 25, l'écran trie sur le 14. Dans
   s2ap2, la barre hachurée est au 25 et « 1er → 15 nov. » donne loyer « hors plage », à payer 0,00. Correction : une pièce à
   payer se place à son échéance, dans la frise comme dans la plage.
3. **Bloquant — texte faux (ancien 4, non corrigé).** Archives : « Ni vente ni dépense sur tout l'historique » alors que
   l'historique compte cinq opérations ; la pilule dit « ‹ Aucune année archivée › » (opsr-archives-390-clair).
4. Mineur — geste sans retour visible : à « 1er → 14 nov. », la poignée Fin couvre le 14, seul jour qui a des opérations ; la
   frise paraît vide alors qu'elle annonce « 6 opérations » (ops-plage14-390-clair, ops-plage14-1280-clair).
5. Mineur — plage sans opération : un grand cadre hachuré « Ni vente ni dépense sur la période » remplace les piles (120 px à
   390, 210 px à 1280), état absent de v6a et de s2ap2 ; à cheval, le bout de l'axe dit « 27 » sans mois (27 nov.)
   (ops-plage13-hors-390-clair, ops-plage-prec-390-clair, ops-acheval-*, ops-champs-1280-clair).
6. Mineur — pas à sa place : le lien Matériel à part ouvre Opérations avec « Archives comprises », une puce « Local et travaux »
   (le nom de la pièce, pas « Matériel ») et des piles non filtrées (Ventes +5 695,00 au-dessus d'une liste qui n'a que le
   matériel) ; l'IA propose « Pourquoi les autres frais pèsent autant ? » (syn-materiel-390-clair).
7. Mineur — pas pratique : étape 4, la question est « charge ou matériel à amortir ? », les boutons sont « Matériel » et « La
   pièce » ; aucun bouton « Charge » (ann-etape4-390-clair).
8. Mineur — valeur incohérente : la ligne TVA dit « 5,7 % », sa feuille « 5 % du seuil de TVA » (ann-tva-390-clair,
   ann-tva-1280-sombre ; 5 695 / 100 000 = 5,7 %).
9. Mineur — écart à g6 dans l'état « à classer » (ancien 8, en partie) : la colonne Entré porte toujours un « ? » et « CHF :
   résultat en attente » ; le même 5 500,00 s'écrit trois fois (« + à classer 5 500,00 » en tête, « À classer 5 500,00 » dans
   Entré, « Local et travaux 5 500,00 » dans la colonne) (ann-repos-*).
10. Mineur — pas à sa place (ancien 6) : « + pièce » ouvre tout « Modifier l'écriture comptable » (catégorie, TVA, Montant HT
    « 5695 » sans séparateur), le justificatif est un bloc parmi dix (opsr-piece-390-clair).
11. Mineur — mois vide (ancien 11) : deux cartes vides disent la même chose, « Ni vente ni dépense sur le mois » puis « Aucune
    opération trouvée · octobre 2026 » (opsr-oct-390-clair).
12. Mineur — sens métier (ancien 13) : « Vente 10 × Bière · 75 cl » à 5 695,00, soit 569,50 CHF la bouteille, sans alerte
    (syn-nov-*, ann-repos-*, opsr-piece-390-clair, opsr-vente-390-clair). Donnée du banc ; l'écran ne la questionne pas.
13. Mineur — Mois par mois (ancien 14) : « Résultat · Entré · Dépensé » au-dessus d'une grille de 4 colonnes de mois, sans lien
    lisible avec elle (ann-mois-390-clair).
14. Mineur — illisible (ancien 15) : à 1280 sombre, « Doublons » désactivé, gris sur brun, se lit à peine (ops-paye-1280-sombre,
    ops-acheval-1280-sombre).

## Le test d'avant (df53ad3d, 15 problèmes)

1 corrigé : le lien Matériel ouvre la pièce (reste le n° 6). 2 corrigé : tête « Dépensé + usure 265,40 » puis « + à classer
5 500,00 », la colonne et Mois par mois disent la même chose. 3 corrigé : la feuille TVA se remplit (reste le n° 8). 4 non
corrigé (n° 3). 5 corrigé : le bandeau « Compagnon hors connexion » se pose au-dessus de la barre, il ne cache plus rien, en
défilant compris. 6 non corrigé (n° 10). 7 corrigé : Stock › mène à l'étape 3 « Inventaires ». 8 en partie (n° 9 ; plus de
« perte avant stock » dans cet état). 9 corrigé : la légende « payé » prend les couleurs vues. 10 corrigé : sept. garde deux
colonnes en pointillé, 0,00 écrit. 11 non corrigé (n° 11). 12 corrigé : « 10 pièces ». 13 non corrigé (n° 12, donnée du banc).
14 non corrigé (n° 13). 15 non corrigé (n° 14).

## Doutes (non comptés)

- À cheval (29 oct. → 13 nov.), aucune barre n'est visible au 14 hors de la plage, alors que le 14 porte six opérations ;
  peut-être sous le bord droit de la sélection.
- Le n° 2 vient d'un choix écrit dans `controle-frise.mjs` (« le loyer daté du 14 ») : le contrôle vérifie la règle inverse de
  la maquette ; à trancher par le pilote.
- Les captures du dossier qui ne sont pas au tableau (autres thèmes ou largeurs des mêmes états) n'ont pas été ouvertes : elles
  ne comptent pas.
