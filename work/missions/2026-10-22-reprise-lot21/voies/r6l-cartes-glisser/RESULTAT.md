OK — Comparer « cartes à glisser » : candidat en grand, Nelson Sauvin cible fixe, IBU égal

## Fichiers écrits (tous dans « Possède »)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6l/generer.mjs` (générateur), `style.css`, `client.js`
  (geste et rendu), `etat.html` (généré), `NOTE.md`, `captures.mjs` (parcours joués au doigt).
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6l-*.png` : 390, premier-ecran, fiche-390,
  toucher-390, glisser-pendant, glisser-apres, chimie, valeurs, valeurs-cascade, osu, fiche-galaxy,
  absolu, legende, 1280-survol.
- `git status` : rien hors de ces chemins ; les fichiers modifiés avant la voie sont inchangés.

## Critères (rejoués depuis la racine après la dernière génération)
- G1 : `COMMUN OK` (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende,
  parlant, brutes). 1 essai.
- G2 : `r6l 77 mots` / `MOTS OK`. 3 essais (88, puis 89, puis 80 ; 77 après la marque « ~ simulé »).
  Ce qui a fait baisser le compte : le radar porte des pictos au bout des axes à la place des 12 mots,
  et le contexte s'écrit « 10 IBU · 10′ ».
- G3 : `UNE-QUESTION OK (1 groupe libre : houblon)`. 1 essai.
- G4 : `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)`. Le radar est au repos ; la chimie, l'OSU et les
  valeurs sont chacun à un toucher. 1 essai.
- G5 : `ALPHA OK` (4 houblons sur 4). 1 essai.
- G6 : `EXISTENT OK 7`. G7 : `NOTE OK`. G8 : voir ce fichier.

## Captures ouvertes et jugées
J'ai ouvert chacune en image.
- `r6l-premier-ecran.png` : la question, le rail, Idaho 7 en grand avec « Le plus proche de Nelson
  Sauvin », les barres de gain face aux losanges de la cible, puis le haut du radar.
- `r6l-390.png` : la page entière au repos.
- `r6l-glisser-pendant.png` et `r6l-glisser-apres.png` : Galaxy glissée au doigt sur la grande carte,
  avec le fantôme et l'entourage de dépôt. Ensuite, Galaxy est en grand, « 2e plus proche », et la
  barre Tropicaux passe de 29 % à 90 % de la piste.
- Balayage de la grande carte : Galaxy passe à Cascade (journal de `captures.mjs`).
- `r6l-fiche-390.png` : appui long de 700 ms sur Nelson Sauvin. Sa fiche montre le choix A : Baies 2/2,
  « groseille à maquereau, gooseberry ».
- `r6l-fiche-galaxy.png` : appui long sur la carte, hors du nom. On y lit « α 17,2 % lot ≠ fiches
  11–16 % ».
- `r6l-toucher-390.png` et `r6l-chimie.png` : la chimie de Galaxy face à Nelson Sauvin.
- `r6l-valeurs.png` et `r6l-valeurs-cascade.png` : vraies valeurs, lots COA, mesures en bière (H12).
- `r6l-osu.png` : le panel OSU.
- `r6l-absolu.png` : la lentille absolue.
- `r6l-legende.png` : la légende ouverte.
- `r6l-1280-survol.png` : survol de 900 ms à 1280 px. La fiche de Cascade s'ouvre.
- La console reste sans erreur sur tous ces parcours.

Prédiction (sa voix) : « Les cartes qu'on glisse sur la grande, c'est vachement bien, et voir direct
42 g contre 16 g à IBU égal c'est très parlant, mais le petit 16D à droite je comprends pas sans le ? ».

## Doutes et limites
- Les écarts à la cible restent sous 0,9 cran à 10′. Le classement « le plus proche » ordonne les
  candidats sans les départager vraiment, et la légende le dit. Cette distance (somme des |écarts de
  gain| sur 12 familles) est ma construction : elle est écrite sur la page.
- Le choix A ne touche que les fiches, pas la grille simulée. Sur les barres, la cible ne donne rien
  en Baies ; sur le radar, qui lit les fiches, elle les montre marquées.
- α de la cible : la page affiche la plage des fiches (10–14 %), car elle n'est pas en stock. Mais sa
  dose d'IBU égal (1,43 g/L) suit l'α 9,6 % lu sur l'article, hors de ses fiches. La page le dit
  (« Vraies valeurs »).
- Rattachement composé → familles (myrcène → résineux et végétal, etc.) : repris de v1 du lot 21, à
  valider, et dit sur la page.
- Idaho 7 passe en bleu canard au lieu du rouge du lot 21, et la cible en charbon : ces couleurs ne
  sont pas des acquis, mais elles changent d'un lot à l'autre.

DÉCISION À PRENDRE : recalculer la grille simulée de Nelson Sauvin avec les descripteurs A, pour que
la cible donne aussi des Baies sur les barres ? Options : (1) laisser l'écart dit dans la NOTE ;
(2) relancer `extraire-comparer.mjs` et le moteur avec A (voie r6e ou une nouvelle voie). Recommandation :
(2) si le brasseur retient A, sinon (1). Décideur : le pilote.

CONNAISSANCE : à 10 IBU à 10′ dans la stout 16D, les gains d'arôme de Cascade, Idaho 7, Galaxy et Nelson
Sauvin restent tous sous 0,9 cran (grille comparer-stout-v1). Ce qui les sépare vraiment, c'est la dose
d'IBU égal : 42, 22 et 16 g pour 20 L, contre 29 g pour Nelson Sauvin. La plage haute du simulé vient
presque toute de la bière de départ (Nugget : 54,6 en agrumes avant tout ajout), pas du houblon.

LEÇON PROPOSÉE : sur une échelle au style, un gain inférieur à un cran est invisible. Pour comparer des
houblons, il faut dessiner le gain à sa propre échelle (un cran) et placer la bière dans sa zone à côté,
sinon les barres semblent toutes vides. Rôles : auteur, concepteur. Contrôle possible : la barre du
candidat le plus fort doit couvrir au moins 30 % de la piste.
