# Voie n3-ht — une facture aux lignes hors taxe se confirme (D304, D317)

Agent : `auteur` (Sonnet). Plafond : 60 tours. Ligne `n3-ht` de MISSION.md. Aucun déploiement, aucun commit, **aucun appel réel à Gemini**
(réponses rejouées ou fabriquées). La voie e-ecran tourne en même temps : ne touche aucun de ses fichiers (`src/ui/**`).

## Ses mots (SPEC, 02.11, mot pour mot)
« On peut pas passer directement à l'intégration dans l'app » : pas de page de choix ; la forme ci-dessous est le défaut du pilote, codé
dans l'app, qu'il jugera dans l'app. « Attention au mapping, on veut pas de retrouver avec plein de fiche du même produit ».

## Le défaut (D304, constaté en ligne, lecture 17)
Une pièce dont les lignes sont imprimées HORS TAXE (somme des lignes = total HT, TVA ajoutée au pied) est lue juste et le serveur l'accepte
(`functions/src/invoiceControls.ts:175`, `sum: { statut: 'ok', base: 'HT' }`), mais « Confirmer » est refusé : « Le détail des lignes doit
correspondre exactement au total TTC. » (`src/services/purchaseEntry.ts:466`). Le client lit `controls.sum.base` (`geminiScanner.ts:94`)
sans s'en servir. Seule issue aujourd'hui : « Regrouper en une dépense », le détail perdu.

## La forme retenue (pilote, D317 ; réversible)
Quand `controls.sum.base === 'HT'`, devise CHF, et les totaux lus (`amountHT`, `amountTTC`) :
1. Les montants des lignes (`amountTTC` de chaque item, qui porte alors un HT) et leur prix unitaire (`price`) passent au TTC **au prorata**,
   dans `src/services/geminiScanner.ts`, au même endroit pour le provisoire du flux et le final (une seule fonction pure, dans
   `src/services/lignesHt.ts`, appelée sur le résultat assaini). L'écran n'a rien à changer : il reçoit des lignes TTC, comme pour une pièce
   ordinaire.
2. Par groupe de TVA quand c'est possible : une ligne dont le `vatCode` trouve sa rangée dans `vat[]` (base et montant lus) est ramenée
   avec sa rangée ; le groupe somme exactement base + montant de sa rangée. Sinon, un seul rapport `amountTTC / amountHT` pour toutes les
   lignes, qui somment alors exactement `amountTTC`.
3. Le reste en centimes va à la plus grande ligne du groupe. Jamais de ligne « TVA » ajoutée (une ligne sans produit, risque de fiche ;
   ses mots sur le mapping). Une remise (montant négatif) suit le même rapport.
4. Rien n'est inventé : sans `amountHT` ou sans `amountTTC`, ou si un montant de ligne manque, rien n'est converti (le cas d'aujourd'hui).
5. Une phrase courte dit ce qui a été fait, par le canal existant des indices de champ (`invoiceFieldHints`, `src/services/purchasePrefill.ts`),
   sur `amountTTC` : « Lignes imprimées hors taxe, passées au TTC. » ; elle ne remplace pas un indice plus grave déjà posé.
6. Les points du serveur gardent leurs valeurs lues (ce qui a été lu sur la pièce) ; ne les réécris pas. Signale dans RESULTAT si un point de
   ligne affiché à côté d'un montant converti peut prêter à confusion.

## Possède
`src/services/lignesHt.ts` (neuf), `src/services/geminiScanner.ts`, `src/services/purchasePrefill.ts`, `tests/unit/depense/n3-ht/**`,
`work/missions/2026-10-31-ecran-depense/voies/n3-ht/**`. Interdits : `functions/**`, `src/ui/**`, tout autre fichier.

## Critères (le pilote les rejoue)
1. Témoins écrits d'abord dans `tests/unit/depense/n3-ht/lignes-ht.test.ts`, rouges sur l'arbre d'avant (sortie gardée dans
   `voies/n3-ht/rouge.txt`), verts après : (a) un taux, trois lignes HT, somme convertie = TTC au centime ; (b) deux taux (2,6 % et 8,1 %)
   avec `vatCode` et `vat[]`, chaque groupe = base + montant de sa rangée ; (c) une remise ; (d) base TTC : rien ne change ; (e) `amountHT`
   absent : rien ne change ; (f) devise EUR : rien ne change ; (g) le brouillon construit comme `applyOutcome` le fait
   (`src/ui/finance/ExpenseSheet.tsx:335`, lu, pas modifié) passe `validatePurchase` sans l'erreur « total TTC » ; (h) le provisoire du flux
   et le final donnent les mêmes montants ; (i) l'indice de champ. Valeurs fabriquées, jamais celles d'une pièce du brasseur.
2. `tests/unit/geminiScanner.test.ts`, `tests/unit/depense/lecture-d/*.test.ts` et les tests qui importent `purchasePrefill`
   (`grep -rl "purchasePrefill" tests`) restent verts sans changer une attente.
3. Dans la copie isolée :
   `node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "npx vitest run tests/unit/depense/n3-ht tests/unit/geminiScanner.test.ts tests/unit/depense/lecture-d --maxWorkers=2"`
   (plus les fichiers du critère 2), puis `… copie.mjs "npx tsc --noEmit -p tsconfig.json"`. La copie est partagée avec la voie e-ecran : un
   échec dans un fichier qui n'est pas à toi se rejoue une fois, puis se dit sans le corriger.
4. Fréquence (D304, sans bloquer) : compte, dans les réponses réelles rejouées du dépôt (fichiers JSON sous `work/` et `tests/`), combien de
   pièces ont `sum.base` HT ; donne le nombre et les fichiers, sans aucune valeur de pièce.
5. `git status --short` : rien hors de « Possède ».

## Rendre
`voies/n3-ht/RESULTAT.md` (fichiers, témoins avant / après, sorties, fréquence, doutes ; `LEÇON PROPOSÉE : …`, `CONNAISSANCE : …`), puis une
ligne `N3-HT OK — …` ou `N3-HT ECHEC — …`.
