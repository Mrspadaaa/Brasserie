OK — carnet p3 : corps 18, Comparer chiffré partout, paysage, journal en mots, signes à un sens

## Fichiers (tous dans f9/p3)
- Prototype : `proto.tpl.html` (source), `assemble.mjs` (+ symbole `i-revoir`), `build.mjs`, `proto.src.html`, `proto.html`.
- Contrôles : `gestes.mjs`, `mesure.mjs` (sortie `mesure.log`), `cibles.mjs` ; `capt.mjs` (copie de calendrier/p8), `planche.mjs` (`PAYSAGE=1` pour 844).
- `GESTES.md`, `captures/` : 39 états × clair et cave à 390, 6 états × clair et cave à 844 × 390, 7 à 1280.

## Sorties décisives
- `node gestes.mjs` : **GESTES OK**. T1 en 0 toucher, T8 et T11 en 1, toutes les autres en 2 (T9 passe à 2 : en-tête « Prix ⌄ » puis la caractéristique). T5b 4 et T14b 3, gestes en plus. 0 frappe, aucun `type="number"`, Source Sans 3 chargée, console propre.
- `node mesure.mjs` : **MESURE OK**, 40 écrans sur 40 (clair et cave). Tailles 15 / 18 / 26 seulement, rien sous 15 px, contraste min 6,36:1, aucune coupe « … ». Mots : liste 35, carnet 40, articles 35, comparer 40, pourquoi 37, fiche 40, feuille du choix 40, ventilation 35, ventilation-comparer 34, frigo 31, frigo-comparer 37, évier 30, nouveau 27.
- `node cibles.mjs` : **CIBLES OK** (0 cible < 44 px, aucun débordement).

## Corrections des trois juges
1. Comparer à 390 : nom, colonne ★ et une 2e colonne (prix d'abord), **toutes deux chiffrées** au-dessus d'une barre de 6 px, aucune colonne coupée. L'ordre des lignes ne bouge jamais (rang sur ★). Autre caractéristique : en-tête « Prix ⌄ », feuille de puces.
2. Paysage 844 × 390 : liste en 2 colonnes ; Comparer en matrice entière, chaque cellule chiffrée, en-tête de 56 px, barre du bas et + masqués : 5 lignes visibles (embouteillage, 7 colonnes).
3. Journal : plus d'icônes muettes ; « 1 note ⌄ », « 3 notes ⌄ », « 3 notes, 1 décision, 1 alerte ⌄ ». La note récente reste en entier (ventilation).
4. Légende redite supprimée : unité, sens (↑ / ↓) et ✦ une seule fois sous le nom de colonne (« ppb ↓ ✦ »).
5. Écartés : « débit 1’200 contre 1’800 », puis « 1’150 CHF de moins » en gris (Pourquoi). « − » réservé aux baisses de la veille.
6. Un nom court partout, titre de fiche compris ; nom long et fournisseur · pays en gris dessous.
7. Signes : œil = veille seulement (jalon de veille compris) ; « À revoir si » prend ↻ ; ★ = critère seulement (retiré de la bannière, des raisons et des notes) ; « −600 » sans flèche ; « Battu partout » sans flèche.
8. Plus de Garder : propositions gardées d'emblée, ligne grise « ✦ Comparer sur … › » qui ouvre Caractéristiques. Caractéristiques : la ligne coche ou décoche (✓ fin, barré une fois retirée), ★ à gauche, plus de bascule ni de légende. Fiche : la veille est une ligne œil, sans bascule noire.
- Lisibilité : corps de 18 (noms, valeurs, journal), secondaire de 15 en gris foncé (8:1), titre de 26 ; papier chaud (#faf8f4) au lieu du blanc.
- Bannière : 2 lignes (nom, une raison), ✓ sur la photo, plus de sous-bande. L'échéance devient le jalon à venir « 2 déc. Achat prévu » (T15).
- Calendrier : chaque point est nommé (13, 20, 26, « Achat, 2 déc. »).

## Captures (f9/p3/captures)
- 390 : `p3-<état>-390.png` et `-cave-390.png` (repos, carnet, articles, comparer, comparer-ligne, pourquoi, fiche, choisi-feuille, choisi-raisons, carac, ventilation, ventilation-comparer, ventilation-col, frigo, frigo-comparer, evier, nouveau, cal, dial, lien, completer, partage-ajoute, journal-ouvert…).
- 844 : `p3-{repos,comparer,ventilation-comparer,frigo-comparer,carnet,comparer-ligne}-844.png` et `-cave-844.png`.
- 1280 : `p3-{repos,carnet,articles,comparer,fiche,pourquoi,ventilation-comparer}-1280.png`.
- Ouvertes en planches (clair, cave, 844, 1280) et regardées. Défauts vus puis corrigés : « Pré-/évacuation » cassé (colonnes 88 px), nom chevauchant la valeur en paysage, « Ambiante/Volume » collés en paysage, ★ sur une note, ↓ devant « Battu partout ».

## Écarts voulus
- Tailles 26/18/15 au lieu de 24/16/14 : la plainte est « difficile à lire, voir » ; toujours trois tailles.
- Paysage frigo : 8 colonnes, l'★ passe au-dessus de « Ambiante ».
- La feuille du choix montre la raison perdante seule ; la différence de prix apparaît en ouvrant la ligne et dans Pourquoi (plafond de 40 mots).

## Prédiction
« Là c'est lisible : je vois les chiffres et le prix à côté, je sais ce qu'il y a derrière les notes, et en tournant le téléphone j'ai tout le tableau. »

DÉCISION À PRENDRE : restent ouverts, à montrer en variantes (L24) : la place du carnet dans l'app, et le repli du journal (« 3 notes ⌄ » ici, ou la dernière note en gris, environ 6 mots de plus).
CONNAISSANCE : à 390, deux colonnes entières chiffrées (★ fixe + une au choix, prix par défaut) tiennent sous 40 mots ; la matrice entière se garde pour le paysage et la 1280.
LEÇON PROPOSÉE : aucune
