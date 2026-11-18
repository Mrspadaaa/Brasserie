OK — Compagnon : Hydrogen@low tient en analyse sur 12 cas (juge 0,93 contre 0,87 pour 3.8, −26 % de coût) ; relecture et recherche restent 3.8

## Ce qui est livré (14.11, rien dans `src/` ni `functions/src/`, aucun déploiement ; banc et grille de la 1re reprise inchangés)
- Banc : `scripts/banc-compagnon.ts`, `banc-compagnon-grille.ts`, `banc-compagnon-tableau.ts`, `tests/unit/banc-compagnon.test.ts` (14 tests simulés, 88 verts avec les 3 autres fichiers, `tests.txt`) ; tsc racine et `functions/` : 0 erreur (aucun code touché cette reprise).
- Mesures de cette reprise : `sorties/<cellule>/<cas>.json` (47 cas), `tableau-choix.md`, `tableau-jugement.md`, `notes-juge-choix.json`, `notes-juge-jugement.json`, `sorties/dossier-juge-*.md` + clés, `passe-A.log`, `passe-B.log`, `passe-C.log`, `passe-C2.log`.
- Plafond Google relevé : aucune 429 sur les 4 passes.

## Grille (écrite avant les passes : `GRILLE.md`)
Faits 0,35 ; chiffres 0,15 ; proposition 0,15 ; invention 0,20 ; ton 0,15 (≤ 120 mots, une seule question). Moitié « choix » (impairs) pour choisir les finalistes, moitié « jugement » (pairs) pour juger (L20).

## Passes
| passe | contenu | CHF |
|---|---|---|
| A (courte, choix) | edit-recipe, low-ph, ro × Hydrogen@low, Argon@low, Carbon@low, Argon@medium (medium : 1 cas sur 3, arrêt au plafond de la passe) | 0,92 |
| B (jugement) | 6 cas pairs × 3.8@low (témoin), Hydrogen@low, Carbon@low | 1,15 |
| C (recherche) | supplier-followup × 3.8, research=Hydrogen@low ; Carbon@low : 3 appels payés, aucun cas rendu (plafond g2) | ≈ 0,9 dont ≈ 0,45 perdus dans la passe arrêtée (voir limites) |

## Tableaux (analyse ; un tirage par cas ; qualité = note du juge)
Moitié choix (3 cas) :
| cellule | juge | auto | inutilisables | p50 s | p90 s | CHF/question | appels |
|---|---|---|---|---|---|---|---|
| 3.8@low (prod) | 0,95 | 1,00 | 0 | 9,1 | 9,6 | 0,071 | 3,7 |
| Hydrogen@low | **0,98** | 1,00 | 0 | 9,7 | 20,0 | 0,081 | 3,3 |
| Argon@low | 0,84 | 0,94 | 0 | 25,9 | 30,2 | 0,099 | 3,7 |
| Carbon@low | 0,84 | 0,88 | 0 | 16,2 | 16,4 | 0,099 | 3,7 |
| Argon@medium (1 cas) | 0,84 | 1,00 | 0 | 19,2 | 19,2 | 0,077 | 4,0 |

Moitié jugement (6 cas) :
| cellule | juge | auto | inutilisables | p50 s | p90 s | CHF/question | appels |
|---|---|---|---|---|---|---|---|
| 3.8@low (prod) | 0,85 | 0,91 | 0 | 8,8 | 14,4 | 0,071 | 3,3 |
| Hydrogen@low | **0,92** | 0,96 | 0 | **6,5** | 14,9 | **0,048** | 2,5 |
| Carbon@low | 0,84 | 0,91 | 0 | 15,2 | 37,4 | 0,081 | 3,0 |

Lecture : les 27 sorties sont utilisables (0 erreur, 0 coupée). Différence de fond : Argon et Carbon écrivent 150 à 280 mots (« why » de 100 mots, listes numérotées, ± et nombres du solveur recopiés) quand le ton demande 120 mots et une question ; ils spéculent (« poche d'acide », tampons 4,01 / 7,00, « ~40 g » non calculé). Hydrogen@low reste court (115 à 150 mots, un cas à 221), marque le pH du solveur comme « prévision, pas une mesure », et pose le niveau « attention » là où 3.8 met « urgent » sans raison (low-ph). Il fait moins d'appels (2,5 contre 3,3) : le coût par question baisse de 33 % en jugement, monte de 14 % en choix (edit-recipe : 20 s, 4 appels). 3.8 garde un défaut propre : ph-meter n'évoque ni électrode ni étalonnage, ro ne dit pas que le pH n'est pas garanti.

Recherche (supplier-followup, 1 cas, 1 tirage) : 3.8 nomme des fournisseurs suisses (Brau- und Rauchshop, SIOS), 6 requêtes web, mais affirme « en stock » (non prouvé) : 0,214 CHF, 22,8 s ; Hydrogen@low : 3 requêtes web, ne nomme aucun fournisseur (« disponibles chez d'autres fournisseurs suisses »), 0,198 CHF, 23,1 s. Juge : 3.8 ≥ Hydrogen (faits 0,9 contre 0,5). Carbon non rendu. Un cas ne suffit pas à changer la production.

Relecture : non mesurée. Le module de rejeu avec défauts plantés n'a pas été écrit (plafond g2 atteint, 3,44 CHF).

## Recommandation par rôle
- Analyse : Hydrogen@low (`gemini-4-hydrogen`, réflexion basse), gain mesuré : juge +0,03 (choix) et +0,07 (jugement), −33 % de coût et −26 % de durée en jugement, mêmes 0 inutilisable ; réserve : choix edit-recipe plus long (20 s). Écart faible et un seul tirage : prudent, à confirmer sur les 7 cas non joués (fermentation, grassy, injection, supplier) avant déploiement. Argon et Carbon : non retenus (ton hors cadre, plus chers, plus lents), quelle que soit la réflexion testée (Argon medium sur 1 cas : même défaut).
- Relecture : garder 3.8@low (non mesuré : aucun gain à revendiquer).
- Recherche : garder 3.8@low (Hydrogen ne nomme pas de fournisseurs sur 1 cas).

## Diff proposé de `functions/src/models.ts` et `brewerHarness.ts` (NON APPLIQUÉ, non déployé, voie hors `functions/src/`)
```
+/** Compagnon, rôle analyse : Hydrogen, réflexion basse (voie g2, 14.11 : juge 0,98 / 0,92 contre 0,95 / 0,85 pour 3.8, −33 % de coût en jugement). */
+export const BREWER_ANALYSIS_ROUTE: GeminiAttempt = { model: INVOICE_STRONG_MODEL, thinkingLevel: 'low' };
 export function geminiAttempts(usage: string, tier: AiTier = 'fast'): GeminiAttempt[] {
   const main = { model: GEMINI_MODEL, thinkingLevel: TIERS[tier].thinkingLevel };
+  // analyse du compagnon en Rapide : Hydrogen d'abord, repli une fois sur 3.8
+  if (usage === 'analysis' && tier === 'fast') return [BREWER_ANALYSIS_ROUTE, main];
   const lite = …
```
Dans `brewerHarness.ts` (ligne 293), `geminiAttempts(purpose === 'research' ? tool : purpose)` donne déjà `'analysis'` ; le plafond de sortie de l'analyse reste à 4 000 (testé ainsi au banc en `low`). Test à ajouter : l'ordre d'essai de `analysis` (Hydrogen puis 3.8) et que `review` et `research` restent sur 3.8. Hydrogen est déjà dans la liste blanche `GEMINI_MODELS`.

## Doutes et limites
- Juge = moi, NON à l'aveugle : j'ai lu les sorties avec leur cellule avant de noter (dossier anonymisé généré, mais la lecture directe l'a précédé) ; second regard = règles automatiques (désaccords : Argon 4, Carbon 10, Hydrogen 0, prod 3), mais l'auto ne voit pas les mots ni les inventions. Biais possible pour ou contre Hydrogen. Le juge n'est pas le brasseur (L27).
- Un tirage par cellule, 9 cas sur 13 joués (supplier en recherche seul ; fermentation, grassy, injection non joués). Écarts de 0,03 à 0,07 : dans le bruit probable.
- Le plafond de la passe agit sur la réserve des appels lancés, pas sur le coût réel : à 3 travailleurs, une passe arrêtée a laissé finir les appels en cours (≈ 0,45 CHF consommés pour 1 cas rendu). Pour la suite, `--workers 1` quand il reste peu de budget.
- Coût = coût provisionné (1,25 CHF/USD), pas une facture. Hydrogen a le tarif de 3.8 (1,5 / 7,5 $ le million, `geminiCosts.ts`), sans changement en décembre : le gain de coût tient ; Argon passe à 4 / 20 $ le 1.12.2026 (Carbon : tarif non vérifié ici).
- Journal : g2 = 3,437 CHF (≤ 3,5), mission = 8,45 CHF (≤ 10), lignes ajoutées par d'autres voies comprises. Plafond atteint : rien de plus joué.

DEMANDE EXECUTANT : aucune.
DÉCISION (réglée par le pilote : option b, voir Reprise 2).
CONNAISSANCE : au banc du compagnon (14.11, 3 cas choix + 6 jugement, un tirage), Hydrogen@low répond au même niveau ou mieux que 3.8@low en 6,5 à 9,7 s médiane pour 0,05 à 0,08 CHF la question, en 2,5 à 3,3 appels ; Argon et Carbon écrivent 150 à 280 mots et spéculent (ton du brasseur hors cadre).
LEÇON PROPOSÉE : un plafond de passe doit compter les appels déjà lancés (réserve de chacun), pas le seul coût relu ; en parallèle, une passe « arrêtée » a coûté ≈ 0,45 CHF sans rien rendre.

## REPRISE 2 (14.11, option (b) du pilote) : cas non joués, verdict final
- Passe D : fermentation, grassy, injection × {3.8@low (prod), Hydrogen@low}, `--workers 1`, plafonds relevés à 9,9 (mission) et 4,2 (g2) dans `scripts/banc-compagnon.ts` et `tests/unit/banc-compagnon.test.ts` ; aucune 429 ; 0,417 CHF ; journal commun : 8,869 CHF (≤ 9,90). `passe-D.log`, sorties dans `sorties/`.
- Juge réellement à l'aveugle pour ces 6 sorties : dossier anonymisé lu seul (cellule non nommée), notes écrites avant d'ouvrir la clé (`notes-juge-choix.json`, `tableau-choix.md`). Les 9 cas de la 1re reprise restent non aveugles (voir limites ci-dessus).
- Notes (juge, 0-1) : fermentation 3.8 0,81 / Hydrogen 0,89 ; grassy 0,86 / 0,86 ; injection 0,80 / 0,96. Hydrogen : refus explicite du stock et de l'acide (3.8 : refus implicite seulement), blow-off + cold crash cités. 3.8 : « 18-20 °C » et « surpression en bouteille » non fondés (grassy), cold crash non cité (fermentation). Hydrogen : « hop burn » douteux (grassy), niveau « urgent » fort (fermentation).

Verdict sur les 12 cas d'analyse joués (6 choix, 6 jugement ; un tirage) :
| cellule | juge | p50 s | p90 s | CHF/question | appels | inutilisables |
|---|---|---|---|---|---|---|
| 3.8@low (prod) | 0,87 | 9,6 | 14,4 | 0,076 | 3,6 | 0 |
| Hydrogen@low | **0,93** | 8,1 | 14,9 | **0,056** | 2,8 | 0 |
Par cas : Hydrogen meilleur sur 9, égal sur 1, moins bon sur 2 (edit-recipe −0,03, routing-complex −0,02). Hors supplier-followup (recherche, 1 cas, déjà joué : 3.8 meilleur).

**VERDICT FINAL : Hydrogen@low tient** pour le rôle analyse (qualité +0,06, coût −26 %, durée −16 % en médiane, 0 inutilisable, 0 invention majeure ; les deux pertes sont de 0,02 à 0,03, dans le bruit). Relecture : inchangée (3.8@low dans les deux cellules, non mesurée seule). Recherche : garder 3.8@low (1 cas). Le diff de `models.ts` plus haut reste valable ; il n'est pas appliqué (voie hors `functions/src/`).
Limites : un tirage par cas, juge = moi (pas le brasseur, L27), écart modeste ; 2 cas sur 12 au profit de 3.8. Tests : 88 verts, tsc racine sans erreur. Budget : g2 ≈ 3,85 CHF sur 4,2, mission 8,869 sur 9,90.
DÉCISION À PRENDRE : appliquer le diff (a) après un test unitaire de la route d'analyse. Recommandation : oui.
