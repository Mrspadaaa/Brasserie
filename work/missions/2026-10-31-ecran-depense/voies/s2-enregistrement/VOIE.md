# Voie s2-enregistrement — la dépense enregistrée juste, et son justificatif prouvé

- Mission : 2026-10-31-ecran-depense
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (écriture d'une dépense, prix, Drive)
- Plafond : 110 tours ; 3 essais par critère
- Dépend de : diagnostics d1 et d2
- Décideur en cas de doute : pilote ; l'option prudente et réversible

## Objectif
Du brouillon lu à la dépense écrite, chaque champ est juste ou marqué : la date de paiement non imprimée n'est plus présentée comme lue,
le prix unitaire n'est plus jeté, la mouture compte dans le prix du malt, une même commande facturée deux fois est signalée. Le
justificatif garde un nom lisible, et sa preuve Drive (dossier, nom, taille, empreinte vérifiée, lien) remonte jusqu'à l'écran.

## Exigences communes
Lire et suivre `work/missions/2026-10-31-ecran-depense/voies/COMMUN.md`.

## Entrées (lire seulement ça)
- `work/missions/2026-10-31-ecran-depense/diagnostic/d1/DIAGNOSTIC.md` : lignes A7, A11, A12, S5, S7, S8 et § 4.
- `work/missions/2026-10-31-ecran-depense/diagnostic/d2/DIAGNOSTIC.md` : lignes DR1, DR4, DR5 et § 2.1.
- `src/services/purchaseEntry.ts`, `src/services/purchasePrefill.ts`, `src/services/financeDocuments.ts`, `src/services/driveFileStore.ts`,
  `src/domain/finance/brewBudget.ts:180-200`, leurs tests.

## Possède (seuls chemins où écrire, un par ligne)
- `src/services/purchaseEntry.ts`
- `src/services/purchasePrefill.ts`
- `src/services/financeDocuments.ts`
- `src/services/driveFileStore.ts`
- `src/domain/finance/brewBudget.ts` (`latestBrewPrices` et ce qui calcule le prix d'un article seulement)
- `src/domain/finance/types.ts` (trois champs facultatifs seulement : `paymentDateBasis`, `proofOriginalFileName`, `surchargeOfLineId` ; REVUE-PLAN Prêt n° 7)
- `tests/unit/purchaseEntry.test.ts`
- `tests/unit/purchasePrefill.test.ts`
- `tests/unit/financeDocuments.test.ts`
- `tests/integration/driveFileStore.test.ts`
- `tests/integration/financeDocumentPersistence.test.ts` (mock complété, l. 62 ; REVUE-PLAN Prêt n° 1)
- `tests/unit/depense/enregistrement/`
- `work/missions/2026-10-31-ecran-depense/voies/s2-enregistrement/`

## Défauts visés
- **A7** : une date de paiement non imprimée n'est plus recopiée de la date de facture comme si elle était lue : vide, ou « déduite » avec
  sa règle, au choix du plan, jamais présentée comme lue ;
- **A11** : le prix unitaire lu est gardé sur la ligne de la dépense (`unitPriceCents`, champ déjà au type) ;
- **A12** : « Pour quoi ? » proposé par le code (fournisseur, numéro, familles d'articles), plus la prose libre du modèle ; une valeur
  qu'il a tapée n'est jamais remplacée ;
- **S5** : une ligne de mouture (« Zuschlag Schrotung », même quantité et unité que le malt juste au-dessus) est rattachée à ce malt : son
  coût entre dans le prix du malt (Maris Otter 2,40 CHF/kg et non 2,30), elle ne crée pas d'article ;
- **S7** : le prix d'un article suit les lignes liées, mouture comprise ; aucun prix inventé pour une ligne sans lien ;
- **S8** : même fournisseur, même total, à peu de jours d'écart, un autre numéro : signalé avant l'enregistrement, sans le bloquer
  (le plan fixe l'écart de jours et dit pourquoi) ;
- **DR5** : le justificatif est nommé `AAAA-MM-JJ Fournisseur Numéro.ext` dans Drive ; le nom d'origine reste gardé ;
- **DR1** : l'enregistrement rend la preuve Drive (dossier `L'Affinée / Justificatifs / année`, nom, octets, empreinte vérifiée, lien
  `webViewLink`) à son appelant ; l'écran l'affichera au port (hors de cette voie) ;
- **DR4** (message seulement) : au-delà de 15 s, l'envoi qui continue se dit « en cours », pas comme une erreur ; un second clic ne
  retélécharge pas tout le fichier quand l'envoi a déjà été confirmé.

## Hors périmètre
L'appariement et l'identité d'un produit (voie s1) ; la création d'un article et sa catégorie (fiche d'un produit nouveau, plus tard) ;
l'envoi Drive anticipé pendant la relecture (avec l'écran) ; l'affichage ; tout Drive réel (essai réel plus tard, dans les accords).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt. Dans `--contient "a,b,c"`, les
virgules séparent des mots qui doivent tous être dans RESULTAT.md.
