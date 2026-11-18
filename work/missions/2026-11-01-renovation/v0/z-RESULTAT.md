RENO-Z OK — quatre mini maquettes z1 à z4 jouables, huit états, plan de la brasserie en z2 ; PANEL ECHEC (4 captures, mesure du lot 21)

# Série z — la rénovation, créative à fond (v0, 01.11, D259)

Quatre mini maquettes jouables (`v0/z1..z4/etat.html`, huit états par `?etat=`), chacune dans l'app telle qu'elle est (en-tête,
barre du bas, cartes du Bord ou onglets de Finances repris des captures `onglet-bord-390.png` et `fin-previsions-390.png`).
Données fictives seulement : ses cinq titres, montants, artisans (« Ventil'Demo Sàrl », « Sanitaire Fictif SA », « Sols Fictifs
Sàrl ») et heures inventés. Captures par `v0/z-outils/capturer-z.mjs` (huit états à 390, `jour1` à 1280, et l'après-toucher des
boosters marqués `data-capture-apres`). Rien d'écrit hors de `v0/z*/**`, `v0/z-outils/` et ce fichier ; aucun heredoc ni `node -e`
pour un fichier (les deux scripts de mesure jetables sont dans `%TEMP%`).

Axes couverts par la série (fiche § Axes) : **place** 1, 2 et 3 ; **forme** liste à pastilles, vraie vue figurée (plan), file
ordonnée, pile (libre) ; **mot** les trois ; **argent** reste à payer, enveloppe, caisse des Prévisions, rien tant qu'aucun prix ;
**temps** aucun, heures par manque ; **étapes** aucune, cases à cocher, « Noter l'achat » seul.

## z1 — froide · « Ce qui me manque », une carte du Bord

**Idée.** Ses deux goûts sourcés, affinés : le récap en haut qui renvoie (chips par état, chacune filtre la liste) et une pastille
d'état par item. Première carte du Bord, teinte « Local et travaux », « Ensuite » en tête de liste, poignée ≡ pour la place,
« Noter un manque » en dernière ligne. Argent : le reste à payer seul ; au jour 1, rien.

**Contrôles.** PAGE OK (0 images, 390 px, sans erreur) · COMMUN OK (mots, couleurs, survol, blocs, contraste, standard, parlant,
brutes ; au-style, fiche, trait, legende sautés par le profil) · MOTS OK (60, hors titres) · CONTRASTE OK (38 textes, pire
« Brassins 0 en cuve Tous » 4,88:1, coquille du Bord) · CHOIX OK (0 écran conforme ; 0 ouvert) : « renovation » n'a pas d'entrée
dans `ecrans.json`, sortie notée telle quelle. Premier passage : PAGE ECHEC, défilement horizontal de 8 px (la classe `.renoz1-f`
servait au bouton d'en-tête et au formulaire de la feuille : renommée `-form`).

**Captures ouvertes** (`v0/z1/`) : `z1-jour1.png`, `z1-encours.png`, `z1-ajout.png`, `z1-ouvert.png`, `z1-depasse.png`,
`z1-caisse.png`, `z1-caisse-apres.png`, `z1-fini.png`, `z1-horsligne.png`, `z1-1280.png`. Jugées : la carte se lit en trois
secondes ; à `encours` les pastilles vert/bleu/ambre/pointillé disent l'état sans légende ; la feuille tient au-dessus de la
barre ; à 1280, la carte en colonne gauche, le reste à droite comme le Bord.

**Ce qui tient.** Le jour 1 sans chiffre ni zone vide ; le filtre par chip ; « Ensuite » visible ; l'ajout d'une main.
**Ce qui casse / à surveiller.** La ligne de contexte à `depasse` et `caisse-apres` passe sur deux lignes ; cinq tailles de texte
sur l'écran entier (12/13/14 du contenu, 16/18 de la coquille) ; la bande figée du Bord laisse le bas de l'écran vide.

## z2 — tiède · « Rénovation », la brasserie en plan

**Idée.** La vraie vue : un écran à lui, ouvert depuis le Bord, le plan de la brasserie vu du dessus, chaque manque épinglé à sa
place (hotte au-dessus de la cuve, 2ᵉ évier à côté du premier, armoire contre le mur extérieur, la seconde passe = le sol hachuré
du Brassage, le site dans « En ligne · vitrine » hors des murs). Le numéro de l'épingle est la place dans la suite, sa couleur
l'état ; aucune zone muette : Brassage, Lavage, Fermentation, Extérieur, Entrée, En ligne portent leur nom (D259). Dessin
technique (murs, pointillés), pas une illustration. Argent : une enveloppe qu'il fixe ; étapes : cases à cocher dans le manque
ouvert.

**Contrôles.** PAGE OK · COMMUN OK · MOTS OK (37) · CONTRASTE OK (36 textes, pire « Bord » 6,16:1) · CHOIX OK (0 ; 0 ouvert).

**Captures ouvertes** (`v0/z2/`) : `z2-jour1.png`, `z2-encours.png`, `z2-ajout.png`, `z2-ouvert.png`, `z2-depasse.png`,
`z2-caisse.png`, `z2-caisse-apres.png`, `z2-fini.png`, `z2-horsligne.png`, `z2-1280.png`. Jugées : au jour 1, cinq épingles noires
sur le plan, la liste en dessous, rien d'autre ; à `fini`, le sol passe en vert pâle et les épingles faites portent une coche ; à
`depasse`, l'épingle des sols est rouge ; à 1280, plan à gauche, liste à droite.

**Ce qui tient.** C'est la « vraie vue » qu'il a aimée, sans le côté enfantin ; chaque zone dit ce qu'elle est ; le plan et la
liste disent la même chose (numéro, couleur).
**Ce qui casse / à surveiller.** Les pièces sont fictives : un vrai plan doit venir de lui (un plan ajustable au doigt en
passe 2) ; les étiquettes du plan sont à 11 px dans le viewBox (≈ 11,7 px rendus) ; la ligne d'enveloppe prend deux lignes à 390.

## z3 — chaude · « Local et travaux », la file dans Prévisions

**Idée.** Le second onglet de Prévisions, « Projets de matériel », devient « Local et travaux » et montre la file : un rail, un
nœud numéroté par manque, « Ensuite » en drapeau, flèches pour la place. Au jour 1 la nature est devinée depuis le titre
(achat + pose, achat, travail) et se corrige d'un toucher. Argent : la caisse des Prévisions, « Caisse à renseigner » en ambre tant
qu'elle est inconnue, puis une barre connu/libre. Temps : les heures faites/notées, « fin : rythme à régler », jamais de date.

**Contrôles.** PAGE OK · COMMUN OK (un premier passage COULEURS ECHEC, 2 teintes : les nœuds bruns comptent comme alerte ; corrigé par
l'ambre d'attention sur « Caisse à renseigner », comme « Prévision incomplète » dans la base) · MOTS OK (48) · CONTRASTE OK (35
textes, pire « Local et travaux 5 » 5,17:1) · CHOIX OK (0 ; 0 ouvert). Un passage intermédiaire avait un bouton dans un bouton
(tag de nature) : la file se cassait ; remplacé par un `span role=button`.

**Captures ouvertes** (`v0/z3/`) : `z3-jour1.png`, `z3-encours.png`, `z3-ajout.png`, `z3-ouvert.png`, `z3-depasse.png`,
`z3-caisse.png`, `z3-caisse-apres.png`, `z3-fini.png`, `z3-horsligne.png`, `z3-1280.png`. Jugées : le drapeau « Ensuite » et les
nœuds se lisent ; l'armoire bloquée a un nœud pointillé et « attend 1 · sols » ; la feuille du site (heures, blocage) tient ; à
1280, caisse à gauche, file à droite.

**Ce qui tient.** Le mot de l'app, à sa place dans l'app ; les heures sans date ; la caisse honnête.
**Ce qui casse / à surveiller.** L'outil reste au 3ᵉ niveau de Finances (le défaut relevé par le jury, J3) ; le premier écran du
jour 1 est aéré (remplissage 0,40) ; « Inclure dans les prévisions » de la base n'est pas repris par item.

## z4 — chaude · « Rénovation », la pile : une chose à la fois sur le Bord

**Idée.** Sur le Bord, une seule carte en grand : le manque « Ensuite », ses faits en chips (prix, heures, bloqué par) qui se
renseignent d'un toucher, « Fait », « Pas maintenant » (la carte passe au fond : c'est le facteur libre), « Noter l'achat ». Les
deux cartes suivantes dépassent de la pile, « +2 derrière » ouvre la feuille « La suite » (la liste à un toucher, poignées ≡).
Argent : rien tant qu'aucun prix ; dans `caisse`, « payable ? caisse à renseigner » → « payable · caisse 6 240,00 ».

**Contrôles.** PAGE OK · COMMUN OK · MOTS OK (58 ; un premier passage à 62, « Fribourg / OFDF » retiré de la bande) · CONTRASTE OK
(40 textes, pire 4,88:1, coquille) · CHOIX OK (0 ; 0 ouvert).

**Captures ouvertes** (`v0/z4/`) : `z4-jour1.png`, `z4-jour1-apres.png` (la feuille « La suite »), `z4-encours.png`,
`z4-ajout.png`, `z4-ouvert.png`, `z4-depasse.png`, `z4-caisse.png`, `z4-caisse-apres.png`, `z4-fini.png`, `z4-horsligne.png`,
`z4-1280.png`. Jugées : la pile se lit comme une pile (deux bords qui dépassent avec leur titre) ; à `encours` la carte du dessus
porte prix · reste, heures, blocage et sa jauge ; à `fini` les trois faits sous la pile ; un premier rendu avait les bords de pile
sous la ligne « Puis », corrigé.

**Ce qui tient.** La réponse d'abord (« qu'est-ce que je fais ensuite ? ») ; aucun chiffre au jour 1 ; le geste « Pas maintenant ».
**Ce qui casse / à surveiller.** Quatre tailles de texte dans la pile ; la vue d'ensemble demande un toucher (la feuille) ; la
bande figée du Bord laisse le bas vide.

## PANEL (série seule)

`node controle-panel.mjs z1-jour1 z2-jour1 z3-jour1 z4-jour1` → **PANEL ECHEC** : remplissage médian 0,45 (3 sous 0,50 : z3 0,40,
z1 0,44, z4 0,45 ; z2 au-dessus), ressemblance moyenne 0,92 (seuil 0,90), 0 paire presque identique. Sur les quatre `encours` :
médiane 0,54, ressemblance 0,92. Mesures figées : `v0/z-outils/panel-z-jour1.json`. Trois passes (bande du Bord complétée par
« Échéances et démarches », rangée Compagnon et tags de nature en z3, cartes qui dépassent en z4) ont fait monter la médiane de 0,40
à 0,45 sans atteindre 0,55. Cause lue sur les captures : au jour 1, le Bord et Prévisions de la base sont eux-mêmes à moitié vides
(voir `onglet-bord-390.png`), et la mesure ne compte ni les surfaces teintées ni les fonds gris ; la ressemblance à 0,92 vient de
quatre captures qui partagent l'en-tête, la barre du bas et une page blanche, là où le lot 21 en comptait 33. Je n'ai pas voulu
remplir le premier écran de texte pour la mesure (D1). À rejouer par le pilote sur les 12 captures du lot (r, u, z).

**Prédiction.** Il dira de z2 « avoir une vraie vue comme ça c'est top » et demandera que le plan soit le sien ; il prendra la
pile de z4 ou la carte de z1 pour le geste du jour 1, et trouvera z3 « trop enfoui dans Finances ».

DÉCISION À PRENDRE : aucune dans mon contrat ; le PANEL sur 4 captures est à rejouer sur le lot entier.

CONNAISSANCE : `controle-panel.mjs` compte vides les surfaces teintées (#F5F5F5) et le gris des cartes du Bord ; un panel d'écrans
du Bord ou de Finances à l'état réel (presque vide) ne peut pas atteindre 0,55 sans remplir de texte. À étalonner sur un panel
d'écrans de l'app, pas seulement sur les lots houblons.

LEÇON PROPOSÉE : un bouton HTML ne contient jamais un autre bouton (z3 : la file se cassait sans erreur de script, contrôles verts) ;
une classe de maquette porte un seul rôle (z1 : `.renoz1-f` partagée, 8 px de débordement). À mettre dans la liste des pièges de
`pieges-controles-maquette` plutôt qu'en leçon.
