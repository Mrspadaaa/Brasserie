OK — stock limité au brassage, unité → 1 sans clavier, tuiles de quantité, pièce d'abord, 5 problèmes du jeu en ligne corrigés ; 3 033 tests verts

## Fichiers écrits
- `src/ui/depense/familles.ts` (`familleHorsBrassage`), `Ligne.tsx`, `Plateau.tsx` (`TuilesQuantite`), `calculPlateau.ts` (ordre des unités, `metUn`, `quantiteGardantMontant`), `finale.ts` (`quantiteImpliciteDuTicket`), `phrasePied.ts` (`sansMotsBruts`).
- `src/ui/finance/ExpenseSheet.tsx`, `controlesCroises.ts` (`chercherLignes` avec étiquette de groupe).
- Tests : `tests/integration/depenseS1.test.tsx` (11), `tests/integration/depenseS1ligne.test.tsx` (9), `tests/unit/depense/s1-regles.test.ts` (nouveau) ; `tests/unit/depense/pu4d/plateau.test.tsx` (ordre des unités : 5 assertions mises à jour, pas affaiblies).
- Voie : `banc/` (banc s1, cas `unite-vide`), `capturer-s1.mjs`, `captures/` (10 PNG, toutes ouvertes), `captures-console.txt`, `tests.txt`. Rien dans `functions/`, ni commit ni stash.

## Critères
- `npx tsc --noEmit -p .` : sortie vide.
- `tests.txt` (zone + `tests/integration/depense*`, finance, expenseSheet, geminiScanner) : 235 fichiers passés, **3 033 tests verts**, 4 ignorés, zéro rouge. Chaque point a un test vu rouge avant la correction (lancé avant : 8 rouges sur depenseS1, 6 sur depenseS1ligne, dont « 0/5 », « 0/29 » et « TaxeSansTVA » reproduits à l'identique).
- Captures 390 tactile, clair et cave (console `captures-console.txt`, mesures prises dans la page) :
  - BAUHAUS (30 lignes, déplié) : **0 ligne avec icône de stock** ; houblon du banc `unite-vide` : icône présente ; outil et service : absente.
  - Unité « pièce » touchée sur une quantité vide : quantité « 1 » × prix « 8,90 » = « 8,90 », focus sur `BODY` (aucun champ focalisé), tuiles « 1* 2 3 5 10 » sans rouge.
  - Tuile 5 : « 5 » × « 1,78 » = « 8,90 » (le montant imprimé reste), clavier fermé.

## Ce qui a changé
1. **Stock limité au brassage.** Les lignes en Rénovation et en Services n'ont plus d'icône de stock (`Ligne.tsx` ; `familleHorsBrassage`). Matériel de brassage et « Autres » (appartenance inconnue) gardent l'icône, comportement actuel. Côté création et lien : la règle existait déjà pour une ligne lue (D306, D328c : Rénovation → `stockAction: 'none'`, jamais « nouvel article ») ; un article déjà au stock du même nom reste relié (D328c, acquis). Seule l'icône « aucun mouvement de stock » grise restait : c'est elle qui était sur ses outils.
2. **Unité → 1.** Toucher une unité sur une quantité vide y met 1, le montant imprimé reste et le prix en découle (1 × prix = montant) ; une quantité saisie ne change pas ; B2 inchangée (le retour à l'unité quittée rend la ligne, y compris le « 1 » que l'unité avait mis). Aucun focus ni clavier : il ne s'ouvre qu'au toucher de la quantité.
3. **Tuiles.** Unité touchée → grandes tuiles de quantité (1, 2, 3, 5, 10 ; g : 1, 5, 10, 100, 500), même grille que les cases d'unité, sans cadre ni texte rouge, 1 allumé. Une tuile pose la quantité (5 : 5, pas 6) et garde le montant.
4. **Ordre.** pièce · g · Kg · L · sachet pour les cinq cases ; les segments par genre commencent par la pièce.
5. **Problèmes du jeu en ligne** (`../../critique/VERDICT-EN-LIGNE.md`) :
   - n° 1 « 0/5 » : le dénominateur du contrôle serveur comptait les rabais ; il ne les compte plus. À 1 pièce le prix unitaire est le montant : la ligne se vérifie sans prix imprimé.
   - n° 2 « TaxeSansTVA - 0% » : la traduction des noms n'est plus appelée pour un rabais et son nom traduit est ignoré à l'écran ; « Rabais ».
   - n° 3 BAUHAUS « 0/29 » : cause trouvée. Sur un ticket de magasin, le serveur rend `quantity` null et `price` = `amountTTC` (`montantDeLigne`, `invoiceScanCore.ts` : « null ou 1 → price ») ; le client laissait la quantité vide, donc rien de vérifiable. Le banc d2 posait 1 partout, d'où 23/23. Correction côté client : quantité 1 quand le prix lu égale le montant au centime, sinon inconnue (test avec 2 × 2,60 = 5,20 : reste vide). Test à la forme réelle du serveur : 29/29, « 1 » dans la fiche.
   - n° 4 « peinture » : la recherche lit aussi le groupe et le sous-groupe de la ligne (« Rénovation Peinture et sols ») ; un test avec un nom abîmé par l'OCR trouve tout le sous-groupe.
   - n° 5 « other » : `sansMotsBruts` met en français les mots de nature entre parenthèses du message (« other / equipment » → « autre / matériel »).

## Essais, doutes, limites
- Essais : 1 par critère (aucun deuxième essai de fond), un détour pour les captures (sélecteur `input` alors que le champ est un `textarea` en Chrome).
- Le n° 3 est jugé sur la forme que le code serveur produit, pas sur un appel Gemini réel (interdit) : à confirmer en ligne sur BAUHAUS (L28). Si le serveur rend aussi un prix nul, la quantité reste vide (inconnu, jamais 0).
- n° 1 : « une lecture qui concorde avec le total ne se fait pas barrer » (fusion de la 3e lecture, serveur et fusion `finale.ts`) n'est pas traité ici : le VOIE demandait la règle du dénominateur, rabais hors compte ; la fusion serait une autre voie.
- La quantité implicite 1 s'applique aussi à un ingrédient lu sans quantité avec prix = montant (même hypothèse que le serveur) ; réversible en une ligne dans `lignesDeLecture`.
- Les captures montrent le banc (`apercu`), pas l'app en ligne. Les cas rabais et désaccord de nature sont couverts par tests (jsdom), sans capture.
- Les captures 1280 ne sont pas demandées par la voie : non prises.

## Demande exécutant
aucune (captures déjà rejouées : 10 PNG ouvertes).

DÉCISION À PRENDRE : aucune bloquante. (Option : étendre « hors brassage » à « Autres » quand la dépense est de catégorie rénovation ; aujourd'hui « Autres » garde l'icône.)

CONNAISSANCE : un ticket de magasin rend `quantity` null et `price` = montant ; un banc qui pose quantité 1 sur chaque ligne masque le cas réel ; en Chrome le champ de nombre du plateau est un `textarea` (les sélecteurs de test par `input` ne le trouvent pas).

LEÇON PROPOSÉE : un banc de lecture se bâtit à la forme brute du serveur (null, vide), pas à la forme déjà nettoyée ; d2 avait posé 1 partout et « 23/23 » n'a jamais exercé le cas « 0/29 » du jeu en ligne (même cause que la leçon d3 sur l'origine « contrôle »).
