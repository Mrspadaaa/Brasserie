# v4 — le style se choisit sur tes chiffres

- **Chaleur** : tiède (la forme de l'approche, appliquée au choix du style).
- **Axes** : A3 (plages par style) ; A1 (nom en ligne) ; A4 (puces chiffrées) ; A2 (fermenteur en 30 cases d'un litre).
- **L'idée** : Six styles voisins en liste, chacun avec ses bandes OG, IBU, EBC sur une échelle commune ; la recette est un fil doré vertical qui traverse la liste : on voit quels styles l'attrapent.

## Baseline (acquis cochés)
- [x] En-tête commun : ‹, « Identité 1/7 », Abandonner, icône d'import, thème (repris de BrewWizard.tsx l. 2121, sans changement).
- [x] Fil des 7 étapes (WizardStepRail, libellés courts, barre active noire).
- [x] Bandeau Grain 8,6 kg · OG 1,080 · IBU ~93 (piste du style 60–100) · EBC 9,5 (pastille).
- [x] Lanceur + et pied « Retour · Suivant — Malts/sucres » : le pied est posé en bas du premier écran, le + dans son coin, sur aucune valeur (D164).
- Module commun : `v0/v1/commun.mjs` (classes préfixées par l'id, L26). Fabrique : `v4/fabrique.mjs` → `etat.html`.

## Honnêteté (J7)
- FG et alcool : inconnus (« — », piste hachurée), jamais 0 ; ils viennent de la levure (étape 4).
- « ~3 L évaporés » : le « ~ » marque l'estimation (repli 10 %/h possible, M1 non mesuré). Espace libre « ~20 % » : conseil, tireté sur la jauge.
- EBC du style : BJCP 2021 en SRM 6–14, converti ×1,97 en 12–28 EBC (conversion d'affichage, dite dans la légende ou le détail).
- Plages 22A tirées de `src/data/brewingStylesBootstrap.json` ; recette de démonstration du brief.

## Contrôles du lot (joués une fois sur v1 à v6)
- `verifier-page.mjs … --min-images 0` : PAGE OK (390 px, sans erreur).
- `mots-premier-ecran.mjs --max=80` : v4 69 mots ; MOTS OK 6/6.
- `controle-panel.mjs` (6 premiers écrans) : remplissage médian 0,66, 0 sous 0,50 ; ressemblance 0,76 ; 0/15 paires presque identiques → PANEL OK.
- `controle-commun.mjs --sans=mots` (sortie : `v0/v1/commun-sortie.txt`) : couleurs OK, survol OK, blocs OK, contraste OK, legende OK, parlant OK, brutes OK ; ECHEC : au-style, fiche, trait (propres aux écrans houblons : aucun houblon, aucune famille sur Identité) et standard (S3 : rayons 10/16 px de DESIGN.md contre l'échelle 2/4/8 du contrôle ; S4 : le + commun à 2 px). Défauts connus du contrôle (D202).
- `controle-choix.mjs --registre` : REGISTRE OK (8 écrans) ; Identité n'y est pas : aucun choix à reprendre, la baseline est l'écran de production.
- `impeccable detect` : aucun contraste en défaut après correction ; reste des hex en dur (page statique, valeurs du thème clair) et des rayons hors jetons du détecteur.
- `type="number"` : 0 (grep).
- Toucher d'un booster (script R6 léger) : capture `v4-apres.png`, l'écran change.
- Captures : `v4-haut.png` (premier écran, ouvert), `v4-page.png` (page entière, avec les autres états), `v4-apres.png`.

## Boosters UX (boosters-ux)
- styles-sur-chiffres (style-22A …) — choisir ; liste radio ; bandes vertes si elles attrapent le fil, contour sinon ; effet : la ligne touchée devient la ligne noire choisie
- volume, ebullition — puces chiffrées
- nolo — interrupteur dans sa puce
- fermenteur — 30 cases, 24 pleines, conseil marqué
- du-style — puces
- B1 OK : boosters marqués `data-booster` ; avant/après du toucher différents (style-21C).
- B2 OK : dominante, la ligne noire « Double IPA » traversée par trois fils dorés ; une action principale (Suivant, noir).
- B3 OK : 69 mots au premier écran (80 au plus), aucune phrase explicative au repos ; détail à un toucher (légende « ? », lignes dépliables, espace libre ⌄).
- B4 OK : deux groupes, la bière puis le brassin ; pas de carte dans une carte.
- B5 s.o. : écarts non mesurés (R2) en v0.
- B6 OK sur la capture : Source Sans 3 pour ce qui se dit, IBM Plex Mono pour les mesures ; aucun texte sous 12 px ; tailles non comptées (R4).
- B7 OK : contraste OK (controle-contraste) ; COULEURS OK (or de la bière, vert du houblon « dans la plage », bleu de l'eau pour l'évaporation) ; une seule couleur d'exception (ambre « pâle »).
- B8 OK : états dessinés sous le premier écran (recette neuve : « Coller une recette, ou choisir un style », bandes sans fil) ; inconnu hachuré ou « — », jamais 0. Hors ligne et chargement : s.o. (page statique, aucune donnée réseau).
- B9 partiel : retour `:active` sous le doigt ; délai non mesuré ; `prefers-reduced-motion` coupe les transitions.
- B10 OK : 0 `type="number"` ; `inputmode="decimal"` ou `numeric` ; valeur dans le champ.
- B11 : « Ma neipa v3 entre en Double IPA pour la densité et l'amertume ; seule la Hazy IPA attrape sa couleur. »
- B12 OK : un seul chevron ⌄, rayons 10 et 16 px (DESIGN.md), icônes au trait d'une seule famille (lucide).
- B13 partiel : cibles de 24 px au moins sur la capture (« ? » 24, puces 28, lignes ≥ 26) ; non mesuré (R5).

## Ce qui tient
- Répond à « quelle bière » par les chiffres, pas par un nom : la Hazy IPA attrape la couleur, la Double IPA l'amertume, un vrai savoir pour une recette nommée « neipa ».
- Aucun chiffre de la recette répété : le fil porte la valeur du bandeau.

## Ce qui casse
- FG et alcool absents de la liste (inconnus) : seulement trois grandeurs.
- Échelle commune serrée (66 px par colonne) : les bandes étroites (IBU 21C) se lisent mal ; l'OG de 22C est coupée à 1,110.
