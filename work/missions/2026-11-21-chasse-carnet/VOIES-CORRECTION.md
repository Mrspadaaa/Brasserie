# Voies de correction — Chasse Carnet (21.11)

Source : les 4 chasses CHASSE-{carnet,besoin,ux,workflow}.md, versées à `work/missions/BUGS.md` (ids CRP, CRB, CRU, CRW ; commit 51144e2f0).
Code : worktree `port-carnet` (branche `claude/port-carnet-1711`, = tag `en-ligne/2026-11-21-tour8` + une ligne de `CarnetsVue.tsx`).
Plaintes du brasseur : CRN-PRIX et CRN-CREATION-VUE (`DEFAUTS-RECURRENTS.md`, l. 475-476).

Les 26 défauts distincts ouverts (+ 10 doublons reliés + 3 notes) se rangent en trois catégories. Seule la première part en code tout de suite.

## 1. Les trois catégories

### Correctif — le code seul, sans choix de forme (voies V0 à V4)

| id | ce qu'on corrige | voie |
|---|---|---|
| CRP-1 (= CRB-1, CRW-1) | le prix lu arrive à l'article : maillons 2 et 3 (client) ; maillon 1 (serveur) testé en local | V1, V2 |
| CRP-2 (= CRB-4) | « l&apos; » décodé ; « Couleur : » sans ses deux-points ; articles déjà stockés nettoyés **à la lecture**, sans écrire les données | V1, V2 |
| CRB-2 (= CRU-2) | la rangée prix de Comparer existe toujours, « prix ? » quand inconnu, jamais 0 | V3 |
| CRB-5 | pas de rang 1 tant qu'aucun critère n'est posé | V3 |
| CRB-13 | dispo, vendeur, pays en lignes de Comparer (le modèle les porte déjà) | V3 |
| CRB-14 | ordre des lignes : prix, volume, dimensions, porte, livraison, puis le groupe ; couleur en bas | V3 |
| CRU-6 | valeur texte en Source Sans, à gauche ; mono pour nombre et unité seulement | V3 |
| CRU-13 | ombre de bord droit seulement s'il reste une suite | V3 (caduc si les cartes de D1 sont retenues) |
| CRB-9 | « Chambre froide - » retiré du nom d'article à l'affichage | V2 |
| CRU-3, partie a | créer = ouvrir aussitôt la fiche ; le titre IA est proposé (« Renommer en … ? Oui · Garder »), jamais imposé ; compteur incrémenté une fois | V2 |
| CRW-3 | Choisir sans prix : plan daté par défaut (3 mois, `datePrecision: 'month'`, `estimateSource: 'estimate'` existent déjà), prix inconnu marqué, jamais 0 | V2 |
| CRW-4 | à vérifier au doigt d'abord ; correctif seulement si deux prix coexistent | V2 |
| CRB-7 (= CRU-7, CRW-7) | aucune ligne vide « rien encore », « aucune » au premier plan (« Photos · aucune » comprise) | V4 |
| CRU-3, partie b | la fiche garde la même mise en page avant et après le rangement ; attente de l'IA en squelette dans sa section | V4 |
| CRU-11 | échelle DESIGN : titre 18, corps 14, libellés 12 (Comparer : V3, le reste : V4) | V3, V4 |
| CRU-12 | cible « critère sans valeur à comparer » d'au moins 24 px | V4 |

### « À dessiner » — un changement de forme visible : mini maquettes au brasseur, rien n'est codé avant son choix (règle n° 1, L24)

Un artefact neuf, une page par choix (D126), variantes et référence côte à côte, chaque variante partant de sa maquette choisie du Carnet
(figés p2:h05-3, p2:i06-4, g5:v03-6 ; registre `ecrans.json`). Le « comparer » du registre est celui des houblons : il ne couvre pas Comparer du Carnet.

| choix | ids | variantes à montrer |
|---|---|---|
| D1 Comparer à 390 | CRB-3 (= CRU-1), CRU-5, CRU-13 | cartes côte à côte pour 2 à 3 articles ; lignes à attribut épinglé au-delà ; aujourd'hui (tableau de 1091 px) en référence. Dit aussi la rangée prix épinglée (CRB-2) et l'en-tête compact |
| D2 Rangée Articles de la fiche | CRB-8 (= CRU-4) | colonnes courtes « prix · m³ · dispo » ; liste à attribut épinglé ; nom réduit à ce qui distingue |
| D3 Liste des carnets | CRB-10, CRB-11 (= CRU-9) | rangées d'une ligne de 48 px ; fourchette « 2 400 à 3 100 CHF » ou article en tête ; « Coller un lien » une seule fois |
| D4 Un seul point d'ajout | CRB-12 (= CRU-10) | le champ seul ; le champ qui se replie en icône sur Comparer ; le + seul |
| D5 Quand et sections à compléter | CRU-8, part de CRU-7 | contrôle segmenté d'une rangée ; une rangée qui ouvre une feuille de dates ; une ligne « À compléter : critères, façons, date › » |
| D6 Prix de l'article | CRW-2 | champ « Prix ? » sur la carte ; saisie dans la fiche ; estimation marquée ; l'opération `modifierArticle` (domaine) se code sans attendre, son geste attend D6 |
| D7 Commander, facture → plan | CRW-5, CRW-6 | la chasse workflow écarte déjà le suivi de livraison et classe W3 non candidat (fréquence rare, 0 réalisé) : proposer d'**écarter** ; page courte seulement si le brasseur veut la voir |

Recommandation pilote : D1 d'abord (bloquant : les valeurs de Comparer sont invisibles à 390), puis D6 (racine de CRN-PRIX), D2, D3, D4, D5.
D1 touche `Comparer.tsx` : V3 se fait **avant** D1 et n'y garde que ce que D1 ne remplace pas.

### « Accord » — gestes irréversibles ou externes ; le code et les tests locaux se font, rien ne part sans lui

| id | ce qui attend | pourquoi |
|---|---|---|
| A1 : CRP-1 maillon 1, CRP-2 | déploiement des functions (`functions/src/lireLien.ts`) | sans lui, le prix des offres variables et « l&apos; » restent côté serveur ; V2 rattrape déjà ce qu'il peut côté client |
| A2 : CRB-6 | Gemini réel : « critères proposés dès le 2e article » vient du modèle (`functions/src/carnetIA.ts`, prompt) | un test spécial dédié, lancé explicitement, journalisé ; jamais dans `npm test` ; déploiement des functions |
| A3 : nettoyage des articles déjà stockés | écriture sur les données réelles | non demandé : le décodage à la lecture (V2) évite d'écrire |
| schéma | aucun attendu : `prixCentimes`, `devise`, `FinancialPlan.upgrade` (`datePrecision`, `estimateSource`) existent | à confirmer par V2 ; un champ de plus devient un accord |

Notes à rejouer au banc (hors voie, sans accord) : CRB-NOTE-1 (ruban de dates de Stocks), CRB-NOTE-2 (« Performance » sans unité : page réelle),
CRU-NOTE-1 (échec et lenteur de l'IA, hors ligne : échec simulé, jamais Gemini).

## 2. Les voies de correctif : fichiers disjoints, contrôle, ordre

Fichiers cherchés par grep dans `port-carnet` (src/ui/carnets, src/domain/carnets, functions/src, scripts/parcours, tests/unit). Aucun fichier n'est dans deux voies.

| voie | ids | fichiers possédés | contrôle (rouge sur tour8) | ordre |
|---|---|---|---|---|
| **V0 banc** | (prépare tous les contrôles) | `scripts/parcours/carnet.mjs`, `scripts/parcours/fixtures/carnet.mjs`, `scripts/parcours/carnet-etapes/` (le dossier : le banc charge un fichier par voie) | `node scripts/parcours/carnet.mjs <dossier> --ref en-ligne/2026-11-21-tour8` : la fixture « ZZ TEST — Chambre froide » (2 articles sans prix, 10 caractéristiques en texte dont « Épaisseur de l&apos;isolation » et « Couleur : », la lecture simulée qui publie « 4'890.00 ») rejoue les captures 02, 03, 04 du brasseur | 1 |
| **V1 lecture du lien** | CRP-1 (maillon 1), CRP-2, CRB-4 | `functions/src/lireLien.ts`, `functions/src/carnetIA.ts` (type seul, si besoin), `tests/unit/carnetsLireLien.test.ts` | `npm test -- tests/unit/carnetsLireLien.test.ts` : cas AggregateOffer, deux offres, devise absente, `4'890.00`, `4 890,00`, `4,890.00`, « l&apos; » dans additionalProperty ; écrits d'abord, rouges sur le `lireLien.ts` du tag, verts après | 2 (parallèle) |
| **V2 prix, plan, création** | CRP-1 (maillons 2 et 3), CRP-2 (lecture), CRB-9, CRU-3a, CRW-3, CRW-4, CRB-10 (le « dès » vient avec CRP-1) | `src/domain/carnets/{ia,iaSimulee,modele,operations,rangement,analyseLocale}.ts` (+ `src/ui/carnets/rangement.ts`, `titre.ts`, `RenommerCarnet.tsx`), `src/ui/carnets/CarnetsVue.tsx`, `tests/unit/carnetsPrixArticle.test.ts` (nouveau), `scripts/parcours/carnet-etapes/prix-plan-creation.mjs` | vitest : l'article prend `p.prix` quand l'IA n'en rend pas ; `nomArticle` sans préfixe du carnet ; `planDepuisChoix` date non vide ; titre proposé inchangé sans geste. Parcours : « CRP-1 prix de chaque article visible dans la liste et la carte », « CRU-3a la fiche s'ouvre à la création, titre tapé inchangé, compteur 17 puis 17 » rouges avec `--ref en-ligne/2026-11-21-tour8`, verts sur l'arbre | 2 (parallèle) |
| **V3 Comparer** | CRB-2 (= CRU-2), CRB-5, CRB-13, CRB-14, CRU-6, CRU-13, CRU-11 (partie Comparer) | `src/ui/carnets/Comparer.tsx`, `src/domain/carnets/comparer.ts`, `src/ui/carnets/carnets-decider.css`, `src/ui/carnets/FicheArticle.tsx`, `src/ui/carnets/CarteArticle.tsx`, `tests/unit/carnetsComparerPrix.test.ts` (nouveau), `scripts/parcours/carnet-etapes/comparer.mjs` | vitest : colonne prix présente sans prix (« prix ? », jamais 0), rang `null` sans critère, ordre des lignes. Parcours : « CRB-2 rangée prix », « CRB-5 aucune pastille de rang sans critère », « CRU-6 aucune valeur texte en mono » rouges sur tour8 | 2 (parallèle) |
| **V4 fiche du carnet** | CRB-7 (= CRU-7, CRW-7), CRU-3b, CRU-11 (reste), CRU-12 | `src/ui/carnets/{CarnetOuvert,EtatIA,Photos,CadreArrivee,Bandeau}.tsx`, `src/ui/carnets/carnets.css`, `src/ui/carnets/carnets-fil.css`, `scripts/parcours/carnet-etapes/fiche.mjs` | parcours : « CRB-7 aucune ligne “rien encore” ni “aucune” au premier plan », « CRU-12 cibles ≥ 24 px », « CRU-3b CLS de la fiche < 0,05 entre création et fin du rangement » (mesure `PerformanceObserver`), rouges sur tour8 ; mots du premier écran comptés | 3 (après V2 : CRU-3b a besoin de l'ouverture aussitôt) |

Règles communes à recopier dans chaque VOIE.md (L05, L12, L17) :
- fixtures « ZZ TEST — … » seulement ; IA simulée (`?dev-local`) ; aucun Gemini, aucun déploiement, aucune donnée réelle ;
- 390 tactile (CDP, jamais `element.click()`) et 1280 souris, clair et cave ; une capture ouverte et regardée par état touché ;
- l'inconnu n'est jamais 0 : « prix ? » ; une valeur vient d'une source citée, le simulé est marqué ;
- une voie n'écrit que dans « Possède » et son RESULTAT.md ; `git status --short` après chaque voie ; commit par chemins ;
- baseline = plancher à enrichir (L07) ; penser en brasseur : le prix, puis ce qui y tient, puis ce qui y rentre (CHASSE-besoin) ;
- avant tout code de V1 : l'« État de l'art » du problème « lire un prix localisé et décoder des entités » (L29). Piste à confirmer : l'analyse de
  prix par un analyseur de nombres localisé, le décodage par la bibliothèque d'entités déjà tirée par cheerio, jamais une regex de plus dans `nombre`.

## 3. Ordre d'ensemble

1. **V0** (banc, 1 voie, série mécanique : Haiku peut rejouer les captures) ;
2. **V1, V2, V3 en parallèle** (fichiers disjoints) ;
3. **V4** après V2 ;
4. rejeu du pilote : tous les critères sur tour8 (rouge) puis sur l'arbre (vert), captures 01 à 07 refaites à côté des siennes ;
5. **D1 à D7** : artefact neuf de mini maquettes, une page par choix, lancé dès maintenant en parallèle de V0 à V4 (rien de codé avant son choix) ;
6. **A1, A2** : demandés ensemble à l'utilisateur, une seule fois, en fin de lot (« déployer les functions : lireLien, carnetIA »).

Risques : `CarnetsVue.tsx` (1410 lignes) ne va qu'à V2 ; la pastille de rang à l'écran passe par `CarnetOuvert.tsx:768` (V4) alors que la règle est dans
`comparer.ts` (V3) : V4 vérifie seulement qu'un rang `null` s'affiche sans pastille ; si D1 retient les cartes, CRU-13 et une partie de CRU-6 tombent.
