OK — f6b : 7 corrigés (dont LR2-3 de f6a), v3-7/v3-8 écartés, v3-6 en DEMANDE à f6a

Code : port-carnet, branche `claude/port-carnet-1711`. Test unique : `tests/unit/depense/f6b-tour3.test.tsx` (8 tests).

id | verdict | commit | test | rouge→vert | écran touché
---|---|---|---|---|---
LR1-9 | corrige | f568f3f00 | f6b-tour3 « LR1-9 » | `expected false to be true` (ligne 2 pas ouverte) → vert | oui
v3-1 | corrige | c9dca3ff7 | f6b-tour3 « v3-1 » | `… to match /lg:max-w-\[1220px\]/` → vert | oui
LR1-6 réserve | corrige | 8a422d3e9 | f6b-tour3 « LR1-6 » | `expected 'inconnu' not to be 'inconnu'` → vert | oui
v3-5 | corrige | 51e5393b8 | f6b-tour3 « v3-5 » | `expected ' Confirmer' to match /3e lecture en cours…/` → vert | oui
LR1-7 réserve | corrige | 452b7babc | f6b-tour3 « LR1-7 » | sur HEAD d'avant : `expected null not to be null` (aucune marque au champ) → vert | oui
v3-2 | corrige | ef46a6d87 | f6b-tour3 « v3-2 » | `expected 'font-semibold text-cave-50' to match /\bmin-w-0\b/` → vert | oui
v3-7 | ecarte (artefact du banc) | 1371ea336 (test seul) | f6b-tour3 « v3-7 et v3-8 » | pas de rouge possible : vert sur le code | non
v3-8 | ecarte (même cause) | 1371ea336 (test seul) | idem | idem | non
v3-6 | ouvert : DEMANDE à f6a | — | — | — | non
LR2-3 (DEMANDE f6a) | corrige (branchement) | aaf52d272 | f6b-tour3 « LR2-3 » | `'…2/2 · 2 désaccords…'` ≠ « 2 valeurs en désaccord » → vert | oui

Ce qui change :
- LR1-9 : « Voir le désaccord » vise les désaccords de lecture pesés et non TVA, ceux d'une ligne d'abord, puis l'en-tête : règlement → panneau, fournisseur → champ, devise ou total → total. Chaque toucher passe au suivant. Dans le plateau de la ligne, une rangée jaune `data-dp-desaccord-ligne` : « les lectures diffèrent · variante : « — » / « ROUGE 25cm » ».
- v3-1 : la colonne d'une lecture fait `lg:max-w-[1220px]` (420 + 16 + 760 + 24) ; la saisie à la main garde 760.
- LR1-6 réserve : pendant la 3e lecture, `niveaux.total` vaut « sur » si le total est lu ; un total absent reste rouge.
- v3-5 : texte du bouton « Lecture en cours… » puis « 3e lecture en cours… » ; aria inchangé.
- LR1-7 réserve : le prix écrit par le trio (`calcules = unitPrice`) porte `data-dp-prix-deduit`, le title « prix déduit : montant ÷ quantité, non imprimé », un texte jaune au champ et la marque déduit à la rangée. Aucun arrondi touché.
- v3-2 : en-tête de bande (Liste.tsx), nom et quantité `min-w-0 truncate` (texte entier en title, `py-px` pour la case « ? ») ; montant `shrink-0`.
- v3-7, v3-8 : le banc v3 visait des éléments d'un `<details>` fermé. Le test prouve que la ligne fermée cache « Retirer la ligne 3 » et « Quantité ligne 3 », qu'un toucher sur la rangée l'ouvre et que « supprimer » retire alors la ligne.

Preuves :
- `tests-rouge.txt` (rouges successifs) et `tests-vert.txt` ; tsc : 0 erreur.
- `tests-final.txt` (`tests/unit/depense tests/integration/expense`) : 2821 passés, 4 échecs, tous préexistants et hors f6b (déjà listés par f6a) :
  `integration/expenseSheet.test.tsx` « lit dès le choix du fichier… » (amount 555) et `lecture-d/serveur.test.ts` (3, empreinte de functions/).
- Les 6 échecs de `lecture-d/ecran.test.tsx` (« 1 corrigée » au lieu de 3) existaient sur ce37 sans f6b ; ils sont verts au rejeu final, après les commits de f6a.

DEMANDE à f6a (v3-6, `controlesCroises.ts`) : ajouter à l'entrée de `controlesCroises` un `retiresMain?: { n: number; cents: number }` (les lignes que le brasseur a retirées lui-même). Quand le manque égale exactement `retiresMain.cents`, le rang « somme » ne dit plus « 2,40 CHF manquants » ni « Ajouter la ligne manquante ». Il dit « 1 ligne retirée · 2,40 », en ambre, avec le geste « Remettre la ligne » (renvoi neuf `'remettre'`). Côté f6b, une fois ce commit fait : passer `retraits` (ExpenseSheet, `retirerLigne`) en `{n, cents}` et traiter `surRenvoi('remettre')` en rendant la dernière ligne retirée.

À capturer en vision (banc v3, `?dev-local`, 390 tactile et 1280, deux thèmes) :
- LR1-9 : doc2 à 390, toucher « Voir le désaccord ». La ligne Collerette s'ouvre en haut, rangée jaune « les lectures diffèrent · variante : « — » / « ROUGE 25cm » ». Au toucher suivant, Rimadyl, puis Combiclav, puis le panneau Règlement.
- v3-1 : reel-doc14 à 1280, cave : liste à environ 760 px, plus de barré sur 5 lignes ni de noms coupés.
- LR1-6 réserve : lecture lente à 390, pendant le fil : total sans tirets rouges.
- v3-5 : lecture lente à 390, pied pendant le fil : « Lecture en cours… », puis « 3e lecture en cours… ».
- LR1-7 réserve : medicament à 390, ligne 1 ouverte : vider le prix, taper la quantité 4. Le champ prix affiche 12,50 en jaune (title « prix déduit ») et la rangée le marque déduit.
- v3-2 : reel-doc25 à 1280 et 390, cave, bande Rénovation : le montant reste dans le cadre, le nom est tronqué si besoin.
- v3-7/v3-8 : banc 3 à 390 : toucher la rangée Gerstenflocken, défiler jusqu'à « supprimer », le toucher au doigt. S'il reste hors d'atteinte, le constat rouvre.
- LR2-3 : reel-doc25, bloc : « Lectures 3/3 · 7 valeurs en désaccord ».

CONNAISSANCE : un banc Chrome qui vise un bouton par aria-label doit d'abord ouvrir son `<details>`. Fermé, son contenu garde un rectangle périmé, `scrollIntoView` n'y fait rien et `elementFromPoint` rend l'élément du dessus (v3-7, v3-8).
LEÇON PROPOSÉE : aucune
