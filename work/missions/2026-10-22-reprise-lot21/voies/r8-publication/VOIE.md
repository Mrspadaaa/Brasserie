# Voie r8-publication — la section « lot 22 » de la page des fils de fer

- Mission : 2026-10-22-reprise-lot21
- Agent : executant
- Modèle : haiku
- Niveau : mécanique
- Plafond : 40 tours ; 3 essais par critère
- Dépend de : r5-critique-carte, r6r-critique-lot22, r4cr-critique-picto
- Décideur en cas de doute : pilote

## Objectif
Écrire `faire-lot22.mjs` sur le modèle de `faire-lot21.mjs`. Il produit `lot22.json` au format
d'`ajouter-lot.mjs`. Ensuite, ajouter la section à la copie locale de la page (`site/index.html`). Le
pilote publie ensuite lui-même.

## Entrées
- `work/refonte-frontend/v4/outils/page-nuit/faire-lot21.mjs` — le modèle (chemins, vérification que chaque image existe, sortie).
- `work/refonte-frontend/v4/outils/page-nuit/ajouter-lot.mjs` — le format de `lot.json` et l'usage.
- `work/refonte-frontend/v4/outils/page-nuit/site/index.html` — la copie locale de la page (version 24).
- Captures :
  - `work/refonte-frontend/v4/ecran-1/fils22-carte/captures/` ;
  - `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/` ;
  - `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2/captures/`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/outils/page-nuit/faire-lot22.mjs`
- `work/refonte-frontend/v4/outils/page-nuit/lot22.json`
- `work/refonte-frontend/v4/outils/page-nuit/site/index.html` et `site/img/` (ajouts seulement)
- `work/missions/2026-10-22-reprise-lot21/voies/r8-publication/RESULTAT.md`

## Consignes
- `lot22.json` : `ticket: 119`, `ancre: "t119-lot22"`, `court: "lot 22 : Comparer, carte, épicé"`,
  `titre: "Lequel pour ma stout ? Comparer (12 variantes), la carte des outils et le picto épicé (lot 22, 22.10)"`,
  `etat: "à choisir : une variante, une carte, un picto"`.
- `puces`, mot pour mot, dans cet ordre :
  1. « Choisis trois choses en regardant : une variante de Comparer (★ = celles que le critique garde), la carte des outils, et le picto « épicé ». Un mélange est possible. »
  2. « Comparer pose une seule question : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? ». Seul le houblon change ; le reste est fixé sur la ligne de contexte. Les variantes portent tes choix ouverts : radar r2 (un houblon plein, les autres en contour) ou r3 (un radar par houblon) ; dose égale, effet égal ou IBU égal ; la porte « Je n'ai pas Nelson Sauvin » ; descripteurs A (groseille à maquereau dans les petits fruits) ou B (une part « autres » grise). »
  3. « Pour B, je propose : mots génériques écartés (fruité, noble, doux, sucré), seuil 25 %, plafond 33 %. À corriger par toi. »
  4. « Vu par le critique sur presque toutes : les bandes d'intervalle saturent les radars. Ce sera corrigé sur la variante que tu choisis. »
  5. « La carte : un écran par question, un seul réglage libre par écran (houblon, moment ou levure). Substituer et Levure sont montrés de deux façons, côte à côte. »
  6. « Picto « épicé », après « Aucun me convient... » : le piment, en trois dessins, et le mot « épicé » en repli. Réserve : le piment dit « piquant », ce n'est pas tout à fait l'épicé du houblon. »
  7. « Données : stout export 16D à 4,75 % vol. ; le simulé est marqué « ~ » ; l'α de Galaxy et celui de Nelson Sauvin sortent de leurs fiches (≠). »
- `images`, dans cet ordre (chemins absolus, légende mot pour mot ; C = `fils22-comparer/captures/`) :
  1. `fils22-carte/captures/carte-390.png` — « La carte des outils : Ma bière → Suggérer → Comparer → Dryhopper → Levure »
  2. C `r6l-premier-ecran.png` — « ★ r6l Des cartes à glisser · r2 · IBU égal · porte Nelson Sauvin · A »
  3. C `r6l-glisser-pendant.png` — « ★ r6l : la carte suit le doigt »
  4. C `r6j-premier-ecran.png` — « ★ r6j Les vraies valeurs d'abord · r2 · effet égal · B »
  5. C `r6i-premier-ecran.png` — « ★ r6i Remplacer Nelson Sauvin à effet égal · r3 · porte · A »
  6. C `r6m-premier-ecran.png` — « ★ r6m La phrase et le radar · r3 · IBU égal · B »
  7. C `r6b-premier-ecran.png` — « r6b Un radar par houblon · r3 · dose égale · B — réserve : les rayons roses »
  8. C `r6h-premier-ecran.png` — « r6h Je n'ai pas Nelson Sauvin · r2 · dose égale · porte · B — réserve : radar chargé »
  9. C `r6a-premier-ecran.png` — « r6a Trois colonnes · r2 · dose égale · A — rejeté pour le radar en tête ; les colonnes sont à garder »
  10. C `r6f-premier-ecran.png` — « r6f Même amertume · r2 · IBU égal · B — rejeté : radar muet, écran à moitié vide ; les cartes sont à garder »
  11. C `r6c-premier-ecran.png` — « r6c Le podium des agrumes — rejeté : Galaxy premier alors qu'il sort du style »
  12. C `r6d-premier-ecran.png` — « r6d Le même tropical — rejeté : la référence est Galaxy lui-même »
  13. C `r6g-premier-ecran.png` — « r6g Trois verres — rejeté : trois verres pareils, radars minuscules »
  14. C `r6k-premier-ecran.png` — « r6k Le panel d'abord — rejeté : la réponse est tout en bas »
  15. `fils22-picto-epice-2/captures/planche-390.png` — « Picto « épicé » : trois piments et le mot, à côté de la feuille et des brins ; en tête p1 « calice et crochet » »
  16. `fils22-picto-epice-2/captures/contexte-390.png` — « Les mêmes sur Columbus, Cascade et Saaz »
- Puis : `node work/refonte-frontend/v4/outils/page-nuit/ajouter-lot.mjs work/refonte-frontend/v4/outils/page-nuit/site/index.html work/refonte-frontend/v4/outils/page-nuit/lot22.json`. Lance-le **une seule fois** : chaque appel recopie les images sous de nouveaux numéros.
- Ne publie rien : le pilote publie.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Réponse finale au pilote : une ligne.
