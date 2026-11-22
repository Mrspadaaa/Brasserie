ECHEC — 8 problèmes, 3 bloquants

Version : a6c5c23b (code de la mission : 0df6d24a ; arbre de travail avec modifications hors mission, non concernées)
Bancs : `?dev-local&etape=levure` et `?dev-local&etape=houblons`, Chrome sans écran, 390 tactile (dpr 2) et 1280, clair et cave.
Captures : `critique/captures/` (44 Ma levure, 32 Chercher et houblons, 4 sondes), planches `critique/planches/` (toutes ouvertes, L12).
Scripts : `critique/capturer-r1.mjs`, `capturer-r2.mjs` (copies des voies, sortie ici, un pas ajouté : toucher la tuile de saisie libre), `sonde.mjs`, `sonde2.mjs`, `planches.mjs`.
Références : ses 5 captures du 09.11 (`captures-brasseur/`), maquette c6b (`2026-11-09-ecran-levure/p2/c6b/c6b-page.png`).

Sa question : « combien et quels problèmes il y a ? »

## Table

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| 1-repos | clair · cave | 390 · 1280 | Ma levure au repos (carte US-05, bande, puces, conduite de base) | — | 0 |
| 1b-conduite | clair · cave | 390 · 1280 | conduite de base défilée (= sa capture 4 : paliers, ↕ ↔, éditeur, « Jours de bascule et légende ») | — | 0 |
| 2-champ-lal | clair · cave | 390 · 1280 | « lal » tapé : 8 tuiles sur place + « 8 sur 35 » | 2 (390-cave : ↔ qui pointe sous « Suivant ») | 1 |
| 2b-champ-sans-resultat | clair · cave | 390 · 1280 | « zzqxjw » : tuile « Mon stock ou saisie libre » | — | 0 |
| 2c-champ-verdant | clair · cave | 390 · 1280 | « verdant » : une tuile | — | 0 |
| 2d-verdant-choisie | clair · cave | 390 · 1280 | tuile touchée : carte Verdant, puces Pomona · NovaLager · US-05 (précédente) | 5 (390) | 0 |
| 2e-saisie-libre | clair · cave | 390 | tuile libre touchée, 0,9 s après | 1, 2 | 2 |
| 2e-saisie-libre | clair · cave | 1280 | idem, défilé par le script jusqu'au champ | 1, 8 | 1 |
| sonde2-apres-tuile-libre | clair | 390 · 1280 | tuile libre touchée, 3 s après, sans défilement | 1 | 1 |
| 3-palier-touche | clair · cave | 390 · 1280 | palier 2 touché : éditeur « Repos diacétyle », ↔ à J7 | 7 (390) | 0 |
| 3b-palier-graphe | clair · cave | 390 · 1280 | éditeur défilé : Avant/Après/Supprimer, brouillon, paliers | 7 (390) | 0 |
| 4-sans-levure | clair · cave | 390 · 1280 | recette sans levure : « Levure · choisir », « Chercher une levure », conduite « Sans levure » | 2 (390) | 1 |
| 4b-sans-levure-tapee | clair · cave | 390 · 1280 | « nottingham » : une tuile | 2 (390) | 1 |
| sonde-poignee-pied, sonde2-poignee-pied | clair | 390 · 1280 | poignée ↕ amenée dans la bande du pied | 2 | 1 |
| l1 | clair · cave | 390 · 1280 | Chercher levure au repos : en-tête sur les pistes, « 19 » sur le trait, noms entiers, pastilles en colonne | — | 0 |
| l2 | clair · cave | 390 · 1280 | piste de Verdant touchée : « Choisir pour ma recette · + Comparer » | — | 0 |
| h1 | clair · cave | 390 · 1280 | étape Houblons au repos, bouton près du champ | 6 (390) | 0 |
| h2 | clair · cave | 390 · 1280 | recherche avancée au repos (497, au style Foreign Extra Stout) | — | 0 |
| h3 | clair · cave | 390 · 1280 | filtres Rôle = aromatique, Arômes = Tropicaux (29) | 3, 4 | 1 |
| h3f | clair · cave | 390 · 1280 | feuille « Filtres », index + panneau Arômes, Trier, Voir 29 | 4 | 0 |
| h4 | clair · cave | 390 · 1280 | « nelson », ligne Nelson Sauvin ouverte (« Ajouter à ma recette · 10 g à 10′ », « Fiche ») | — | 0 |
| h5 | clair · cave | 390 · 1280 | après « Ajouter » : couche fermée, Nelson Sauvin à 10′ dans l'étape | — | 0 |

## Problèmes

Bloquants
1. **Geste sans effet : la saisie libre.** Je tape « zzqxjw », je touche « Mon stock ou saisie libre : « zzqxjw » » : le champ se vide, le curseur y revient, et rien d'autre ne bouge à l'écran. Le repli pré-rempli existe, mais tout en bas de la page, sous le graphe, l'éditeur de palier, « Paliers du brouillon », « Hypothèses », « Contacts » : à 1280 le champ « Nom de la souche » est à 1 873 px pour 900 px d'écran, défilement inchangé (`sonde2`, `SAISIE-LIBRE-1280 : dansEcran false`) ; à 390, après 3 s, le champ n'existe même pas dans un essai (`SAISIE-LIBRE-390 : input false`), présent après 2,5 s dans un autre (`sonde`). Le brasseur : « je tape, je touche, il se passe rien ». Correction : au toucher de la tuile, ouvrir le repli, l'amener à l'écran et poser le focus dans « Nom de la souche » (comme r1 le fait pour comparer, fiche et objectifs) ; mieux : ouvrir la saisie libre juste sous le champ, à la place des tuiles. Captures : `2e-saisie-libre-390-clair/cave`, `sonde2-apres-tuile-libre-390.png`, `sonde2-apres-tuile-libre-1280.png`.
2. **Les poignées ↕ ↔ du graphe flottent sur le pied « Retour · Suivant ».** Dès que le graphe passe sous le pied, la poignée reste dessinée par-dessus : ↕ collée à « Retour » (`2e-saisie-libre-390-cave`, `sonde-saisie-libre-tap-390-clair`), ↔ entre « Retour » et « Suivant » (`4-sans-levure-390-cave/clair`, `4b-sans-levure-tapee-390-cave/clair`), demi-disque orange sous « Suivant » (`2-champ-lal-390-cave`). Mesuré : la poignée est `absolute z-10`, le pied `sticky bottom-0 z-10` ; le pied garde le toucher (`retourRecoit true`), mais l'élément est visible là où il n'a rien à faire. C'est sa capture 1 du 09.11 rejouée (le « + » et le « × » posés sur le pied), D10 « pas de débordement ». r1 l'avait mesuré à `[]` ; mon journal donne `debordeSurLePied` non vide à 390 (repos et palier touché) et à 1280 après un palier touché. Correction : pied au-dessus (z-index du pied > celui des poignées, fond opaque), ou `overflow: clip` sur la carte de conduite.
3. **Filtre Arômes = Tropicaux : Hersbrucker, Fuggle, Cascade en tête, sans « Tropicaux » sur leur ligne.** `h3-390/1280` : 29 houblons, les trois premiers sont des nobles ou anglais ; leurs pastilles disent Agrumes · Floral · Herbacé · Terreux · « noble +4 », jamais Tropicaux. La famille filtrée est cachée dans le « +n » parce qu'une seule fiche la cite (`hopDatabaseBootstrap` : Hersbrucker « tropical/fruit » parmi hay, herbal, spicy, tobacco) et que la ligne ne montre que 4 familles, marquées d'abord. Pour un brasseur, Hersbrucker tropical est une valeur fausse ; c'est D167 (« une famille citée par une fiche donne tout son effet ») dans une vue neuve. Correction : le filtre ne garde que les familles marquées (ou pondérées), et la famille filtrée est toujours affichée dans la ligne, pâle si seulement citée.

À corriger
4. **« Arômes non documentée 52 » et « non documentée 52 »** (`h3`, `h3f`) : accord générique faux (le gabarit `${libellé} non documentée` convenait à « STA1 », pas à « Arômes », « Rôle », « Huiles »). Correction : « sans arômes documentés 52 » ou accord par filtre.
5. **Carte de la levure choisie par tuile à 390** (`2d-verdant-choisie-390-*`) : « LalBrew Verdant IPA » sur deux lignes, « sèche · Lallemand Brewing » sur deux lignes : un en-tête de quatre lignes de texte, là où sa capture 1 montre « Verdant IPA » et une ligne de forme · fabricant. Correction : nom catalogue sans le préfixe de gamme quand le fabricant est dessous, ou dose et jauge sous le nom à 390.

Mineurs
6. **« avancée » seul à 390** (`h1-390-*`) : à côté de « Ajouter — houblon… », le mot seul se lit mal ; « Recherche avancée » n'apparaît qu'à 1280. Correction : « Avancée » avec majuscule, ou le picto seul avec `aria-label`, ou « + de filtres ».
7. **Unité « j » coupée** au bord de la carte quand « Durée du palier » a le focus (`3-palier-touche-390-clair/cave`, `3b-palier-graphe-390-*`) : l'anneau de focus pousse le « j » sous la bordure. Correction : réserver la largeur de l'unité (`flex: 0 0 auto`, marge intérieure).
8. **Repli « Mon stock ou saisie libre »** (`2e-saisie-libre-1280-*`) : « Nom de la souche » collé à la valeur (« Nom de la souchezzqxjw »), champ sans bordure visible en cave, « Utiliser cette levure » en texte nu à côté. Ancien éditeur, mais c'est désormais l'arrivée du geste n° 1. Correction : étiquette au-dessus, champ bordé, bouton.

## Doutes (non comptés)
- Sovereign « amérisant » (`h2`) : houblon anglais d'arôme à 5,5 % ; donnée de rôle à vérifier, pas la vue.
- « ≈ 6,9–7,2 % vol » pour OG 1,066 et FG 1,012–1,015 : la formule simple donne 6,7–7,1 ; même écart sur sa capture 1 (8,2–9,0 contre 8,0–8,7) : formule existante, pas de cette mission.
- « 2–3 sachets » pour 15–24 g de US-05 (11,5 g le sachet) : arrondi au sachet supérieur, règle existante.
- Banc houblons sans stock : rayon « Chez moi » et icône de stock dans la ligne non vus ici (r2 : test seulement). À jouer en ligne sur la recette « ZZ TEST ».
- Latence du repli de saisie libre : chunk chargé à la demande, plus lent en dev qu'en production ; ne change pas le n° 1 (pas de défilement).
- « plage levure 18–26 °C » en gris clair sur la bande grise du graphe (1280 clair) : lisible de près seulement ; composant de sa capture 4, inchangé.

## Ce qui tient (vu, pas à redire)
- Ma levure : recherche sur place, résultats en tuiles sous le champ, « 8 sur 35 », Entrée/×, choix par tuile sans quitter l'écran ; la conduite de base est celle de sa capture 4, palier touché compris ; en-tête de carte calé (sachets, grammes, jauge), pistes FG · conduite · floculation au même bas (212/212/212 ; 301/301), jauges d'effets à 241 px, puces entières, « Hors catalogue » fixé.
- Chercher levure : toucher sur la piste ouvre « Choisir pour ma recette · + Comparer » ; « 19 » posé sur le trait rouge ; noms entiers ; pastilles dans leur colonne ; 16 px entre les deux pistes.
- Houblons : étape au repos inchangée hormis le bouton ; recherche avancée en forme c6b (champ, résumé, puces, feuille à index, rayons, deux pistes) ; ligne : nom, α, rôle, arômes en couleur, « ◇ vin blanc +10 » pour Nelson Sauvin ; « Ajouter à ma recette · 10 g à 10′ » ajoute et referme sur l'étape (Nelson Sauvin à 10′, ~4 IBU).

LEÇON PROPOSÉE : un contrôle « sur le pied » doit faire défiler l'élément jusque dans la bande du pied avant de mesurer (r1 a mesuré `[]` au repos, où rien n'y était encore) ; et un geste qui ouvre quelque chose se prouve par « où est l'écran 3 s après », pas par la présence du nœud dans le DOM.
