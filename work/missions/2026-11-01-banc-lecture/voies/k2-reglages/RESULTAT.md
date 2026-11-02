K2 OK — banc étendu (C★, C★v, C★′, Lm, Lh, Lp, N, prêt k1, hors-ligne) ; HORS-LIGNE.md écrit ; aucun appel payé.

## Fichiers écrits
- `scripts/banc-lecture-facture.ts` : variantes `--variantes` (défaut = les quatre de k1), `--reprendre <sortie k1>` (prêt d'appels), `--hors-ligne` (recalcul sans réseau ni clé), `--normaliser` (N, suffixe `+N`). `callSpec` règle chaque appel (modèle, consigne, réflexion, plafond, délai) ; `finalOfStar` / `finalOfStarPrime` ; `deriveVariants` (pur) ; `loadLender` ; réserve du budget par appel (`reservationMicro(modèle, plafond)`).
- `scripts/banc-lecture-consignes-lite.ts` (neuf) : la consigne de Lp (sept règles génériques sans chiffre ni valeur, ajoutées à la consigne de production importée). Rien dans `functions/` ; un test vérifie que `functions/src` ne l'importe pas.
- `scripts/banc-lecture-facture-juger.ts` : variantes lues dans les parcours, tableau **par document**, section « lectures par réglage » (coupures, lectures > 45 s, sortie moyenne), `renderHorsLigne`, `--hors-ligne-md <fichier>`. `--publier` écrit maintenant `voies/k2-reglages/RESULTAT-BANC-K2.md` (jamais par-dessus le `RESULTAT-BANC.md` de k1).
- `tests/unit/banc-lecture-facture.test.ts` : 35 tests de k1 intacts + 28 nouveaux (63).
- `voies/k2-reglages/HORS-LIGNE.md` ; sortie locale `work/finalisation-tickets-2026-10-08/H13-reels/banc-k2-horsligne-20261101/` (ignorée par Git).
- Rien d'autre. `functions/`, `src/`, `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/.env`, `.secret.local` : intacts, jamais lus. Pas de commit. `GATES.md` n'existe pas dans la voie : critères pris dans VOIE.md (comme k1).

## Critères (sorties)
- `npx tsc --noEmit -p . && echo TYPES OK` : TYPES OK (ce `tsc` ne couvre que `src/` ; j'ai aussi typé les trois scripts et le test à part, sans erreur).
- `npx vitest run tests/unit/banc-lecture-facture.test.ts tests/unit/invoiceScanTransport.test.ts tests/unit/invoiceVisionReview.test.ts --maxWorkers=2 && echo TESTS BANC OK` : 3 fichiers, 118 tests verts, TESTS BANC OK.
- Simulation (commande exacte) :
  `npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --simuler --variantes A,B,C,Cp,Cs,Csv,Csp,Lm,Lh,Lp --normaliser --out C:/Users/mrspa/AppData/Local/Temp/k2-sim`
  `npx vite-node --config vitest.config.ts scripts/banc-lecture-facture-juger.ts -- C:/Users/mrspa/AppData/Local/Temp/k2-sim`
  → `BANC SIMULE OK — 642/642 fausses réponses fabriquées retrouvées, 16 faux verts comptés, 260 parcours propres sans champ faux, aucun réseau.`
  Témoin négatif : le plan de fautes compte onze fautes (cinq de k2 : unité inventée par Lm, coupure d'une lecture high, montant de ligne faux lu par Lp, total divergent en high, « Fr. » pour N). Le jugement les retrouve toutes ; l'unité inventée par Lm est un faux vert, « Fr. » est faux sans N et juste avec N (tests).
- Prêt vérifié en simulation sur la vraie sortie k1 (`--simuler --sans-fautes --reprendre …banc-k1-20261101-081144 --variantes A,C,Cs,Csp,Lm,Lh,Lp --normaliser`) : 126 appels journalisés, tous Lm / Lh / Lp (21 × 2 chacun) ; A et C rendent exactement les chiffres de k1.
- `HORS-LIGNE.md` existe, C★, C★′ et N par document ; `grep -nE "[0-9]{3,}[.,][0-9]{2}"` n'y trouve rien (sortie vide, code 1).

Essais utilisés : un par critère. Corrections en cours de route : un test (la passe prêtée n'avait pas B ni C′) ; un chemin de sortie cassé par une barre inverse perdue du Bash, refait avec des barres obliques.

## Contrôle de non-régression (important)
Le recalcul hors ligne de A, B, C et C′ sur la sortie k1 redonne exactement le tableau de k1 (214/243 · 182/207 · 0 FV ; B 3 FV ; C 219/166 ; C′ 219/166 ; durées 17,4 / 8,9 / 10,4 / 10,5 s ; coûts 1,0498 / 0,5293 / 0,5460 / 0,6328). Le test compare aussi résultat par résultat avec une passe simulée.

## Tableau hors ligne en bref (21 parcours, sans appel)
| | champs | lignes | faux verts | alertes justes | coût total |
|---|---|---|---|---|---|
| A | 214/243 | 182/207 | 0 | 14 | 1,0498 |
| C | 219/243 | 166/207 | 0 | 17 | 0,5460 |
| C + N | 222/243 | 172/207 | 0 | 15 | 0,5284 |
| C★ | 217/243 | 181/207 | **4** | 12 | 0,5460 |
| C★′ | 213/243 | 181/207 | **4** | 12 | 0,6328 |
| C★ + N | 217/243 | 187/207 | **4** | 10 | 0,5284 |
| **C★v** | 217/243 | 181/207 | **0** | 15 | 0,5460 |
| **C★v + N** | 217/243 | 187/207 | **0** | 13 | 0,5284 |

- **La 3.8 qui tranche seule** : +15 lignes (doc1 : 0/21 → 14/21 ; doc5 +1), mais −2 champs (C★) à −6 (C★′) et **4 faux verts** (trois sur doc1, une date de période prise pour la date de la facture ; un sur doc3). Cause : une lecture seule finit « checked » dès qu’aucun point ne pèse ; le vote, lui, finissait « disputed » à cause du désaccord. La 3.8 seule lit moins bien doc3 (3 champs) et doc6 (items.count, tvaAmount) que la paire Flash-Lite : le gain de lignes vient d'un document.
- **N seule** rattrape `currency` sur doc2 (« Fr. » écrit par les deux Flash-Lite, 3 parcours : +3 champs en C et C′) ; sur doc4 il supprime un désaccord de devise, donc l'appel de la 3.8, et les prix de lignes redeviennent justes (+6 lignes en C et C★) : le parcours est aussi moins cher. N ne change rien pour A et B.
- **C★v** : lignes 181/207 (C : 166) contre champs 217/243 (C : 219) ; à comparer à C + N (222/243, 172/207, 0 FV, 0,5284 CHF). C★v + N : 187/207 lignes, 217/243 champs, 0 FV, 0,5284 CHF. Les champs perdus restent doc3 (amountTTC, date, orderNumber) et doc6 (items.count, tvaAmount), où la 3.8 seule lit moins bien que la paire Flash-Lite.
- C★′ ne vaut pas mieux que C★ ici (la garde arithmétique ajoute l'appel de la 3.8 sur doc6, où elle se trompe seule).

## La passe payante (à lancer par le pilote)
```
npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --payant --budget-chf 3.5 --reprendre work/finalisation-tickets-2026-10-08/H13-reels/banc-k1-20261101-081144 --variantes A,C,Cs,Csv,Csp,Lm,Lh,Lp --normaliser --confirm-paid-ai
npx vite-node --config vitest.config.ts scripts/banc-lecture-facture-juger.ts -- work/finalisation-tickets-2026-10-08/H13-reels/banc-k2-<horodatage affiché à la fin> --publier
```
(`--publier` copie le tableau dans `voies/k2-reglages/RESULTAT-BANC-K2.md`.) A, C, C★, C★v et C★′ n'ajoutent aucun appel (tout est prêté par k1) ; seuls Lm, Lh, Lp lisent : 21 parcours × 2 lectures × 3 réglages = 126 appels Flash-Lite, plus une 3.8 neuve seulement là où k1 n'en a pas gardé (1 parcours sur 21), partagée par les trois réglages.
- **Réserve maximale : 3,5 CHF (budget cumulatif ; 1,3932 déjà journalisés, soit 2,11 CHF au plus de nouvelle dépense)**, arrêt net avant de dépasser. Réserve par appel : 0,0182 (Flash-Lite `low`, Lp), **0,0279 (Lm et Lh, plafond 8 192)**, 0,0591 (3.8). Pire cas théorique sans le budget : 126 lectures lite (≈ 3,1 CHF) : le budget l'arrête avant ; l'ordre tirage par tirage garantit que chaque document a au moins un tirage lu. 5 CHF accordés (D234) : marge de 1,5 CHF.
- **Estimation probable : ≈ 1,2 CHF** (fourchette 0,9 à 1,6) : Lp ≈ 0,19 (comme C : 0,0045 par lecture) ; Lm ≈ 0,25 à 0,42 ; Lh ≈ 0,42 à 0,85 (les jetons de réflexion se facturent comme de la sortie ; à `high` jusqu'à 8 192 jetons, soit 0,0279 par lecture au plus) ; 3.8 neuve ≈ 0,02. La simulation ne dit rien du coût (réflexion fabriquée). Durée : 8 à 12 minutes.
- Délai d'une lecture : 45 s pour Lp (comme la production), **90 s pour Lm et Lh** pour mesurer au lieu de couper ; le tableau compte les lectures de plus de 45 s, les coupures `MAX_TOKENS` et la sortie moyenne par réglage.

## Doutes et limites
- 21 parcours, 7 documents : un faux vert de plus ou de moins est un indice. Le gain de lignes de C★ vient de doc1 seul.
- Le statut de C★ est mon choix (lecture seule : « checked » si rien ne pèse). Le contrat dit « tranche seule » sans fixer le statut ; c'est lui qui crée les 4 faux verts.
- N relit chaque lecture avec la devise en code (puis re-normalise) ; la production n'a pas N. Les 3.8 inutiles avec N ne sont « économisées » qu'en calcul : le coût affiché est celui des appels réellement nécessaires avec N.
- Le plafond 8 192 et les niveaux `medium` / `high` ne sont éprouvés qu'avec un `fetch` simulé : la forme exacte de `thinkingLevel` (MEDIUM, HIGH) est celle de la page Google du 01.11, jamais vue en réponse réelle. Un refus HTTP 400 coûterait 0 et arrête le banc au troisième échec d'affilée.
- `tsc -p .` ne voit pas `scripts/` ni `tests/` : j'ai typé ces fichiers avec un `tsc` séparé.

DÉCISION À PRENDRE : aucune. La décision du pilote du 01.11 (option b) est appliquée : **C★v** = valeurs de la 3.8 quand elle tranche, statut du vote (`finalOfStarVote`, test dédié : « disputed » gardé quand la 3.8 tranche). Hors ligne : 0 faux vert (C★ en avait 4), les +15 lignes de C★ gardées, −2 champs comme C★ ; alertes justes 15 (C★ 12, C 17), alertes inutiles 5 (C 3). Le statut seul retire exactement les 4 faux verts, sans changer un champ.

CONNAISSANCE : sur les sept factures, Flash-Lite écrit « Fr. » pour la devise de doc2 ; N (devise en code ISO) la rattrape sans coût et fait gagner 3 champs à C. Une normalisation de code simple vaut plus qu'une consigne : à confirmer par Lp (payant).

LEÇON PROPOSÉE : quand une variante remplace un vote par un seul lecteur, juger aussi le statut final (faux vert) et pas seulement les valeurs : un bon résultat « checked » sans désaccord visible est le pire cas d'une facture (B l'avait montré, C★ le refait).
