# v2 — chiffre contre chiffre

- **Chaleur** : froide (affine la baseline).
- **Axes** : A3 (vraies valeurs en table) ; A1 (nom et style sur une ligne) ; A4 (tuiles) ; A6 (import seulement sur recette vide).
- **L'idée** : Une fiche du style en vraies valeurs : chaque chiffre de la recette tombe dans sa colonne, sous le style, dans le style (colonne verte 22A) ou au-dessus, entre les bornes min et max.

## Baseline (acquis cochés)
- [x] En-tête commun : ‹, « Identité 1/7 », Abandonner, icône d'import, thème (repris de BrewWizard.tsx l. 2121, sans changement).
- [x] Fil des 7 étapes (WizardStepRail, libellés courts, barre active noire).
- [x] Bandeau Grain 8,6 kg · OG 1,080 · IBU ~93 (piste du style 60–100) · EBC 9,5 (pastille).
- [x] Lanceur + et pied « Retour · Suivant — Malts/sucres » : le pied est posé en bas du premier écran, le + dans son coin, sur aucune valeur (D164).
- Module commun : `v0/v1/commun.mjs` (classes préfixées par l'id, L26). Fabrique : `v2/fabrique.mjs` → `etat.html`.

## Honnêteté (J7)
- FG et alcool : inconnus (« — », piste hachurée), jamais 0 ; ils viennent de la levure (étape 4).
- « ~3 L évaporés » : le « ~ » marque l'estimation (repli 10 %/h possible, M1 non mesuré). Espace libre « ~20 % » : conseil, tireté sur la jauge.
- EBC du style : BJCP 2021 en SRM 6–14, converti ×1,97 en 12–28 EBC (conversion d'affichage, dite dans la légende ou le détail).
- Plages 22A tirées de `src/data/brewingStylesBootstrap.json` ; recette de démonstration du brief.

## Contrôles du lot (joués une fois sur v1 à v6)
- `verifier-page.mjs … --min-images 0` : PAGE OK (390 px, sans erreur).
- `mots-premier-ecran.mjs --max=80` : v2 80 mots ; MOTS OK 6/6.
- `controle-panel.mjs` (6 premiers écrans) : remplissage médian 0,66, 0 sous 0,50 ; ressemblance 0,76 ; 0/15 paires presque identiques → PANEL OK.
- `controle-commun.mjs --sans=mots` (sortie : `v0/v1/commun-sortie.txt`) : couleurs OK, survol OK, blocs OK, contraste OK, legende OK, parlant OK, brutes OK ; ECHEC : au-style, fiche, trait (propres aux écrans houblons : aucun houblon, aucune famille sur Identité) et standard (S3 : rayons 10/16 px de DESIGN.md contre l'échelle 2/4/8 du contrôle ; S4 : le + commun à 2 px). Défauts connus du contrôle (D202).
- `controle-choix.mjs --registre` : REGISTRE OK (8 écrans) ; Identité n'y est pas : aucun choix à reprendre, la baseline est l'écran de production.
- `impeccable detect` : aucun contraste en défaut après correction ; reste des hex en dur (page statique, valeurs du thème clair) et des rayons hors jetons du détecteur.
- `type="number"` : 0 (grep).
- Toucher d'un booster (script R6 léger) : capture `v2-apres.png`, l'écran change.
- Captures : `v2-haut.png` (premier écran, ouvert), `v2-page.png` (page entière, avec les autres états), `v2-apres.png`.

## Boosters UX (boosters-ux)
- tableau-style (ligne-OG … ligne-EBC) — comparer ; table à zones ; effet : le détail de la ligne s'ouvre
- volume, ebullition, fermenteur — lire, ajuster ; tuiles noires, grand chiffre ; jauge 24/30 et tireté du conseil
- nolo — choisir ; case (baseline)
- espace-libre — dépliage ⌄
- du-style — puces
- B1 OK : boosters marqués `data-booster` ; avant/après du toucher différents (ligne-FG).
- B2 OK : dominante, la colonne verte « 22A » de la table ; une action principale (Suivant, noir).
- B3 OK : 80 mots au premier écran (80 au plus), aucune phrase explicative au repos ; détail à un toucher (légende « ? », lignes dépliables, espace libre ⌄).
- B4 OK : deux groupes, la bière puis le brassin ; pas de carte dans une carte (la table est un bloc blanc dans le panneau, pas une carte en relief).
- B5 s.o. : écarts non mesurés (R2) en v0.
- B6 OK sur la capture : Source Sans 3 pour ce qui se dit, IBM Plex Mono pour les mesures ; aucun texte sous 12 px ; tailles non comptées (R4).
- B7 OK : contraste OK (controle-contraste) ; COULEURS OK (or de la bière, vert du houblon « dans la plage », bleu de l'eau pour l'évaporation) ; une seule couleur d'exception (ambre « pâle »).
- B8 OK : états dessinés sous le premier écran (recette neuve avec « Coller une recette trouvée » et bornes sans valeur, fermenteur plein, style créé sans bornes) ; inconnu hachuré ou « — », jamais 0. Hors ligne et chargement : s.o. (page statique, aucune donnée réseau).
- B9 partiel : retour `:active` sous le doigt ; délai non mesuré ; `prefers-reduced-motion` coupe les transitions.
- B10 OK : 0 `type="number"` ; `inputmode="decimal"` ou `numeric` ; valeur dans le champ.
- B11 : « Ma recette tient dans les bornes de la Double IPA sauf la couleur, plus pâle que 12 EBC ; le brassin fait 24 L sur 30. »
- B12 OK : un seul chevron ⌄, rayons 10 et 16 px (DESIGN.md), icônes au trait d'une seule famille (lucide).
- B13 partiel : cibles de 24 px au moins sur la capture (« ? » 24, puces 28, lignes ≥ 26) ; non mesuré (R5).

## Ce qui tient
- Les vraies valeurs, que le brasseur réclame (« meilleur vu de comparaison sur des vrai valeur »), sans graphique à apprendre.
- L'import ne revient que sur une recette vide (C084 : pas de doublon).

## Ce qui casse
- 80 mots : au plafond.
- Tuiles noires : masse forte, la case NOLO paraît vide ; la teinte d'eau claire (#8FC3E6) sur tuile noire est hors jetons.
- Valeurs répétées avec le bandeau (J4), comme v1.
