# p7-s1 — la recherche sous le champ (D220, D221)

Chaleur : tiède (la forme de la voie, sur la base p6-b2 telle quelle).
Au repos, les sacs habituels de la base. Le champ touché, l'ouverture : les sacs deviennent des tuiles sur deux colonnes, le stock de la
famille hors recette (déjà au-dessus), épinglés en tête (étoile). Tuile : nom, pastille de teinte avec l'EBC (sa couleur sépare deux
malts proches : Carapils 4, Carahell 25, Caramünch II 120), « 12,5 kg en stock » ou « stock épuisé » (en or foncé). En tapant : six
tuiles au plus, lettres tapées surlignées, une ligne déjà là en pleine largeur (« déjà 5,0 kg · 18 kg en stock »), Entrée dessinée
sur la tuile qu'elle prendra. Le fournisseur n'y est pas (place) : il est dans le nom accessible.

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
