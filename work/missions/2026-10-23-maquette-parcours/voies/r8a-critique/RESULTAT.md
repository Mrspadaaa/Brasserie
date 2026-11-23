OK — 30 reconnus, 4 écarts ; etape : REJET, biere : ACCEPTÉ

Voie r8a-critique, 24.10. Les 34 états de `etape.json` et `biere.json`, chacun regardé sur ses trois images (sa maquette
choisie, 5345f6ad, la construite du jour) montées côte à côte dans `os.tmpdir()`, rien d'écrit ailleurs qu'ici.
Aucune perte nouvelle : tout ce que 5345f6ad montrait le matin est encore là ce soir, sur les deux écrans.

## etape

etape : REJET

Ce qu'il dirait : « Ça c'est le bon, là je retrouve ma vue. Mais c'est quoi ces 107 g de Saaz à 60′ quand je passe
Nugget en whirlpool ??? » L'écran est sa base v4.10 retrouvée (bandeau, carte, frise, ajouts rapides, alerte, familles ;
fil d'étapes D116, « ? » D113, « analyse › » D121, pictos D74), le rail et ses quatre états de type sont les siens.
Le rejet tient à un seul mécanisme, visible dans quatre états : dès que l'IBU passe sous la bande du style, les trois
ajouts rapides de sa base (Motueka, Citra cryo, Saaz Late : 10 g à 10′) sont remplacés par des doses d'amérisant à 60′
calculées pour combler l'écart (`quickAdd.ts` l. 82, `bitter ? 'b60' : 'b10'`), ou par les propositions de sa page
cas-k2. Sa maquette choisie ne le fait jamais hors d'une recette vide (captures `etat-etape-type-whirlpool-choisie.png`
et `etat-etape-type-froid-choisie.png` : 10 g, 10′, +3 / +9 / +2 IBU). Règles : règle n° 1 et D124 (un état de sa
maquette choisie rendu autrement), D41 (« un 10' qui sort de null part » : ici un 60′ et 107,4 g de Saaz Late qui
sortent de nulle part), D13 (le stock d'abord, « ajouter en un click »). Correction : hors recette vide (cas-k2), les
ajouts rapides gardent la forme de sa base (stock d'abord, 10 g à 10′, « +n IBU ») quel que soit l'IBU ; les
amérisants à 60′ « ou » ne paraissent que sur l'emplacement « + » d'une recette sans houblon.

- etat-etape-repos : RECONNU
- etat-etape-dose-plus : RECONNU
- etat-etape-dose-moins : RECONNU
- etat-etape-retirer : ÉCART — l'emplacement « + » pointillé, « −60 » et IBU 0 sont là, mais les propositions ne sont plus les 5 de sa base (Motueka, Citra cryo, Cascade, Target 5 g, Saaz Late, à 10′, stock d'abord) : la construite joue la page cas-k2 (Pahto 32,5 g « ou » Marco Polo 48,1 g à 60′, puis Saaz Late, Spalt, WGV à 20 g, tous « à acheter »), ses deux houblons en stock ont disparu des propositions (etat-etape-retirer-construite.png)
- etat-etape-ajout-rapide : ÉCART — Motueka entre bien à 10′ (3 IBU), mais la carte dit « agrumes 2/2 · ≈ inchangé » là où sa base dit ce que l'ajout fait bouger (« floral +1 ») ; la capture du jour est cadrée sous le bandeau (le repère « +3 » au-dessus de l'IBU n'est pas visible) et coupée avant les barres (points « avant » gris et « après » reliés non vérifiables : à recapturer en pleine page) (etat-etape-ajout-rapide-construite.png)
- etat-etape-type-whirlpool : ÉCART — la carte est la sienne (« whirlpool ⟳ », bulle « 80 °C », « − 20 min + », 9 IBU, repère « −51 »), mais les ajouts rapides passent à « 60′ » avec des doses de compensation (Motueka 63 g +51 IBU, Citra cryo 20,6 g +51 IBU, Saaz Late 107,4 g +51 IBU) ; sa base garde 10 g à 10′ (+3, +9, +2 IBU) (etat-etape-type-whirlpool-construite.png)
- etat-etape-type-froid : ÉCART — la carte est la sienne (« à froid ⟳ », « J+3 », « − J+3 + », « aucun IBU », « biotransformation possible, non quantifiée », géraniol · thiols · hop creep, repère « −9 »), mais les ajouts rapides passent à « 60′ » (Motueka 74,2 g +60 IBU, Citra cryo 24,2 g, Saaz Late 126,5 g) ; sa base garde 10 g à 10′ (etat-etape-type-froid-construite.png)
- etat-etape-gout-coeur : RECONNU
- etat-etape-champ-ajouter : RECONNU
- etat-etape-levure : RECONNU
- etat-etape-analyse : RECONNU
- etat-etape-ebullition-lien : RECONNU
- etat-etape-entete : RECONNU
- etat-etape-cas-k3 : RECONNU
- etat-etape-cas-k2-vide : RECONNU
- etat-etape-pied-profil : RECONNU
- etat-etape-repos-1280 : RECONNU

Détail des RECONNU (ce qu'il retrouverait, vu sur etat-etape-*-construite.png) :
- repos : ‹ et « 16D hypothèse » remplacés par le fil des 7 étapes (D116, voulu) ; bandeau IBU 60 / OG 1,066 / EBC 70 ;
  « Ébullition 60′ › » avec son chevron ; carte « Nugget · ébullition ⟳ · − 46 g + · × · α 13 double · résine 2/4 ·
  60 IBU » et la bande des 12 familles ; 0′, whirlpool, SafAle US-05 caractérisée, fermentation, post-fermentation ;
  « Ajouter — houblon… » ; Motueka, Citra cryo, Saaz Late à 10 g et 10′ avec ♡ ; « Boisé et résineux trop marqué »
  et « analyse › » (D121) ; 12 familles en 2 colonnes avec pictos (D74) et « ? » (D113). « α 13 double » et non plus
  « 13 % 9,5–16 mixte ».
- dose-plus / dose-moins : 48 g et 44 g (pas de 2 g), IBU 62 / 57, repères « +2 » et « −3 » au-dessus de l'IBU, IBU de
  la carte à jour.
- gout-coeur : la bulle « aimer · neutre · exclure » (neutre actif) s'ouvre au toucher du ♡.
- champ-ajouter : focus liseré noir, « cit » écrit ; le champ filtre (Citra cryo seul), amélioration déjà admise.
- levure (voulu D123) : la ligne « SafAle US-05 caractérisée » est posée dans la frise comme sa base, sans chevron ni
  mot de Dryhopper ; au repos, rien ne diffère de sa maquette.
- analyse : ouvre l'onglet Ma bière (Résineux ouvert, « bannir · − · sans visée · + »), même destination.
- ebullition-lien : « Ébullition 60′ › », le chevron de renvoi est revenu (absent sur 5345f6ad).
- entete (voulu D116) : le vrai fil d'étapes de l'app (Identité … Récap., Houblons la 3ᵉ), plus de « hypothèse ».
- cas-k3 : le jeu de sa base est joué : Nugget 42,5 g à 60′ (55 IBU), Motueka 10 g à 10′ (3 IBU), Cascade 20 g au
  whirlpool 80 °C « − 20 min + » (2 IBU), Citra cryo 40 g à froid J+3, « aucun IBU », biotransformation, géraniol ·
  thiols · hop creep ; IBU 60 (5345f6ad jouait Nugget 46 g, Cascade, Galaxy à 71 IBU).
- cas-k2-vide : emplacement « + » pointillé, jauge IBU 0 à repère orange, Pahto 32,5 g +60 IBU « ou » Marco Polo
  48,1 g +60 IBU à 60′, Saaz Late, Spalt, Whitbread Golding Variety à 20 g et 10′ : sa page cas-k2.
- pied-profil : alerte, « analyse › », « ? », « + floral › », Au style / Absolu, 12 familles avec pictos (les voulus
  D74, D113, D121 rendus). La capture du jour n'a pas défilé jusqu'au pied : Noyau et Végétal vus sur
  etat-etape-champ-ajouter-construite.png.
- repos-1280 : même colonne, en-tête de l'app « Modifier « Stout export » » ; même contenu qu'au repos 390.

## biere

biere : ACCEPTÉ

Ce qu'il dirait : « Là je retrouve ma vue Ma bière, le grand radar avec la grille, et les + − bannir font enfin
quelque chose sur les barres. » Aucun écart sur ce qu'il a nommé (D108 visée, D109 croix, D18/D24 radar, D31 absolu).

- etat-biere-repos : RECONNU
- etat-biere-radar : RECONNU
- etat-biere-absolu : RECONNU
- etat-biere-radar-absolu : RECONNU
- etat-biere-famille-ouverte : RECONNU
- etat-biere-visee-plus : RECONNU
- etat-biere-visee-moins : RECONNU
- etat-biere-visee-retirer : RECONNU
- etat-biere-bannir : RECONNU
- etat-biere-visee-refermee : RECONNU
- etat-biere-objectif-floral : RECONNU
- etat-biere-objectif-autre : RECONNU
- etat-biere-onglet-suggestions : RECONNU
- etat-biere-onglet-comparer : RECONNU
- etat-biere-retour : RECONNU
- etat-biere-pied : RECONNU
- etat-biere-radar-sommet : RECONNU

Détail des RECONNU (vu sur etat-biere-*-construite.png) :
- repos : ✕ 44 px à la place du ‹ (D109, voulu), onglets Ma bière · Suggestions · Comparer, bandeau, alerte,
  Barres / Radar, Au style / Absolu, 3 pastilles de légende + « ? » (D113), « zone du style · au-dessus », 12 barres
  avec pictos (D74), Résineux ouvert « ×2,8 » avec « bannir · − · sans visée · + », crans du style.
- radar (était different) : grand radar 12 axes pleine largeur, zone du style grisée, ma dégustation en bleu avec le
  sommet orangé de Résineux, familles pas goûtées en « ? » sur l'anneau, puis la grille « pas senti · faible · moyen ·
  marqué » avec pictos ; décompte et légende repliés comme sa base (5345f6ad : petit radar noir, pas de grille).
- absolu (était different) : barres en absolu, en-tête « faible · moyen · marqué » à la place de « zone du style ·
  au-dessus », plus de zone ni de crans.
- radar-absolu : même radar et même grille en absolu.
- famille-ouverte, visee-plus, visee-moins, visee-retirer, bannir, visee-refermee : losange à « faible » relié au point
  par un pointillé, « × », puce « + tropicaux » noire ; nom barré et « bannie » ; retour à « sans visée » ; losange et
  pointillé gardés quand la ligne se referme ; « bannir tropicaux » (mot déjà admis à la place de « − tropicaux »).
- objectif-floral (était different) : reste sur Ma bière, losange posé sur Floral, puce noire, « Plus floral : 7 voies,
  2 faibles › » dessous (sa base figée disait 8 : chiffre du moteur en direct, D14).
- objectif-autre : sa capture choisie montre l'écran inchangé après « + … » (Résineux reste ouvert) ; la construite
  aussi. Le relevé (« ouvre la ligne de Tropicaux ») contredit sa capture, et r2 l'a constaté (DÉCISION) : je juge sur
  sa capture.
- onglet-suggestions, onglet-comparer (voulus q2b et D107) : les onglets sont en tête, sans saut d'en-tête (D119) ; les
  écrans eux-mêmes sont jugés par r8b et r8c.
- retour : la croix ramène à l'étape Houblons (D109, D118).
- pied : « + floral · − résineux · + … » puis « Prévu avec SafAle US-05, caractérisée » (vu au bas de
  etat-biere-visee-retirer-construite.png ; la capture du jour de l'état n'a pas défilé).
- radar-sommet (était absent) : bulle « Résineux : marqué, au-dessus du style » au toucher du sommet.

## Réserves

Détails qu'il ne remarquerait sans doute pas au premier regard ; à régler sans attendre son retour.
- Végétal placé (point vert) et « 7 au style · 4 non situées » sur l'étape (pied, champ-ajouter, analyse) et sur Ma bière
  (repos, absolu), là où sa base garde Végétal hachuré et « 6 au style · 5 non situées ». Les fiches de Nugget ne
  décrivent pas Végétal ; REPRISE § 8 (D65, D14) demande « non située », r2 a laissé le moteur (DÉCISION À PRENDRE).
  C'est le piège qu'il a nommé le 18.10 (« traitées comme connues mais valeur à 0 ») : à trancher par le pilote.
- Ma bière titre « Résineux trop marqué » là où sa base dit « Boisé et résineux trop marqué » (l'étape a retrouvé la
  forme longue, pas l'onglet).
- cas-k2-vide et retirer : sans houblon, la construite affiche encore « Boisé et résineux trop marqué » et le profil
  entier ; sa page cas-k2 replie le profil en « 1 au style · 11 non situées › ». Un brasseur sans houblon ne devrait pas
  lire « résineux trop marqué » (la note de dégustation du 18.10 reste, mais ce n'est pas la recette).
- gout-coeur : la bulle « aimer · neutre · exclure » flotte en haut à droite, par-dessus le champ « Ajouter — houblon… »,
  au lieu de s'ouvrir sur la carte de Motueka comme sa base.
- entete : dans la maquette, toucher une autre étape du fil ne fait rien ; le « ‹ » de retour vers Malts n'a plus
  d'équivalent (NOTE de r1). S'il touche « Malts/sucres », il écrira « ??? ».
- visee-moins : le losange à 0 n'est pas visible à gauche du point (sa base montre « ◇---○ ») ; le nom barré et
  « bannie » suffisent à le reconnaître.
- Captures du jour non défilées : etat-etape-pied-profil, etat-etape-ajout-rapide (bandeau hors cadre), etat-biere-pied.
  Les états sont jugés sur d'autres captures du même écran ; la page publiée devrait montrer le pied.
- « Sans Nugget › » sur chaque carte (pont vers Substituer, #145 demandé par lui) : pas dans sa base, pas un écart.

LEÇON PROPOSÉE : un relevé d'état qui décrit un geste que la capture choisie ne montre pas (objectif-autre : « ouvre la
ligne de Tropicaux » alors que sa capture est l'écran inchangé) fait rendre un comportement inventé ; le relevé doit
dire ce que la capture montre, et marquer « aucun effet visible » quand c'est le cas.
