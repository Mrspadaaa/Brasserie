# Nuit du 26.11 au 27.11 — journal (heure suisse)

Base : en ligne = tag `en-ligne/2026-11-23-tour80` (1b1c507b5, bundle index-BJS-wSZ1.js) ; branche `claude/nuit-bugs-2611-0406b7`.

- 20:31 départ ; base 4b98e572f (src ≈ tour80 + analyseLocale.ts).
- 20:40 correctif paliers / « + » Eau (727f25086) intégré : 93172a3bd (conflit DEFAUTS-RECURRENTS résolu, deux sections gardées).
- 21:10 paliers / « + » Eau prouvés en local (Chrome 9222, 390 tactile) : `controle-ma-biere.mjs` OK 9/9 ; captures regardées (ajout en tête, total « ≥ 165 min », Sels : « + » au pied).
- 21:55 contrôle générique `outils/scan.mjs` + `lib.mjs` (chevauchement d'un flottant, 6 px d'air pour un fixe ; commande sur commande ; étiquette courte coupée ; valeur coupée) : Ma bière, 8 étapes, KO 4 sur tour 80 (Sels : « + » sur « 1. Eau | 2. Sels » ; Identité : « + » sur « Matériel ») ; OK sur 93172a3bd.
- 22:20 passe en ligne (390 et 360, 31 écrans : onglets, sous-onglets, fiches, Réglages, Journal) : constats NUIT-1 (Volumes : + sur le curseur, « cuve24ette »), NUIT-2 (À venir, Réalisés : + sur la dernière ligne), NUIT-3 (« Actualiser » sous le +), NUIT-4 (Sels à 360 : étiquettes coupées).
- 22:50 correctifs NUIT-1 à 3 (98fbcb39f) ; preuve avant déploiement : CSS injecté dans la page en ligne → chevauchement 0 sur Volumes, À venir, Réalisés (captures regardées).
- 23:05 critique Opus du lot 1 : 9 problèmes, 1 bloquant (Récap : le + couvre « 175–300 ») → NUIT-5 corrigé (042de6a1c, puis hauteur du + : fe… e66801fed sur la branche de mise en ligne).
- 23:20 tests complets : seul écart avec le tour 80 = c81Regles (chantier Carnet suspendu, b7c38b376) → mise en ligne depuis le tour 80 + correctifs de la nuit seulement (branche `claude/nuit-en-ligne-2611`).
- 23:40 seconde critique Opus : 0 bloquant ; `controle-avant-deploiement.mjs e66801fed` : AVANT-DEPLOIEMENT OK.
- 23:55 PERF : le morceau de démarrage App pèse 2 562 Ko (679 Ko gzip) ; jsPDF y entrait par companyDefaults → swissQrBill. Correctif ec7aa5312 : 2 151 Ko (545 Ko gzip), tests factures verts.
- 00:40 PERF : profils en ligne (CPU ×4) — Bord 1 220 ms, Calendrier 1 379 ms ; cause commune `brewBudget.ts` (≈ 1,3 s de balayages du stock par passage) → index du stock et mémo des clés (2 commits, test `brewBudgetIndexStock`).
- 01:05 tests complets du paquet (tour 80 + nuit) : aucun échec neuf face au tour 80 (89 fichiers rouges communs : functions/node_modules, cheerio) ; recapM2 et stoutWaterProfile rattrapés (nom accessible « Enregistrer la recette »).
- 01:10 3e critique Opus : 0 bloquant ; AVANT-DEPLOIEMENT OK (406a10de3).
- 01:15 **EN LIGNE lot 1** : Hosting, `index-Bc72xyPN.js`, tag local `en-ligne/2026-11-27-nuit-lot1` (branche `claude/nuit-en-ligne-2611`, 406a10de3).
- 01:20 rejoué EN LIGNE : `scan.mjs` 31 écrans, CHEVAUCHEMENT OK à 390 et à 360 ; preuve Ma bière sur « ZZ TEST — nuit paliers » (brouillon abandonné) : PREUVE OK 6/6 (ajout α-amylase 72 °C après 67, poignée 67 → 72 au doigt, + en tête, Sels : + au pied à y 788, rien couvert ; Récap : + au pied). Captures regardées.
