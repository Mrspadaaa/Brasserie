# Lot 14 · Suggestions en Barres, mini maquettes sans retenue (#138)

Maquettes statiques, 20 min par variante, puis tu livres ce que tu as. Écris en français.
Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash. Pas de git.
N'écris que dans `work/refonte-frontend/v4/ecran-1/fils14-suggestions-barres/<ta variante>/` et
dans `fils14-suggestions-barres/captures/`.

## Ce que le brasseur a dit (19.10, soir)

« refait les mini maquette file de fer pour barre suggestion. Tu t'es trop limité, m'eme au niveau
des couleurs et tout... »

Avant, sur Suggestions, il a dit :
- « tout ce qui est suggestions et comparaison, c'est très mauvaise et de mon point de vu pas
  terminé » ;
- « C'est vraiment difficile à lire » (D60) ;
- pour le Radar : « p10, p5, p3 -> mais radar beaucoup plus grand ».

Les Barres sont encore à choisir. Les lots 5 et 6 imposaient du gris et un seul accent : **c'est
cette retenue qu'il refuse**.

## Liberté (c'est le sujet)

- **Couleurs** :
  - le code des familles d'arômes (couleurs des cases de la base, `.mini .c.f-*` dans
    `ecran-1/base/generateur/etape-consolide.css`) ;
  - une couleur par houblon, sur le code Okabe et Ito de Comparer ;
  - une couleur pour « atteint » ;
  - des fonds teintés, des dégradés ;
  - des icônes et pictogrammes dessinés en SVG.

  Une seule réserve : l'orangé d'alerte (`--acc` de la base) veut dire « ma bière est hors du
  style », et rien d'autre.
- **Formes** : ce que tu veux. Par exemple :
  - une jauge à puce (bullet chart) par objectif ;
  - des haltères avant → après ;
  - des barres divergentes autour de zéro ;
  - une cascade depuis ma bière jusqu'à la visée ;
  - un classement en échelle, des cartes, une trajectoire ;
  - le mélange de deux idées.
- **Hiérarchie** : de vraies tailles et graisses, de la place, du contraste. Un écran qui donne envie,
  pas un tableau de contrôle.
- **Références** : Beer Maverick est le plancher, jamais le plafond. Inspire-toi aussi des
  applications soignées de santé, de sport ou de finance pour les jauges, les cibles et les
  progressions.

Ce qui reste exigé, pour que ça serve un brasseur :
- La réponse est écrite d'abord, par objectif : atteint, approche, ou aucune voie houblon.
- Peu de texte : 70 mots au plus au premier écran. Il le redit souvent : « Attention, trop de
  texte ».
- Rien d'inventé : chaque chiffre vient du pack.
- Une valeur inconnue n'est jamais un zéro.
- Pense en brasseur : α, rôle, arômes et moment avant l'IBU. Le stock se dit par une icône.

## L'écran et ses données (S1, `prototypes/houblons-v4/data/pack-mini-protos.json`, `scenarios.S1`)

Ma bière : une stout export 16D, avec Nugget 46 g à 60′ (59,7 IBU). La dégustation dit « ma stout
est trop résineuses, je la veux plus floral ».

Les deux objectifs (`direction`) :
- **Plus floral**. Le floral est attendu par le style 16D, dans une bande de 0 à 55. Ma bière est à
  6,5 (modèle) ; la visée est 24,8 (+1 cran de 18,3).
- **Moins boisé et résineux**. Le résineux est neutre pour le 16D, bande de 0 à 30. Ma bière est
  perçue « marqué », de 66 à 100 (dégustation) ; la visée est 30, le haut de la bande.

Les voies (`voies`, classées par `rank`) :
- **1 à 5, ajouter 10 g à 10′** : Golding (à acheter), Motueka (stock), Aurum (à acheter), East
  Kent Goldings (à acheter), Columbus (à acheter).
  - Floral : +15,9 (établi), soit 6,5 → 22,4, dans le style mais sous la visée.
  - Résineux : non établi.
  - IBU : 61,5, 62,7, 61,4, 61,7, 65,5.
- **6 et 8, assemblages de 5 g + 5 g à 10′** : Motueka + Citra cryo (floral +15,9) ; Motueka +
  Nelson Sauvin (floral +7,9).
- **7, Citra cryo 10 g à 10′** : floral +15,9 ; IBU 68,7.
- **9 à 13, remplacer Nugget à IBU égal à 60′** : Motueka 74 g, Citra cryo 24 g, Nelson Sauvin 62 g,
  Galaxy 35 g, Hallertau Blanc 63 g. Résineux −2,6 (établi), floral entre +0,5 et −2,6.
- **14, diminuer Nugget à 38,5 g** : résineux −0,2, IBU 50.
- **15, voie levure** : Motueka 20 g en dry hop pendant la fermentation active, floral +27.

Pour le résineux, **aucune voie houblon ne ramène ma bière à 30** : au mieux −2,6 pour un écart de
plus de 36. Les pistes hors houblon sont dans `horsModele` (amertume dans le bas de la bande, malt…),
avec leurs sources.

Les échelles « T » et la tolérance au style sont dans `tolerance`. Lis aussi `voies[].effect`,
`voies[].ibu` et `voies[].actions`.

La base actuelle : `ecran-1/base/consolide/etat-b.html`, capture `captures/consolide-b-390.png`.
Regarde-la : c'est la version qu'il trouve trop retenue et trop dure à lire.

## Ta variante (ton message te donne tes numéros)

- **s1 · La base, en couleur** : la même grammaire que la base (réponse, voies cochables, matrice
  avant → après), mais avec les couleurs des familles et des houblons, une vraie hiérarchie, la matrice
  réduite aux deux objectifs, le reste à un toucher.
- **s2 · Une jauge par objectif** : la bande du style, ma bière, la visée, et chaque voie qui arrive en
  repère coloré au nom du houblon ; la réponse au-dessus.
- **s3 · Haltères avant → après** : une ligne par voie, un haltère par objectif, de la couleur du
  houblon ; l'écart écrit quand il est minuscule.
- **s4 · Cascade vers la visée** : de ma bière à la visée, les voies cochées s'empilent ; on voit ce qui
  manque.
- **s5 · Barres divergentes** : une ligne par voie ; à droite ce qui gagne (floral), à gauche ce qui
  baisse (résineux) ; le non établi hachuré.
- **s6 · Cartes de voies** : une carte par voie, sa pastille de houblon, sa dose, son moment, son
  effet en grand ; un bandeau-réponse coloré selon le verdict.
- **s7 · Libre (chaud)**.
- **s8 · Libre (chaud)**.
- **s9 · Libre (chaud)**.

## Livrable et contrôles

Dans `fils14-suggestions-barres/<numéro>/` : `etat-b.html` (largeur 390) et `NOTE.md` (3 lignes :
le parti, ce que ça apporte, ce qui manque). Pages autonomes : HTML et CSS en ligne, sans
bibliothèque externe obligatoire.

Convention, lue par `controle-fil6.mjs` :
- chaque objectif porte `data-role="objectif"` et `data-famille` (`floral`, `resin`) ;
- sa réponse porte `data-role="reponse"`, `data-famille` et `data-verdict` (`atteint`, `approche` ou
  `aucune`), en 13 px au moins, au premier écran ;
- une piste de 240 px au moins par objectif au premier écran porte `data-role="piste"` et
  `data-famille` ;
- un effet porte `data-role="effet"`, `data-famille`, `data-ecart-avant` et `data-ecart-apres` (en
  T), avec l'écart écrit s'il est minuscule ;
- chaque voie porte `data-voie`.

1. Capture :
   `node work/refonte-frontend/v4/tournoi/outils/capture-page.mjs work/refonte-frontend/v4/ecran-1/fils14-suggestions-barres/<num>/etat-b.html work/refonte-frontend/v4/ecran-1/fils14-suggestions-barres/captures/<num>-b-390.png 1688`

   **Regarde-la.**
2. `node work/refonte-frontend/v4/tournoi/outils/controle-fil6.mjs work/refonte-frontend/v4/ecran-1/fils14-suggestions-barres <num> --objet=suggestions --pages=etat-b.html` : `FIL6 OK`.
3. `node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils14-suggestions-barres <num> --max=70 --page=etat-b.html` : `MOTS OK`.

4. `node work/refonte-frontend/v4/tournoi/outils/controle-couleurs.mjs work/refonte-frontend/v4/ecran-1/fils14-suggestions-barres <num>` : `COULEURS OK`. Il demande au moins 3 teintes franches au premier écran, hors orangé d'alerte (D74). La base et le lot 6 y échouent, avec 0 teinte.

5. **Au style par défaut** (D75), parce qu'il l'a redemandé : « le "au style" donc normaliser au
   style les données semble être que ici ? C'est pas ce que j'avais demandé... ».
   - Une lentille porte deux boutons, `data-e="style"` (avec `aria-checked="true"` par défaut) et
     `data-e="absolu"`.
   - Les familles se lisent face à la zone du style, marquée `data-role="zone"`, comme dans Ma bière.
   - Contrôle : `node work/refonte-frontend/v4/tournoi/outils/controle-au-style.mjs work/refonte-frontend/v4/ecran-1/fils14-suggestions-barres <num> --pages=etat-b.html` : `AU-STYLE OK`.

Réponse finale : une ligne par variante (le parti, les quatre contrôles).
