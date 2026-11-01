# Voie d1 — diagnostic : lecture de la facture, champs, lignes, liens au stock, incertitude

- Mission : 2026-10-31-ecran-depense
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Un diagnostic prouvé de ce qui rend la lecture d'une facture et ses liens au stock peu fiables, et la vérité de sa facture 372765 en fixture
pour le test qui fermera chaque défaut.

## Entrées
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, dernière ligne (« L'écran Nouvelle dépense ») : ses mots.
- `work/missions/2026-10-31-ecran-depense/brasseur/` : sa facture (`facture-br-372765.jpg`, page 1 visible ; la page 2 est coupée) et
  trois captures de l'app en ligne (avertissements, haut de la fiche, articles et stock).
- Le code : `src/ui/finance/ExpenseSheet.tsx`, `src/ui/finance/InvoiceScanReview.tsx`, ce qu'ils importent (types, services, domaine) ;
  `functions/src/invoiceScanCore.ts`, `functions/src/invoiceVisionReview.ts`, `functions/src/prompts.ts` (le prompt de lecture),
  `functions/src/ai.ts` (l'appel). Les tests existants : `tests/unit/financeInvoice.test.ts`, `financeDocuments*.test.ts` et voisins.
- `docs/finances.md`, `docs/finance-verification.md`, `docs/gemini-budget.md` § Vision des dépenses.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-10-31-ecran-depense/diagnostic/d1/`

## Consignes
Lire et mesurer, ne rien corriger dans `src/` ni `functions/`. Aucun appel Gemini réel, aucune écriture sur les données réelles, aucun
serveur dans `C:/Users/mrspa/Documents/Brasserie`, aucune installation. Tests : `npx vitest run <fichier> --maxWorkers=2`.

Répondre, chacune avec sa preuve (fichier:ligne, test rejoué, sortie) :
1. **Le chemin d'une lecture** : de la photo ou du PDF jusqu'aux champs du formulaire. Modèle, prompt, schéma de sortie ; ce que le code
   vérifie après l'IA ; les pages au-delà de la première sont-elles lues ?
2. **Les champs** : chaque champ de la fiche (total TTC, HT, TVA, numéro, type de document, date, payé et date de paiement, fournisseur,
   catégorie, « Pour quoi ? », et par ligne : nom, type d'achat, quantité, unité, montant) ; comment il est rempli ; ce qu'il donne sur sa
   facture, d'après ses captures ; lesquels sont faux ou mal formés. Exemples vus : « Total HT non spécifié » alors que la facture donne le
   montant par taux (N 8,1 %, R 2,6 %) ; trois avertissements « Taux TVA » et deux « Numéro de facture » qui se répètent ; « Brau- Und
   Rauchshop » ; « Maris Otter, Kg » garde l'unité dans le nom.
3. **La cohérence** : la somme des 23 lignes donne 86,50 CHF, le total. Le code le vérifie-t-il ? Et la TVA par taux, le total, les
   quantités fois les prix ? Ce qui doit être un contrôle déterministe du code, et non un avis de l'IA.
4. **Les liens au stock** : comment une ligne trouve son article de stock (algorithme, seuil, champs comparés) ; pourquoi Maris Otter
   reste sur « Aucun mouvement de stock » ; les lignes de service (« Zuschlag Schrotung », mouture) ; les unités (Kg, g, Stk : un sachet de
   levure de 11 g) ; l'α dans le nom (« Target 11.3% ») ; la création d'un article ; ce que fait « Confirmer et enregistrer » (mouvements,
   prix et coûts mis à jour) ; deux enregistrements de la même facture ; hors ligne.
5. **L'incertitude** : comment l'IA dit qu'elle doute (par champ, par ligne, en texte libre ?), et ce que l'écran en montre aujourd'hui.
   Ce que la donnée permettrait de montrer à la place du champ douteux.

Livrables, dans `diagnostic/d1/` :
- `DIAGNOSTIC.md` : un tableau des défauts (id, gravité : donnée fausse, donnée perdue, stock faux, lenteur, interface ; preuve ; état :
  fini, inachevé récupérable avec son manque précis, inutilisable ; correction proposée ; le test qui échouera avant la correction) ;
  puis les réponses 1 à 5.
- `verite-facture-372765.json` : la vérité de sa facture, transcrite depuis l'image (fournisseur, numéro, date, type, statut payé, lignes :
  code, libellé, quantité, unité, prix, montant, code TVA ; taux et bases ; total). Ni son nom ni son adresse. Ce que l'image ne montre pas
  (la page 2) vaut `null`, avec une note.
- `lecture-simulee-372765.json` : une sortie de l'IA plausible pour cette facture, au format exact que le code attend (d'après le schéma),
  reproduisant les défauts vus sur ses captures. Elle servira de réponse simulée de Gemini dans les tests de correction.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Un chiffre n'est jamais inventé : inconnu ≠ 0.
- Gemini jamais dans un test unitaire ni dans `npm test` : toujours simulé.
- Fini veut dire branché et atteint par un vrai parcours (L11) : classer l'existant fini, inachevé récupérable ou inutilisable.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Réponse finale au pilote : une ligne.
