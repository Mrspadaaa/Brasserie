OK — page des sous-familles, 5 options ; retouche e-t12 faite (quantité par sous-famille, D306, D)

R2-SOUSFAMILLES OK — 5 options (retouche e-t12) — choix-sousfamilles/index.html

Les nombres de Rénovation de la v1 (14 lignes, 433,30, +115 px pour C) sont remplacés par ceux de la section « Reprise e-t12 », en fin de fichier.

Voie r2-sousfamilles, 02.11, agent concepteur (Opus). Je n'ai touché ni au code de l'app ni aux données réelles. Aucun commit, aucun serveur Vite. Skill `boosters-ux` chargé. `impeccable` n'a pas été chargé : la forme de page est celle de `choix-captures` et `choix-nom`, déjà acceptée (verdicts e-t8 et e-t10).

## Fichiers écrits (tous sous `choix-sousfamilles/`)
- `index.html` : la page de choix.
  - Titre daté du 02.11, `#a-choisir` en tête, `[data-choix="sous-familles"]`.
  - A est en `data-reference`, B à E en `data-variante`.
  - Les vignettes s'ouvrent dans la visionneuse `dialog`.
  - Une sous-grille aligne les quatre vues d'une rangée à la même hauteur. Une bande plus courte laisse son blanc sous l'image, pas dedans : la place prise se voit.
- `maquettes/*.html` : 20 pages statiques à 390 px.
- `img/*.png` : leurs 20 captures, ×2.
- `outils/gen.mjs` écrit et capture les maquettes.
  - Il reprend le balisage de `Liste.tsx`, `Ligne.tsx`, `Entete.tsx` et `Pied.tsx` : mêmes classes Tailwind et `dp-p3c-*`, même picto cube (`Pictos.tsx`), icônes lucide.
  - Il compile la feuille avec la configuration Tailwind de l'app : `outils/tw.config.mjs` et `outils/entree.css`, qui importent `src/index.css` et `src/ui/depense/p3c.css`. La feuille produite est `outils/app.css`.
  - Seules les règles neuves sont préfixées `sf-` (`outils/sf.css`, L26).
- `outils/page.cjs`, `outils/page.css` : la page. La feuille vient de `choix-captures`, plus la sous-grille.
- `outils/mesure-rangee.mjs` : le critère 3. Il produit `controle/rangee-cote-a-cote.png`.
- `outils/tailles.json` : la hauteur rendue de chaque vue.
- `controle-haut.png`, `controle-page.png`, `controle-ordinateur.png` : les captures du critère 2.

## Les options (seul l'affichage de la sous-famille varie)
Trois vues par option : **1** la bande Rénovation ouverte, en clair et en sombre ; **2** une autre facture avec Houblons, Nettoyage et Consommables ; **3** la dépense au repos à 390 × 844, défilée jusqu'aux bandes, avec en-tête, pied « Catégorie | Papier » et ✓ Confirmer.

**Règle commune** : une bande avec une seule sous-famille, ou sans sous-famille, reste celle d'aujourd'hui. On le voit dans la vue 2 (Houblons sans sous-famille, Consommables tout en EPI) et dans la vue 3 (Nettoyage et Consommables).

| Option | Ce qu'on voit | Bande Rénovation (vue 1) |
|---|---|---|
| **A, aujourd'hui** | Les lignes dans l'ordre du papier, sans sous-famille. | 486 px |
| **B, sous-titres** (proposée) | Les lignes groupées dans l'ordre des sept sous-familles. Chaque groupe a un sous-titre de 22 px : nom, nombre, sous-total aligné sur la colonne des montants. Le filet de la famille continue. | 640 px (+154) |
| **C, un mot** | L'ordre du papier est gardé. La pastille de sous-famille est teintée de la famille et posée après le nom, comme α. Un nom long passe sur deux lignes. | 601 px (+115) |
| **D, replié** | Au repos, une ligne de 28 px par sous-famille : chevron, nom, nombre, montant. Un toucher l'ouvre. En vue 1, « Peinture et sols » est ouverte ; en vue 2, « Désinfectant ». | 363 px avec un groupe ouvert |
| **E, pastilles** (ajoutée, mon avis) | L'ordre du papier et les rangées sont gardés. Sous l'en-tête, une pastille par sous-famille avec son sous-total. Un toucher ne garde que ses lignes, ✕ les remet toutes. En vue 2, « Désinfectant » est touchée. | 579 px (+93) |

En vue 3, à 390 × 844 :
- A, C et E tiennent les 17 lignes. Dans C et E, « Pour quoi ? » passe sous le pied.
- B coupe « + Ajouter une ligne » sous le pied.
- D laisse voir tout le formulaire.

**Proposée : B.** C'est le « classement par famille ou sous familles » qu'il a demandé (D262d) : les sous-totaux sont là et aucune ligne n'est cachée. Or cet écran sert à vérifier la facture ligne par ligne. Son prix est écrit dans la page : la bande s'allonge.

**Valeurs, toutes fictives** :
- Brico Fictif SA, 18.10.2026, 473,60. Rénovation : 14 lignes, 433,30, 7 sous-familles (167,60 + 95,50 + 22,40 + 49,70 + 58,80 + 23,70 + 15,60). Nettoyage 18,90 et Consommables 21,40.
- Seconde facture, 97,40 : Houblons 12,30 (Saaz, Cascade, comme dans c-captures) ; Nettoyage 54,20 avec CIP alcalin 9,80, CIP acide 14,20 et Désinfectant 30,20 ; Consommables 30,90.
- Toutes les sommes sont recalculées par le générateur.
- Le grep des noms de ses pièces (carabelge, rauchshop, wiener, pilsner, hallertau, chemipro, kronkorken, boutique fictive) sur `maquettes/` et `index.html` rend 0.

## Critères et sorties
1. `controle-page-choix.mjs … --min=4` → `sous-familles : OK (4 variantes, 5 par rangée à 1280, 2 à 390)`, puis `PAGE-CHOIX OK (1 choix)`.
2. `verifier-page.mjs … --page-lot --captures …/controle` → `PAGE OK (20 images chargées, lisible à 390 et 1280 px, sans erreur)`. Note : ses trois captures sont écrites à la racine de `choix-sousfamilles/`, pas dans `controle/`.
3. Rangée de A contre la rangée servie (`voies/p3c-bandes/captures/tactile390-nettoyage.png`, rangée « Divers fictif XJ-17 »), mesurée au pixel par `outils/mesure-rangee.mjs`, en px CSS :

   | Mesure | Servie | A |
   |---|---|---|
   | Pas de rangée | 28,5 | 28,5 |
   | Glyphes de « 1 Stk » | 8,5 | 9 |
   | Début du nom | 39,5 | 39 |
   | Picto | 16 | 16 |
   | Marge droite | 11 | 11 |

   Sortie : `RANGEE OK (écarts ≤ 1 px)`. Image côte à côte : `controle/rangee-cote-a-cote.png`.
4. `controle-choix` est sans objet : l'écran Dépense n'est pas dans `ecrans.json` (`grep -ci depense` → 0). La base est l'écran servi : p3c-3 porté, puis p3c-bandes et f3.

## Captures ouvertes
- `img/a-repos.png`, `b-repos.png`, `d-repos.png`, `e-repos.png`.
- `img/b-renovation.png`, `c-renovation.png`, `d-renovation.png`, `e-renovation.png` (l'état filtré, avant le passage au repos, puis régénéré).
- `img/b-nettoyage.png`, `c-nettoyage.png`, `d-nettoyage.png`, `e-nettoyage.png`, `c-repos.png`.
- `img/d-renovation-sombre.png`, `c-renovation-sombre.png`.
- `controle-ordinateur.png` : cinq colonnes ; l'écart de longueur se voit sans lire.
- `controle-haut.png` : la question, la proposition, puis A et B.
- `controle-page.png` : deux par rangée, sans débordement.
- `controle/rangee-cote-a-cote.png`.

Une correction vient de ces regards : la pastille de C était invisible, sa teinte ne trouvait pas sa variable. Elle a maintenant sa teinte et un liseré.

Non ouvertes : `a-nettoyage`, et les vues sombres de A, B et E (même balisage que leur vue claire, thème seul changé).

## Ce qui reste douteux
- **La police de la capture servie** : le nom y est en police système, parce que le banc bloque Google Fonts. Mes maquettes chargent Source Sans 3 et IBM Plex Mono, comme l'app en ligne. Les mesures de boîte sont égales ; le dessin des lettres diffère.
- **Fond des rangées** : celles de la capture servie de p3c-bandes sont gris clair, celles de f3 (`tactile390-clair-repos.png`) blanches. J'ai suivi le code, qui ne pose aucun fond sur une rangée sûre.
- **D, sous-groupe d'une ligne** : « CIP alcalin 1 » ou « Divers travaux 1 » cache une seule ligne derrière un toucher.
- **D, lignes douteuses** : une ligne à vérifier (jaune ou rouge) devrait ouvrir son groupe d'office. Ce n'est pas dessiné.
- **E et le filtre de l'app** : E double un geste qui existe déjà, la barre `dp-p3c-filtre` « n … · ✕ Toutes les lignes ». Au port, le toucher d'une pastille pourrait réutiliser ce filtre.
- **La teinte Rénovation** : une autre voie a déjà ajouté à `src/ui/depense/p3c.css` (non commité) `--dp-fam-renovation` et `dp-p3c-{t,pt,fi}-renovation`, aux mêmes valeurs. Mes `sf-*-renovation` les doublent pour la maquette seulement.
- **Dépendance de `app.css`** : la feuille se compile depuis l'arbre de travail. Une régénération plus tard suivra donc les changements de `src/`.

Prédiction : il dira « B, c'est ça le classement ; mais D au repos pour la Rénovation, c'est propre », et demandera peut-être B qui se replie.

DÉCISION À PRENDRE : aucune dans ce contrat. La page publie « Proposée : B » : le pilote peut l'endosser, ou l'ôter d'une ligne dans `outils/page.cjs`.
CONNAISSANCE : une maquette de la Dépense peut se rendre au pixel sans serveur Vite. On compile les classes de l'app avec sa propre configuration Tailwind (`tailwindcss/lib/cli.js -c <config qui importe tailwind.config.js, content = maquettes>`), avec en entrée `src/index.css` et `p3c.css`. Les écarts de rangée mesurés sont de 1 px au plus.
LEÇON PROPOSÉE : aucune

## Reprise e-t12 (verdict `critique/VERDICT-r2-sousfamilles.md`, ACCEPTÉ, un majeur)
Tout est régénéré par `outils/gen.mjs`. C et E ne sont pas retouchés pour leurs mineurs (greffes, pastilles sur une ligne), comme demandé.

1. **Majeur, le sous-total de quantité par sous-famille (D235)**. Même calcul par unité que la bande. Une unité qui porte une ligne « repris » est soulignée en jaune pointillé, comme dans Liste.tsx.
   - **B** : sur le sous-titre, la quantité en mono gras, dans la colonne de « 25 Stk » de la bande (`mr-[57px]`). Exemple : « Peinture et sols 5 · 9 Stk · 191,30 ».
   - **D** : de même sur la ligne repliée. Exemple : « › Plomberie ② · 5 Stk · 58,80 ».
   - **E**, mon choix : la quantité seulement dans l'état touché (« Désinfectant 3 Stk 30,20 ✕ »). Au repos, la pastille garde nom et montant, pour ne pas allonger le nuage (+93 px déjà). Dans la pastille noire, le jaune « repris » est éclairci (`sf.css`).
   - Nettoyage : la bande dit « 1 Kg + 4 Stk », les groupes « 1 Kg », « 1 Stk » et « 3 Stk ».
2. **Classement D306** : Protection = l'EPI.
   - La bâche et le ruban de masquage passent dans Peinture et sols. Lunettes de protection et gants nitrile M (100) vont en Protection.
   - Les Consommables de Brico deviennent deux lignes « Consommable » (sacs poubelle 8,90, essuie-tout 12,50). C'est toujours le cas d'une seule sous-famille.
   - Rénovation : **16 lignes, 25 Stk, 454,70** = 191,30 + 95,50 + 22,40 + 49,70 + 58,80 + 21,40 + 15,60, soit 9, 2, 2, 3, 5, 2 et 2 Stk. La pièce : 495,00 = 18,90 + 21,40 + 454,70.
   - La page tire ses nombres de `tailles.json` : B +154 px, C +138, E +93, D à 422 px avec un groupe touché. Libellés : « Rénovation (16 lignes) », « +154 px sur 16 lignes ».
3. **D** :
   - Dans `d-nettoyage`, l'unité de « Spray désinfectant 500 ml » est déduite (repris, jaune). Désinfectant s'ouvre d'office, sans aucun toucher dans cette vue.
   - Un sous-groupe d'une seule ligne montre sa ligne, sans chevron : CIP alcalin, CIP acide, Divers travaux.
   - La tête de D dit : « Une ligne à vérifier l'ouvre d'office ; une ligne seule, sans chevron. Touchée : Peinture et sols. »
   - La ligne jaune est dans la même facture fictive pour les cinq options : la donnée ne varie pas (L10).
4. **Libellés des vues au repos**, repris de l'app :
   - « Fournisseur et catégorie » : « Brico Fictif SA · Local ». Source : `categories`, ExpenseSheet.tsx l. 65 (`renovation` → « Local »), et la valeur `${vendor} · ${label}` de la l. 988.
   - « Pour quoi ? » : « Brico Fictif SA · BF-4471 · nettoyage, consommables · proposé ». J'ai appliqué à la main la règle d'`invoicePurchaseDescription` (fournisseur · n° · familles dans l'ordre du papier, 60 caractères au plus, d'où « matériel » coupé), puis ajouté le « · proposé » de la l. 997. La fonction n'a pas été exécutée.
   - Référence : « BF-4471 ».
   - Le libellé « Pour quoi ? » ne passe plus à la ligne (`shrink-0`).
   - Grep : plus aucun « Travaux » ni « · rénovation » ; « travaux » ne reste que dans « Divers travaux ».

Rejoué :
- `controle-page-choix.mjs --min=4` → `sous-familles : OK (4 variantes, 5 par rangée à 1280, 2 à 390)`, puis `PAGE-CHOIX OK (1 choix)`.
- `verifier-page.mjs --page-lot` → `PAGE OK (20 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- `mesure-rangee.mjs` → `RANGEE OK (écarts ≤ 1 px)` (servie / A) :

  | Mesure | Servie | A |
  |---|---|---|
  | Pas | 28,5 | 28,5 |
  | Glyphes | 8,5 | 9 |
  | Nom | 39,5 | 39 |
  | Picto | 16 | 16 |
  | Marge | 11 | 11 |

Ouvertes après la reprise :
- `img/b-renovation.png` : 7 sous-titres avec quantité et montant ; sommes justes.
- `img/d-nettoyage.png` : CIP alcalin et CIP acide en rangées seules ; Désinfectant ouvert d'office ; « 3 Stk » et « 2 Stk » en jaune.
- `img/e-renovation.png` : au repos, pastilles avec nom et montant.
- `img/e-nettoyage.png` : pastille touchée « Désinfectant 3 Stk 30,20 ✕ ».
- `img/d-repos.png` : Divers travaux en rangée seule ; « Pour quoi ? » sur une ligne ; « Brico Fictif SA · Local ».
- `controle-ordinateur.png` : 5 colonnes. Les quantités des sous-titres de B et des lignes de D sont alignées sur « 25 Stk ».

Incident : une première écriture de cette section par un heredoc non protégé a fait exécuter à bash les passages entre accents graves. `outils/gen.mjs` a été relancé (idempotent) ; les autres appels ont échoué sans rien écrire. J'ai ensuite tout régénéré et rejoué.

Doutes :
- En E, la quantité n'apparaît qu'au toucher. Si le pilote la veut au repos, il faut une ligne dans `pastilles()`, pour environ un rang de pastilles de plus.
- La ligne à vérifier est la même dans les cinq options. Dans A, B, C et E, elle se voit déjà à sa place ; seule D avait besoin de la règle.
