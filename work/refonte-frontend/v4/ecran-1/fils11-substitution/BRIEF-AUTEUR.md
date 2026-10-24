# Lot 11 · Les écrans de substitution de houblons, en fils de fer (brief auteur, une page)

Fils de fer statiques, 20 min par variante, puis tu livres ce que tu as. Écris en français.
Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash. Pas de git.

## Ce que le brasseur a dit (18.10, nuit)

« Et un système pour la substitution de houblons. Introduir ça. » Avant, sur Comparer : « lequel
je prends, ou lequel remplace le mien ? » ; Beer Maverick est le plancher (il a une liste de
substituts) ; « il faut des intervalles de confiance » ; « il manque […] la relation avec le
style ». Ordre de lecture d'un brasseur : α, rôle, arômes, moment, puis IBU ; le stock en icône.

## Les données (calculées cette nuit, rien d'autre)

`prototypes/houblons-v4/data/pack-fiches.json`, champ `substitutsCalcules` de chaque fiche, et
`meta.substitution` (la règle). Pour un houblon : `contexte` (amertume, arôme, défaut),
`reference` (dose, moment, IBU), `remplacants[]` avec `score` 0–100 et `palier` (très proche,
proche, partiel, éloigné), `composantes` (arôme, huiles, amertume ; `null` = inconnu),
`couverture` (`fiabilite` bonne, partielle, faible), `gagne` et `perd` par famille, `dose` (g,
min, max, règle « même IBU »), `stock` (état, libre, suffisant), `amertumeDeconseillee`,
`raison`. Le moteur est dans `prototypes/houblons-v4/src/engine/substitution.ts` (lis `RANKING`).

**Honnêteté, à dire sur l'écran** : ces remplaçants sont calculés depuis nos fiches, pas les
scores de Beer Maverick (non importés) ; le prix, la rareté et la cohumulone ne sont pas connus ;
une composante inconnue n'est pas un zéro (D65) ; un score se lit avec sa fiabilité.

## Ta variante (ton message te donne tes numéros)

- **u1 · Depuis la fiche** (Nugget) : la rubrique « Remplaçants » de la fiche, classés, avec score,
  palier, fiabilité, ce qu'on gagne et perd en arômes, la dose à IBU égal, le stock en icône.
- **u2 · Depuis la recette** : je touche « remplacer » sur la ligne Nugget 46 g à 60′ de ma stout ;
  les remplaçants à ce moment, stock d'abord, chacun avec sa dose et l'IBU de la recette qui reste
  à 60 ; Appliquer.
- **u3 · En rupture de stock** : Nugget est épuisé (0 g) ; l'écran répond d'abord « tu as de quoi
  le remplacer ? » avec mon stock, puis ce qu'il faudrait acheter.
- **u4 · Libre (chaud)** : ta meilleure idée (par exemple la comparaison directe Nugget face à ses
  deux premiers remplaçants, sur la grammaire de Comparer p3 choisie par le brasseur).

## Règles

Largeur 390 ; gris et une couleur par houblon comparé (Okabe et Ito : #0072B2, #009E73, #CC79A7,
#56B4E9), jamais l'orangé d'alerte ; nom du houblon sur chaque barre ; texte de 12 px au moins ;
90 mots au plus au premier écran ; une plage reste une plage ; un radar suit la base D3
(`ecran-1/fils7-radar/p04`) et D62, D65, D66.

## Livrable et contrôles

`fils11-substitution/<numéro>/vue.html` et `NOTE.md` (3 lignes : le parti, ce que ça apporte face
à la liste de Beer Maverick, ce qui manque).
1. `node work/refonte-frontend/v4/tournoi/outils/capture-page.mjs <num>/vue.html work/refonte-frontend/v4/ecran-1/fils11-substitution/captures/<num>-vue-390.png 1688` ; **regarde**.
2. `node work/refonte-frontend/v4/tournoi/outils/controle-fil6.mjs work/refonte-frontend/v4/ecran-1/fils11-substitution <num> --objet=libre` : `FIL6 OK`.
3. `node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils11-substitution <num> --max=90 --page=vue.html` : `MOTS OK`.
Réponse finale : une ligne par variante.
