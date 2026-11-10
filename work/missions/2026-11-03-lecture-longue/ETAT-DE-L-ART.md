# État de l'art : lire une longue pièce de façon fiable (L29, 08.11)

Demande du brasseur, 08.11 : « rend le truc fiable » ; « Ça doit être hyper robuste ». Constat : en ligne, le PDF B&R de 4 pages
(`doc8-facture-pdf-652093.pdf`) a été coupé en 14 morceaux, alors que le même PDF lu entier était juste au banc (C★v8).

## 1. Le problème d'école

Lire par un modèle de vision (OCR + extraction) un document plus long que ce qu'un appel peut voir net ou rendre en entier. Trois sous-problèmes connus :

1. **Plafond d'entrée** : un modèle de vision réduit chaque image à un budget fixe de jetons. Une photo de ticket haute et étroite, ou une page A4
   dense, est donc lue à basse résolution. La réponse d'école : découper en tuiles ou en bandes (fenêtre glissante) pour donner plus de jetons à
   chaque zone ; pour un PDF numérique, lui donner la couche de texte native plutôt qu'une image.
2. **Plafond de sortie** : une réponse JSON a un nombre maximal de jetons. Un document de plus de lignes que ce plafond est coupé (`finishReason`
   `MAX_TOKENS`). La réponse d'école : découper le document par unités naturelles (pages), puis, seulement si une unité est encore trop longue, la
   découper encore.
3. **Recollage** : découper crée des frontières. Deux méthodes standard :
   - **coupes bord à bord dans les blancs** : segmentation des lignes par profil de projection horizontal (Otsu ou Sauvola, puis vallées du profil),
     la méthode classique des moteurs OCR (Tesseract, OCRopus, Kraken) pour trouver les lignes. Aucun doublon possible, mais une coupe qui tombe sur
     une ligne pâle la tranche en silence ;
   - **fenêtres avec recouvrement, puis déduplication** (tuilage d'école, comme SAHI en détection ou le découpage des longs textes pour les LLM) : aucune
     ligne n'est tranchée sans être entière dans une fenêtre voisine. Le doublon du recouvrement se retire par alignement de séquences (plus longue
     suite commune entre la fin d'une fenêtre et le début de la suivante). Limite connue : deux lignes identiques voulues de suite (« BIERE BLONDE
     33CL 2.50 » six fois) rendent l'alignement ambigu ; seule une position (boîte englobante) les distingue.

## 2. Méthodes et bibliothèques examinées

| Outil | Licence | Poids | Vitesse | Verdict |
|---|---|---|---|---|
| pdf.js (`pdfjs-dist` 4.10.38, déjà dans l'app) | Apache-2.0 | déjà chargé à la demande | `getTextContent` par page : quelques ms | Garder : nombre de pages, rangées de texte par page, rendu d'une page |
| pdf-lib (extraire une page en PDF d'une page) | MIT | ≈ 0,5 Mo (estimé, non mesuré) | rapide | Non retenu ici : nouvelle dépendance ; une page rendue en image suffit tant que la page tient dans un appel (voir 4) |
| OpenCV.js 5.0.0 (contour, perspective, seuil adaptatif) | Apache-2.0 | 13,3 Mo | coins 33 à 48 ms, chargement ≈ 0,5 s | Écarté le 07.11 sur 200 pièces neuves : 143 lignes perdues (`opencv-essai/README.md`) |
| Tesseract.js (boîtes de lignes) | Apache-2.0 | ≈ 10 Mo avec les données | plusieurs secondes par ticket au téléphone | Écarté le 03.11 pour la découpe (lent) |
| Profil de projection (Otsu, contraste local) | code maison, méthode d'école | 0 | ≈ 1 s pour un ticket | En place (voie F) |
| Gemini `boundingBox` des lignes | — | 0 | un appel de plus | Écarté : positions approximatives, et un appel payant de plus par pièce |

## 3. Les limites réelles de Gemini (sources citées)

- Image : le budget de jetons est fixé par `media_resolution` : 280 (LOW), 560 (MEDIUM), 1 120 (HIGH, défaut des images), 2 240 (ULTRA_HIGH, seulement
  par partie). Une image vaut au plus 1 120 jetons en HIGH, quelle que soit sa taille ; le redimensionnement interne n'est pas documenté.
  Source : Google, *Media resolution*, https://ai.google.dev/gemini-api/docs/generate-content/media-resolution (mise à jour du 13.10.2026), relevé dans
  `work/missions/2026-11-01-banc-lecture/research_notes/Lecture de factures par vision/pretraitement_deterministe.md` et `harness_gemini.md`.
- PDF : 280 / 560 / 1 120 jetons par page (LOW / MEDIUM / HIGH) **« + Native Text »** : Gemini 3 reçoit la couche de texte du PDF en plus de l'image de la
  page. Google recommande MEDIUM pour les PDF (la qualité « sature »). Même source. Conséquence : un PDF numérique envoyé comme PDF est mieux lu que
  la même page rendue en JPEG, qui perd la couche de texte.
- `gemini-3.5-flash-lite` : 1 048 576 jetons d'entrée, **65 536 jetons de sortie**, jusqu'à 3 000 images par requête, 7 Mo en ligne.
  Source : https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash-lite (relevé dans `harness_gemini.md`).
- Le nombre maximal de pages d'un PDF accepté par l'API n'est pas dans nos notes datées : non vérifié ici (pas d'accès réseau dans cette voie).
- Limites de l'app, pas du modèle : 8 192 jetons de sortie par lecture (`LITE_SCAN_MAX_OUTPUT`, `SCAN_MAX_OUTPUT`, `functions/src/invoiceScanCore.ts`),
  4 pages par PDF et 4 Mo par fichier (`validateInvoiceFile`).
- Mesuré chez nous (`MESURE-BANDES.md`, 03.11) : Flash-Lite ≈ 195 jetons par ligne d'article ; 39 lignes = 93 % du plafond de 8 192 ; donc ≈ 41 lignes
  au plus par lecture.

## 4. Décision

1. **PDF : la page est l'unité, jamais la tranche d'image sans besoin.**
   - Un PDF de 1 à 4 pages se lit **entier, comme PDF** (couche de texte native) : plus aucun déclencheur « avant » par nombre de rangées. Le seuil de
     90 rangées n'était justifié par aucune mesure ; il additionnait les rangées des pages (en-têtes, adresses, bulletin compris), et il a coupé doc8 en
     14 morceaux alors que la lecture entière était juste.
   - Le déclencheur « après » reste, et il est exact : le serveur dit lui-même qu'une lecture a été coupée (`finishReason` ≠ `STOP` → point
     `lecture-coupee`), ou il manque plus de 2 lignes imprimées.
   - Plus de 4 pages, ou relecture après une lecture coupée : **une page = un morceau** (la page rendue en image). Seule une page de plus de
     `PAGE_RANGEES_MAX` = 35 rangées de texte (35 × 195 ≈ 6 800 jetons, 83 % du plafond au pire, mesure du 03.11) ou sans couche de texte (scan) est
     découpée en bandes à l'intérieur de la page.
2. **Photo : coupes bord à bord dans les blancs (voie F), mais aucune coupe incertaine n'est silencieuse.** Une coupe n'est « propre » que si le blanc
   est franc ; sinon elle est signalée (`coupeForcee`), et sa bande de contrôle la recoupe à la lecture. Le réglage se fait sur la graine 1, le
   jugement sur la graine 2 (L20). Détails et chiffres : section 5.
3. **Recouvrement + déduplication (piste b) : non retenu en production.** Mesuré le 03.11 en ligne (`invoiceMorceaux.ts`, `CONTEXT_LINES`) : avec des
   voisins visibles, l'IA a doublé 6 lignes ; et la déduplication par texte efface à tort des lignes identiques voulues (piège « suite identique »,
   70 % des pièces du banc). Le recouvrement reste là où il est sûr : la bande de contrôle, lue à part, qui ne change aucune ligne et ne fait que signaler.

## 5. Mesures (08.11, copie de banc privée, Chrome sans écran, CSP de production)

Le banc juge le plan de découpe d'une PHOTO (`planifierImage(photo, true)`) ; le changement PDF ne le touche pas (test Vitest `pdf-entier.test.ts`).

| Banc | Voie | Silencieuses | Signalées | Perdues | Rognées | Plan médian |
|---|---|---|---|---|---|---|
| graine 2 (juge) | F (HEAD = servi) | 24 | 1 | 0 | 0 | 1 753 ms (poste chargé) |
| graine 1 (réglage) | F | 43 | 8 | **82** (h0065, h0101) | 2 | 1 663 ms |
| graine 1 (réglage) | F + « coupe contre la ligne » | 41 | 8 | 82 | 2 | 1 676 ms |

Rejoués le 08.11, à la suite, sur le même poste :
- 11 fixes : voie actuelle 0 silencieuse, 0 signalée, 0 perdue, 0 rognée, médiane 1 247 ms (max 3 091) : DÉCOUPE OK. Base (202506bb) : 0, 1, 0,
  4 rognées, 1 224 ms : ÉCHEC.
- Graine 2, base (202506bb, avec SON harnais de `wt-base-d381`) : 3 silencieuses, 92 signalées, 0 perdue, médiane 918 ms (max 1 946). Ses
  « 1 157 rognées » viennent de l'ancienne mesure à l'encre de ce harnais (écartée le 07.11) : non comparables ; à la tranche, le pilote a mesuré 6.
- Graine 2, voie actuelle, rejouée juste après la base : en cours au moment du rendu (`P-g2.log` du scratchpad). Mesure de l'après-midi : 24, 1, 0, 0,
  1 753 ms. La voie F reste environ 1,5 à 1,9 fois plus lente que la base sur ce poste.

**Pourquoi des coupes « propres » tranchent une ligne** (graine 1, coupes regardées en image, `pieges/harnais.ts` : `__voirCoupe`, `__voirBrut`) :
1. **Angle faux** (h0135 : 9 coupes, h0016 : 8) : la photo est penchée de 1,2 à 1,75°, le plan trouve 0°. Sur un ticket dont le montant est sur la
   ligne SOUS la désignation (« 1 x 89.50   89.50 »), une pente d'un pas sur la largeur se confond avec la mise en page droite : le profil est presque
   le même. La coupe passe dans un blanc, mais sépare la désignation (à gauche) de son montant (à droite, monté d'une ligne).
2. **Ligne invisible pour la carte des coupes** (h0023, h0077, h0089… : ≈ 15 coupes) : une référence grisée floue, ou le haut d'une ligne sous l'ombre.
   Le blanc mesuré dure 1 à 2 pas ; `pickCut` coupe au MILIEU du plus long blanc, là même où la ligne cachée se trouve.

**Essai écarté** : placer la coupe contre la ligne visible quand le blanc dépasse 1,5 × le blanc ordinaire (`coupesContreLaLigne`). Il corrige la
cause 2 visée (≈ 14 coupes) mais déplace les coupes suivantes, qui tombent ailleurs sur d'autres lignes : 43 → 41 seulement sur la graine 1. C'est une
rustine de plus sur ce module (L29) : retirée, non jouée sur la graine 2. Copie : scratchpad de la voie (`decoupe.avec-ligne-cachee.ts`).

**Conclusion** : le profil de projection seul ne garantit pas « 0 silencieuse » sur des photos floues, penchées d'un pas ou à l'ombre ; aucun réglage
de seuil ne sépare les coupes fautives des justes (blanc/pas : médiane 0,47 pour les justes ; fautives de 0,05 à 2,2). Ce qui garantit, c'est la
bande de contrôle : chaque coupe intérieure, propre ou non, est relue à cheval et comparée (`jonctionConcorde`) ; une ligne perdue ou doublée sur la
coupe lève un point visible. Le critère du banc (plan seul) ne compte pas ce filet.

## 6. (c) Ne couper une photo que si c'est nécessaire (décision du pilote, 08.11)

**Règle** : sans `force`, une photo se coupe seulement si elle est haute (plus de 3 × plus haute que large, comme avant) ET si son plan compte plus de
`LIGNES_ENTIERES` = **35** lignes de texte (`decoupeAvant`, `src/services/decoupe.ts`). Sinon elle se lit entière, sans aucune coupe. Le déclencheur
« après » ne change pas : une lecture entière coupée, ou à plus de 2 lignes imprimées non rendues, est relue en morceaux.

**Pourquoi 35** (mesure de `MESURE-BANDES.md`, 03.11, Flash-Lite) : ≈ 195 jetons par ligne d'article, en-tête compris ; plafond 8 192 jetons
≈ 41 lignes ; 39 lignes ont pris 93 % du plafond. 35 lignes d'articles au pire = 35 × 195 ≈ 6 800 jetons = 83 % : la marge (17 %) couvre l'écart de
longueur des désignations entre deux pièces (la mesure vient de pièces fictives à désignations courtes). Le compte porte sur les lignes VISUELLES
(en-tête, totaux, lignes de référence et de quantité comprises) : une pièce réelle a moins d'articles que de lignes, donc la marge réelle est plus
grande. Se tromper vers le haut ne coûte que du temps : la lecture entière coupée est rattrapée par le déclencheur « après », qui est exact.

**Compte des lignes** (`lignesDeTexte`) : le plus grand de deux comptes sur le profil du plan : les séries encrées, et la hauteur du texte divisée
par le pas (une ligne pâle invisible y compte quand même). Limite vue : sur ses tickets Bauhaus (doc15, doc16), le profil final est encré d'un bout
à l'autre (texture du papier dans la largeur mesurée) et le compte vaut 1 ; HEAD ne les coupait pas non plus (un seul morceau). Le compte n'y est pas fiable ;
la lecture entière y est quand même le meilleur choix, et le déclencheur « après » reste le filet.

**Mesures de (c)** (compte des lignes v2 : plus petit pas connu, encre nette comprise) :
- Graine 2 (juge) : **174/200 pièces encore coupées** « avant » ; sur elles : 18 silencieuses, 1 signalée, 0 perdue, 0 rognée ; plan médian ≈ 1,45 s.
  Les 26 lues entières sont toutes des pièces non hautes (ratio ≤ 3), déjà lues entières par HEAD : aucune pièce haute du banc n'a 35 lignes ou
  moins (le générateur tire 40 à 300 articles). (c) ne change donc rien sur ce banc ; son effet porte sur les tickets hauts et courts.
  Les 18 silencieuses (contre 24 en mode forcé) : les 6 de différence sont sur des pièces non hautes, que l'app ne coupe qu'à la relecture forcée.
- v1 (compte sur la carte des coupes seule) lisait entières h0122 (162 lignes) et h0140 (269 lignes), comptées 18 et 14 : rangées grisées qui fondent
  plusieurs lignes en une série. Corrigé en v2 (test « zèbre »).
- Graine 1 (réglage) : 169/200 coupées ; sur elles : 43 silencieuses, 7 signalées, **45 perdues** (h0101 : les 45 lignes du haut, en-tête compris,
  perdues au recadrage), 1 rognée. h0065 (37 lignes du bas perdues en mode forcé) n'est pas haute : lue entière, la photo d'origine est envoyée, rien
  n'est recadré. Aucune pièce haute n'y est lue entière.
- 11 fixes : 11/11 coupées (hautes, 135 articles), 0 silencieuse, 0 signalée, 0 perdue, 0 rognée : DÉCOUPE OK.
- Ses vraies pièces (H13-reels, 21 images + 2 PDF) : seule **doc5** (facture de 3 pages en une image, 171 lignes comptées) est coupée, en 9 morceaux,
  comme sur HEAD. **doc15 et doc16 (tickets Bauhaus de 17 articles) : lus entiers**, comme sur HEAD (compte : 1, voir la limite plus haut). doc21
  (métal à reflets) : pas haute, lue entière. doc8 et doc9 (PDF ≤ 4 pages) : lus entiers (25072b2a). Les 4 montages Bauhaus du 03.11
  (`fixture-montage-0311-*`, ≈ 30 articles sur 2 lignes chacun) sont coupés en 4 ou 5 morceaux (71 à 106 lignes comptées), alors qu'en
  articles (≈ 30 × 195 ≈ 5 900 jetons) ils tiendraient entiers : le compte en lignes visuelles est prudent pour eux.

## 7. (a) La bande de contrôle comme garantie : mesure avant de s'y fier

Simulation sans IA (`pieges/harnais.ts`, bloc « bande ») : LECTEUR PARFAIT ; une ligne entière d'un côté de la coupe est lue de ce côté ; la bande lit
les lignes entières dans ses rangées ; un article = sa ligne qui porte le montant. Pour chaque ligne à montant tranchée, les deux pires lectures
(lue des deux côtés, lue d'aucun) passent dans `jonctionConcorde` ; pour chaque coupe juste, on regarde si la bande concorde.

| | Graine 2 | Graine 1 |
|---|---|---|
| Lignes à montant tranchées : doublée attrapée | 12/12 | 27/27 |
| Lignes à montant tranchées : perdue attrapée | 12/12 | 27/27 |
| Lignes tranchées SANS montant (désignation, référence) | 13 : invisibles pour la bande | 24 : invisibles |
| Coupes justes : fausses alertes | 553/1 855 (30 %) | 550/1 885 (29 %) |

- Graine 2, détail des fausses alertes : 31/264 (12 %) sur les tickets d'une ligne par article ; 522/1 591 (33 %) quand les articles tiennent sur 2 ou
  3 lignes : la bande de ± 2 lignes n'y voit souvent qu'un montant, d'un seul côté, et `jonctionConcorde` exige qu'elle voie les deux côtés.
- Les 82 lignes perdues de la graine 1 sont perdues au recadrage, à un bout de la pièce, jamais à une coupe : aucune bande ne les voit.
- Lecture : la bande attrape bien une ligne à MONTANT perdue ou doublée à la coupe (100 % sur 39). Elle ne voit pas une désignation séparée de son montant,
  et, telle qu'elle est, elle crie à tort sur ≈ 30 % des coupes justes (un point qui pèse, en ligne aujourd'hui). Limite de la simulation : un vrai lecteur
  transcrit aussi une ligne partiellement visible au bord de la bande, et un article sans montant ; le taux réel de fausses alertes n'est pas mesuré.

**Diff proposé** pour `functions/src/invoiceAssemblage.ts` (non appliqué : périmètre du pilote) : une coupe forcée dont la bande concorde n'ajoute plus
d'alerte qui pèse ; bande absente ou discordante : inchangé (le point « jonction » pèse déjà, et la coupe forcée garde le sien).

```diff
@@ assemblerMorceaux, boucle des coupes (l. 93 à 104 au 08.11)
     const bande = jonctions.get(k + 1);
+    // (a), 08.11 : recoupée = la bande de contrôle retrouve les mêmes montants de part et d'autre de la coupe.
+    let recoupee = false;
     if (!bande?.sautDePage) {
@@
       else if (!jonctionConcorde(bande.items, haut, bas))
         signales.push(pointAssemblage(`jonction-${k + 1}`, autour,
           `Jonction des parties ${k + 1} et ${k + 2} : la bande de contrôle ne retrouve pas les mêmes lignes de part et d'autre de la coupe${autour.length ? ` (lignes ${autour.join(' et ')})` : ''} : une ligne peut manquer ou être doublée, à vérifier sur le document.`));
+      else recoupee = true;
     }
-    if (parties[k].coupeForcee !== true) continue;
+    // Une coupe forcée recoupée par sa bande : la bande a vu les deux côtés, aucun montant perdu ni doublé (mesure du 08.11 : 39 sur 39 attrapés).
+    if (parties[k].coupeForcee !== true || recoupee) continue;
```
Test à ajouter côté serveur (`tests/unit/depense/d381/serveur.test.ts` ou `jonctions.test.ts`) : deux parties, `coupeForcee: true` sur la 1, bande
qui concorde → aucun point `coupe-1` ; bande discordante → points `jonction-1` et `coupe-1` ; bande absente → `jonction-1` et `coupe-1`.
