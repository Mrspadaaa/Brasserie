# voie-p2-b3 — passe 2 de b3 (l'orgue des rubriques)

b3p2 · L'orgue des rubriques, fini · chaude · problèmes réglés : critique b3 n° 1, 2, 3 ; retouches de candidate 1 à 3 ; retouches communes ; défauts INVENTAIRE n° 10, 11, 12, 13 · ce qui disparaît ou bouge : Fût et Matériel passent sous « Article › » (plateau d'un toucher) ; le Compagnon passe dans la colonne Bord, élargie, avec son état « hors connexion » ; la pastille flottante disparaît ; le toast se range au-dessus de la barre ; à 1280, la barre du bas devient une barre latérale où l'orgue se déplie sous sa rubrique, et les sous-onglets d'une rubrique y descendent.

## Corrections faites
1. Case Compagnon dans l'écran : la colonne Bord passe à 72 px (les autres 62), la case à 68 px ; mesure au rendu : aucune case à moins de 6 px du bord, aucun libellé qui déborde (sortie de `fabrique.mjs`).
2. Trois étages au plus : sommet de l'orgue à 216 px du bas (contre 480 px en v0) ; 288 px quand « Article › » est déplié (Stock, Fûts, Matériel).
3. Stocks : Houblon, Courses, Article › (bas → haut) ; Fût et Matériel dans le plateau d'Article ›, déplié d'office sur Stock, Fûts et Matériel pour que l'action de l'écran reste à un toucher.
4. Créations neuves marquées (proposé) ci-dessous.
5. Dates : samedi 14.11.2026 ; B-031 brassé mar. 10.11, donc J+4 ; B-032 prévu sam. 21.11 ; Citra T90 1,2 kg partout (Bord, Articles, Courses, Houblons, 1280).
6. Vente d'exemple plausible : « Vente Marché d'automne · 160 bouteilles à 4,00 · +640,00 ».
7. Plex Mono pour les chiffres seulement (densités, dates, montants, masses) ; libellés en Source Sans 3.
8. En-tête de l'app tel quel (logo, lune ou soleil, loupe, ⋮ ; « Ce mois ▾ » à 1280) ; barre : mêmes 5 onglets, mêmes pictos, + noir (ambre en cave) à droite, toujours au même endroit.
9. Sous-onglet réel « Volumes » (et non « Calculateur ») ; Stocks : Articles · Courses · Fûts · Matériel · Houblons ; Clients : Clients · Impôt bière · Prix et marges (libellés de `ProductionTab`, `StocksTab`, `ClientsTab`).
10. Greffes de b1 : « hors connexion » écrit dans l'entrée Compagnon (case en pointillé, nuage barré), plus de pastille flottante ; toast « Mesure enregistrée · B-031 · 1,018 » rangé au-dessus de la barre, sans toucher l'en-tête ni les sous-onglets ; à 1280, barre latérale et lettres N (action de l'écran), E, F, V, plus C pour le Compagnon.
11. 1280 : l'orgue se déplie dans la barre latérale, sous Brassins (Brassin N · Recette · Idée, puis E Écriture · F Facture · V Vente) : il ne cache plus le tableau (en v0 il couvrait B-031) ; écran rempli (8 conditionnés, courbe de densité B-031, prochain brassage, cuves).
12. État « a » : Brassins rempli jusqu'à la barre (2 en cuve, 1 planifié, 8 conditionnés), barre au repos.
13. Planche `b3p2-ecrans-390.png` : le + ouvert sur les 12 écrans, action de l'écran pleine à sa place : Bord et Finances → Écriture ; Brassins → Brassin ; Recettes → Recette ; Atelier → Idée (un seul + : celui de la barre, plus de + noir dans l'écran) ; Volumes → aucune case pleine (BX-4 : rien à créer) ; Stock → Article ; Courses → Courses (copier la liste) ; Fûts → Fût ; Matériel → Matériel ; Houblons → Houblon ; Clients → Client. Impôt bière : comme Volumes (non dessiné).

## (proposé) — ce qui n'existe pas dans l'app aujourd'hui
- L'orgue lui-même (colonnes par rubrique au-dessus des onglets) et le plateau « Article › ».
- Créations de Stocks et de Clients depuis n'importe quel écran (aujourd'hui seulement par l'action de l'écran) ; « Courses » (copier la liste) hors de l'écran Courses ; « Idée » hors de l'Atelier ; Tarif hors de Prix et marges.
- Barre latérale à 1280 avec un + par rubrique ; raccourcis clavier N, E, F, V, C.
- Courbe de densité B-031 et carte « Cuves » au 1280 (contexte, hors portée de la mission).

## Rien de perdu
- Lignes du + d'aujourd'hui : Nouvelle écriture (Écriture), Entrer une facture (Facture), Encaisser une vente (Vente), Créer une recette (Recette), Lancer un brassin (Brassin), Compagnon brasseur (Compagnon), action de l'écran (case pleine) : toutes présentes. Libellés abrégés à un mot dans les cases.
- Onglets Bord · Finances · Brassins · Stocks · Clients et pastille Stocks « 3 » gardés.

## Boosters UX (boosters-ux)
- Boosters : `orgue` (le + et le + de rubrique au 1280) : déclencher et se repérer, colonnes par rubrique, action de l'écran pleine (captures a puis b) ; `orgue-sous` (Article ›) : déclencher, plateau d'un toucher (planche : Stock, Fûts, Matériel).
- B2 OK : une case pleine par état (l'action de l'écran) ; Volumes aucune, voulu.
- B3 OK : aucune légende ajoutée ; un mot par case.
- B6 OK : tailles 12 / 14 / 16 ; chiffres en Plex Mono.
- B8 OK : hors connexion dessiné dans l'entrée Compagnon (390 et 1280).
- B13 OK : cases 58 à 68 × 52 px, aucun chevauchement (mesure au rendu).
- Écart voulu : B5, colonne Bord à 72 px au lieu de 62, pour que « Compagnon » tienne avec 4 px de marge.

## Jugement
- La plus lisible des passes de la barre : chaque création reste au-dessus de sa rubrique, et l'action de l'écran se voit sans lire.
- Risque : 13 cases au premier coup d'œil ; c'est le prix de l'ordre fixe.
- À 1280, l'orgue latéral ne cache plus rien ; à confirmer avec la navigation de m2 et de r3.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune

## Relance après rejet du critique (14.11)
1. Échelle 20 L : chaque conditionné = 58 bouteilles de 33 cl, 1 fût de 20 L, ou 1 fût de 10 L + 29 bouteilles (Brassins, 1280, planche). Fûts : F-01 chez Bar du Tilleul (B-023), F-02 plein B-028, F-03 plein B-027 (10 L), F-04 à F-06 propres. Clients : dernière vente en octobre, montants à cette échelle.
2. Toast réel : « Mesure enregistrée · B-031 · 1,018 ».
3. Données communes (d3p2) : Ventes du mois = Vente Marché d’automne 640,00 CHF (128 bouteilles à 5,00, ven. 13.11), solde −406,40 CHF ; badge Stocks 1 (Citra seul au seuil ; Courses et Articles alignés) ; Citra T90 α 12,8 % ; IPA Nelson 6,4 %.
4. Matériel : cuve de brassage 45 L (40 L utiles), fermenteurs 30 L. Volumes : IPA Nelson 20 L → 25 L (tient dans la cuve et le fermenteur), malt 5,0 → 6,25 kg, eau 15,0 → 18,8 et 18,7 L.
5. Mono pour les chiffres seulement : M() n’enveloppe plus que les nombres ; unités et mots (CHF, L, kg, %, °C) en sans partout ; T° en sans à 390 et à 1280.
6. « 6 houblons au stock » remplacé par « froment à commander » (B-032 Blanche, cohérent avec Courses). L’orgue ouvert couvre encore les derniers conditionnés : prix de l’ordre fixe, assumé.
