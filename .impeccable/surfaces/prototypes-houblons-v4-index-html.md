---
version: 1
slug: "prototypes-houblons-v4-index-html"
primary_target: "prototypes/houblons-v4/index.html"
related_targets: []
---

## Scope and mode

Prototype houblons v4, isolated project `prototypes/houblons-v4/`. Mode: Operate. Full brief: `work/refonte-frontend/v4/brief-v4.md`. Method: `docs/qualite/methode-conception-frontend.md`.

## Audience and job

Gaëtan, solo brewer, designing a recipe on his phone or laptop. He wants to read his beer against the chosen style, push an aroma family ("plus floral, moins résineux"), get engine-proposed ways from his stock, compare 2-4, and set one into the recipe. He also wants a style overview of his hops where scales are relative to the style.

## Direction contract

THESIS: "Ta bière, lue au style." Every intensity is read against what the style expects. The sheet becomes a control desk: push a family, the engine answers with ways from the stock. The surface refuses the category default (a catalogue with an absolute radar) and the data dump.

OWN-WORLD: DESIGN.md cave charcoal. Each family is a track: the style's expected band as a cave-800 field, out-of-style zones hatched. "Ma bière" is a range marker in the recipe's EBC colour. The target is a hollow tick. Compared hops use the 4 CVD-checked colours plus 4 shapes. Source Sans 3 says, IBM Plex Mono tabular measures. Compact scale.

STORY: He opens his stout and sees where it sits, family by family. He pushes floral up and resin down. The list recomposes into ways with doses and stock, each ghosting its after-state on the sheet. He compares two, sets the best one, and can undo.

FIRST VIEWPORT: 390 x 844.
- 40 px bar: recipe, style, litres, OG, and an IBU gauge with the style band.
- "Au style" sheet: 8 to 10 rows of about 24 px. Each row has a family label, a full-width track zoomed to the style band, a range marker, a verdict word and a direction handle.
- "Mes houblons" below: at least 5 rows, each with its stock quantity, a style-scaled mini profile and a "+". The list becomes "Voies" once a direction is set.
- Lenses "Liste" and "Carte".
- The direction handle is the primary action.

FORM: tasting sheet read to style, number 6 of 7 on the ordered list, lead of the roll, seed key 36178972. It is fused with number 1 (map as an overview lens), number 7 (ranked stock list lens) and the dealt challenger's grammar: drag one axis and the whole grid morphs live.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Signature interaction

Drag the target of a row, or tap up or down on it. The list re-ranks live into ways, and each way ghosts its after-state on the sheet. On release, the target stays.

## Open decisions

The table that maps BJCP words to style bands, and the threshold for a noticeable gap, are hypotheses. They must be versioned, sourced, and labelled "à valider" on screen.
