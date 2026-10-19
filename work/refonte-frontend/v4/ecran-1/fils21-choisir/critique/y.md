# Critique de la série y (y1–y5) : « au doigt »

Regardé, à 390 px : y1 (premier écran, avant, pendant, après, Pomona actif, ensemble), y2 (premier
écran, avant, pendant, après, suite J4, suite fin, ensemble Pomona), y3 (premier écran, avant,
pendant, après, ensemble), y4 (premier écran, avant, pendant, après, après fermentation), y5 (premier
écran, avant, pendant, après, tirages), les cinq NOTE.md et les `geste-yN.json` (valeurs avant /
pendant / après enregistrées par l'auteur).

Gestes joués par moi (puppeteer-core, Chrome, 390 × 844) :
- **y1** : le pouce de la frise glissé de 60′ vers 20′, doigt gardé : la loupe écrit « ≈ 20′ » avec
  « Entre 60′ et 10′ : ≈ interpolé, la grille du moteur n'a que 60′ et 10′ », Citra passe à
  « agrumes ~+2 crans », l'IBU à « ≈ 108–132, hors du style ». Le profil se redessine pendant le geste.
  « Ensemble, 2 + 2 g/L » : la frise dit « Glisse l'ajout · ensemble 2 + 2 g/L ». L'auteur a mesuré la
  loupe : 40,5 px par cran sous le doigt contre 13,5 sur la frise (×3,0).
- **y2** : « Maintiens » tenu 0,9 s puis 2,4 s : le repère avance sur le calendrier, « depuis hier :
  presque rien ne bouge » puis « Plus rien ne bouge. Le moteur arrête l'extraction à 3 j ». Sur
  « Citra 3 j puis Galaxy 7 j », tenu 1,6 s : « Galaxy entre : la saturation est partagée, ensemble
  ≈ 69 % de la somme en tropical », « depuis hier : tropicaux ~+1 cran ».
- **y3** : je n'ai pas atteint le bouton de la molette par script ; les puces de dose répondent (2 g/L :
  « le gramme de plus ~+0,5 cran par g/L », charge d'huile 1–5,2 mL/hL). Le `geste-y3.json` de
  l'auteur enregistre la molette : 3, 22, 36, 57, 80, 104 px à 0, 1, 2, 4, 8, 16 g/L.
- **y4** : la carte US-05 balayée vers la gauche, doigt gardé : Pomona vient au centre, « face à
  US-05 : agrumes ~+0,5 cran · noyau ~+0,2 · floral ~+0,2 » ; au lâcher, ~+0,6. « après » : « aucun
  écart, même profil ».
- **y5** : Galaxy posé (« ensemble : tropicaux ~+4 crans · agrumes ~+3 ; saturation partagée ~69 % /
  ~72 % ») ; six « Tire une bière » : « 6 bières tirées, hors du style : végétal 5 sur 6, tropicaux
  4 sur 6 » ; « Tire-en 20 » : « 26 bières tirées : tropicaux 24 sur 26 ». Aucune fuite sur les cinq.

Ses mots entre « guillemets » ; mes déductions marquées [critique].

## y1 — le brassin au doigt

**Première réaction** : « Ah voilà. Je glisse, la loupe me dit où je suis, et les barres bougent
pendant que je glisse. À 60′ rien ne bouge et 140 IBU hors style, à 10′ +3 crans d'agrumes, après
+4 et plus d'IBU. C'est exactement la question. Citra et Cascade sur les mêmes lignes, bien. »

**Ce qui va**
- **Le geste qu'il demande depuis le rail** : « glisser comme un slider le moment de l'ajout » (D27),
  « des tranches de 5′ » (D34), « un truc type UX apple qui zoom focus là où on est » (D47), « P2 le
  grossissement suit le doigt ». Ici : pas de 5′, loupe ×3 mesurée, aimantée sur 60′, 10′, whirlpool,
  actif, après, et le profil se redessine **pendant** le geste (D46 : fluide). C'est la seule page du
  lot qui tient toutes ces demandes à la fois.
- La réponse à « 10′ ou 60′ » sans légende : l'IBU en barre avec la zone 50–70 et « hors du style »,
  le « pourquoi » du moment en une ligne sourcée (« À 10′, une part reste : linalol 60–63 % retrouvé »,
  « Dry hop après : 80–82 %, l'essentiel en 24 h. Pas d'IBU »), « ≈ interpolé » entre deux points de la
  grille : honnête sur ce que le moteur ne sait pas.
- Citra (plein) et Cascade (pointillé) sur les mêmes 12 lignes nommées, à dose égale, avec « hors
  style » écrit sur la ligne et « inconnu » hachuré ; l'écart écrit par houblon.
- CUMUL OK, Pomona en actif bouge, ensemble 2 + 2 avec la part de Cascade hachurée ; **131 mots**, le
  plus léger des briefés avec w1 ; vraies valeurs et bandes log sous le pli.
- Baseline : pictos au trait, au style / absolu, α, usage en mot, « ? », fiche. Lignes couchées,
  justifié (« une icône que la légende doit expliquer est un défaut »).

**Ce qui ne va pas**
1. Les plages du moteur (0 à 55+) font un long trait gris sur chaque ligne ; la flèche de borne
   partielle sur presque toutes.
2. Le pouce « ||| » de 32 px sous une loupe de 300 px : la loupe cache la frise au-dessus du doigt et
   écrit « 10′ » deux fois (dans la loupe et sous elle).
3. Le résineux orangé plein sur toute la ligne (déjà hors style) ; « résineux ~+2 crans » pour Cascade
   dans la réponse alors que c'est déjà au-delà.
4. Verdant et Diamond « inconnu » en actif (grille US-05 / Pomona) ; à chaud, le profil d'US-05 en le
   disant.
5. La frise est sous le profil : le geste commence à mi-écran. [critique] Il voudra la frise sous le
   pouce dès le premier écran.

**À essayer**
- Frise en haut, juste sous le titre, le profil dessous (le doigt en bas de l'écran, les barres au
  milieu) ; ou la frise collée au bas de l'écran comme un dock.
- Une seule marque de borne partielle ; le trait gris de plage en pâle.
- La loupe décalée au-dessus du doigt sans cacher les deux graduations voisines ; « 10′ » écrit une fois.
- Résineux : « déjà au-delà, ta dégustation » une fois, hors de la réponse par houblon.

**Verdict : à garder** (candidate pour les 5, en tête : le simulateur « quand » que le brasseur
attendait ; x1 s'y fond pour les réglages et l'échelle).

## y2 — la cuve, jour par jour

**Première réaction** : « Je tiens le doigt et les jours passent, c'est marrant, et au bout d'un jour :
"plus rien ne bouge". Donc 3 jours c'est pour rien. Sur Citra puis Galaxy, "Galaxy entre" et ça
remonte un peu. Mais après J+2 je tiens pour rien. »

**Ce qui va**
- Le geste « maintenir » fait vivre le temps : un jour toutes les 0,35 s, « depuis hier » dit ce que ce
  jour a changé, le profil du jour face à la fin du plan en pointillé. Sur la suite, Galaxy entre à
  J+4 et la saturation partagée s'écrit : K3 se **voit passer**.
- La leçon est honnête et répétée partout : « Plus rien ne bouge. Le moteur arrête l'extraction à 3 j
  (H73) » ; sept jours de Galaxy n'ajoutent rien après le troisième ; « la suite finit au niveau des deux
  ensemble ».
- Les vraies valeurs changent avec le jour lu (24 h, 1 h = 96 h, 2 j Eureka!, > 3 j aucun gain). Six
  plans en grille sans trou, quatre levures, K4 et K5 ; CUMUL OK ; 154 mots.

**Ce qui ne va pas**
1. « Le geste "maintenir" perd son intérêt après J+2 » (la NOTE le dit) : on tient un bouton pour voir
   qu'il ne se passe rien. x3 (curseur sur une frise de J0 à J18) et u2 (sachets glissables) disent la
   même chose en un regard.
2. Deux échelles : jours de cuve (J0 à J17) sur le calendrier, jours de contact (J+n) au compteur.
3. Le « J0 » de remise à zéro ressemble au compteur.
4. Diamond « inconnu » hors K4.

**À essayer**
- Le maintien comme geste **secondaire** de x3 : tenir le curseur fait avancer le jour ; « depuis hier »
  en bulle.
- Une seule échelle (jours de cuve), le contact écrit sur le bloc du houblon.

**Verdict : à garder par greffe** (le maintien et « depuis hier » entrent dans la frise retenue x3).

## y3 — la molette

**Première réaction** : « "Pour égaler Citra 4 g/L, il faudrait ~10,7 g/L de Cascade en agrumes, et
jamais en tropical, même à 16 g/L." Ça, c'est LA réponse à "ils sont similaires". Et la molette qui
ralentit, je sens la saturation. Le panel OSU à côté, 1,9 → 7,1 → 7,0, plafond dès 8 : vrai. »

**Ce qui va**
- **La phrase d'équivalence** : la plus claire du lot pour D85 (« citra aura un effet extrêmement
  differents en dry hopping que cascade ») ; en crans du style, par famille, « ~ jamais » écrit quand
  c'est impossible. À côté, la vraie valeur qui tranche (4MMP ×4–71 contre ×0,96–7,1 sur base commune).
- La molette : « à angle égal, la barre avance de moins en moins : c'est la courbe du moteur », crans
  sentis à 1, 2, 4, 8, 16 g/L, « ≈ » entre deux doses, « au-delà de la grille » après 8 ; « le gramme de
  plus » écrit (~+0,4 → ~+0,2 → ~+0 cran par g/L). Vérifié par l'auteur : la molette redonne la grille
  à 0,62 point près.
- Le panel OSU (E04) lu selon la recherche K (les agrumes plafonnent, l'herbacé monte) : à jour.
  L'ajout cumulé « dans le même ajout que Citra 2 g/L » fait tourner le second houblon sur la même
  saturation et écrit ce qu'il ajoute vraiment (~50 % de seul).

**Ce qui ne va pas**
1. Mon script n'a pas trouvé le bouton de la molette (SVG) ; au doigt réel, un cercle de 300 px avec un
   bouton de 50 px demande de viser ; les puces de dose dessous font le même travail en un toucher.
2. CUMUL C2 en échec : « après » par défaut, la levure au repos (défaut du lot).
3. Au-delà de 8 g/L, extrapolation ; « jamais, même à 16 g/L » repose dessus (dit).
4. 152 mots ; noyau et melon « inconnu » pour Cascade, trois hachures.

**À essayer**
- La phrase d'équivalence **dans v1** (le duel), sous « mêmes mots, pas le même cône ».
- La molette comme réglage de dose de s3 / a4 (la pente), avec les puces en secours ; ou un curseur
  droit aimanté (a4) si la molette gêne au doigt.
- État de départ actif.

**Verdict : à garder par greffe** (l'équivalence dans v1, la molette ou son curseur dans la vue
« combien »).

## y4 — les levures en cartes

**Première réaction** : « Je balaie, la carte vient, les barres glissent : agrumes +0,5 cran avec
Pomona. C'est petit. Et chaque carte est un pavé de texte. Après fermentation, "aucun écart, même
profil", au moins c'est dit. »

**Ce qui va**
- Le balayage est fluide, le profil fond d'une levure à l'autre pendant le geste, la carte se cale au
  lâcher ; les voisines dépassent sur les bords (invitation au geste). Les noms sous le rail se touchent
  aussi.
- Chaque carte dit le vrai et le simulé : atténuation et température de la fiche, esters en familles,
  statut de la biotransformation (documentée, qualitative, non publiée), puis ce que le moteur simule
  par houblon (citronellol ~55 µg/L [0–446]) ; « linalol stable entre 12 souches (H44, p = 0,82) » ;
  Diamond « le plus de thiols mesurés, le fruité perçu le plus faible », écrit et non simulé.
- CUMUL OK ; cinq plans K4 / K5 ; après fermentation : « les quatre cartes donnent la même bière ».

**Ce qui ne va pas**
1. **262 mots** : le plus lourd du lot entier ; les cartes voisines comptent aussi.
2. L'effet de levure est petit dans le moteur (~0,6 cran au plus) : « le geste se voit surtout dans les
   chiffres et la carte, peu dans les barres » (la NOTE le dit). Un balayage pour un demi-cran.
3. Verdant et Diamond donnent le même profil (même convention de thiols).
4. a2 dit la même chose en une ligne (« levure ~+19 · CO₂ ~−21 ») ; a5 compare deux levures d'un regard.

**À essayer**
- Cartes en trois lignes (nom, statut, ce que le moteur simule en un chiffre), le reste au toucher :
  ≈ 120 mots.
- Les cartes comme **sélecteur de levure** des retenues (balayage gardé), pas une page seule.

**Verdict : à pousser plus loin** (le sélecteur à cartes est une bonne greffe ; la page seule est
trop lourde pour un effet trop petit).

## y5 — une bière possible

**Première réaction** : « Je tire une bière, un point par famille ; j'en tire 20, et je vois le nuage :
tropicaux hors style 24 fois sur 26. L'incertitude, je la vois, elle n'est pas effacée. Mais 20
bières pour une plage de moteur, c'est du possible, pas du probable, c'est écrit, ok. »

**Ce qui va**
- « Si il y a des écart x100 justement il faut que ça se voit » : c'est la forme la plus tangible du lot
  pour l'incertitude, **sur les familles en crans** (ce que u4 faisait sur les composés et r3 sur une
  carte) : chaque toucher tire une bière dans la plage, un point par ligne, orangé hors du style, et le
  compte s'écrit. « L'étendue du possible, pas une probabilité mesurée » : la réserve est sur la page.
- Deux gestes propres : glisser un houblon dans la cuve (la cuve s'éclaire), poser deux houblons =
  ensemble avec la part du second hachurée et la saturation partagée ; « secouer le téléphone tire
  aussi ».
- Six houblons des paires, charge d'huile de l'ajout, bandes log, trous écrits ; 150 mots.

**Ce qui ne va pas**
1. « végétal hors du style 5 sur 6 » vient d'un haut partiel à ~120 : l'étendue de ce qu'on ne sait pas,
   pas un risque (la NOTE le dit) ; le chiffre impressionne quand même. [critique] Il lira « végétal
   hors style » comme un défaut de Citra + Galaxy.
2. Le tirage est triangulaire autour du centre : une convention de page ; les comptes changent à chaque
   fois (24 sur 26 puis 11 sur 12) : un instrument dont la lecture bouge sans qu'on ait rien réglé.
3. CUMUL C2 : « après » par défaut.
4. Un tirage efface les précédents au changement de réglage, sans le dire.

**À essayer**
- « Tire une bière » comme bloc commun des retenues, derrière chaque bande d'incertitude (avec « d'où
  vient l'écart ? » de u4 à côté).
- Les familles à haut partiel marquées « plage ouverte » et exclues du compte « hors style », ou comptées
  à part.
- Tirage fixe (graine) tant que les réglages ne changent pas ; « 20 bières » d'un coup par défaut.

**Verdict : à garder par greffe** (l'incertitude tangible, à poser sur les cinq retenues).

## La série : relancer ou pas

**Pas de relance.** C'est la série la plus « au doigt » du lot, et la seule où chaque geste est
**prouvé** (les `geste-yN.json` avant / pendant / après, la loupe mesurée ×3,0). y1 entre dans les
cinq ; y2, y3 et y5 donnent trois greffes fortes (le maintien, l'équivalence Cascade / Citra, le
tirage de bières) ; y4 donne un sélecteur. Défauts communs : les plages en long trait gris sur chaque
ligne, « après » par défaut (y3, y5), et le geste principal sous le pli (y1, y2).

## Retouches à renvoyer à l'auteur (seconde passe)

Communes
1. État de départ actif (K4) sur y3 et y5 ; Verdant et Diamond dits une fois.
2. Plage en pâle, une seule marque de borne partielle par ligne.
3. Le geste au premier écran : frise (y1), calendrier et « Maintiens » (y2), molette (y3) visibles sans
   défiler, le profil juste au-dessus ou en dessous.
4. `profils-simules.json` à 4,75 % vol. : rejouer ; les `geste-yN.json` aussi.

y1
5. Loupe décalée, « 10′ » écrit une fois ; résineux « déjà au-delà » une fois.

y2
6. Une seule échelle de jours ; « J0 » de remise à zéro renommé (« recommencer ») ; proposé en greffe à
   x3.

y3
7. Phrase d'équivalence proposée à v1 ; molette avec les puces en secours, ou curseur aimanté.

y4
8. Cartes en trois lignes, détail au toucher ; proposé comme sélecteur de levure aux retenues.

y5
9. Hauts partiels « plage ouverte », hors du compte ; tirage fixe à réglages constants ; « 20 bières »
   par défaut ; proposé en bloc commun.
