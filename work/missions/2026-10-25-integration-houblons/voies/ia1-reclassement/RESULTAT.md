OK — ia1 (100 appels, 1,098 CHF) puis ia2 (60 appels lite, 0,184 CHF) : option 1 + IA lite = MRR 0,206 contre 0,107 (option 1) sur 30 houblons ; côte à côte prêt

## Fichiers écrits
- `scripts/eval-hop/ia-reclassement.ts` : `--figer`, `--simule[=fautes]`, `--reel --confirm-paid-ai --max=N`, `--rapport` (options `--pool=moteur|opt1`, `--modele=3.8|lite`, `--cas`, `--moment`, `--date`). Réemploie `gemini38LiveCore.ts` (hôte et modèle de la liste blanche, ligne de journal par appel parti, coût estimé), `paid-ai-test-guard.mjs` (consentement), `models.ts`. Ajoute sa propre réservation de compteur (100 / 5 CHF), car le compteur du noyau est figé à 40. `banc-eval.ts` et `metriques.ts` : non modifiés (`metriques.ts` importé ; la logique de classement de e1 est copiée, car importer `banc-eval.ts` réécrit ses résultats).
- `voies/ia1-reclassement/requetes/requetes-moteur.json` (78 cas) et `requetes-opt1.json` (39 cas) : requêtes figées, empreinte vérifiée avant tout envoi.
- `voies/ia1-reclassement/resultats/rapport.md` (synthèse : MRR, rappel@10, rang médian, 9 phares avec les 10 premiers, K1 à K5, durée, jetons, coût) ; `resultats/2026-10-26/` : `rapport-moteur.md`, `rapport-opt1.md`, `metriques-*.json`, `reponses-{moteur-3.8,moteur-lite,opt1-3.8,opt1-lite}/` (100 réponses brutes avec entrée hachée, sortie, durée, jetons, coût) ; `resultats/simule/` et `simule-fautes/`.
- `work/finalisation-tickets-2026-10-08/gemini-journal.md` (hors git) : section « ia1 », 100 lignes, compteur « 100 / 100 · 1.0980 CHF / 5 ».

## Critères
1. **Passe simulée = moteur de e1** : moteur recalculé sur les 217 houblons identique à e1 (MRR 0,118 à 60′, 0,121 au dry hop ; option 1 0,202, rappel@10 17,5 %, rang médian 14) et 74 rangs sur 74 des substituts des 9 phares retrouvés (`rapport-simule.md` §0). e1 n'a pas gardé les rangs par cas : recalculés. Avec un fournisseur « identité », l'IA donne exactement les métriques du moteur ; avec fautes injectées (JSON coupé, id hors liste, doublon), les réponses invalides sont refusées. TENU.
2. **Journal / enveloppe / modèles** : 100 lignes de journal pour 100 appels (`grep -c` des lignes du 26.10 = 100), 1,098 CHF sur 5 ; `modelVersion` observé : 87 × `gemini-3.8-flash`, 13 × `gemini-3.5-flash-lite`, rien d'autre. TENU.
3. `npx vitest run tests/unit/hopIndexV4` : 41 fichiers, 329 tests verts ; `npm run build` vert ; `git diff --stat -- src/domain src/ui` vide à la fin ; `check-test-boundary.mjs` vert. TENU.

Essais : un par critère. Trois bogues du lanceur corrigés en cours de route, hors critères : un guillemet dans l'invite, le mode « fautes » mal transmis au fournisseur simulé, et un remplacement de chaîne (`$'`) qui avait corrompu un gabarit (voir leçon).

## Résultats décisifs (détail dans `resultats/rapport.md`)
- **Protocole écrit (IA 3.8 sur les 20 premiers du moteur, 78 cas)** : MRR 0,079 → 0,164 (+0,085, intervalle à 95 % +0,029 à +0,143), rappel@10 7,9 → 10,5 % ; option 1 : 0,106 et 9,6 %. Sur l'échantillon seul (60 cas) +0,072 (intervalle > 0). À 60′ le gain n'est pas établi (+0,058, intervalle −0,021 à +0,146).
- **Seuil du protocole : NON ATTEINT, par construction** : Hallertau Blanc est 155e chez le moteur, donc hors des 20 candidats. Plafond : un substitut de référence est dans la fenêtre pour 25 cas sur 78 (MRR maximal 0,333).
- **Variante : l'IA sur les 20 premiers de l'option 1** (9 phares, dry hop) : MRR 0,180 → 0,563, rappel@10 16,2 → 31,5 %, Hallertau Blanc **1er** chez Nelson Sauvin (K4 tenu) ; +0,383 sur l'option 1 (intervalle +0,167 à +0,628). 9 cas seulement.
- **Flash-Lite contre 3.8** : qualité égale sur 13 appels (MRR 0,317 contre 0,345 sur 9 phares ; identique sur 4) ; durée p95 **2,8 s** (3.8 : 7,4 s, hors limite de 3 s) ; **0,0031 CHF** par usage (3.8 : 0,0121).
- K1 à K3 : non applicables (Suggérer). K5 : tenu partout.

## Doutes et limites
- Le modèle a pu lire Beer Maverick (même source que la référence) ; gain visible aussi sur les 30 houblons moins célèbres, mais ce n'est pas une preuve d'absence de fuite.
- La variante option 1 n'a été essayée que sur 9 phares (4 pour lite) : l'enveloppe est épuisée. Un seul passage par cas, aucune variance de répétition.
- Une réponse à 11 entrées (santiam, dry hop) a d'abord été comptée invalide ; la règle garde désormais les 10 premières. Rapports ré-analysés avec la règle actuelle ; dit dans le rapport.
- « Meilleur rang » = plus proche de Beer Maverick, pas jugé par le brasseur : il n'a pas vu les listes.

DÉCISION À PRENDRE : brancher l'IA, l'option 1 seule, ou les deux ? Options : (A) option 1 seule, hors ligne, gratuite (MRR 0,202 contre 0,121 sur 217 houblons, Hallertau Blanc 2e chez Nelson) ; (B) IA seule sur le moteur (+0,085, mais ne peut pas remonter Hallertau Blanc, ne corrige pas 60′) ; (C) les deux : option 1 en liste par défaut et hors ligne, puis un geste « Affiner avec l'IA » qui reclasse ses 20 premiers avec 3.5 Flash-Lite, une phrase par choix (~2 s, ~0,003 CHF par geste), repli sur la liste de l'option 1 hors ligne ou en cas d'échec/réponse invalide. Recommandation : C par étapes. D'abord brancher l'option 1 (voie de code à ouvrir, décision du pilote ; elle change `src/domain`), au dry hop et au whirlpool seulement (elle ne change rien à 60′). Ensuite, avant de brancher l'IA : un second essai de ~30 appels lite (≈ 0,1 CHF) de la variante option 1 sur l'échantillon de 30 houblons, à 60′ aussi, sous une nouvelle enveloppe (celle-ci est à 100/100) ; puis montrer au brasseur 5 à 10 listes IA contre option 1 côte à côte (c'est lui qui juge, pas Beer Maverick). Pas de 3.8 pour cet usage : trop lent pour l'écran Substituer.

CONNAISSANCE : (1) un classement reclassé par une IA sur une fenêtre de 20 ne peut pas remonter ce que le moteur a rejeté : 25 cas sur 78 seulement ont un substitut de référence dans les 20, et Hallertau Blanc (155e) est hors de la fenêtre du moteur pour Nelson Sauvin ; (2) mesures de l'essai du 26.10 : Flash-Lite, ~3 900 jetons en entrée et ~540 en sortie, p95 2,8 s, 0,0031 CHF par appel ; 3.8 `low` p95 7,4 s, 0,0121 CHF. Note proposée : `cerveau/metier/` « reclassement-ia-substituts ».

LEÇON PROPOSÉE : (a) Avant d'écrire un protocole d'essai à fenêtre (le moteur présélectionne, le modèle reclasse), vérifier que le cas-clé du brasseur tient dans la fenêtre : ici le critère Nelson Sauvin / Hallertau Blanc était impossible par construction (155e du moteur, fenêtre de 20) ; contrôle : rang du cas-clé dans la fenêtre avant tout appel payant. (b) Étendre L26 à toute édition scriptée : un `String.replace` avec une chaîne de remplacement lit `$'`, `` $` `` et `$&` ; passer une fonction ou `split/join` (cela a corrompu un fichier de cette voie, vu avant exécution).

---

# Section ia2 — suite sous une nouvelle enveloppe (70 appels, 1 CHF, Flash-Lite seul), 26.10

## Fichiers (ia2)
- `scripts/eval-hop/ia-reclassement.ts` : `--section=ia2` (compteur 70 / 1 CHF, section « ia2 » du journal, refus de tout autre modèle que Flash-Lite), cas 60′ de la variante option 1, intervalles à 95 % de chaque système, `--cote-a-cote`.
- `requetes/requetes-opt1.json` figé de nouveau : 78 cas (30 houblons de l'échantillon et 9 phares, 60′ et dry hop), empreinte `8c201f044632d98f` vérifiée avant l'envoi (les 39 cas du dry hop d'ia1 sont identiques mot pour mot ; `requetes-moteur.json` inchangé, `0dfecaf4cfa656bb`).
- `resultats/ia2/` : `rapport-opt1.md`, `metriques-opt1.json`, `reponses-opt1-lite/` (60 réponses brutes) ; `resultats/simule-opt1/`, `simule-fautes-opt1/` (passe à vide) ; `resultats/cote-a-cote.json`.
- Journal : section « ia2 », 60 lignes, compteur « 60 / 70 · 0.1835 CHF / 1 » ; 60 réponses observées en `gemini-3.5-flash-lite`, rien d'autre. Reste 10 appels, 0,82 CHF.

## Passe à vide d'abord
Fournisseur simulé, journal temporaire : l'IA qui rend l'ordre de l'option 1 redonne exactement les métriques de l'option 1 (MRR 0,107, rappel@10 10,1 %, rang médian 31,5 sur 60 cas) ; avec fautes injectées, 33 réponses sur 60 refusées sans casser le classement.

## 1. Variante « option 1 + IA lite » sur les 30 houblons de l'échantillon (60 cas, graine 181)
Intervalles à 95 % : rééchantillonnage des cas, 2000 tirages, graine fixe. 60 réponses sur 60 valides.

| système | MRR | rappel@10 | rang médian du 1er |
|---|---|---|---|
| moteur seul | 0,086 (0,050 à 0,128) | 9,3 % (3,7 à 15,5) | 37,5 (23,5 à 52) |
| option 1 (hors ligne) | 0,107 (0,066 à 0,155) | 10,1 % (4,6 à 16,3) | 31,5 (17 à 44,5) |
| **option 1 + IA lite** | **0,206 (0,120 à 0,299)** | **14,5 % (7,6 à 21,9)** | 31,5 (16 à 44,5) |

- IA contre option 1 : **+0,100 de MRR (intervalle +0,039 à +0,170)**, +4,4 points de rappel@10 ; le premier substitut monte dans 15 cas, descend dans 7, ne bouge pas dans 38. IA contre moteur : +0,121 (+0,057 à +0,196), +5,2 points de rappel@10.
- Dry hop (30 cas) : option 1 0,130 → 0,199 (+0,069, intervalle **0,000** à +0,149 : limite), rappel@10 13,6 → 21,5 %, rang médian 17 → 15. 60′ (30 cas) : 0,083 → 0,214 (+0,130, +0,043 à +0,241), mais le rappel@10 ne passe que de 6,5 à 7,4 % et le rang médian ne bouge pas (49) : le gain vient de 5 cas qui montent (1 descend).
- **Plafond de la fenêtre** : un substitut de référence est parmi les 20 candidats dans 24 cas sur 60 ; MRR maximal d'une IA parfaite 0,412. Le rang médian ne bouge pas, comme en ia1.
- **Durée** : médiane 2,0 s, **p95 2,17 s** (max 2,73 s) → tient la limite de 3 s. Jetons : 3 794 en entrée et 524 en sortie en moyenne. **Coût** : 0,0031 CHF par usage (0,1837 CHF pour 60).
- Le critère Hallertau Blanc n'est pas mesurable ici (Nelson Sauvin n'est pas dans l'échantillon) ; il reste tenu sur les 4 phares d'ia1 (1er, lite).

## 2. `resultats/cote-a-cote.json` (pour le brasseur)
8 phares au dry hop (Nelson Sauvin, Citra, Motueka, Mosaic, Galaxy, Simcoe, Saaz (CZ), Cascade). Pour chacun : 10 premiers du moteur, de l'option 1 et de l'option 1 + IA (nom, rang, phrase de l'IA pour sa colonne), substituts Beer Maverick avec leur rang dans chaque liste (`null` : non relié au catalogue), mots et α du houblon, modèle et fichier de la réponse. **Aucun nouvel appel** : les réponses d'ia1 servent ; **4 sont de Flash-Lite** (Nelson Sauvin, Citra, Motueka, Mosaic) **et 4 de 3.8** (Galaxy, Simcoe, Saaz, Cascade), le champ `modeleIA` le dit pour chaque phare. Pour une colonne uniforme en Flash-Lite : 4 appels (≈ 0,012 CHF) sur l'enveloppe restante, à ta décision.

## Doutes et limites (ia2)
- Un passage par cas, aucune répétition ; même source que la référence (le modèle a pu lire Beer Maverick). Le gain sur 30 houblons moins célèbres que les phares est cependant net.
- Au dry hop seul, la borne basse de l'écart à l'option 1 touche zéro : le gain y est probable, pas établi. À 60′ il tient sur peu de cas.
- Meilleur rang = plus proche de Beer Maverick, pas jugé par le brasseur : le côte à côte sert à cela.
- Le texte d'opt-in affiché au lancement dit encore « ia1 » (étiquette), sans effet sur le compteur ni le journal.

DÉCISION À PRENDRE : brancher l'IA par-dessus l'option 1 ? Les mesures d'ia2 confirment la recommandation C : +0,100 de MRR sur l'option 1 (intervalle > 0), 2,2 s au p95, 0,003 CHF par geste. Options : (1) brancher l'option 1 seule (hors ligne) ; (2) option 1 + geste « Affiner avec l'IA » en Flash-Lite, repli sur l'option 1 ; (3) attendre le jugement du brasseur sur `cote-a-cote.json` avant (2). Recommandation : (3) puis (2) : c'est lui qui juge si les phrases et les listes valent mieux que Beer Maverick ; le geste reste à la demande, jamais dans le calcul automatique.

CONNAISSANCE : Flash-Lite sur 60 cas, fenêtre de 20 de l'option 1 : p95 2,17 s, 0,0031 CHF, 100 % de réponses valides, MRR 0,206 contre 0,107 ; plafond 0,412 tant que la fenêtre ne contient un substitut de référence que dans 24 cas sur 60.

LEÇON PROPOSÉE : aucune nouvelle.
