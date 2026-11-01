# z2b — le verre complet (passe 2 de z2, 31.10)

OK — z2b : z2 gardée (verre, couches, fils vers les lignes) ; greffes r3, u3, r4, z1 ; 3 corrections faites ; 8 grains à 0,99 écran

- **Base** : `v0/z2`, 2e du tri, retenue par le critique ; `v0/z2` n'est pas touchée.
- **Reconnaissable** : le panneau gris, le verre à gauche avec ses couches hachurées « ? » reliées par un fil tireté à leur ligne, les
  lignes blanches à droite (nom, moment, part, masse tapable), la marque ambre « n couleurs à renseigner », la famille qui tourne.

## Les trois corrections
1. **Les cartes EBC sous le verre ont disparu.** L'EBC est sur la ligne, dans la pastille : « ● 3,5 » (pilule teinte + valeur), ou « ◌ ? »
   tiretée quand elle manque. Chaque chiffre une fois (J4) : capture `z2b-couleurs.png`.
2. **La carte « Volume 30 L » est retirée.** Le rendement reste, replié, « 75 % repère », sur une ligne.
3. **Le verre grandit avec la liste** : sa hauteur suit la colonne des lignes (300 px au moins). À 8 grains (`#huit`, `z2b-huit.png`) il fait
   560 px ; les quatre couches sous 18 px (0,3 · 0,25 · 0,2 · 0,1 kg) gardent leur « ? » **dans la marge gauche**, espacés de 14 px, reliés à
   leur couche par un trait, sans descendre sous le fond du verre (4 « ? » en marge, comptés par le script).

## Greffes reçues
| greffe | de | dans z2b |
|---|---|---|
| graduation en kg le long du verre ; le niveau du moût ; l'ajout dans le vide au-dessus | r3 | graduation 0–10 kg à gauche (0–S, S = total + 2 kg, par 2 kg ; par 5 au-delà de 10) ; les couches ont la hauteur de leur masse, de haut en bas dans l'ordre de la recette (Pilsner en haut, comme z2 : « le Pilsner en bas ??? ») ; le champ « + Ajouter… » est en haut de la colonne, au niveau du vide |
| échelle des teintes 0–40 EBC, plage du style, mot de la teinte | u3 | barre verticale à droite du verre, 4 bandes paille → cuivrée, trait noir = plage du style 6–14 (NEIPA), repère de la bière quand l'EBC existe, le mot « Paille » en tête ; « — » tant qu'il manque |
| règle des teintes tactile | u3 | dans le plateau : bande logarithmique 1–1500 EBC, curseur, champ EBC ; le doigt pose la couleur (`z2b-couleur-pendant.png` → `-apres.png`, Weizenmalz hell 4,0 EBC) |
| plateau de pesée de la couche touchée | r4 | **en clair** (la critique sur le noir) : nom, moments en segments, ×, − / 1,5 kg / +, piste 0–S en kg (pouce noir de r4-a), règle des teintes, J+n si fermentation. Il s'ouvre au toucher d'une ligne (sur la masse) ou de la pastille (sur la couleur), et à Entrée après un nom |
| « Créer « X » · sucre : à l'ébullition » ; « déjà là : X, la masse change » | z1, u2 | sous le champ, dès 2 lettres (`z2b-clavier-pendant.png`) ; un doublon renvoie à la ligne existante |
| marque « n couleurs à renseigner » qui ouvre la première ; Entrée passe à la suivante | u1, z1 | la marque ouvre le plateau sur le premier grain sans couleur, champ EBC ciblé ; Entrée va au grain suivant sans couleur |
| J+0…14 tapable | z4 | dans le plateau, quand le moment est fermentation ; sur la ligne : « fermentation J+3 » |

## Baseline (J12, J5), cochée
- [x] en-tête, fil, bandeau, pied, + flottant, tels quels (le + ne recouvre rien : le champ est en haut de la figure, D164).
- [x] ligne : nom, moment, part, masse · [x] 5 familles · [x] famille figée (le plateau change le moment, pas la famille) · [x] masse à zéro à
  l'ajout (joué : « Dextrose », Entrée → 0,0 kg, plateau ouvert, focus « Masse de Dextrose, en kilogrammes (plateau) », « 0,4 » → 0,4 kg,
  5 % ferm., à l'ébullition) · [x] jour d'ajout en fermentation (plateau et ligne) · [x] lactose et densité (annexe) · [x] clavier : nom,
  Entrée, masse ; ↑↓ sur chaque masse ; Échap rend la valeur d'avant.
- Honnêteté : hachures et « ? » par grain inconnu ; EBC « — » puis « ~7,6 » (Morey, `beerColor.ts`) ; le mot de teinte « — » puis « Paille » ;
  OG « — » comme l'app ; « 75 % repère » ; stock 0 mot ; la plage du style 6–14 est celle que u3 affichait (NEIPA), à confirmer au port.

## Boosters UX (boosters-ux)
- Boosters : `verre-en-couches` (lire) · `echelle-des-teintes` (lire : ma bière face au style) · `champ-toujours-pret` (déclencher) ·
  `famille-qui-tourne` (choisir) · `pastille-ebc` (déclencher : ouvre la couleur) · `plateau-de-la-couche` (ajuster) · `piste-kg` (ajuster :
  le verre et le bandeau suivent le pouce sans reconstruire la liste) · `regle-des-teintes` (ajuster) · `couleurs-a-renseigner` (déclencher).
- B1 OK · B2 OK (le verre domine, un aplat noir) · B3 OK (67 mots au repos) · B4 OK · B5 OK · B6 : 12/14/16 au repos, 32 px dans le plateau
  ouvert (écart voulu : grande lecture de r4-a) · B7 OK (CONTRASTE OK, pire 5,21:1) · B8 OK (vide, lactose, mangue J+3, densité : annexe
  repliée `<details>`) · B9 OK (plateau : retour immédiat, pouce 34 px) · B10 OK (0 `type="number"`) · B11 OK (« trois couches, toutes
  inconnues, 8 kg sur 10 ; ma bière n'a pas encore de teinte face au style ») · B12 OK (STANDARD OK) · B13 OK.
- Écarts voulus : B6 (32 px dans le plateau) ; le noir du plateau de r4 n'est pas repris.

## Contrôles (`--profil=sans-houblons`, depuis la racine)
- `verifier-page.mjs v1/z2b/etat.html --min-images 0` : **PAGE OK**.
- `mots-premier-ecran.mjs v1 z2b --page=etat.html --max=80 --profil=sans-houblons` : 67 mots, **MOTS OK**.
- `controle-contraste.mjs v1 z2b --page=etat.html --profil=sans-houblons` : **CONTRASTE OK** (pire 5,21:1).
- `controle-commun.mjs v1 z2b --page=etat.html --profil=sans-houblons` : mots, survol, blocs, contraste, standard, parlant, brutes **OK** ;
  au-style, fiche, trait, légende sautés ; **COULEURS ECHEC** (« 1 teinte franche, 38° ») : l'échelle des teintes est toute dans l'orangé de
  la bière, et les couleurs de sa recette manquent ; rien d'ajouté pour le contrôle. **COMMUN ECHEC 1** (couleurs seulement).
- `controle-hauteur.mjs v1 z2b --page=etat.html` : **HAUTEUR OK (1,00 écran)** (l'annexe est un `<details>` replié).
- `controle-panel.mjs z2b-repos.png z2b-huit.png` : remplissage 0,80 médian, 0 sous 0,50 ; **PANEL ECHEC** sur la seule diversité (0,94 :
  deux états de la même maquette, mesure sans objet ici).
- `captures.mjs` (puppeteer) : repos 0,68 écran ; couleurs → EBC ~7,6, « Paille » ; clavier : focus sur la masse après Entrée ; geste
  couleur : 4,0 EBC ; **8 grains : 0,99 écran** (D5), Grain 9,35 kg, 4 « ? » en marge ; 0 erreur de page.

## Captures (toutes ouvertes)
`z2b-repos.png` (390), `z2b-1280.png`, `z2b-huit.png` (8 grains), `z2b-couleurs.png`, `z2b-sucre.png`, `z2b-clavier-pendant.png` /
`z2b-clavier-apres.png`, `z2b-couleur-pendant.png` / `z2b-couleur-apres.png`, `z2b-haut.png`, `z2b-page.png`.

## Tient / casse
- Tient : les trois corrections, les greffes, 8 grains en un écran, le clavier, le geste couleur.
- Casse : avec 8 grains, « Pilsner Malz » reste à 53 % : la couche du haut occupe 5 kg sur 12 ; les quatre « ? » de la marge se serrent près du
  « 0 » de la graduation (lisibles, mais denses). Le glisser de la piste ne reconstruit la liste qu'au relâché : la part « 63 % » de la ligne ne
  bouge qu'alors (le verre et le bandeau, eux, suivent le pouce).

## Prédiction
« Le verre avec la graduation et l'échelle à côté, là on voit tout : ce que j'ai, combien, et où je suis par rapport au style. Le plateau en
clair c'est bien. »

DÉCISION À PRENDRE : la plage du style sur l'échelle (6–14 EBC) vient de u3 ; au port, elle doit venir du style de la recette (BJCP), et
« — » si le style n'a pas de plage.
CONNAISSANCE : `controle-hauteur.mjs` mesure tout le document : une annexe d'états ouverte fait échouer D5 (1,83 écran) ; en `<details>`
replié, la même page passe à 1,00.
LEÇON PROPOSÉE : aucune.
