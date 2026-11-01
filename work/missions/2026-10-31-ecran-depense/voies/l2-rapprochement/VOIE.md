# Voie l2-rapprochement — le rapprochement des lectures, un statut juste, des points typés jusqu'au client

- Mission : 2026-10-31-ecran-depense
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (lecture d'une facture : argent, TVA, lignes ; coût des lectures Gemini)
- Plafond : 120 tours (dont 40 pour le plan) ; 3 essais par critère
- Dépend de : l1 + l1b, commitées (2c54ac66) : le contrat du point typé (`ScanPoint`, exporté par `functions/src/invoiceScanCore.ts` ;
  `voies/l1-lecture/PLAN.md` § 0 et § 2.1)
- Décideur en cas de doute : pilote ; l'option prudente et réversible

## Ses mots
« Surtout montrer les points où l'ia n'es pas sûr » ; « comme c'est de la facturation, c'est super important, ça doit être très fiable ! » ;
« avec la facture d'envoyer ça a pris vraiment longtemps 10s 20s sur téléphone ».

## Objectif
Aujourd'hui, sa facture 372765 affiche sept puces dont trois « Taux TVA » et deux « Numéro de facture », « Lecture à confirmer » presque
toujours, une valeur concurrente d'un désaccord est perdue, une troisième lecture payante part pour un mot (« Malz » au lieu de « Malt »)
ou une `stockCategory`, et le client jette les points typés que l1 a produits. Après l2, l'écran (voie de port, à venir) reçoit tout ce
qu'il faut pour montrer chaque doute à sa place :
- **A1** : un seul point par champ ; un désaccord de lectures prime sur la remarque libre du modèle ; une remarque libre ne compte que si
  elle porte un doute. Test : sur les 3 lectures simulées, au plus un avertissement par champ ;
- **A2** : le statut vient des contrôles du code et du désaccord entre lectures, pas du bavardage du modèle. Trois lectures concordantes et
  des chiffres recoupés donnent `checked`, même avec une remarque libre ;
- **U1** : chaque doute est typé : `{champ, ligne?, source: 'désaccord'|'contrôle'|'modèle', valeurs: […]}` (ou l'extension équivalente
  du `ScanPoint` de l1, que le plan tranche). Les valeurs concurrentes d'un désaccord sont gardées (`tvaAmount` 2,80 / 4,15 → les deux) ;
  la première lecture n'est plus retenue en silence ;
- **LE1** : la troisième lecture ne part que sur une vraie divergence : on compare les seuls champs qui comptent (nom, quantité, unité,
  montant, nature, référence) ; les lignes à libellé répété (cinq « Zuschlag Schrotung ») se rapprochent par ordre et montant ; un écart de
  `ligne-montant` ou de `somme-ecart` multiple de 5 centimes ne la déclenche pas ; `tva-incoherente` et `lignes-perdues` jamais. Test :
  deux lectures qui ne diffèrent que par `stockCategory` donnent `needsCorrection=false` ;
- **LE4** : une ligne de journal par lecture (`logger.info`) : durée, jetons, `finishReason`, coupée ou non. Une lecture coupée se dit
  telle quelle à l'écran (statut `unavailable` honnête), jamais comme une facture vérifiée ;
- **les relais de l1** (`voies/l1-lecture/RESULTAT.md`, « Hors périmètre », 1 à 4) :
  1. `geminiScanner.ts` et `ScannedInvoiceResult` passent `points`, `controls`, `vat`, `proForma`, `documentTypeRetenu`, `linesLost`,
     `rejets`, `vatCode`, `alphaPct` (champs facultatifs : un ancien résultat reste lisible) ; l'unité reste telle qu'imprimée ;
  2. `invoiceVisionReview.ts` vote ces champs ; `vat` et `linesLost` viennent de la lecture dont les lignes sont retenues ;
  3. `purchasePrefill.scannedPayment` lit `documentTypeRetenu` : la pro-forma payée lue « quote » donne « Déjà payé » ;
  4. une fonction pure côté client recalcule les points de ligne et de somme quand le brasseur corrige une valeur (quantité, prix,
     montant, total), au centime, avec les mêmes règles que le serveur (une seule source de règles si le plan le permet). L'écran
     l'appellera ; tu ne touches pas l'écran.

Le coût Gemini ne monte pas : `SCAN_MAX_CALLS = 3` reste le plafond ; le plan mesure, sur les lectures simulées, combien de troisièmes
lectures partent avant et après (elles doivent baisser).

## Exigences communes
Lire et suivre `work/missions/2026-10-31-ecran-depense/voies/COMMUN.md`. Deux temps :
1. tu écris `PLAN.md`, puis tu t'arrêtes et rends `PLAN PRÊT — <n> défauts` ;
2. le pilote fait relire le plan par deux regards neufs et te renvoie la revue triée ; ensuite tu codes.

Gemini n'est jamais appelé : lectures simulées seulement (`diagnostic/d1/lecture-simulee-372765.json`, la fixture de l1, et des fournisseurs
factices). Vérité : `diagnostic/d1/verite-facture-372765.json`.

## Possède
- `functions/src/invoiceVisionReview.ts` ;
- `functions/src/ai.ts`, pour le déclenchement de la troisième lecture et le journal par lecture seulement ;
- `functions/src/invoiceScanCore.ts`, pour étendre les types exportés seulement (aucune règle de contrôle de l1 changée sans le dire dans
  le plan) ;
- `src/services/geminiScanner.ts` et le type `ScannedInvoiceResult` ;
- `src/services/purchasePrefill.ts`, pour `scannedPayment` seulement ;
- un nouveau fichier client pour le recalcul des points (le plan dit où, hors `src/ui/`) ;
- `tests/unit/invoiceVisionReview.test.ts`, `tests/unit/invoiceScanCore.test.ts` (ajouts seulement), `tests/unit/purchasePrefill.test.ts`, `tests/unit/geminiScanner.test.ts`
  (ajouts seulement) ;
- `tests/unit/depense/rapprochement/` ;
- `work/missions/2026-10-31-ecran-depense/voies/l2-rapprochement/`.

Interdits :
- `src/ui/finance/ExpenseSheet.tsx`, `src/ui/finance/InvoiceScanReview.tsx`, `src/components/QuickActionModal.tsx` (lecture seulement : les
  champs ajoutés sont facultatifs et ne les cassent pas) ;
- `src/services/purchaseEntry.ts` (voie r2) ; `src/services/stockLineMatching.ts` ;
- `functions/.env` (ne pas le lire), aucun déploiement ;
- tout ce que COMMUN.md interdit.

## D'abord
Écris `COMPRIS.md` (Objectif, Écrit dans, Fini quand, Ne fait pas, Doutes), lance G1, lis `voies/l1-lecture/RESULTAT.md` et son PLAN, puis
écris le plan.

## Critères
`GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine. G2 attend la revue triée du pilote.

## Rendre
`RESULTAT.md`, écrit section par section, au format de COMMUN.md (ligne 1 `OK — …` ou `ECHEC — …`, « TEMOIN AVANT : … », un paragraphe
par défaut et son test, le nombre de troisièmes lectures avant et après, les fichiers écrits, « Rien ne se perd : … »,
`LEÇON PROPOSÉE : …`, `CONNAISSANCE : …`). Puis une ligne au pilote.
