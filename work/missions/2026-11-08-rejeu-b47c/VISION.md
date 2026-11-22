# Test d'écran à l'image — version b47cd90b (D343, D344)

Version : b47cd90b. Build de banc local (`vite build --mode development`, `VITE_HOP_V4=on`, workers `zxing-wasm`/`pdfjs-dist` externalisés),
ouvert par `banc.mjs` sur `?dev-local` (base locale : 0 brassin, 0 article), `?dev-local&etape=houblons[&recette=vide&malts=maquette]`
(fixtures simulées, rien d'écrit) et `?preview=brew&view=brassage` (NEIPA de démonstration). 122 captures dans
`work/missions/2026-11-08-rejeu-b47c/vision/` (ignorées de Git), nommées `<écran>-<état>-<thème>-<largeur>.png` ; à 390 la capture est la
page entière défilée. Aucune donnée réelle, aucun déploiement, aucun serveur de dev. Toute capture citée a été ouverte et regardée en plein format.

Limites du banc (pas des défauts) : sous `?dev-local` les écritures Firestore sont refusées (« La connexion Google ne peut pas être préparée »
sur la vente) ; la fixture Malts/sucres (`APERCU-1…6`) n'a ni PPG ni couleur, d'où OG/EBC « — » et « 3 couleurs à renseigner » ; la fixture
Houblons a un OG visé (1,066) et 0 kg de grain. Avec `VITE_HOP_V4=on`, l'étape Houblons est l'écran choisi (Ma bière) : α n'y est pas
saisissable, la dose va par « − / + » de 2 g et le moment par le rail ; « α 150 % », « dose négative » et « 777 min » n'ont aucun champ
(le pli « Corriger les lignes de houblon » vu en ligne est celui du bundle sans V4).

## Bilan : 12 problèmes (B 1, G 4, D 7), 3 états non atteints (DEMANDE EXECUTANT)

## Table

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| malts-repos-* | cave, clair | 390, 1280 | Malts/sucres, trois lignes | n° 1 | 0 |
| malts-masse-videe-* | cave, clair | 390, 1280 | masse de Pilsner vidée | n° 2 | 0 |
| malts-fiche-* | cave, clair | 390, 1280 | fiche technique ouverte | 0 | 0 |
| malts-ppg99-frappe-*, malts-ppg99-apres-* | cave, clair | 390, 1280 | PPG 99 tapé, puis quitté | n° 3 | 0 |
| houblons-repos-* | cave, clair | 390, 1280 | Nugget 46 g à 60′ | 0 (doute a) | 0 |
| houblons-liste-citra-* | cave, clair | 390, 1280 | liste d'ajout « Citra » | n° 4 | 0 |
| houblons-dose-min-* | cave, clair | 390, 1280 | dose descendue par « − » jusqu'à 0 g | 0 (doute b) | 0 |
| houblons-moment-max-* | cave, clair | 390, 1280 | moment poussé au premier moût | n° 5 | 0 |
| eau-repos-* | cave, clair | 390, 1280 | Eau et sels, 28,7 + 13,4 L | 0 | 0 |
| eau-rincage-0-* | cave, clair | 390, 1280 | rinçage 0 L : « Il manque 13,4 L » | n° 6 | 0 |
| recap-repos-* | cave, clair | 390, 1280 | Récapitulatif, sections fermées | n° 7 | 0 |
| recap-fermentescibles-ouvert-*, recap-masse-videe-* | cave, clair | 390, 1280 | section ouverte, masse de Pilsner vidée | 0 (doute c) | 0 |
| brassage-repos-* | cave, clair | 390, 1280 | Jour de brassage, Préparer, « 0/5 ajoutés » | 0 | 0 |
| brassage-quantite-99999-* | cave, clair | 390, 1280 | ajustement de Gypse, 99999 tapé | n° 8, 9 | 0 |
| brassage-sonnerie-* | cave, clair | 390, 1280 | « Options et alertes » ouvert, pas de sonnerie | non atteint | — |
| stocks-liste-vide-*, stocks-ajout-article-*, stocks-ajout-article-rempli-* | cave, clair | 390, 1280 | Stocks vide, feuille « Nouvel article » | 0 | 0 |
| stocks-liste-un-* | cave, clair | 390, 1280 | « ZZ TEST — Pilsner · 0 kg · Rupture » | 0 (doute d) | 0 |
| stocks-fiche-article-* | cave, clair | 390, 1280 | identique à la liste : fiche non ouverte | non atteint | — |
| stocks-futs-*, stocks-fut-sheet-* | cave, clair | 390, 1280 | Fûts vide, feuille « Nouveau fût » | n° 10, 11 | 1 |
| vente-repos-*, vente-999999-* | cave, clair | 390, 1280 | Encaisser une vente, 999 999 refusé | 0 | 0 |
| reglages-iban-repos-* | cave, clair | 390, 1280 | Réglages › Fiscalité, IBAN au repos | 0 | 0 |
| reglages-signataire-* | cave, clair | 390, 1280 | confirmation du changement de signataire | n° 12 | 0 |
| depense-entree-* | cave, clair | 390, 1280 | Nouvelle dépense, entrée | 0 | 0 |
| brassin-avant-enregistrer-cave-390, brassin-apres-enregistrer-cave-390 | cave | 390 | tentative de créer un brassin (Levure 4/7) | hors périmètre | — |

## 1. Recette, Malts/sucres — combien et quels problèmes ? 3

1. **D** · 390, cave et clair · La barre d'étapes est décalée : le premier onglet se lit « dentité » (l'I coupé par le bord gauche), à toutes les
   étapes (Malts, Houblons, Eau, Récap). Pas à sa place. `vision/malts-repos-cave-390.png`, `vision/houblons-repos-clair-390.png`,
   `vision/recap-repos-cave-390.png`, `vision/eau-repos-clair-390.png`.
2. **D** · 390 et 1280, cave · Masse de Pilsner vidée : la ligne affiche « 0 kg » (0 inventé pendant la saisie) alors que la même ligne dit encore
   « 63 % du grain », le total « Grain 8 kg » et le panneau du bas « 5,0 kg ». Trois chiffres pour une masse ; le brasseur : « c'est 0 ou c'est 5 ? »
   `vision/malts-masse-videe-cave-390.png`, `vision/malts-masse-videe-cave-1280.png`.
3. **G** · 390 et 1280, cave et clair · PPG 99 tapé dans la fiche : contour rouge sans un mot ; au blur la valeur disparaît (champ vide, PPG « — »),
   toujours sans message. Le brasseur ne sait ni le plafond ni pourquoi « ça a sauté » (constat 1 du rejeu en ligne, non réglé). Correction : le
   plafond en clair sous le champ (« un malt fait 20 à 46 PPG »). `vision/malts-ppg99-frappe-cave-390.png`, `vision/malts-ppg99-apres-cave-390.png`,
   `vision/malts-ppg99-frappe-clair-390.png`, `vision/malts-ppg99-frappe-cave-1280.png`.

Doutes : le « + » flottant touche « Suivant — Houblons » à 390 (TL-31, ouvert, même bouton que sa maquette) ; OG/EBC « — » et « 3 couleurs à
renseigner » viennent de la fixture (TL-10 ouvert).

## 2. Recette, Houblons — combien et quels problèmes ? 2

4. **G** · 390 et 1280, cave et clair · Liste d'ajout « Citra » : deuxième ligne « Citra BBC · α 12,3 % · **amérisant** · peu de données ». Citra n'est
   pas un houblon amérisant (la première ligne dit « aromatique »). Sens métier : « Citra amérisant ? » et le brasseur ne croit plus la colonne.
   « % α » et le picto de stock (caddie) sont là ; « stock épuisé » n'est qu'un picto, pas un mot. `vision/houblons-liste-citra-cave-390.png`,
   `vision/houblons-liste-citra-clair-390.png`, `vision/houblons-liste-citra-cave-1280.png`.
5. **D** · 390 et 1280, cave et clair · Moment poussé au premier moût : la carte de Nugget montre un carré hachuré avec « ? » puis « arôme » : un picto
   manquant plutôt qu'un signal ; à 390 la carte s'allonge et la dose passe sur une ligne à part. `vision/houblons-moment-max-cave-390.png`,
   `vision/houblons-moment-max-clair-1280.png`.

Doutes : (a) bandeau « Grain 0 kg · OG 1,066 » : un OG sans grain, c'est la fixture, mais l'écran l'affiche sans broncher
(`vision/houblons-repos-cave-390.png`) ; (b) la dose descend jusqu'à « 0 g · 0 IBU » et la ligne reste dans la recette (pas de négatif : bien),
mais un houblon à 0 g dans une recette n'a pas de sens (`vision/houblons-dose-min-cave-390.png`, `vision/houblons-dose-min-clair-1280.png`).

## 3. Recette, Eau et sels — combien et quels problèmes ? 1

Rinçage 0 L : « Il manque 13,4 L d'eau. Avec 28,7 L et 7,7 L retenus par le grain, tu ne collectes que 21 L de moût pour 34,4 L visés. »
Recompté : 28,7 − 7,7 = 21 ; 34,4 − 21 = 13,4. Juste. « Rinçage à chaud : 0 L » a disparu (bien). Au repos : « Rinçage à chaud : 13,8 L dans le
récipient principal » pour 13,4 L à froid, plausible. `vision/eau-rincage-0-cave-390.png`, `vision/eau-repos-cave-390.png`.

6. **D** · 1280 cave et clair, visible aussi à 390 · Champ Rinçage au focus : son anneau recouvre la fin du mot « Rinçag|e » et le « L » d'unité ; les
   deux champs Empâtage / Rinçage sont trop serrés à 1280. `vision/eau-rincage-0-cave-1280.png`, `vision/eau-rincage-0-clair-1280.png`,
   `vision/eau-rincage-0-cave-390.png`.

## 4. Recette, Récapitulatif — combien et quels problèmes ? 1

7. **D** · 390 et 1280, cave et clair · « 1 valeur à corriger avant enregistrement » en rouge, sans dire laquelle ni où, toutes sections fermées. Le
   brasseur ouvre tout pour trouver (c'était le nom). `vision/recap-repos-cave-390.png`, `vision/recap-repos-clair-1280.png`.

Masse vidée au récap : l'en-tête de section devient « Fermentescibles — kg », le champ reste vide, « 2 valeurs à corriger » : ni 0 ni NaN (bien).
`vision/recap-masse-videe-cave-1280.png`, `vision/recap-masse-videe-clair-390.png`. Doute (c) : la carte d'eau garde « Osmosée 21,1 · Réseau 21,1
· Eau totale 42,1 L » et « Eau 3,6 L/kg » avec 3 kg de grain au lieu de 8 : les volumes d'eau ne suivent pas la masse (28,7 L pour 3 kg ferait
9,6 L/kg). Doute : « Pilsner Malz · APERCU-1 (couleur EBC, potentiel PPG) » : la référence de stock suit le nom (fixture ; acceptable en réel).

## 5. Jour de brassage (banc NEIPA) — combien et quels problèmes ? 2 (+ 1 non atteint)

Repos : un seul compteur « Ingrédients 0/5 ajoutés » ; à 1280 l'en-tête ajoute « 0/11 étapes faites », autre compte (les étapes), pas un doublon.
`vision/brassage-repos-cave-390.png`, `vision/brassage-repos-cave-1280.png`.

8. **D** · 390, cave · Panneau d'ajustement de Gypse : la valeur « 2 » est collée en haut à droite de la boîte « − [2] g + », hors de l'axe du « g » et des
   boutons ; « Consigner à cette heure » est un bouton gris sur gris qu'on ne lit pas comme actionnable. `vision/brassage-quantite-99999-cave-390.png`.
9. **G** · 1280 cave, 390 clair · 99999 tapé : le message dit « 99999 g : au-delà de 500 g, c'est une erreur de saisie probable (unité confondue ?). La
   valeur précédente est conservée. » — mais la ligne affiche « Gypse 99 g · Prévu 2 g · Écart +97 g » et l'encart « Écart à examiner : Ca 824 ppm,
   SO₄ 1788 ppm, Sulfates au-dessus du repère sensoriel 400 » : les deux premiers chiffres tapés (99) ont été retenus au vol. Le message contredit
   l'écran ; le brasseur : « il me dit qu'il garde 2 g et il m'a mis 99 g de gypse ». Correction : n'appliquer qu'au blur ou revenir vraiment à 2 g.
   `vision/brassage-quantite-99999-cave-1280.png`, `vision/brassage-quantite-99999-clair-390.png`.

Non atteint : le bouton « Arrêter » de l'alarme. « Tester la sonnerie » est sous « Options et alertes » › « Sonnerie · option de test », deux plis ; la
série ne l'a pas déclenché (haut-parleur coupé « 🔇 » dans l'en-tête du banc). `vision/brassage-sonnerie-cave-390.png`,
`vision/brassage-sonnerie-clair-1280.png`.

## 6. Fiche brassin (Mesures, courbe à une mesure, alcool calculé) — non joué

Aucun brassin dans la base locale. La création par l'app (`malts=maquette` → Récapitulatif → nom « ZZ TEST — Vision » → « Enregistrer et préparer un
brassin ») renvoie à Levure 4/7 : la recette exige une souche puis « Quantité de levure : à compléter · Unité : à choisir » ; menée jusqu'à A30 Corporate
choisie, pas plus loin dans le budget. `vision/brassin-apres-enregistrer-cave-390.png` (la liste « Unité.. ▾ » tronquée, hors périmètre).

## 7. Stocks — combien et quels problèmes ? 2 (+ 1 non atteint)

Liste vide, feuille « Nouvel article » (Nom, Catégorie, Unité kg, « Le stock démarre à zéro… »), article créé : « Divers · ZZ TEST — Pilsner · 0 kg · Rupture »,
segments « Tous · 1 · À commander · 0 · Épinglés · 0 ». `vision/stocks-liste-vide-cave-390.png`, `vision/stocks-ajout-article-cave-390.png`,
`vision/stocks-liste-un-cave-390.png`, `vision/stocks-fiche-article-clair-1280.png`.

10. **D** · 390, cave et clair · Fûts vide : « Ajoute un fût avec le bouton « Ajouter un fût » » alors qu'à 390 le bouton n'est qu'un « + » sans libellé
    (à 1280 il dit « + Ajouter un fût »). Le texte renvoie à un mot qui n'est pas à l'écran. `vision/stocks-futs-cave-390.png`, `vision/stocks-futs-clair-1280.png`.
11. **B** · clair, 390 et 1280 · Segment sélectionné illisible : « Tous · 0 » (barre des fûts), « 30 L » et « Propre » (feuille « Nouveau fût ») en blanc sur
    gris clair. Texte illisible = bloquant ; TE-45 l'avait noté « non traité ». En cave c'est lisible. `vision/stocks-futs-clair-1280.png`,
    `vision/stocks-fut-sheet-clair-390.png`, `vision/reglages-signataire-clair-390.png` (segment « Tous · 0 » en arrière-plan).

Doute (d) : un article tout neuf à 0 kg s'affiche « Rupture » en rouge sans seuil défini : juste (0 en stock), mais rouge d'emblée.
Non atteint : la fiche détail de l'article (le bouton « Ouvrir ZZ TEST — Pilsner » existe ; le clic de la série est tombé à côté).

## 8. Finances et Réglages — combien et quels problèmes ? 1

Vente 999 999 : « 999 999 CHF dépasse 50 000 CHF, le plafond d'une vente dans cet outil : erreur de saisie probable (un zéro de trop ?). Vérifie le montant. »,
« Valider l'encaissement » éteint, virgule et espaces justes. `vision/vente-999999-cave-390.png`, `vision/vente-999999-cave-1280.png`,
`vision/vente-repos-clair-390.png`. IBAN au repos (Réglages › Fiscalité) : « Cet IBAN n'est pas valide : vérifie les chiffres (un IBAN suisse a 21
caractères, par exemple CH93 0076 2011 6238 5295 7). » sous l'IBAN de démonstration, « Sauvegarder » actif : conforme à b47cd90b.
`vision/reglages-iban-repos-cave-390.png`, `vision/reglages-iban-repos-clair-390.png`, `vision/reglages-iban-repos-cave-1280.png`.

12. **G** · 390 clair, 1280 cave · Changement de signataire : la boîte de confirmation est coupée par le haut de l'écran ; on ne voit que la fin « …Gaëtan.
    Tu peux revenir en arrière depuis ce menu. » et les boutons « Annuler | Saisir au nom de Aricia » ; la question « Saisir au nom de Aricia ? » est hors
    écran. Pas à sa place : la confirmation (TE-61) existe mais ne se lit pas. `vision/reglages-signataire-clair-390.png`, `vision/reglages-signataire-cave-1280.png`.

Doute : titre « Paramètres & Évolutions » pour un menu « Réglages » (TE-63, ouvert).

## 9. Dépense — combien et quels problèmes ? 0

Entrée : bouton noir fendu « Un document | Plusieurs », « Photographier le ticket » (390), « PDF ou image · lecture automatique · 4 Mo max. »
(« ou dépose le fichier ici » à 1280), « Saisir sans justificatif », bascule « Plié | Déplié ». Conforme à la forme 3 retenue (D291).
`vision/depense-entree-cave-390.png`, `vision/depense-entree-clair-390.png`, `vision/depense-entree-cave-1280.png`.

## DEMANDE EXECUTANT (états non atteints)

Build : `%TEMP%\claude\…\scratchpad\build` (ou refaire : `NODE_ENV=development VITE_HOP_V4=on npx vite build --mode development --config
<scratchpad>/vite.vision.config.mjs --outDir <tmp>`) ; ouvrir avec `banc.mjs` `ouvrir(construit, { theme, largeur, url })`, deux thèmes, 390 et 1280 :
1. `?preview=brew&view=brassage` : ouvrir « Options et alertes » puis « Sonnerie · option de test », toucher « Tester la sonnerie », remonter en haut,
   capturer la barre rouge avec « Arrêter la sonnerie » → `brassage-arreter-<thème>-<largeur>.png`.
2. `?dev-local` › Stocks › « Ajouter le premier article » (Nom « ZZ TEST — Pilsner ») › « Créer l'article » › bouton « Ouvrir ZZ TEST — Pilsner » →
   `stocks-fiche-<thème>-<largeur>.png`.
3. `?dev-local&etape=houblons&recette=vide&malts=maquette` › Levure : « Choisir A30 Corporate », Quantité prévue 11,5, unité g › Récapitulatif › Identité :
   nom « ZZ TEST — Vision » › retirer le focus › « Enregistrer et préparer un brassin » › Brassins › le brassin › « Mesures » : une seule densité 1,060 →
   `brassin-mesures-une-<thème>-<largeur>.png` (courbe « Densité au fil du brassin » et « Alcool calculé »). Rien n'est écrit en base sous `?dev-local`.
