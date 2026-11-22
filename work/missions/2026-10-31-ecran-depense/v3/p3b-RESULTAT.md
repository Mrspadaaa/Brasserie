P3B OK — critique 3c : « mouture » partout, Règlement gris, Windsor entier, nav de l'app, ④⑥

La série p3b (01.11) compte une variante tiède et deux chaudes.
- Base : r2b telle qu'elle est portée dans l'app, reprise comme plancher. Elle comprend le récap en haut, ouvert d'office, les pastilles de r1, et les six points réglés chacun sur sa ligne.
- Je n'ai rien écrit hors de `v3/p3b-*`, rien dans `v3/p3a-*`.

## Corrections du critique (3c, `critique/VERDICTS-v3.md`, 01.11)
Toutes passent par `p3b-1/retouche-3c.mjs` (split/join, aucune regex ; sortie `RETOUCHE OK 3 pages`).
1. **D90, le mot « mouture » sur chaque mouture :**
   - p3b-1 : la pastille en tirets « mouture » est sur chaque sous-ligne. « Tout rattacher » n'est que sur la première. Le « ↑ » est devenu le mot « rattacher ». Une mouture réglée affiche « mouture ✓ », une mouture laissée en service « mouture · service ».
   - p3b-3 : la pastille porte « ↳ mouture 0,60 », et « ↳ mouture 0,60 ✓ » une fois réglée.
     - Écart au critique, qui donne « ↳ mouture ✓ » : j'ai gardé le montant, pour que la rangée du malt dise toujours ce que coûte sa mouture.
     - Le pilote peut retirer le montant d'une ligne dans le script.
2. **Pendant la lecture, « Déjà payé » et « À payer » sont gris tous les deux** dans les trois variantes : aucun n'est choisi, `aria-pressed="false"`.
3. **« LALLEMAND Windsor » s'affiche en entier à 390.**
   - p3b-1 : la pastille « = 2 sachets » passe à la ligne (classe `-nmw`).
   - p3b-2 et p3b-3 : il tenait déjà. Captures vérifiées.
   - **La navigation de l'annexe Finances est celle de l'app** (`BottomNav`) : Bord, Finances, Brassins, Stocks, Clients, avec leurs icônes lucide à 16 px et les libellés à 12 px. L'onglet actif a un trait de 2 px en haut et un fond teinté. Largeur bornée à 448 px.
   - Le trait des icônes est recalculé selon le viewBox (24) pour rester à 1,5 px (STANDARD S4).
4. **p3b-1, greffe de p3a-1 :** les numéros des points sont à côté de leur compte dans la preuve, « 2 bis ④ ⑥ », « 1 unité ? ⑤ », « 5 moutures +1,50 ③ ». Un numéro part quand son point est réglé.

## Passe 3b (consigne du pilote, 01.11)
1. **Les comptes du récap ont retrouvé leurs mots, dans les trois variantes, sous la forme de r2b** : « 13 reliés · 2 nouveaux · 2 bis · 1 unité ? · 5 moutures +1,50 ».
   - Le « +1,50 » reste tant que les moutures ne sont pas réglées.
   - Ce n'est plus un écart.
2. **p3b-1 : la bande Houblons tient sur une ligne à 390** (« 270 g · 30 ? » ; colonne `auto`, sans retour à la ligne).
3. **p3b-3 : le rail a une étiquette.** Un libellé vertical « 23 lignes » est posé au-dessus du bouton « n° », sans `title`.
   - Le rail suit aussi l'ordre affiché : par catégorie, chaque mouture juste après son malt.
   - Avant, il suivait l'ordre du papier, et ses couleurs ne correspondaient pas à la liste.
4. **Captures ouvertes, défauts trouvés et corrigés :**
   - Toutes les variantes, état « lecture en cours » : les rubriques affichaient des données de la facture pas encore lue (« Brau- und Rauchshop GmbH », « 372765 », « Détail 86,50 / 86,50 »), ce qui est malhonnête.
     - Corrigé : « à lire » et « à taper », plus le Règlement (Déjà payé / À payer) déjà utilisable. Le « Détail » est retiré.
   - p3b-2, état papier : la tuile était cassée (nom sous le picto, montant collé).
     - Corrigé : la grille a quatre colonnes (n°, picto, nom, montant).
   - Toutes les variantes, à 1280 : le récap collant recouvrait les rubriques quand on défilait.
     - Corrigé : le récap n'est plus collant à 1280.
   - p3b-2 et p3b-3, à 1280 : le journal Finances s'étalait sur toute la largeur. Corrigé : il est borné à 820 px.

## Par variante
| | p3b-1 le registre (tiède) | p3b-2 les tiroirs (chaude) | p3b-3 l'index (chaude) |
|---|---|---|---|
| Idée | registre en colonnes, bandes teintées collantes | tiroirs repliables chiffrés, tuiles 2 par rangée | une rangée par ligne, sous-totaux collants, rail des 23 lignes |
| Renvoi | filtre temporaire | pliage des autres groupes | défilement + éclair, pas « 1/2 › » |
| Mouture | sous son malt | groupe Services | pastille sur la rangée de son malt |
| Échec Drive | carte flottante au-dessus de la nav | pastille rouge sur le journal + toast | bandeau plein en haut |
| Réussi | reçu discret, part en 3 s | rien | rien |
| LIGNES | a=12 b=20 | a=9 b=20 | a=14 b=23 (pastilles de mouture comptées) |

Base dans l'app servie (`with_server.mjs`, `?dev-local&depense=3`, `[data-dp-ligne]`, 01.11) : `LIGNES a=7 b=12`, gardée dans `base-app.json`.

## Contrôles (01.11, après les corrections 3c, depuis la racine)
- `controle-commun … --profil=sans-houblons --sans-lignes` : COMMUN OK pour les trois.
- `mots-premier-ecran … --profil=sans-houblons --max=100 --sans-lignes` : 53 / 49 / 49 mots, MOTS OK pour les trois. Les numéros ④⑥⑤③ ajoutent 4 mots à p3b-1.
- `controle-contraste` : 175 / 173 / 162 textes, pire cas « TVA » à 5,24:1, CONTRASTE OK pour les trois.
- `scripts/agents/verifier-page.mjs … --min-images 0` : `PAGE OK (0 images chargées, 390 px, sans erreur)` pour les trois.
- `compter-lignes.mjs` : LIGNES OK pour les trois.
  - b = 20 / 20 / 23, pour un minimum de 16.
  - a = 12 / 9 / 14, contre 7 pour la base.
- `capturer.mjs` : CAPTURES OK 16, pour chaque variante.

## Captures ouvertes après les corrections 3c
- p3b-1 : repos, defile (Windsor entier), lecture (les deux gris), regle.
- p3b-2 : repos, defile, lecture, echec (nav de l'app).
- p3b-3 : repos, defile (« ↳ mouture 0,60 »), lecture, regle.

## Captures ouvertes à la passe 3b (L12), après correction
- p3b-1 : repos, defile, renvoi, echec, rouverte, tous, 1280-repos, 1280-renvoi.
- p3b-2 : repos, renvoi, regle, papier (avant et après correction), rouverte, lecture (avant et après), envoi, reussi, horsligne, 1280-repos, 1280-echec, 1280-renvoi.
- p3b-3 : repos, defile (avant et après le rail), echec, regle, papier, rouverte, lecture (avant et après), envoi, reussi, horsligne, 1280-repos, 1280-renvoi (avant et après), 1280-echec.
- Non rouvertes après la dernière série de corrections : p3b-1 lecture et 1280-echec (le correctif de lecture est commun aux trois), et p3b-3 renvoi à 390.

## Ce qui tient, ce qui casse
- Tient :
  - plein écran ;
  - sous-totaux vrais : Malts 18 Kg ; Houblons 270 g et 30 ?, jamais additionnés ; Levures 7 Stk ;
  - rien sur Drive avant « Confirmer » ;
  - une seule date ;
  - l'échec garde la dépense et propose deux gestes ;
  - la lecture en cours n'invente plus rien.
- Casse :
  - p3b-2 : les tuiles se lisent en Z ;
  - p3b-3 : la rangée longue touche le montant à 390 ;
  - p3b-2 et p3b-3 : l'envoi en cours ne se voit pas (choix « rien », Drive invisible). Seule p3b-1 montre un petit nuage sur la ligne du journal.

Prédiction : « Le registre, c'est ma facture et je vois tout ; le rail de l'index est malin ; les tiroirs, je n'en vois pas l'intérêt une fois ouverts. »

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : la base dans l'app mesure `LIGNES a=7 b=12` à 390 × 844 tactile (01.11, `[data-dp-ligne]`, fixture `depense=3`).
LEÇON PROPOSÉE : un état « lecture en cours » se relit rubrique par rubrique, parce qu'un rendu partagé avec l'état lu y affiche des valeurs pas encore lues (01.11, p3b : fournisseur, n° et Détail). Les contrôles ne l'ont pas vu, la capture l'a montré.
