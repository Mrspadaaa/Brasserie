# Frise de période partagée (PERIODE-PARTOUT, 21.11)

Code : worktree `port-carnet`, branche `claude/port-carnet-1711`, fichier `src/components/periode/FrisePeriode.tsx` (non commité au 21.11, voir REPRISE-PERIODE.md).
C'est la frise de Finances › Opérations (`src/ui/finance/operations/Frise.tsx`, geste frise B de `src/ui/geste`), réemployée telle quelle, branchée sur une `Periode` (`src/components/periode/periode.ts`).

## Interface

```ts
// avec son cadre .ops (couleurs et hauteur d'Opérations) ; lit elle-même les opérations (useDonneesFrise)
<FrisePeriode periode={p} onChoisir={(p: Periode) => …} transactions={transactions} className? maintenant? jourMax? />

// sans cadre, quand l'écran a déjà ses données de frise (ChoixPlage)
const frise = useDonneesFrise(transactions);           // DonneesPeriode
<FriseDePeriode periode={p} onChoisir={…} frise={frise} maintenant? jourMax? champs? />
```

- `periode` : `PeriodeEntree` (mois, trimestre, année, dates, tout). Mois : la frise montre le mois, sans plage ; « tout » : l'étendue réelle des opérations.
- `onChoisir` : reçoit toujours une `Periode` faite par `depuisJours(du, au)` (glisser, clavier ±1 j / Page ±7 j, Échap rend l'avant), ou le mois entier (« × mois entier »).
- `jourMax` : dernier jour atteignable (défaut : aujourd'hui + 366 j, comme Opérations).
- `champs` (FrisePeriode : toujours) : les deux champs date « du … au » d'Opérations, cachés au téléphone par `operations.css` (`.ops-champs`), visibles à l'ordinateur.
- DOM : `[data-frise-periode]` (cadre), `[data-testid=frise]`, deux `role=slider` « Début » / « Fin » (`aria-valuetext` = le jour).

## Pour le Calendrier

Monter `FrisePeriode` (ou `FriseDePeriode` dans un cadre `.ops` existant) avec la période de l'app et `onChangeGlobalTimeFilter` : la période posée vaut pour toute l'app et se relit après rechargement (`app_global_time_filter`).
