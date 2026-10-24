# Critique de la série a (a1–a6) : « ajout cumulé, levure, biotransformation »

Regardé, à 390 px : a1 (haut, page, actif Pomona, bas, légende, fiche), a2 (haut, page, Verdant
ensemble), a3 (haut, page, avant, après, moments), a4 (haut, page, dose 8), a5 (haut, page, Verdant
après), a6 (haut, page, Idaho 7 agrumes, jours), et les six NOTE.md.

Gestes joués par moi (puppeteer-core, Chrome, 390 × 844) :
- **a1** : Pomona : la ligne « géraniol → citronellol « medium » agrumes ~+2, floral ~+2 » apparaît.
- **a2** : « ensemble » : la réponse passe de « levure ~+19 » (Pomona, à la suite) à « levure ~+4 »
  (Verdant, ensemble, capture) ; Diamond hachuré.
- **a3** : plan « osé » : « Contre ta bière sans ajout : tropicaux ~+29… » devient « Contre ton plan
  d'avant : tropicaux ~+10 · noyau ~+8 · agrumes ~+6 · baies ~+5 » ; à 60′ avec Citra 2 g/L :
  « hors grille ».
- **a4** : Pomona : le premier gramme passe de ~11,5 à ~12,5 ; curseur à 8 g/L : « le dernier pas de
  la grille : ~2,3 point par gramme ».
- **a5** : « échanger » inverse A et B ; capture : « B, avec le dry hop actif, Verdant IPA : résineux
  ~−6 · végétal ~−5 ».
- **a6** : « + Idaho 7 » : « Même niveau à la fin ~33 ; à la suite, atteint ~J+11 au lieu de ~J+8, et
  Idaho 7 reste 5 j au contact ». Aucune fuite sur les six pages.

À savoir : `profils-simules.json` a été régénéré à 4,75 % vol. après ces rendus ; les pages portent
les anciens chiffres (≈ 4 % trop hauts ; Citra à 10′ ne sort plus du style en agrumes). Je juge les
formes, pas les chiffres.

Ses mots entre « guillemets » ; mes déductions marquées [critique].

## a1 — deux houblons, un dry hop, part par part

**Première réaction** : « Enfin je vois qui apporte quoi : Citra plein, Galaxy rayé, et "chacun seul" en
pointillé : la différence c'est la saturation. "×1,5, pas ×2" mesuré, ça c'est une vraie info. Mais
c'est chargé, les flèches partout, et "à trancher" sur quoi ? »

**Ce qui va**
- La question K5 dans sa forme la plus honnête : une ligne par famille, la part de chaque houblon en
  motif (plein, rayé), la part de la levure en hachures, « chacun seul » en pointillé : l'écart avec la
  barre **est** la saturation partagée. « Doubler la dose ne double pas l'arôme » avec la courbe
  mesurée d'E04 (« ×1,5, pas ×2 ») : « Les deux se complément ».
- Le tableau ensemble / chacun seul à même dose totale ; les rapports au seuil des cas K5 en bandes
  log ; le linalol publié (144 µg/L) à côté du centre du moteur (~534) : la réserve écrite.
- Pomona fait bouger (« agrumes ~+2, floral ~+2 ») ; CUMUL OK ; moment par défaut **actif** (le seul de
  la série à l'avoir compris dès le départ) ; HONNETE et DOIGT contrôlés par l'auteur.

**Ce qui ne va pas**
1. 154 mots ; les lignes « ≈ inchangé » et « rien de simulé » au premier écran (la NOTE le dit).
2. Flèches de borne haute sur presque chaque ligne ; trois motifs (plein, rayé, hachuré) + pointillé +
   trait fin : cinq codes sur une ligne, légende nécessaire.
3. « à trancher » (Lafontaine H / J) : tranché depuis (H a raison) ; à corriger.
4. Doses figées à 2 + 2 g/L et 3 j (grillePaires) : la page le dit, mais la liberté s'arrête là.
5. Lignes couchées : écart à la baseline assumé et justifié (deux houblons sur une ligne).

**À essayer**
- Motifs réduits à deux : couleur du houblon pour la part (deux teintes, D51), hachures pour la levure ;
  « chacun seul » en tiret fin ; une marque de borne partielle.
- Lignes inchangées repliées (« + 3 familles inchangées »).
- La courbe « ×1,5, pas ×2 » en tête, à côté de la réponse.

**Verdict : à garder** (candidate pour la question K5 ; à greffer sur le simulateur retenu comme vue
« à deux »).

## a2 — ce que la levure en fait

**Première réaction** : « "Houblons ~197 · levure ~+19 · CO₂ ~−21" : la levure pèse moins que ce que
le CO₂ emporte ?? Ça c'est une leçon. Mais le dessin avec tous les rubans qui se croisent, c'est un
écran de centrale nucléaire. »

**Ce qui va**
- La réponse en une ligne est la plus forte de la série : la levure pèse peu face aux houblons, et le
  CO₂ emporte plus qu'elle n'ajoute ; après fermentation, « levure 0 », écrit.
- Quatre cartes de levure avec un fait réel chacune (« esters low », « β-lyase : qualitative »,
  « géraniol → citronellol : medium », « lager, 10–15 °C ») ; les vraies valeurs (géraniol dans l'huile,
  citronellol au-dessus du seuil E01, précurseurs, rendement H42, hop creep H68) ; « aucune mesure ne
  croise variété × levure × dry hop ».
- Honnête jusqu'au bout : « le moteur ne déplace pas le floral vers les agrumes », le CO₂ « convention »
  marqué, Diamond hachuré « ensemble ».

**Ce qui ne va pas**
1. Le Sankey : douze rubans, des filets blancs qui se croisent, deux étiquettes flottantes au milieu
   (« géraniol → citronellol », « myrcène emporté ») ; « énormément d'information pour rien »,
   « cockpit d'avion » (D23). Les étiquettes de gauche se chevauchent (« Noyau ~18 » sous le ruban).
2. 177 mots ; la paire figée à Citra + Idaho 7 ; Diamond inactif en « ensemble ».
3. Les barres de l5b « Dans la 16D » sont sous le pli : la lecture au style vient après la chimie du flux.

**À essayer**
- Le flux en trois colonnes de barres empilées (houblons → CO₂ emporte → levure ajoute → bière), une
  par famille forte, sans rubans croisés ; la ligne de réponse en tête.
- Les barres de l5b juste sous la réponse ; le flux à un toucher (« d'où ça vient »).

**Verdict : à pousser plus loin** (la réponse et les cartes de levure à greffer ; le Sankey à
remplacer).

## a3 — mon plan de houblonnage

**Première réaction** : « Le déroulé de mon brassin avec les cases, mon houblon, ma dose, mes jours, ma
levure, et la bière qui bouge avec le plan d'avant en pointillé : c'est complet. Sage / franc / osé en
haut à droite, bien. Mais "hors grille" dès que je sors des cas, et les boutons barrés… »

**Ce qui va**
- Le plan complet sur le déroulé (brassage : 60′, 10′, whirlpool ; fermentation : J+2 actif, J+7
  après), tous les réglages, le profil de l5b avec le plan d'avant en pointillé et les valeurs qui
  changent éclairées (« Contre ton plan d'avant : tropicaux ~+10… », preuve rejouée : 7 familles). C'est
  l'esprit de x1 avec le temps en plus.
- « Pourquoi à 10′ et pas à 60′ ? » chiffré par la grille en bas (~5, ~22, ~22, ~27, ~28 avec les IBU) ;
  trois plans tout faits ; CUMUL OK ; 156 mots ; pire contraste 7,37:1.

**Ce qui ne va pas**
1. Ce que la grille ne couvre pas se hachure : à 60′ avec 2 g/L, « hors grille » ; dose, contact et
   levure barrés selon le cas. Beaucoup de boutons morts selon l'état.
2. Le second houblon par un petit « ▾ » peu visible (la NOTE le dit).
3. Flèches de borne haute sur toutes les familles ; les drapeaux en pastilles empilées sous le profil.
4. Page de 1,2 Mo ; sage / franc / osé déjà dans w2, x4, e3.

**À essayer**
- Hors grille : aimanter au cas simulé le plus proche et le dire (« simulé à 4 g/L »), plutôt que
  hachurer.
- « + un second houblon » en pastille pleine, à côté du premier.
- Fusion avec x1 : x1 a les barres et l'échelle, a3 a le déroulé et le plan d'avant en pointillé.

**Verdict : à garder par fusion avec x1** (le déroulé et le « plan d'avant » sont les greffes).

## a4 — le gramme suivant

**Première réaction** : « "De 2 à 4 g/L, chaque gramme rapporte ~4,5 points, contre ~11,5 pour le tout
premier" : ça je ne le savais pas comme ça. Et à 8 g/L, ~2,3. Les petites courbes, une par famille, ça
se lit. C'est une page sur la dose, et elle répond. »

**Ce qui va**
- Une question de brasseur que personne ne posait : la **pente**. Douze petites courbes dose → famille
  (zone du style en fond, plage en bande, orangé au-delà), le curseur qui traverse toutes les courbes,
  « à 4 g/L ~+11 (~5,4 par g/L) » sous chacune, la réponse en une ligne.
- La saturation **mesurée** (E04, intensité 3 · 6,3 · 8,1 · 10,4 · 12,3) avec le même curseur, et la part
  de linalol extraite (23 % → 7 %) : « pour montrer que la saturation est mesurée et pas une idée du
  moteur ». La même dose totale à deux (Citra + Galaxy 2 + 2 contre Citra seul 4). CUMUL OK.

**Ce qui ne va pas**
1. La grille n'a que quatre doses : le curseur saute ; entre deux, rien.
2. 172 mots ; « à trancher » sur E04 (tranché : H).
3. Petits multiples de 66 × 66 px : lisible en gros (pente, sortie du style), pas en valeur.
4. « Hors du style » écrit sur six cartes à 8 g/L : répété.

**À essayer**
- Curseur aimanté aux quatre doses avec les crans dessinés sous la piste.
- Pictos de famille « hors » en tête de la réponse, pas sur chaque carte.
- La courbe mesurée E04 juste sous la réponse (c'est la preuve).

**Verdict : à garder** (candidate pour la question « combien » ; à greffer sur la carte des
possibles de s3 comme vue « pente »).

## a5 — le duel de deux plans

**Première réaction** : « A et B face à face, Pomona contre US-05 : "agrumes ~+6, floral ~+3". Petit,
mais je vois le sens. "Échanger" marche. Par contre les plages derrière sont énormes : +6 là-dedans,
c'est sûr ? »

**Ce qui va**
- Le papillon (A à gauche, B à droite, la famille au milieu, l'écart écrit vers le côté le plus fort,
  la barre la plus forte cerclée) : on compare deux plans d'un regard. Par défaut, un duel de **levures**
  sur la même paire : la question K4 telle quelle.
- La réponse en une ligne (« B, avec Pomona au lieu de US-05 : agrumes ~+6 · floral ~+3 · noyau ~+2 ·
  5 autre(s) ») ; aucun gagnant désigné ; les fiches des deux levures marquées « fournisseur » ;
  « non documentée » pour US-05 ; CUMUL OK ; 149 mots.

**Ce qui ne va pas**
1. Les écarts de levure (1 à 6 points) devant des plages de 60 points : « l'écart peut se lire comme sûr »
   (la NOTE le dit). Un instrument qui écrit « ~+6 » gras et la plage en trait fin ment un peu sur sa
   certitude.
2. Le nom du plan tronqué (« Citra + Idaho 7 · 2 + 2… ») dans les deux sélecteurs.
3. s2 (trois plans), e2 et x2 (duels) portent déjà la comparaison : doublon partiel.

**À essayer**
- Écrire « ~+6 (dans une plage de ±30) » ou griser l'écart quand il est sous le dixième de la plage.
- Noms de plan en deux lignes ; le papillon greffé sur s2 comme vue « deux plans ».

**Verdict : à pousser plus loin** (le papillon est une bonne forme ; l'honnêteté de l'écart face à
la plage doit se voir).

## a6 — ensemble ou à la suite ?

**Première réaction** : « "Même niveau à la fin ~41 ; à la suite, atteint J+11 au lieu de J+8, et
Galaxy reste 7 j au contact" : donc à la suite, ça ne donne pas plus, ça donne plus tard, avec plus de
risque. Ça, c'est une réponse de brasseur. Mais 206 mots, et les quatre courbes plates du bas… »

**Ce qui va**
- La question K3 contre K5 répondue en une ligne **vraie** : l'ajout à la suite ne donne pas plus
  d'arôme, il le donne plus tard, avec plus de jours de contact (et le hop creep). Les barres de
  contact sur le calendrier, les études posées à leur jour (24 h, 2 j, 3 j), le tableau final par famille
  (identique dans les deux cas), la saturation ~68 %, les inconnus (ordre, synergie, masquage).
- Les études à côté (deux ajouts contre un : H76, « presque rien à l'échelle industrielle » ; l'ordre :
  aucune étude ; E08 ; E10) ; « Combien de jours de contact ? » avec ses courbes plates : le moteur
  plafonne à 3 j, et il le montre.

**Ce qui ne va pas**
1. **206 mots**, les plus nombreux de la série : la réponse, le tableau, les puces, les quatre études.
2. Les cas K3 n'existent qu'avec US-05 après fermentation ; la levure ne se règle qu'en bas.
3. Les quatre courbes plates « Combien de jours » : vrai, mais quatre graphiques pour dire « rien ne
   bouge » ; une phrase et une courbe suffisent.
4. a6, r2, x3, v3 et u2 sont cinq vues du temps.

**À essayer**
- Réponse, calendrier, tableau ; études et jours à un toucher : ≈ 110 mots.
- « Combien de jours » en une courbe et une phrase (« après 24 h, rien de plus mesuré »).
- Greffer la réponse « plus tard, pas plus » sur x3 (la frise retenue).

**Verdict : à garder par greffe** (la réponse d'a6 entre dans la frise retenue).

## La série : relancer ou pas

**Pas de relance.** La série fait ce que le brasseur a demandé (« c'est normalement à intégré dans les
autres aussi ») et le démontre : CUMUL OK 6/6, actif par défaut dès a1, trois leçons de brasseur que
personne d'autre n'écrit (« ×1,5, pas ×2 » ; « la levure pèse peu, le CO₂ emporte plus » ; « à la
suite, plus tard, pas plus »). Deux candidates (a1 pour K5, a4 pour la dose) ; trois greffes (a3 → x1,
a5 → s2, a6 → x3) ; une forme à remplacer (le Sankey d'a2). Défaut commun : les mots, et les flèches
de borne haute sur chaque famille.

## Retouches à renvoyer à l'auteur (seconde passe)

Communes
1. Régénérer sur `profils-simules.json` à 4,75 % vol. ; rejouer les phrases chiffrées.
2. Lafontaine : lecture H, « vérifié (K) » ; retirer « à trancher » (a1, a4).
3. Une marque de borne haute partielle par barre, pas une flèche par famille.
4. Mots : lignes inchangées repliées, études et drapeaux à un toucher ; viser 110.
5. Hors grille : aimant au cas simulé le plus proche, dit ; levures non simulées dites une fois.

a1
6. Deux motifs (couleur du houblon pour la part, hachures pour la levure) ; « chacun seul » en tiret fin.
7. La courbe « ×1,5, pas ×2 » à côté de la réponse.

a2
8. Flux en trois colonnes de barres empilées ; barres de l5b sous la réponse ; Sankey à un toucher.

a3
9. « + un second houblon » en pastille pleine ; fusion proposée avec x1 (déroulé et plan d'avant en
   pointillé).

a4
10. Curseur aimanté avec crans dessinés ; « hors » en tête, pas par carte ; E04 sous la réponse.

a5
11. Écart grisé ou qualifié quand il est petit devant la plage ; noms de plan en deux lignes.

a6
12. Réponse, calendrier, tableau au premier écran ; « Combien de jours » en une courbe et une phrase.
