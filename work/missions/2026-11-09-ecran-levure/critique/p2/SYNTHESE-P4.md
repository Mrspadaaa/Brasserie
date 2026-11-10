OK — passe 4 : candidates c6b (Chercher) et s7a (Suggérer) ; 4 acceptées, 0 rejet ; 2 retouches de données avant le panel

# Passe 4 Levure : Chercher (c6a, c6b) et Suggérer (s7a, s7b) — critique calibré, 09.11

Vu (L12) : `c6a-cadres.png`, `c6a-haut.png`, `c6b-cadres.png`, `c6b-haut.png`, `s7a-cadres.png`, `s7a-haut.png`, `s7b-cadres.png`,
`s7b-haut.png` (3 cadres 390 × 844 chacune), côte à côte avec ses bases `c5a-cadres.png` et `s6a-cadres.png`. Lu : BRIEF-PASSE4, AUDIT-FILTRES,
SPEC (ses mots du 09.11), DEFAUTS LV-1, les quatre NOTE.md, `comptes-p4.txt`. Rejoué : `node p2/s7a/controle-p4.mjs p2` → c6a OK 11/11 · 7/7 ·
US-05 en tête ; c6b idem ; s7a 12 axes, 0 but nommé ; s7b idem ; s6a ECHEC (22 buts nommés) : le contrôle échoue bien sur la version rejetée.
Hauteurs mesurées dans le CSS : lignes du tiroir c6a 27 px (`c6a-sec`), index c6b 26 px (`c6b-idx span`), moitiés − / + de s7a 24 px
(`s7a-pm span`), mini-curseurs s7b piste 44 × 8 px et bouton 10 px (`s7b-pst`, `s7b-sw`). DESIGN.md : filtres et lignes de données 28–32 px ;
une cible contient un carré de 24 px.

## Ses quatre questions (le pilote), en une ligne chacune
- **18 filtres tenables au pouce sur 390 px ?** Oui pour c6a (11 lignes + 7 puces + Trier dans un écran) et c6b (index de 18 dans la feuille,
  sans défiler) ; les deux à 26–27 px par ligne, un cran sous les 28–32 px de DESIGN : à passer à 30 px. Non pour les mini-curseurs de s7b
  après un choix (44 × 8 px, bouton 10 px).
- **Ordre c4 gardé ?** Oui, dans les deux : après « 1056 », US-05 est première (liseré bleu), Verdant, Pomona, NovaLager ; « repères 19 °C · 7 % »
  en pointillé rouge, jamais un filtre ; la 1056 garde sa carte, ses plages et le trait rouge de la conduite.
- **Suggérer générique sans perdre s6a ?** Oui sur les cartes : 12 axes, chacun − et +, aucun but nommé, « banane » et « girofle » redevenus des
  pastilles de résultat. Perdu : les pistes °C et % graduées sous chaque levure au repos (s6a cadre 1) ; s7a et s7b n'ont plus que des pastilles.
- **Comptes honnêtes ?** Relus contre `comptes-p4.txt` : 120 = 0 · 1 · 119 ✓ ; 143 non documentées dont 5 vendues ici ✓ ; tolérance 4 · 57 · 263 ·
  346 + 669 = 1 339 ✓ ; familles Σ = 1 339 ✓ ; atténuation − 500 · + 124 (1084 − 7, 1007 − 5, Windsor − 11, S-33 − 10, T-58 − 5 : écarts justes
  sur 80 %) ✓ ; tolérances des vendues ici (US-05 9–11, Pomona 10, Verdant 12, 1084 12, NovaLager 13) ✓. **Faux** : Style « ⌕ 1 412 » dans
  une liste de 1 339 fiches bière (compte du catalogue entier). **Trompeur** : Esters « + 14 » (voir s7a, 1).

## Sens métier d'abord (étape 0)
Aucune combinaison impossible : une ale à 18–20 °C sans STA1 → BRY-97 et WLP001 ; moins d'atténuation depuis US-05 → 1084, 1007, Windsor,
S-33, T-58 (vrai : plus de corps) ; plus de thiols + plus clair → Verdant, Pomona, Nottingham, Diamond dit « 10–15 °C · 19 hors plage ».
Deux points qu'un brasseur relève en deux secondes : (a) « Esters + 14 » sur 1 339 levures de bière : il connaît trente levures fruitées de
tête ; le compte ne lit que les 21 fiches Fermentis qui portent un niveau d'esters, 3068, WLP300, M20 et W-68 (la liste « Plus de banane »
de s6a) en sont dehors ; (b) la famille « ale 403 » à côté de « anglaise », « belge », « saison », « blé » : pour lui tout cela est de l'ale,
et `comptes-p4.txt` range W-68, Abbaye, Wit et Nottingham dans « ale ». Ni l'un ni l'autre n'est une absurdité de brassage ; ce sont des
comptes à corriger avant qu'il les voie.

---

## Vue Chercher (c6a, c6b)

**Classement** : c6b › c6a (serré : même carte, même liste, même données ; seul le tenue des 18 filtres diffère).

| Rang | id | Ce qui tient | Ce qui casse |
|---|---|---|---|
| 1 | **c6b** résumé d'une ligne · puces · feuille à index | Cadre 1 : « bière · repères 19 °C · 7 % · proche de 1056 · 1 339 » dit en trois secondes ce qui joue, sans toucher ; cadre 2 : index des 18 à gauche (point = posé, rond rouge = repère), le filtre touché à droite avec de la place : histogramme 4 · 57 · 263 · 346, « ≈ 7 % · ta bière », « non documentée 669 · chercher », la bascule « ne garder que ≥ 7 % » éteinte (le repère reste un repère, dit en clair), **les 5 vendues ici sur la même échelle** ; cadre 3 : les filtres posés deviennent une phrase noire « 120 · ale × · 18–20 °C × · sans STA1 × », chaque mot retirable ; « bière · aucun autre filtre » au pied. | Index : deux glyphes de 7 px sans légende à l'écran (la légende n'est que dans le titre de la capture) ; lignes de 26 px ; aucun compte de « non documentées » visible avant d'ouvrir un filtre ; cadre 3 : « Pomona · Wyeast 1084 · 1007 · STA1 ? » repliés en une ligne alors que US-05 et Verdant ont leur rangée. |
| 2 | **c6a** tiroir à sections repliables | Le tiroir de c5a (sa base) gardé et allongé : une ligne par filtre, valeur ou repère au milieu, « ⌕ n » non documentées à droite : tout l'état se lit d'un coup ; Famille et Tolérance ouvertes sur place ; « Plus de filtres » en 7 puces comptées (Sans STA1 437 … Soufre 2) ; Trier en segments ; cadre 3 : bande ambre « STA1 non documentée 143 · dont 5 vendues ici · chercher », les 5 en pâle avec « ⌕ STA1 ? », BRY-97 « STA1 − · fiche ». | « Filtres 18 » au repos (disponibles) et « Filtres 3 » au cadre 3 (posés) : le même mot pour deux nombres ; « ⌕ 1 412 » pour Style dans 1 339 fiches ; lignes de 27 px avec un chevron de 14 px ; avec trois sections ouvertes le tiroir dépasse l'écran et la liste s'éloigne. |

**Combien et quels problèmes ?**
- c6a (3 cadres) : 1. « Filtres 18 » (cadre 1) contre « Filtres 3 » (cadre 3) : deux sens. 2. Style « ⌕ 1 412 » > 1 339 : compte du catalogue
  entier dans une liste bière. 3. Famille « ale » à côté d'« anglaise · belge · saison · blé » ; les comptes rangent W-68, Abbaye et Nottingham
  dans « ale ». 4. Lignes de tiroir 27 px (DESIGN 28–32). Doutes : WLP001 (White Labs 20–23 °C) « couvre 18–20 » ? ; Soufre 2 · Nutriments 2 ·
  Rondeur 4 : des filtres à deux fiches, honnêtes mais presque sans objet (à garder grisés dans Plus de filtres).
- c6b (3) : 1. Index : point noir et rond rouge sans légende à l'écran (icônes muettes, refus explicite du PORTRAIT § 4). 2. Lignes d'index
  26 px. 3. Même « ale » que c6a (cadre 3). 4. Cadre 3 : trois vendues ici repliées en une ligne, deux déroulées. Doute : la feuille cache la
  liste, « Voir 1 339 » est le seul retour pendant le réglage (c6a pareil).

**Verdicts**
- **c6b** (résumé · puces · feuille à index) — **ACCEPTÉE. Candidate Chercher.** Trois retouches : (1) légende en mots dans l'en-tête de la
  feuille, « ● posé · ○ repère », ou le mot « posé » / « repère » en 11 px au bout de la ligne ; (2) index à 30 px par ligne (18 × 30 = 540 px,
  tient dans la feuille) et, greffe de c6a, « ⌕ n » en gris au bout de chaque ligne de l'index pour voir d'un coup ce qui manque ; (3) cadre 3 :
  Pomona, 1084, 1007 chacune sa rangée pâle « ⌕ STA1 ? » comme US-05 et Verdant, ou les cinq repliées ensemble.
- **c6a** (tiroir à sections) — **ACCEPTÉE.** Correction attendue : (1) « Filtres » sans nombre au repos, ou « 0 posé » ; greffe de c6b : la
  ligne de résumé « bière · repères 19 °C · 7 % · proche de 1056 · 1 339 » à la place de la rangée de puces répétées ; (2) Style compté sur les
  fiches bière (≤ 1 339) ; (3) lignes à 30 px.
- **Les deux** : la famille « ale » s'écrit « ale US · neutre » (ou « américaine »), et le rangement par mots se corrige au port (W-68 → blé,
  Abbaye → belge, Nottingham → anglaise) ; « estimé » reste écrit tant que le champ n'est pas normalisé.

**Sa phrase, prédite** : « c6b la ligne qui dit ce qui est posé et la feuille avec l'index c'est propre, et mes levures sur l'échelle de la
tolérance c'est top. c6a le tiroir avec tous les comptes c'est bien aussi mais Filtres 18 ??? j'ai rien posé. Et ale, anglaise, belge… c'est
tout des ales. »

---

## Vue Suggérer (s7a, s7b)

**Classement** : s7a › s7b.

| Rang | id | Ce qui tient | Ce qui casse |
|---|---|---|---|
| 1 | **s7a** cartes − / + groupées Arômes · Corps · Conduite | La forme s6a (cartes q2b, « Je veux… », liste vendues ici · Europe · rares, levier conduite, ⊕) ; plus un seul but nommé : 12 axes, chaque carte dit la valeur de ta levure (« 78–82 % », « 11 g/L », « ? chercher ») et deux moitiés « − n » et « + n » ; les groupes suivent sa façon de parler (« plus ronde et moins épicé », « biotransfo ») ; cadre 2 : le groupe touché reste ouvert, les deux autres repliés en « Arômes 4 ˅ · Conduite 4 ˅ · + un 2ᵉ axe », « levier conduite : aucun documenté pour cet axe », reclassement par l'écart sur une piste 60–90 % avec ta levure en pointillé ; cadre 3 : deux axes combinés, levier °C sourcé (Samia 2026), jauges des deux axes par ligne, US-05 « ⌕ thiols ? ⌕ floculation ? », Diamond « 19 hors plage ». | « Esters + 14 » et les arômes comptés sur le seul niveau de fiche ; les pistes °C et % de s6a disparues au repos ; Nutriments « − 0 · + 0 » : une carte qui ne fait rien ; 12 cartes = 300 px avant la liste (s6a : 170 px). |
| 2 | **s7b** un curseur − / + par axe, rangés par documentation | Le geste le plus direct : tirer depuis ta levure ; « fiches qui documentent ↓ » dit pourquoi les cartes du bas pâlissent ; cadre 2 : la carte tirée s'ouvre en grand avec son levier dans l'en-tête (« levier °C : non documenté »), bonne idée ; mêmes données que s7a. | L'ordre par documentation met Clarté et Atténuation en tête, Thiols 7ᵉ, Esters 8ᵉ : l'inverse de sa pensée (arômes d'abord, L04) ; après un choix, 11 mini-curseurs 44 × 8 px à bouton 10 px en trois colonnes : pas au pouce ; un curseur promet un continu, il n'a que trois positions ; les comptes disparaissent des mini-cartes. |

**Combien et quels problèmes ?**
- s7a (3 cadres) : 1. « Esters + 14 » : l'axe ne compte que les fiches à niveau d'esters (21, toutes Fermentis) ; 3068, WLP300, M20, W-68,
  Abbaye — « banane » écrit dans leur fiche — sont hors du compte et du résultat : son exemple « plus de banane » ne passerait plus par l'axe
  générique (L14 : confronter aux levures qu'il connaît). Même lecture pour Phénols (POF seul) et Thiols (biotransformation seule). 2. Au repos,
  les pistes °C et % graduées de s6a sous chaque levure ont disparu : pastilles seules (écart à sa base, PORTRAIT § 3.6). 3. Nutriments « − 0 ·
  + 0 », Terpènes « − 0 », Soufre « + 0 » : moitiés grises inertes ; une carte entière à 0 est une commande sans effet. 4. Cadre 2 : « levier
  conduite : aucun documenté » pour l'atténuation : vrai, mais le levier d'un brasseur est l'empâtage ; dire « levier : empâtage → Malts/sucres ».
  Doutes : US-05 « ? chercher » sur Phénols et Clarté alors qu'il la connaît POF − et floculation moyenne (fiche Fermentis muette, déjà accepté
  en p2 avec « à confirmer ») ; 12 cartes avant la liste, 300 px (s6a : 170).
- s7b (3) : 1. Ordre par documentation, arômes en bas. 2. Mini-curseurs 44 × 8 px, bouton 10 px (cadres 2 et 3). 3. Trois positions dessinées
  comme un continu. 4. Les mêmes 1 et 2 que s7a (comptes, pistes). 5. Mini-cartes sans leurs comptes après un choix. Doute : au repos les deux
  colonnes de curseurs à 100 px de piste restent lisibles, le bouton à 14 px passe.

**Verdicts**
- **s7a** (cartes − / + groupées) — **ACCEPTÉE. Candidate Suggérer.** Trois retouches avant le panel : (1) les axes Arômes comptent une fiche
  si elle porte un niveau **ou** un descripteur de l'axe (esters : banane, isoamyle, fruité, esters élevés ; phénols : girofle, POF, épicé ;
  thiols : biotransformation, β-lyase), écrit « estimé » comme Famille ; recalculer « − n / + n » et vérifier que 3068, WLP300, M20, W-68 sortent
  en « + esters » ; (2) remettre au repos les deux pistes °C et % graduées de s6a sous chaque levure (à un axe choisi, la piste de l'axe
  remplace, comme au cadre 2) ; (3) une carte dont les deux côtés sont à 0 se replie en une ligne « Nutriments · sans donnée · ⌕ chercher » à
  la fin de son groupe ; un seul côté à 0 reste grisé. Greffe de s7b : la carte de l'axe choisi s'ouvre en grand avec son levier dans l'en-tête.
- **s7b** (curseurs) — **ACCEPTÉE**, non candidate. Correction attendue : ordre Arômes · Corps · Conduite (le pâlissement par documentation
  garde son rôle à l'intérieur de chaque groupe) ; après un choix, les autres axes en lignes « − n · + n » touchables (s7a), pas en
  mini-curseurs ; trois crans dessinés sur la piste. Mêmes corrections de comptes et de pistes que s7a.

**Sa phrase, prédite** : « s7a oui c'est ça générique, chaque truc en plus ou en moins depuis ma levure, et les groupes arômes corps conduite
c'est comme je pense. Mais esters + 14 ??? il y a bien plus de 14 levures fruitées. Et les barres °C et % sous les levures elles sont où ?
s7b les curseurs c'est joli mais la clarté en premier et les esters en huitième non, et les petits curseurs après tu les attrapes pas. »

---

## Candidates (une par vue)
- **Chercher : c6b** — retouches (1) légende des glyphes, (2) index 30 px + « ⌕ n » par ligne (greffe c6a), (3) trois vendues ici déroulées au
  cadre 3 ; famille « ale US · neutre ».
- **Suggérer : s7a** — retouches (1) axes Arômes nourris aussi par les descripteurs (« estimé »), (2) pistes °C et % au repos (s6a), (3) cartes
  à 0 repliées en ligne « sans donnée · chercher ».

## Greffes
| Idée | Origine | Reçoit |
|---|---|---|
| Ligne de résumé « bière · repères 19 °C · 7 % · proche de 1056 · 1 339 » au repos, puis phrase noire des filtres posés | c6b cadres 1 et 3 | c6a (à la place de « Filtres 18 ») |
| Les 5 vendues ici posées sur l'échelle du filtre ouvert (tolérance : US-05 9–11 … NovaLager 13) | c6b cadre 2 | c6a, section ouverte |
| « ⌕ n » non documentées au bout de chaque ligne de filtre | c6a cadre 2 | index de c6b |
| « Plus de filtres » en puces comptées (Sans STA1 437 … Soufre 2) | c6a cadre 2 | c6b, bas de l'index |
| Carte de l'axe choisi ouverte en grand, levier dans l'en-tête | s7b cadre 2 | s7a cadre 2 |
| « fiches qui documentent » : pâlir les axes peu documentés à l'intérieur de chaque groupe | s7b cadre 1 | s7a |
| Frise J0–J12 « houblon · fermentation active J1–J4 » quand Thiols + est choisi (déjà notée en p3) | s6b cadre 3 | s7a cadre 3 |
| « levier : empâtage → Malts/sucres » quand l'axe est l'atténuation ou la rondeur | s6b (« empâtage · non chiffré ») | s7a et s7b cadre 2 |
| Bascule « ne garder que ≥ 7 % » éteinte sous le repère (repère ≠ filtre, dit en clair) | c6b cadre 2 | c6a, sections °C et Tolérance |

## Pour le pilote
- Aucun REJET : les quatre répondent à ses mots (« pas assez de filtre » ; « pas assez générique DU TOUT ») et gardent ses bases (c5a : carte,
  pont, ordre c4 ; s6a : cartes, liste, levier). La passe a progressé : LV-1 est levé (contrôle rouge sur s6a, vert sur s7a et s7b).
- Deux retouches de **données** à faire avant qu'il voie le panel, parce qu'il les lira en deux secondes : Style « 1 412 » dans 1 339 (c6a) et
  « Esters + 14 » (s7a, s7b). Le script `comptes-p4.mjs` les produit : ajouter la lecture des descripteurs pour les axes Arômes et compter le
  style sur les fiches bière.
- La famille « ale » : nom à changer dans les deux Chercher ; le rangement par mots se corrige au port (champ normalisé).

LEÇON PROPOSÉE : aucune (L14 couvre déjà « confronter le compte aux levures qu'il connaît » ; la retouche Esters en est l'application).
