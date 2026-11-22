# Série z — la vue TVA, créative à fond (v0, 01.11, D250)

Quatre mini maquettes jouables (`tva/v0/z1..z4/etat.html`, sept états par `?etat=`), chacune dans l'onglet Finances de l'app en
ligne (en-tête, onglets, bascule « Situation / Coûts », navigation du bas repris de `fin-synthese-390.png`). Données fictives,
calculées dans la page à partir des montants TTC et des taux (aucun total tapé à la main). Captures par
`tva/v0/z1/capturer-z.mjs` (sept états à 390, `annee` à 1280). Écrit variante par variante.

## z1 — froide · le mode « TVA » à côté de Situation / Coûts, récap à renvois, liste à pastilles

**Idée.** Ses deux mots repris et affinés : le récap en haut qui renvoie (chips à pastille, un filtre par taux, la douteuse
clignote quand on la renvoie), et la pastille du taux sur chaque facture, devant sa TVA. Réponse en tête : « Remboursée : 0,00 ·
non assujetti », puis le total payé. Axes : place = mode de Synthèse ; période = année ; si = aucun chiffre, feuille AFC /
fiduciaire / réglage ; forme = liste à pastilles.

**Contrôles.** PAGE OK (0 images, 390 px, sans erreur) · COMMUN OK (mots, couleurs, survol, blocs, contraste, standard, parlant,
brutes ; au-style, fiche, trait, legende sautés par le profil) · MOTS OK (z1 55 mots, hors lignes) · CONTRASTE OK (128 textes,
pire « TVA » 5,17:1 ; un premier passage à 4,42:1 sur le « ? » ambré, foncé en `#7F5B10`) · CHOIX OK (0 écran conforme ;
0 ouvert) : Finances n'a pas d'entrée dans `ecrans.json`, sortie notée telle quelle.

**Captures ouvertes** (`tva/v0/z1/`) : `z1-annee.png`, `z1-inconnues.png`, `z1-douteuse.png`, `z1-etrangere.png`, `z1-vide.png`,
`z1-si.png`, `z1-horsligne.png`, `z1-1280.png`. Jugées zone par zone : le 160,19 domine, les chips se lisent en une seconde, la
liste à pastilles est dense (14 lignes au premier écran à 390) ; à 14 inconnues le total dit « total partiel » et la bande ambrée
porte 3 412,60 CHF ; la vue vide garde le cadre et les chips à 0 ; à 1280 une seule colonne, comme la base.

**Ce qui tient.** La réponse en trois secondes ; l'inconnu jamais à zéro ; la douteuse « choisie » ; l'allemande violette et
« hors CH » ; chaque chip mène quelque part ; le statut dit comme un réglage avec son interrupteur.
**Ce qui casse / à surveiller.** Cinq tailles de texte sur l'écran complet (12 / 14 / 28 du contenu, 16 et 18 de la coquille) ;
la liste ne groupe pas par mois ; la feuille « si » est volontairement sans chiffre (axe), il peut la trouver maigre.

## z2 — tiède · Annuel : la TVA par trimestre en barres empilées, le net « si assujetti »

**Idée.** Dans « Bilan et impôts », cinq barres empilées par taux (T1 à T4, puis l'année) : la période est une barre qu'on
touche, et la réponse, le net, la légende et les factures suivent. L'inconnu est un jeton hachuré « 3? » au bout de la barre, sans
longueur ; une période toute inconnue dit « — ». Le net « 160,19 − 1 159,93 = −999,74 » ouvre ses hypothèses (ventes enregistrées,
8,1 %, méthode effective, inconnues non comptées, statut en réglage). Axes : place = section d'Annuel ; période = trimestre ; si =
net récupéré − facturé ; forme = barre empilée.

**Contrôles.** PAGE OK · COMMUN OK (au premier passage : CONTRASTE 1,07:1 sur un texte recouvert par une barre trop longue, STANDARD
« rayons 2px×25 », MOTS 110 ; corrigés : échelle des barres à 70 %, rayons 0, mois et comptes retirés des rangées) · MOTS OK (58)
· CONTRASTE OK (120 textes, pire « Finances » 5,3:1) · CHOIX OK (0 ; Finances sans entrée).

**Captures ouvertes** (`tva/v0/z2/`) : `z2-annee.png`, `z2-inconnues.png` (T1 et T2 à « — » avec « 4? » et « 3? », « total
partiel »), `z2-douteuse.png` (segment en pointillé au T2, chip « choisie 2,80 »), `z2-etrangere.png`, `z2-vide.png` (cinq tirets,
« — », cadre gardé), `z2-si.png` (feuille du net), `z2-horsligne.png`, `z2-1280.png` (barres sur toute la largeur, lisibles).

**Ce qui tient.** La période en une barre ; le net honnête, signé, avec ses hypothèses à un toucher ; l'inconnu sans longueur.
**Ce qui casse / à surveiller.** Le net en rouge peut se lire comme une alerte (c'est un signe) ; les mois des trimestres ne sont
plus écrits (dans le `title` seulement) ; le remplissage du premier écran mesure 0,49 (voir PANEL).

## z3 — chaude · la carte TVA de Synthèse ouvre la gaufre : une case = 2 CHF, un rang par mois

**Idée.** La TVA se compte en cases, comme des pièces : verte à 2,6 %, bleue à 8,1 %, hachurée « ? » par facture sans TVA lue. Une
carte dans Synthèse (`?etat=carte`, après Trésorerie, les rangées de la base autour) montre la gaufre de l'année ; la toucher ouvre
la vue, un rang par mois, les trois mois lourds ouverts sur leurs factures, les mois vides en tirets. Axes : place = carte de
Synthèse ; période = année lue par mois ; si = aucun chiffre, pli AFC / fiduciaire ; forme = gaufre (forme libre).

**Contrôles.** PAGE OK · COMMUN OK · MOTS OK (49 ; les rangs de mois sont marqués `data-mots="lignes"`, lignes de dépenses groupées
par mois : je le dis) · CONTRASTE OK (74 textes, pire « avr. » 4,94:1) · CHOIX OK (0 ; Finances sans entrée). Correctifs : total à
28 px (spécificité CSS), carte en `div role=button` (un bouton dans un bouton la cassait), colonne de valeur pour « +1? ».

**Captures ouvertes** (`tva/v0/z3/`) : `z3-annee.png`, `z3-carte.png` (la carte dans Synthèse, 80 cases, chips), `z3-inconnues.png`
(sept mois en « ? » hachurés, « total partiel »), `z3-douteuse.png` (case en pointillé, chip « choisie »), `z3-etrangere.png`,
`z3-vide.png` (douze rangs en tirets), `z3-si.png` (pli AFC / fiduciaire), `z3-horsligne.png`, `z3-1280.png`.

**Ce qui tient.** On voit la TVA avant de la lire ; avril-mai sautent aux yeux ; l'inconnu est une case « ? » qui ne pèse rien.
**Ce qui casse / à surveiller.** L'unité « ■ = 2 CHF » est une légende au repos (un mot-signe) ; un gros mois passe sur deux
lignes de cases ; la carte fermée est la seule à montrer les rangées de la base.

## z4 — chaude · mode TVA : la TVA par brassin, en centimes par litre ; le hors brassin à part

**Idée.** Pensée brasseur : une bouteille par brassin, remplie à la hauteur de sa TVA (achats reliés), le montant et « 10 ct/L » ;
puis un fût « Hors brassin » qui porte 69 % du total : la TVA n'est pas dans la bière, elle est dans le matériel. Le brassin le plus
lourd et le fût sont ouverts sur leurs factures. Un brassin tout inconnu : bouteille hachurée, « ? », « TVA inconnue ». Axes :
place = mode de Synthèse (comme z1, composition toute autre) ; période = par brassin ; si = aucun chiffre, feuille AFC / fiduciaire ;
forme = bouteilles remplies et barres (forme libre).

**Contrôles.** PAGE OK · COMMUN OK · MOTS : 97 → 65 → 60, MOTS OK (dates, « ct/bout. » et « matériel, verre, nettoyage » retirés du
premier plan) · CONTRASTE OK (100 textes, pire « 6 ct/L » 5,15:1) · CHOIX OK (0 ; Finances sans entrée).

**Captures ouvertes** (`tva/v0/z4/`) : `z4-annee.png`, `z4-inconnues.png` (#15 et #14 hachurés « ? », « 8 sans TVA lue ·
1 727,90 »), `z4-douteuse.png`, `z4-etrangere.png`, `z4-vide.png` (bouteilles vides, « — »), `z4-si.png`, `z4-horsligne.png`,
`z4-1280.png` (deux colonnes de brassins).

**Ce qui tient.** La réponse en langue de brasseur (ct/L), l'insight « 69 % hors brassin », l'inconnu jamais à zéro.
**Ce qui casse / à surveiller.** « ct/bout. » (33 cl) sacrifié au premier plan pour les 60 mots ; les ct/L supposent des factures
reliées aux brassins (le lien existe dans l'app pour les ingrédients, pas pour tout) ; quatre tailles de texte.

## Le panel (`controle-panel.mjs`, sur les quatre `*-annee.png`)

Trois essais : remplissage médian 0,44 → 0,52 → 0,52 (plancher 0,55), captures sous 0,50 : 3 → 2 → 1 (z2 à 0,49 ; 20 % au plus),
ressemblance 0,93 → 0,91 (plafond 0,90) : **PANEL ECHEC**, sortie telle quelle, mesures dans `tva/v0/z1/panel-mesures.json`.
Ce que j'ai fait : brassin et hors brassin ouverts d'office (z4), trois mois ouverts (z3), rangées à 28 px, barres à 20 px, cases
à 14 px. Pourquoi ça ne passe pas : les quatre partagent la coquille de l'app en ligne (en-tête, onglets, navigation : 18 % de la
hauteur, imposée par le brief), et une liste blanche à rangées de 28–32 px (DESIGN.md) remplit moins de rangées de pixels que les
radars et barres pleine hauteur du lot 21 sur lequel le contrôle est étalonné. Les quatre compositions sont différentes à l'œil
(liste à pastilles, barres par trimestre, gaufre par mois, bouteilles par brassin) : 0 paire presque identique. Je n'ai pas voulu
gonfler les rangées ni teinter des fonds pour le métrique (D82, « gros blocs »).

## Synthèse de la série

| | chaleur | place | période | si assujetti | forme | mots | contrôles |
|---|---|---|---|---|---|---|---|
| z1 | froide | mode de Synthèse | année | aucun chiffre, feuille AFC | liste à pastilles, récap à renvois | 55 | tous OK |
| z2 | tiède | section d'Annuel | trimestre | net récupéré − facturé, hypothèses | barres empilées | 58 | tous OK |
| z3 | chaude | carte de Synthèse | année, par mois | aucun chiffre, pli | gaufre (1 case = 2 CHF) | 49 | tous OK |
| z4 | chaude | mode de Synthèse | par brassin | aucun chiffre, feuille | bouteilles + ct/L | 60 | tous OK |

Fichiers écrits : `tva/v0/z{1..4}/etat.html`, `tva/v0/z{1..4}/NOTE.md`, `tva/v0/z1/capturer-z.mjs`, `tva/v0/z1/panel-mesures.json`,
les captures `z*-{annee,inconnues,douteuse,etrangere,vide,si,horsligne,1280}.png` (+ `z3-carte.png`), ce fichier. Rien hors de
`tva/v0/z*` et de `tva/v0/z-RESULTAT.md` (`git status` : seul `tva/` est nouveau). Aucun serveur, aucun commit, aucune donnée réelle.

**Prédiction.** Il dira « z3 ça c'est parlant » pour la gaufre et gardera les pastilles de z1 et le net de z2 (« mais il manque le
net sur z3 ») ; z4 l'amusera (« 10 ct/L ») mais le « hors brassin » à 69 % le fera douter de la ventilation par brassin.

DÉCISION À PRENDRE : le PANEL ECHEC vient de la coquille partagée et des listes blanches, pas d'un squelette commun ; soit le
pilote accepte la sortie telle quelle pour un lot « vue dans l'app », soit `controle-panel` prend une option `--sans-coquille`
(mesurer sous l'en-tête et au-dessus de la navigation) : à trancher avant le tri.

CONNAISSANCE : `mots-premier-ecran.mjs` compte chaque « · » et « : » isolé comme un mot : un premier écran à 60 mots en perd 8 à 12
dans ses séparateurs ; un `<button>` dans un `<button>` est refermé par le parseur HTML (la carte z3 s'est vidée en silence).
LEÇON PROPOSÉE : aucune.

TVA-Z OK — quatre vues TVA jouables (pastilles, trimestres, gaufre, brassins), contrôles du brief verts ; PANEL ECHEC signalé.
