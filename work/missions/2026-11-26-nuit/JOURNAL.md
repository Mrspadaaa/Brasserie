# Nuit du 26.11 au 27.11 — journal (heure suisse)

Heures : heure suisse (celles des commits ; les premières notées à la main, corrigées à 01:35).

Base : en ligne = tag `en-ligne/2026-11-23-tour80` (1b1c507b5, bundle index-BJS-wSZ1.js) ; branche `claude/nuit-bugs-2611-0406b7`.

- 21:31 départ ; base 4b98e572f (src ≈ tour80 + analyseLocale.ts).
- 21:40 correctif paliers / « + » Eau (727f25086) intégré : 93172a3bd (conflit DEFAUTS-RECURRENTS résolu, deux sections gardées).
- 22:00 paliers / « + » Eau prouvés en local (Chrome 9222, 390 tactile) : `controle-ma-biere.mjs` OK 9/9 ; captures regardées (ajout en tête, total « ≥ 165 min », Sels : « + » au pied).
- 22:45 contrôle générique `outils/scan.mjs` + `lib.mjs` (chevauchement d'un flottant, 6 px d'air pour un fixe ; commande sur commande ; étiquette courte coupée ; valeur coupée) : Ma bière, 8 étapes, KO 4 sur tour 80 (Sels : « + » sur « 1. Eau | 2. Sels » ; Identité : « + » sur « Matériel ») ; OK sur 93172a3bd.
- 23:00 passe en ligne (390 et 360, 31 écrans : onglets, sous-onglets, fiches, Réglages, Journal) : constats NUIT-1 (Volumes : + sur le curseur, « cuve24ette »), NUIT-2 (À venir, Réalisés : + sur la dernière ligne), NUIT-3 (« Actualiser » sous le +), NUIT-4 (Sels à 360 : étiquettes coupées).
- 23:17 correctifs NUIT-1 à 3 (98fbcb39f) ; preuve avant déploiement : CSS injecté dans la page en ligne → chevauchement 0 sur Volumes, À venir, Réalisés (captures regardées).
- 23:30 critique Opus du lot 1 : 9 problèmes, 1 bloquant (Récap : le + couvre « 175–300 ») → NUIT-5 corrigé (042de6a1c, puis hauteur du + : fe… e66801fed sur la branche de mise en ligne).
- 23:45 tests complets : seul écart avec le tour 80 = c81Regles (chantier Carnet suspendu, b7c38b376) → mise en ligne depuis le tour 80 + correctifs de la nuit seulement (branche `claude/nuit-en-ligne-2611`).
- 23:50 seconde critique Opus : 0 bloquant ; `controle-avant-deploiement.mjs e66801fed` : AVANT-DEPLOIEMENT OK.
- 23:51 PERF : le morceau de démarrage App pèse 2 562 Ko (679 Ko gzip) ; jsPDF y entrait par companyDefaults → swissQrBill. Correctif ec7aa5312 : 2 151 Ko (545 Ko gzip), tests factures verts.
- 00:05 PERF : profils en ligne (CPU ×4) — Bord 1 220 ms, Calendrier 1 379 ms ; cause commune `brewBudget.ts` (≈ 1,3 s de balayages du stock par passage) → index du stock et mémo des clés (2 commits, test `brewBudgetIndexStock`).
- 00:05 tests complets du paquet (tour 80 + nuit) : aucun échec neuf face au tour 80 (89 fichiers rouges communs : functions/node_modules, cheerio) ; recapM2 et stoutWaterProfile rattrapés (nom accessible « Enregistrer la recette »).
- 00:08 3e critique Opus : 0 bloquant ; AVANT-DEPLOIEMENT OK (406a10de3).
- 00:10 **EN LIGNE lot 1** : Hosting, `index-Bc72xyPN.js`, tag local `en-ligne/2026-11-27-nuit-lot1` (branche `claude/nuit-en-ligne-2611`, 406a10de3).
- 00:20 rejoué EN LIGNE : `scan.mjs` 31 écrans, CHEVAUCHEMENT OK à 390 et à 360 ; preuve Ma bière sur « ZZ TEST — nuit paliers » (brouillon abandonné) : PREUVE OK 6/6 (ajout α-amylase 72 °C après 67, poignée 67 → 72 au doigt, + en tête, Sels : + au pied à y 788, rien couvert ; Récap : + au pied). Captures regardées.
- 00:45 banc des gestes (agent Sonnet, GESTES.md) : 5 constats prouvés → NUIT-8 (Échap ferme l'éditeur), NUIT-9 (masse de houblon arrondie au Récap), NUIT-10 (voulus ou mineurs, écrits).
- 00:53 correctifs lot 2 (3b06ae415) : test `pageShellEchap` rouge sur le tour 80, vert après ; Sels lisibles à 360 (NUIT-4).
- 01:05 critique Opus du lot 2 : 2 bloquants (« Bica… » à 390 ; Volumes vu sur une capture d'avant le lot 1) → ⓘ effacée jusqu'à 429 px ; 2e passe : 0 bloquant ; AVANT-DEPLOIEMENT OK (892d7cf2d).
- 01:19 **EN LIGNE lot 2** : `index-CI1mVmm1.js`, tag local `en-ligne/2026-11-27-nuit-lot2`. Preuve avant (lot 1) : Échap KO ; après : `preuve-lot2-live.mjs` OK 2/2, `preuve-ma-biere-live.mjs` 6/6, `scan.mjs` CHEVAUCHEMENT OK.
- 01:30 piège : le service worker du Chrome de banc servait encore le lot 1 après la mise en ligne ; les bancs contournent désormais le service worker (lib.mjs). Sur son téléphone, la nouvelle version arrive par « Nouvelle version ».
- 01:40 portée corrigée (sa parole : « l'eau et palier sont des exemples, il faut regarder toute le reste de l'app dans cette même attention ») : couverture des 85 écrans de l'inventaire répartie en 4 voies Sonnet (fiches ; A finances et saisies ; B recette, brassage, houblons ; C coque, Bord, Stocks, Calendrier, Réglages), brief commun BRIEF-COUVERTURE.md. Déjà couverts : Ma bière (8 étapes, GESTES.md) et le balayage `scan.mjs` de 31 écrans.
- 01:40 lot 3 en attente : zones de toucher des « + » (31 px) et de la poignée ↔ (36 px) des paliers (91103d746, ab87e3a7e), controle-ma-biere 9/9.
- 01:58 couvertures rendues : fiches (5 constats), A finances et saisies (16 écrans, 5 constats), B recette, brassage, houblons (15 écrans, 8 constats), C coque, Bord, Stocks, Calendrier, Réglages (24 écrans, 4 constats) ; rapports dans `couverture/`. Couverture des 85 écrans : voir les tableaux (écrans faits, partiels avec leur raison, non joués).
- 02:29 lot 3 : eau d'empâtage jugée sur sa visée et en °C (test rouge au tour 80), Échap dans une feuille (test modalEchap), Annuel lisible, + dégagé de « Fixer le prix » et de la fin des onglets, zones de toucher des paliers ; critique Opus : 1 bloquant (« Entré 0,00 » illisible, présent au tour 80) → corrigé ; AVANT-DEPLOIEMENT OK (e78b42354).
- 02:31 **EN LIGNE lot 3** : `index-Csuct3L9.js`, tag local `en-ligne/2026-11-27-nuit-lot3`. 02:53 rejoué en ligne : scan 31 écrans OK à 390, 360, cave ; Finances (5 vues) OK ; preuves Ma bière 6/6 et lot 2 2/2.
- 03:04 heures corrigées (horloge du poste, UTC+1) : lignes de 01:40 à 02:53 recalées sur les commits et tags ; chaque ligne prend désormais `date +%H:%M`.
- 03:12 passe 2 rendue : D finances (8 écrans, tous partiels, 2 constats), E brassage (2 sur 7, suite Haiku partielle), F stocks, recherche, réglages, toast, bandeau (9 sur 11, 6 constats) ; rapports couverture/D, E, E-suite, F. Corrigés et prouvés au banc : NUIT-F3 (compté vidé = 0), NUIT-D1 (« 0110 » sans point) ; mineurs écrits NUIT-F4, doutes NUIT-E2.
- 03:25 **EN LIGNE lot 4** : `index-ChwEtZMm.js`, de371f9a4, tag local `en-ligne/2026-11-27-nuit-lot4` ; critique Opus 8 problèmes, 0 bloquant ; AVANT-DEPLOIEMENT OK (2e62fd2b6) ; tests complets : 0 fichier rouge neuf face au tour 80.
- 03:46 rejoué en ligne (lot 4) : preuve-lot4-live.mjs OK 1/1 (période « 0110 »), scan 31 écrans CHEVAUCHEMENT OK à 390, 360, cave ; Ma bière 6/6, lot 2 2/2 ; captures regardées.
- 03:59 couverture H (passe 3) : encaissement, facture, feuille idée, Noter les litres, loupe (4 écrans sur 7) ; NUIT-H1 corrigé (coût d’idée négatif, test rouge avant), NUIT-H2 écrit.
