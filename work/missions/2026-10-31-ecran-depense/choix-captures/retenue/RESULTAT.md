OK — maquette retenue de B (bouton noir coupé en deux), 9 états à 390 px

Voie c-captures, maquette retenue, 02.11. C'est son choix D291, mot pour mot :
- « Variante b, mais dans la première vue, pouvoir choisir entre envoyé 1 ou plusieurs documents, dans 99% des cas c'est que 1 document » ;
- « Le bouton noir est splitter en 2 ».

Cette maquette est la base du code (règle n° 1). Valeurs et fournisseur fictifs, les mêmes que dans `../img/` (Malzhaus Nord, 48,70, 6 lignes). Je n'ai touché ni au code de l'app ni aux données réelles.

## Fichiers
- `gen.mjs` écrit et capture les états (`node gen.mjs`). Il reprend les pièces de `../outils/gen.mjs`, qui exporte désormais ses fonctions. Ses propres captures sont inchangées : mêmes groupes « = X » au md5.
- `maquettes/*.html` : les 9 états, en HTML statique à 390 px, thème clair. Les classes propres portent le préfixe `rt-`.
- `img/*.png` : les 9 captures (×2), toutes ouvertes.

## Les états
| État | Fichier | Ce qu'on voit |
|---|---|---|
| Repos, forme 1 | `img/1-entree-f1.png` | Bouton noir coupé. À gauche, large (~248 px) : « Choisir le document », le libellé d'aujourd'hui. À droite, étroit (96 px) : picto pages + « plusieurs ». |
| Repos, forme 2 | `img/1-entree-f2.png` | À gauche : « Un document ». À droite, 52 px : une pile de pages avec un « + », sans mot. |
| Repos, forme 3 | `img/1-entree-f3.png` | À gauche : « Un document ». À droite, 124 px : picto + « Plusieurs ». Deux libellés, la première moitié plus large. |
| Un document, pendant | `img/2-un-document.png` | **= aujourd'hui** : l'état « lecture » actuel, frise « envoi ✓ · lecture · vérification », « Les lignes arrivent ici ». La lecture part tout de suite. La dépense lue est aussi celle d'aujourd'hui (icône du document, « Voir l'original » et « Changer » ; pour un PDF, « Ouvrir le PDF original »). |
| Plusieurs, première page | `img/3-plusieurs-1.png` | La rangée de B : vignette 1 avec ×, tuile « + page », « Lire 1 page », « ajoute la suivante, puis Lire ». En dessous, la partie basse de c-pendant : frise avec « envoi ✓ » (la page part déjà), lecture en gris, cadre, Pour quoi et Règlement. |
| Plusieurs, trois pages | `img/4-plusieurs-3.png` | Trois vignettes numérotées avec ×, « + page », « Lire 3 pages ». Sans délai : la lecture attend « Lire ». |
| Plusieurs, après Lire | `img/5-lecture.png` | La carte « 3 pages · 2,1 Mo », la rangée compacte 1 · 2 · 3, la frise « lecture » qui défile, puis le bas d'aujourd'hui. |
| Lue, repos | `img/6-lue-repos.png` | En-tête : la pile « 3 » à la place de l'icône du document. Puis le bandeau, la preuve « ✓ 3 pages lues », les bandes, le pied. |
| Lue, pages ouvertes | `img/7-lue-pages.png` | Au toucher de la pile : un panneau compact, trois vignettes de 56 px de haut sur une ligne, « Changer » à droite (mineur e-t10). Le bandeau ne descend que de ~70 px. |

La forme 2 est la plus fidèle à « se lit sans texte d'explication ». La forme 1 garde le libellé d'aujourd'hui pour le geste des 99 %. La forme 3 est la plus claire, mais « Plusieurs » pèse plus. Au choix du pilote.

## Contrôles
- Page de choix rejouée après la ligne « Son choix (02.11) : B, avec le bouton noir coupé en deux » et le badge « choisie » sur B :
  - `controle-page-choix.mjs --min=3` → `plusieurs-captures : OK (5 variantes, 6 par rangée à 1280, 2 à 390)`, `PAGE-CHOIX OK (1 choix)` ;
  - `verifier-page.mjs --page-lot` → `PAGE OK (18 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- Ouvert : `../controle-ordinateur.png`. Le bandeau noir de son choix est en tête, le badge « choisie » sur B, les six colonnes sont inchangées.

## Ce qui reste douteux
- **« + page »** : un fichier à la fois (B tel que choisi). On pourrait aussi accepter plusieurs fichiers d'un coup dans ce sélecteur, sans changer l'écran. Je ne l'ai pas fait : c'est C, qu'il n'a pas choisi.
- **La photo en mode « plusieurs »** : « + page » ouvre le sélecteur de fichiers. Une photo pour une page suivante reste à décider : un second choix sous « + page », ou le bouton « Photographier » qui ajoute à la rangée quand elle est ouverte. Non dessiné, car hors de ses mots.
- **Le rendu des captures varie d'un passage à l'autre** (anticrénelage des polices). Les groupes « = X » de la page ont été revérifiés au md5 sur la dernière génération : 11 fichiers en 4 groupes, comme avant. Une attente de 250 ms a été ajoutée avant chaque capture.
- **Les numéros des vignettes de 56 px** recouvrent le bas de leurs lignes grises. C'est lisible ; ce sera à affiner au port.
- **Seule forme non prouvée au doigt** : la moitié étroite de la forme 2 (52 × 32 px) passe la cible de 24 px, mais elle n'a pas été jouée dans Chrome tactile.

CONNAISSANCE : l'entrée d'aujourd'hui lit `files?.[0]` à trois endroits : sélecteur, appareil photo et dépôt (ExpenseSheet, lignes 912 à 992). « plusieurs » devra ouvrir un second `input` (ou le même avec un drapeau), sans toucher au geste « un document ».
LEÇON PROPOSÉE : aucune
