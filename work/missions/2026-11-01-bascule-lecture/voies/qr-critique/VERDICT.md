# Verdict — le sceau QR z2 porté dans l'app (D246, D252)

Critique Fable, 01.11. Jugé contre « Le sceau QR z2 parfait comme telle » (D246) : règle n° 1, la maquette choisie reprise telle quelle.
Comparé : `qr/v1/z2/z2-*.png` (14 captures) et `voies/qr-app/captures/z2-*.png` (20, régénérées par le rejeu), plus
`qr-rejeu/captures-csp/csp-b-qr-confirme-390.png`. Toutes ouvertes en image. Mesures : z2 dans Chrome (DOM de `etat.html`, 390) ;
app dans `captures/parcours.json`. La base de l'écran (r2b, p3c-3, tuile TVA, hauteur de la feuille) n'est pas jugée ici.

## 1. Mesures (ce qui se mesure, pas ce qui s'estime)

| | z2 (DOM, 390) | app (parcours, 390) | écart |
|---|---|---|---|
| sceau (bouton) | 64 × 72, x = 305 | 64 × 72, x = 302 | **aucun** : la NOTE de z2 disait 64 × 62, la maquette réelle fait 72 ; l'écart déclaré n° 3 n'existe pas |
| bandeau confirme | 370 × 111 | 364 × 114 | + 3 px (bordure de la feuille) |
| bandeau contredit | 370 × 155 | 364 × 175 | + 20 px : tuiles 47 au lieu de 42, interlignes de la base |
| duel (deux tuiles) | 274 × 42 | 268 × 47 | ≈ même largeur, 5 px plus haut |
| total | 28 px mono | 28 px mono | aucun |
| barre du sceau | 12 px | 12 px (verdicts lus) | aucun |
| contrastes (blanc sur barre) | B7 : pire 5,27 | QR ✓ 4,65 · « 110,40 » 5,67 (pixel, pilote) · partiel 12,6 · illisible 13,9 · lecture… 5,74 | tous ≥ 4,5 ; « lu gardé » non mesuré (gris foncé, visiblement > 7) |
| délai jusqu'au sceau | — | 91 ms (png), 228 (contredit), 844 (illisible), 1 062 (pdf) | le QR répond avant Gemini, comme z2 le promet |

## 2. État par état

### confirme (390) — RETENU
Même place, même sceau, même « QR ✓ » vert à barre blanche, « 7 lignes » coché, barre des liens qui s'arrête avant le sceau. Il
reconnaît sa maquette en une seconde. Le vert de la barre est celui de z2 (l'écart déclaré n° 4 « barres blanches » ne se voit pas :
texte blanc sur vert foncé des deux côtés).
Sa phrase : « Le sceau c'est bien, comme la maquette. »

### contredit (390) — À CORRIGER (léger)
Reconnu : total « 110,04 » ambre souligné en pointillé, deux tuiles « lu sur la page 110,04 / QR-facture 110,40 » avec la colonne
fautive « 04 / 40 » en pointillé, « ✓ Somme des lignes 110,40 · deux contre un », sceau à barre ambre « 110,40 » (5,67), chip
« 7 lignes » passée en ⓘ. Le champ reste 110,04 sans geste (honnête, comme z2).
Défaut : z2 met **« ① Total » devant**, en tuile, avant « ② Règlement » (NOTE z2 : « chip ① Total devant, renumérotation »). Dans l'app,
① Total est une chip posée **sous** la rangée « TVA · ② Règlement » : on lit ② avant ①. Capture `z2-contredit-390.png` (app), y ≈ 415.
Règle : D105 / D246 (sa maquette telle quelle) ; et son réflexe « On a un 10' qui sort de null part » pour un ordre qui ne se suit pas.
Correction : poser ① Total dans la rangée des tuiles, devant Règlement (comme z2), ou, si la rangée TVA · Règlement est imposée par la
base, mettre les chips numérotées dans l'ordre de lecture (① d'abord).
Sa phrase : « Le duel c'est bien. Mais le ① est après le ② ??? »

### contredit, après le geste « prendre le QR » (390) — RETENU
Champ 110,40, tuile QR-facture noire à chiffres blancs (le noir sur noir de la première passe est corrigé), sceau « QR ✓ », chip
« ① Total » verte et barrée, « deux contre un » toujours dit. Mesuré 110,04 → 110,40 → 110,04 (« lu gardé », barre gris foncé) : les deux
sens du geste tiennent. Même état que z2.

### partiel (390) — RETENU
Barre gris foncé « partiel » (12,6), même place ; feuille : Montant, Facture, Date « pas dans le QR » soulignés en pointillé avec « lu … » à
droite, Devise et Créancier cochés. L'app écrit « lu 12.10.2026 » où z2 tronquait « lu 12.10 » : mieux.

### illisible (390) — RETENU
QR grisé barré d'une croix rouge, barre « illisible » (13,9), chip « Photographier le QR » sous le total, et la même action en bas de la
feuille. Feuille : « vu, rien décodé » au lieu de « vu, barré par un tampon : rien décodé » : l'app ne peut pas savoir pourquoi ; c'est
honnête, pas un écart. Le vrai décodeur l'a bien classé « vu, pas décodé ».

### sans (390) — RETENU
Cercle vide en pointillé « sans QR », distinct du sceau, comme z2. « non vérifié » (hors ligne, erreur, type inconnu) = aucun sceau,
bandeau de la base inchangé (`z2-non-verifie-390.png`) : rien d'affirmé, rien de faux. À garder.

### lecture (390) — À CORRIGER
z2 : pendant que Gemini travaille, le bandeau est **déjà rempli par le QR** (Malterie Fictive SA, 110,40 CHF, 12.10.2026, « … lignes »,
sceau « lecture… »), les lignes en squelette. C'est le cœur de ce qu'il a choisi (B11 de z2 : « 110,40 CHF le 12.10, et le QR de la
facture dit oui ») et sa demande sur la dépense : « Surtout montrer les points où l'ia n'es pas sûr », « là c'était trop long ».
App : bloc « Lecture et vérification… · facture-qr.png · 0,1 Mo » avec le sceau « lecture… » à droite ; le montant, la date et le
créancier lus en 0,1 s ne se voient qu'en touchant le sceau (`z2-lecture-ouvert-390.png` : « Montant 110,40 CHF · lu en 0,1 s »).
L'auteur dit l'écart imposé par la base (pas de bandeau pendant la lecture). La base n'interdit pas d'y écrire ce que le QR sait déjà :
les trois valeurs sont là. Règle : D105 / D246 ; et son critère 1 (« Un écran qui demande un toucher pour voir l'essentiel perd »).
Correction attendue : pendant la lecture, dès que le QR est lu, afficher le bandeau de z2 (créancier, total 28 px, date, « … lignes »,
sceau) et les lignes en squelette. Compromis acceptable si le bandeau bloque sur la fluidité : sous « Lecture et vérification… », une
ligne « QR : 110,40 CHF · 12.10.2026 · Malterie Fictive SA », sans toucher. Capture à refaire : `z2-lecture-390.png`.
Sa phrase : « Pendant la lecture je vois pas ce que le QR a déjà lu ??? Il met 0,1 s. »
Le sceau dans le bloc de lecture (et non à côté d'un total absent) : à garder, c'est la base ; seule la donnée manque.

### feuille « Ce que dit le QR » (confirme-ouvert, partiel-ouvert, illisible-ouvert, contredit-ouvert, copie) — RETENU
Bas d'écran avec voile à 390, mêmes rangées, mêmes coches, « = lu » à droite, IBAN et référence sur deux lignes en mono, rien de rogné,
« Copier » ≈ 26 px, « ✓ copié » vert après le geste ; copie vérifiée dans Chrome (`CH4431999123000889012`). En contredit, « ≠ Montant
110,40 CHF · lu 110,04 gardé » en ambre. IBAN différent de z2 (CH44… au lieu de CH93…) : fixture, le CH93 d'exemple est invalide avec une
référence QRR ; pas un défaut du port. Le × de fermeture est plus petit et plus pâle que celui de z2 : détail, pas un refus.

### confirme-tuile, confirme-preuve (390) — RETENU
La tuile Règlement ouvre la même carte (payé le · supposée 12.10 | facture 12.10, Déjà payé / À payer, C'est la date / Autre date).
La preuve « Lecture vérifiée » dit les mêmes trois lignes et les comptes de liens ; en contredit « 110,40 ≠ 110,04 » comme z2.

### 1280 (confirme, contredit) — À CORRIGER (léger)
Sceau 64 × 72 à sa place, feuille « Ce que dit le QR » ouverte d'office à ≥ 1 024 comme z2, duel et « ≠ » présents, pied visible.
Défaut : z2 garde les points à revoir (« ① Total · ② Règlement · ③ mouture ») **sous le bandeau**, visibles ; dans l'app ils sont
repoussés sous le pli par la preuve puis la feuille (confirme : la rangée TVA · ① Règlement est coupée à y ≈ 690 ; contredit : ① Total
n'est pas à l'écran). L'ordre preuve → tuiles est celui de la base (e-port 1280 l'a) ; c'est la **feuille ouverte d'office**, ajout de z2,
qui fait tomber les points hors du premier écran. Règle : D235 (« un récap en haut comme sur le screen est top, avec la possibilité de
clicker et avoir des renvois ») et D105.
Correction : à ≥ 1 024, poser la feuille après les tuiles et les chips (ordre bandeau → points → preuve → feuille, comme z2), ou ne pas
l'ouvrir d'office si elle chasse les points. Captures à refaire : `z2-confirme-1280.png`, `z2-contredit-1280.png`.
Sa phrase : « Sur PC les points à revoir sont passés où ? »

### pdf (390) — RETENU
Même écran que confirme, sceau « QR ✓ » : le PDF de deux pages est lu dans le téléphone en ≈ 1 s.

### CSP (csp-b-qr-confirme-390) — RETENU
Avec `'wasm-unsafe-eval'` : « QR ✓ » ; sans : aucun sceau et la dépense marche quand même. Le mot est ajouté (D253, « Oui »).

## 3. Les écarts déclarés : garder ou corriger

| écart déclaré | verdict | pourquoi |
|---|---|---|
| 1. sceau « lecture… » dans le bloc de lecture, pas à côté du total | **à corriger en partie** | la place du sceau est imposée par la base (pas de bandeau avant Gemini) : à garder ; mais les valeurs du QR (montant, date, créancier) manquent au repos, et c'est ce que z2 montre : voir « lecture » |
| 2. IBAN d'exemple CH44… au lieu de CH93… | à garder | fixture ; CH93 est invalide avec une référence QRR |
| 3. sceau 64 × 72 contre 64 × 62 | **sans objet** | la maquette z2 mesure elle-même 64 × 72 dans Chrome ; la NOTE était fausse |
| 4. barres de verdict blanches sur fonds de l'app | à garder | sur les captures, vert et ambre foncés à texte blanc des deux côtés ; contrastes 4,65 à 13,9, « 110,40 » 5,67 |
| 5. états ajoutés « invalide », « écart » / « devise » | à garder, **à montrer** | la donnée les impose (un QR lu mais non conforme n'est ni ✓ ni « sans ») ; aucune capture : il ne les a jamais vus. Les capturer (banc `?dev-local&depense=qr-…`) et les mettre dans le prochain artefact qu'il verra, sans attendre son choix (L24) |
| 6. la règle de la base bloque Confirmer tant que 110,04 ≠ somme des lignes | à garder | c'est la base ; le QR ne bloque rien et « lu gardé » dit ce qui est gardé |
| 7. 1280 non comparé | fait ici | voir « 1280 » |
| (non déclaré) ① Total après ② Règlement en contredit | **à corriger** | voir « contredit » |
| (non déclaré) points à revoir sous le pli à 1280 | **à corriger** | voir « 1280 » |

## 4. Ce qu'il refuserait (DEFAUTS-RECURRENTS) et la lisibilité au téléphone

- Aucun refus explicite rejoué : pas de texte au premier plan en plus de z2 (28 mots du bandeau), pas d'icône muette (le sceau est le QR
  lui-même, une croix suisse qu'il connaît), pas de « sort de nulle part » (le duel nomme ses deux sources), l'inconnu jamais à zéro
  (partiel : « pas dans le QR » ; illisible : « rien décodé » ; non vérifié : rien d'affirmé).
- 390 tactile : sceau 64 × 72, tuiles du duel 47 px, chip ① 28 px, Copier ≈ 26 px, Photographier 30 px : rien sous 24 px. Aucun débord
  horizontal (`debordH: false` sur tous les états). Contrastes rapportés tous ≥ 4,5. IBAN copiable, « ✓ copié » visible.
- Hors ligne : le QR est lu dans le téléphone (aucun hôte externe demandé hors polices) ; il ne dépend pas de Gemini ni du réseau.
- Hors périmètre, à signaler au pilote : à 390 la feuille laisse ≈ 50 px d'app floutée au-dessus (D235 : « prenne vraiment toute la
  place de l'app »), et la tuile « TVA — » vide prend une demi-rangée (D250 : il n'est pas assujetti ; « Ça c'est inutile » possible).
  Ce sont la base r2b et la rangée des tuiles, pas z2.

## 5. Verdict

Six états reconnus tels quels (confirme, contredit-après, partiel, illisible, sans, feuille, tuile, preuve, pdf, CSP) ; trois retouches
précises, toutes petites et vérifiables par une capture refaite : la lecture sans les valeurs du QR, ① Total après ②, les points à
revoir sous le pli à 1280. Rien à redessiner.

QR-CRITIQUE A CORRIGER — lecture : montant, date et créancier du QR invisibles sans toucher (z2 les montre dans le bandeau) ; contredit : « ① Total » posé après « ② Règlement » (z2 le met devant) ; 1280 : la feuille ouverte d'office chasse les points à revoir sous le pli. Le reste est z2 tel quel ; l'écart 64 × 62 n'existe pas (z2 fait 64 × 72).

## Rejugement (suite 2 de qr-app, captures de 14 h 22, `parcours.json` rejoué : 0 erreur, aucun débord, aucun hôte externe)

Seuls les quatre écrans changés et les deux états ajoutés sont rejugés ; le reste reste retenu.

### lecture (390) — RETENU (compromis accepté)
Sous « Lecture et vérification… », la ligne « QR : 110,40 CHF · 12.10.2026 · Malterie Fictive SA » est là sans toucher, à côté du sceau
« lecture… » (5,74). Elle passe sur deux lignes à 390, en mono 12 px gris (même encre que « facture-qr.png · 0,1 Mo », ≈ 5,7 sur blanc).
C'est le compromis que j'avais écrit comme acceptable : l'essentiel du QR se lit en trois secondes pendant les 10 à 20 s de Gemini. Le
bandeau de z2 (total 28 px, barre) n'existe toujours pas pendant la lecture : c'est la base, et la donnée n'y manque plus.
Sa phrase : « Ok, on voit que le QR a déjà lu. C'est petit, mais c'est là. »

### contredit (390) — RETENU
« ① Total » est maintenant seul sur une rangée, au-dessus de « TVA · ② Règlement », puis « ③ mouture » : 1, 2, 3 dans l'ordre de lecture.
Le duel, le témoin « deux contre un », le total ambre et le sceau « 110,40 » sont inchangés. Le bandeau gagne ≈ 35 px (la chip seule sur
sa rangée) ; z2 la mettait dans la rangée des tuiles, mais la rangée TVA · Règlement est celle de la base : écart qu'il reconnaîtra.
Sa phrase : « Le ① est devant, bien. »

### 1280 (confirme, contredit) — RETENU
Ordre à gauche : bandeau → preuve → tuiles (TVA · ① Règlement) → chips → feuille « Ce que dit le QR ». En confirme, ① Règlement et
② mouture sont à l'écran ; en contredit, ① Total, ② Règlement, ③ mouture aussi. La feuille passe maintenant en partie sous le pli
(IBAN et référence coupés à y ≈ 730) : les points à revoir priment sur l'IBAN, qui reste un défilement plus bas ; z2 montrait tout parce
que sa preuve est plus courte. Rien à corriger.
Sa phrase : « Sur PC c'est bon, les points sont revenus. »

### « écart » (390, fermé et ouvert) — À CORRIGER (léger ; état jamais vu par lui)
Cas : la page lit 13.10.2026, le QR dit 12.10.2026 ; le total est d'accord. Fermé : sceau à barre ambre « écart » (même ambre que
« 110,40 », 5,67 au pixel), rien d'autre ne bouge : la date « 13.10.2026 » en haut à droite n'est ni soulignée ni ambre, la tuile
Règlement reprend « Payé le 13.10.2026 », et aucun point numéroté ne pointe la date. Ouvert : « ≠ Date 12.10.2026 · lu 13.10.2026 » en
ambre, honnête et clair.
Défaut vérifiable : en trois secondes on lit « écart » sans savoir de quoi ; il faut toucher le sceau. En contredit, le même port dit
l'écart deux fois (sceau + total ambre pointillé + chip « ① Total » qui saute au duel) ; en « écart », une seule fois. Ses mots :
« Surtout montrer les points où l'ia n'es pas sûr » (SPEC, 31.10) ; D235 : les points avec renvois ; et la base numérote déjà la date
comme point (« ① Date », D233). Correction attendue : en « écart », marquer le champ contesté dans le bandeau (date en ambre, soulignée
en pointillé, comme le total en contredit) et le numéroter en chip « ① Date » (ou « ① Devise ») qui ouvre la feuille et surligne sa
rangée ; même mécanique que « ① Total ». Captures à refaire : `z2-ecart-390.png`, `z2-ecart-ouvert-390.png`.
Sa phrase : « Écart de quoi ??? Il faudrait un point comme pour le total. »

### « invalide » (390, fermé et ouvert) — RETENU (à lui montrer, résultat simulé)
Fermé : QR grisé barré d'une croix, barre gris foncé « invalide » (13,9), chip « Photographier le QR » : on comprend que le QR ne
sert pas, et le mot le distingue d'« illisible ». Ouvert : « lu, mais non conforme : il ne confirme rien », puis les deux raisons
(IBAN « CH00… » invalide, clé modulo 97 ; référence QRR sans QR-IBAN), aucun IBAN à copier, Photographier. Les raisons sont techniques,
mais au second plan et seulement dans un cas de faute : rien d'affirmé, rien à copier de faux. À garder. Il ne vient d'aucune pièce
réelle (`apercuDev.qrSimule`) : à lui montrer comme tel.
Sa phrase : « Ok, il dit qu'il confirme rien. »

### Ligne

QR-CRITIQUE A CORRIGER — les trois écarts de la première passe sont corrigés et retenus (lecture : ligne du QR sans toucher ; contredit : ① Total devant ; 1280 : points à revoir visibles) ; « invalide » retenu ; reste l'état ajouté « écart » : le champ contesté (la date) n'est ni marqué dans le bandeau ni numéroté en point, contrairement à « ① Total » en contredit ; une retouche, deux captures à refaire.

## écart, rejugé (suite 3 de qr-app ; `z2-ecart-390`, `z2-ecart-ouvert-390`, `z2-ecart-chip-390` ouvertes)

**Fermé** : la date « 13.10.2026 » du bandeau passe en ambre, soulignée en pointillé ; chip « ① Date » au-dessus de « TVA · ② Règlement »,
puis « ③ mouture » ; sceau « écart » ambre ; « 7 lignes » en ⓘ. En trois secondes : « écart, sur la date ». L'écart est dit trois fois,
comme en contredit. Sceau 64 × 72 à sa place, bandeau 116 px, aucun débord. **Ouvert par le sceau** : « ≠ Date 12.10.2026 · lu
13.10.2026 » en ambre, le reste coché. **Geste de la chip** : la feuille s'ouvre, la rangée Date est surlignée (contour ambre), la chip
passe verte et barrée. La mécanique de « ① Total » est reprise : c'est ce que je demandais.

Ce qui reste, vérifiable sur `z2-ecart-chip-390.png` : après le toucher de la chip, la marque ambre du bandeau s'efface et le point est
« réglé » alors que **rien n'a été choisi** : la date reste 13.10.2026 (la page) et la tuile Règlement garde « Payé le 13.10.2026 », sans
que la rangée Date offre de prendre le 12.10 du QR. En contredit, le port règle « ① Total » seulement quand il touche une tuile du duel
(« Le champ reste 110,04 tant qu'il n'a pas touché une tuile ») ; ici le doute disparaît sur un simple regard. Règles : z2, Honnêteté
(« la pastille de doute disparaît au choix ») ; critère 4 du portrait (une incertitude reste visible) ; ses mots « comme c'est de la
facturation, c'est super important, ça doit être très fiable ! » (SPEC, 31.10). Correction attendue, petite : dans la rangée Date de la
feuille, deux touches « 12.10.2026 · QR » / « 13.10.2026 · lu » (le duel, sans tuiles sous le total) ; la chip ne se règle et la marque ne
s'efface qu'à ce choix ; « prendre le QR » écrit 12.10 dans la date et dans Règlement, « garder » laisse 13.10 et le sceau dit
« lu gardé » comme en contredit. Même chose pour Créancier et Devise ; Facture (pas de champ au bandeau) peut se régler à l'ouverture.
Capture à refaire : `z2-ecart-chip-390.png` (attendu : la rangée Date avec ses deux touches, chip encore ouverte avant le choix).
Sa phrase : « Là c'est clair, écart sur la date. Mais je clique et c'est réglé alors que c'est toujours 13.10 ??? Je prends quoi ? »

Verdict de l'état : **À CORRIGER (léger)** — le marquage et la chip sont bons ; seul le réglage sans choix manque.

### Ligne finale (tout le port)

QR-CRITIQUE A CORRIGER — tout le sceau z2 est retenu (confirme, contredit et ses gestes, partiel, illisible, sans, non vérifié, lecture avec la ligne du QR, feuille, tuile, preuve, pdf, 1280, « invalide ») ; une seule retouche sur l'état ajouté « écart » : la chip « ① Date » se règle et la marque s'efface sur un simple regard, sans que le brasseur ait pris le 12.10 du QR ou gardé le 13.10 lu ; il faut le choix dans la rangée, comme le duel du total.

## écart, choix rejugé (voie qr-ecart ; `voies/qr-ecart/captures/`, cinq captures ouvertes, `parcours.json` : 0 erreur, aucun débord)

- **Fermé** (`z2-ecart-390`) : inchangé et bon : date « 13.10.2026 » en ambre pointillé, « ① Date » devant « ② Règlement », sceau « écart »
  (64 × 72, 5,67 au pixel pour cet ambre).
- **Chip touchée** (`z2-ecart-chip-390`) : la feuille s'ouvre, la rangée Date est cerclée d'ambre, note « écart », et porte deux touches
  « 12.10.2026 · QR » / « 13.10.2026 · lu », aucune pressée ; la chip ① reste ouverte, la date du bandeau reste marquée, le sceau dit
  encore « écart ». Le doute ne tombe plus sur un regard : c'est ce que je demandais. Par le sceau (`z2-ecart-ouvert-390`), même rangée,
  mêmes touches, rien de réglé.
- **Prendre le QR** (`z2-ecart-prendre-qr-390`) : touche QR noire, note « pris », coche verte sur Date ; dans l'écran, date « 12.10.2026 »
  sans marque, « ② Règlement · Payé le 12.10.2026 » suit, « ① Date » verte et barrée, sceau « QR ✓ ». Mesuré : 13.10 → 12.10.
- **Garder la page** (`z2-ecart-garder-390`) : touche « lu » noire, note « lu gardé », date « 13.10.2026 », Règlement au 13.10, chip
  réglée, sceau « lu gardé » sur fond ambre : on voit qu'il a choisi contre le QR, comme pour le total. Aller-retour mesuré
  (12.10 → 13.10). Rien ne bouge sans geste, « Confirmer » jamais bloqué, rien dans Firestore.
- Réserve, pas un refus : les deux touches font 28 px de haut, l'échelle des chips de la base qu'il a aimées (« J'aime beaucoup les
  pastilles ») ; le duel du total de z2 faisait 40 à 42 px. Au doigt, 28 px cerclés et espacés passent ; à surveiller sur son téléphone.
- Créancier et devise : même composant, joués en test seulement, pas en capture : pas jugés ici (une capture non vue ne compte pas).

Verdict de l'état : **RETENU**.
Sa phrase : « Là c'est clair : écart sur la date, je prends le QR ou je garde, et ça suit dans Règlement. Bien. »

### Ligne finale (tout le port)

QR-CRITIQUE RETENUE — le sceau z2 est reconnu tel quel dans chaque état (confirme, contredit et ses gestes avec « ① Total » devant, partiel, illisible, sans, non vérifié, lecture avec la ligne du QR sans toucher, feuille avec IBAN copiable, tuile, preuve, pdf, 1280 avec les points à revoir visibles) ; les deux états ajoutés, « invalide » et « écart », sont honnêtes et réglés sur un choix, à lui montrer comme ajouts ; réserve sans refus : touches du choix à 28 px ; hors périmètre : feuille non pleine hauteur à 390 (D235) et tuile « TVA — » vide (D250).
