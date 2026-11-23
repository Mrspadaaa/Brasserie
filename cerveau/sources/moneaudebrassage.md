---
name: moneaudebrassage
description: moneaudebrassage.fr est la référence visuelle que Gaëtan veut pour l'atelier de l'eau de L'Affinée — toile en secteurs, tout dérivé en direct.
type: sources
maj: 2026-10-22
sources: mémoire locale affinee-reference-eau.md
---

https://www.moneaudebrassage.fr/ : l'outil que Gaëtan cite comme modèle pour l'atelier de l'eau (demandé le 2026-09-04). Il accepte tout son état en paramètres d'URL, ce qui permet de rejouer un cas : `?departement=02&commune=ACHERY&beerstyle=02C - International Dark Lager&MgSO4=81.8&NaCl=38.5&disabledAdditives=["KCl"]`.

Repris, et pourquoi :
- **La toile en SECTEURS**, un quartier vert par ion du minimum au maximum du style, pas un polygone cible : on lit « dedans ou dehors », pas « colle à la ligne ».
- **Tout est dérivé en direct** : bouger le curseur SO₄ ⇄ Cl refait la pesée et déforme la toile ; toucher un sel met tout à jour. Aucun bouton de validation intermédiaire.
- **Deux feuilles, pas trois** : l'eau, puis les sels AVEC la toile au-dessus d'eux. La toile doit être visible au moment où l'on pèse.

Non repris : leur échelle radiale unique en ppm (0–250), qui fait sortir HCO₃ de la boîte dès 367 ppm. L'app gradue chaque axe sur LA FOURCHETTE DU STYLE visé : son maximum tombe aux 70 % du rayon (`STYLE_BAND_AT`), ce qui remplit le disque sur une bière normale et garde 30 % de marge pour un dépassement. Les six maxima fixes (`ION_SCALE`), taillés pour une West Coast, recroquevillaient toute bière normale dans le tiers central. Voir [[design-system-historique]] et [[chimie-eau]].

Corrections de Gaëtan sur la présentation (05.09.2026) :
- **Ne jamais coller un goût à un ion seul** : « houblon » sous le sulfate et « rondeur » sous le chlorure sur la toile ; il a répondu « c'est pas plutôt une combinaison qui donne ça ? ». Les coins portent la fourchette du style en ppm ; les faits ion par ion (seuil du sodium à 150, plancher du calcium à 40, magnésium amer au-delà de 30) sont dans `ION_ROLE`, affichés sur le sel touché.
- **Descendre sous les planchers du système de design quand la densité y gagne** : « tu peux faire une exception, si tout est plus petit c'est beaucoup mieux ». D'où la grille 3×3 des sels à 32 px de cible et 11 px d'étiquette. À ne pas généraliser aux écrans de saisie.
- **Le style cible se règle là où l'on pèse**, pas sur la feuille de l'eau.

Cibles chiffrées et toiles ailleurs (05.09.2026) :
- Une recette sur deux donne son eau en ppm, pas un style BJCP : `WaterState.customTarget` et `styleFromTargetIons()` transforment le point en fourchette ±20 %, plancher ±10 ppm, minimum jamais négatif ; elle prime sur `styleCode`.
- Le collage est lu EN LOCAL (`parseWaterTarget`), pas par l'IA : « mg/L » est une unité, pas du magnésium ; l'alcalinité en CaCO₃ se convertit (×1.22) en bicarbonate. L'IA d'import remplit `waterTarget` (schéma `importRecipe`, côté `functions/`) ; un ion absent reste ABSENT, car zéro serait une cible que le solveur viserait.
- Le plan FIGE `startIons` / `wortIons` / `targetIons` ; la fiche redessine sa toile depuis eux, sans revenir à l'analyse source. Un plan antérieur n'en porte pas : le récapitulatif retombe sur la grille de chiffres plutôt qu'une toile fausse.

Échelle de la toile, troisième version (05.09.2026) : Gaëtan : « les zones vertes semblent immenses… moneaudebrassage est toujours un peu mieux ». Leur axe radial est gradué 0 · 50 · 100 · 150 · 200, UNE échelle partagée par les six axes (JSCharting). Normaliser chaque axe sur son propre style donnait six quartiers identiques : le vert ne disait plus rien. Ce qu'on fait mieux : `radarScaleMax` monte au multiple de 50 qui contient tout, et rien ne sort du disque (leur 367 ppm de HCO₃ sortait du cercle).

Axe radial en RACINE (05.09.2026, suite) : sur une échelle linéaire 0–250, la fenêtre du magnésium (5 à 20 ppm) tenait entre 2.7 et 10.6 px de rayon. Racine carrée sur le rayon : magnésium 14 à 28 % du rayon, chlorure 72 à 94 %, anneaux portant leur ppm. La géométrie linéaire était exacte ; c'était l'échelle le problème.

Voir [[design-system-historique]] et [[chimie-eau]].
