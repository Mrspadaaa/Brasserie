# Glossary — French to English (controlled vocabulary)

The specifications and the architecture use these English terms only. Each
term has one meaning. The French column is the word of the brewer or of the
app. Phase 6 of mission #119, 18 October 2026.

## Brewing terms

| French | English | Meaning in this documentation |
|---|---|---|
| houblon | hop | A hop variety or a hop product that the brewer can add. |
| variété | variety | A named hop cultivar, for example Cascade. |
| produit (Cryo, HyperBoost…) | hop product | A processed form of a variety, with manufacturer rules. |
| forme (pellet, cône, cryo) | form | The physical form of a hop lot. |
| lot | lot | One purchased quantity of a hop, with its own analysis. |
| acides alpha, alpha | alpha acids | Percent of alpha acids by mass. The main input of bitterness. |
| huiles | oils | Hop essential oils, in mL per 100 g. |
| descripteur, tag | descriptor | A word for an aroma, for example resin or citrus. |
| profil aromatique | aroma profile | The set of descriptors of a hop and their intensities. |
| amertume | bitterness | The bitter taste. The app expresses it in IBU. |
| IBU | IBU | International Bitterness Units (mg/L of iso-alpha acids). |
| style | style | The beer style of a recipe, for example dry stout. |
| famille de style | style family | A group of styles that share hop uses, for example stout-porter. |
| usage par style | style usage | A documented use of a variety in a style family, with its source. |
| recette | recipe | The plan of a beer: malts, hops, yeast, water, steps. |
| brassin | batch | One production of a recipe. |
| moût | wort | The liquid before fermentation. |
| densité initiale | original gravity (OG) | The specific gravity of the wort before fermentation. |
| ajout | addition | One use of one hop in a recipe: dose, timing, conditions. |
| moment | timing | The step of an addition: first wort, boil, whirlpool, dry hop. |
| premier moût | first wort | Hops added before the boil starts. |
| ébullition | boil | Hops added during the boil, with minutes before the end. |
| whirlpool | whirlpool | Hops added after the boil, hot, with a contact time. |
| à cru | dry hop | Hops added cold, during or after fermentation. |
| dose | dose | The mass of hop for one addition, in grams. |
| levure | yeast | The yeast strain of the recipe. |
| biotransformation | biotransformation | The change of hop compounds by the yeast. |
| torréfié | roasted | The flavour of roasted malts, typical of a stout. |
| stock | stock | The quantity of a hop that the brewer has, in grams. |
| article de stock | stock item | One record of the stock, for example 60 g of Cascade. |
| remplaçant | substitute | A hop that can replace another hop in an addition. |
| fournisseur | supplier | A shop that sells hops. |

## App and quality terms

| French | English | Meaning in this documentation |
|---|---|---|
| brasseur | brewer | The user of the app. |
| étape Houblons | Hops step | The step of the recipe creator where the brewer sets the hops. |
| créateur de recette | recipe creator | The guided screen sequence that creates or edits a recipe. |
| brouillon | draft | A recipe that is not saved yet. |
| classement | ranking | The order of hops from the most suitable to the least suitable. |
| rang | rank | The position of a hop in the ranking. |
| comparer | compare | Show 2 to 4 hops side by side. |
| simuler | simulate | Calculate IBU and aroma for the current additions. |
| remplacer | replace | Change the hop of an addition and keep its IBU. |
| visible par défaut | shown by default | Shown without a tap. |
| à la demande | on request | Shown after one tap, in the same place. |
| non documenté | not documented | The app has no sourced data to answer. The screen says so. |
| toucher | tap | One touch on the screen. A scroll is not a tap but it is counted. |
| défiler | scroll | Move the content of the screen. |
| feuille | sheet | A panel that opens from the bottom of the screen. |
| hors ligne | offline | Without network access. |
| banque de questions | question bank | `docs/besoins/banque-de-questions.md`, questions Q01 to Q30. |
| corpus | corpus | `docs/besoins/corpus-demandes.md`, the words of the brewer, C001 to C165. |
| règle d'utilisabilité | usability rule | Rules U1 to U7 of `docs/besoins/parcours-cles.md`. |
| banc QA | QA bench | The real interface with isolated data (`tests/qa/hop-recipe`). |
| instantané de production | production snapshot | A read-only copy of production data, without personal data. |
| témoin négatif | negative control | A subject that a check must reject. The current app is one. |
| témoin positif | positive control | A subject that a check must accept. |
| garde-fou | guard | A check or a rule that stops a defect before it reaches the brewer. |
| porte | gate | A point where the brewer decides. Gate B: the brewer tries the prototype. |
| relecteur | reviewer | A person or a session that did not design the screen. |
