# Critères 9,5-10 : calendrier et carnet (panel 16.11)

Six regards (U = UX, W = workflow, B = brasseur, V = visualisation, K = critique K13-K22, D = designer audacieux), triés par le contradicteur (Opus).
Ses mots : « ça doit être 9/10 voir plus… hyper lisible… le moins d action possible » ; « Surtout Gestes directs sur la frise » ; « tout a un lien avec tout ».
Aucun critère n'ajoute de texte au repos. Règle n° 1 : sa maquette reste la base ; toucher ses pictos, teintes ou commandes se montre en variantes.

## Comprendre
1. Sa question : oui sur le papier (MANQUES impose L1-L7, K11, K12 = CARNET-LIS) ; non dans fb9/p1, où aucun n'est vérifié. K12 au repos 390 : ÉCHEC clair et cave (161 mots, 91 sous 14 px) ; L1, L2, L6, L7 absents.
2. L'œil ne sait pas où aller : « 173 » trois fois, 3 nombres par semaine, 94 nombres au premier écran, 7 tailles et 16 couleurs de texte ; la frise commence à 63 % de la hauteur.
3. Le sens est coupé (« Brewferm –… », « à rendre · 1 s… », « Embouteill… ») et les codes muets ont plusieurs sens (pointillés, cases tiretées, jauges à points, pastilles).
4. Le geste existe mais ne s'annonce pas et n'est pas prouvé sûr : défilement contre glisser, cibles de 30 à 36 px, fluidité jamais mesurée sur un téléphone moyen.
5. Chaque action finit par une confirmation (OK, Poser, Annuler) : c'est le toucher de trop.
6. Le zéro clavier dépend de propositions justes, que rien ne mesure.
7. « Tout est lié » ne va que dans un sens : la fiche ouverte fait perdre sa place, un genre change de signe d'un module à l'autre, la provenance (IA, dicté, veille) n'est pas marquée.
8. Palette : validate_palette ÉCHEC 4/5 (vente ↔ fête ΔE 3,2 clair et 1,4 cave en deutéranopie ; deux gris ; framboise ≈ rouge du retard).

## Critères
Par défaut : 390 tactile, 844 et 1280, deux thèmes, au repos et dans chaque état (`capt.mjs`, `gestes.mjs`). Format : titre · pour · source ; mesure ; seuil 10/10.
- **Q1 Zéro redite** · tous · K14 + U-N1 + B-N5
  - Mesure : chaque valeur porte `data-fait` (caisse-semaine, montant-chose, échéance-chose…) ; puppeteer compte les clés visibles deux fois ou plus dans la fenêtre ; rappel collé exclu si l'original est hors de vue (IntersectionObserver) ; étiquettes d'axe exclues.
  - Seuil : 0 doublon dans tous les états. Témoin : p1 repos 390 échoue (173 ×3, « à te permettre » ×2, S47-S52 ×2).
- **Q2 Un nombre par semaine, le reste dessiné** · calendrier · V2
  - Mesure : script compte les nombres visibles au premier écran à 390 au repos (94 aujourd'hui) et par colonne de l'en-tête collé (3) ; le ± devient une barre signée, la charge des pastilles.
  - Seuil : ≤ 24 nombres au premier écran, ≤ 1 par colonne de semaine, un seul nombre ≥ 28 px.
- **Q3 Zéro troncature** · tous · D-N1 + U-N2 + B-N4
  - Mesure : nœuds texte visibles (noms, montants, dates, échéances, puces, cartes, filtres) avec scrollWidth > clientWidth + 1 ou ellipse rendue ; barre courte qui écrit son nom à côté exclue.
  - Seuil : 0 coupé ; d'abord le nom court de K5, deux lignes en dernier recours, jamais d'ellipse. Témoins p1 : Brewferm, Fût 7, Embouteilleuse, Nettoyer les fenêtres.
- **Q4 Cibles et pouce** · tous · K16 + W8 + B-N1 + U-N3 + D-N2
  - Mesure : à 390 × 844 tactile, zone touchable réelle de chaque actionneur (boîte et zone élargie, sondée par elementFromPoint), écart aux voisines, largeur du bord à tirer, centre des actions de fin (+, Poser, Payé, Fait, Annuler, puce) dans feuilles et bulles.
  - Seuil : 0 cible < 44 × 44 px (montant modifiable compris), 0 voisine < 8 px, bord tiré ≥ 24 px, 100 % des actions de fin dans les 45 % du bas. Filtres, période, Trier, ★ hors mesure (sa maquette fb).
- **Q5 Contexte et effet visibles** · tous · U-N4 + D-N3
  - Mesure : à l'ouverture d'une bulle, feuille ou menu, getBoundingClientRect de la cible et de la surface, part de frise ou de liste visible ; pendant chaque geste, MutationObserver sur les valeurs changées (caisse, compteurs, date, cuve, stock).
  - Seuil : cible et sa semaine jamais couvertes ; surface ≤ 40 % de la hauteur à 390 ; ≥ 50 % de la frise et 2 semaines voisines visibles ; 100 % des valeurs changées visibles et mises en relief 400-1 000 ms, ou signalées dans la rangée collée.
- **Q6 Rien ne saute** · tous · K17 + V9
  - Mesure : rejeu T1-T16 et gestes K11 en touchers réels ; PerformanceObserver layout-shift hors ouverture de feuille ; position de la chose touchée avant et après ; FLIP sur filtre, tri, période, Annuler, ajout ; rejeu prefers-reduced-motion.
  - Seuil : CLS ≤ 0,01 par tâche ; chose touchée à ±8 px ; 100 % des choses restantes glissent en 120-250 ms, aucune ne disparaît ; 0 ms en reduced-motion.
- **Q7 Fluidité au doigt** · tous · K18 + B-N3 + D-N4 + U-N7 + W2 (partie performance)
  - Mesure : Chrome CPU ×4, fixture ×4 (22 302 choses) ; trace pendant glisser de barre, tirage de bord, glisser de montant ; rAF, longtask, INP, délai toucher → fantôme, écart barre-doigt.
  - Seuil : ≥ 55 images/s, 0 tâche > 50 ms, INP ≤ 100 ms sur T1-T16, fantôme ≤ 50 ms, barre ≤ 4 px du doigt, « à te permettre » dans la même image. Haptique : bonus Android, jamais un seuil.
- **Q8 Geste sûr** · calendrier · B-N2 + W2 + V8
  - Mesure : CDP Input.dispatchTouchEvent à 390 : 50 défilements verticaux partis d'une barre (0-30° de la verticale, lents et rapides), 20 glissers, 20 tirages de bord, 20 touchers brefs, 20 appuis longs de 450 ms avec 8 px de tremblement ; date, durée et état ouvert relus après chaque essai ; zones de prise sondées à 4 px, à chaque période.
  - Seuil : 0 déplacement ni menu par un défilement, et la page a défilé ; 20/20 justes ailleurs (aimant compris) ; prise ≥ 44 × 44 px même pour ½ jour ; zones élargies qui se chevauchent attribuées à la barre la plus proche.
- **Q9 Le geste s'annonce** · tous · W3 + U-N5
  - Mesure : DOM au repos : poignée (bords, grain) sur chaque élément à geste, aucune sur `data-ro`, qui porte le picto de son module ; glisser sur `data-ro` → rebond non textuel < 100 ms ; aucun pointillé de champ à taper ; un juge Haiku neuf désigne, sur la capture repos sans légende, ce qui bouge.
  - Seuil : poignée si et seulement si déplaçable (100 %), 0 mot ajouté, ≥ 95 % des barres désignées juste, 5 gestes sur 5 trouvés. La poignée compte comme un signe de Q11.
- **Q10 Icônes reconnues seules** · tous · U-N6
  - Mesure : chaque icône sans texte (filtres, actions, Maintenant) montrée à 12 px à un juge neuf, qui la nomme ; comparée au type réel, deux thèmes.
  - Seuil : 8 sur 8 par type. Une icône ratée lui est montrée en variantes ; ses pictos choisis ne se remplacent pas d'office.
- **Q11 Grammaire des signes** · tous · D-N5 + V4
  - Mesure : script relève par écran les classes de signes (pointillé, tireté, pastille chiffrée, rayures, jauge à points, !, ★, poignée) et la signature de chaque barre ou carte (bord, motif, opacité, ton), rapprochées de `signes.json` (un signe, un sens, commun calendrier et carnet) ; un juge nomme le sens à l'aveugle.
  - Seuil : ≤ 5 signes par écran, 0 signe à double sens, 0 motif décoratif, ≥ 90 % nommés juste ; légende à un toucher, jamais au repos.
- **Q12 Rouge réservé au problème** · tous · K15 + U-N8 + B-N6
  - Mesure : tout élément chaud (teinte 0-45°, saturation > 50 %, texte, bord ou fond) doit porter `data-etat` retard, conflit, négatif ou manque, et une forme (picto ! ou motif) ; remplissages de type < 35 % de saturation ; flou gaussien 6 px sur la capture repos.
  - Seuil : 0 chaud hors alerte, 100 % des alertes avec forme, ≤ 3 masses rouges au repos, ≤ 1 accent hors types ; au flou, les 2 masses les plus fortes sont l'alerte et le grand chiffre.
- **Q13 Palette lisible par un daltonien** · tous · V3
  - Mesure : `node validate_palette.js` sur les couleurs de genre, surfaces #fff et #12100e ; ΔE OKLab entre `--bad` et chaque genre.
  - Seuil : séparation CVD ≥ 6 entre voisins (picto en second encodage), vision normale ≥ 15, aucun genre gris, ΔE ≥ 15 avec `--bad`, PASS deux thèmes. La correction se montre en variantes (ses teintes).
- **Q14 Le présent ancré, le réel séparé du prévu** · calendrier · V5
  - Mesure : (a) un seul trait « aujourd'hui » continu sur ≥ 90 % de la frise ; (b) semaines passées à ΔL OKLab ≥ 0,08 ; (c) courbe coupée au jour, plein pour le réel, pointillé pour le prévu ; (d) aujourd'hui dans le premier quart gauche à l'ouverture.
  - Seuil : (a) à (d) dans 100 % des états, 0 mot ajouté.
- **Q15 Base honnête** · tous · V6
  - Mesure : courbe : ligne zéro dès que le minimum passe sous 20 % de l'échelle, ≤ 2 graduations rondes, zone sous zéro en alerte ; pendant un geste seulement, tracé avant (fin) et après (plein) ; barres de Comparer du carnet proportionnelles depuis un zéro commun ou une base déclarée.
  - Seuil : 100 % des gestes montrent avant et après ; erreur de proportion ≤ 2 % ; 0 graduation chevauchée.
- **Q16 Pincer pour changer d'échelle** · calendrier · V7
  - Mesure : 2 doigts (CDP) sur la frise : niveaux 6 sem ↔ 3 mois ↔ 6 mois ↔ an, semaine sous le centre, grain et écart des repères, temps par image sur fixture ×4.
  - Seuil : 1 pincement par niveau, centre à ±8 px, libellés à ≥ 4 px, p95 ≤ 16 ms. En ajout : les segments de sa maquette restent.
- **Q17 Test des 5 secondes** · tous · K13 + U-N10 + B-N10 + V10 + D-N6
  - Mesure : 3 juges Haiku neufs, sans code, voient la capture repos 390 et 844 réduite à 50 % et floutée à 2 px, l'équivalent de 5 s, et répondent par écrit, comparé à la fixture. Calendrier : combien je peux dépenser, quoi en retard, quoi cette semaine. Carnet : de quoi il parle, qu'ai-je choisi et pourquoi, quoi a bougé. Flou 6 px : semaine critique à ΔL ≥ 0,15 de ses voisines.
  - Seuil : 3 sur 3 chez les 3 juges, chaque écran, deux thèmes.
- **Q18 Zéro confirmation** · tous · K22 + W1 + D-N10
  - Mesure : chaque écriture jouée (poser, déplacer, allonger, payé, fait, retirer, lier, épingler, choisir ou écarter au carnet, mettre en veille) ; boutons OK, Poser, Valider, Confirmer, Annuler comptés hors toast ; Annuler joué, magasin comparé en égalité profonde, hors ligne compris.
  - Seuil : 0 confirmation (hors irréversible externe), choisir vaut faire, toast Annuler ≥ 5 s, état identique à 100 % ; T5 par valeur proposée = 1 toucher, T3 dicté = 1 toucher après la dictée. Témoin : p1 échoue (OK en t10 et t5b, Poser en t3dicter).
- **Q19 Provenance visible** · tous · B-N9
  - Mesure : chaque valeur porte `data-origine` (lui, ia, veille, lien-lu, proposé, dicté) ; compter les valeurs étrangères sans marque et les pourquoi, raisons d'écarté ou noms écrits sans validation ; une dictée ambiguë (« sol S20 à 40 ») marque la partie devinée.
  - Seuil : 0 sans marque, 0 raison écrite sans lui, 0 inconnu à zéro ; marque picto ≥ 14 px sans mot, retirée à la validation (geste naturel, jamais un bouton).
- **Q20 Aller-retour sans perte** · liens · K19 + W5 + B-N8 + D-N8 + U-N9
  - Mesure : 12 genres de K6 et carnet ↔ calendrier : régler filtre, tri, période, défiler, ouvrir l'origine, revenir ; comparer scrollY, défilement de frise, période, filtres, tri, sélection. Sens inverse : puce « S51 » du module → frise centrée. Modifier dans le module, relire la frise sans recharger.
  - Seuil : 12/12 dans les deux sens, 1 geste chacun, scroll à ±8 px, état identique, chose surlignée 1 s ; clore une chose d'un autre module dans une feuille posée sur le calendrier (0 navigation) ; 0 écart de nom, montant ou date.
- **Q21 Même signe partout** · liens · K20
  - Mesure : table de jetons par genre (id SVG du picto, variable CSS de teinte, nom court) ; puppeteer parcourt calendrier, carnet, Finances, Brassins, Stocks et compare chaque `data-genre`.
  - Seuil : 0 écart, tous écrans, deux thèmes.
- **Q22 Propositions justes** · tous · K21 + W6 + B-N7 + D-N7
  - Mesure : rejeu leave-one-out ; réglage sur 2021-2023, jugement sur 2024-2025 (L20) : rang de la vraie chose dans les puces, semaine et montant proposés ; carnet : caractéristiques proposées gardées.
  - Seuil : 1re puce ≥ 60 %, 3 premières ≥ 90 %, semaine ±1 ≥ 80 %, montant ±10 % ≥ 70 %, carnet ≥ 80 % gardées ; 0 valeur atteignable seulement au clavier. Fixture synthétique = fumée ; le 10 se juge sur son historique anonymisé, en lecture seule ; carnet après IA réelle.
- **Q23 Son essai réel** · tous · W10 + doigts mesurés (B)
  - Mesure : page L7 jouable seule : horodatage de chaque toucher, toucher raté (< 12 px d'une cible), hésitation > 3 s, retour arrière, clavier ouvert ; 5 tâches calendrier (retard, payer, poser un brassin, déplacer, allonger), 3 carnet (idée dictée, coller un lien, retrouver « pourquoi celui-là ») ; journal au pilote.
  - Seuil : médiane ≤ 6 s par tâche, 0 clavier, ≤ 1 hésitation, 0 retour non voulu, sa phrase classée « aime » (PORTRAIT). Juge final, sans bloquer le reste.

## Innovations retenues
1. Pincer la frise : 6 sem ↔ jours ↔ 3 mois ↔ an, l'aimant suit le zoom ; en ajout aux segments de sa maquette (Q16 ; U, W, B, V, K, D).
2. Maintenant en cartes à balayer : à droite fait ou payé (daté du jour), à gauche décaler d'une semaine, Annuler 5 s, 0 bouton ; seulement si la liste ne défile pas à l'horizontale (U, W, D).
3. Fantômes de l'an dernier : barre pâle à la date probable, un toucher l'accepte, un balayage l'écarte ; justesse mesurée par Q22 (W, K).
4. Rangées vides repliées en filet de 4 px de leur couleur, rouvertes d'un toucher : la frise remonte sans réglage (U).
5. Duel dans le carnet : deux articles côte à côte, on balaie celui qu'on écarte, classement par paires (Pugh) ; le pourquoi se dicte et ne s'écrit qu'après sa validation (Q19) (U).
Aussi en variantes : notifications actionnables (Android ; iOS incertain), éventail de prévision sur la courbe (V).

## Rejetés
- W4 suites automatiques : fonction, pas critère → MANQUES (suites calculées en lecture seule, groupées dans la barre du brassin ; ce qui engage de l'argent reste « proposé »).
- W7 actions sur un lot, W9 rappel actionnable (repli ≤ 2 touchers ; iOS incertain) : fonctions → MANQUES.
- D-N9 lier d'un geste : fonction → MANQUES ; reste exigé un lien stocké une fois, visible des deux côtés.
- V1 axe commun courbe-frise : seulement si sa maquette fb a une courbe de détail ; sinon variantes.
- Haptique en seuil (U-N7 et innovations) : `navigator.vibrate` absent de Safari iOS ; bonus Android seulement.
- Cibles de 48 px (W8, B-N1) : 44 px retenus (Apple HIG, UI compacte).
- Zone du pouce mesurée sur filtres, période, Trier, ★ (U-N3, D-N2) : sa maquette fb ; les descendre se montre en variantes.
- Pincer qui retire les segments : retrait de sa maquette, refusé.
- Caisse en bande ou en trait en plus de la courbe : même fait deux fois (Q1) ; variantes, le graphe de fb reste.
- « Rouge = action en 1 toucher » pour tout (B-N6) : rouge = problème ; l'action en 1 toucher vaut pour les choses seulement.
- Appui long à 5 sens (fil rouge, « et si », dictée située, sélection de lot) : il reste le menu L4, son choix.
- Tiroir du carnet au bord droit : conflit avec le retour par balayage du bord.
- Glisser d'une zone à l'autre : conflit avec le glisser de la frise.
- Widget d'écran d'accueil : impossible en PWA.
- Fable comme juge : interdit (10.11) ; Haiku neufs pour Q17, critique Opus à part.
