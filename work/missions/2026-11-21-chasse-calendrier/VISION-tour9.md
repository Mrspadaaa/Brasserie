OK — 16 problèmes, 3 bloquants

# Vision du Calendrier avant mise en ligne (tour 9, 21.11, D343 et D344)

Version : b17062ff5 (port-carnet, claude/port-carnet-1711), **plus le correctif de `CalendrierTab.tsx` pris dans l'arbre de travail de
port-carnet** (11 lignes ajoutées et 12 retirées, non commité), sans lequel HEAD ne se construit pas (problème 1). Build de test
(`scripts/parcours/vite.parcours.config.mjs`, `VITE_HOP_V4=on VITE_CARNET_IA=production`) depuis un worktree détaché dans os.tmpdir(),
avec des jonctions node_modules. `?dev-local&finance-demo=parcours-calendrier`, fixture `scripts/parcours/fixtures/calendrier.mjs` + « ZZ TEST Geste ».
Jamais seedData ni Gemini. Gestes : 390 tactile (toucher CDP), 1280 souris, 390×660 et 844×340 ; thèmes clair et cave.
Captures et journaux : `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/vt9/cap/`
(`<largeur>-<thème>-[h<hauteur>-]<n°>-<état>.png`), journaux `v-*.log`, planches `m/*.png`. Référence : `calendrier-fiche/captures/v02-repos.jpg`, `v02-edition.jpg`.

## Table

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| 01-repos, 02 à 04 défiler | clair, cave | 390 | repos, défilement | 8, 15 | 0 |
| 05-menu | clair, cave | 390, 1280, 660 | menu de période | 7 | 0 |
| 06 à 13 échelles (2 sem., 6 sem., 3 mois, 6 mois, An, Jour, Mois, Semaine) | clair, cave | 390, 1280 | chaque échelle | 9 | 0 |
| 14-15 prix glisser | clair, cave | 390, 1280 | cadre glissé | doute A | 0 |
| 16-17 prix appui long | clair, cave | 390, 1280 | grande courbe | 14 | 0 |
| 18-19 prix début vers le passé | clair, cave | 390, 1280 | 6 sem. devient 13 sem. | aucun | 0 |
| 20-23 barre glissée (Commande de malt −1 sem.) | clair, cave | 390, 1280 | pendant, après | 10, 11 | 0 |
| 24-25 barre hors du cadre (lol) | clair, cave | 390 | pendant, après | 2, 11 | 1 |
| 26-27 fiche brassin, volet des dates | clair, cave | 390, 1280, 660 | ouverte | 12 | 0 |
| 29-31 fiche : règle du brassage | clair, cave | 390, 1280 | réglage | 3, 4 | 1 |
| 32 fiche : volet des achats (neipa v3) | clair, cave | 390, 1280 | volet | 5 | 0 |
| 33-35 fiche d'un plan : Supprimer puis Annuler | clair, cave | 390, 1280 | message, rendu | aucun | 0 |
| 36 Modifier | clair, cave | 390, 1280, 660 | feuille | aucun | 0 |
| 37-39 ajout depuis Achats | clair, cave | 390, 1280, 660 | vide, rempli, après | 6 | 0 |
| 40 menu du + | clair, cave | 390, 1280, 660 | ouvert | 16 | 0 |
| 41-42 plein écran, retour | clair, cave | 390, 1280, 660 | plein, retour | aucun | 0 |
| liste des Brassins | clair, cave | toutes | repos | 13 | 0 |
| build de HEAD | — | — | — | 1 | 1 |

## Problèmes

1. **Bloquant. La version ne se construit pas.** Dans b17062ff5, `src/components/tabs/CalendrierTab.tsx:900` donne l'erreur Vite
   « Unexpected "..." » : le bloc `onFacturer` (WFV-14) est coupé par le bloc CHE-5 du brassin, et `onSupprimer` (CHE-2) est collé deux
   fois dans `onLier`. Un commit par morceaux a sans doute mal recollé le fichier. L'arbre de travail de port-carnet le répare : il faut
   commiter cette réparation avant de déployer.
2. **Bloquant. Une barre tirée hors du cadre ne tombe pas où l'étiquette le dit, et l'échelle ne s'agrandit pas.** Le geste : 390, 6 sem.,
   « lol » (Papiers) tiré jusqu'au bord droit et tenu 1,5 s. Pendant le geste, l'étiquette dit « S1 · 7 janv. · lâcher ici ». Au lâcher,
   la chose est posée au **14 janv. 2027**. La fenêtre a glissé de S47–S52 à S49–S1, toujours sur 6 semaines, au lieu de s'agrandir. C'est
   la forme exacte de CAL-BARRE-BORD (« ça doit agrandir l'échelle… ça doit s'ajuster pour de vrai »). Même résultat en cave.
   Captures `390-clair-24-barre-hors-pendant.png` et `25-barre-hors-apres.png`.
3. **Bloquant (geste sans effet). La date de brassage d'un brassin en cuve se règle, puis le réglage est refusé au lâcher.** Fiche de
   NEIPA Test (J78, brassée). La pastille « Brassage 4 sept. : régler » ouvre la règle et la date suit le doigt (« 9 sept. +5 j »). Au lâcher,
   le message dit « Brassin en cuve : le jour de brassage ne bouge pas. Tire son bord droit pour poser sa fin. » et rien ne change.
   La pastille « Prête ✓ ? », celle qu'il aurait besoin de régler, n'est pas réglable. Captures 390 29 à 31 et `1280-clair-30`.
4. **Gênant (écart à sa maquette v02). La règle « à la volée » est minuscule et le pouce cache la date.** Elle garde la taille de la
   pastille : on lit « 4̶ sept. » sous le pouce, et « 9 sept. +5 j » à moitié caché. Dans `v02-edition.jpg`, la pastille s'élargit en
   carte lisible (« 12 déc. S50 » en grand, graduations, pouce dessous). À 390 comme à 1280 (`390-clair-29`, `30`, `1280-clair-30`).
5. **Gênant. « Com… » est coupé, et Commander est en double.** Fiche de neipa v3 (à brasser), volet des courses ouvert : la rangée
   d'actions montre Ouvrir, « Com… », Budget, Lier, avec un grand « Commander » juste dessous. Même chose à 1280, où la place ne manque
   pourtant pas (`390-clair-32`, `1280-clair-32`, `390-cave-32`).
6. **Gênant. Dans la feuille d'ajout, le nom tapé part dans le champ CHF, et ce champ accepte des lettres.** Toucher « Autre nom » puis
   taper : le texte arrive dans CHF (« ZZ TES120T visi »). « Ajouter en S47 » répond alors « Choisis un nom. » et rien n'est ajouté.
   On voit encore une forme de CHE-4 (le premier toucher sur le nom est perdu). Captures `390-clair-38`, `39`, `1280-clair-38`, `39`.
   Le banc touche par CDP : à confirmer au doigt sur téléphone.
7. **Mineur. Le menu de période ne coche pas l'échelle en cours.** Avec 6 sem. active, aucune des durées (2 sem. … An) n'est marquée
   (`390-clair-05-menu`, 660, 1280).
8. **Mineur. « CHF à dépens… » est coupé par le bouton ±** à 390 et à 390×660, quand la pastille dit « Nov. · 6 sem. » (`390-clair-01-repos`).
9. **Mineur. Le résumé de rangée se coupe sur deux lignes** : « prévu 16 nov.–29 / nov. » (2 sem.), « prévu nov. 26– / nov. 27 » (An),
   « prévu nov. 26–avr. / 27 » (Mois) (`390-clair-06`, `10`, `12`).
10. **Mineur. Les étiquettes d'Achats se cassent et se chevauchent à 6 sem. (390).** Au repos : « Brouwland · / malt −420 » et
    « Commande / de malt −540 ». Pendant le glisser, elles se chevauchent avec la puce « S48 · 24 nov. · lâcher ici »
    (`390-clair-20`, `22`, `h660-09`).
11. **Mineur. Dans l'aperçu de la courbe pendant le glisser, des chiffres se superposent** : « −540 » sur « −4 000 », « +600 » sur la
    graduation (`390-clair-22`, `24`).
12. **Mineur. Volet des dates : « en cuve » reste seul sur sa ligne**, détaché de « Prête à préciser » (`390-clair-27`).
13. **Gênant (sens métier). Un brassin pas brassé, dont la date est passée, garde sa date de prête.** « Ssr · pas brassée · prête 19 déc. »
    était prévu le 2 nov., et « Hefe · pas brassée · prête le 1 déc. » le 27 oct. Pas brassées le 21 nov., ces bières ne seront pas
    prêtes à ces dates. Toutes échelles (`390-clair-01`, `07`).
14. **Mineur. La grande courbe (appui long) a un axe des mois irrégulier et sans année.** À 390 : « févr. juin sept. janv. mai août ».
    À 1280 : « févr. avr. mai juin août oct. nov. janv. mars… ». La lecture « S38, 20 – 26 sept. » ne dit pas l'année
    (`390-clair-16`, `1280-clair-16`).
15. **Mineur. Au repos, le + couvre le panier de « Commande de malt »** (390, `01-repos`). En bas de page, il couvre aussi la puce de « lol »
    (`04-defile3`).
16. **Gênant. À 390×660, le menu du + est coupé en haut** : la rangée « Vente / Recette » est rognée, et « Écriture / Facture » sort de
    l'écran (`390-clair-h660-12-fab`).

## Doutes (non comptés)

- A. Pendant le glisser du cadre des prix, les rangées gardent l'ancienne fenêtre jusqu'au lâcher (`390-clair-14` : étiquette S44–S49, frise
  S47–S52). C'est peut-être voulu.
- À 1280, le même tirer hors du cadre sur « lol » n'a rien changé : le banc a sans doute saisi l'étiquette et non la puce. Le problème 2 vaut
  pour 390.
- Le bord au jour n'a pas été prouvé : Commande de malt est un point sans bord. Il reste à jouer sur une barre qui dure (ZZ TEST Geste, Travaux).
- Enregistrer dans Modifier n'a pas été joué : seule la feuille a été regardée.
- 844×340 (cave) n'a été vu qu'en vignettes. 1280 cave (repos, fiche, plan, ajout, menu du +, plein écran) a été capturé mais pas
  regardé. **DEMANDE EXECUTANT** : ouvrir à taille réelle `844-cave-h340-*.png` et `1280-cave-*.png` dans le dossier des captures.

## Avis

Le déploiement est bloqué. Il faut d'abord commiter la réparation de `CalendrierTab.tsx` (1), puis corriger CAL-BARRE-BORD (2), qui est sa
plainte du tour 8 et revient intacte, et la règle offerte sur une date figée (3). Ce qui tient : la fiche v02 et ses volets, Supprimer puis
Annuler (la caisse passe de −7 395 à −6 855 puis revient à −7 395), Modifier avec la feuille d'ajout, tirer le début vers le passé
(6 sem. devient 13 sem.), les échelles et le plein écran.
