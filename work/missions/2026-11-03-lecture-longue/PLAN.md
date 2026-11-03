# D380 — lecture d'une longue pièce en morceaux (03.11)

Ses mots : SPEC-BRASSEUR (03.11, « tu vas fixer ça ??? », « 2 lecture paralelle qui font des take », « Comment l'ia sait où elle en est ??? »,
« surtout sur les … ticket de caisse », « Pas besoin de toujours découper […] Quand est-ce que ça trigger ? »). Décision : `decisions.md` D380.
Défaut : DEFAUTS-RECURRENTS D380. Essai réel et coûts : `../2026-10-31-ecran-depense/journal-gemini.md` (03.11 matin).
Pièces fictives (hors Git) : scratchpad `beaucoup/` (`fabriquer.mjs` : 300 lignes sur une page haute, 600 sur 8 pages A4 ; `verite-*.json`).

## Architecture retenue (pilote)
- **App (client) découpe**, le serveur lit et assemble. `invoiceScanCore` importe `node:zlib`, `node:crypto`, `node:fs` : l'app ne peut pas normaliser.
- Chaque morceau = un appel `aiTask` `scanInvoice` ordinaire (fichier = l'image du morceau) + `morceau: { k, n }` : même vote (deux Flash-Lite en
  parallèle, 3.8 sur désaccord), même cache, même budget (3 appels par morceau), même délai. Consigne ajoutée : `bandNote(k, n)` (k = 1 : en-tête ; k = n : totaux).
- Puis un appel `aiTask` `assemblerLecture` (aucune IA, aucun coût) : les résultats des morceaux → `mergeDecoded` (dédoublonne le recouvrement,
  en-tête du premier, totaux du dernier) → `normalizeInvoiceScan` → `finirUneLecture` → revue agrégée (pire statut, lecteurs min, phrases réunies),
  points de désaccord des morceaux décalés sur les rangs globaux. Rend le format habituel : l'écran ne change pas.
- Pur partagé : déplacer de `scripts/banc-lecture-bandes.ts` vers `functions/src/invoiceMorceaux.ts` (pur, sans import node) `inkRows`, `pickCut`,
  `planBands`, `inkedCuts`, `bandNote`, `pageNote`, `itemKey`, `dedupeOverlap`, `mergeDecoded` ; le banc les réimporte (une maison par fait).
- **Bande bornée en lignes** : `planBands` borne à 1,4 × la largeur ; une page serrée (75 lignes) tiendrait en une bande → trop pour 8 192 jetons
  (≈ 45 lignes). Ajout : hauteur max = min(1,4 × largeur, 25 × pas des lignes), le pas = médiane des débuts de séries encrées.

## Déclencheurs (jamais par défaut)
- Avant : PDF → pdf.js `getTextContent` par page, rangées de texte (y regroupés) ; plusieurs pages ou > 35 rangées sur une page → morceaux.
  Image (ou page) plus de 3 × plus haute que large → bandes.
- Après une lecture normale : point `lecture-coupee` (cause sortie), ou `printedLineCount` > lignes rendues de plus de 2 → relue en morceaux, sans geste.
- Rendu : pages à ~180 dpi (pdf.js scale 2,5), JPEG 0,85 ; bandes coupées sur rangées blanches, recouvrement 8 %.

## Étapes et preuves
1. `functions/src/invoiceMorceaux.ts` + bande bornée en lignes ; tests purs (plan sur bitmap fabriqué de 300 lignes : chaque bande ≤ 25 lignes, aucune coupe encrée).
2. Serveur : `morceau` validé (entiers, 1 ≤ k ≤ n ≤ 400) → note ajoutée, clé de cache = fichier + morceau ; tâche `assemblerLecture` ; tests (fetch simulé).
3. Plafond de 4 pages : un PDF lu en morceaux n'est jamais envoyé entier ; le refus « 4 pages » ne joue plus que si le client ne découpe pas (ancien client).
4. Client : `src/services/decoupe.ts` (pdf.js, canvas) ; orchestration dans `geminiScanner` (parallèle 4, puis assemblage) ; message d'attente « morceau i/n ».
5. Tests : orchestration (aiTask simulé) ; banc émulé si possible ; puis **en ligne** les deux pièces fictives (appels autorisés), lecture seule, rien enregistré :
   300 lignes → 300 lignes, total = somme ; 600 → 600. Vision : captures de l'écran à 390 et 1280, deux thèmes.
6. Build, `check-no-dev-auth`, drapeaux, déploiement aiTask + hosting, bundle servi vérifié.

## État
- 0bf5d540 : message vrai (« N ligne(s) imprimée(s) non lue(s) »), test D380 rouge sur ddc6539a. Non déployé.
- En ligne : ddc6539a (index-BeOzPTDF.js, aiTask à jour) avec D378, D379.
7. **Sa demande** : « repasse toutes les pièces, en plus de tes test. Tout doit passer et ça doit pas être beaucoup plus lent » → après déploiement, chacune
   de ses pièces réelles (manifeste du banc, hors Git) relue dans l'app en ligne (lecture seule, feuilles fermées, aucun enregistrement), plus les deux
   fictives ; tableau pièce × (lignes, total, statut, durée avant → après). Une pièce normale garde le chemin d'aujourd'hui (seul l'examen local du fichier s'ajoute).
8. **Photo à fond sombre** (son ticket Bauhaus sur un tissu, 03.11) : `inkRows` prend le niveau le plus fréquent pour fond → le tissu ; le papier entier passe pour
   de l'encre, toute coupe est « forcée » à travers le texte. Avant le plan : trouver le papier (zone claire, colonnes et rangées), encre mesurée DANS le papier
   avec un fond local (ombre), pente légère tolérée. Test : photo fabriquée à fond sombre et ombre → rouge sur le code du banc, vert après. Ce ticket (17 articles)
   ne se découpe pas : ni coupé, ni court, ratio 1,33.

## Décisions mesurées (03.11, `MESURE-BANDES.md`)
- `BAND_MAX_LINES` 25 (≈ 20 lignes réelles, ≈ 50 % du plafond Flash-Lite ; 39 lignes = 93 %, trop juste). Bandes en parallèle, 5 à la fois côté app.
- Consigne de bande (`bandNote`) obligatoire : sans elle la 3.8 tranchait sur chaque bande (+26 s).
- Ordre de travail : (a) serveur `morceau` + `assemblerLecture` ; (b) app `decoupe.ts` (pdf.js, canvas, papier d'une photo) + orchestration ;
  (c) tests ; (d) build, déploiement ; (e) en ligne : 300, 600, puis toutes ses pièces (temps avant/après).
