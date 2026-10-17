# Hops — functional specification

Status: draft for gate B, 18 October 2026 (mission #119, phase 6).
Language: English, ASD-STE100 style. Terms: [glossary.md](glossary.md).

## 1. Purpose

This specification tells what the Hops step of the recipe creator does. It
does not tell how the screen looks. The design comes from the prototype that
the brewer accepts at gate B.

The brewer's main request (C001, translated): "If I brew a stout, I want to
see all my hops, from the most suitable to the least suitable for my stout. I
want to compare 2, 3 or 4 of them easily, with data or simulations."

The second request (C002, translated): "On mobile, with one tap and no scroll,
I want to choose my hop and see what I have."

The first rule (C165, translated): "The screen must be usable, practical and
easy. It shows only the data that I need and that I want."

## 2. Sources

| Source | Content | Priority |
|---|---|---|
| `docs/besoins/corpus-demandes.md` | The words of the brewer, C001 to C165 | 1 |
| `docs/besoins/banque-de-questions.md` | 30 questions, Q01 to Q30, each with "shown by default" and "on request" | 2 |
| `docs/besoins/parcours-cles.md` | The 4 daily actions and the usability rules U1 to U7 | 2 |
| `docs/qualite/garde-fous.md` | The checks and the budgets | 3 |
| This document | Behaviour and data | 4 |

If two sources do not agree, the source with the higher priority applies.

## 3. Data

### 3.1 Data that the step reads

| Data | Fields | Origin today | Gap |
|---|---|---|---|
| Variety | id, name, aliases, origin, alpha range, beta range, oils, descriptors | `hopVarieties` (Firestore), packs in `src/data/` | Production has 12 varieties only; 3 have no alpha (#120). |
| Descriptors | words with a source | Beer Maverick text tags ("Tags documentaires : #…"), 300 of 318 varieties | Not a structured field. A parser must read them. |
| Style usage | variety, style family, typical or occasional, source | `src/data/hopStyleUsageBootstrap.json` | IPA only. No data for stout and for most styles. |
| Style direction | style family, wanted descriptors, unwanted descriptors, source | none | Must be created from a sourced style guide. |
| Stock item | name, quantity (g), alpha of the lot, form, link to a variety | `stockItems` (Firestore) | No link to a variety; alpha often only in the name (#120). |
| Recipe | volume, OG, boil time, style, additions | draft of the recipe creator | — |
| Addition | variety or stock item, timing, minutes, temperature, contact, dose (g) | recipe | Old free text `step` in some recipes (#120). |

### 3.2 Rules for unknown values

1. An unknown value stays unknown. The screen shows "unknown", never 0.
2. An addition with unknown alpha shows no IBU. It shows the reason and the
   action: "Alpha unknown: enter the alpha of the lot".
3. A ranking that has no style usage data says "Not documented for this
   style" in the reason of each rank.
4. A value from a range shows the range, for example "4.5–7 %".

## 4. Functions

### F1 — Rank my hops for the style of the recipe

Questions: Q01, Q03, Q21, Q23, Q24.

**Input**: style family of the recipe, timing of the next addition, stock
items, catalogue.

**Groups**: group 1 contains the hops in stock (quantity > 0 g). Group 2
contains the catalogue hops. Group 2 is shown on request only.

**Order inside a group** (first key first):

1. Style usage: typical, then occasional, then not documented.
2. Fit to the style direction: (descriptors in wanted families − descriptors in
   unwanted families) / (number of descriptors of the hop + 2). The "+ 2" stops a
   hop with 1 descriptor from getting a full score. The style direction comes
   from the BJCP 2021 guidelines (hop aroma and flavour of each style).
3. Fit to the role of the addition: for a boil addition of 30 minutes or more,
   higher alpha first. For other additions, key 2 only.
4. Name, in alphabetical order.

**Shown by default** (one line for each hop): rank, name, quantity in stock.
**On request** (one tap on the line information control): reason of the rank,
its source, alpha, descriptors.

**Constraints**:
- From the Hops step, the ranking is visible after 1 tap or less, at
  390 × 844 px.
- The first 5 hops of group 1 are visible without scroll, each with its
  quantity.
- No group 2 hop is shown above a group 1 hop.
- The ranking is shown 1 000 ms or less after the tap, with the processor
  slowed 4 times.
- The ranking works offline, with the local data.

**Check**: `scripts/check-hop-one-tap.mjs`, budget B3 of `scripts/check-hop-budget.mjs`.

### F2 — Compare 2 to 4 hops

Questions: Q02, Q16.

**Input**: 2 to 4 hops from the ranking, the recipe.

**Shown by default**: one column for each hop, side by side. Rows: rank, stock,
alpha, IBU for the same dose and timing in this recipe, 2 main descriptors.
A row with the same value in all columns is not shown. The screen tells how
many rows it does not show.

**On request**: all rows (origin, form, oils, all descriptors, sources).

**Touches**: 2 or 3 hops that the brewer selects: 3 taps or less. The first
4 hops of the ranking: 1 tap. 4 hops that the brewer selects one by one: 4 taps
(decision D15).

**Constraints**: 4 columns are legible at 390 px without horizontal scroll.
Each unknown value shows "unknown".

### F3 — Simulate the additions

Questions: Q15, Q17, Q20, Q25.

**IBU of one addition** (existing function `BrewingMath.hopIbu`,
`src/services/brewingMath.ts:96`):

- gravity factor = 1.65 × 0.000125^(OG − 1);
- time factor = (1 − e^(−0.04 × minutes)) / 4.15;
- boil: utilisation = gravity factor × time factor;
- first wort: utilisation = gravity factor × time factor (boil time) × 1.1;
- whirlpool: utilisation = gravity factor × time factor (contact) × 2^((T − 100) / 10);
- dry hop: 0 (the cold bitterness model is separate);
- IBU = dose (g) × 1 000 / volume (L) × alpha / 100 × utilisation.

**Total IBU**: sum of the additions. The dry hop bitterness is a range, with
its source (C019, C049).

**Aroma**: for each addition, the 2 main descriptors and their weight. The
weight depends on the timing: dry hop 1, whirlpool 0.8, boil 10 minutes or
less 0.5, boil 30 minutes or less 0.2, longer boil 0.05. The total aroma is the
sum of the weights for each descriptor. The screen calls it an estimate. If a
dose-response model exists for the variety (`functions/src/hopExtrapolationCore.ts`),
it replaces the estimate.

**Shown by default**: on each addition line, the IBU and 2 descriptors. Next to
the list, the total IBU, the target and the main aroma.
**On request**: ranges, base of each estimate, details for each addition.

**Constraints**: the result is shown 1 000 ms or less after a change of dose or
timing. The calculation is local. Units are never mixed: g, g/L and IBU each
have their own label.

### F4 — Replace a hop

Questions: Q05, Q06, Q18, Q30.

**Input**: one addition, the stock, the catalogue.

**Dose of the substitute**: for boil, first wort and whirlpool additions, the
dose keeps the IBU of the addition (same timing, alpha of the substitute). For
a dry hop, the dose keeps the mass. For a hop product, the manufacturer rule
applies (`src/domain/hopDecision/products.ts`). If no rule applies, the dose
is unknown and the screen says why.

**Order of the substitutes**:
1. In stock with enough quantity, then in stock with too little, then to buy.
2. Inside each group: similarity of descriptor families (shared families
   divided by all families of the two hops), then the F1 order.

**Shown by default**: 3 to 5 substitutes, each with dose, stock state, gained
descriptors and lost descriptors.
**On request**: all substitutes, details of the difference, a blend proposal,
supplier offers with a date.

**Touches**: "Replace" then one substitute: 2 taps. The brewer can undo.

**Gap**: no similarity data exists today (`src/domain/hopDecision/substitution.ts:26`,
"No aroma score"). The descriptor similarity above is the first version.

### F5 — Answer the questions of the bank

Each question of the bank has one place that answers it, or the text "Not
documented" with the missing data. Section 6 gives the table.

## 5. Usability rules

The rules U1 to U7 of `docs/besoins/parcours-cles.md` apply to each screen of
the step.

| Rule | Requirement | Check |
|---|---|---|
| U1 | The first visible item is the answer or the action. No paragraph of more than 1 line comes before it. | `scripts/check-hop-ux-rules.mjs` |
| U2 | Each item shown by default serves the current action and one question of the bank. All other items are on request, in the same place, after 1 tap. | review |
| U3 | Each action has one entry point from the step. | review |
| U4 | No internal term on the screen (V5.5, local folder, canonical, crucible, receipt…). | `scripts/check-hop-ux-rules.mjs` |
| U5 | Dark background and tokens of `DESIGN.md` everywhere. No light panel, no serif font. | `scripts/check-hop-ux-rules.mjs` |
| U6 | No floating button, sheet or keyboard covers a control or the value that the brewer reads. | `scripts/check-hop-ux-rules.mjs` |
| U7 | A reviewer who did not design the screen completes each daily action without help, in the time of the protocol. | `docs/qualite/protocole-revue-ux.md` |

Other constraints (from `DESIGN.md` and `PRODUCT.md`):
- Do not use `type="number"`. Use the protected text input of the app.
- Each touch target is 24 × 24 px or more, without overlap.
- Text contrast is 4.5:1 or more (3:1 for large text).
- Mobile first at 390 px. Check also at 1280 px.

## 6. Question coverage

"Answer" gives the function that answers the question. "Data gap" tells what
is missing for a full answer. "Not documented" means that the screen says so
and names the missing data.

| Question | Answer (F) | Shown by default | Data gap |
|---|---|---|---|
| Q01 Stout: my hops ranked, stock first | F1 | rank, name, quantity | style usage for stout |
| Q02 Compare 2 to 4 hops | F2 | columns, only the differences | — |
| Q03 One tap, no scroll | F1 | ranking at 0 or 1 tap | — |
| Q04 Stout bittered with Nugget: too resinous? | F2 + F3 | one sentence, 3 complements with dose | sourced descriptor intensity in roasted beers |
| Q05 Saaz replaced by Styrian Golding | F4 | gained, lost, dose for the same IBU | — |
| Q06 Hop not available: substitutes | F4 | 3 to 5 substitutes, stock first | similarity data (first version: descriptors) |
| Q07 High bitterness without pine or resin | F1 with excluded descriptors | hops that keep the bitterness, exclusions | descriptor filter |
| Q08 Tropical white beer with banana | F1 + F3 | 3 pairings with timing and dose | yeast ester data |
| Q09 Juicy lager, not bitter | F1 + F3 | 2 or 3 strategies with IBU | — |
| Q10 Pastry stout too sweet | F3 | the hop lever, the IBU to add, its limit | BU:GU target for the style |
| Q11 Floral Champagne beer, biotransformation | not documented | "Possible if…" and 2 actions | yeast beta-lyase data (unknown for 6 of 6 yeasts) |
| Q12 White beer: dry hop with 20 g less in the wort | F3 | before and after, IBU lost, dry hop dose | cold bitterness range |
| Q13 Hop and yeast for a NEIPA | F3 | 2 or 3 hop × timing options | trial data |
| Q14 Cryo and HyperBoost | F4 (product rules) | yes or no, converted dose | — |
| Q15 Total IBU, dry hop included | F3 | one number, dry hop range | — |
| Q16 Profile of one hop | F2 on request | profile at a glance, alpha | — |
| Q17 IBU and aroma of each addition | F3 | on each line | — |
| Q18 Replace X with Y at the same IBU | F4 | dose of Y on the line | — |
| Q19 Hop × timing × yeast: result | F3 | expected result in 1 line | trial data |
| Q20 Simulate all additions | F3 | total profile next to the list | — |
| Q21 Hops for any style | F1 | ranking for the style | style usage for all styles |
| Q22 Very bitter chocolate stout | F1 + F3 | 2 or 3 bittering hops with IBU | style usage for stout |
| Q23 Hops for an IPA | F1 | ranking for IPA, all catalogue on request | — |
| Q24 Enough stock for the dose? | F1 + F3 | quantity next to the dose, alert if missing | stock linked to variety (#120) |
| Q25 Addition at +30 instead of +60 | F3 | new IBU and the difference | — |
| Q26 Grassy taste: what now | not documented | 2 or 3 actions now, change for next batch | fault causes data |
| Q27 NOLO hops | not documented | 2 strategies | NOLO hop data |
| Q28 Sour with acidifying culture | not documented | yes or no, acceptable IBU | culture hop tolerance data |
| Q29 Homegrown hop without analysis | F3 with alpha unknown | start dose and what to observe | — |
| Q30 Where to buy in Switzerland | not documented | safest Swiss supplier, link | dated supplier offers |

## 7. Performance and memory

| Budget | Limit | Check |
|---|---|---|
| B1 JavaScript before the first screen | 350 kB gzip | `scripts/check-hop-budget.mjs --dist` |
| B2 JavaScript added when the Hops step opens | 150 kB gzip | `scripts/check-hop-budget.mjs --dist` |
| B3 Ranking visible after the tap, processor slowed 4 times | 1 000 ms | `scripts/check-hop-budget.mjs --adapter` |
| B4 JavaScript heap at the Hops step | 120 MB | `scripts/check-hop-budget.mjs --adapter` |
| Simulation result after a change | 1 000 ms | prototype check (phase 8) |

The step loads only the data of the varieties that it shows. Large packs load
on request (#121).

## 8. Production

The same check gives the same result on the QA bench with the production
snapshot and on the deployed app. The deployed app is checked read-only, after
each deployment, in the QA Chrome of the brewer (`scripts/hop-one-tap/production.mjs`).
A difference is a blocking defect.

## 9. Open points for gate B

1. Where the ranking lives: on the step (direction A, 0 tap) or in a sheet
   (direction B, 1 tap). The wireframes show both.
2. The source of style usage and of style direction, and its licence.
3. The first version of the substitute similarity (descriptors only).
