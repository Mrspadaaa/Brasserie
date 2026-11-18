OK — 11 problèmes, 0 bloquant

# Verdict final avant déploiement (voie t1, 3e passe) — Levure (N1 à N6) et écrans des voies de bugs

Version : dd39fe8e + arbre de travail (09.11, corrections de u1, u2, d1, b-dep, b-stock, b-divers, b-houblons, b-assistant). Serveur `npx vite --port 5660` (VITE_HOP_V4=on), lancé puis arrêté.
Captures de cette passe : `critique/captures-3/` (30 : Levure 390 clair et cave, « ⌕ » réel et simulé `&recherche=simulee`, 1280 clair pour le simulé ; `journal-*.json`) et `critique/captures-3/divers/` (16 : rejeu b-divers à 390 clair, `capturer-divers.mjs`, `capturer-divers2.mjs`). Captures des voies ouvertes : b-dep `harnais/` (8), b-stock `captures/` (8), b-houblons `capt/` (8), b-assistant `captures/` (10). Toutes regardées en plein format. 0 erreur de page sur ~45 chargements (le plantage N5 de la 2e passe n'est pas revenu).
Bloquant : geste sans effet, valeur fausse, élément de sa maquette absent, texte illisible (D342 à D344).

## Table

| écran | voie | capture | thème · largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|---|
| Ma levure · « ⌕ » floculation | u1 | l6-loupe, l6b-loupe-issue (réel), *-simulee | clair = cave · 390 ; 1280 clair | « recherche… 1/20 » pleine largeur, puis « moyenne (simulé) · à confirmer · Retenir · Écarter », ou « Service IA momentanément indisponible. OK » | N1 corrigé ; 1 (L-b) | 0 |
| Comparer · « ⌕ » phénols US-05 | u2 | m3-loupe, m3b-loupe-issue, *-simulee | clair = cave · 390 ; 1280 clair | cellule qui s'étire : « recherche… / 1/20 », « négatif (simulé) / à confirmer / Retenir / Écarter », Comparer reste | N1 corrigé ; 1 (L-a) | 0 |
| Chercher · 3 filtres, « à vérifier » | u2 | c3-3filtres | clair = cave · 390 | 1007 : nom, « STA1 ? », « épuisée au relevé du 27.09 » dessous | N2 corrigé ; 1 (L-c : titres sur deux lignes, N3 partiel) | 0 |
| Chercher · « 1056 » | u2 | c1-1056 | clair = cave · 390 | repère 7,1 %, carte sans forme ni date | 1 (C2, reste) | 0 |
| Suggérer · repos | u2 | s1-repos | clair = cave · 390 | référence en tête, « épuisée au relevé du 27.09 » ; Pomona « thiols · clarté moyens » sans arôme | 1 (N4, données d1) | 0 |
| Suggérer · + thiols + clarté | u2 | s3-deux-axes | clair = cave · 390 | piste 15–30, vendues ici 3 ; Diamond sous le pli | N6 : code en couleur d'alerte (`.lvv-hors`, `--lvv-chaud`), non vu à l'image | 0 |
| Acheter du matériel (dépense) | b-dep | apres-depense-390-clair (= avant) | clair · 390 (harnais 390 × 520) | identique avant/après | 0 | 0 |
| Facturer | b-dep | apres-facture-390-clair | clair · 390 | feuille, « À compléter » | 0 | 0 |
| Prévoir du matériel (upgrade) | b-dep | apres-upgrade-390-clair | clair · 390 | « Budget total TTCÀ estimer » collé | 1 (D-a) | 0 |
| Modifier l'écriture comptable | b-dep | edit-apres-390-cave, edit-apres-fin | cave · 390 | TVA, quittance, dossier Drive | 0 | 0 |
| Nouvelle dépense (pièce, Weizenmalz) | b-dep | piece-390-clair, weizen-apres-390-clair | clair · 390 | « 2 000 g → 2 Kg · 2000 g × 0,00155 » lisible ; badge « Rattacher les 4 » sur l'en-tête Malts (déjà avant : « les 5 ») | 1 (D-b, non neuf) | 0 |
| Stocks · Articles | b-stock | articles-390-clair-apres | clair · 390 | sous-onglet « Articles », « Tous · 5 » | 0 | 0 |
| Conduite · courbe | b-stock | courbe-390-clair-apres | clair · 390 | « 20,5 °C » au-dessus de son trait, « 3 °C » net | 0 | 0 |
| Préparer un brassin (AM-47) | b-stock | am47-modal-390-clair-apres | clair · 390 | bandeau matériel actuel, « Adapter à 29 L » | 0 | 0 |
| Fût · remplir (couvert) | b-stock | futs-couvert-390-clair-apres | clair · 390 | erreur rouge, bouton éteint | 0 | 0 |
| Brassin · Dossier (TE-41) | b-stock | te41-dossier-390-clair-apres | clair · 390 | « Stock à confirmer · voir Mesures » | 0 | 0 |
| Volumes (TE-39) | b-stock | volumes-te39-390-clair-apres | clair · 390 | « Empâtage plafonné par la cuve (35 L utiles). » | 0 | 0 |
| Jour de brassage · ensemencement (RJ-14) | b-stock | rj14-ensemencement-390-clair-apres | clair · 390 | petit « À préciser » | 0 | 0 |
| Brassins · pastilles d'état | b-stock | pastilles-390-cave-apres | cave · 390 | texte courant sur teinte | 0 | 0 |
| Étape Houblons (MV-50) | b-houblons | apres-390-clair-bilan | clair · 390 | « 16D · style non reconnu » | 0 | 0 |
| Atelier houblons V5.5 (BR-45) | b-houblons | apres-390-cave-atelier | cave · 390 | bandeau « brouillon en cours » clair sur fond sombre | 1 (H-b) | 0 |
| Atelier · Décider, Explorer, Historique, saisie, dossier | b-houblons | apres-390-clair-* | clair · 390 | sept captures = le haut de la page ; les onglets ne sont pas montrés à 390 | 0 (limite de preuve H-a) | 0 |
| Identité (AM-49 à l'étape) | b-assistant | s5-identite-390-clair | clair · 390 | « Valeur hors limites, de 1 à 2000 L. Valeur gardée : 20 L. » | 0 | 0 |
| Malts/sucres (repère EBC) | b-assistant | s5-ferm-390-clair, s8-Malts-390-clair | clair · 390 | s8 : « style 59– » coupé à droite | 1 (A-a) | 0 |
| Styles (liste), Récap, Eau 1, Sels radar | b-assistant | s7-styles-390, s10-recap-390, s14-eau-1-390, s15-radar-390-cave | clair, cave · 390 | listes, « Fermentation · 2 phases », « −1 L/kg » refusé et dit, radar entier | 0 | 0 |
| Fiche de recette | b-assistant | s13-fiche-390-clair, s8-Fiche-390-clair | clair · 390 | « Noire — 63,3 EBC », parts 76 + 16 + 8 ; « SafAle US-05 · 2 sachet » | 1 (A-b) | 0 |
| Finances · 4 onglets | b-divers (rejoué) | divers/finances-* | clair · 390 | titres « Synthèse · Opérations · Prévisions · Annuel », aucun débordement | 0 (+ V-a) | 0 |
| Clients · Prix et marges › + › Nouveau tarif | b-divers (rejoué) | divers/clients-plus-2, clients-nouveau-tarif-2 | clair · 390 | « Nouveau tarif · Sur cet écran » en tête du + ; « À renseigner » ×3 à 14 px | 0 | 0 |
| Réglages (titre, Fiscalité, Brasserie) | b-divers (rejoué) | divers/reglages, reglages-brasserie-5000 | clair · 390 | titre « Réglages » ; alerte IBAN ; champ « Cuve · capacité totale » sous le pli, 5000 non rejoué | 0 (non prouvé : AM-49 à 390) | 0 |
| Journal des modifications | b-divers (rejoué) | divers/journal | clair · 390 | titre « Journal des modifications » | 0 | 0 |
| En-tête de l'app à 390 (Finances, Clients, Stocks) | — | divers/*, b-stock articles | clair · 390 | pastille « Période : Ce mois » sous l'en-tête translucide (fantôme gris) | 1 (V-a, non neuf) | 0 |

## Levure — « combien et quels problèmes ? » : 5, aucun bloquant
N1 et N2, les deux bloquants de la 2e passe, sont corrigés ; N3 en partie, N6 dans le code, N4 non.
1. **L-a** — Comparer, cellule « ⌕ » à 390, issue réelle : « Service IA / momentané / ment / indisponible. / OK » : le mot est coupé en deux sans trait d'union ; lisible, « OK » atteignable. À changer : texte court dans la cellule (« IA indisponible · OK »), ou `hyphens: manual` avec une coupure posée.
2. **L-b** — Ma levure, pendant et après la recherche : la case « floculation » se vide (en-tête seul), l'état vit sur la ligne pleine largeur dessous, sans dire de quelle donnée il s'agit. À changer : « floculation · » devant l'état (« floculation · recherche… 1/20 », « floculation · moyenne (simulé) · à confirmer »), ou garder un « ⌕ » dans la case.
3. **L-c** (N3, reste) — Chercher, 3 filtres à 390 : « Vendue CH · FR · / DE 4 » repasse sur deux lignes avec le badge « à vérifier » ; « Fabricant présent en / Europe 12 » aussi (compte collé, titre coupé). À changer : titre court (« Vendue ici 4 · à vérifier », « Fabricant en Europe 12 ») ou badge sous le titre.
4. **N4** (reste) — Pomona sans arôme (« thiols · clarté moyens » ; maquette « pêche · agrumes ») : effet de la purge des sources de revendeurs (d1). Honnête, pas un défaut de vue ; à verser depuis le TDS Lallemand.
5. **C2** (reste) — Carte « Wyeast 1056 American Ale » sans forme (liquide) ni date de fiche. Données d1, non bloquant.
- **N6** — « 10–15 °C · 19 hors plage » : `.lvv-hors` prend `--lvv-chaud` (couleur d'alerte) ; Diamond est sous le pli à 390 et n'a pas été recapturé à 1280 cette passe : tenu pour corrigé sur le code, à voir en ligne.
- **N5** — pas revenu (0 erreur de page sur toute la passe).

## b-dep — 2, aucun bloquant
1. **D-a** — « Prévoir du matériel » : « Budget total TTC » et « À estimer » collés (« TTCÀ estimer », deux polices). À changer : un espace ou « · ».
2. **D-b** (non neuf) — « Nouvelle dépense », bande Malts : le badge « Rattacher les 4 » (avant : « les 5 ») s'imprime sur l'en-tête « Malts 7 +4 ↳ … 18 Kg » et cache « +4 ». À changer : badge dans la rangée, pas par-dessus.
- Limite : les captures du harnais font 390 × 520 : le bas des feuilles (pied collant BE-27/62) n'est pas prouvé à l'image à 390 ; preuve par `mesurer-fin-feuille.mjs`.

## b-stock — 0
Les huit écrans corrigés tiennent à 390 (clair ; pastilles en cave) : Articles, courbe (étiquettes hors trait), AM-47, fût couvert, TE-41, TE-39, RJ-14, pastilles. Aucune correction n'en casse une autre à l'image.

## b-houblons — 1, aucun bloquant
1. **H-b** — Thème cave, atelier V5.5 : le bandeau « Atelier houblons · brouillon en cours » reste crème sur fond sombre et l'en-tête « Atelier houblons » vert pâle : l'inversion de palette (BR-45) ne couvre pas tout. Il dirait : « pourquoi c'est blanc là ? ». DÉCISION déjà posée par la voie (garder l'inversion ou passer aux jetons) ; à trancher avant ou après le déploiement, pas bloquant.
- **H-a** (limite) — les sept captures 390 « après » montrent le haut de la page (étape, « 16D · style non reconnu ») : Décider, Explorer, Historique, saisie et dossier ne sont pas vus à 390 ; vus à 1280 par la voie.

## b-assistant — 2, aucun bloquant
1. **A-a** — Malts/sucres à 390 (s8, après le correctif du repère) : « style 59–79 » sous le repère EBC est coupé à droite (« style 59– »), alors que s5 (avant) le montrait entier : le repère déplacé pousse l'étiquette hors cadre. À changer : étiquette alignée à droite dans le cadre, ou sur deux lignes.
2. **A-b** — Fiche de recette : « SafAle US-05 · 2 sachet » (singulier) dans l'en-tête de la section Levure (`YeastRecipeHeading`, zone Levure : u1). À changer : pluriel, et la plage « 2–3 sachets » de la dose au choix (#132) plutôt qu'un nombre.

## b-divers — rejoué dans l'app à 390 : 0 propre, 1 global
- Vu et juste : titres de Finances (BE-63, BE-74), « Réglages » (TE-63), « Journal des modifications » (TE-59), « + » › « Nouveau tarif · Sur cet écran » (TE-9), « À renseigner » ×3 à la même taille dans Nouveau tarif, alerte IBAN (RL-14).
- Non prouvé par moi à 390 : AM-49 (champ « Cuve · capacité totale » sous le pli, non atteint par le script ; preuve de la voie : test + capture hors dépôt), « Atelier R&D » (BE-25, titre à 1280), Impôt « 85,9 litres » (BE-82 : brassin semé absent de mon banc).
1. **V-a** (non neuf, toute l'app) — À 390, la pastille « Période : Ce mois » passe sous l'en-tête translucide : un fantôme gris flou sous « L'Affinée » dans Finances, Clients, Stocks (mes captures et celles de b-stock). Il dirait : « il y a un truc gris flou ?? » (D33). À changer : marge haute du contenu = hauteur de l'en-tête, ou en-tête opaque.

## Total
11 problèmes (Levure 5, b-dep 2, b-houblons 1, b-assistant 2, global 1), **0 bloquant**. Les deux bloquants de la 2e passe (N1, N2) sont corrigés ; rien de nouveau ne bloque le déploiement. À jouer en ligne ensuite (L11, HX-1) : « ⌕ » sur une vraie levure (compteur n/20, « à confirmer » puis Retenir), AM-49 et BE-82 à 390, N6 sur Diamond.
