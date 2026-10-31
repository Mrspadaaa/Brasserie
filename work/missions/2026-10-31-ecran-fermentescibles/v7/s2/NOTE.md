# p7-s2 — la recherche dans la liste (D220 : « Dans la liste ? », D221)

Chaleur : tiède. Au repos, rien ne change. Le champ touché : trois lignes fantômes du stock (épinglés en tête, hors recette) après la
dernière ligne, là où la ligne viendra, et « + N au stock · tape pour affiner ». Fantôme : trait tireté, sac à la teinte, nom gris
(lettres tapées en noir), dessous ce que l'app écrit (« 12,5 kg en stock · 6,5 EBC · Weyermann »), + à droite (Entrée sur la
première). Un toucher en fait une vraie ligne (masse à 0, curseur dans sa masse). Un nom déjà là éclaire sa ligne (fond de grain,
trait d'or) et « déjà 5,0 kg » prend la place de sa part. « Créer » est la dernière ligne fantôme. ↓ ↑ changent la ligne qu'Entrée
prendra. Le champ descend avec les fantômes : compenser le défilement cachait les premières lignes sous l'en-tête collant (essayé).

## Le stock de la maquette (fixture, D221)
La base n'avait que des noms. Valeurs de maquette (EBC : valeur typique de fiche malterie), dans `commun-p7.mjs` (`FIX`) :

| Article | Stock | EBC | Fournisseur | Épinglé |
| --- | --- | --- | --- | --- |
| Pilsner Malz | 18 kg | inconnu | Weyermann | oui |
| Pale Ale Malz | 12,5 kg | 6,5 | Weyermann | oui |
| Münchner Malz | 0 (stock épuisé) | 15 | Weyermann | |
| Carapils | 1,2 kg | 4 | Weyermann | |
| Weizenmalz hell | 6 kg | inconnu | Weyermann | |
| Haferflocken | 2,5 kg | inconnu | Bio-Familia | |
| Carahell | 3 kg | 25 | Weyermann | |
| Caramünch II | 0,8 kg | 120 | Weyermann | |
| Dextrose · Sucre candi · Lactose | 5 · 1 · 2 kg | | Brouwland | |
| Extrait sec clair | 0 (stock épuisé) | 8 | Brouwland | |

Carahell et Caramünch II rejoignent le stock pour que la teinte serve à choisir entre caramels proches ; ils ne sont pas dans les
sacs habituels, si bien que le repos garde les trois sacs de la base. Relance 1 (critique v6) : les trois articles déjà dans la recette (Pilsner Malz, Weizenmalz hell, Haferflocken) n'ont pas d'EBC
connu au stock, comme leurs lignes, qui gardent les trois « ? » de la base et « 3 couleurs à renseigner » : leur rangée n'en affiche pas
(ni « ? » ni zéro inventé), leur sac reste blanc, s1 ne leur met pas de pastille. Les lignes déjà dans la recette restent « ? » ;
un malt ajouté depuis le stock prend sa teinte (Münchner Malz → 15 EBC). Le sac des sacs habituels prend la teinte du stock (même forme,
mêmes mots) : seul écart visible au repos.

## Alias (le nom courant d'un malt le trouve, D220)
| Tapé (début) | Trouve |
| --- | --- |
| Munich | Münchner Malz |
| Pils | Pilsner Malz |
| Pale | Pale Ale Malz |
| Weizen, Wheat, Blé | Weizenmalz hell |
| Cara | Carapils |
| Avoine | Haferflocken |

## Recherche commune
Sans accents ; rang : nom courant (alias), début du nom, début d'un mot, ailleurs dans le nom, puis une lettre près (un mot tapé de
4 lettres au moins : « pilsener » trouve Pilsner Malz). La pertinence prime ; à rang égal, la ligne déjà là passe devant. Entrée prend le
premier (l'aperçu du champ le dit avant) ; « cara 0,3 » donne la masse ; rien trouvé : « Créer « … » (stock à zéro) ». Un toucher
dans les résultats garde le champ et le clavier (`data-p7garde`). La quantité en stock s'écrit : son mot (D221) prime sur L04.
Assemblage : `patch.mjs` (split/join, L26) depuis `v6/p6-b2/etat.html` ; `capturer.mjs` généré par `s1/gen-capturer.mjs`.

## Contrôles
RECHERCHE OK (R0 à R6), MASSE OK, MOMENT OK, VOLEE OK (10), PAGE OK, MOTS OK (76), COMMUN OK, CONTRASTE OK, HAUTEUR OK (1,04 écran),
CAPTURES OK. GESTES ECHEC 2 : `controle-gestes-ligne.mjs` attend qu'Entrée sur « Munich » crée une ligne « Munich » (`/^Munich/`),
le défaut même de D220 que R2 interdit ; la base p6-b2 le passe parce qu'elle crée « Munich ». CONTRÔLE ? signalé au pilote.
