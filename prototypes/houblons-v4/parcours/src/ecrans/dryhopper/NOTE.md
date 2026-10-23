# Dryhopper — Quand ajouter Idaho 7 ?

Voie p4-dryhopper (mission 2026-10-23-maquette-parcours), 23.10. Écran jouable, en React dans le socle, calculé en
direct à chaque geste. Fichiers : `index.tsx` (écran), `frise.ts` (la frise en direct, la loupe, ★ parmi les crans calculés), `mesures.ts` (la vraie valeur du houblon en brouillon),
`fiche-sur-outil.tsx` (la fiche de p1 posée sur l'outil), `dryhopper.css` (classes `pq-dry-`), `jeu.mjs`.

## Base

**a1, passe 3** (`work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3/a1/`), c'est-à-dire y1b affiné :
« y1b est de mon point de vue semble meilleur » (20.10). Choix encore ouvert du brasseur (a1, b4, d8, e5, g1) : son
choix remplacera l'écran dans le même socle.

- Un seul facteur libre, le moment (D98). Le rail est sous le pouce : ébullition par 5′ (60′ → 0′), whirlpool, dry hop
  actif puis après fermentation, de 1 à 7 jours. Houblon, dose, levure et base sont sur la ligne de contexte.
- Premier écran de a1 : « Face à ta stout » ; 9 familles au style (barres l5b de `BarreStyle`) avec leur ruban le long
  du brassin ; l'amertume en figure (bande 50–70 IBU) avec son ruban ; la vraie valeur sourcée ; le pont Levure ; le
  dock (étapes, jours, profil floral, rail).

## Idées reprises

- De y1b : le geste « glisser le moment comme un curseur, par 5′ » ; « Face à ta stout » ; la jauge d'amertume ; le
  dock sous le pouce ; la loupe sous le doigt ; les sauts (pastilles d'étape et jours). Aucune graduation au repos
  (D47) : les crans n'apparaissent que doigt posé.
- De a1 passe 3 : les rubans par famille (greffe d8 / e1), l'amertume en ligne de figure (b4), la ligne « contre ★ »
  (b4), les pastilles d'étape soulignées en orangé quand c'est trop amer, les jours « sans gain » en pointillé, Pépins,
  Melon, Épicé repliés.
- x3b réduit : les jours de contact au bout de la frise.
- La loupe est une vraie loupe : le profil floral et les crans du rail s'écartent sous le doigt (distorsion de Sarkar et
  Brown centrée sur le cran touché, m = 6), et la bande du haut chiffre le floral des 5 crans voisins. Mesuré doigt
  posé, sur cinq positions : ×9,8 à ×41,8 entre l'écart sous le doigt et l'écart au loin (L12). Aucune transition sur
  le geste : une transition héritée de l'app faisait lire des positions en retard (×2,7 au contrôle, 23.10).
- Calcul en direct : la frise entière (28 crans) passe par `simulerMoment` → `simulerCas` à l'ouverture (30 `lireBiere`,
  40 ms) ; un cran neuf coûte 0,9 ms en médiane (1,6 ms au plus). Plus aucune grille.
- D95 corrigé : le rail lui-même (`role="slider"`, `data-role="reglage"`) fait bouger le simulé ; la vraie valeur
  (`data-nature="mesure"`) se tient sous la figure. `controle-simulation` : SIMULATION OK (rouge sur a1).
- L'appui long (et le survol long à l'ordinateur) sur Idaho 7 ouvre la fiche de la voie p1 (`src/ecrans/fiche`),
  posée sur l'outil : le brouillon et le moment restent ; le retour du téléphone la referme.

## Écarts

Aux nombres de a1, aux moments de sa grille (Idaho 7, 4 g/L, US-05, stout 16D) :

| moment | a1 | ici | cause |
|---|---|---|---|
| actif · 2 j | floral ~+22, résineux ~+14, agrumes ~+13, tropicaux ~+16 | identiques | même moteur |
| étapes | 60′ ~+2, WP ~+14, actif ~+22, après ~+23 | identiques | |
| 60′ / 10′ / WP | 162 / 97 / 75 IBU | 161 / 97 / 75 | arrondi |
| 20′ | floral ≈+11, ≈119 IBU | floral ≈+11, 121 IBU | l'IBU est calculée à la minute (`ibuPerGramAt`), a1 l'interpolait entre 30′ et 15′ |
| Noyau, Baies | ~+8, ~+21 | « ? » hachuré | ma bière avant n'est pas décrite pour elles : l'écart est inconnu, pas 0 (a1 le prenait pour 0) ; la barre montre le niveau après |
| Pomona en aperçu | ~+13 agrumes | ~+13 agrumes | |

- L'arôme reste « ≈ » interpolé entre deux crans calculés (60′, 10′, whirlpool) : le moteur ne le simule pas à 35′.
  L'IBU, elle, est calculée partout ; à cru, elle reste « ? » (non modélisée, jamais 0).
- Pas de contour « ce que la chaleur ou le CO₂ emporte » sur les barres : `BarreStyle` du socle est employée telle
  quelle ; les rubans montrent déjà la perte à chaud.
- Pas de courbe d'activité de la levure sur le dock : c'était un tracé illustratif, sans donnée.
- Le pont s'appelle « Puis la levure » (carte), suivi de l'aperçu de Pomona.
- La vraie valeur est toujours celle du houblon en brouillon, au moment qu'elle documente (L14, relevé par Comparer le 23.10 : le linalol d'Idaho 7 s'affichait avec Nelson Sauvin) : mesures en bière du moteur (`verifications()`), puis les comparatifs E01 à E10, ligne de la variété. Idaho 7 actif : linalol 38 µg/L (McCabe 2023, E03) ; Nelson Sauvin : linalol 70 µg/L (Feng 2015, E06) ; Galaxy : « ? pas de mesure ». `jeu.mjs` joue les trois.

Contrôles écartés, avec leur raison :
- **controle-moments** : lié aux cas figés du lot 15 (`data-cas`, `donnees/<cas>.json`) ; ici le moteur calcule en
  direct. Le rail est vérifié par `controle-acquis --outil=dryhopper` (geste, frise) et par `jeu.mjs` (loupe ×3 sous le
  doigt, aucune graduation au repos, chute de l'IBU et hausse du floral de 60′ au dry hop actif, rien ne bouge
  au-delà de 2 jours).
- **controle-rail** : « à adapter » (audit a1) ; même couverture que ci-dessus.
- **D96** (`controle-cumul-levure`) : hors Dryhopper par décision du 23.10 (un seul facteur libre, le moment) ; il se
  vérifie sur l'étape Levure (CUMUL OK).

## Pour l'app

- `index.tsx` → `src/ui/hops/HopTiming.tsx` ; route `{ view: 'hopTiming', recipeId, additionId }`.
- `frise.ts` → `src/ui/hops/hopTiming.ts`. Le calcul de la frise (28 crans, 40 ms à froid) ira dans un Web Worker ;
  le cran courant reste sur le fil principal (0,9 ms).
- `fiche-sur-outil.tsx` : à remplacer par un crochet commun `useHopSheet()` (Sheet posée sur la page ouverte) ; il
  relit ici la clé d'historique de `navigation.tsx`.
- À brancher : l'α du lot réel (Dexie), le stock réel, la persistance de « Ajouter à ma bière » (Dexie puis
  Firestore). Le type `Quand` et les minutes libres sont à créer dans `src/types/` (ARCHITECTURE.md).
- La vraie valeur (E03, McCabe 2023) vient de `comparatifs-dryhop.json` ; dans l'app, une table de mesures sourcées.
