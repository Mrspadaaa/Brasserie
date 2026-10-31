# Voie s1-stock — chaque ligne de facture reliée au bon article, ou à aucun

- Mission : 2026-10-31-ecran-depense
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (appariement ligne → article de stock)
- Plafond : 110 tours ; 3 essais par critère
- Dépend de : diagnostic d1 (§ 4)
- Décideur en cas de doute : pilote ; **mieux vaut aucune proposition qu'une fausse**

## Objectif
Rallumer la proposition d'article pour chaque ligne de facture, sans fausse proposition. Le 17.10 elle a été coupée (décision 117,
`work/finalisation-tickets-2026-10-08/decisions.md:128`) : « une proposition fausse fait entrer un faux stock » ; la chasse du relecteur
avait trouvé 18 fausses propositions sur 27 cas. Elle revient seulement si cette chasse, rejouée, n'en trouve plus aucune, et si les
causes du diagnostic sont corrigées. Une identité commune du produit (nom propre, α, récolte, poids du sachet, tirés du libellé) sert à
l'appariement et servira plus tard à la fiche d'un produit nouveau, sans doublon (ses mots : « Attention au mapping, on veut pas de
retrouver avec plein de fiche du même produit »).

## Exigences communes
Lire et suivre `work/missions/2026-10-31-ecran-depense/voies/COMMUN.md`.

## Entrées (lire seulement ça)
- `work/missions/2026-10-31-ecran-depense/diagnostic/d1/DIAGNOSTIC.md` : lignes S1 à S4, A8, A9, et § 4 ; `diagnostic/d1/mesures.ts` (stock simulé, sondes).
- La chasse du 17.10 : `work/finalisation-tickets-2026-10-08/ARB-M4/decision.md`, `ARB-M4/brief.md`, et ce qu'ils citent (les 27 cas,
  B-V3-4 nombre d'identité effacé, B-V3-5 homonymes entre catégories).
- `src/services/stockLineMatching.ts`, `tests/unit/stockLineMatching.test.ts`, `src/services/units.ts` (lecture seule),
  `src/ui/finance/ExpenseSheet.tsx:140-160` (l'appel).

## Possède (seuls chemins où écrire, un par ligne)
- `src/services/stockLineMatching.ts`
- `src/services/ingredientIdentity.ts` (nouveau : identité d'un produit tirée d'un libellé)
- `src/ui/finance/ExpenseSheet.tsx` (l'import l. 12, `attach` l. 148 à 155 et `lineStatus` vers l. 196 pour la marque « poids du sachet non confirmé » seulement ; rien d'autre de l'écran ; REVUE-PLAN Prêt n° 6)
- `tests/unit/stockLineMatching.test.ts`
- `tests/integration/jus0Journey.test.tsx` (les `it` qui affirment « aucune proposition », REVUE-PLAN Conception n° 9)
- `tests/unit/depense/stock/`
- `work/missions/2026-10-31-ecran-depense/voies/s1-stock/`

## Défauts visés
- **S2 (B-V3-4)** : « CARAMÜNCH® Typ 2 Kg » apparie « Caramünch Typ 2 », jamais « Typ 1 » ni « Typ 3 » ; un nombre d'identité n'est plus
  effacé comme conditionnement ;
- **B-V3-5** : deux articles homonymes de catégories différentes ne donnent aucune proposition (ou celle de la bonne catégorie si la
  nature de la ligne la tranche) ;
- **S3 et A9** : l'α et la récolte sortent de l'identité : « Target 11.3% » et « Target 11.8% » sont le même produit « Target » ; l'α est
  rendu à part (valeur et source « libellé ») ;
- **S4** : « Stk » et « sachet » sont des unités de pièce compatibles pour l'appariement ; le poids d'un sachet lu dans le libellé
  (« 11,5g ») est rendu à part, jamais converti en silence. `units.ts` ne change pas : l'équivalence vit dans l'appariement, ou le plan
  dit pourquoi elle ne le peut pas ;
- **A8** : le nom propre d'une ligne (sans « 1 Kg », unité, ®, ™), le libellé brut restant gardé ;
- **S1** : la garde `STOCK_LINE_PROPOSALS_ENABLED` se lève, et `ExpenseSheet` propose l'article à la lecture. Une proposition n'est qu'une
  proposition : rien n'entre en stock sans « Confirmer » ; un choix qu'il a fait sur une ligne n'est jamais remplacé.

## Contrôles qui comptent
- La chasse du 17.10 rejouée en test (les 27 cas, leurs attendus) : **0 fausse proposition**. Un cas sans proposition alors qu'un article
  existait se compte à part (« manquée ») : il est permis, une fausse ne l'est pas.
- Sa facture 372765 contre le stock simulé de d1 : les 9 lignes appariées aujourd'hui le restent ; Caramünch, Target, Galaxy et les
  levures s'apparient quand leur article existe ; Goldings et Hallertauer, absents, n'ont aucune proposition ; les lignes « Zuschlag
  Schrotung » aucune.

## Hors périmètre
L'enregistrement (prix, mouture, catégorie d'un article créé : voie s2 et fiche d'un produit nouveau) ; la création d'une fiche ; l'écran.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt. Dans `--contient "a,b,c"`, les
virgules séparent des mots qui doivent tous être dans RESULTAT.md.
