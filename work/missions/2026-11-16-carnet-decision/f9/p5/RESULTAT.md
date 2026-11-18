OK — carnet p5 : interrupteur net, Comparer lisible (barre longue = meilleur), écartés visibles, ↓ baisse

## Fichiers (tous dans f9/p5)
- `retouche5.mjs` (nouveau, part de `../p4/proto.tpl.html`, split/join, chaque marque unique), `proto.tpl.html`, `proto.src.html`, `proto.html`.
- `assemble.mjs` (lien du partage simulé crédible), `build.mjs`, `outils-p5.mjs` (adaptation unique des contrôles), `gestes.mjs`, `mesure.mjs`, `cibles.mjs`, `capt.mjs`, `planche.mjs`, `GESTES.md`.
- Sorties : `gestes.log`, `mesure.log`, `cibles.log`, `mesure.json`.
- Rebâtir : `node retouche5.mjs && node assemble.mjs && node build.mjs`.

## Sorties décisives
- `node gestes.mjs` : **GESTES OK**, 24 lignes OK, console propre. T1 en 0 toucher ; T2b, T8, T9 (un glissé) et T11 en 1 ; T14b en 3 ; T5b en 4 ; toutes les autres en 2. 0 frappe, aucun `type="number"`.
- `node mesure.mjs` : **MESURE OK**, 48 écrans (24 × clair et cave). Tailles 15/18/26 partout, rien sous 15 px, contraste min 5,68:1 (valeur verte surlignée).
  - Mots au repos (≤ 40) : liste 36, carnet 39, fiche 39, feuille du choix 39, pourquoi 37, ventilation 34, frigo 32, évier 21, nouveau 25, lien 18.
  - Tableaux, plafond 64 (écart voulu, voir plus bas) : articles 48, ventilation-articles 41, comparer 60, ventilation-comparer 45, frigo-comparer 50.
  - Après un geste, sans plafond : feuille Façon 49, journal déplié 68.
- `node cibles.mjs` : **CIBLES OK** (14 états, ≥ 44 px, aucun débordement).

## Retouches (3 juges, groupées)
1. Interrupteur : l'ancienne règle `.k-sw` (pastille `:after`) est supprimée. Il reste un seul rond, avec un ✓ quand c'est allumé, sur un rail encre ; éteint, le rail est gris. Vérifié en clair et en cave (fiche, feuille du choix).
2. Comparer à 390 :
   - Le nom et la colonne ★ restent fixes. Toutes les autres colonnes défilent avec un aimant (snap), et la suivante est coupée au bord. Plus de puce « Prix ⌄ » ni de feuille.
   - En-têtes de même style : ligne 1 « ★ Oxygène ppb », ligne 2 « moins = mieux ». L'unité passe en ligne 2 si la ligne 1 déborde (« Ambiant max » puis « °C, plus = mieux »). Jamais plus de 2 lignes.
   - Une barre depuis zéro seulement si plus = mieux : la barre la plus longue est alors toujours le meilleur, avec un minimum de 6 px. Si moins = mieux, le chiffre seul.
   - Le meilleur de chaque colonne est surligné en vert gras. Le ✓ reste réservé au choix (Q11).
   - Un filet pleine largeur par rangée. Noms en 18 encre normale, sans gris arbitraire. Les écartés sont visibles en gris sous « Écartés » ; le pays ne sert qu'à départager deux mêmes machines.
3. Baisse : « ↓ 600 CHF » est la seule pastille verte (liste, articles, fiche), et le journal comme Pourquoi disent aussi « ↓ 600 CHF ». Les offres ailleurs donnent leur prix en clair à droite, sans pastille.
4. Stock : « ● en stock » ou « ○ rupture » à côté du prix de la fiche et sur chaque offre ; une rupture se montre en gris dans Articles.
5. 1280 : marge droite de 120 px (plus rien sous le +). La méta dit « ppb, moins = mieux ✦ », avec le seul ✦ en fin de ligne.
6. Lien sans aperçu : « luftshop.ch », « À compléter ». La ligne entière s'ouvre, sans bouton à part, et le lien n'entre dans Comparer qu'une fois complété. Plus aucun `exemple.invalid` à l'écran (partage simulé : inox-leman.ch).
7. ★ pleine pour le critère seul, partout. Bannière Ventilation : « En tête », puis Hotte inox 120 et « ★ Débit, contre la condensation ». La raison du choix est en texte simple.
8. Façons : un seul ✓ au trait (retenir en 1 toucher). La ligne ouvre une feuille avec Retenir, ou « Écarter, parce que » et des raisons tirées du tableau (2 touchers). Une façon écartée est barrée, avec sa raison dessous.
9. Journal :
   - Le compte de notes est collé sous son jalon. Chaque dessin a son sens : ✓ vert plein = choix, ✓ encre au trait = façon retenue, calendrier plein = achat prévu, œil = veille.
   - Le jalon du choix nomme le produit (« Pré-évacuation 4 becs »), comme la bannière.
10. Feuille du choix : la pastille « ✓ Choisi » est retirée. Les coches sont vertes, et les écartés n'ont plus de chevron.
11. Carnet neuf : la note dictée vient d'abord. Dessous, « ✦ À comparer » tient sur une rangée qui défile, avec « Tout garder » en tête et des puces sans cadre (+ ou ✓). Le bloc quitte le journal dès que tout est gardé (Évier n'en a plus).
12. Frigo : la colonne s'appelle « Ambiant max », sur 2 lignes au plus.

## Captures (f9/p5/captures)
- 390, clair et cave, 28 états `p5-<état>-390.png` et `p5-<état>-cave-390.png` : repos, carnet, articles, comparer, comparer-ligne, fiche, choisi-feuille, choisi-raisons, choisi-ventilation, pourquoi, carac, ventilation, ventilation-articles, ventilation-comparer, frigo, frigo-comparer, evier, evier-critere, nouveau, facon, facon-ecartee, journal-ouvert, completer, lien, dial, cal, veille-on, partage-ajoute.
- Variantes L24 (clair) : `p5-comparer&ecartes=plies-390.png`, `p5-articles&ecartes=plies-390.png`, `p5-carnet&journal=apercu-390.png`.
- 1280 : repos, carnet, articles, comparer, fiche, pourquoi, ventilation-comparer. 844 : comparer, frigo-comparer, carnet (clair et cave).
- Ouvertes en planches. Défauts vus puis corrigés : en-tête « ppb, moins = » / « mieux » sur 3 lignes, « Pré-évacuatio » coupé sous la colonne ★, colonne suivante invisible (masque trop fort), sens chevauché en paysage, « −600 CHF à la veille » dans Pourquoi, « ✓ » seul sur sa ligne à 1280.

## Écarts voulus
- Tableaux (Articles, Comparer) : de 41 à 60 mots, plafond porté à 64. C'est la conséquence de « écartés visibles en gris » (tranché par le pilote et deux juges : il préfère l'info utile au vide). Ce sont des valeurs en case, pas de la prose. Le pli reste jouable en variante `&ecartes=plies`.
- Fiche : plus d'écart chiffré (« 500 de moins »), ni de « 40 ppb » après « 1er sur oxygène », ni de « Prochaine lecture » : sans cela, la fiche passait à 51 mots. Le prix de chaque offre est en clair, sous le prix du choix.
- Paysage 844 : la ligne 2 des en-têtes donne l'unité seule, car les colonnes de 80 px ne peuvent pas porter « moins = mieux ». Le surlignage vert y dit le meilleur.
- Le ✓ devant la meilleure valeur (demandé par un juge) est remplacé par un surlignage vert, parce que le ✓ dit déjà « choisi » (Q11).
- Journal : la note la plus récente reste repliée par défaut (compte collé au jalon), à cause du plafond de 40 mots. L'aperçu reste la variante `&journal=apercu`.

## Prédiction
« Là je vois direct qui gagne dans chaque colonne, le switch on voit qu'il est allumé, et je glisse pour voir le reste ; c'est propre. »

DÉCISION À PRENDRE : à montrer au brasseur en variantes (L24) : écartés visibles en gris (défaut p5) contre repliés (`&ecartes=plies`), et journal replié (défaut) contre aperçu de la dernière note (`&journal=apercu`). Le plafond de 40 mots du brief entre en conflit avec les écartés visibles dans les tableaux.
CONNAISSANCE : dans un tableau où certaines colonnes sont « moins = mieux », ne tracer la barre (depuis zéro) que sur « plus = mieux », et dire le meilleur par un surlignage. Ainsi la barre la plus longue est toujours le meilleur, sans échelle inversée.
LEÇON PROPOSÉE : aucune
