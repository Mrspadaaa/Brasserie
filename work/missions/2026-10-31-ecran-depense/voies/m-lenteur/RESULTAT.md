OK — 4 options (+3 variantes de B) mesurées hors ligne sur 14 pièces, aucun appel payé ; reco : D, écran sur les deux Flash-Lite

Aucune valeur de ses pièces ici : des comptes, des durées, des coûts, des noms de champ. Aucun appel Gemini, rien dans `src/` ni `functions/`, aucun commit.
Fichiers écrits (tous dans `voies/m-lenteur/`) : `mesurer.ts`, `verifier-banc.ts`, `sortie-k6-C.txt`, `sortie-k5-C.txt`, `sortie-verifier-banc.txt`, `mesure-banc-k6-C.json`, `mesure-banc-k5-C.json`
(et `mesure-banc-d272b-hl.json`, reste d'un essai : ce banc mêle des 3.8 d'une autre consigne, ne pas s'en servir).

## D'où vient chaque nombre
- **Lectures** : `H13-reels/banc-k6-C` (passe payante du 01.11, 14 pièces × 1 tirage, la production C★v8 telle quelle). Les réponses brutes de chaque lecture (`raw/docN-t1-Csv81|82|83.json`) et leurs durées et coûts (`results.json`) sont gardés séparément : les deux Flash-Lite et la 3.8, avec leurs temps. 12 pièces sur 14 ont une 3.8 ; doc7 et doc8 n'en ont pas (les deux Flash-Lite concordent).
- **Fusion** : celle de la production, IMPORTÉE, jamais recopiée (`functions/src/invoiceScanVote.ts` : `finalOfStarVote`, `finalOfTwo`, `needsThirdLite` ; `invoiceVisionReview.ts` : `reconcileInvoiceVision`). Chaque lecture est relue par `readingFromResponse` du banc avec N, comme la production.
- **Champs / lignes justes** : `judgeResult` du banc (`banc-lecture-facture-juger.ts`), vérités `cas*.json`.
- **Drapeaux** : les niveaux de l'écran, `src/ui/depense/confiance.ts` (`confianceLigne`, `confianceEntete`, `ciblesDuPoint`) : jaune = repris, rouge = inconnu. Comptés sur les cellules que la lecture détermine (unité, quantité, prix, montant ; date, fournisseur, total, TVA, numéro, lignes, document) ; famille et article en sont exclus (ils dépendent du stock, pas des lectures).
- **Erreur muette** = une valeur fausse (selon le juge) dont la cellule est au niveau « sûr » : aucun drapeau. Un nom ou une nature faux se juge sur les cibles des points de la ligne. « Faux vert » = statut du document `checked` avec un champ faux (définition du banc).
- **Temps côté serveur** = Flash-Lite en parallèle (le plus long des deux) + 3.8 en suite ; appels Gemini seuls (le transfert et `traduireNoms` 3,8 s ne sont pas comptés). Contrôle : doc14 en ligne le 02.11 = 6,1 / 6,6 s puis 14,8 s ; au banc 6,0 s puis 17,1 s : même ordre.
- **Témoin** : l'option A recalculée = le résultat final écrit par le banc sur 13 pièces sur 14 (`sortie-k6-C.txt`, ligne « TEMOIN »). L'écart : doc14, `amountHT`, juste aujourd'hui grâce à D272 (sous-total TTC lu comme HT), faux dans le résultat écrit avant D272. D'où 154/165 ici contre 153/165 écrit en D266. Le jugement du banc relancé sur ses résultats écrits donne bien 153/165, 217/224, 1 faux vert (`sortie-verifier-banc.txt`).
- **Commande** (hors ligne, aucun réseau) : `npx tsx work/missions/2026-10-31-ecran-depense/voies/m-lenteur/mesurer.ts --banc=banc-k6-C --detail`.

## Les options, sur ses 14 pièces (1 tirage)
Les options ne changent que le moment et la façon dont la 3.8 compte (fusion et jugement identiques).

| option | 3.8 appelée | 1er écran utilisable (méd / pire) | lecture finale (méd / pire) | champs /165 | lignes /224 | jaunes · rouges | erreurs muettes (pièces) | faux verts | coût par pièce (méd) |
|---|---|---|---|---|---|---|---|---|---|
| **A** aujourd'hui | 12/14 | 18,5 s / 37,7 s | 18,5 s / 37,7 s | 154 | 217 | 73 · 10 | 10 (6) | 1 | 0,0445 CHF |
| **B** 3.8 si désaccord d'argent (total, HT, TVA, quantité, prix, montant de ligne, lignes sans vis-à-vis) | 10/14 | 13,0 s / 34,3 s | 13,0 s / 34,3 s | 156 | 217 | 75 · 9 | 10 (6) | 1 | 0,0348 |
| B2 : comme B, sans quantité ni prix unitaire | 8/14 | 11,0 s / 34,3 s | 11,0 s / 34,3 s | 156 | 220 | 81 · 10 | 7 (5) | 1 | 0,0306 |
| B3 : comme B2, sans la TVA (total, HT, montant de ligne, lignes) | 5/14 | 8,6 s / 33,6 s | 8,6 s / 33,6 s | 154 | 218 | 85 · 17 | 7 (5) | 1 | 0,0285 |
| **C** jamais de 3.8 | 0/14 | 6,3 s / 9,9 s | 6,3 s / 9,9 s | 149 | 206 | 71 · 34 | **22 (8)** | 0 | 0,0205 |
| **D** écran sur les deux Flash-Lite, 3.8 ensuite | 12/14 | **6,3 s / 9,9 s** | 18,5 s / 37,7 s (= A) | 154 | 217 | 73 · 10 (final) | 10 (6) au final ; **22 (8) au 1er écran** | 1 (final) ; 0 au 1er écran | 0,0445 |

- Le premier écran de D est celui de C (149/165, 206/224, 71 jaunes, 34 rouges, 22 muettes) ; sa lecture finale est celle de A. Total des coûts sur 14 pièces : A 0,626, B 0,565, B2 0,524, B3 0,417, C 0,267 CHF.
- Bonus B+D (non demandé) : 1er écran de C (6,3 s), final de B (13,0 s médian) ; mêmes chiffres que B pour la justesse.
- La 3.8 ajoute 12 s médian (3,8 s sur doc13 à 29 s sur doc9). Les pièces longues sont celles qui pèsent : durées Flash-Lite + 3.8 par pièce : doc1 3,3+10,7 · doc2 3,1+8,9 · doc3 1,7+5,3 · doc4 2,3+5,2 · doc5 8,6+18,0 · doc6 6,5+18,5 · doc7 3,1 · doc8 9,9 · doc9 8,6+29,1 · doc10 8,8+25,5 · doc11 7,9+25,7 · doc12 7,2+22,2 · doc13 3,0+4,8 · doc14 6,0+17,1 s.
- Pourquoi la 3.8 part (champs, jamais de valeurs ; `$` = au moins un désaccord d'argent) : bloc TVA (`vat`) sur 8 des 12 pièces, lignes sans vis-à-vis (`items`) sur 3, `amountHT` sur 2, `price` seul sur 2 (doc4, doc5) ; deux pièces sans désaccord d'argent (doc3 : fournisseur, référence ; doc9 : nom, variante). Les désaccords de `kind`, d'unité, de nom, de fournisseur accompagnent presque toujours un désaccord d'argent : **B n'économise que 2 appels sur 12** ; il faut ôter la TVA et le prix (B3) pour tomber à 5 appels.

## Ce que la 3.8 achète vraiment (A contre C, champ par champ, k6-C)
- La 3.8 corrige 23 champs que les deux Flash-Lite avaient faux (7 prix de doc1, `invoiceNumber`, `amountHT`, `documentType`, des unités de doc11, la quantité et le prix de doc13…), dont 12 que C laisse **sans drapeau** : les deux Flash-Lite lisent la même valeur fausse, donc aucun désaccord. Mesuré : les 22 erreurs muettes de C (et les 10 d'A, et les 13 d'A sur k5-C) sont **toutes** sur une cellule où les deux Flash-Lite s'accordaient (ligne « MUETTES » de `sortie-k6-C.txt`). Un désaccord fait toujours un drapeau ; seule une erreur partagée passe, et seule une 3.8 appelée pour une autre raison la corrige au passage.
- Elle en casse 6 que les Flash-Lite avaient justes (doc3 `orderNumber` et `amountTTC`, doc4 trois prix, doc6 `tvaAmount`) : elle invente un montant. C'est ce que B2 évite sur doc3 et doc4 (+5 champs, lignes 220/224 contre 217).
- Donc la 3.8 qui part « pour une autre raison » corrige aussi des valeurs sans rapport avec la raison. Un déclencheur limité à l'argent perd cet effet de bord.

## Réplique sur un second tirage (`banc-k5-C`, 16 pièces-tirages sur 11 pièces)
Moins propre : certaines 3.8 sont prêtées de passes plus anciennes, 10 pièces-tirages sont écartées faute de réponse brute (liste dans `sortie-k5-C.txt`). Indicatif seulement.
- A 12/16 appels 3.8, final 20,2 s médian, 176/187 champs, 293/302 lignes, 13 muettes (5 pièces), 11 rouges, 0 faux vert.
- B 5/16 appels, 10,0 s médian (pire 35,3 s), 174/187, 288/302, 13 muettes, **23 rouges**. B perd 7 champs contre A : 5 `kind` de doc9 (signalés) et `invoiceNumber` + `amountHT` de doc10 (muets : les deux Flash-Lite lisaient pareil, la 3.8 les corrigeait au passage). B3 perd 11, C 12.
- D : 1er écran 8,8 s médian (pire 11,4 s), final = A.
Les deux jeux disent la même chose : une 3.8 retirée coûte des corrections muettes (doc10 HT dans les deux, doc11 `documentType`, doc13 quantité et prix).

## Lecture
1. **Sans perte de justesse, ≤ 12 s côté serveur n'est tenu que par le premier écran de D (6,3 s médian, 9,9 s pire pièce)**. Le temps jusqu'à la lecture finale ne bouge pas (18,5 s). B2 descend à 11,0 s médian mais 34 s sur les pièces longues, et sa justesse repose sur 1 tirage de 14 pièces.
2. **C est écarté** : 149/165 et 206/224, 34 rouges à remplir, 22 erreurs muettes (contre 10) : contraire à « très fiable » (31.10).
3. **D ne coûte aucune justesse si l'enregistrement attend la lecture finale** : sur le 1er écran, 22 valeurs fausses sont sans drapeau sur 8 pièces. Ce qui compte pour une facture : ce premier écran est jaune partout (statut `disputed` sur toutes les pièces où les deux lectures diffèrent, 0 faux vert) mais il ne dit pas tout. Il faut donc un état « lecture finale en cours » qui bloque l'enregistrement (ou rend chaque valeur provisoire), puis lève ou confirme les drapeaux à l'arrivée de la 3.8.
4. **Le reste des 10 erreurs muettes d'A existe dans toutes les options** (doc1 date, `documentType` de doc3, doc10 et doc12, prix de doc2 et de doc4) : ce n'est pas un effet de la 3e lecture. À traiter à part (cellule « type de pièce » toujours « sûre » dans `confiance.ts`, prix de bordereau de livraison).

## Limites (dites avec chaque chiffre)
- 14 pièces, 1 tirage : sous 40 pièces, **un indice, pas une preuve** (skill banc-lecture). Un gain de B2 venu de doc3 et doc4 seulement (+5 champs) n'est pas un gain. Le second jeu (k5-C) est partiel.
- Les erreurs muettes dépendent de la table de `confiance.ts` (f2, non branchée dans l'écran à ce jour) ; la cellule « type de document » est toujours « sûre » sauf point de lecture.
- Les temps sont ceux de ce banc (appels Gemini, une nuit) : la 3.8 varie de 4,8 s à 29,1 s selon la pièce ; aucun tirage répété pour mesurer la dispersion.
- Le client de D (écran provisoire puis final) n'est pas mesurable hors ligne : un appel `aiTask` qui rend deux fois, ou un second appel, est de l'architecture (L'écran de la Dépense et `functions/` hors de ma voie).

## Ce qui n'a pas pu être mesuré sans passe payante, et la passe
Le seul manque utile : la dispersion (deux tirages de plus de la même production sur les 14 pièces) pour confirmer B2 contre A.
`npx tsx scripts/banc-lecture-facture.ts --payant --variantes Csv8 --repeat 2 --normaliser --cas cas.json,cas-2.json,cas-3.json,cas-4.json,cas-5.json --budget-chf <reste> --plafond-passe 3.3 --confirm-paid-ai --out <dossier hors Git>`
`--estimer` (aucun réseau) : `BANC ESTIME 3.2965 CHF 84 appels neufs` (réserve au pire : sortie au plafond de chaque appel) ; dépense réelle probable ≈ 1,25 CHF (2 × 0,627 CHF, coût de k6-C), journal 8,65 → ≈ 9,9 CHF. Elle ne peut être lancée que par le pilote. Pas nécessaire pour D : sa justesse finale est celle d'A, déjà mesurée.

## Essais
Un seul script, 5 exécutions : (1) argument de dossier pris pour un main() du juge (corrigé : drapeaux `--banc=`) ; (2) 154 contre 153 attendu (expliqué par le témoin : D272) ; (3) variante B3 ajoutée après avoir vu que la TVA et le prix tirent B vers A ; (4) second jeu k5-C écarté en partie faute de réponses brutes (3.8 prêtées introuvables) ; aucun critère de GATES (le dossier n'en contient pas).

DÉCISION À PRENDRE : D261c. Options : (A) garder ; (B-famille) 3.8 seulement sur désaccord d'argent ; (C) jamais ; (D) écran sur les deux Flash-Lite, 3.8 en arrière-plan. Recommandation : D, enregistrement bloqué jusqu'à la lecture finale ; B2 en second temps, seulement après deux tirages de plus (passe ci-dessus). D est un choix de parcours du brasseur (« lecture en cours », valeurs provisoires) : à lui montrer en mini maquettes (L24) avec les chiffres ci-dessus ; la direction technique (appel qui rend deux fois ou second appel) va au conseil.
CONNAISSANCE : la 3.8 corrige des valeurs que les deux Flash-Lite lisent pareil (HT, numéro, type, prix), sans désaccord donc sans drapeau ; la retirer ou la limiter à l'argent fait réapparaître ces erreurs muettes (k6-C : 22 contre 10 sans 3.8 ; k5-C : doc10 HT et numéro avec B). Elle invente aussi un montant sur 2 pièces (doc3, doc4).
LEÇON PROPOSÉE : aucune
