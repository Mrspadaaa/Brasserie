# Banc de lecture des factures — résultat

Mode payant · 21 parcours (7 documents × 3 tirages) · modèles gemini-3.8-flash (A, B, 3ᵉ lecture) et gemini-3.5-flash-lite (C, C′) · réflexion LOW, température 0, haute résolution.
Aucune valeur des documents ici : des comptes, des durées, des coûts et le nom du champ en défaut. Coûts au tarif provisionné de `geminiCosts.ts` (1,25 CHF/USD), pas une facture.

| | A production | B une lecture d’abord | C Flash-Lite ×2 puis 3.8 | C′ C gardée par les contrôles |
|---|---|---|---|---|
| Parcours lus (échecs sans résultat) | 21 (0) | 21 (0) | 21 (0) | 21 (0) |
| Champs justes / jugés | 214 / 243 | 214 / 243 | 219 / 243 | 219 / 243 |
| Lignes justes / jugées | 182 / 207 | 182 / 207 | 166 / 207 | 166 / 207 |
| **Faux verts** (checked, un champ faux) | **0** | **3** | **0** | **0** |
| Faux « corrigés » (corrected, un champ faux) | 1 | 0 | 1 | 1 |
| Alertes justes (disputed / unavailable, vraie erreur) | 14 | 13 | 17 | 17 |
| Alertes inutiles (rien de faux) | 6 | 3 | 3 | 3 |
| Verts justes (checked / corrected, tout juste) | 0 | 2 | 0 | 0 |
| Durée médiane du parcours | 17,4 s | 8,9 s | 10,4 s | 10,5 s |
| Durée maximale du parcours | 44,6 s | 50,4 s | 29,6 s | 29,7 s |
| Appels (total · moyenne par parcours) | 56 · 2,67 | 28 · 1,33 | 59 · 2,81 | 62 · 2,95 |
| Coût médian par parcours (CHF) | 0,0424 | 0,0162 | 0,0247 | 0,0251 |
| Coût total comme en production (CHF) | 1,0498 | 0,5293 | 0,5460 | 0,6328 |

Dépense réelle du banc (appels distincts, 3ᵉ lectures prêtées comptées une fois) : 1,3932 CHF pour 104 appels.

## Statuts finaux

| | A production | B une lecture d’abord | C Flash-Lite ×2 puis 3.8 | C′ C gardée par les contrôles |
|---|---|---|---|---|
| checked | 0 | 5 | 0 | 0 |
| corrected | 1 | 0 | 1 | 1 |
| disputed | 20 | 16 | 20 | 20 |
| unavailable | 0 | 0 | 0 | 0 |

## Pourquoi sonnent les alertes inutiles (points qui pèsent, tous champs justes)

- A production : lectures-divergentes ×4, date-absente ×3
- B une lecture d’abord : date-absente ×2, lectures-divergentes ×1
- C Flash-Lite ×2 puis 3.8 : date-absente ×3, lectures-divergentes ×1
- C′ C gardée par les contrôles : date-absente ×3, lectures-divergentes ×1

## Ce que chaque variante a appelé

- B : la lecture 2 a été appelée dans 5 parcours sur 21.
- C Flash-Lite ×2 puis 3.8 : 3.8 prêtée par A 12 fois, appel 3.8 neuf 5 fois, sans 3ᵉ lecture 4 fois.
- C′ C gardée par les contrôles : 3.8 prêtée par A 14 fois, appel 3.8 neuf 6 fois, sans 3ᵉ lecture 1 fois.

## Défauts relevés (nom du champ seulement)

### A production
- doc1 : date faux en A, tirage 1
- doc2 : amountHT faux en A, tirage 1
- doc2 : tvaAmount faux en A, tirage 1
- doc2 : lignes : price (×3) faux en A, tirage 1
- doc3 : documentType faux en A, tirage 1
- doc3 : orderNumber faux en A, tirage 1
- doc3 : amountTTC faux en A, tirage 1
- doc3 : items.count faux en A, tirage 1
- doc4 : lignes : price (×3) faux en A, tirage 1
- doc6 : tvaAmount faux en A, tirage 1
- doc6 : items.count faux en A, tirage 1
- doc1 : date faux en A, tirage 2
- doc1 : lignes : price (×7) faux en A, tirage 2
- doc2 : amountHT faux en A, tirage 2
- doc2 : tvaAmount faux en A, tirage 2
- doc2 : lignes : price (×3) faux en A, tirage 2
- doc3 : documentType faux en A, tirage 2
- doc3 : orderNumber faux en A, tirage 2
- doc3 : amountTTC faux en A, tirage 2
- doc3 : items.count faux en A, tirage 2
- doc4 : lignes : price (×3) faux en A, tirage 2
- doc6 : documentType faux en A, tirage 2
- doc6 : tvaAmount faux en A, tirage 2
- doc6 : items.count faux en A, tirage 2
- doc1 : date faux en A, tirage 3
- doc2 : amountHT faux en A, tirage 3
- doc2 : tvaAmount faux en A, tirage 3
- doc2 : lignes : price (×3) faux en A, tirage 3
- doc3 : documentType faux en A, tirage 3
- doc3 : orderNumber faux en A, tirage 3
- doc3 : amountTTC faux en A, tirage 3
- doc3 : items.count faux en A, tirage 3
- doc4 : lignes : price (×3) faux en A, tirage 3
- doc6 : documentType faux en A, tirage 3
- doc6 : tvaAmount faux en A, tirage 3
- doc6 : items.count faux en A, tirage 3

### B une lecture d’abord
- doc1 : date faux en B, tirage 1 — FAUX VERT
- doc2 : amountHT faux en B, tirage 1
- doc2 : tvaAmount faux en B, tirage 1
- doc2 : lignes : price (×3) faux en B, tirage 1
- doc3 : documentType faux en B, tirage 1
- doc3 : orderNumber faux en B, tirage 1
- doc3 : amountTTC faux en B, tirage 1
- doc3 : items.count faux en B, tirage 1
- doc4 : lignes : price (×3) faux en B, tirage 1
- doc6 : tvaAmount faux en B, tirage 1
- doc6 : items.count faux en B, tirage 1
- doc1 : date faux en B, tirage 2 — FAUX VERT
- doc1 : lignes : price (×7) faux en B, tirage 2 — FAUX VERT
- doc2 : amountHT faux en B, tirage 2
- doc2 : tvaAmount faux en B, tirage 2
- doc2 : lignes : price (×3) faux en B, tirage 2
- doc3 : documentType faux en B, tirage 2
- doc3 : orderNumber faux en B, tirage 2
- doc3 : amountTTC faux en B, tirage 2
- doc3 : items.count faux en B, tirage 2
- doc4 : lignes : price (×3) faux en B, tirage 2
- doc6 : documentType faux en B, tirage 2
- doc6 : tvaAmount faux en B, tirage 2
- doc6 : items.count faux en B, tirage 2
- doc7 : vendor faux en B, tirage 2
- doc1 : date faux en B, tirage 3 — FAUX VERT
- doc2 : amountHT faux en B, tirage 3
- doc2 : tvaAmount faux en B, tirage 3
- doc2 : lignes : price (×3) faux en B, tirage 3
- doc3 : documentType faux en B, tirage 3
- doc3 : orderNumber faux en B, tirage 3
- doc3 : amountTTC faux en B, tirage 3
- doc3 : items.count faux en B, tirage 3
- doc4 : lignes : price (×3) faux en B, tirage 3
- doc6 : tvaAmount faux en B, tirage 3
- doc6 : items.count faux en B, tirage 3

### C Flash-Lite ×2 puis 3.8
- doc1 : date faux en C, tirage 1
- doc1 : lignes : price (×7) faux en C, tirage 1
- doc2 : currency faux en C, tirage 1
- doc2 : amountHT faux en C, tirage 1
- doc2 : tvaAmount faux en C, tirage 1
- doc2 : lignes : price (×3) faux en C, tirage 1
- doc3 : documentType faux en C, tirage 1
- doc3 : items.count faux en C, tirage 1
- doc4 : lignes : price (×3) faux en C, tirage 1
- doc5 : tvaAmount faux en C, tirage 1
- doc5 : lignes : kind faux en C, tirage 1
- doc6 : documentType faux en C, tirage 1
- doc1 : date faux en C, tirage 2
- doc1 : lignes : price (×7) faux en C, tirage 2
- doc2 : currency faux en C, tirage 2
- doc2 : amountHT faux en C, tirage 2
- doc2 : tvaAmount faux en C, tirage 2
- doc2 : lignes : price (×3) faux en C, tirage 2
- doc3 : documentType faux en C, tirage 2
- doc3 : items.count faux en C, tirage 2
- doc4 : lignes : price (×3) faux en C, tirage 2
- doc5 : tvaAmount faux en C, tirage 2
- doc5 : lignes : price faux en C, tirage 2
- doc6 : documentType faux en C, tirage 2
- doc1 : date faux en C, tirage 3
- doc1 : lignes : price (×7) faux en C, tirage 3
- doc2 : currency faux en C, tirage 3
- doc2 : amountHT faux en C, tirage 3
- doc2 : tvaAmount faux en C, tirage 3
- doc2 : lignes : price (×3) faux en C, tirage 3
- doc3 : documentType faux en C, tirage 3
- doc3 : items.count faux en C, tirage 3
- doc4 : lignes : price (×3) faux en C, tirage 3
- doc5 : tvaAmount faux en C, tirage 3
- doc6 : documentType faux en C, tirage 3

### C′ C gardée par les contrôles
- doc1 : date faux en C′, tirage 1
- doc1 : lignes : price (×7) faux en C′, tirage 1
- doc2 : currency faux en C′, tirage 1
- doc2 : amountHT faux en C′, tirage 1
- doc2 : tvaAmount faux en C′, tirage 1
- doc2 : lignes : price (×3) faux en C′, tirage 1
- doc3 : documentType faux en C′, tirage 1
- doc3 : items.count faux en C′, tirage 1
- doc4 : lignes : price (×3) faux en C′, tirage 1
- doc5 : tvaAmount faux en C′, tirage 1
- doc5 : lignes : kind faux en C′, tirage 1
- doc6 : documentType faux en C′, tirage 1
- doc1 : date faux en C′, tirage 2
- doc1 : lignes : price (×7) faux en C′, tirage 2
- doc2 : currency faux en C′, tirage 2
- doc2 : amountHT faux en C′, tirage 2
- doc2 : tvaAmount faux en C′, tirage 2
- doc2 : lignes : price (×3) faux en C′, tirage 2
- doc3 : documentType faux en C′, tirage 2
- doc3 : items.count faux en C′, tirage 2
- doc4 : lignes : price (×3) faux en C′, tirage 2
- doc5 : tvaAmount faux en C′, tirage 2
- doc5 : lignes : price faux en C′, tirage 2
- doc6 : documentType faux en C′, tirage 2
- doc1 : date faux en C′, tirage 3
- doc1 : lignes : price (×7) faux en C′, tirage 3
- doc2 : currency faux en C′, tirage 3
- doc2 : amountHT faux en C′, tirage 3
- doc2 : tvaAmount faux en C′, tirage 3
- doc2 : lignes : price (×3) faux en C′, tirage 3
- doc3 : documentType faux en C′, tirage 3
- doc3 : items.count faux en C′, tirage 3
- doc4 : lignes : price (×3) faux en C′, tirage 3
- doc5 : tvaAmount faux en C′, tirage 3
- doc6 : documentType faux en C′, tirage 3

## Lecture honnête

- 21 parcours par variante : peu pour trancher entre deux taux d'erreur proches ; un faux vert de plus ou de moins se lit comme un indice, pas comme une mesure.
- B et C′ sont calculés hors ligne depuis les appels réels de A et de C : mêmes réponses, aucun appel de plus (sauf une 3.8 neuve quand C′ en a besoin et que ni A ni C n’en ont).
- La durée d’un parcours est la somme des durées mesurées appel par appel : le plus long des deux appels parallèles, puis la 3ᵉ lecture (A, C, C′) ; la somme séquentielle (B).

## Lecture du pilote (01.11)

- **Ce qui sépare les variantes.** Environ deux tiers des défauts sont communs aux quatre (même document, même champ, chaque tirage) :
  ils ne départagent rien. Parmi eux, une vraie erreur de lecture (doc1 : une date de période prise pour la date de la facture, dans
  toutes les variantes) et des écarts à revérifier sur la vérité écrite à la main (doc2 : prix unitaire laissé vide sur les lignes à
  quantité 1 ; doc3 : deux bulletins additionnés ou non). Ils ne changent pas le classement.
- **B (une lecture d'abord) est écartée** : 3 faux verts (une date inventée acceptée comme vérifiée), le pire cas pour une facture.
- **A contre C** : aucun faux vert de part et d'autre. C a 5 champs justes de plus (doc3, doc6) et 16 lignes justes de moins (doc1 et
  doc5 : prix et nature des lignes), soit 8 % des lignes ; C est 40 % plus rapide (médiane 10,4 s contre 17,4 s ; pire 29,6 s contre
  44,6 s) et 42 % moins cher (0,025 contre 0,042 CHF la facture).
- **C′ n'apporte rien de plus que C** sur ce banc (mêmes résultats, un peu plus cher).
- La production finit « à confirmer » 20 fois sur 21 : 14 alertes justes, 6 inutiles (divergences, date absente).
- Décision : au brasseur (Gemini en production, D234 : aucun changement avant son choix sur ces chiffres).

Page montrée au brasseur : https://claude.ai/artifact/S4ovLYnPabLA5Pvq6n4rU9 (01.11 v1, source `work/missions/2026-11-01-banc-lecture/page/index.html`).
