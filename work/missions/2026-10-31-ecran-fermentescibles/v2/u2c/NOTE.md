# u2c — nom et masse d'un trait, passe 3 (31.10, relance de u2b)

OK — u2c : 7 corrections faites sur 9 (1 partielle, 1 sans objet), remplissage 0,51 ; PAGE, MOTS (80), CONTRASTE, COMMUN, HAUTEUR OK ; PANEL ECHEC sur le remplissage

- **Base** : `v1/u2b`, copiée et intacte. Seule `v2/u2c/` est écrite. Les classes neuves sont préfixées `u2c-`, celles de u2b sont gardées.
  Le code est assemblé par `split/join` (L26).
- **Chaleur** : tiède, inchangée.

## Corrections propres à u2b (VERDICTS-v1 § u2b)
1. **Une seule marque de couleur manquante par ligne** : faite. Il reste la pastille « ? ». Quand la couleur manque, la barre de part et
   le segment de la composition sont gris plein (`#C4C4C4`), sans hachure. Les sacs de l'étagère sans couleur sont aussi gris plein
   (`cap-recette`, `cap-huit`). La marque « n couleurs à renseigner » reste en tête, au bout de la composition.
2. **L'étagère se replie quand elle est vide** : faite. Sans sac à proposer, elle est masquée : plus de « — » seul sous le picto du
   stock (`cap-huit`, « étagère repliée » dans `captures.txt`).
3. **L'échelle des teintes de u3 sous la composition** : faite. C'est l'échelle de u3 couchée : 0 à 40 EBC, en quatre bandes nommées
   (Paille, Dorée, Ambrée, Cuivrée). La plage du style (21C, EBC 6–14) y est marquée d'un crochet noir. Un trait noir se pose à l'EBC de
   la bière. À droite, le mot de la teinte et « dans le style ». Tant qu'une couleur manque, rien ne se pose sur l'échelle : « — » et
   « teinte » (`cap-recette`, puis `cap-couleurs` et `cap-couleur-apres` : 7,3, Paille, dans le style).

## Commun aux trois
4. **Remplissage ≥ 0,80 au repos** : partielle. `controle-panel` mesure 0,51 (`cap-recette` 0,505, `cap-couleurs` 0,514). u2b était à
   0,42. Le contenu descend maintenant jusqu'au pied : bas du pied à 0,95 écran, contre 0,73 pour u2b. Pour étalonner, la même mesure
   donne 0,54 sur `r4-a/g1-ebullition-repos.png`, sa référence. Le contrôle ne compte que les lignes encrées : les fonds de carte
   `#F5F5F5` et les interlignes ne comptent pas. Avec de l'information réelle, 0,80 voudrait dire plus de texte : le premier écran est
   déjà à 80 mots, le plafond. Écart signalé, il n'est pas comblé par du remplissage.
   - Ce qui a été ajouté : l'échelle des teintes (3) et la carte de repères à la r4-a. La carte est une carte claire. Elle porte en tête
     « Rendement 75 % » et sa pastille « repère ». En dessous, « OG attendue » avec un grand « — » à droite, puis une piste de 1,040 à
     1,100, graduée par 0,005, avec la plage du style « style 1,060–1,085 ».
   - L'OG reste « — » comme le bandeau de l'app : `yeastRecipeComputedOg` n'a pas de potentiel pour ces grains, et aucun chiffre n'est
     inventé. L'annexe le dit.
   - L'EBC et le mot de teinte ne sont pas répétés dans la carte : ils sont dans l'échelle, juste au-dessus. Un chiffre n'est dit qu'une
     fois.
   - La carte est dépliée jusqu'à 4 lignes (sa recette, puis avec le sucre) et repliée au-delà, en « Rendement 75 % repère OG — ». Un
     toucher l'ouvre.
5. **Sucre comme l'app** (`BrewWizard.tsx`, l. 2573-2576) : faite (`cap-sucre`, `cap-lactose`).
   - Un grain se lit « nom · moment », puis la barre et « NN % du grain ».
   - Un sucre ou un autre se lit « nom », puis la pastille de famille (« Sucre », « Lactose », « Fruit »), le moment en mot
     (« ébullition », « J+3 ») et « NN % ferm. ». La fermentescibilité est celle de `KIND_DEF` : sucre 100, lactose 0, fruit 90,
     extrait 75.
   - La masse est toujours à droite.
6. **Marque « n couleurs à renseigner », 12 px** : déjà faite dans u2b, inchangée (« 5 couleurs à renseigner » à 8 grains).
7. **Rien de tronqué** : faite. Les noms passent à la ligne au lieu d'être coupés. Une masse sous 1 kg s'écrit à deux décimales
   (« 0,40 », « 0,50 ») et tient dans son champ. Le fruit de l'état lactose devient « Purée de mangue » (J+3). La sonde de
   `capturer.mjs` (scrollWidth > clientWidth sur noms, masses, pastilles et moments) trouve « tronqués aucun » dans les 6 états.
8. **Piste à l'échelle de l'ingrédient** : sans objet. u2 n'a pas de piste de masse : la masse se tape d'un trait (« pils 5 »), ou au
   champ avec ↑ ↓. En ajouter une serait un concept neuf, hors des corrections demandées.
9. **Annexe hors du premier écran, à 390 et à 1280** : faite. L'annexe est un `<details>` replié, comme celle de z2b, qui commence à
   850 px dans tous les états (849 px pour la recette vide). L'écran fait 844 px à 390 et 800 px à 1280.

Pour qu'elle tienne à 1280 (le pied et le + ne recouvrent plus la carte), la page passe en deux colonnes sur ordinateur, au-delà de
1000 px. À gauche : la saisie, les familles, l'étagère et la facture. À droite : la composition, la teinte et les repères
(`cap-1280`). Au téléphone, une seule colonne, dans cet ordre : composition, teinte, saisie, familles, étagère, facture, repères, pied.

## Contrôles (31.10, sur `v2 u2c`)
- `verifier-page v2/u2c/etat.html --min-images 0 --captures v2/u2c/verif` : **PAGE OK** (0 image chargée, 390 px, sans erreur).
- `mots-premier-ecran v2 u2c --max=80 --page=etat.html` : **u2c 80 mots, MOTS OK**.
  - Au premier essai : 90 mots. Retirés : le titre « Repères », « · 30 L », les quatre étiquettes de graduation et « potentiels ? »
    (passés en aria et dans l'annexe).
  - Sans `--page=etat.html`, le contrôle cherche `index.html` et rend MOTS OK à vide (faux vert, M10).
- `controle-contraste v2 u2c --page=etat.html` : **CONTRASTE OK**, 75 textes, le pire « Grain » à 5,27:1.
- `controle-commun v2 u2c --page=etat.html --profil=sans-houblons` : **COMMUN OK**. Au premier essai, STANDARD ECHEC (S3, un rayon de
  2 px sur le crochet du style), corrigé.
- `controle-hauteur v2 u2c --page=etat.html` : **HAUTEUR OK (1,04 écran)**. Au premier essai, 1,61 écran, parce que l'annexe était
  ouverte : elle est maintenant en `<details>`.
- `controle-panel cap-recette.png cap-couleurs.png` : **PANEL ECHEC**.
  - Le remplissage est à 0,51 (voir 4).
  - La diversité est sans objet : ce sont deux états d'une même maquette.
- Bas du pied, par état (`captures.txt`) : repos 0,95 · couleurs 0,95 · sucre 0,94 · lactose 0,92 · **8 grains 0,98** · vide 0,41.
  Débord 0 partout, 0 erreur de script.

## Captures (ouvertes une à une)
`cap-recette.png` (repos 390), `cap-1280.png`, `cap-couleurs.png`, `cap-couleur-apres.png` (geste 3,5 · 4 · 2 : EBC 7,3, le trait se
pose), `cap-sucre.png`, `cap-lactose.png`, `cap-huit.png`, `cap-vide.png`, `verif-haut.png`, `verif-page.png`.

## Ce qui tient, ce qui casse
- Tient : au repos, sa recette n'est plus hachurée. La couleur face au style se lit sous la composition. Le sucre suit la règle de
  l'app.
- Casse : le remplissage reste loin de 0,80 à la mesure du panel. La carte de repères porte un « — » tant que l'app n'a pas les
  potentiels : il pourrait demander « à quoi sert une piste vide ? ».

DÉCISION À PRENDRE : le seuil de 0,80 avec `controle-panel` (lignes encrées) n'est atteint par aucune page de cette langue, r4-a
comprise (0,54). Il faut soit un seuil étalonné sur r4-a, soit une autre mesure (bas du pied, à 0,95 ici).
CONNAISSANCE : `mots-premier-ecran.mjs` lit `index.html` par défaut : sur une maquette `etat.html`, il faut `--page=etat.html`, sinon
il rend MOTS OK sans rien compter.
LEÇON PROPOSÉE : aucune.
