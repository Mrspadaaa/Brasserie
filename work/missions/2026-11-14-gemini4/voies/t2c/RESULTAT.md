OK — relecture, Max, recherche web et Approfondi mesurés ; recommandation : Approfondi en Hydrogen@medium, le reste garder ; 4,0 CHF de voie

## Fait (14.11 soir, rien dans `src/` ni `functions/src/`, aucun déploiement, Gemini réel seulement par les bancs, jamais dans les tests)
Fichiers : `scripts/banc-t2c-commun.ts`, `banc-t2c-relecture.ts`, `banc-t2c-max.ts`, `banc-t2c-recherche.ts` (fournisseurs, référence), `banc-t2c-approfondi.ts` (dossier du juge, tableau) ; `scripts/banc-compagnon.ts` : options `--voie <préfixe>` (défaut `g2`) et `--mode auto|deep` (défaut `auto`, sortie par défaut inchangée ; avec `--voie` autre que g2 : journal `journal-tour2.md`, plafonds 14,5 tour et 4,5 voie) ; tests `tests/unit/banc-t2c.test.ts`, `banc-t2c-recherche.test.ts` (5 tests de plus : fiches, référence, passe simulée sans rejeu, options, cas en mode deep) ; `voies/t2c/{GRILLE-*.md, relecture/, max/, recherche/, approfondi/, passe-*.log, tests.txt}`.
- `npx vitest run tests/unit/banc-* tests/unit/models*` : 14 fichiers, 365 tests verts (`tests.txt`). `tsc --noEmit -p .` et `-p functions` : 0 erreur.
- Coût de la voie : **4,015 CHF** (relecture 0,80 ; Max 0,65 ; recherche 0,52 ; Approfondi 2,04). Cumul du tour au dernier relevé : 7,34 CHF (autres voies comprises), sous 14,5. Aucun HTTP 429. Coût provisionné (1,25 CHF/USD), pas une facture.
- Tarif : Argon et Carbon 2 $ / 10 $ le million jusqu'au 30.11.2026, **4 $ / 20 $ dès le 1.12.2026 (tarif doublé)** ; Hydrogen et 3.8 : 1,5 $ / 7,5 $, inchangés. Tous les CHF/appel sont au tarif d'avant décembre.

## 1. Relecture du compagnon (`review`) — production : 3.8 réflexion basse
Vérité écrite avant (`GRILLE-relecture.md`) : un défaut planté par cas dans le conseil du vrai corps de relecture, le conseil d'origine en contrôle ; 20 éléments par réglage, moitié choix pour éliminer, moitié jugement pour juger.
| réglage | qualité (exactitude) | inutilisables | p50 s | p90 s | CHF/appel | verdict |
|---|---|---|---|---|---|---|
| 3.8@low (production) | 1,00 (10/10 repérés, 0 faux refus) | 0 | 2,7 | 3,2 | 0,0103 | garder |
| Hydrogen@low | 0,95 (10/10 ; 1 refus fondé d'un conseil d'origine) | 0 | 3,8 | 5,0 | 0,0155 | aucun gain : +41 % de durée, +50 % de coût |
| Flash-Lite 3.5@low | 0,80 (7/10 ; 1 faux refus) | 0 | 0,7 | 0,9 | 0,0021 | écarté : laisse passer 3 défauts sur 10 |
| Argon@low (moitié choix) | 0,70 (5/5 ; 3/5 faux refus) | 0 | 6,8 | 8,2 | 0,0151 | écarté : refuse des conseils approuvés, tarif doublé le 1.12 |
| Carbon@low (6 éléments) | 0,67 (3/3 ; 2/3 faux refus) | 0 | 7,3 | 11,9 | 0,0159 | écarté, même défaut |
Recommandation : **garder** 3.8@low (plafond atteint, aucun modèle ne peut gagner en qualité). Limites : défauts plantés faciles, un tirage, relecture pratique et Approfondi (medium/high) non rejoués.

## 2. Niveau Max (`TIERS.max`) — aucun appelant dans l'app (`grep` de `src/`)
8 cas (diagnostic, anomalies des comptes, synthèse comptable), contrôles chiffrés par le code (`GRILLE-max.md`).
| réglage | qualité | inutilisables | p50 s | p90 s | CHF/appel | verdict |
|---|---|---|---|---|---|---|
| 3.8@high (production Max) | 0,92 | 0 | 20,4 | 29,0 | 0,0269 | témoin |
| Hydrogen@low | 0,91 | 0 | 4,7 | 8,2 | 0,0137 | −49 % de coût, durée ÷ 4,3, qualité −0,01 |
| Hydrogen@high | 0,91 | 0 | 7,9 | 12,8 | 0,0208 | −23 % de coût, durée ÷ 2,6, même qualité |
| Argon@high (4 cas : 0,95 ; 3.8 : 1,00 sur les mêmes) | 0,95 | 0 | 29,2 | 44,8 | 0,0392 | écarté : +46 % de coût, plus lent, tarif doublé le 1.12 |
| Carbon | non joué | | | | | écarté en g2 (ton, lenteur) ; budget |
Recommandation : **si Max est un jour branché, Hydrogen@low** (−49 % de coût, durée ÷ 4,3, même qualité) ; sinon rien à changer. Écart dans le bruit (un tirage, 8 cas) : second tirage avant déploiement. Diff proposé (NON APPLIQUÉ) : dans `models.ts`, une route `maxAttempts(task)` = Hydrogen@low puis 3.8@high, utilisée par `ai.ts` quand `tier === 'max'` hors lecture de pièce, avec test d'ordre d'essai.

## 3. Recherche web (`research`) — 1 chercheur au lieu de 3 (coût), `researchBrewing` de la production, fiches vérifiées par lecture HTTP publique
Vérité écrite avant (`GRILLE-recherche.md`). Fournisseurs : 3 requêtes (Citra 100 g, Maris Otter 25 kg, Safale US-05 11,5 g) ; fiche « pertinente » = nom contient la variété, « exacte » = en plus le conditionnement. Référence fabricant : 2 questions Fermentis (plage de fermentation US-05, W-34/70) ; vérité = source citée du domaine fermentis + fait clé (bornes de température) dans le texte. Un tirage par cellule.
Fournisseurs (`find_brewing_suppliers`, production : 3.8 réflexion basse) :
| réglage | fiches vérifiées (3 requêtes) | pertinentes | exactes | inutilisables | p50 s | p90 s | CHF/appel | verdict |
|---|---|---|---|---|---|---|---|---|
| 3.8@low (production) | 14 | 10 | 5 | 0 | 8,2 | 10,2 | 0,0383 | garder |
| Hydrogen@low | 7 | 6 | 4 | 0 | 6,5 | 9,8 | 0,0385 | écarté : moitié moins de fiches vérifiées et de pertinentes, même coût (cohérent avec g2 : aucun fournisseur nommé sur le cas joué) |
| Argon@low | 16 | 13 | 6 | 0 | 17,7 | 27,6 | 0,0470 | écarté : +20 % de fiches, durée ×2, +23 % de coût, tarif doublé le 1.12 |
Référence fabricant (`lookup_brewing_reference`, production : Flash-Lite@minimal, repli 3.8) :
| réglage | source primaire citée | fait clé | inutilisables | p50 s | p90 s | CHF/appel | verdict |
|---|---|---|---|---|---|---|---|
| Flash-Lite 3.5@minimal (production) | 2 | 2/2 | 0 | 1,8 | 2,5 | 0,0181 | garder |
| 3.8@low | 3 | 2/2 | 0 | 6,8 | 6,8 | 0,0299 | aucun gain : 3,8× plus lent, +65 % de coût |
| Hydrogen@low | 4 | 2/2 | 0 | 4,1 | 8,0 | 0,0284 | aucun gain : 2,3× plus lent, +57 % de coût |
Recommandation : **garder** les deux (3.8@low pour les fournisseurs, Flash-Lite@minimal pour la référence). Limites : 3 requêtes et 2 questions, un tirage ; les résultats de recherche et les boutiques varient d'un jour à l'autre (l'écart 7 contre 14 fiches peut en partie venir de là) ; seuls 2 contrôles de domaine et fait clé sont durs, tous passés par les trois modèles (plafond) ; un chercheur au lieu de trois (la production en lance jusqu'à trois : la couverture réelle est meilleure, le classement des modèles, lui, ne devrait pas changer).

## 4. Mode Approfondi (`mode: 'deep'`, rôle analyse) — production : 3.8, réflexion haute à la décision, moyenne aux suites, 12 000 jetons ; relecture 3.8 haute dans toutes les cellules
Cellules : production ; Hydrogen@medium ; Hydrogen@high pour tous les appels d'analyse (au lieu de haute/moyenne selon l'étape). Cas du banc g2 : moitié choix (edit-recipe, low-ph, fermentation, grassy), moitié jugement (power, color) ; 18 sorties anonymisées, notées à l'aveugle par l'auteur (grille de g2, `approfondi/notes-juge-tout.json`), second regard : règles automatiques de la grille. Deux cas de jugement seulement (budget).
| réglage (6 cas) | qualité juge (auto) | inutilisables | p50 s | p90 s | CHF/question | appels/question | verdict |
|---|---|---|---|---|---|---|---|
| 3.8 haute/moyenne (production) | 0,91 (0,92) | 0 | 20,4 | 70,7 | 0,157 | 3,7 | témoin |
| Hydrogen@medium | 0,98 (0,90) | 0 | 14,0 | 23,3 | 0,073 | 2,7 | −53 % de coût, p50 ÷ 1,5, p90 ÷ 3, qualité +0,07 |
| Hydrogen@high | 0,98 (0,99) | 0 | 15,3 | 70,2 | 0,110 | 3,5 | −30 % de coût, p90 identique à la production |
Par moitié : choix (4 cas) production 0,90 / H@medium 0,97 / H@high 0,99 ; jugement (2 cas) 0,92 / 1,00 / 0,97. Le pic de durée et de coût vient du cas « fermentation » : 70 s et 0,37 CHF en production, 70 s et 0,19 CHF avec H@high (5 appels : la relecture haute refuse et l'analyse repart), 23 s et 0,06 CHF avec H@medium (2 appels).
Recommandation : **Hydrogen@medium en Approfondi** (gain mesuré : −53 % de coût, p90 de 71 à 23 s, qualité égale ou meilleure sur 6 cas). Hydrogen@high : à écarter (aucun gain de durée sur le cas lent, qualité équivalente, coût plus haut). Prudence : un tirage, 6 cas, juge = l'auteur (aveugle sur les cellules, pas sur la grille) ; l'écart de qualité (0,07) est dans le bruit, le gain de coût et de durée est le seul résultat solide ; second tirage conseillé avant déploiement. Argon et Carbon non joués en Approfondi : spéculation et verbosité déjà vues en g2 (ton hors cadre), tarif doublé le 1.12.
Diff proposé (NON APPLIQUÉ, `functions/src/brewerHarness.ts` ; test d'ordre d'essai et de niveau) : dans `call`, la route de l'analyse en Approfondi devient `brewerAnalysisAttempts()` comme hors Approfondi : remplacer `purpose === 'analysis' && !deepAnalysis && !analysisModelDown` par `purpose === 'analysis' && !analysisModelDown`, et fixer le niveau d'Hydrogen en Approfondi à `medium` à toutes les étapes (aujourd'hui `high` à la décision) : `thinkingLevel: ... : deep && strong && purpose === 'analysis' ? 'medium' : repairingAdvice || ...`. La relecture, la recherche et le repli sur 3.8 (une tentative) ne changent pas.

DÉCISION À PRENDRE : brancher ou non (a) Hydrogen@medium en Approfondi (recommandé : −53 % de coût, p90 ÷ 3), (b) un vrai usage Max (aucun écran n'appelle `monthlySummary`, `detectAnomalies`, `generateRecipe` ; le diagnostic de brassin part en Rapide). Options : (a) seule maintenant ; (b) router `max` vers Hydrogen@low le jour du branchement ; pas de changement de relecture ni de recherche. Décideur : pilote ; second tirage de (a) avant déploiement (≈ 1 CHF, hors budget de la voie).
CONNAISSANCE : en Approfondi, la relecture haute de 3.8 refuse parfois le conseil et relance l'analyse (cas fermentation : 5 appels, 0,19 à 0,37 CHF, 70 s) : le coût de l'Approfondi vient surtout de ces relances ; la recherche web de fournisseurs sur 3.8@low trouve deux fois plus de fiches vérifiées qu'Hydrogen@low sur 3 requêtes (14 contre 7, un tirage).
LEÇON PROPOSÉE : aucune.
