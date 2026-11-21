# Voies de correction — Chasse Stock (21.11)

Lecture et analyse seulement. Source : les 4 chasses `CHASSE-{espace,edition,etagere,critique}.md`, versées à `work/missions/BUGS.md` (ids STE, STM, STG, STC ; commit 5bd9715ac).
Code : worktree `port-carnet` (tag `en-ligne/2026-11-21-tour8` de référence). Les chemins `src/…` et `scripts/…` sont relatifs à `port-carnet`.
Plaintes du brasseur : `STOCK-ESPACE` et `STOCK-ETAGERE-AUTRES` (`DEFAUTS-RECURRENTS.md`, l. 473-474) ; ses annotations de la capture 01 (`01-articles-annote.jpg`) sont la base des maquettes ci-dessous.

Bilan du versement : 77 lignes (40 défauts distincts, 25 doublons reliés, 12 notes). Reliés aux défauts déjà connus : STE-1, STE-2, STE-3 → STOCK-ESPACE ; STG-10 → STOCK-ETAGERE-AUTRES ; STE-4, STE-5, STG-7 → WX2-12 ; STG-5, STC-12 → WX2-2. Même écran, hors chasse, à reprendre avec la voie qui possède le fichier : WFA-1, WFX-8, CT4C-1 (Courses presque vide au repos), WFA-2 (« seuil NaN »), WFX-3/4/5 (Matériel, Fûts), TL-42 (« Pck » et « Stk »), BR-69/70 (épingle), WFV-6. WFR-3 et WFD-6 : aucun défaut de la chasse ne les recoupe.

## 1. Les trois catégories

### Correctif — 24 défauts, le code seul, sans choix de forme (voies V0 à V5)

| ids (doublons reliés) | ce qu'on corrige | voie |
|---|---|---|
| STC-2 (bloquant), STC-17 | un houblon compté en paquets (« 1 Pck », poids dans le nom « 25g ») garde sa quantité sur l'étagère, dans Recompter et dans « à compter » ; « à compter » dit une seule fois par ligne | V1 |
| STM-10 | renommer un article ne fait pas disparaître son manque (le rattachement recette-article par `stockItemRef`, pas par le nom) ; « à confirmer » | V1 |
| STE-10, STG-9, part vide de STE-9 | noms de Recompter > Compter sur une ligne (même hauteur) ; les tuiles suivent la recherche ; plus de tuile « Nettoyage 0 · 0/0 » vide | V1 |
| STG-1, STG-2, STG-3, STG-6 | colonne « Autres » des Levures visible ou défilable (indice de suite) ; bulle qui ne recouvre pas la rangée voisine ; zone de toucher élargie sans changer le dessin ; libellé « +1 10 » sans ambiguïté | V2 |
| STE-7, STC-12 (= STG-5, WX2-2) | la vue ne saute plus : la ligne de filtre et la pastille « ★ épinglés » ne décalent rien | V3 |
| STM-1 (= STC-1, bloquant) | « Commander » mène à la commande de CET article, et la saisie en cours est gardée ou dite perdue (la garde est dans V4, la destination dans V3) | V3 |
| STE-11 (= STC-10) | Courses pleine largeur, une seule ligne de contexte par article | V3 |
| STM-14 | « Nouvel article » : raison dite quand « Créer » est grisé, unité selon la famille | V3 |
| STG-NOTE-1 (partie) | cibles ≥ 44 px : croix de recherche, pastilles, sous-onglets (V3) ; étoile (V1) ; Lire l'échelle et Replier (V2) | V1, V2, V3 |
| STM-2 (= STC-14), STM-5, STM-6, STM-7, STM-9, STM-13, STM-15 | fiche : Retour et Échap ne jettent pas la saisie ; Enregistrer grisé tant que rien ne change ; Entrée valide un seuil ou un compte, et ne rouvre plus la liste de catégories ; vider un seuil = « aucun », jamais 0 ; refus dit près du bouton ; signe que c'est écrit | V4 |
| STM-12 (= STC-18), STC-6, STC-7, STC-19 | pavé gris derrière « 500 » et « aucun » en cave ; courbe « Ce qui a bougé » : axe sans date répétée, mots « aucun besoin » et « seuil à fixer » retirés du graphe ; pas de barre pleine sans seuil ni besoin ; « 200 pièces » au pluriel | V4 |
| STC-16 (part de STE-12) | « Fermenteur 120 L » ne se coupe plus entre le nombre et l'unité | V5 |

### « À dessiner » — 16 défauts, un changement de forme visible : mini maquettes au brasseur, rien n'est codé avant son choix (règle n° 1, L24)

Un artefact neuf, une page par choix (D126), variantes et référence côte à côte ; chaque variante part de sa maquette choisie du Stock (sy/fA, g6 ; registre `ecrans.json`) et de sa capture annotée. Les captures 01 et 02 sont la référence.

| choix | ids (doublons) | variantes à montrer |
|---|---|---|
| **D1 Articles : l'entrée** (sa capture 01) | STE-1, STE-2 (STOCK-ESPACE), STE-7 et STG-8 (le rond, place libre à droite de « DDM 0 »), STE-9 (tuiles qui redisent les comptes) | (a) tout ce qu'il a dessiné : « Houblons » retiré, bascule retirée, Recompter à la place de l'onglet (ordre Articles · Recompter · Courses · Fûts · Matériel, recherche et pastilles communes aux deux) ; (b) Recompter en icône dans le rond ; (c) aujourd'hui en référence. Dit où va le catalogue des 136 références (lien depuis le rayon Houblons ou la fiche d'un houblon ; entrées à rediriger : `App.tsx:778` et `:969`) |
| **D2 Étagère compacte** | STE-3 (STOCK-ESPACE), STE-4, STE-5, STG-7 (WX2-12) | mur et liste qui ne se doublent pas ; « Trié par … » placé en tête de liste ou dit « Liste triée par … » ; une seule échelle ; « Comparer une recette » en icône. Contrôle visé : au moins 3 rangées d'article au premier écran à 390×660 |
| **D3 Étagère : légende et 1280** | STG-4, STE-18, STC-11, STC-21 | légende commune réduite (« tirets = seuil, cadre rouge = épuisé, pointillé = à compter ») ouverte près de son bouton ; étagère à 1280 pleine largeur ; colonnes vides retirées. L'étagère est son acquis « incroyable » : chaque variante la garde |
| **D4 Autres stocks** | STE-8 (STC-8), STG-10 (STOCK-ETAGERE-AUTRES), STC-NOTE-3 | rayons Additifs, Emballage, Nettoyage comme Malts ; une colonne par unité (g, ml, pièce, L) ; cartes réduites en pastilles ; Fûts et Matériel en une rangée de plus. Une idée : Fûts en vue d'ensemble |
| **D5 La fiche d'un article** (sa capture 02, « l'autre vue de modification ») | STE-14 (STM-3, STC-4), STE-15 (STC-3), STE-16 (STM-4), STE-17 (STM-11, STC-20), STM-8 (STC-5), STM-16 | un seul formulaire d'identité (nom, catégorie, unité, fournisseur, α) et les gestes de stock (corriger, seuil) à part ; fournisseur et α dits une fois ; tête sous 100 px ; à 1280 deux colonnes équilibrées. Trois variantes : formulaire unique replié, feuille de modification, deux feuilles |
| **D6 Lignes : l'inconnu** | STE-6, STC-13 (STC-NOTE-7) | « EBC non connu » en tiret, en « EBC ? » court ou absent ; les trois barres ▂▄▆ de Recompter avec légende ou retirées |
| **D7 Sucres** | STC-9 | Dextrose et Sucre de resucrage : dans Malts (aujourd'hui, forme « creux », `murRayon.ts:7`), rayon « Sucres », ou Additifs. Page courte, seulement s'il veut la voir |
| **D8 Matériel et Fûts** | STE-12 (STC-15), STE-13 | Matériel : le segment « Parc · À venir · Carnets · Réalisés » est figé par sa maquette p2:g05-1 : recommandation d'écarter ; Fûts : pastilles et en-têtes qui redisent les comptes (page courte) |

Ordre recommandé : D1 d'abord (sa propre annotation, la plus visible), puis D5 (la fiche), D4, D2, D3, D6 à D8. D2, D3, D4 touchent `StocksTab.tsx`, `MurStock.tsx` ou `EnteteRayon.tsx` : leur code part après V2 et V3.

### « Accord » — ce qui attend lui ; le code et les tests locaux se font, rien ne part sans lui

| id | ce qui attend | pourquoi |
|---|---|---|
| A1 : tout | déploiement, une seule fois, en fin de lot | aucune function touchée à ce stade (tout est dans `src/`) : à confirmer par chaque voie |
| A2 : STM-10, STC-NOTE-1 | lecture de ses vraies recettes et fiches | l'effet du renommage et le rangement « Pale » / « Lager » ne se jugent que sur ses données ; en local, fixtures liées par `stockItemRef` seulement |
| A3 : STC-2 | écrire le poids du paquet sur l'article | recommandation : lire « 25g » du nom sans rien écrire ; un champ de plus devient un accord |
| A4 : STM-1, STC-1 | un état « commandé » sur l'article | recommandation : « Commander » ouvre Courses sur l'article ; l'état « commandé » reste WFA-4 et CRW-5, hors de cette chasse |

## 2. Les voies de correctif : fichiers disjoints, contrôle, ordre

Fichiers cherchés par grep dans `port-carnet`. Aucun fichier n'est dans deux voies. `StocksTab.tsx` (1004 lignes) ne va qu'à V3 ; `StockDetailSheet.tsx` (493 lignes) ne va qu'à V4. Les contrôles s'écrivent en étapes de `scripts/parcours/stock-etapes/<voie>.mjs` (un fichier par voie) et se jouent au doigt : 390 tactile (CDP, jamais `element.click()`), 1280 souris, clair et cave.

| voie | ids | fichiers possédés | contrôle (rouge sur tour8) | ordre |
|---|---|---|---|---|
| **V0 banc** | prépare tous les contrôles | `scripts/parcours/stock.mjs`, `scripts/parcours/fixtures/stock.mjs`, `scripts/parcours/stock-etapes/` (dossier créé, une étape par voie), même méthode que `carnet.mjs` (option `--ref`) | `node scripts/parcours/stock.mjs <dossier> --ref en-ligne/2026-11-21-tour8` : fixture « ZZ TEST » de `chaines.mjs` (rayons, manques) plus Cryo Hops Citra 25g (1 Pck, α 24,8 %, sans seuil, nom de facture), Dextrose, Sucre de resucrage, Bouteille 33 cl (200 pièces), EBC sur les malts, 19 malts, 22 houblons, 11 levures dont 4 « Autres » ; rejoue ses captures 01 et 02 à 390 et 1280, clair et cave. Série mécanique : Haiku rejoue | 1 |
| **V1 quantité et lignes** | STC-2, STC-17, STM-10, STE-10, STG-9, part vide de STE-9, étoile de STG-NOTE-1 | `src/domain/stock/liste.ts`, `src/domain/stock/ligne.ts`, `src/domain/stockLevel.ts`, `src/domain/stock/manqueRecette.ts`, `src/ui/stock/LigneStock.tsx`, `src/ui/StockRow.tsx`, `src/ui/stock/RecompterStock.tsx`, `src/ui/stock/recompter.css`, `tests/unit/stockQuantitePaquet.test.ts` (nouveau), `scripts/parcours/stock-etapes/quantite.mjs` | vitest : Cryo « 1 Pck » de 25 g → `quantiteBarre` non nulle, classe ≠ `compter`, `etatDit` sans « à compter » deux fois ; renommage → `articlesACommander` garde le manque. Parcours : « STC-2 ligne Cryo : ni « ? » ni « à compter » », « STE-10 nom de Compter sur une ligne, 48 px », « étoile ≥ 44 px » rouges sur tour8 | 2 (parallèle) |
| **V2 mur** | STG-1, STG-2, STG-3, STG-6, Lire l'échelle et Replier de STG-NOTE-1 | `src/ui/stock/MurStock.tsx`, `src/ui/stock/mur.css`, `src/ui/stock/murAjustements.css`, `src/ui/stock/murMiseEnPage.ts`, `src/ui/stock/fenetreGeste.ts`, `src/ui/stock/EnteteRayon.tsx`, `src/ui/stock/liste.css`, `src/domain/stock/murDonnees.ts`, `src/domain/stock/mur.ts`, `tests/unit/stockMurToucher.test.ts` (nouveau), `scripts/parcours/stock-etapes/mur.mjs` | parcours : « STG-1 [data-mur] : scrollWidth ≤ clientWidth, ou défilement et indice de suite », « STG-2 la bulle ne recouvre pas la rangée voisine (rectangles) », « STG-3 zone de toucher ≥ 24 × 44 px par marque », « STG-6 aucun libellé « +1 10 » » rouges sur tour8 ; l'étagère ne change pas d'aspect (capture avant/après ouverte) | 2 (parallèle) |
| **V3 barre, Courses, création** | STE-7, STC-12 (STG-5, WX2-2), STM-1 (STC-1), STE-11 (STC-10), STM-14, croix, pastilles et sous-onglets de STG-NOTE-1 ; même écran : WFA-1, WFX-8, CT4C-1 | `src/components/tabs/StocksTab.tsx`, `src/ui/stock/OutilsStock.tsx`, `src/ui/stock/outils.css`, `src/ui/stock/jetons-outils.css`, `src/ui/stock/paysageBas.css`, `src/ui/stock/ChiffreACommander.tsx`, `src/ui/stock/chiffreACommander.css`, `src/domain/stock/listeFiltres.ts`, `src/domain/stock/recherche.ts`, `src/domain/stock/horizon.ts`, `src/ui/stock/useHorizonStock.ts`, `tests/unit/stockBarreFiltre.test.ts` (nouveau), `scripts/parcours/stock-etapes/barre-courses.mjs` | parcours : « STC-12 y du mur identique avant et après filtre, pastille et épingle (±1 px) », « STM-1 Commander depuis la fiche de Cryo : « Cryo » dans le texte de Courses », « STE-11 contenu de Courses ≥ 95 % de la largeur », « STM-14 raison dite quand Créer est grisé », « cibles ≥ 44 px » rouges sur tour8 | 3 (après V1 : Cryo doit être comptée) |
| **V4 fiche : gestes et justesse** | STM-2 (STC-14), STM-5, STM-6, STM-7, STM-9, STM-12 (STC-18), STM-13, STM-15, STC-6, STC-7, STC-19 | `src/ui/StockDetailSheet.tsx`, `src/ui/StockFicheBouge.tsx`, `src/ui/stockFichePage.css`, `src/domain/stock/fiche.ts`, `src/domain/stock/ficheArticle.ts`, `src/domain/stock/ficheCle.ts`, `src/domain/stock/ficheValeurs.ts`, `src/domain/stock/mouvementsArticle.ts`, `tests/unit/stockFicheGestes.test.ts` (nouveau), `scripts/parcours/stock-etapes/fiche.mjs` | vitest : seuil vidé → `minStock` absent, 0 saisi → 0 écrit ; parcours : « STM-2 Retour et Échap avec saisie : confirmation ou brouillon », « STM-6 Entrée dans Seuil valide », « STM-7 Entrée sur Nom n'ouvre aucune liste », « STM-5 Enregistrer grisé sans changement », « STC-19 « 200 pièces » », « STC-6 axe sans date répétée » rouges sur tour8 | 2 (parallèle) |
| **V5 Matériel : nom coupé** | STC-16 (part de STE-12) | `src/ui/equipment/ListFil.tsx`, `src/ui/equipment/list.css`, `scripts/parcours/stock-etapes/materiel.mjs` | parcours : « STC-16 « Fermenteur 120 L » ne se coupe pas entre le nombre et l'unité (cellule de 180 px) » rouge sur tour8 | 2 (parallèle) |

Règles communes à recopier dans chaque VOIE.md (L05, L12, L17) :
- fixtures « ZZ TEST — … » seulement, jamais `seedData.ts` ; aucun Gemini, aucun déploiement, aucune donnée réelle ;
- une capture par état touché, prise ET ouverte (L12) ; deux thèmes ; 390 tactile et 1280 ;
- l'inconnu n'est jamais 0 (« ? » ou « aucun », jamais 0) ; une valeur vient d'une source citée ;
- une voie n'écrit que dans « Possède » et son RESULTAT.md ; `git status --short` après chaque voie ; commit par chemins ;
- baseline = plancher à enrichir (L07) ; penser en brasseur (L04) : le nom, l'α, le moment, puis les chiffres ;
- à garder intact (acquis) : l'étagère des ingrédients, Recompter (« il en reste » et la coche), la courbe « Ce qui a bougé » (axe et mots seulement), les pas −1 / +1 selon l'unité ;
- V1 : avant tout code de conversion paquet → grammes, « ## État de l'art » (L29) : lire le poids dans le nom (« 25g ») par une règle unique déjà présente (`src/ui/depense/poidsPiece.ts`, `ingredientIdentity.ts:377`), jamais une regex de plus dans `liste.ts`.

## 3. Ordre d'ensemble

1. **V0** (banc, série mécanique) ;
2. **V1, V2, V4, V5 en parallèle** (fichiers disjoints) ;
3. **V3** après V1 ;
4. rejeu du pilote : tous les critères sur tour8 (rouge), puis sur l'arbre (vert) ; captures 01 et 02 refaites à côté des siennes ;
5. **D1 à D8** : un artefact neuf de mini maquettes, une page par choix, lancé dès maintenant en parallèle de V0 à V5 (rien de codé avant son choix) ; le code d'un choix part après la voie qui possède son fichier (D1, D4 après V3 ; D2, D3 après V2 ; D5 après V4) ;
6. **A1 à A4** : demandés ensemble, une seule fois, en fin de lot.

Risques : (1) la garde de saisie de V4 et le bouton Commander de V3 se rencontrent à `onCommander` (`StocksTab.tsx:873`, `StockDetailSheet.tsx:483`) : le contrat reste `onCommander(): void`, V4 garde avant de l'appeler ; (2) l'Entrée de STM-7 peut venir d'un composant partagé (`FormNav`) que personne ne possède : V4 le règle par la configuration de ses champs, sinon DÉCISION ; (3) si D5 retient un formulaire unique, V4 garde ce que la maquette ne remplace pas (gestes, pas la mise en page) ; (4) les volumes réels (21 manques, 23 épuisés) feront jouer plus fort STE-3, STE-6 et STE-7 : le banc V0 porte aussi un cas lourd.
