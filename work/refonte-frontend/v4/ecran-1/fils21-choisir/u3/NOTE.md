# u3 — Le chaudron : pourquoi 10′ et pas 60′

**L'idée.** Un granulé qu'on glisse sur la piste du brassin (60′ … 0′, whirlpool, dry hop actif, dry hop après), et quatre vases qui montrent ce qui reste dans la bière (myrcène, linalol, géraniol, 4MMP), sous la jauge d'amertume de la stout.

## Pourquoi ça aide à comprendre et à choisir

- Le brasseur : « Pourquoi à 10' pas à 60 ? Aussi ? ». La page répond en une phrase qui change avec le geste.
  - À 60′ : « Citra sert surtout à amérir : +25 IBU (ta stout ≈ 84,7, au-dessus de 70). Le 4MMP perd 91 %, le myrcène s'envole. »
  - À 10′ : « +9,1 IBU, et il reste au plus 63 % du linalol. La perte avant 60′ n'est pas mesurée. »
- Les vases montrent la **part publiée**, avec la plus grande honnêteté possible sur les bornes.
  - Une borne non mesurée se hachure, elle ne tombe jamais à zéro : linalol à l'ébullition « ≤ 63 % » ; 4MMP avant 60′ « 9–100 % », entre la perte de 60′ et aucune perte [H].
  - L'échelle monte à 120 %, car le géraniol peut dépasser 100 % en dry hop (H30, H31).
- Sous chaque vase, la quantité ≈ calculée dans ta bière pour la dose choisie. Une teneur inconnue s'écrit « ? teneur inconnue », jamais « 0 » (East Kent Goldings, Fuggle).
- « Et aussi à 60′ ? » pose un second granulé :
  - les vases se dédoublent (A, B) ;
  - l'amertume s'additionne sur la jauge 50–70 IBU du 16D ;
  - l'arôme simulé du pilote s'additionne avec saturation partagée.
- Le Nugget de 60′ de la recette donne déjà ≈ 60 IBU (calcul du pack, Tinseth vérifié sur ses valeurs). C'est la vraie raison de ne pas remettre du Citra à 60′ dans cette stout.
- Les houblons du style (East Kent Goldings, Fuggle, épuisés) sont dans la liste. La page montre ce qu'on sait d'eux et dit qu'ils ne sont pas simulés.

## Ce qu'elle casse

- **Premier écran : 238 mots** (règle des 60 dépassée) : graduations, vases et jauge.
- Le profil simulé n'existe qu'aux moments de la grille du pilote (60′, 10′, whirlpool, dry hop). Ailleurs, à 30′ par exemple, il affiche « pas simulé ici » au lieu d'interpoler.
- Les vases sont les mêmes pour tous les houblons (la part retrouvée dépend du composé, pas de la variété). Seule la ligne « ≈ dans ta bière » est propre au houblon.
- Le « cadre pointillé » du simulé est la plage de la bière entière (ta stout comprise), à côté d'une barre qui ne montre que l'ajout : la lecture demande la note.

## Captures (`captures/u3/`)

- `moment-01-avant-10min` → `02-apres-60min` (glissé de 10′ à 60′) → `03-apres-dryhop` → `04-apres-dryhop-plus-60` → `05-feuille-linalol` (tous les moments et leurs sources) ;
- `ekg-01-ekg-10min`.

## Contrôle d'honnêteté

```
u3 · 12 pictos · 5 mesurées · 9 simulées · 0 faute(s)
LISIBLE OK
```

Premier passage : un échec L2, le linalol écrit sans son picto dans la réponse. Corrigé.
