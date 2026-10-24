OK — huit concepts v0 « les mots d'abord » : fiche g1 à l'appui long, COMMUN OK, PANEL OK

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/fla1/` à `fla8/` : `etat.html`, `NOTE.md`, `concept.mjs`.
- Générateur commun : `fla1/commun/donnees.mjs` (mots des fiches traduits, vérifiés contre `pack-fiches.json`), `socle.mjs` (étape v4.10 au repos, feuille g1, radar g1, gestes), `generer.mjs`, `capturer.mjs`.
- Captures : `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/captures/fla*-premier-ecran.png`, `fla*-page.png`, plus deux ou trois états par concept (autres houblons, gestes de fla5 et fla8).

## Concepts (une ligne chacun)
| id | chaleur | idée | ce qui tient | ce qui casse |
|---|---|---|---|---|
| fla1 | froide | liste g1 retournée : le mot en tête, la famille après, « hors radar » groupé | côte à côte avec g1 (Nugget) : tous ses éléments sauf la bande des 12 | Nugget dépasse le premier écran ; bande g1 non reprise |
| fla2 | froide | le radar g1 porte les mots au bout des rayons ; hors radar dans un cadre sombre dessous | silhouette et mots en une figure ; Nelson Sauvin : radar vide, cadre plein | mots longs pliés ; cadre sombre dans un thème blanc |
| fla3 | tiède | note de dégustation : une phrase typographique, taille = fiches, trait = famille | « vin blanc, groseille à maquereau, raisin » se lit en 3 s | radar en vignette sans n/N ; bas vide sur Nelson Sauvin |
| fla4 | tiède | rubans des mots vers leur famille ; hors des 12 : même ruban vers un bloc sombre | on voit où vont les mots ; Nelson : cinq rubans vers « hors des 12 » | croisements de rubans ; phrase d'en-tête longue |
| fla5 | tiède | au style en mots : ce que la stout 16D attend, ce qui est déjà trop marqué (dégustation 18.10), ce qu'elle tolère, ce qu'elle ignore ; lentille absolu | « 4 mots que ta stout attend · 2 déjà trop marqués chez toi » | lecture au style en plus ; Nelson tout en « tolère » |
| fla6 | chaude | roue : radar au centre, anneau des familles, couronne des mots (hors des 12 en gris pointillé) | Nelson : roue aux trois quarts grise, ce que le radar cachait | étiquettes serrées à 12 mots ; gris éteint |
| fla7 | chaude | cône : une bractée par mot, couleur pleine de la famille, grise si hors | Citra cryo : un vrai cône coloré, l'objet se reconnaît | forme d'écaille à 7 mots ; bractées du bas chevauchées |
| fla8 | chaude | touche un mot : il allume son rayon (ou « hors du dessin ») et dit qui l'écrit | le geste répond sans légende ; Nelson : 5 touches sombres sur 7 | touches sombres très lourdes ; ligne de source longue |

Chaleurs : 2 froides (fla1, fla2), 3 tièdes (fla3, fla4, fla5), 3 chaudes (fla6, fla7, fla8).

## Sorties décisives
- G1 : `SERIE-BIEN-8`.
- G2 : `controle-commun.mjs … fla1 … fla8 --page=etat.html --sans=mots` → `COMMUN OK` (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes).
- G3 : `systeme.mjs note … --contient "fla1,…,fla8,chaleur"` → `NOTE OK`.
- Panel : `controle-panel.mjs captures/fla?-premier-ecran.png` → `PANEL OK` (remplissage médian 0,67, 0 sous 0,50 ; ressemblance 0,87 ; 0/28 paires presque identiques).
- Indicatifs (une fois, recopiés dans chaque NOTE) : une-question ECHEC et sans-famille ECHEC, car ces contrôles lisent l'étape au repos, pas la fiche ouverte à l'appui long ; mots 38 au repos.
- Données : `verifier()` de `donnees.mjs` → aucune faute (chaque mot d'origine et chaque famille retrouvés dans la fiche du houblon).

## Prédiction
« fla3 et fla4 donnent vraiment bien, là Nelson Sauvin a l'air d'un vrai houblon de vin blanc ; fla1 c'est ma fiche en mieux, mais la roue fla6, bof. »

DÉCISION À PRENDRE : les contrôles indicatifs `controle-une-question` et `controle-sans-famille` lisent la page au repos ; pour une fiche ouverte à l'appui long, il faut un mode « fiche ouverte » (par exemple `etat.html#fiche=nelson-sauvin`, que les pages de la série acceptent déjà) avant la passe 2, où ils deviennent obligatoires.

CONNAISSANCE : la ligne Hopsteiner « Familles déclarées sur houblon brut » fournit seule l'Agrumes 1/2 et l'Épicé 1/2 de Nelson Sauvin et l'Herbacé de Cascade : ce sont des classements, pas des mots sentis ; une liste « les mots d'abord » doit les dire « classé ».

LEÇON PROPOSÉE : dans un socle préfixé par concept (L26), les classes du socle et du concept partagent le même préfixe : trois collisions silencieuses ici (`-top`, `-ph`, `-hors`, `-al`) ont cassé la mise en page ou le contraste de l'étape ; donner au socle un préfixe propre (`<id>s-`) et au concept le sien.
