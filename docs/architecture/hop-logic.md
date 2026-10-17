# Hop core logic — diagrams

Status: draft, 18 October 2026 (mission #119, phase 6). Terms:
[glossary](../specs/glossary.md). Behaviour: [hop specification](../specs/houblons.md).

## 1. Ranking of my hops for a style (F1)

```mermaid
flowchart TD
  A[Hops step opens] --> B[Read recipe: style family, next timing]
  B --> C[Read stock items with quantity above 0 g]
  C --> D{Stock item linked to a variety?}
  D -- yes --> E[Use variety data: alpha range, descriptors]
  D -- no --> F[Match by name; alpha of the lot if known; else unknown]
  E --> G[Group 1: hops in stock]
  F --> G
  B --> H[Read catalogue varieties]
  H --> I[Group 2: catalogue, on request]
  G --> J[Sort each group]
  I --> J
  J --> K{Style usage data for this style family?}
  K -- yes --> L[Key 1: typical, occasional, not documented]
  K -- no --> M[Key 1: not documented for all; label each reason]
  L --> N[Key 2: share of descriptors in the BJCP style direction]
  M --> N
  N --> O[Key 3: boil 30 min or more: higher alpha first]
  O --> P[Key 4: name]
  P --> Q[Show by default: rank, name, quantity]
  Q -.on request.-> R[Reason of the rank, source, alpha, descriptors]
```

## 2. Comparison and simulation (F2, F3)

```mermaid
flowchart TD
  A[Brewer selects 2 to 4 hops, or the first 4] --> B[For each hop: same dose and timing in this recipe]
  B --> C[BrewingMath.hopIbu: gravity factor x time factor x dose x alpha]
  C --> D[Build rows: rank, stock, alpha, IBU, 2 descriptors]
  D --> E{Same value in all columns?}
  E -- yes --> F[Hide the row; count it]
  E -- no --> G[Show the row]
  F --> H[Show: N identical rows hidden]
  G --> I[Columns side by side at 390 px]
  H --> I
  I -.on request.-> J[All rows: origin, form, oils, sources]

  K[Brewer changes dose or timing of an addition] --> L[Recalculate the addition IBU locally]
  L --> M[Sum the additions: total IBU; dry hop as a range]
  K --> N[Aroma weight: dry hop 1, whirlpool 0.8, boil 10 min or less 0.5, boil 30 min or less 0.2, longer 0.05]
  N --> O{Dose-response model for this variety?}
  O -- yes --> P[hopExtrapolationCore: modelled profile]
  O -- no --> Q[Descriptor estimate, labelled as an estimate]
  M --> R[Show on the line and in the total, 1 000 ms or less]
  P --> R
  Q --> R
```

### IBU of one addition (existing code)

`BrewingMath.hopIbu` in `src/services/brewingMath.ts`:

| Timing | Utilisation |
|---|---|
| boil, t minutes | G × (1 − e^(−0.04 t)) / 4.15 |
| first wort | G × (1 − e^(−0.04 × boil time)) / 4.15 × 1.1 |
| whirlpool, t minutes at T °C | G × (1 − e^(−0.04 t)) / 4.15 × 2^((T − 100) / 10) |
| dry hop | 0 (separate cold bitterness model) |

G = 1.65 × 0.000125^(OG − 1). IBU = dose (g) × 1 000 / volume (L) × alpha / 100 × utilisation.

## 3. Replacement (F4)

```mermaid
flowchart TD
  A[Brewer taps Replace on an addition] --> B[Read addition: hop, dose, timing]
  B --> C{Timing}
  C -- boil, first wort, whirlpool --> D[Dose that keeps the IBU, with the alpha of the substitute]
  C -- dry hop --> E[Same mass]
  C -- hop product --> F{Manufacturer rule for this form and use?}
  F -- yes --> G[Dose from the rule: a range]
  F -- no --> H[Dose unknown; show why]
  D --> I[Sort substitutes]
  E --> I
  G --> I
  H --> I
  I --> J[Group: enough stock, too little stock, to buy]
  J --> K[Inside each group: shared descriptor families, then ranking order]
  K --> L[Show 3 to 5: dose, stock state, gained, lost]
  L --> M[Brewer taps a substitute: addition replaced; undo available]
```
