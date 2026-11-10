# Mission — fusion fiable des lectures de factures (10.11)

Pilote : Opus. Origine : jeux en ligne 5 à 7 de `2026-11-09-depense-totaux` (L29 atteinte : trois rustines dans le même module).
Accord du brasseur (10.11, « Oui ») : 3 CHF de lectures Gemini réelles au plus, journalisées (skill banc-lecture), jamais dans `npm test`.

## Portée
Serveur `functions/src/invoiceVisionReview.ts` (`alignLines`), `functions/src/invoiceScanVote.ts` (`finalOfStarVote`, `rangsProvisoires`,
`retireesParLaTroisieme`, `redresserDecalage`, `lireCsv8`), `functions/src/ai.ts` (note multi-pages) ; client `src/ui/depense/finale.ts`,
`src/ui/finance/ExpenseSheet.tsx`, `src/domain/finance/controlesPiece.ts` seulement si la cause y est. Écrans DP-2 et D382 intacts.

## Défauts à faire disparaître (vus en ligne, jeux 5 à 7)
1. Deux tickets Sun Store d'un même règlement en deux pages : la 3.8 ne rend que la page 2.
2. Lignes « vues par une seule lecture » ou « retirées » qui sont des doublons ou des sous-totaux.
3. Quantités « 1 » perdues (BAUHAUS : 29 lignes « ? × — »).
4. Corrections décalées d'un rang (nom barré d'une voisine).
5. Payé 14,60 au lieu du terminal 163,85.
6. « 13 comptés » inventé (`countedAmounts` de la seule 3.8).

## État de l'art

### Problème type
Combiner plusieurs transcriptions bruitées d'un même document : c'est la **combinaison de sorties de reconnaissance**.
- **ROVER** (Fiscus, 1997) : aligner les hypothèses en un réseau de créneaux par programmation dynamique, autour d'un pivot, puis
  **voter créneau par créneau** (majorité, départage par la confiance du meilleur lecteur).
- Le même schéma en OCR : alignement puis vote de plusieurs moteurs ou passes (Lopresti et Zhou, 1997 ; Lund et Ringger, 2009,
  « Improving OCR accuracy through alignment and voting »).
- Pour des **lignes** (enregistrements) et non des caractères : appariement de deux listes (record linkage). Ordonnées, c'est
  l'**alignement global de séquences de Needleman-Wunsch** (DP O(n·m)) avec un score de substitution (ressemblance du nom, égalité
  des chiffres) et un coût de trou ; non ordonnées, l'**affectation** (Kuhn-Munkres / Hungarian).
- La ressemblance de libellés OCR : distance de Levenshtein normalisée et rapport « ensemble de mots » (token set ratio, RapidFuzz).
- Les contraintes arithmétiques (somme des lignes = total, qté × prix = montant) servent de contrôle, pas de choix silencieux.

### Examiné
- Code actuel : `alignLines` n'apparie que des noms **identiques** (ou une coquille d'un caractère par `sameName`, non utilisée ici),
  puis une clé de chiffres « seule candidate » : une faute d'OCR (« APPRET ORTXESSEL 1L » / « APPRET ORTXESSEL ») laisse deux lignes
  orphelines, donc doublons dans le provisoire et « retirées » fausses ; `rangsProvisoires` rattrape par intervalles et seuils
  (rustine p3) ; C★ fait **trancher la 3.8 seule** : ses lignes, quantités, total, payé et `countedAmounts` remplacent ceux des deux
  Flash-Lite même quand celles-ci s'accordent (défauts 1, 3, 5, 6) ; `redresserDecalage` est un vote partiel déguisé (rustine p3).
- Bibliothèques : RapidFuzz (Python ; en JS `fuzzball`, maintenue) pour les ratios ; `fastest-levenshtein` (maintenue) ;
  paquets npm Needleman-Wunsch (chaînes seulement, non maintenus) ; `munkres-js` (non maintenue). Aucune ne traite des séquences
  d'objets avec un score propre ; l'algorithme de NW tient en une vingtaine de lignes de manuel.

### Décision (écrite avant le code)
1. **Un seul aligneur** : `alignLines` devient un Needleman-Wunsch (monotone, trou à coût nul = appariement monotone de poids
   maximal) sur un score : ressemblance du nom (max de Levenshtein normalisé et du rapport « ensemble de mots »), référence
   égale, montant égal, quantité égale. Un couple n'est permis que sur une preuve (référence, nom ≥ seuil, ou nom moyen au même
   montant) ; jamais la position seule. Une seconde passe gloutonne, à seuil strict, rattrape un bloc déplacé (pages dans un autre
   ordre). Même signature : la réconciliation des deux Flash-Lite, le vote à trois, `rangsProvisoires` et `retirees` utilisent le
   même aligneur, donc le flux et le cache disent la même chose par construction. Le Levenshtein reste celui du code (`ressemblance`) ;
   pas de dépendance ajoutée à `functions/`.
2. **Vote ROVER à trois quand la 3.8 tranche** : les trois lectures s'alignent autour de la 3.8 (pivot) ; une ligne est gardée si
   la 3.8 l'a, ou si les deux Flash-Lite l'ont ; chaque champ chiffré (montant, quantité, prix, unité) suit la majorité des valeurs
   lues, sinon la 3.8 ; le nom et la nature sont ceux de la 3.8 quand elle a la ligne. En-tête : total, payé, terminal, comptage
   suivent la majorité, sinon la 3.8 ; un comptage (`countedAmounts`, `printedLineCount`) que la 3.8 est seule à lire, sans
   majorité, n'est pas gardé. Les contrôles et points sont recalculés sur la lecture fusionnée (`finirUneLecture`).
   `redresserDecalage` disparaît (le vote le contient).
3. **Plusieurs pages** : la note dit que les captures peuvent aussi être des tickets distincts d'un même règlement ; à mesurer
   au banc réel avant de la garder.
4. Juger contre la production (C★v8) sur les lectures réelles enregistrées (113 tirages, 21 documents à vérité écrite), réglage
   choisi sur les documents pairs, jugé sur les impairs (L20) ; puis sur les pièces réelles de la mission 2026-11-09.

## Critères (écrits avant le code)
- C1 Banc hors ligne (aucun appel) : lignes justes (nom ≈ vérité et montant) ≥ production sur l'ensemble et **aucun document en
  recul** ; quantités justes ≥ production ; total juste ≥ production ; faux verts (statut « checked » sur une valeur fausse) ≤ production.
- C2 Appariements montrés (provisoire → final) qui relient deux lignes différentes de la vérité : 0 (production : compté).
- C3 Lignes retirées qui doublent une ligne gardée ou sont un sous-total : 0.
- C4 Pièces réelles (≤ 3 CHF) : Sun Store 1 + 2 → 7 lignes, total et payé 163,85, aucun « 13 » ; BAUHAUS tâché → 29 lignes au montant
  du ticket, quantité 1, aucun doublon proposé ; pas de recul sur les pièces qui marchaient.
- C5 `npm test`, `tsc` racine et `functions/`, `npm run build` verts ; déploiement (hébergement depuis `deploy-bc70` détaché sur le sha,
  `VITE_HOP_V4=on`, check-no-dev-auth, check-build-flags ; `aiTask`) ; jeu en ligne du critique : 0 bloquant.

## Résultats (banc, `banc/rejouer.ts`, `banc/comparer.mjs` ; production = HEAD 3e21807b rejouée par le même banc)
Hors ligne, toutes les lectures réelles enregistrées (207 tirages dont 167 anciens, 21 documents à vérité ; sortie `banc/avant.json`, `banc/apres.json`) :

| critère | production | fusion |
|---|---|---|
| lignes justes (montant au bon rang) | 3 051 | 3 056 |
| quantités justes | 2 782 | 2 824 |
| totaux justes | 198 | 198 |
| faux verts | 4 | 4 |
| lignes finales ayant leur jumelle au provisoire mais rapprochées ailleurs (C2) | 32 | 1 |
| lignes « retirées » qui doublent une ligne gardée (C3) | 17 | 0 |
| comptages faux (`countedAmounts`) | 17 | 2 |

Aucun document en recul sur les lignes ou les totaux. Réglages : seuils posés avant le banc (0,8 ; 0,4 ; 0,85) ; deux retouches vues sur
doc24 (pair : la référence EAN seule n'est plus une preuve) et doc25 (impair : le redressement d'un décalage exige trois listes de même
longueur, garde reprise de p3), chacune jugée sur l'autre. doc24 garde 8 noms posés sur le montant voisin dans un tirage : les trois
lectures se contredisent (aucune majorité), la 3.8 reste et le désaccord se dit. Sous 40 pièces : un indice, pas une preuve.

Réel (accord 3 + 5 CHF ; dépensé 0,46 CHF, journal `2026-11-01-banc-lecture/journal-gemini.md`) :
- Sun Store, deux tickets en deux captures (`cas-8.json`, doc26) : ancienne phrase + production : 1 tirage sur 3 ne garde qu'un ticket
  (2 lignes, total faux) ; nouvelle phrase : 3/3 complets (7 lignes, 163,85) ; payé lu 14,60 par les trois lectures, terminal 163,85 :
  règle `payeDuReglement` ; comptages 9/10/7, 13/13/7, 13/8/7 : règle `voterComptage` (unanimité).
- BAUHAUS net en deux captures qui se recouvrent (`cas-9.json`, doc27, découpe de doc15) : 17/17 sans doublon avec les deux phrases.

## Journal
- 10.11 : mission ouverte, état de l'art et décision écrits avant le code.
- 10.11 : budget porté à 8 CHF par le brasseur (« J'autorise 5chf de budget en plus »).
