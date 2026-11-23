OK — t2b : diagnostic, COA, recherche, justificatifs mesurés ; garder COA, recherche et justificatifs, Hydrogen@low proposé pour le diagnostic.

Coût de la voie : ≈ 3,68 CHF (1,50 + 2,18 pour les justificatifs) sur 5 ; cumul du tour 9,52 CHF au dernier relevé (< 14,5). Un HTTP 402 (crédits prépayés épuisés) sur 2 appels Flash-Lite du doc16 en fin de passe : 0 CHF, non relancés, pièce écartée du tableau. Aucun 429.

## 1. Inventaire des tâches de `TASKS` (lu dans `functions/src/prompts.ts`, `models.ts`, `ai.ts`, appelants de `src/`)
| tâche / usage | appel en production | appelant dans `src/` | voie |
|---|---|---|---|
| `readHopCoa` | Flash-Lite `minimal`, repli 3.8 `low` | `HopIndexPanel.tsx` | t2b : mesuré (§2) |
| `diagnoseBatch` | Flash-Lite `low`, repli 3.8 `low` ; client en `fast` | `BrewDayPage.tsx:382` | t2b : mesuré (§3) ; niveau Max = t2c |
| `lookup_brewing_reference` (rôle `research`) | Flash-Lite `minimal` + Google Search, repli 3.8 | harnais du compagnon | t2b : mesuré (§4) |
| `scanInvoice`, 2 lectures parallèles | 2 × Flash-Lite `low`, 3ᵉ lecture Hydrogen@low | scanner | t2b : mesuré (§5) |
| `importRecipe`, `reviewRecipe`, `lookupIngredient`, `lookupHopVariety`, `traduireNoms` | 3.8 `low` | import, relecture, fiches, noms | t2a |
| `hopReclasserIA` (reclasser : Flash-Lite ; suggérer : 3.8) | fonction à part, hors `TASKS` | `hopIndex/substituer`, `suggerer` | non mesuré : aucune vérité écrite ; à confier à une voie houblons |
| `naturalSearch` | 3.8 `low` | `CloudConfigModal.tsx:60`, bouton « tester l'IA » | garder (test de connexion, ≈ 0,0005 CHF) |
| `shelfInventory`, `generateRecipe`, `tastingNotes`, `monthlySummary`, `detectAnomalies`, `shoppingList`, `labelText`, `draftEmail` | 3.8 | aucun appelant dans `src/` | rien à comparer ; à mesurer le jour où un écran les appelle (`monthlySummary`/`detectAnomalies` en Max = t2c) |

## 2. Lecture de COA (`readHopCoa`), 3 pièces (PDF du banc #91), vérité du banc #91
Juge : critères automatiques écrits avant la passe (champs du COA, analyses, intrus), donc aveugle par construction ; 1 tirage sur les 6 réglages, puis 3 tirages de plus sur les 3 finalistes (9 appels chacun, tirage 1 compté deux fois dans le fichier : lecture dédoublonnée par `detail.mjs`).
| réglage | qualité | inutilisables | p50 s | p90 s | CHF/appel | verdict |
|---|---|---|---|---|---|---|
| lite@minimal (production) | 100 % (9 appels) | 0/9 | 2,0 | 2,4 | 0,0031 | référence |
| lite@low | 90 % (1 critique : analyses et intrus sur `coa-piege`) | 0/3 | 2,5 | 2,6 | 0,0031 | écarté |
| 3.8@low | 97 % (1 critique sur `coa-piege`, 9 appels) | 0/9 | 4,9 | 7,5 | 0,0100 | écarté (perd, 3× plus cher, 2,5× plus lent) |
| hydrogen@low | 100 % (9 appels) | 0/9 | 6,0 | 7,7 | 0,0204 | même qualité, 6,5× le coût, 3× le temps |
| argon@low | 100 % (3 appels) | 0/3 | 11,3 | 17,4 | 0,0175 | écarté : lent ; tarif doublé au 1.12.2026 |
| carbon@low | 100 % (3 appels) | 0/3 | 11,4 | 12,5 | 0,0180 | écarté : lent ; tarif doublé au 1.12.2026 |
Recommandation : garder Flash-Lite `minimal` (aucun gain mesuré à changer ; il est le moins cher, le plus rapide et sans critique). Limite : 3 pièces seulement, pas de moitié réglage/jugement ; le verdict est « aucune perte contre la production sur 9 lectures ».

## 3. Diagnostic de brassin (`diagnoseBatch`), 10 cas à vérité écrite avant les passes (`cas-diag-t2b.json`)
Moitié choisir (cas 1, 3, 5, 7 + les 2 du banc #91 : 6 cas, 1 tirage) puis moitié juger (cas 2, 4, 6, 8 : 4 cas, 2 tirages = 8 appels) sur les finalistes. Argon et Carbon écartés après la moitié « choisir » (même qualité qu'Hydrogen, 2 à 3 fois plus lents, tarif doublé au 1.12.2026).
| réglage | qualité (choisir 6 / juger 8) | inutilisables | p50 s | p90 s | CHF/appel | verdict |
|---|---|---|---|---|---|---|
| lite@low (production) | 92 % / 97 % (global 94 %, 14 appels) | 0/14 ; 0 critique | 1,5 | 2,0 | 0,0010 | référence : écarts sur `attenuation` (cas 3, 4 ×2, `diag-normale`) et `gravite` (cas 7) |
| 3.8@low | 96 % / 100 % (global 98 %) | 0/14 ; 0 critique | 5,1 | 6,8 | 0,0045 | l'écart de gravité du cas 7 (lager sous-ensemencé) subsiste |
| hydrogen@low | 100 % / 100 % (14 appels) | 0/14 ; 0 critique | 4,7 | 6,4 | 0,0103 | seul à tout juste, y compris le cas 7 |
| argon@low | 100 % (choisir seul, 6 appels) | 0/6 | 12,0 | 15,9 | 0,0091 | écarté : lent ; tarif doublé au 1.12.2026 |
| carbon@low | 100 % (choisir seul, 6 appels) | 0/6 | 9,5 | 12,1 | 0,0092 | écarté : lent ; tarif doublé au 1.12.2026 |
Recommandation : passer à Hydrogen@low, avec Flash-Lite `low` en repli (gain mesuré : +6 points de qualité, aucune réponse fausse sur la gravité du cas « lager sous-ensemencé » que Flash-Lite et la 3.8 sous-évaluent ; coût +0,009 CHF l'appel, +3 s sur un bouton explicite). C'est un choix coût/vitesse contre exactitude : pas de critique chez la production, l'écart porte sur des libellés fins. Confiance modérée (10 cas fictifs, 14 appels). Hydrogen coûte au tarif de la 3.8 (`geminiCosts.ts`).

Diff proposé, non appliqué (`functions/src/models.ts`) :
```
- diagnoseBatch: 'low',   // retirer de LITE_ROUTES
+ export function diagnosticAttempts(): GeminiAttempt[] {
+   return [{ model: INVOICE_STRONG_MODEL, thinkingLevel: 'low' }, { model: GEMINI_LITE_MODEL, thinkingLevel: 'low' }];
+ }
```
et le brancher dans `ai.ts` comme `brewerAnalysisAttempts` pour l'usage `diagnoseBatch` en Rapide (même mécanisme, un test de `models.test.ts` à ajouter).

## 4. Recherche du compagnon (`lookup_brewing_reference`), 4 cas (S-04, BJCP 4A, BJCP 2021 5B Kölsch, 21A American IPA : plages IBU/OG écrites avant)
| réglage | qualité | inutilisables | p50 s | p90 s | CHF/appel | verdict |
|---|---|---|---|---|---|---|
| lite@minimal + Google Search (production) | 100 % (4 cas) | 0/4 | 1,7 | 2,6 | 0,0226 | référence |
| 3.8@low | 100 % | 0/4 | 6,7 | 7,1 | 0,0253 | pas de gain, 4× plus lent |
| hydrogen@low | 100 % | 0/4 | 6,8 | 7,1 | 0,0357 | pas de gain, 4× plus lent, +58 % |
| argon@low | 100 % | 0/4 | 15,7 | 19,3 | 0,0288 | écarté ; tarif doublé au 1.12.2026 |
| carbon@low | 100 % | 0/4 | 16,1 | 17,7 | 0,0332 | écarté ; tarif doublé au 1.12.2026 |
Recommandation : garder. Le coût est surtout la recherche Google (≈ 0,0175 par appel) : la crainte de la provision entière (≈ 0,35 CHF) ne s'est pas produite, la sonde a mesuré 0,018 CHF. Limite : les 4 cas sont faciles (plafond de qualité atteint, rien ne discrimine) ; la recherche web est aussi couverte par t2c.

## 5. Deux lectures parallèles des justificatifs (passe jouée le 14.11 soir, décision pilote)
Banc `scripts/banc-lecture-facture.ts`, groupe Csv8 (production : 2 Flash-Lite `low` en parallèle, 3ᵉ lecture Hydrogen@low qui tranche), nouvelle option `--lectures <modèle>@<niveau>` (remplace le modèle des lectures 1 et 2 seulement, jamais prêtées ; sans l'option, rien ne change ; 5 tests). 17 pièces à vérité de g1 : moitié choisir = 9 impaires, moitié juger = 8 paires. Un tirage par cellule. Journal de la passe : `journal-justif.md` (72 appels, 2,18 CHF sur 3,5), versé dans `journal-tour2.md` (usage `t2b:justif`). Cumul du tour après la passe : 9,52 CHF (< 14,5).
Référence « production » = les sorties de g1 (mêmes pièces, même vérité, mêmes réglages : Flash-Lite `low` lues puis prêtées, 3ᵉ lecture Hydrogen@low). Tirage 2 de g1 sur les impaires : 93/108 comme le tirage 1.
Le temps est celui de bout en bout d'une pièce (lectures parallèles + 3ᵉ lecture), p50 / p90. « Minimal » : Hydrogen n'a pas ce niveau (low est le plus bas, g1) ; il n'a été essayé que sur Flash-Lite.

**Moitié choisir (9 impaires)**
| réglage | lignes justes /108 | champs /105 | total TTC juste | 3ᵉ lectures déclenchées | bout en bout p50 / p90 | CHF par pièce | verdict |
|---|---|---|---|---|---|---|---|
| 2 Flash-Lite `low` + 3ᵉ Hydrogen@low (production) | 93 | 103 | 9/9 | 5 | 13,0 s / 30,6 s | 0,0455 | référence |
| 2 Flash-Lite `minimal` + 3ᵉ Hydrogen@low | 95 | 101 | 8/9 | 7 | 15,4 s / 27,0 s | 0,0580 | à confirmer sur les paires |
| 2 Hydrogen@low + 3ᵉ Hydrogen@low | 84 | 102 | 8/9 | 6 | 20,4 s / 29,8 s | 0,1215 | écarté : −9 lignes, 1 total faux, 2,7× le coût, +7 s |

Hydrogen×2 est dominé sur chaque axe dès la moitié choisir : pas rejoué sur les paires (économie ≈ 1,2 CHF, décision écrite avant la moitié jugée).

**Moitié juger (8 paires, 7 comptées)** : le doc16 est retiré : HTTP 402 « prepayment credits are depleted » sur ses deux lectures Flash-Lite (0 CHF, aucun appel relancé) ; sa 3ᵉ lecture a répondu seule. Chiffres du doc16 : identiques à la production (10/17 lignes, total juste), sans valeur de comparaison.
| réglage | lignes justes /135 | champs /84 | total TTC juste | 3ᵉ lectures déclenchées | bout en bout p50 / p90 | CHF par pièce | verdict |
|---|---|---|---|---|---|---|---|
| 2 Flash-Lite `low` + 3ᵉ Hydrogen@low (production) | 122 | 80 | 7/7 | 5 | 21,6 s / 34,5 s | 0,0682 | référence |
| 2 Flash-Lite `minimal` + 3ᵉ Hydrogen@low | 116 | 82 | 7/7 | 6 | 21,2 s / 31,5 s | 0,0697 | perd 6 lignes |

**Deux moitiés ensemble (16 pièces propres)** : production 215/243 lignes, 16/16 totaux, 10 3ᵉ lectures, ≈ 0,055 CHF la pièce ; Flash-Lite `minimal` 211/243 lignes, 15/16 totaux, 13 3ᵉ lectures, ≈ 0,063 CHF la pièce (+14 %), temps de bout en bout sans différence (p50 15,4 et 21,2 s contre 13,0 et 21,6 s). Lignes perdues 0 partout ; inventées 1 en production, 2 avec `minimal` sur les impaires.
Recommandation : **garder** les deux Flash-Lite `low` + 3ᵉ lecture Hydrogen@low, sans changement. Les deux Hydrogen en parallèle coûtent 2,7× plus, vont plus lentement et lisent moins de lignes ; Flash-Lite `minimal` ne gagne ni en temps ni en coût (il déclenche plus de 3ᵉ lectures : 13 contre 10) et perd 1 total TTC et 4 lignes sur 16 pièces (gain mesuré : aucun).
Limites : un tirage par cellule (le bruit entre tirages des deux lectures n'est pas mesuré ; g1 ne l'a mesuré que sur la 3ᵉ lecture, 0 ligne d'écart) ; 16 pièces ; les écarts de 2 à 4 lignes sur 243 ne sont pas des signaux. Le brasseur a vu les pièces en leur forme réelle (H13-reels, hors Git) ; aucune valeur de document dans les journaux ni les tableaux.

## 6. Critères
- `npx vitest run tests/unit/banc-* tests/unit/models*` → `tests.txt` : 15 fichiers, 370/370 verts. Le rouge `banc-compagnon.test.ts` (attendait la 3.8 pour l'analyse) est aligné sur Hydrogen : `analysis:gemini-4-hydrogen`, `review:gemini-3.8-flash` (ligne 112).
- `npx tsc --noEmit -p .` : 0 erreur. `-p functions` : non rejoué (rien touché dans `functions/`).

## 7. Fichiers
`scripts/banc-t2b-taches.ts`, `scripts/banc-lecture-facture.ts` et `scripts/banc-lecture-modeles.ts` (option `--lectures`), `tests/unit/banc-t2b-justif.test.ts`, `voies/t2b/` : `justif-impairs.sh`, `justif-paires.sh`, `verser-journal.mjs`, `journal-justif.md`, `tableau-justif-impairs.md`, `tableau-justif-paires.md`, `logs/justif-*.log` ; `tests/unit/banc-t2b-taches.test.ts`, `tests/unit/banc-compagnon.test.ts` (ligne 112), `voies/t2b/` : `cas-diag-t2b.json`, `detail.mjs` (détail par cas et statistiques dédoublonnées ; `node detail.mjs diag|coa|recherche`), `sorties/{diag,coa,recherche}.jsonl`, `logs/p1…p7*.log`, `tests.txt`, ce fichier ; lignes `t2b` de `journal-tour2.md`.

## 8. Doutes et limites
- Les tableaux de `--tableau` du banc mêlent les moitiés et comptent les cas répétés (sonde, tirage 1 de COA) : les chiffres ci-dessus sont dédoublonnés avec `detail.mjs`. Le filtre par cas de `detail.mjs` (second argument) ne s'applique pas (regex non remplacée) : sans effet sur les chiffres ; les moitiés choisir/juger sont lues à la main dans la sortie.
- Juge automatique par critères : il ne lit pas les phrases ; une erreur de formulation hors critère ne se voit pas.
- Argon et Carbon : tarif doublé au 1.12.2026, dit dans chaque verdict.

DÉCISION À PRENDRE : (1) `diagnoseBatch` : Hydrogen@low (diff §3, recommandé) ou garder Flash-Lite ? Arbitrage coût/vitesse contre exactitude, au brasseur si le gain (+6 points, +3 s) lui paraît visible. (2) Justificatifs : tranché par la mesure (§5), garder la production ; rien à décider. (3) Le projet Google a répondu HTTP 402 « prepayment credits are depleted » une fois : recharger le prépaiement avant la suite du tour (t2a, t2c), geste de compte du brasseur.
CONNAISSANCE : Flash-Lite `minimal` tient le COA et la recherche web à 100 % (2 s, 0,003 et 0,02 CHF) ; Hydrogen@low n'y gagne rien. Le coût d'une recherche web est ≈ 0,0175 CHF de Google Search par appel, pas la provision de 0,35 CHF.
LEÇON PROPOSÉE : aucune (une écriture de RESULTAT.md par Write a écrasé l'ancien contenu : relire avant de l'écraser ; contenu reconstitué).
