# Voie k7-enregistrer — sa pièce s'enregistre telle quelle, ses articles neufs dans la bonne catégorie

Auteur Sonnet. Mission 2026-10-31-ecran-depense. Plancher à enrichir. Source : le bout en bout du 01.11
(`voies/e-bout/RESULTAT.md`, KO (b) et constats de doc14). Aucun appel Gemini, aucun déploiement, aucun commit.

## Ses mots (SPEC, mot pour mot)
- « Fait bien à la fin les test d'intégration bout en bout. Et les tests sur la VRAI app avec les VRAIS donnés. Est-ce que le stock de
  met bien à jour ? Les factures aussi, tout suit ... » (D264)
- « SI il y aune nouvelle levure, nouveau fermenteur ou autre item un peu plus technique ou complexe ? » (D269)

## Défauts à corriger (chacun : test rouge d'abord sur HEAD, puis correction)
1. **Total arrondi refusé.** Ses lignes font 1 ct de plus que le total imprimé, multiple de 5 ct. D261b a levé la pastille, mais « Confirmer » refuse :
   « Le détail des lignes doit correspondre exactement au total TTC » (`src/services/purchaseEntry.ts:393`). Correction : quand l'écart
   suit la règle de `sumCheck` (`functions/src/invoiceControls.ts`, importée par le client : total multiple de 5 ct, égal à la somme
   arrondie à 5 ct, écart ≤ 2 ct), l'enregistrement ajoute une ligne « Arrondi à 5 centimes » au montant signé (`discount` si négatif,
   `other` si positif), sans stock. La comptabilité reste exacte (somme des lignes = total). Si la lecture porte déjà une ligne d'arrondi
   imprimée, rien n'est ajouté. Tout autre écart reste refusé, mot pour mot comme aujourd'hui. Aucun changement à l'écran Dépense ; la
   ligne se voit dans le détail de la transaction (Finances).
2. **Catégorie en anglais.** Les articles neufs de doc14 ont été rangés dans « Yeast » et « Grain » : `canonicalStockCategory`
   (`src/services/stockLineMatching.ts:43`) garde un mot inconnu tel quel, et l'écriture (`purchaseEntry.ts:353`,
   `purchasePrefill.ts:25`) l'écrit. Correction : synonymes anglais, allemands et français des familles (yeast, grain, grains, hop, hops,
   pellets, sugar, Zucker, Getreide, Malzextrakt…, sans recopier un nom de pièce) ; à l'écriture d'un article neuf, une catégorie lue
   hors de `STOCK_CATEGORIES` n'est jamais écrite : on prend la nature déduite (`inferNature`), puis le repli actuel par `kind`. La
   lecture des articles existants (initiale en capitale) ne change pas. Même mot anglais dans « Pour quoi ? » : la description proposée
   de sa pièce commence par « BRAU- UND RAUCHSHOP · yeast, matéri… » (capture `voies/e-emulateur/final5/D/390-03-doc14-confirmation-refusee.png`) ;
   trouver où elle se compose (`grep` dans `src/services/`) et la nourrir des catégories normalisées. Si la composition vit hors de ton
   périmètre, l'écrire dans le RESULTAT sans y toucher.
3. **Ligne 11 hors de sa famille.** Lue « grain », référence `MAG…`, elle tombe dans « autres » au lieu de Malt (`contexteDe`,
   `stockLineMatching.ts:320-328`). Diagnostiquer (catégorie lue, `kind`, préfixe) et corriger dans `stockLineMatching.ts` ;
   la catégorie « Grain » corrigée en 2 suffit peut-être. Ne pas toucher `src/ui/depense/` (voie p3c-bandes).

## Contrôles (copie isolée : `node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "<cmd>"`)
- `npx tsc --noEmit -p .` → 0 erreur.
- `npx vitest run tests/unit/depense/banc-k7 tests/unit/depense/banc-k6 tests/unit/stockLineMatching.test.ts tests/unit/purchaseEntry*.test.ts
  tests/integration/expenseSheet.test.tsx tests/integration/jus0Journey.test.tsx --maxWorkers=2` → tout vert (adapter le glob aux
  fichiers présents ; lister dans le RESULTAT ce qui a tourné).
- Témoin : les trois tests neufs échouent sur HEAD (copie de HEAD par `git show HEAD:<f>` vers `os.tmpdir()`), journal dans le RESULTAT.
- `grep` des lecteurs de `canonicalStockCategory` et de la validation (L17) : chacun reste juste ou est couvert par un test.

## Possède
`src/services/purchaseEntry.ts`, `src/services/purchasePrefill.ts`, `src/services/stockLineMatching.ts`, `tests/unit/depense/banc-k7/`
(neuf), `work/missions/2026-10-31-ecran-depense/voies/k7-enregistrer/`. Rien d'autre (`git status --short` dans le RESULTAT). Jamais
`.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/`, `firebase.json`, `.firebaserc`, `firestore.rules`,
`firestore.indexes.json`, `src/ui/depense/`. Pas de serveur de dev dans `C:/Users/mrspa/Documents/Brasserie`, aucune installation dans
`node_modules`. Aucune valeur de ses pièces dans le code, les tests ou le RESULTAT (pièce inventée de même forme :
`tests/unit/depense/banc-k6/piece.ts`). Plafond : 60 tours.

Retour en une ligne : `K7 OK — arrondi, catégorie, ligne 11 — <chemin du RESULTAT>` ou `K7 ECHEC — <raison>`.

## Ajout du 01.11, nuit (D271, ses mots)
« Langue utilisée pour les factures, allemand, anglais, français, italien. Ça traduits en français et fait le bon lien ». Les synonymes
et mots de famille couvrent les quatre langues ; la catégorie écrite et la bande affichée sont en français ; une ligne allemande ou
italienne se relie à l'article français existant de sa famille. Tests : un jeu par langue. La désignation imprimée ne se traduit pas (D261a).
