OK — 14 problèmes, 3 bloquants (Sun Store est corrigé sur une lecture neuve : 7 lignes, 163,85, payé 163,85, aucun « manquants ». BAUHAUS copie revient : 5 noms au montant d'une voisine, un 9,50 perdu, un 7,50 doublé, sans désaccord sur ces lignes. Nouveau, doc7 : le HT 4,64 est pris pour prix unitaire et la quantité est vidée. Nouveau, doc2 et doc14 : « Voir la ligne en trop › » ouvre une vraie ligne, stérilisation 711,70 ou Cuve 39,00, sous un « 1 article en trop » rouge faux)

Version : hébergement `en-ligne/2026-11-10-lecture`, bundle servi `index-Doi8Sbpb.js` (vérifié dans la page à chaque passage), aiTask 43a52e5a (tag `aitask/2026-11-10-1048`, dit par le pilote, non vérifiable depuis le client), https://brasserie-l-affinee.web.app, compte connecté, 10.11.
Scripts : `critique/en-ligne/jouerA.mjs` (lecture, provisoire, final, rangées rouges touchées, désaccord, loupe, filtre + Suivant, « Chercher une ligne », × › Abandonner), `jouerB.mjs` (ZZ : lire, confirmer, stock, chercher, retirer ; entrée par « Actions rapides » corrigée ce jour), `lotA.sh`, `planche.mjs`. Sorties `critique/en-ligne-1/sortie-<passage>.log`, captures `critique/en-ligne-1/`, planches `en-ligne-1/planches/`.
Pièces : copies du scratchpad (`pieces-el1/`, puis `pieces-r2/` aux octets « EL1-R2 » pour le rejeu), existence vérifiée (`FICHIERS […]`). Vérité : `verite.txt` (doc2, doc7, doc14, doc15, doc24, doc25, doc26).

## Passages et lectures neuves (heure UTC)
a BAUHAUS tâché 390 cave, lecture neuve 09:35 ; b cache 1280 clair. c BAUHAUS copie 1280 clair, neuve ~09:38 ; d cache 390 cave. e Sun Store 1 + 2 390 clair, neuve ~09:40 (aiTask d'avant 43a52e5a) ; f cache. g doc15 1280 cave, neuve ~09:42 ; h cache. i doc7 390 cave, neuve 09:43 (final 18 s) ; j cache 1280 clair. k doc2 1280 clair, neuve 09:45 ; l cache 390 cave. m doc14 390 clair, neuve 09:47 ; n cache 1280 cave.
Rejeu après 43a52e5a : **o Sun Store 1 + 2, 1280 clair, lecture neuve 09:52 (provisoire 9 s, final 21 s)** ; **p BAUHAUS copie, 390 clair, lecture neuve 09:50 (12 s / 32 s)**. Facture ZZ : x lecture 390 clair 09:53 (final en 4 s), y Confirmer 1280 cave 09:54:40, s stock, c ⌘K, r retrait.
Lectures Gemini neuves du jeu : 10 (a, c, e, g, i, k, m, o, p, x), soit 0,5 à 0,8 CHF estimés. × › Abandonner à chaque passage de lecture (`preuveEncore:false`). « Confirmer » touché seulement sur la facture ZZ TEST (la garde « fournisseur et chaque ligne portent ZZ TEST » valait vrai). `pageErreurs []` partout.
Captures OUVERTES : planches a1, a2, bf, c1, e1, g1, h1 (session 1) ; i1, j1, k1, l1, m1, n1, p1, zb ; zz-lire-x-02. Les autres sont lues par leurs mesures (NOTE).

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| bauhaus-copie p-06 à p-10 | clair | 390 | final neuf | 1, 6, 8 | 1 |
| bauhaus-copie c-07, c-08 | clair | 1280 | final neuf | 1, 8 | 1 |
| sunstore o (log), e1, bf | clair / cave | 1280 / 390 | final neuf, provisoire | 6, 7 | aucun (bloquant 2 corrigé) |
| doc7 i-03, i-05, i-07, i-11 | cave | 390 | provisoire, final, ligne ouverte | 2, 13 | 2 |
| doc7 j-03, j-05 | clair | 1280 | cache | 2 | 2 |
| doc2 k-05 à k-11 | clair | 1280 | final, geste, désaccord | 3, 5, 9 | 3 |
| doc2 l-03 à l-09 | cave | 390 | cache, geste | 3, 9 | 3 |
| doc14 m-05 à m-11 | clair | 390 | final, geste | 3 | 3 |
| doc14 n-03, n-07 | cave | 1280 | cache | 3 | 3 |
| bauhaus-tache a, b | cave / clair | 390 / 1280 | final | 4, 5, 6 | aucun |
| doc15 g, h | cave / clair | 1280 / 390 | final | 5 | aucun |
| zz-lire-x-02 | clair | 390 | ligne Cascade ouverte | 11, 12 | aucun |
| zz-confirmer-y-05, zz-chercher-c-01 | cave / clair | 1280 | après Confirmer, ⌘K | 11, 14 | aucun |

## Lot A, champ par champ (lecture neuve contre la vérité)
- doc7 : 7 lignes sur 7, montants justes, total 29,65, TVA 2,20, date « ? » (juste : elle est absente), Payé « — ». Mais chaque ligne finale a une quantité vide et « × 4,64 = 5,00 » (problème 2).
- doc2 : 6 lignes sur 6, total 768,55, TVA 56,61, date 25.06.2026. La Sédation est sans montant, ce qui est juste (aucun montant imprimé) ; elle porte « 1 à remplir ».
- doc14 : 16 lignes sur 16, noms, quantités et prix justes (0,0101 compris), total 170,20, « dont port 30,00 », arrondi −0,01, TVA 8,90, date « ? » (juste). Le rouge « 17 / 16 +1 » est faux (problème 3).
- doc15 : 17 lignes sur 17, 202,20 (session 1). BAUHAUS tâché : 29 sur 29, 277,60, −74,45 en rouge, juste (session 1).

## Sa question : « combien et quels problèmes il y a ? »
Les bloquants d'abord.
1. **BLOQUANT — revient (3e lecture : c, d, p) — BAUHAUS copie (doc25) : des noms glissent sur le montant de leur voisine et une ligne se perd, sans que l'écran le dise.** Passage p (octets neufs, après 43a52e5a) : 22 lignes, 134,65 (vrai : 136,65). 17 lignes justes. Fausses : ROULEAU 12CHTUBEEO 7,50 (vrai 9,50), MASKTIUS BOIS 9,50 (vrai 4,25), MARKEL 4,25 (vrai 3,95), SEAU TEI ROUGE 3,95 (vrai 2,95), COMBINAISON JETABLE 2,95 (vrai 9,50). Un 9,50 est perdu et un 7,50 doublé (DEBOUCREOR POMER, marqué d'un ⟳ bleu jamais expliqué) ; le nom d'AFPRET est fondu avec celui de DEBOUCREOR. Ce que l'écran dit : « À vérifier · 217,40 CHF manquants » en rouge, alors que l'écart réel de la photo est 215,40 (les 2,00 d'erreur s'y noient) ; « Lectures 3/3 · 1 désaccord », qui ne porte que sur VITRIFIC ; « Qté × prix 22/22 justes » ; « 1 à contrôler » ; rien sur les cinq lignes fausses. C'est une limite de vision (les trois lectures voient la même chose), pas de fusion, mais c'est un montant faux affiché comme sûr. Captures p-07, p-09, p-10.
2. **BLOQUANT — nouveau — doc7 Infomaniak : le final remplace « 1 × 5,00 » (juste au provisoire) par une quantité vide et « × 4,64 = 5,00 ».** 4,64 est le HT de la ligne (colonne « Amount excl. tax »), pris pour prix unitaire d'un montant TTC. Idem pour 9,19, 2,23, 2,79, 3,96, et kSuite « × 0,000 ». « Qté × prix 0/7 » reste en gris, « Lectures 3/3 d'accord ». En flux, l'écran dit « 7 corrigées » et barre « 1re lecture 1 ? × 5,00 ». En cache (j, 1280), plus rien de barré : la valeur fausse s'affiche comme sûre. Captures i-07, i-11, j-05.
3. **BLOQUANT — nouveau — « Voir la ligne en trop › » ouvre une vraie ligne, sous un « 1 article en trop » rouge faux.**
   - doc2 : « Articles lus ≠ comptés 6 / 5 +1 ». La Sédation, imprimée sans montant, est comptée en trop. Le geste ouvre « stérilisation… 711,70 » (k-09, l-07).
   - doc14 : « Articles lus ≠ annoncés 17 / 16 +1 », alors que l'en-tête dit « 16 lignes · dont port 30,00 » : la ligne de port cachée est comptée. Le geste ouvre « Cuve de fermentation 39,00 » (m-11, n-08).

   Le brasseur qui suit le geste supprime un vrai article et fausse le total.
4. Non bloquant — reprise n° 3 — BAUHAUS tâché : ETERE MULTIBROSSE rangée en « Matériel de brassage 1 » ; à 1280, l'en-tête colle à Rénovation.
5. Non bloquant — reprise n° 4 — des barrés qui ne corrigent rien : variantes d'orthographe (tâché), nom imprimé barré sous sa traduction (doc15). doc2 dit « 6 corrigées » alors que le barré est identique au nom (« Collerette Velfast ROUGE 25cm » au-dessus du même texte barré, idem Rimadyl et Combiclav). Le flux et le cache diffèrent.
6. Non bloquant — reprise n° 5 — le provisoire affiche un rouge que le final renverse. Sun Store o : « 1 article en trop · 7 / 6+1 », « Qté × prix 4/5 · Ouvrir la ligne fausse › ». doc25 p : « 231,61 manquants », « 21 / 18+3 ».
7. Non bloquant — reprise n° 6 — Sun Store, ligne H21 : « 2 pièces × — 50,00 », « 1 sans prix unitaire », pied « prix corrigé » (vu aussi en o).
8. Non bloquant — reprise n° 7 — VITRIFIC : 1re lecture « 1 ? × 0,69 · 0,69 » barrée (p) ; en c, quantité perdue.
9. Non bloquant — reprise n° 8 — « Voir le désaccord » ouvre la ligne sans montrer le désaccord (doc2 : Collerette, le désaccord n'est qu'au pied). Le pied reste fixe à 390.
10. Non bloquant — reprise n° 9 — l'EAN imprimé barré (481300722244) n'est pas trouvé par « Chercher une ligne ».
11. Non bloquant — nouveau — facture ZZ : « ZZ TEST Hopfen Cascade Pellets 100 g », 1 × 12,50, entre au stock en « 0 → 1 pièce » et ⌘K le liste « 1 Stk · Houblon ». Un houblon se compte en grammes (100 g) ; « Stk » est l'unité allemande déjà refusée (TL-42, B2-NOTE).
12. Non bloquant — nouveau — facture ZZ (un seul taux, 2,6 %) : drapeau « À vérifier · 1 désaccord de lecture » et pied « Bloc TVA : lectures divergentes (2.6% base non lu TVA 0,44 /… ». Le « 2.6% » est écrit au point, et le désaccord porte sur une TVA juste (0,44 / 0,44).
13. Non bloquant — nouveau — doc7 kSuite : « ? × ? », puis « × 0,000 » : trois décimales pour un prix nul.
14. Non bloquant — nouveau — après « Confirmer » de la dépense ZZ, Finances › Annuel affiche « Les comptes ont changé depuis ta dernière relecture : les vérifications sont à refaire. » et la clôture 2026 repasse à « 1 / 9 prêtes » : une dépense de test touche l'état de clôture réel (y-05, r-01).

## Recherche (C)
- « Chercher une ligne » dans la Dépense : nom, montant et référence partielle marchent (session 1). doc7 : « laffinee » trouve 5 lignes sur 7, « 9,95 » 1 sur 7. doc25 : « DEBOUCH » 1 ligne, « 9,95 » 2 lignes.
- ⌘K « Hopfenhandel » : 2 résultats, l'article de stock « ZZ TEST Houblon Cascade Pellets 100 g · 1 Stk · Houblon » et l'écriture « ZZ TEST — Hopfenhandel Test GmbH · ZZ-TEST-1110 · houblons · 10.11.2026 · 17,50 CHF » (c-01).
- **Non joué** : « 17,50 », « Cascade Pellets », « Versandkosten » et le clic qui ouvre la dépense. Le script a cassé sur la lecture de la liste (`jouerB.mjs` l. 87), après la 1re requête.

## Retrait (D) — NON FAIT, données de test encore en ligne
`--etape=retirer` n'a pas trouvé l'écriture depuis Finances (vue Annuel par défaut, r-01) : aucun geste fait.
**Restent en ligne** :
- l'écriture « ZZ TEST — Hopfenhandel Test GmbH », 17,50, du 10.11.2026, non annulée ;
- l'article de stock « ZZ TEST Houblon Cascade Pellets 100 g » (1 Stk) ;
- le justificatif dans le Drive ;
- l'état « vérifications à refaire » de la clôture.

À faire :
- l'écriture : Finances › Opérations › l'écriture › « Corriger une erreur de saisie » › « Annuler cette écriture » (l'app annule et garde la trace, elle n'efface pas) ;
- l'article : Stocks › Articles › l'article › Supprimer ;
- le fichier Drive : à retirer à la main.

## Doutes (non comptés)
- « Lame de ragréage » pour LAME DE GABRAGE (doc15 ; le vrai sens probable est « lame de grattage »).
- Des noms OCR bruts ne sont pas traduits sur les tickets tâchés (TAETS, TURGTNE MELRANEUR…).
- BAC A est rangé en « pièce | L ».
- Le ⟳ bleu devant DEBOUCREOR POMER (p) : l'écran n'en dit pas le sens.
- La lecture ZZ rend son final en 4 s : lecture neuve, ou cache d'un essai antérieur ? Non établi.
