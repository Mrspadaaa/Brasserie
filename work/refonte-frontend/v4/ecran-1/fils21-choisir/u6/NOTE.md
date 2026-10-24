# u6 — Choisir à deux : la carte des accords

**L'idée.** Une carte où chaque houblon est une boîte qui couvre ses plages publiées par gramme : linalol en x, 4MMP ou géraniol en y. Au nez (panel YCH), Citra et Cascade se superposent ; en chimie, ils s'écartent. On choisit deux houblons, un curseur fait glisser leur mélange sur la carte, et la grille de paires du pilote dit ce que ça donne dans la stout.

## Pourquoi ça aide à comprendre et à choisir

- Le brasseur : « Comment choisir deux houblons ? ».
  - La carte transforme la question en géométrie : deux boîtes éloignées sont différentes, deux boîtes superposées se doublent.
  - Sur la vue géraniol, la règle de producteur (YCH, dite et non mesurée) est écrite dans le coin : un houblon riche en linalol avec un riche en géraniol, plutôt que deux riches en linalol.
- Le geste qui compte : passer de « Au nez (frotté) » à « Chimie : 4MMP ».
  - La réponse passe de « Citra et Cascade sont presque au même endroit » à « très différents en 4MMP (≈ ×6,5 par gramme) ».
  - C'est la réponse à « d'après nos outils ils sont assez similaires ».
- L'incertitude se voit : chaque boîte va du plus petit au plus grand publié. Une borne inconnue laisse la boîte ouverte en pointillé (« ↑ haut inconnu » pour Galaxy, « ↓ bas inconnu » pour Idaho 7).
- Les houblons sans valeur (Nelson Sauvin, Motueka, Nugget : classe Hopsteiner seulement ; East Kent Goldings : 4MMP non mesuré ; Fuggle : linalol non relevé) restent dans une rangée « Hors carte », avec leur raison. Ils ne sont jamais posés à zéro.
- « Ensemble dans ta stout » : la grille de paires du pilote (2 + 2 g/L, 3 j, après fermentation), Citra seul, l'autre seul, puis ensemble.
  - On y lit « ensemble ≠ somme » : agrumes 76 %, tropical 81 %, floral 82 % de la somme des deux seuls.
  - On y lit aussi le résineux qui monte. Le brasseur trouve déjà sa stout « trop résineuse ».

## Ce qu'elle casse

- **Premier écran : 219 mots** (règle des 60 dépassée) : axes et étiquettes.
- Les boîtes sont des enveloppes de sources, pas des intervalles de confiance. Une grande boîte (Idaho 7) a l'air « grosse » alors qu'elle est seulement mal connue. La note le dit ; le dessin peut tromper un œil pressé.
- Le passage du nez à la chimie n'est pas animé (des points deviennent des boîtes). L'effet est immédiat mais c'est un saut, pas un glissement.
- Le mélange est un calcul linéaire par gramme, pas une perception. Avec une borne inconnue, il reste un point ouvert, sans boîte.
- La vue « Au nez » ne connaît que 3 houblons (Citra, Cascade, Idaho 7) : YCH ne distribue pas Galaxy.

## Captures (`captures/u6/`)

`carte-01-avant-au-nez-citra-cascade` → `02-apres-chimie-4mmp` → `03-apres-citra-idaho7` (toucher Idaho 7) → `04-apres-chimie-geraniol`.

## Contrôle d'honnêteté

```
u6 · 8 pictos · 3 mesurées · 13 simulées · 0 faute(s)
LISIBLE OK
```

Premier passage : un échec L2 (4MMP et géraniol sans picto dans les segments et la réponse). Corrigé.
