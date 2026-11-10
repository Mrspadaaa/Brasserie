P3A OK — corrections du critique faites : unité sur chaque ligne, numéros après le compte ; COMMUN, MOTS, LIGNES OK

## Corrections du critique (`critique/VERDICTS-v3.md`, 01.11)
La source est `p3a-1/etat.html` ; p3a-2 et p3a-3 en sont régénérées (`CFG` différent).
1. **L'unité sur chaque ligne** : « 6 Kg », « 40 g », « 2 Stk », « 30 ? » pour Sabro. Les moutures aussi (« 6 Kg »). Dans p3a-3, la
   seconde rangée la portait déjà (« 40 g × 0,040 ») ; ses moutures la prennent à droite.
2. **La preuve, le compte d'abord** : « 2 bis ④ ⑥ », « 1 unité ? ⑤ », « 5 moutures +1,50 ③ ». Le code est commun : le changement vaut
   pour les trois variantes.
3. **p3a-3** :
   - le filtre dit « 2 bis · 21 masquées » ; la forme est générale (« n <compte> · 23−n masquées ») ;
   - 2 px d'air entre les deux rangées d'une ligne (`margin-top` passé de −3 à −1 px).
4. **p3a-2, Services** :
   - l'en-tête dit « Services (5) … 1,50 » : plus de « 15 Kg », ce ne sont pas des kg achetés ;
   - chaque mouture nomme son malt sur sa pastille (« Maris Otter ») ;
   - « Rattacher les 5 à leur malt » passe sous l'en-tête du groupe : à 390, le nom du malt était coupé en « M ».
5. **« LALLEMAND Windsor » en entier à 390** :
   - les noms ne sont plus coupés par « … » ;
   - un nom long passe à la ligne. C'est le cas dans p3a-2 (tableau) et en ordre du papier : « LALLEMAND / Windsor », « LALLEMAND /
     Verdant IPA ». En catégorie, p3a-1 et p3a-3 le tiennent sur une ligne.
- Une régression, prise au contrôle et réparée : un `++` laissé par une coupe empêchait le script de se lancer (PAGE ECHEC, 0 mot).
- **Contrôles rejoués** :
  - `controle-commun … p3a-1 p3a-2 p3a-3 --page=etat.html --profil=sans-houblons --sans-lignes` → COMMUN OK ;
  - `mots-premier-ecran … --max=100 --sans-lignes` → 51, 54 et 51 mots, MOTS OK ;
  - contraste → CONTRASTE OK (pire 5,24:1) ;
  - `verifier-page` → PAGE OK ×3 ;
  - `compter-lignes` → p3a-1 **a=12 b=18**, p3a-2 **a=11 b=18**, p3a-3 **a=12 b=16** (l'air ajouté coûte une ligne ; plancher tenu,
    sans marge) ;
  - CAPTURES OK 17 ×3.
- **Captures ouvertes** : repos et defile des trois ; papier et renvoi de p3a-2 ; renvoi de p3a-3.

## Passe 3b (ce qui suit est l'état d'avant les corrections du critique)

## Base mesurée
`compter-lignes.mjs` sur l'app servie : `scripts/with_server.mjs`, port 5631, `?dev-local&depense=3`, `[data-purchase-line]`, le 01.11.
**LIGNES base a=7 b=10**, écrit dans `v3/p3a-1/base-lignes.json`.

## Passe 3b (pilote, 01.11) : ce qui a été corrigé
La source est `p3a-1/etat.html`. p3a-2 et p3a-3 en sont régénérées : préfixe des classes changé, `CFG` différent.
1. **Captures restantes ouvertes, trois défauts trouvés et corrigés** :
   - **Lecture en cours** : « Pour quoi ? », le fournisseur et la référence s'affichaient remplis alors que rien n'était lu (chiffres
     montrés comme lus). Seuls restent « Pour quoi ? · à taper » et « Règlement · Déjà payé · À payer » (r2b, état 1).
   - **Ordre du papier** : sur la mouture n° 2, « Mout… » était tronqué et « Rattacher les 5 » passait sur deux lignes. Le mot redondant
     est retiré (la pastille dit « mouture ») et les boutons ne se coupent plus.
   - **Annexe** : elle citait encore une ligne « dépense précédente » du journal, retirée au tour d'avant. Le texte est corrigé.
2. **p3a-2, la colonne prix** : chaque prix garde le chiffre imprimé (0,040 comme 0,0800), en deux parties. La partie entière est calée
   à droite, les décimales à gauche sur 4 caractères : les virgules s'alignent et la colonne garde 52 px (`p3a-2-defile.png`).
3. **p3a-3, le filtre** : la bande du groupe donne le sous-total des lignes filtrées, et le dit : « Houblons 2/7 · 70 g · 2,95 »
   (40 + 30 g ; 1,60 + 1,35) (`p3a-3-renvoi.png`).

## Contrôles (01.11, depuis la racine, les trois variantes)
- `controle-commun … p3a-1 p3a-2 p3a-3 --page=etat.html --profil=sans-houblons --sans-lignes` → **COMMUN OK**, sans `--sans=mots`.
  mots, couleurs, survol, blocs, contraste, standard, parlant et brutes sont OK.
- `mots-premier-ecran … --max=100 --sans-lignes` → p3a-1 51, p3a-2 54, p3a-3 51 mots → **MOTS OK**.
- `controle-contraste … --profil=sans-houblons` → **CONTRASTE OK** (pire « TVA » 5,24:1).
- `verifier-page <etat.html> --min-images 0` → **PAGE OK** ×3.
- `compter-lignes.mjs` → **LIGNES OK** ×3 :
  - p3a-1 : **a=12 b=18** ;
  - p3a-2 : **a=11 b=19** ;
  - p3a-3 : **a=12 b=17**.
- `capturer.mjs <id>` → **CAPTURES OK 17** ×3 (refaites après les corrections).

## Captures ouvertes
- **p3a-1** :
  - états : repos, defile, renvoi, regle, tous, papier, envoi, echec, rouvert, lecture (avant et après la correction), horsligne, annexe ;
  - gestes : geste-tva, geste-plateau ;
  - à 1280 : 1280-repos, 1280-echec.
- **p3a-2** : repos, defile (avant et après l'alignement), renvoi, echec, recu, papier (avant et après), 1280-repos.
- **p3a-3** : repos, defile, renvoi (avant et après), echec, tous, 1280-echec.
- Pas ouvertes, parce que leur code est le même que celui de p3a-1 (seul `CFG` change, et il ne les touche pas) : lecture, rouvert,
  horsligne, annexe, regle et les gestes de p3a-2 et p3a-3.

## Les variantes
- **p3a-1, froide** :
  - sous-totaux collants, une rangée de 32 px par ligne, renvoi par défilement et éclair, la mouture sous son malt ;
  - échec Drive : un bandeau rouge sur Finances, puis la dépense rouverte sur le justificatif.
- **p3a-2, tiède** :
  - un tableau qté · prix · CHF (prix alignés sur la virgule), des groupes repliables, les moutures dans Services ;
  - le renvoi plie les autres groupes ;
  - échec Drive : une carte flottante ; réussi : un reçu qui s'efface.
- **p3a-3, tiède** :
  - des bandes teintées et un liseré par ligne, deux rangées à la r1 ;
  - le renvoi filtre, avec le sous-total filtré ;
  - échec Drive : une pastille « Drive ✕ » qui reste, et un toast qui ne part pas seul.

## Ce qui tient, ce qui casse
- **Tient** :
  - le récap qu'il a entouré reste en haut, ouvert d'office ;
  - 11 à 12 lignes au premier écran (base : 7) et 17 à 19 une fois défilées (base : 10) ;
  - aucune unité n'est additionnée en silence (« 270 g + 30 ? ») ;
  - quand tout est réglé, le prix au kg mouture comprise est juste (Pilsner : (7,50 + 0,50) / 5 = 1,60) ;
  - rien sur Drive avant Confirmer, et Confirmer n'est jamais bloqué.
- **Casse (mineur)** :
  - à 390 en ordre du papier, « LALLEMAND Windsor » se tronque devant sa pastille « = 2 sachets » ;
  - dans Services (p3a-2), le nom du malt de la mouture se tronque (« Mari… »).

## Fichiers écrits (dans le Possède)
- `v3/p3a-1/` : `etat.html` (la source), `NOTE.md`, les scripts `compter-lignes.mjs`, `lignes-commun.mjs`, `capturer.mjs`,
  `mots-detail.mjs`, puis `base-lignes.json` et 17 captures.
- `v3/p3a-2/` et `v3/p3a-3/` : `etat.html`, `NOTE.md`, `compter-lignes.mjs` et 17 captures chacun.
- `v3/p3a-RESULTAT.md`.

## Prédiction du brasseur
p3a-1 : « là je vois mes lignes et combien de houblon j'ai pris ». p3a-2 lui plaira s'il vérifie les prix. p3a-3 est la plus proche des
pastilles de r1 qu'il aime, mais aussi la plus longue.

DÉCISION À PRENDRE : aucune.

CONNAISSANCE : aucune (le `--sans-lignes` de `controle-commun.mjs` règle le point du tour d'avant).

LEÇON PROPOSÉE : quand un brief pose à la fois « le maximum de lignes » et un plafond de mots au premier écran, chiffrer le conflit dès le
cadrage : mots par ligne × lignes visibles + mots du récap.
