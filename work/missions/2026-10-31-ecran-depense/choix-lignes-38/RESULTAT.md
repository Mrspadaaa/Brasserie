OK — page de choix D310, reprise 1 : ligne ajoutée, ligne pas retrouvée, 2 × 4 options sur d-lue

L2-LIGNES OK — 6 options, reprise 1 (deux majeurs et quatre mineurs de e-t13 levés) — choix-lignes-38/index.html

Voie l2-lignes, 02.11, agent concepteur (Opus). Je n'ai touché ni au code de l'app ni aux données réelles. Aucun appel Gemini, aucun commit,
aucun serveur Vite. J'ai écrit seulement dans `choix-lignes-38/`. J'ai chargé le skill `boosters-ux`, pas `impeccable` : la forme est celle
de `choix-lenteur` et `choix-sousfamilles`, déjà acceptées (e-t11, e-t12). J'ai lu les deux verdicts et je n'ai pas refait leurs défauts :
- l'avis porte sa raison et sa limite ;
- les vignettes identiques au pixel sont grisées « = A » ;
- aucun texte de la page sous 14 px ;
- aucun cadre bleu neuf ajouté (mineur de e-t11) ;
- aucune valeur de ses pièces.

## La base (règle n° 1)
Sa maquette `choix-lenteur/maquettes/d-lue.html` est reprise par son propre code : la CSS, les icônes et l'en-tête de
`choix-lenteur/outils/gen.mjs` sont recopiés tels quels, et `depense()` y devient `ecran()`, avec ses données en paramètres. Elle garde tout
ce qu'elle avait :
- le fil parti, « Lectures 3/3 » et Confirmer noir ;
- la puce « ↻ N corrigées » (avec son cadre, comme dans d-lue) ;
- les valeurs corrigées sur fond bleu, l'ancienne valeur barrée sous le nom ;
- la vue Catégorie, sans les sous-groupes de D307.

Un seul écart : la hauteur de l'écran passe de 700 à 780 px. Sans cela, le bandeau de D cachait la rangée Sucre candi (rouge « à remplir »).
Le blanc ajouté sous la liste est uni (mesuré : 0 pixel non blanc).

`controle-choix` est sans objet : l'écran Dépense n'est pas dans `work/refonte-frontend/v4/choix/ecrans.json`
(`grep -ci "depense\|dépense"` → 0). La base vient de son choix D308 (d-lue).

## Les options
Données fictives : Brauhaus Ouest, 21.10.2026, Mosaic, Avoine maltée. Les sommes tombent juste :
- Q1 : 46,40 + 1,60 = 48,00. La bande Houblons passe à 3 lignes, 100 g, 8,20.
- Q2 : 24,10 + 1,70 = 25,80, soit 10,5 Kg ; 46,40 + 1,70 = 48,10, qui ne tombe pas sur l'imprimé 46,40.

Les trois corrections de d-lue sont gardées (Pilsner, Sabro, Citra). VOIE.md disait « deux corrections ordinaires comme dans d-lue », mais
d-lue en a trois. J'ai suivi sa maquette, pour que A la reprenne au pixel.

**Question 1 : une ligne que la 3.8 ajoute (Mosaic, à sa place dans Houblons).** Dans chaque option, elle compte dans la puce
(« ↻ 4 corrigées »), dans « 8 lignes », « 8/8 », « 7 reliés » et le total.
- A (référence) : une rangée ordinaire, sans marque.
- B (plan, mon avis) : toute la rangée sur le bleu des corrections, avec les valeurs en bleu, sans ancienne valeur.
- C : chaque valeur (nom, quantité, prix, montant) sur sa pastille bleue, comme une cellule corrigée.
- D : la rangée ordinaire ; sous le nom, à la place de l'ancienne valeur, « ↻ neuve » en bleu.
- Vue sombre : B.

**Question 2 : une ligne du provisoire que la 3.8 ne lit plus (Avoine maltée, dans Malts).**
- A (« à ne pas faire ») : retirée sans marque. C'est d-lue au pixel.
- B (plan, mon avis) : barrée en attention (pointillé jaune), hors des sommes et de la barre. « ✓ Garder » et « ✕ Retirer » sont sous le
  nom, dans la rangée, et elle compte dans « ↻ 4 corrigées ». Confirmer sans trancher : elle part.
- C : reprise en jaune, comme une valeur à contrôler (D277), et comptée. On voit alors :
  - « Somme ≠ imprimé 48,10 » en attention ;
  - « non relue » sous le nom ;
  - ✓ et ✕ au bout de la rangée ;
  - « 3 à contrôler ».

  Confirmer sans trancher : elle reste.
- D : barrée dans la liste ; la question « Avoine maltée 1,70 · non relue · Garder · Retirer » est dans un bandeau au-dessus de Confirmer,
  au pouce, tant qu'il n'a pas tranché. Confirmer sans trancher : elle part.
- Après le geste, B, C et D donnent la même dépense (md5 égaux). La page les montre donc une seule fois, sous les options :
  - après « Garder » : rangée ordinaire, 8 lignes, Malts 4 · 10,5 Kg · 25,80, et « Somme ≠ imprimé 48,10 » en attention. Il voit que
    la 3.8 avait raison ;
  - après « Retirer » : « = A », d-lue au pixel.
- Vue sombre : B à l'arrivée.

## Contrôles et sorties
1. `controle-page-choix.mjs … --min=3` :
   - `ligne-ajoutee : OK (3 variantes, 4 par rangée à 1280, 2 à 390)` ;
   - `ligne-non-relue : OK (3 variantes, 4 par rangée à 1280, 2 à 390)` ;
   - `PAGE-CHOIX OK (2 choix)`.
2. `verifier-page.mjs … --page-lot --captures …/choix-lignes-38/controle` → `PAGE OK (12 images chargées, lisible à 390 et 1280 px, sans
   erreur)`. J'ai ouvert `controle-haut.png`, `controle-page.png` et `controle-ordinateur.png`, plus une capture de la section 2 à 1280 px.
3. Mesure de A (L03) :
   - Identité du code : `HAUT=700 node outils/gen.mjs --identite` → `IDENTITE OK (15347 octets, HAUT=700)`. `ecran({})` rend d-lue.html
     octet pour octet, titre mis à part.
   - Pixels : `node outils/mesure-a.mjs` → `MESURE-A OK`. Le script compare au-dessus de la ligne du cas, sous elle (décalé de sa hauteur)
     et le pied (ramené au bas).
   - q2-a : 1 092 000 pixels comparés, 3 différents (trois points isolés de 1 px, du lissage du texte), aucune boîte de plus de 2 px.
   - q1-a : la ligne du cas est à y 518,8 à 546,8 px. Hors d'elle, 14 boîtes diffèrent, toutes des nombres que la ligne change :
     - le total 46,40 → 48,00 (x 36–85, y 84–104) et « 7 » → « 8 » lignes (x 312–319) ;
     - les segments de la barre (y 114–121) ;
     - Somme 46,40 → 48,00 (x 167–192, y 147–156) et 7/7 → 8/8 (x 348–372) ;
     - 6 → 7 reliés (x 42–49, y 205–213) et 3 → 4 corrigées (x 298–306) ;
     - la bande Houblons : 2 → 3 (x 97–103, y 420–428), 80 g → 100 g (x 227–241) et 6,60 → 8,20 (x 346–371).

     Le reste, ce sont des points de 1 px.
4. `controle-choix` : sans objet, voir plus haut.

## Captures ouvertes (L12)
- `img/q1-b.png`, `img/q1-c.png`, `img/q1-d.png`, `img/q1-b-sombre.png` ;
- `img/q2-b-arrivee.png` (avant et après la retouche de marge), `img/q2-c-arrivee.png`, `img/q2-d-arrivee.png`,
  `img/q2-b-arrivee-sombre.png` ;
- `controle-haut.png`, `controle-page.png`, `controle-ordinateur.png`, et la section 2 à 1280 px (scratchpad).

Retouches faites après les avoir regardées :
- D avait « Garder » en noir plein, soit deux actions noires avec Confirmer. Les deux boutons sont maintenant neutres.
- Dans B, le nom barré touchait le pointillé : j'ai ajouté 4 px en haut.
- B de la question 1 : les valeurs sont maintenant en bleu, sinon le fond pâle passait pour un gris.
- Les états identiques après le geste remplissaient deux rangées de vignettes grises. Ils sont regroupés en une ligne commune.

## Boosters UX (boosters-ux)
- Puce « ↻ N corrigées » (suivre, filtrer) : elle compte la ligne du cas dans Q1, et dans Q2 B et D. C'est sa maquette ; rien de neuf.
- « Somme ≠ imprimé » (vérifier) : garder la ligne fait aussitôt passer la preuve en attention. C'est le chiffre qui lui dit qui a raison
  (B8, honnête).
- Garder / Retirer (déclencher) : deux mots avec une icône, des cibles de 26 px. En D, ils sont au pouce.
- B2 : une seule action noire (Confirmer) dans chaque vue. B3 : aucune phrase ajoutée dans un écran, un ou deux mots au plus
  (« non relue », « neuve »). B6 : les chiffres en IBM Plex Mono.

## Doutes
- Q1 B et C : le bleu des corrections est proche de la teinte de la bande Levures, qui est juste dessous ici, surtout en sombre. La page le
  dit dans la limite de l'avis.
- Q2 B et C : le pointillé de la rangée recouvre le filet de famille à gauche (outline à −2 px). La famille se lit encore par la bande.
- « non relue » est mon mot pour « absente de la 3e lecture ». Il peut en préférer un autre.
- D : le bandeau ne gère qu'une ligne non relue. S'il y en a plusieurs, il faudrait « 2 non relues », qui filtre. Ce n'est pas dessiné.

## Prédiction
« B pour les deux, c'est logique avec le bleu. Le C jaune pas mal aussi, mais je veux pas qu'elle compte si l'IA pense qu'elle existe pas ;
et le bandeau D prend de la place. »

DÉCISION À PRENDRE : aucune. L'option par défaut de Confirmer sans trancher (elle part en B et D, elle reste en C) fait partie de chaque
option et est écrite dans sa tête de colonne.

CONNAISSANCE : aucune.

LEÇON PROPOSÉE : quand plusieurs options mènent au même état après un geste, montrer cet état une seule fois, dans une ligne commune, plutôt
que par option en « = X » grisé : deux rangées de vignettes grises ne disent rien de plus (vu ici, section 2 avant la retouche).

## Reprise 1 (02.11, verdict e-t13, `critique/VERDICT-l2-lignes.md`)
Les sections plus haut décrivent la v0. Ce qui change :
1. **Majeur 1, Q1 : l'en-tête reste celui de sa maquette.**
   - L'imprimé vaut 46,40 dans les quatre vues de Q1, au pixel.
   - La somme des lignes dit l'écart : « Somme ≠ imprimé 48,00 » en attention, la même forme que la vue après « Garder » de Q2.
   - Aucun en-tête corrigé n'est dessiné : c'est la page de la voie l3-cas.
   - Dans `outils/gen.mjs`, `Q1 = { sommeKo: '48,00', … }` remplace `total: '48,00'`.
   - La signature d'`ecran(o)` n'a pas changé (mêmes clés, aucune ajoutée ; `--identite` le prouve).
2. **Majeur 2, Q1 B : la marque des corrections est sur la rangée.**
   - On voit le « ↻ » de la puce devant le nom, puis le nom, l'α et le montant en bleu (les quantités l'étaient déjà).
   - Le fond bleu reste, l'option reste B.
   - En sombre, le fond est encore proche de la bande Levures. La rangée ne se lit plus comme un en-tête de bande pour autant : elle a
     son ↻, son texte bleu et un poids normal, contre le gras de la bande.
3. **Mineurs :**
   - « non relue » devient « pas retrouvée » (2 C, bandeau de 2 D).
   - Le pointillé commence après le filet de famille (2 B, 2 C). C'est un pseudo-élément dans la boîte de remplissage, à la place de
     l'outline à −2 px.
   - En 2 C, « 1,70 » revient dans la colonne des montants : ✓ et ✕ (24 px) passent sous le nom, à côté de « pas retrouvée ».
   - La tête de D dit « Plusieurs : une question à la fois (« 1/2 ») ». Les têtes de 1 B et de 2 C suivent ces changements.
   - La limite « rangée bleue proche de Levures » est retirée de l'en-tête de la page, puisqu'elle est levée.

### Sorties rejouées
- `HAUT=700 node outils/gen.mjs --identite` → `IDENTITE OK (15347 octets, HAUT=700)`.
- `node outils/mesure-a.mjs` → `MESURE-A OK`.
  - q2-a : 3 pixels isolés, du lissage, aucune boîte de plus de 2 px.
  - q1-a : plus aucune boîte sur le total, l'en-tête 46,40 est au pixel. Les 14 boîtes restantes sont toutes des nombres que la ligne
    change :
    - « 7 » → « 8 » lignes (x 312–319, y 88–97) ;
    - les segments de la barre (y 114–121) ;
    - la preuve « Somme = imprimé » → « Somme ≠ imprimé 48,00 », icône comprise (x 18–200, y 145–158), et 7/7 → 8/8 ;
    - 6 → 7 reliés, 3 → 4 corrigées ;
    - la bande Houblons (3, 100 g, 8,20).

    Le reste, ce sont des points de 1 px.
- `controle-page-choix.mjs … --min=3` :
  - `ligne-ajoutee : OK (3 variantes, 4 par rangée à 1280, 2 à 390)` ;
  - `ligne-non-relue : OK (3 variantes, 4 par rangée à 1280, 2 à 390)` ;
  - `PAGE-CHOIX OK (2 choix)`.
- `verifier-page.mjs … --page-lot` → `PAGE OK (12 images chargées, lisible à 390 et 1280 px, sans erreur)`.

### Captures rouvertes (L12)
`img/q1-a.png`, `img/q1-b.png`, `img/q1-b-sombre.png`, `img/q2-b-arrivee.png`, `img/q2-c-arrivee.png`, `img/q2-d-arrivee.png`,
`controle-ordinateur.png`.

### Pour le pilote
- **Si le brasseur choisit 2 C** : il faudra lui demander s'il prend le jaune, ou le fait que la ligne reste et compte. La page ne le dit
  pas, comme le verdict e-t13 le demande.
- **`git status` montre `src/ui/depense/Entete.tsx` modifié.** Ce n'est pas cette voie : aucune de mes commandes n'écrit hors de
  `choix-lignes-38/`. C'est sans doute la voie r4-port-d, qui travaille en même temps.
- **Une commande de shell a exécuté par erreur les noms de commande entre accents graves de mon texte.** Elle a seulement relancé
  `gen.mjs`, qui a réécrit les mêmes maquettes, et deux contrôles en lecture seule. Aucun autre fichier n'a été touché.

LEÇON PROPOSÉE (reprise) : celle de e-t13. Une mini maquette qui change un nombre de l'en-tête de sa maquette pour faire tomber ses sommes
doit marquer ce changement, ou garder l'en-tête et laisser la preuve dire l'écart.
