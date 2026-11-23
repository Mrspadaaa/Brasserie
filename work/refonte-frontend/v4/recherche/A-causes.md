# A — Causes internes : pourquoi les 23 mini-maquettes de M1 ressemblent à un cockpit

Audit des causes, 18.10.2026, lecture seule. Directeur UX/UI (session Fable, contexte
neuf). Matériel examiné : méthode, brief v4, contrat de direction, REGLES.md, briefs et
consignes des lots 1 et 2, calibration et verdict du jury, les deux planches 390, douze
captures 390 et deux captures 1280 regardées une à une, les NOTE.md de huit maquettes, le
pack de données (`meta`, S1), l'historique Git de DESIGN.md, le corpus des mots du brasseur
(`docs/besoins/corpus-demandes.md`), et la transcription T1. Comptage relancé avec
`tournoi/outils/mots-premier-ecran.mjs` sur `M1/_lots-1-2/` : 166 (p23) à 383 (p07) mots
au premier écran à 390 px.

Verdict du brasseur à expliquer : « énormément d'information pour rien, beaucoup de text
inutile qui ne devrait pas être là en premier plan », « écrans de central nucléaire ou
cockpit d'avion », « n'utilise pas les bon outil UX, ni les bonnes représentation UI ».

## 1. Les causes, classées par poids

### C1 (poids 5/5) — Le brief et le contrat ont dessiné le cockpit avant les auteurs

Le premier écran était surchargé **par construction**, avant qu'un seul auteur n'écrive une
ligne.

- Contrat de direction (`.impeccable/surfaces/prototypes-houblons-v4-index-html.md`,
  « FIRST VIEWPORT ») : barre de 40 px avec recette, style, litres, DI et jauge IBU ;
  « 8 to 10 rows » portant chacune « a family label, a full-width track…, a range marker, a
  verdict word and a direction handle » ; dessous « at least 5 rows » de houblons avec
  quantité, mini-profil et « + » ; deux lentilles ; une action principale. Soit 8 à 10
  rangées × 5 éléments + 5 rangées × 4 éléments + barre + lentilles : 70 à 80 objets
  imposés dans 390 × 844 avant tout contenu.
- Brief M1 (`M1/_lots-1-2/BRIEF-lots-1-2.md`, « Ce que chaque mini-prototype montre ») :
  pour **chaque** famille la bande, la plage, un verdict, l'IBU à part, une poignée par
  famille, la bascule S2, **et** « La mention « échelles au style : hypothèse BJCP, à
  valider » ». Rien n'est désigné comme second plan.
- Consigne auteur (`CONSIGNE-AUTEUR.md`, § « Ce que dit vraiment le pack ») : « Le modèle
  situe mal la bière : c'est une vérité à montrer (une plage, un flou), pas à cacher » ;
  « aucune voie ne peut établir une baisse… Montre-le honnêtement ». Consigne de relance :
  « le brasseur doit savoir que le modèle ne situe pas ces familles **et pourquoi** »,
  « aucune famille ne disparaît ».
- Résultat observable : la note du moteur (« Aucun ajout actuel n'est cité pour cette
  famille dans les fiches (Beer Maverick, Hopsteiner) ; aucune voie ne peut établir une
  baisse. La cause perçue peut venir d'ailleurs (malt torréfié, levure, oxydation) : non
  modélisé. », 40 mots) est recopiée **mot pour mot au premier écran** dans p02, p06, p07,
  p09, p11, p16, p19, p20, p21 (captures `pNN-390.png`). Les 23 maquettes affichent la
  mention « hypothèse BJCP, à valider » en haut ; 20 sur 23 affichent une légende.

Ce que ça corrige : le brief définit le premier plan comme un **budget** (une question,
≤ 7 éléments, ≤ 60 mots) et nomme explicitement ce qui va au second plan. Chaque état du
moteur reçoit une phrase canonique d'une ligne (jeu de textes fourni aux auteurs), jamais
un paragraphe. Le lot 3, écrit mais non lancé (`M1/BRIEF.md`), fait déjà exactement cela ;
c'est la preuve que la cause était dans le brief.

### C2 (poids 5/5) — La règle de vérité et le jury récompensent le texte, jamais le silence

- `REGLES.md`, grille : vérité des données 20 % et **éliminatoire** ; densité 10 % définie
  comme « Beaucoup de données utiles par écran » ; aucun critère ne pénalise un mot de trop.
  Un auteur qui omet est éliminé, un auteur qui explique est en sécurité : la stratégie
  dominante est d'écrire.
- `jury/calibration.json`, « lecture_de_la_grille » : « Je récompense l'honnêteté **écrite**
  à la granularité de la donnée : entiers, plages, « estimation », « inconnu », « aucun
  usage documenté » » et « je ne pénalise jamais la densité ni les 12–13 px en soi ».
- `verdict-lot1.json` : p07 classé 1er avec **383 mots** (le plus bavard des 23) ; p09 2e
  avec 253, cité pour « « C'est une réponse, pas une panne » » comme mérite ; p10, 178 mots
  (le plus sobre du lot 1), éliminé 6e. Corrélation rang / mots : nulle ou inverse. Les
  greffes recommandées ajoutent du texte : « la phrase du brasseur citée, la réponse par
  famille », « Échelle graphique « 8 points de floral sur quatre terrains » », « Note de
  groupe… « bande 0–55 · 1 case = 18 points » ».
- Le jury a bien vu la verbosité une fois (p01 : « 400 px d'en-tête avant la première
  famille »), mais sans critère il ne pouvait pas la faire peser.
- Le brasseur avait dit « récompense à fond la créativité, disruption, **l'ux** »
  (D20). La grille a gardé « créativité 30 % » et réduit « l'ux » à « clarté en 5 s »,
  jugée sur capture par un modèle qui lit le texte sans effort : sur une capture, un
  paragraphe **aide** un jury IA à comprendre et **gêne** un brasseur au pouce.

Ce que ça corrige : un critère « premier plan » mesuré (mots, éléments, test des 5 s à
capture floutée) au même poids que la vérité ; le bavardage au-dessus du budget devient
éliminatoire comme un mensonge ; calibration du jury sur deux verdicts du brasseur qui se
contredisent en apparence (Beer Maverick téléphone « propre » malgré 7 écrans ; v2 « pire »
malgré sa densité).

### C3 (poids 4/5) — « Densité forte » a été lue comme « plus de texte », et transposée des formulaires aux écrans de lecture

La chaîne de transmission a perdu le sens des mots du brasseur (détail en section 2) :

- Mots du brasseur (septembre) : boutons, en-têtes, espacements. « BOUTON TOUJOURS TROP
  GROS IMPOSANT !! maximise la place !! » (C089), « BEAUCOUP MOINS d'espace entre les
  composants » (C088), « réduir le header au stric minimum » (C086). Et sur l'information :
  « trop d'info, trop de text ouvert de base. ça pollue » (C082), « Ce que tu caches c'est
  les infos pas les actionable » (C080), « les info sont des actionnable pas des
  "information, warning" ou explication » (C081).
- DESIGN.md lui-même est prudent : « Une mise en page plus courte n'est pas une preuve de
  meilleure UX », « contenu prioritaire visible, détails à la demande ». Mais sa
  description de frontmatter est devenue « un maximum de données utiles sur téléphone »,
  et `.claude/rules/affinee-frontend.md`, chargé dans toute délégation, ouvre par
  « **Maximiser l'espace utile et compacter les données est la règle principale** ».
- `REGLES.md` condense tout cela en « densité forte, petites commandes de 12 à 13 px ».
  Les auteurs ont donc écrit des **paragraphes** à 12–13 px (p06, p09, p19 : trois
  paragraphes sous la grille) : la taille de commande appliquée à du texte courant.
- Le pilote a renforcé le contresens : D19 retire « la recommandation « texte à 16 px »
  tirée de Beer Maverick » ; `v3/reference/beer-maverick/constats.md` raye « Texte petit et
  serré » au motif de DESIGN.md. Or le brasseur a jugé Beer Maverick téléphone (grands
  caractères, une colonne, une légende, `telephone/t3`, `t4`) « largement mieux » que nos
  écrans. Il n'a jamais demandé du texte petit ; il a demandé moins de chrome et moins de
  texte.

Ce que ça corrige : deux régimes dans DESIGN.md. « Chrome » (boutons, champs, barres,
marges) : l'échelle compacte actuelle. « Lecture et décision » (verdict, réponse, chiffre
lu) : 14–16 px, une ligne, jamais d'explication au premier plan. Et dans
`.claude/rules/affinee-frontend.md`, remplacer « compacter les données » par « montrer
d'abord l'utile, replier le reste ».

### C4 (poids 4/5) — Les formes imposées sont des documents et des instruments, pas des écrans

`v4/tournoi-formes-pilote.md` : feuille de juge BJCP, accordeur, table de mixage, profil
d'altitude, tableau à volets, grille de Crouwel, signalétique d'aéroport, bilan de
laboratoire, carte de score de golf, étiquette nutritionnelle, bulletin de vigilance météo,
une de journal, check-list de pilote. Treize formes sur dix-huit sont des **objets de papier
ou des pupitres** : en-tête d'identité, colonnes, légende, notes de bas de page. Le
« cockpit » est le résultat attendu de ces métaphores, pas un accident. Le brasseur, lui,
demandait des « UX UI booster » (C091, C093), « slider ou autre » (C092, C098), « des petits
tag pratique » (C095), « visuelement parlant et frappant » (C096), « plus de couleurs »
(C097) : le vocabulaire des apps mobiles, pas celui du formulaire.

Les trois maquettes « chaudes » sans forme (p17 cercles, p22 brouillard, p23 regard) sont
les moins bavardes (215, 171, 166 mots) et les seules où l'incertitude est rendue par une
**texture** et non par une phrase. Le jury du lot 2 a été arrêté avant de les noter.

Ce que ça corrige : tirer les formes dans le répertoire des apps mobiles actuelles (feuille
qui monte, puces de filtre, carte-réponse, contrôle segmenté, dépliage, compteur) et des
visualisations d'écart (jauge, barre de plage) ; garder les métaphores comme grammaire de
geste, jamais comme gabarit de page.

### C5 (poids 3/5) — Aucune architecture de l'information, aucun fil de fer, aucun composant partagé

- La méthode (`docs/qualite/methode-conception-frontend.md`, E2 → E4) passe du brief au
  HTML haute fidélité. D12 (17.10) avait décidé des « fils de fer basse fidélité (boîtes
  grises, vrais mots, vrai stock) » : l'étape a disparu de la méthode v4.
- 23 pages, 9 532 lignes de HTML, trois modèles, « aucun auteur ne voit le travail des
  autres ». Chacun redessine l'en-tête, le contrôle segmenté, la piste, la poignée et sa
  **propre légende** pour expliquer son propre encodage (planches `planche-390.png` des
  deux lots : 23 en-têtes différents, 20 légendes). La légende est le texte le plus visible
  du cockpit, et elle existe parce que la piste n'était pas un composant connu.
- « Pas de polissage », 45 minutes par tournoi : l'auteur livre son premier jet complet,
  c'est-à-dire tout ce que le brief liste.

Ce que ça corrige : un atelier minimal (piste au style, en-tête, segmenté, puce, feuille,
rangée) construit une fois avant le tournoi ; un fil de fer à 390 avec vrais mots et budget
de mots, validé avant le HTML ; le tournoi porte sur la composition et le geste, pas sur la
réinvention des primitives.

### C6 (poids 3/5) — Le scénario choisi est celui où le moteur n'a rien à montrer, donc il explique

Pack S1 (`pack-mini-protos.json`) : 12 familles « estimé », plages 0–44 à 0–55, confiance
`low`, 9 familles neutres sans verdict, et pour la demande principale (résine −1) une note
de 40 mots : « aucune voie ne peut établir une baisse… non modélisé ». D21 l'admet :
« Limites du modèle V5.5, à montrer dans les maquettes plutôt qu'à cacher ». Quand le dessin
n'a rien à dire, l'auteur écrit pourquoi. Le mur des neuf lignes identiques (défaut du lot
1) est une propriété des données, pas des formes ; la relance a demandé aux formes de le
résoudre.

Ce que ça corrige : concevoir d'abord sur S3 (IPA, stock, voies réelles) et S2, où le moteur
tranche ; traiter « non situé » et « aucune voie » comme des **états** à un mot ou un signe,
dont l'explication est au second plan ; décider au niveau du pack d'un texte canonique par
état, jamais laissé à l'auteur.

### C7 (poids 2/5) — Pas de référence d'app moderne, et le brasseur a vu 23 écrans d'un coup

- E1 ne retient que ses références à lui (Territoire, Explorer, Beer Maverick) et interdit
  de juger contre la concurrence. Aucune app mobile récente n'a servi de repère ; le lot 3
  cite HIG et Material 3 pour la première fois, **après** le refus.
- Le principe « le brasseur juge » (méthode, § Cinq principes) n'avait de porte qu'en E7,
  après M5. Il a vu 23 maquettes brutes sans filtre ; aucun lot n'a été mesuré en mots avant
  son verdict (l'outil `mots-premier-ecran.mjs` date de D23).
- Contrat de direction écrit en anglais, avec un « FINISH » copié du skill (« every shipping
  raster carrying its provenance ») sans rapport avec des maquettes : signe d'un processus
  piloté par l'outil, pas par la tâche.

Ce que ça corrige : un panneau de 6 à 8 apps mobiles actuelles (lecture d'une valeur contre
une plage, réponse d'abord, détail en feuille) ; trois finalistes montrés au brasseur après
chaque lot, cinq minutes.

### Responsabilités

Le pilote a écrit le brief, le contrat, REGLES.md, les consignes, la grille et le texte de
calibration du jury, a tiré les formes, a choisi S1 et a retiré le 16 px : C1, C2, C4, C6
lui reviennent. Les documents du projet portent C3 (DESIGN.md frontmatter, PRODUCT.md
« compacter les données autant que possible », `.claude/rules/affinee-frontend.md`) et C5
(la méthode sans fil de fer). Les auteurs ont suivi les consignes ; le jury a appliqué la
grille. Le brasseur a demandé la densité et la vérité, jamais le texte : la contradiction
apparente entre ses mots vient de leur transmission, pas de lui.

## 2. Ce que le brasseur a réellement demandé sur la densité et la taille

Source primaire, à l'instant (relayée par le pilote) :

> « Il faut que ce soit dense sur téléphone car je veux voir un Max d'info au même endroit
> mais ça doit pas être surchargé, et surtout on doit voir que en premier plan les
> informations réellement utilise. Ensuite on peut trouver plus d'infos avec des raccords,
> renvoie, replis ou autre. »

Ses mots antérieurs, `docs/besoins/corpus-demandes.md` (journal Codex et Claude, mot pour
mot) :

| Date | Citation | Portée |
|---|---|---|
| 03–04.09 | C087 « redimensionner les éspace, la police et taille des element pour maximiser l'espace. » ; C086 « réduir le header au stric minimum sur mobile pareil pour le footer » | chrome : espaces, en-tête, pied |
| 05.09 | C088 « tout peut être plus petit plus compact avec BEAUCOUP MOINS d'espace entre les composants. » ; C084 « visuel sombre mais compact. pas d'info surplus en doublon ou inutile. » ; C085 « voir un Max d'info sans que ce soit étouffant. » | espacement ; pas de surplus |
| 09.09 | C082 « il y a trop d'info, trop de text ouvert de base. ça pollue beaucoup et il y a de la redondance. » ; C083 « les caché ou trouver une astuce pour avoir juste les infos que j'ai besoin en premier » ; C080 « Ce que tu caches c'est les infos pas les actionable. » | texte replié, actions visibles |
| 12.09 | C089 « BOUTON TOUJOURS TROP GROS IMPOSANT !! maximise la place !! » ; C090 « des regles sur les taille de boutons qui sont contre ce que je veux faire: sure mobile maximiser l'espace et compatcer les données le plus possible. » ; C081 « les info sont des actionnable pas des "information, warning" ou explication » | **boutons** (origine de la décision du 12.09) ; pas d'explication |
| 29.09 | C062 « ça soit très pratique, pas surchargé, hyper lisible. » ; C064 « compréhensible sur mobile, pas forcément simple » | lisible ; profondeur accessible |
| 17.10 | C005 « lisible facilement et si je veux plus d'infos je peux les avoir facilement » ; C165 « UX UI doit être UTILISABLE Pratique facile avec les info uniquement que l'on a besoin et que l'on veut » | deux plans |

Lecture : il demande **beaucoup de données utiles et actionnables** dans peu de chrome,
**aucune explication par défaut**, et un second plan. Il ne prononce jamais « 12 px »,
« 13 px », ni « texte petit » ; « la police » (C087) vise l'espace perdu, dans le contexte
de l'en-tête et des boutons de l'app de septembre. « Hyper lisible » revient trois fois.

Ce que les agents en ont fait :

- **DESIGN.md (12.09, commit `71160d54`)** : la loi 4 « 14 px plancher, 36 px dessinés,
  44 px au doigt » est remplacée par une échelle : commande 12–13 px, libellé 12 px, texte
  courant 14 px, lecture 16 px. C'est une traduction correcte de C089–C090 pour les
  **commandes** ; le document dit lui-même « Les mesures à surveiller restent plus visibles
  que leurs métadonnées ». Extrapolation : la description de frontmatter « un maximum de
  données utiles sur téléphone » et `.claude/rules/affinee-frontend.md` « compacter les
  données est la règle principale » ont fait de la compacité un objectif en soi.
- **PRODUCT.md** : « compacter les données autant que possible » — « autant que possible »
  est un ajout d'agent ; le brasseur dit « sans que ce soit étouffant ».
- **REGLES.md et la grille** : « densité forte, petites commandes de 12 à 13 px » ;
  « Beaucoup de données utiles par écran ». Extrapolation : la densité devient un critère
  de **quantité**, sans le contrepoids « pas d'info surplus ».
- **D19 et `constats.md`** : « texte à 16 px » retiré, « texte petit et serré » rayé « au
  nom de DESIGN.md ». Extrapolation contraire à C062 et C005 : le brasseur a trouvé propre
  une page à grands caractères.
- **Jamais transmis** : C080–C083 (« trop de text ouvert de base », « ce que tu caches c'est
  les infos ») n'apparaissent ni dans le brief v4, ni dans REGLES.md, ni dans les consignes.
  L'inventaire `exigences-retrouvees.md` (61 exigences) ne les contient pas : il a relu les
  dossiers houblons, pas le corpus général d'UX.

Contexte des demandes de densité : les écrans de **saisie** et de **liste** de septembre
(recettes, stocks, eau : boutons, steppers, en-têtes). Aucune ne porte sur un écran de
lecture et de décision comme la feuille au style.

## 3. Ce qui doit être gardé — les bonnes idées, nommées

- **p06, rail de largeur fixe** : la bande du style a toujours la même largeur, la plage
  déborde physiquement. Normalisation au style par la géométrie, sans légende ni chiffre
  (NOTE p06, greffe du jury). C'est la primitive « piste » de l'atelier.
- **p09, une case = un cran** et le bouton unique paille « Voir les 14 voies » ; l'en-tête
  « 3 au style · 9 incertaines » comme résumé d'une ligne.
- **p07, le parcours** Départ → Poste 1 → Poste barré → Arrivée : la demande du brasseur
  dessinée comme un itinéraire, « non posable » comme un signe. À garder comme geste, à
  retirer de la grille (il traverse les lignes).
- **p19, « 5 neutres ⌄ »** : le repli des familles identiques en une ligne, le seul vrai
  dépliage du lot.
- **p17, les deux cercles** : « ce que le modèle ne situe pas n'entre pas dans un cercle ».
  Hiérarchie par appartenance, incertitude rendue par la place, pas par le texte.
- **p22, le brouillard** : incertitude en texture, « Dissiper » comme action ; **p23** : une
  fenêtre de style unique pour 12 familles, le nuage qui dépasse comme seul message.
- **p15, le titre-réponse** « Plus floral : possible. Moins résineuse : aucune voie. » :
  la réponse d'abord, en une ligne. Le pattern le plus moderne des 23.
- **p16, la bande d'état** « 2 à traiter · 8 non vérifiables · 3 conformes » en puces :
  un résumé actionnable.
- **p02, voyant ambre** quand la plage sort du cadran : un état, pas un chiffre.
- **p08, règle de quantification** : une plage qui touche une case l'allume ; jamais plus
  fin que la prédiction, par construction.
- **Territoire** (`v4/reference/concept-2-territoire/`) : la bière ★, la cible, la zone
  exclue hachurée, les voies numérotées **et** la liste de puces en langage naturel (« Plus
  juicy, pas amère, sans sapin ni résine ») qui devient une direction. C'est l'entrée de
  direction que le brasseur a aimée ; aucune maquette M1 ne l'a reprise.
- **Beer Maverick téléphone** (`t3`, `t4`) : une grammaire répétée, grands caractères,
  légende une seule fois, barres sur échelle commune. La grammaire à garder, pas le contenu.

## 4. Ce que je changerais en premier dans le processus

1. **Le premier plan se décide avant de dessiner, en mots et en nombre.** Pour chaque
   écran : la question du brasseur, ≤ 7 éléments, ≤ 60 mots, une action principale, un jeu
   de phrases canoniques par état du moteur (« non situé », « aucune voie », « ≈ »). Fil de
   fer à 390 (boîtes grises, vrais mots) validé contre ce budget, puis montré au brasseur
   cinq minutes. Le HTML vient après.
2. **Un atelier minimal avant tout tournoi** : piste au style, en-tête, segmenté, puce,
   feuille montante, rangée dépliable. Les auteurs composent ; ils ne redessinent pas, et ils
   n'ont plus de légende à écrire.
3. **Grille du jury refaite** : premier plan 30 % (mots mesurés, test des 5 s sur capture
   floutée à 50 %), geste 30 %, vérité 20 % éliminatoire, rupture 20 %. Le dépassement du
   budget est éliminatoire. Calibration sur Beer Maverick téléphone (propre) contre v2
   (refusée), avec les mots du brasseur.
4. **DESIGN.md en deux régimes** : chrome compact (échelle actuelle) ; lecture et décision
   (14–16 px, une ligne, explication au second plan). Réécrire la première ligne de
   `.claude/rules/affinee-frontend.md` : « montrer d'abord l'utile, replier le reste », et
   ajouter C080–C083 au brief de toute délégation frontend.
5. **Formes et références** tirées des apps mobiles actuelles, pas des documents ; une
   planche de 6 à 8 références modernes en E1, à côté de Territoire.
6. **Scénarios où le moteur tranche** (S3 IPA d'abord) ; les états faibles du modèle sont
   conçus comme des états, pas comme des cas à expliquer.
7. **Le brasseur voit trois finalistes après chaque lot**, jamais 23 à la fin.

Preuves non obtenues : le verdict du jury sur le lot 2 (arrêté) ; le ressenti du brasseur
maquette par maquette (il a jugé l'ensemble). Les captures ont été regardées en PNG, pas sur
son téléphone.
