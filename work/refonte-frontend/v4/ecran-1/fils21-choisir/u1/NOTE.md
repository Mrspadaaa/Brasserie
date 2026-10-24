# u1 — Trois loupes : les mots, la main, le verre

**L'idée.** Le même papillon de 12 familles (Citra à gauche, Cascade à droite) vu par trois loupes : un geste fait glisser les barres des mots des fiches au nez sur houblon frotté, puis à ta stout après le dry hop.

## Pourquoi ça aide à comprendre et à choisir

- Le brasseur : « d'après nos outils ils sont assez similaires ». La page lui montre d'où vient cette ressemblance, puis où elle cesse.
  - Loupe 1, « Mots des fiches » : notre outil donne 75 % de ressemblance, avec un score « huiles » de 92 parce qu'il compare des **parts** d'huile. Source : pack, substitution calculée v1.
  - Loupe 2, « Houblon frotté » : le panel Yakima Chief sur houblon broyé. Les deux silhouettes sont presque superposées (agrumes 92 contre 85, tropical 78 contre 73). C'est mesuré, mais ce n'est pas en bière.
  - Loupe 3, « Dans le verre ~ » : le profil simulé du pilote (`profils-simules.json`), ta stout 16D après un dry hop de 1, 2, 4 ou 8 g/L.
    - Barre pleine : ce que change le dry hop. Bande pâle : toute la plage, jamais rognée, avec la valeur au-delà de 120. Pointillé : le haut de la bande 16D.
    - Contour rouge : la famille sort de la bande 16D à cause de ce dry hop.
- Sous le papillon, « Par gramme, Citra ÷ Cascade ≈ calculé » donne la cause en quatre lignes.
  - Chaque ligne est une bande log de 120 px au moins, avec ses bornes : huile ≈×1,5 (×0,38–6), linalol ≈×6,2 (×0,32–120), 4MMP ≈×6,5 (×2,6–15,8, base commune), farnésène ≈×0,095.
  - Les mots se ressemblent ; la quantité par gramme et les thiols, non.
- Vraies valeurs à côté du simulé :
  - panel OSU en bière, 4 g/L (Citra à l'extrême « intensité, agrumes, tropical ») ;
  - linalol de Citra mesuré en bière, 144 µg/L (E06) et 72–178 sur 5 bières (E01). Le simulé place son centre 2 à 5 fois plus haut, et la page le dit.
- Le geste se voit : 4 → 8 g/L fait passer Citra de 3 familles hors bande (agrumes, tropical, baies) à 5, et Cascade de 0 à 2.

## Ce qu'elle casse

- **Premier écran : 249 mots** comptés (`mots-premier-ecran.mjs`), au-dessus de la règle des 60 de DESIGN.md. Ce sont surtout les 12 noms de familles et les bornes des bandes ; le texte courant tient en deux phrases.
- La loupe « verre » mêle deux natures : la grille du pilote (familles 0–100) et ma chaîne (rapport au seuil, dans la feuille et les lignes « par gramme »). Elles sont marquées l'une `~ simulé`, l'autre `≈ calculé`, mais c'est deux moteurs sur un écran.
- Le cryo du stock (65 g) n'est pas simulé : la page montre la variété T-90 et le dit au plan 2.
- Galaxy n'a pas de profil YCH : sa colonne « Houblon frotté » est hachurée. La paire Galaxy · Idaho 7 n'a pas de score de notre outil.

## Données

`donnees.js` et `profils.js` sont générés par `outils/extraire.mjs` depuis :

- `composes-houblon.json`, `pack-fiches.json` ;
- `fils19-choix/donnees/*.json` ;
- `donnees/comparatifs-dryhop.json`, `donnees/profils-simules.json` ;
- les profils YCH relevés dans H §1.1 et §7.1 (sources H1, H2, H3).

Aucune valeur n'est écrite à la main dans la page.

## Captures (`captures/u1/`)

- `loupes-01-avant-mots` → `02-apres-main` → `03-apres-verre` → `04-apres-dose8` → `05-feuille-floral` (plan 3, avec la mesure E06 à côté du simulé) ;
- `galaxy-01-citra-galaxy-verre`, `galaxy-02-feuille-4mmp` (« au plus ×3,8, borne basse inconnue »).

## Contrôle d'honnêteté (controle-lisible.mjs, 19.10.2026)

```
u1 · 23 pictos · 14 mesurées · 4 simulées · 0 faute(s)
LISIBLE OK
```
