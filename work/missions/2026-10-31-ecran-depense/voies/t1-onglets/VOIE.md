# Voie t1-onglets — Opérations, Synthèse et Prévisions disent les mêmes nombres

- Mission : 2026-10-31-ecran-depense
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (calculs des finances)
- Plafond : 90 tours ; 3 essais par critère
- Dépend de : diagnostic d2 (§ 2.3)
- Décideur en cas de doute : pilote ; l'option prudente et réversible

## Objectif
Ses mots : « Aussi sur les entrée, prévision et Tout c'est pas top. » Le diagnostic d2 a prouvé quatre nombres faux ou incohérents entre
vues (TA2, TA3, TA4, TA6). Les corriger dans le calcul, sans toucher à la forme des vues : l'interface des Finances (filtre Entrées /
Sorties, solde avec sa réserve) sera montrée en variantes et choisie par lui.

## Exigences communes
Lire et suivre `work/missions/2026-10-31-ecran-depense/voies/COMMUN.md`.

## Entrées (lire seulement ça)
- `work/missions/2026-10-31-ecran-depense/diagnostic/d2/DIAGNOSTIC.md` : lignes TA2 à TA4, TA6, § 2.3 ; `diagnostic/d2/mesure-onglets.ts`
  et sa sortie (sondes A à F).
- `src/domain/finance/ledger.ts`, `src/domain/finance/forecast.ts`, `src/ui/finance/TransactionJournal.tsx:180-260`,
  `tests/unit/finance.test.ts`, `tests/unit/financeForecast.test.ts`, `tests/unit/forecastHorizon.test.ts`.

## Possède (seuls chemins où écrire, un par ligne)
- `src/domain/finance/ledger.ts`
- `src/domain/finance/forecast.ts`
- `src/ui/finance/TransactionJournal.tsx` (le compteur des opérations seulement, TA2)
- `tests/unit/finance.test.ts`
- `tests/unit/financeForecast.test.ts`
- `tests/unit/forecastHorizon.test.ts`
- `tests/unit/depense/onglets/`
- `work/missions/2026-10-31-ecran-depense/voies/t1-onglets/`

## Défauts visés, avec la règle choisie par le pilote (réversible)
- **TA2** : dans « Tout », le compteur ne compte que les opérations actives, comme le total ; les annulées restent listées et se disent
  à part (« + N annulées ») ;
- **TA3** : une pièce à payer datée dans le futur compte dans « à payer » de la Synthèse, à son échéance, comme dans Prévisions : une
  seule règle pour les deux vues. La trésorerie, elle, ne compte toujours que les paiements faits ;
- **TA4** : une facture à payer ou une vente à encaisser sans échéance n'est plus placée aujourd'hui : elle sort du premier mois et va
  dans une ligne « échéance à préciser », comptée à part. Aucune échéance inventée (pas de +30 jours) ;
- **TA6** : la tendance « Dépenses courantes » ne projette que les catégories récurrentes (charges fixes) ; les achats de brassage
  irréguliers (malt, houblon, levure) ne deviennent pas une charge mensuelle.
Le plan nomme chaque appelant des fonctions changées (`grep`) et dit ce que chacun affiche après.

## Hors périmètre
TA1 (filtre Entrées / Sorties) et TA5 (solde avec sa réserve) : interface, en variantes ; les onglets eux-mêmes ; les prévisions saisies.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt. Dans `--contient "a,b,c"`, les
virgules séparent des mots qui doivent tous être dans RESULTAT.md.
