OK — lignes imprimées hors taxe passées au TTC au prorata dans normalizeResult ; Confirmer ne les refuse plus

## Fichiers écrits
- `src/services/lignesHt.ts` (neuf) : `lignesHtAuTtc(result)` pure, et la phrase `LIGNES_HT_PASSEES_AU_TTC`.
- `src/services/geminiScanner.ts` : import, champ `lignesPasseesAuTtc?` du résultat, appel à la fin de `normalizeResult` (donc provisoire du flux, final, cache : un seul endroit).
- `src/services/purchasePrefill.ts` : `invoiceFieldHints` pose la phrase sur `amountTTC` en dernier, avec `||=` (ne remplace aucun indice déjà posé, y compris « Vérification incomplète »).
- `tests/unit/depense/n3-ht/lignes-ht.test.ts` (19 témoins), `voies/n3-ht/rouge.txt`.
Aucun fichier de `src/ui/**` ni de `functions/**` touché.

## Règle codée (garde-fous, rien n'est inventé)
Conversion seulement si : `controls.sum.base === 'HT'` et statut `ok`, devise CHF, `amountHT` et `amountTTC` lus (TTC > HT > 0), chaque ligne a un montant, et la somme des lignes (en centimes) est EXACTEMENT `amountHT`. Sinon le résultat est rendu tel quel (cas d'avant). Conséquence : rejouer `normalizeResult` sur un résultat déjà converti ne convertit pas deux fois (la somme est alors le TTC).
- Par groupe : toute ligne a un `vatCode` qui trouve UNE rangée de `vat[]` (base et montant lus, base > 0), la somme des lignes du groupe égale la base de la rangée, et la somme des cibles (base + montant) égale `amountTTC`. Alors chaque groupe est ramené à base + montant de sa rangée. Au moindre manque : un seul rapport `amountTTC / amountHT` pour toutes les lignes.
- Prorata arrondi au centime (demi vers l'extérieur), le reste à la plus grande ligne du groupe. Remise : même rapport, reste négative. Aucune ligne « TVA » ajoutée.
- Prix unitaire : `price × nouveau montant / ancien montant`, à 4 décimales ; absent ou ligne à 0 : inchangé.

## Critères
1. Témoins : rouge sur l'arbre d'avant (`rouge.txt`) : 8 échecs / 19 (a ×3, b ×2, c, g « converties », i « phrase »). Les 11 autres (d, e ×4, f, rejeu, h, contre-témoin g, deux cas de i) passent aussi avant : ce sont des « rien ne change » par nature. Après : 19/19 verts. (g) le brouillon construit comme `applyOutcome` (montant de ligne = `amountTTC`, prix = `price`, total = `invoiceTotalProposal`) passe `validatePurchase` sans « total TTC » ; contre-témoin : mêmes lignes non converties, l'erreur est levée. Valeurs inventées (Atelier Fictif SA).
2. Copie isolée, vitest : `n3-ht`, `geminiScanner.test.ts`, `lecture-d`, `purchasePrefill.test.ts`, `banc-k6/tva-d262a`, `banc-k7/categorie`, `enregistrement/paiement-prix`, `lecture/*`, `rapprochement/points-uniques` : **19 fichiers, 284 tests verts**, aucune attente changée.
3. `copie.mjs "npx tsc --noEmit -p tsconfig.json"` : un seul message, `functions/src/models.ts(90,42) TS2550 Object.hasOwn` ; il est déjà sur HEAD (ce fichier n'est pas à moi, non corrigé). Au premier passage, deux erreurs `setPerduesTotal` dans `ExpenseSheet.tsx` (voie e-ecran, en cours) : disparues au rejeu. Rien dans mes fichiers.
4. Fréquence : dans les JSON de `work/` et `tests/`, 23 fichiers portent des `controls.sum` ; 1530 lectures : base TTC 994, base nulle 524, **base HT 12, dans 4 fichiers**, toutes `work/finalisation-tickets-2026-10-08/H13-reels/` : `banc-f5-F/results.json` (2), `banc-k5-A/results.json` (2), `banc-k5-B2/results.json` (2), `banc-k5-C/results.json` (6). Par empreinte (fournisseur, numéro, total, nombre de lignes) ces 12 lectures sont **une seule pièce** rejouée : donc 1 pièce HT connue sur le dépôt. Aucune valeur de pièce citée.
5. `git status --short` : les seuls fichiers modifiés par cette voie sont les sources ci-dessus et `tests/unit/depense/n3-ht/` ; `tests/unit/depense/lecture-d/finale.test.ts` et `tests/unit/hopIndexV4/fraisT3.test.ts` (non suivis) viennent d'autres voies.

## Essais
Un essai par critère. Seule correction : mes deux attentes de (a) recalculées à la main avant le vert (le reste de centime va à la plus grande ligne : 43,23 ; 37,84 ; 27,03), pas une attente existante.

## Doutes et limites
- **Points du serveur à côté d'un montant converti** (point 6) : ils gardent leurs valeurs lues, donc HT. Un point de ligne (`ligne-montant`, `ligne-prix-par-lot`, message « quantité × prix = X, montant lu Y ») cite des montants HT à côté d'une ligne qui affiche désormais le TTC : possible confusion. Cas rare (un point de ligne sur une pièce HT), mais réel ; je n'y ai pas touché. À juger par le pilote sur un rendu dans l'app. Le contrôle serveur `controls.sum` reste `HT` : l'écran, s'il le relit un jour, doit savoir que les lignes sont déjà TTC (`lignesPasseesAuTtc`).
- Le prix unitaire converti n'est généralement plus « exact en centimes » : `exactUnitPriceCents` ne le garde alors pas sur la dépense (comportement voulu de cette fonction, pas de prix inventé).
- Groupe par TVA : s'appuie sur le fait que `vatCode` et `vat[].code` sont du même alphabet (« A », « B »). Un code non concordant tombe dans le rapport unique, qui somme juste mais n'est pas exact par taux. Aucune pièce réelle à deux taux HT n'existe au dépôt : testé sur des valeurs inventées seulement.
- Pas de rendu Chrome : la voie ne touche aucun écran ; le parcours dans l'app (indice sous le total, lignes TTC) reste à jouer par le pilote.
- Aucun appel Gemini, aucun déploiement, aucun commit.

DÉCISION À PRENDRE : aucune bloquante. Option : si le point de ligne HT prête à confusion à l'écran, le masquer côté écran quand `lignesPasseesAuTtc` est vrai (voie e-ecran) plutôt que de réécrire les points ; recommandé de juger d'abord sur un vrai rendu.

CONNAISSANCE : `controls.sum.base === 'HT'` est rare au dépôt : 1 seule pièce distincte (rejouée 12 fois) sur 1530 lectures ; la condition « somme des lignes = HT lu, au centime » rend la conversion idempotente.
LEÇON PROPOSÉE : aucune
