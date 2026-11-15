OK — 15 problèmes, 4 bloquants

# Test d'écran — Finances (Opérations v6a, Synthèse g3a, Annuel g6)

Version : df53ad3d (arbre propre). Banc local `?dev-local&finance-demo=reel` (états de la vraie app) et `?dev-local&finance-demo`
(brasserie complète, seul jeu avec une pièce à payer). Captures : `critique/test-ecran/`. Aucun code modifié.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| syn-390-clair-haut / -bas | clair | 390 | Synthèse nov., réel | 2, 5, 9 | 2 |
| syn-390-cave-haut / -bas | cave | 390 | idem | 2, 5, 9 | 2 |
| syn-1280-clair-haut, syn-1280-cave-haut | les deux | 1280 | idem | 2, 9 | 2 |
| ops-390-clair-haut / -bas, ops-390-cave-* | les deux | 390 | Opérations nov., réel | 2, 13 | 2 |
| ops-1280-clair-haut, ops-1280-cave-haut | les deux | 1280 | idem | 2, 13 | 2 |
| ann-390-clair-haut / -bas, ann-390-cave-* | les deux | 390 | Annuel, « à classer » | 2, 5, 8 | 2 |
| ann-1280-clair-haut, ann-1280-cave-haut | les deux | 1280 | idem | 2, 8 | 2 |
| g01 … g16 (Opérations, gestes) | clair | 390 | …, mois, recherche, + pièce, ligne, Pourquoi, Par date, Filtres, Doublons, Apport, Archives, ‹ › | 4, 5, 6, 11, 12 | 4 |
| g20 … g33 (Synthèse, gestes) | clair | 390 | sept., tout, nov., …, Pourquoi ?, segments, Revoir, Solde, Estimer, Fournisseurs, Compagnon | 1, 5, 10 | 1 |
| g40 … g51 (Annuel, gestes) | clair | 390 | 2026, Mois par mois, à classer ›, Stock ›, colonne, Continuer, étapes 1/4/9, Impôts, TVA, Dossier | 2, 3, 5, 7, 14 | 2, 3 |
| k06-ann-tva | clair | 390 | TVA touchée, 2,7 s d'attente | 3 | 3 |
| K02-ops-paye, K03-ops-annuler (k01) | cave | 1280 | brasserie complète : ✓ Payé puis Annuler | 15 | — |
| k04-syn-complete, k05-ann-complete, G01–G07 | cave | 1280 | brasserie complète ; Continuer ; à classer › | — | — |

Gestes qui marchent (vus) : ✓ Payé (loyer 400,00 : payé 696,80, à payer 0,00, barre Fixes pleine, « Annuler ») puis Annuler (retour
« à payer · 25 nov. · dans 11 j ») ; ‹ › du mois ; … (du / au) ; choix du mois ; recherche ; Par date ; Filtres ; Apport ; segments
Brassage et Vente → Opérations filtrées ; Pourquoi ? (réponse sourcée, sans IA) ; Continuer → 1 / 9 ; « à classer › » et la colonne
hachurée → étape 4 ; étapes 1, 4, 9 ; Impôts → 8 / 9 ; Dossier → 9 / 9 ; Solde ; Estimer ; Compagnon.

## Problèmes

1. **Bloquant — valeur fausse.** Synthèse : toucher « Matériel 5 500,00 à part » ouvre Opérations filtrées « Matériel » : « Aucune
   opération trouvée · novembre 2026 · Matériel », alors que « Local et travaux 5 500,00 » est rangée sous « Matériel · à part » dans
   la même liste (g26-syn-materiel.png ; comparer ops-390-clair-haut.png).
2. **Bloquant — valeur contradictoire.** Les 5 500,00 « Local et travaux » comptent de quatre façons : Synthèse « Matériel à part »
   (syn-390-clair-haut) ; tête de l'Annuel « Dépensé + usure 265,40 » au-dessus d'une colonne qui dessine 5 765,40 « à classer »
   (ann-390-clair-haut, ann-1280-clair-haut) ; Mois par mois « dans l'année, il compte en charge », nov. +5 429,60 (g41-ann-mois) ;
   étape 8 « ventes 5 695,00 − dépensé 5 765,40 » (g49-ann-impots). Dans le seul onglet Annuel, deux « dépensé » différents.
   Le brasseur : « le chiffre en haut colle pas à la colonne ».
3. **Bloquant — geste sans effet.** Annuel › TVA : la feuille s'ouvre vide, seulement « TVA » et ×, même après 2,7 s
   (k06-ann-tva.png, g50-ann-tva.png).
4. **Bloquant — texte faux.** Opérations › Archives : « Ni vente ni dépense sur tout l'historique » alors que l'historique compte
   5 opérations ; le sélecteur de mois devient « ‹ Aucune année archivée › » (g11-ops-archives.png).
5. Mineur — le bandeau « Compagnon hors connexion · mode local » se pose sur le contenu à 390 : il cache « Comprendre mes dépenses »
   (syn-390-clair-haut), la valeur TVA (ann-390-clair-haut), Filtres / Apport / Archives (g01, g03), « Toutes catégories » (g08), le
   texte de l'étape 8 (g49) et « Pourquoi » de Revoir le mois (g28).
6. Mineur — pas à sa place : « + pièce » ouvre tout « Modifier l'écriture comptable » (catégorie, TVA, Montant HT « 5695 »
   sans séparateur) ; la zone « Attacher un justificatif » est en bas, sous le pli (g04-ops-plus-piece.png).
7. Mineur — écart à g6 : « Stock au 31 déc. ? › » ouvre l'ancien formulaire « Inventaire et clôture 2026 » (lignes US05, Munich à 0),
   pas l'étape 3 « Inventaires » de la piste, alors que « à classer › » mène bien à l'étape 4 (g43-ann-stock.png).
8. Mineur — écart à g6 dans l'état « à classer » : le résultat quitte la colonne Entré ; un « ? » brun et « CHF : résultat en
   attente » flottent au-dessus, deux étiquettes pointillées empilées décalent les colonnes ; « sans lui, perte avant stock »
   alors qu'aucune perte n'est affichée (ann-390-clair-haut ; g6 et k05-ann-complete gardent le résultat dans le haut de l'Entré).
9. Mineur — écart à g3a : légende « payé » à pastille grise, couleur d'« Autres frais » ; g3a la peint de la couleur des charges
   payées (syn-390-clair-haut, syn-1280-cave-haut).
10. Mineur — Synthèse en septembre (rien) : « Entré 0,00 · Dépensé 0,00 » flottent au milieu d'un grand vide ; l'annexe de g3a garde
    la colonne Entré en pointillé, « 0,00 » écrit (g20-syn-sept.png).
11. Mineur — mois vide (octobre) : deux cartes vides disent la même chose, « Ni vente ni dépense sur le mois » puis « Aucune
    opération trouvée · octobre 2026 » (g13-ops-mois-prec-0.png).
12. Mineur — fiche de la vente : « 10 pièce » (g05-ops-ligne.png).
13. Mineur — sens métier : « Vente 10 × Bière · 75 cl » à 5 695,00, soit 569,50 CHF la bouteille, sans aucune alerte
    (ops-390-clair-haut, g05). Donnée du banc (`src/dev/financeDemo.ts` l. 72, « imite la vraie app ») ; l'écran ne la questionne pas.
14. Mineur — Mois par mois : « Résultat · Entré · Dépensé » au-dessus d'une grille de 4 colonnes de mois, sans lien lisible
    avec elle (g41-ann-mois.png).
15. Mineur — illisible : à 1280 cave, « Doublons » désactivé, gris sur noir, se lit à peine (K02-ops-paye.png).

## Doutes (non comptés)

- ✓ Payé et Annuler à 390 clair : joués, même effet au journal qu'à 1280 cave, mais leurs captures `k0*` ont été écrasées par
  `K0*` (Windows ignore la casse) : k01 à k05 sont du 1280 cave. DEMANDE EXECUTANT si une preuve visuelle à 390 est exigée :
  rejouer `?dev-local&finance-demo`, Opérations, ✓ Payé puis Annuler, 390 clair, sous des noms distincts.
- Aucun jeu de banc n'a une pièce à payer ET « à classer » : la ligne « ✓ Payé » n'est vue qu'avec la brasserie complète.
- « Origine et limites des montants » (Synthèse) : pas trouvé comme bouton, non touché.
- Synthèse ajoute « Revoir le mois » et « Origine et limites des montants », absents de g3a : baseline probable.
- Revoir le mois porte une pastille « exemple » sur les données « reel » (g28).
- Le bandeau du point 5 n'apparaît peut-être qu'en `?dev-local` hors ligne.
