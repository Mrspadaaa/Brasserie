# rpa1 · « Les étapes, au propre »

Chaleur : **froide**. Série rpa (r6a, les étapes, la référence, la cuve de x3b). Une idée : la bande des étapes de la
maquette du soir, refaite pour se lire d'un coup d'œil, sur r6a intacte.

## Greffes (`data-greffe`)
- `etapes` : trois lignes 60′ · 10′ · dry hop, une barre par houblon sur une échelle commune (0 à 1,5 cran de floral),
  le résineux gagné en trait fin dessous, ton Nugget en pointillé gris dans chaque barre, avec son nombre à gauche ;
  ★ au plus floral de l'étape qui reste dans ta 16D (règle de r6a). Toucher une ligne pose ce moment sur les rangées et
  le radar (le reste de l'écran suit).
- `hors-16d` : « lui seul » de flb5b dans chaque tête (citron vert ; orange +4 ; ◇ cannabis +4).
- Repris de la base du soir : ⇄ et × sous les têtes (D137, dessinés, pas joués en v0) ; Barres | Radar (le radar r2
  à un toucher, au moment posé) ; « ses mots » sous le premier écran, sans la phrase jugée inutile ; chimie, IBU et
  panel OSU repliés (D114).

## Ce qui tient
- r6a au premier plan : têtes (nom, α du lot ou des fiches, rôle en mot, familles, ~ dans / ~ hors, stock en icône),
  9 rangées de familles, « inconnus, pas zéro », Floral ↑ et Résineux ↓ chiffrés.
- Ce qu'on lit : Galaxy est le plus floral à 60′ et 10′ (~0,9 à 10′), Idaho 7 au dry hop (~1,3) ; ton Nugget fait
  autant que les trois à 10′ (~1) ; le résineux double entre 10′ et le dry hop.
- Vraies valeurs du moteur de la maquette jouable (`simulerCas`, tirées par vite-node le 24.10) ; IBU à cru écrit
  « ? non modélisé ».

## Ce qui casse ou reste douteux
- Le radar r2 n'est plus en tête (« À revoir, on va en parler ») : il passe derrière Barres | Radar. Écart voulu, pour
  donner la place aux étapes.
- 130 mots au premier écran (la base du soir : 114 ; r6a : 79) : MOTS sauté en v0 (`--sans=mots`), à resserrer en passe 2.
- Le stock est en orangé pour les trois : 60, 20 et 60 g, moins que les 80 g de 4 g/L × 20 L. À confirmer.
- Ton Nugget à 4 g/L aussi floral que les autres : c'est le moteur (géraniol, linalol de ses fiches) ; à confronter
  à ta connaissance du Nugget (L14).

## Contrôles (24.10, depuis la racine)
- `controle-commun --sans=mots` : COMMUN OK (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait,
  légende, parlant, brutes).
- `controle-comparer-etapes` (sur une copie en `comparer/etat.html`) : COMPARER-ETAPES OK (3 houblons + référence
  beermaverick-nugget, étapes b10 b60 dryPost), à 390 et 1280.
- `controle-pictos-trait` : TRAIT OK. `controle-panel` (série) : PANEL OK.
- `mots-premier-ecran --max=70 --modere` : 130 mots (sauté en v0).
- `controle-choix --ecran=comparer` : CHOIX ECHEC, l'inventaire de la maquette construite (53 éléments, 18 états) ;
  attendu pour une mini maquette v0 statique, à porter en passe 2.

Captures : `captures/rpa1.png`, `captures/rpa1-radar-10.png` (10′, radar), `captures/rpa1-fiche.png` (appui long).
Générateur : `os.tmpdir()/rpa/rpa1.mjs` et `kit.mjs` (hors dépôt).
