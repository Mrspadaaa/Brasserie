OK — 9 problèmes, 0 bloquants

# Test d'écran — Finances (Opérations v6a + frise s2ap2, Synthèse g3a, Annuel g6)

Version : c193cf8c (arbre propre, aucun code modifié ; le serveur local sert bien c193cf8c : `joursDeCompte`, `ann-stock-why`,
`pctSeuil` présents dans les modules servis). Banc local `?dev-local&finance-demo` (brasserie complète) et
`?dev-local&finance-demo=reel` (vraie app). 390 tactile (Puppeteer mobile) et 1280 ; clair et sombre (`cave`). Gestes joués au
clavier sur les poignées (`role=slider`) et par les champs date à 1280. Aucune erreur de page sur toutes les passes.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| ops-frise-390-clair.png | clair | 390 | frise dépliée | 0 | 0 |
| ops-plage14-390-clair.png | clair | 390 | plage 1er → 14, loyer hors plage | 0 | 0 |
| ops-plage14-1280-sombre.png | sombre | 1280 | plage 1er → 14, loyer hors plage | 0 | 0 |
| ops-plage25-1280-clair.png | clair | 1280 | plage 1er → 25, loyer dans la plage | 0 | 0 |
| ops-plage-prec-390-clair.png | clair | 390 | ‹ en plage (19 → 31 oct.) | 1 | 0 |
| ops-acheval-390-sombre.png | sombre | 390 | à cheval 29 oct. → 13 nov. | 2 | 0 |
| ops-acheval-1280-sombre.png | sombre | 1280 | à cheval 29 oct. → 13 nov. | 2 | 0 |
| ops-champs-1280-clair.png | clair | 1280 | champs du … au … (3 → 10 nov.) | 1 | 0 |
| ops-paye-390-clair.png | clair | 390 | ✓ Payé | 0 | 0 |
| ops-paye-1280-sombre.png | sombre | 1280 | ✓ Payé | 0 | 0 |
| ops-annule-390-sombre.png | sombre | 390 | Annuler | 0 | 0 |
| opsr-repos-1280-clair.png | clair | 1280 | Opérations repos, réel | 1 | 0 |
| opsr-oct-390-clair.png | clair | 390 | mois vide (oct.) | 0 | 0 |
| opsr-archives-390-sombre.png | sombre | 390 | Archives | 1 | 0 |
| opsr-piece-390-clair.png | clair | 390 | + pièce | 2 | 0 |
| syn-nov-390-clair.png | clair | 390 | Synthèse nov., réel | 1 | 0 |
| syn-complete-390-sombre.png | sombre | 390 | Synthèse nov., brasserie complète | 0 | 0 |
| syn-materiel-390-clair.png | clair | 390 | lien Matériel à part | 1 | 0 |
| ann-complete-390-clair.png | clair | 390 | Annuel tête complète | 0 | 0 |
| ann-complete-1280-sombre.png | sombre | 1280 | Annuel tête complète | 0 | 0 |
| ann-repos-390-sombre.png | sombre | 390 | Annuel tête « à classer » | 2 | 0 |
| ann-tva-390-clair.png | clair | 390 | TVA | 0 | 0 |
| ann-etape4-390-clair.png | clair | 390 | à classer › étape 4 | 1 | 0 |
| ann-mois-1280-sombre.png | sombre | 1280 | Mois par mois | 1 | 0 |

Bloquants : 0

Gestes vus et justes : déplier la frise ; poignée Fin → « ‹ 1er → 14 nov. › » : loyer « hors plage · à payer 25 nov. », à payer
0,00, dépensé 296,80, 5 opérations ; champs 1er → 25 nov. : loyer dans la liste, Fixes hachurée, à payer 400,00, 6 opérations ;
‹ › glissent la plage de 13 jours (19 → 31 oct., retour 1er → 13) ; Début poussé → « 29 oct. → 13 nov. » ; « × mois entier » ;
champs 3 → 10 nov. ; ✓ Payé (la barre hachurée du 25 revient au 14, payé 696,80, à payer 0,00, Fixes pleine, « Annuler ») puis
Annuler (retour 296,80 / 400,00, barre au 25) ; Matériel à part → Opérations filtrées ; TVA → feuille ; Mois par mois ;
« à classer › » → étape 4 ; mois précédent ; Archives ; + pièce.

## Problèmes

1. Mineur — à cheval (29 oct. → 13 nov.), la frise ne montre plus le 14 : ni la barre des six opérations du jour, ni « auj. 14 »,
   alors que la fenêtre va jusqu'au 27 ; le bout de l'axe dit « 27 » sans mois (27 nov.) (ops-acheval-390-sombre,
   ops-acheval-1280-sombre). Ancien 5 en partie et ancien doute, confirmé à 1280 où le 14 tombe juste à côté de la poignée du 13.
2. Mineur — plage sans opération : un grand cadre hachuré « Ni vente ni dépense sur la période » prend la place des piles (120 px
   à 390, 210 px à 1280), état absent de v6a et de s2ap2 (ops-plage-prec-390-clair, ops-acheval-*, ops-champs-1280-clair).
   Ancien 5, non corrigé.
3. Mineur — Archives sans année : « Aucune année archivée » écrit trois fois, dans la pilule (entre ‹ › qui ne mènent à rien),
   dans la carte et dans la liste « Année archivée » (opsr-archives-390-sombre). Le texte est juste (ancien bloquant 3 corrigé) ;
   la redite est nouvelle.
4. Mineur — pas à sa place (ancien 6) : le lien Matériel à part ouvre Opérations avec « Archives comprises », une puce « Local et
   travaux » (nom de la pièce, pas « Matériel »), des piles non filtrées (Ventes +5 695,00 au-dessus d'une liste qui n'a que le
   matériel) et « Pourquoi les autres frais pèsent autant ? » (syn-materiel-390-clair).
5. Mineur — pas pratique (ancien 7) : étape 4, la question est « charge ou matériel à amortir ? », les boutons sont « Matériel »
   et « La pièce » ; aucun bouton « Charge » (ann-etape4-390-clair).
6. Mineur — écart à g6 dans l'état « à classer » (ancien 9) : « ? » et « CHF : résultat en attente » dans la colonne Entré, et le
   même 5 500,00 écrit trois fois (« + à classer » en tête, « À classer » dans Entré, « Local et travaux » dans la colonne)
   (ann-repos-390-sombre).
7. Mineur — pas à sa place (ancien 10) : « + pièce » ouvre tout « Modifier l'écriture comptable » (catégorie, TVA, Montant HT
   « 5695 » sans séparateur) ; le justificatif est un bloc parmi dix (opsr-piece-390-clair).
8. Mineur — sens métier (ancien 12) : « Vente 10 × Bière · 75 cl » à 5 695,00, soit 569,50 CHF la bouteille, sans alerte
   (syn-nov-390-clair, ann-repos-390-sombre, opsr-repos-1280-clair, opsr-piece-390-clair). Donnée du banc ; l'écran ne la
   questionne pas.
9. Mineur — Mois par mois (ancien 13) : « Résultat · Entré · Dépensé » au-dessus d'une grille de 4 colonnes de mois, sans lien
   lisible avec elle (ann-mois-1280-sombre).

## Les 14 points d'avant (c398e064)

1 corrigé : « −506,40 », « CHF perdus », puis la puce « Stock au 31 déc. ? », empilés sans se toucher, 390 clair et 1280 sombre.
2 corrigé : barre hachurée du loyer au 25 ; 1er → 14 : loyer hors plage, à payer 0,00 ; 1er → 25 : loyer compté, à payer 400,00 ;
payé, la barre revient au 14 ; Annuler la remet au 25. 3 corrigé : « Aucune année archivée. » (reste la redite, n° 3). 4 corrigé en
partie : la barre du 14 se voit à travers l'anneau translucide à 390 clair ; à 1280 sombre, à peine (doute). 5 non corrigé (n° 1
et 2). 6 non corrigé (n° 4). 7 non corrigé (n° 5). 8 corrigé : ligne et feuille « 5,7 % » (et « 0,7 % » à la brasserie
complète). 9 non corrigé (n° 6). 10 non corrigé (n° 7). 11 corrigé : une seule carte « Ni vente ni dépense sur le mois », puis
« Voir toutes les opérations ». 12 non corrigé (n° 8). 13 non corrigé (n° 9). 14 corrigé : « Doublons » désactivé, en contour, se
lit en sombre comme en clair.

Régressions : aucune bloquante ; seule la redite d'Archives (n° 3) est nouvelle.

## Doutes (non comptés)

- « Doublons » désactivé, en contour, ressemble plus à un bouton actif que ses voisins remplis : le brasseur pourrait y taper.
- Plage 19 → 31 oct. : le loyer de novembre s'affiche « hors plage » sous Charges fixes, mais pas les opérations du 14 nov. ;
  logique (une pièce à payer reste en vue), mais surprenant dans une plage d'octobre.
- Plage 1er → 25 : la poignée du 25 couvre la barre hachurée du loyer, comme au point 4 pour le 14.
- Les captures du dossier absentes du tableau (autres thèmes ou largeurs des mêmes états) n'ont pas été ouvertes : elles ne comptent
  pas.

Pilote : vu (14.11, ops-plage14-390-clair, ann-complete-390-sombre et le tableau ; mineurs 1 à 9 laissés ouverts, listés dans MISSION.md)
