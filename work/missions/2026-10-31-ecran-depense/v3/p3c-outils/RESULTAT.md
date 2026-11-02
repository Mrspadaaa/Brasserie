OK — p3a-3 compactée en trois degrés (p3c-1, p3c-2, p3c-3), tout au-dessus inchangé

Voie p3c (D245), concepteur Opus, 01.11. Base : `v3/p3a-3/etat.html`, copiée, puis seule la liste change. Un seul code source pour les
trois degrés (`CFG.dens` = `serre`, `une`, `pastille`) ; `p3c-2` et `p3c-3` sont des copies de `p3c-1/etat.html` où seuls `CFG` et
le titre changent. Classes `p3a3-` gardées : chaque page est seule, et le pixel au-dessus de la liste reste celui de p3a-3.

## Fichiers écrits (Possède seulement)
- `v3/p3c-outils/controle-compact.mjs` (le contrôle), `v3/p3c-outils/RESULTAT.md`.
- `v3/p3c-{1,2,3}/etat.html`, `v3/p3c-{1,2,3}/compter-lignes.mjs` (copie de celui de p3a-3, id changé), 17 captures par dossier.
- Rien d'autre : ni p3a-*, ni `src/`. `/work/missions/**` est dans `.gitignore` (l. 104) : `git status` ne montre donc pas ces fichiers.
  Un commit demandera `git add -f`.

## Le contrôle, d'abord (L13)
`controle-compact.mjs <id…>` : à 390 × 844 tactile, avec le réseau externe coupé (mêmes polices de repli pour tous), il mesure :
- a et b, avec la mesure de `p3a-1/lignes-commun.mjs` ;
- la médiane de `li[data-ligne]`, comparée à p3a-3 mesuré à l'instant ;
- INCHANGE : la capture de la zone au-dessus de la première bande, à `?etat=repos`, pixel à pixel contre p3a-3, avec la bande au même y ;
- l'absence d'en-tête de colonnes (« qté », « prix », « CHF »).

Témoins :
- `controle-compact.mjs p3a-3` → `p3a-3 : a=12 b=16 médiane=43.0 px … → a=12 ≤ 12 ; b=16 ≤ 17 ; médiane 43.0 ≥ 43.0`,
  `COMPACT ECHEC` ;
- p3a-2 → `bande à y=345 ≠ 321 ; en-tête de colonnes : qté, prix, CHF`, ECHEC ;
- p3a-1 → `a=12 ≤ 12`, ECHEC.

Note : le contrôle, réseau coupé, mesure b=16 pour p3a-3, contre b=17 dans sa NOTE. Le seuil reste 17.

## Par degré

| | p3a-3 | p3c-1 resserré | p3c-2 une rangée | p3c-3 mouture sur son malt |
|---|---|---|---|---|
| a / b | 12 / 16-17 | **13 / 19** | **14 / 20** | **17 / 23** |
| médiane d'une ligne | 43 px | **33 px** | **29 px** | **29 px** (18 rangées) |
| au-dessus de la liste | — | 0,00 % | 0,00 % | 0,00 % |

### p3c-1, resserré (« un peu »)
- Les deux rangées de p3a-3 restent : le nom et le montant, puis « 6 Kg × 2,30 » en 12 px.
- Le détail entre dans la rangée touchable, et toute la ligne ouvre le plateau. Les rangées passent à 16 et 14 px ; la marge
  intérieure passe de 3+3 à 2+1 px. Une ligne de malt fait 33 px au lieu de 43.
- La mouture tient sur 24 px, sans trait entre elle et son malt.
- Les traits entre lignes deviennent une ombre de 1 px, qui ne prend pas de hauteur. Le liseré reste.
- La bande de groupe passe de 30 à 28 px : sans ces 2 px, Target (avec sa rangée « stock ») ne tenait pas au premier écran, et
  a restait à 12. La rangée « stock / Target bis » remonte de 2 px.

### p3c-2, une rangée (« presque »)
- La rangée fait 28 px (li 29, comme p3a-2) : le nom, α, « = 2 sachets », « unité ? », puis « 6 Kg × 2,30 » en 12 px gris, dans
  une colonne fixe de 94 px devant le montant. Le × est aligné d'une ligne à l'autre, et le prix est écrit tel qu'imprimé.
- La mouture reste sous son malt, en rangée fine de 24 px (« 6 Kg × 0,10 · 0,60 »). Aucun trait ne la sépare de son malt : les deux
  se lisent comme une paire.
- Après le rattachement, le « ✓ 2,40/kg » passe sous le nom, pour ne pas écraser la rangée.
- b=20 (la voie demande b ≥ 19).

### p3c-3, une rangée et la mouture sur son malt
- Comme p3c-2. La mouture devient une pastille « ↳ 0,60 », posée sur la rangée de son malt, dans une colonne fixe juste avant
  « 6 Kg × 2,30 ».
- Son montant reste à part, jamais ajouté à celui du malt (13,80 reste 13,80).
- La pastille est la ligne : elle porte `data-ligne`. Pointillé ambre : à rattacher. Trait plein : rattachée.
- Un toucher la rattache ou la détache. « Rattacher les 5 » passe dans la bande Malts.
- Le plateau du malt ouvert montre la ligne mouture (« mouture, ligne 2 · 6 Kg × 0,10 = 0,60 · Rattacher »).
- Le filtre « 5 moutures » garde les malts et compte les moutures dans la bande. En ordre du papier, les moutures redeviennent des
  rangées, à leur place.
- Honnêteté de la mesure : a=17 et b=23 comptent les 5 pastilles, qui sont des lignes entières visibles. La médiane, elle, ne compte
  que les 18 rangées.

### Ce que les trois gardent
- Les bandes teintées et le liseré, les pastilles de r1, les sous-totaux de quantité, l'ordre et le filtre « bis 2 ».
- Des cibles de 24 px au moins, un texte de 12 px au moins, et aucun `type="number"` (grep : 0 par fichier).
- Pas de QR. Le 1280 suit le même degré.

## Sorties des contrôles (01.11, depuis la racine, état final)
- `controle-compact.mjs p3c-1 p3c-2 p3c-3` → **COMPACT OK (3)**. Les lignes sont dans le tableau ci-dessus.
- `compter-lignes.mjs` : p3c-1 `LIGNES a=13 b=19`, p3c-2 `a=14 b=20`, p3c-3 `a=17 b=23` (base a=7 b=10), **LIGNES OK** × 3.
- `controle-commun.mjs … p3c-1 p3c-2 p3c-3 --page=etat.html --profil=sans-houblons --sans-lignes` → **COMMUN OK**. Passent : mots,
  couleurs, survol, blocs, contraste, standard, parlant, brutes. Sautés par le profil : au-style, fiche, trait, legende.
- `controle-choix.mjs <v3>/<id> --ecran=depense` → `CHOIX OK (0 écran(s) conforme(s) à son choix ; 0 ouvert(s))` × 3. L'écran
  Dépense n'est pas dans `ecrans.json` ; sa base est p3a-3 (D245).
- `mots-premier-ecran … --max=100 --sans-lignes` → 51 mots, **MOTS OK** × 3 (comme p3a-3).
- `controle-contraste` → **CONTRASTE OK** × 3 ; pire « TVA » 5,24:1, sur 161, 207 et 187 textes.
- `verifier-page.mjs … --min-images 0` → **PAGE OK** × 3 (390 px, sans erreur).
- `capturer.mjs p3c-k` → `CAPTURES OK 17` × 3, sans erreur de page.

## Captures ouvertes, en plein format
- Au-dessus de la liste, avec p3a-3 en regard : `p3c-1-repos.png`, `p3c-3-repos.png`, `p3c-2-renvoi.png`, `p3c-3-renvoi.png`,
  `p3c-1-1280-repos.png` et `p3c-3-1280-repos.png`. Rien ne bouge, comme le mesure INCHANGE (0,00 %). L'échec Drive (pastille et
  toast) n'est pas touché, et son code est celui de p3a-3.
- Dans la liste : `p3c-1-defile.png`, `p3c-2-defile.png`, `p3c-3-defile.png`, `p3c-2-tous.png`, `p3c-3-tous.png`,
  `p3c-3-geste-plateau.png` et `p3c-3-papier.png`.
- Défaut vu, puis corrigé : dans `p3c-3-tous`, le « ✓ x/kg » écrasait les noms (Röstgerste, Weizenmalz) sous la pastille. Il passe
  maintenant sous le nom, comme dans p3c-2. Dans le plateau de p3c-3, la ligne mouture passait sur trois lignes ; elle est raccourcie.
- Chemins : `work/missions/2026-10-31-ecran-depense/v3/p3c-{1,2,3}/p3c-{1,2,3}-<état>.png` (13 états, 1280 repos et échec, deux gestes).

## Ce qui tient, ce qui casse
- **Tient.** Le haut est identique au pixel. Les trois degrés se lisent comme p3a-3, en plus serré.
  - p3c-2 : la colonne « qté × prix » alignée rend le calcul vérifiable d'un coup d'œil, sans en-tête.
  - p3c-3 : les malts sont un bloc de 7 rangées propres, chaque mouture visible avec son montant.
- **Casse ou à surveiller.**
  - p3c-1 : la ligne « stock : Target α 11,8 » colle au détail (2 px).
  - p3c-2 : les levures à nom long (« LALLEMAND Windsor = 2 sachets ») passent sur deux lignes, comme dans p3a-2.
  - p3c-3 : à 1280, la pastille est loin du nom (colonne fixe à droite). En état « tous », les malts rattachés reprennent deux lignes
    (le prix au kilo).
  - p3c-1 : la bande passe de 30 à 28 px (−2 px), seul écart de la bande.

Prédiction : il prend p3c-2 ou p3c-3 (« là c'est compact et c'est toujours mes bandes ») ; p3c-1 lui paraîtra trop peu changé.

DÉCISION À PRENDRE : aucune (le choix entre les degrés est le sien ; page à publier par le pilote).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune

## Retouches e-t4 (critique, `critique/VERDICTS-v3c.md`, une passe)
Comme avant, un seul source, `p3c-1/etat.html`, recopié dans p3c-2 et p3c-3 (seuls `CFG` et le titre changent). Avant de les
remplacer, les captures précédentes ont été gardées hors dépôt, dans le scratchpad, pour la comparaison.

1. **p3c-1 : 4 px entre le détail et la rangée « stock » ou « imprimé ».** La rangée `.fix` passe de `margin-top:-2px` à `3px`
   (1 px de fond de rangée + 3 px = 4 px). Pour que a reste à 13, le détail passe d'une hauteur de ligne de 14 px à 13 px : −1 px par
   ligne à deux rangées. Une ligne de malt fait 32 px ; la médiane passe de 33 à 32 px.
   - Avant, sur `p3c-1-defile.png` : « 40 g × 0,040 » touchait la pastille « Target bis ».
   - Après : un blanc net sous le détail, pour Target, Sabro et Hallertauer Blanc CH, et Target tient toujours au premier écran.
2. **p3c-2 et p3c-3, `?etat=tous` : le « ✓ x/kg » reste sur la rangée du nom quand il tient.** `.p3a3-nmc` passe d'une colonne
   à `flex-wrap:wrap` (6 px entre le nom et le prix au kilo). Il ne descend sous le nom que s'il manque de place.
   - p3c-2, `p3c-2-tous.png` : les 5 malts rattachés tiennent sur une rangée (Maris Otter … Weizenmalz hell). Avant, ils
     prenaient tous deux rangées.
   - p3c-3, `p3c-3-tous.png` : Maris Otter et Röstgerste tiennent sur une rangée. Caramünch Typ 2, Pilsner Malz et Weizenmalz
     hell passent dessous : la colonne de la pastille leur prend la place. Avant, les 5 prenaient deux rangées.
3. **p3c-3 : la pastille rattachée porte « ✓ 0,60 ».** Le ✓ remplace le picto ↳. Rattachée, la pastille et sa réserve passent de
   62 à 50 px : ces 12 px rendent le point 2 possible pour les noms courts. Non rattachée, elle reste « ↳ 0,60 » en pointillé ambre.

Rien d'autre ne change.

Contrôles rejoués (01.11, depuis la racine) :
- `controle-compact.mjs p3c-1 p3c-2 p3c-3` → **COMPACT OK (3)** :
  - p3c-1 : a=13, b=19, médiane 32,0 ;
  - p3c-2 : a=14, b=20, médiane 29,0 ;
  - p3c-3 : a=17, b=23, médiane 29,0 ;
  - au-dessus de la liste : 0,00 % pour les trois ; aucun en-tête de colonnes.
- `compter-lignes.mjs` : **LIGNES OK** × 3, avec les mêmes a et b.
- `controle-commun … --sans-lignes` : **COMMUN OK**.
- `mots-premier-ecran … --sans-lignes` : 51 mots, **MOTS OK** × 3.
- `controle-contraste` : **CONTRASTE OK** × 3 (le pire : 5,24:1).
- `verifier-page` : **PAGE OK** × 3.
- `capturer.mjs` : **CAPTURES OK 17** × 3.
- Aucun `type="number"`.

Captures ouvertes et comparées aux précédentes : `p3c-1-defile.png`, `p3c-2-tous.png`, `p3c-3-tous.png`.

Reste à surveiller : dans p3c-3, une fois les moutures rattachées, « ✓ 2,40/kg » et « ✓ 0,60 » se suivent sur la même rangée. Les
deux ✓ sont proches, mais chaque montant reste à part.

## Retouche D248 (p3c-3 choisie ; « mettre plus en avant la quantité, juste mettre en gras, et bien alignées les champs »)
Sa capture `brasseur/01-11-p3c-3-quantite-entouree.jpg` est ouverte : il entoure « 18 Kg » dans la bande Malts et
« 6 Kg × 2,30 » sur Maris Otter. La cause est mesurée : le sous-total de quantité tombait 57 px à droite de la colonne des
quantités, au-dessus du prix.

1. **Le contrôle, d'abord (L13).** `v3/p3c-outils/controle-alignement.mjs <id…>` mesure à 390 tactile et à 1280, aux états
   `repos`, `defile` et `tous`, réseau externe coupé :
   - chaque quantité, de ligne et de sous-total de bande, doit avoir une graisse d'au moins 600, avec la taille et la couleur du
     témoin ;
   - prix et montants doivent garder la taille, la couleur et la graisse du témoin ;
   - les bords droits des quantités doivent s'aligner à 1 px près, lignes et sous-totaux, sur tous les groupes ;
   - les prix doivent s'aligner sur leur virgule à 1 px près. Le prix s'écrit tel qu'imprimé, de 2 à 4 décimales : la virgule est
     le seul repère qui tient ;
   - les bords droits des montants doivent s'aligner à 1 px près, lignes et sous-totaux.

   Témoin : la copie de p3c-3 avant la retouche, `v3/p3c-outils/temoin-p3c-3/p3c-3-avant/etat.html`. Sortie : **ALIGNE ECHEC**,
   6 vues sur 6 :
   - `21/21 quantités pas en gras` ;
   - `quantités : bords droits sur 57.0 px (pire : bande malt à 57.0 px)`.
2. **La retouche, dans `v3/p3c-3` seulement.**
   - La quantité passe en gras (600), sur les lignes (« 6 Kg », « 40 g », « 30 ? », « 2 Stk ») comme dans les bandes (« 18 Kg »,
     « 270 g + 30 ? », « 7 Stk »). Elle garde sa taille et sa couleur.
   - Le sous-total de quantité tombe dans la colonne des quantités : `margin-right:57px`, soit 3 + 7 (×) + 3 + 44 (prix).
   - Levures : « = 7 sachets » quitte la colonne et devient une pastille devant « 7 Stk », comme « = 2 sachets » sur les lignes.
     Sinon, « 7 Stk » ne pouvait pas s'aligner sur « 2 Stk ».
   - Prix, montants, bandes, liseré : rien d'autre ne change, et pas d'en-tête de colonnes.
3. **Frais de port (D249) : rien à faire.** La fixture de p3c-3 (sa facture 372765, 23 lignes) n'a aucune ligne de port : grep
   « port », « Versand », « Porto », « Fracht », « livraison » dans `etat.html` et dans `diagnostic/d1/verite-facture-372765.json`.
   Rien n'est touché ; la règle s'appliquera au port, ou à une facture qui en imprime.

Contrôles rejoués (01.11, depuis la racine) :
- `controle-alignement.mjs p3c-3` : **ALIGNE OK**, 6 vues ; 21 quantités (dont 3 de bande), 18 prix et 21 montants, écart 0,0 px
  partout.
- `controle-compact.mjs p3c-3` : **COMPACT OK** (a=17, b=23, médiane 29,0 ; au-dessus de la liste, 0,00 %).
- `compter-lignes` : **LIGNES OK** (a=17, b=23).
- `controle-commun … --sans-lignes` : **COMMUN OK**.
- `mots --sans-lignes` : 51 mots, **MOTS OK**.
- `contraste` : **CONTRASTE OK** (188 textes, le pire 5,24:1).
- `verifier-page` : **PAGE OK**.
- `controle-choix` : CHOIX OK, mais il ne compare rien : l'écran Dépense n'est pas dans `ecrans.json`.
- `capturer.mjs p3c-3` : **CAPTURES OK 17**.
- Aucun `type="number"`.

Captures ouvertes et comparées à la sienne : `p3c-3-repos.png`, `-defile.png`, `-tous.png` et `-1280-repos.png`.
- « 18 Kg » est maintenant au-dessus de « 6 Kg … 2 Kg », en gras.
- « 270 g + 30 ? » s'aligne sur « 100 g », et « 7 Stk » sur « 2 Stk ».
- À 390, dans la bande Malts, « Rattacher les 5 » et « 18 Kg » se suivent à 6 px : c'est serré, mais rien ne se chevauche.
  Après le rattachement, le bouton disparaît.

P3C3-R OK — quantités en gras et colonnes alignées (ALIGNE OK, témoin ECHEC à 57 px) ; pas de ligne de port dans la fixture

P3C-R OK — retouches e-t4 faites (4 px p3c-1, /kg sur la rangée s'il tient, « ✓ 0,60 ») ; COMPACT, COMMUN, MOTS, CONTRASTE, PAGE, LIGNES OK

P3C OK — trois degrés COMPACT OK (a/b 13/19, 14/20, 17/23 ; médianes 33, 29, 29 px contre 43), haut identique à p3a-3 (0,00 %), COMMUN, MOTS, CONTRASTE, PAGE, LIGNES OK
