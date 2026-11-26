OK — 9 écrans O (16 captures), Organisé en 2 variantes, Comparer 3 et 6 offres, caractéristiques

## Fichiers (lettre O)
Chaque page montre l'écran (390 × 844, sombre) puis, à droite, la capture de SA version et ce qui a changé.
| Écran | Page | Captures | Sa version |
|---|---|---|---|
| Organisé, écoulement (reprise) | `O-organise.html` | `cap/O-organise.png`, `cap/O-organise-ia.png` (✦ ouvert) | v04-11 |
| Organisé, variante b « arbre des causes » | `O-organise-b.html` | `cap/O-organise-b.png`, `cap/O-organise-b-ia.png` | v04-11 |
| Changé par l'IA | `O-change.html` | `cap/O-change.png` | v05-11 |
| Options a (cartes, v02) | `O-options-a.html` | `cap/O-options-a-3.png`, `cap/O-options-a-6.png` | v02-15 |
| Comparer b (tableau adapté, v06) | `O-options-b.html` | `cap/O-options-b-3.png`, `cap/O-options-b-6.png` | v06-19 |
| Comparer toutes les caractéristiques (chambre froide) | `O-comparer-caracteristiques.html` | `cap/O-comparer-caracteristiques.png`, `…-bas.png` | vue Comparer de l'app (critique-55 A-comparer-0) |
| Décider, devis reçu | `O-decider.html` | `cap/O-decider.png` | v01-11 |
| À faire, tous les carnets | `O-afaire.html` | `cap/O-afaire.png` | v01-13 |
| Résoudre sur preuve | `O-resoudre.html` | `cap/O-resoudre.png` | v01-14 |
| Résolu grâce à l'achat | `O-resolu.html` | `cap/O-resolu.png` | v01-15 |
| Relecture des mois plus tard | `O-relecture.html` | `cap/O-relecture.png` | v03-16 |
Aussi : `mini/COMMUN.md` (jetons partagés avec S : couleurs d'état, tailles, icônes, barre du pouce, dates).
Générateur hors dépôt (scratchpad de la session) ; les pages sont autonomes (HTML + CSS, police Source Sans 3).

## Critères (sorties)
- Captures : 16 prises sur Chrome 9222 (puppeteer-core, onglet propre, `page.close()` puis `browser.disconnect()`), 390 × 844, DSF 2, toutes ouvertes.
- Contrôle de page maison (débordement, texte coupé, texte < 13 px) : tous « OK », sauf Comparer caractéristiques « déborde 462 px » (voulu : vue qui défile, capture `-bas` du reste) et Comparer b-6 « déborde 10 px » (bloc sous le pli).
- COMPARER-BEAUCOUP-D-OPTIONS : 6 offres tenues sans colonnes écrasées ni défilement horizontal (a-6 : cartes de 2 lignes ; b-6 : tableau 4 colonnes fixes).
- FRISE-GENERIQUE : aucune frise Noté › Résolu (retirée de v04, v05, v01) ; achat = « besoin avant ma 15.12 · dans 19 j » ; b : 4 pas datés de CE carnet.
- PAS-DE-HARCELEMENT : le pouce ne porte que champ, ✦ et + ; « Relancer l'entreprise X ? », « Toujours le bon choix ? » et la 2e question de Résoudre retirés (interrupteur déjà posé).
- ENTETE-PEU-UTILE : première info utile à ~105 px (cases) ; heure de rangement en icône « ✦ 25.11 ↺ ».
- TROP-ENFANTIN : noms réels 2–5 mots, aucun emoji (icônes au trait 14–20 px), « toi-même » → « Moi-même », vignettes illustrées → cases nom + icône + date.
- Toujours visuel : couleur d'état, lignes de métro, jauges de quantité (6 cases = 600 bt), barres de coût, ▲ gagnant ; tableau seulement dans Comparer.
- Données : écoulement = ses 5 notes du relevé c79 (24.11 21:18/21:26) ; aucune valeur hors notes (les 150 CHF de v04/v05 retirés → « prix ? »). Suites fictives et 3 offres d'épreuve dites dans la colonne source, jamais dans l'écran.
- `controle-panel.mjs` (fait pour une série v0) : PANEL ECHEC — remplissage médian 0,48 (thème sombre, bas d'écran laissé libre sur 4 écrans) et diversité 0,92 (voulu ici : même app, même carnet, 3 et 6 offres du même écran). Non bloquant pour ce contrat ; noté.
- `controle-choix.mjs` : non joué (registre `ecrans.json` hors de ce brief, qui fixe sa recette par CLASSEMENT-4.md).

## Prédiction
« Organisé, enfin je vois trouvé / pas trouvé / quoi faire d'un coup d'œil ; Comparer tient à 6 » — risque : l'arbre b plus parlant que la reprise, et les bas d'écran un peu vides.

DÉCISION À PRENDRE : Organisé, reprise v04 (lignes de métro) ou variante b (arbre des causes) — à lui montrer côte à côte ; et Comparer en cartes (a) ou en tableau (b).
CONNAISSANCE : le relevé c79 range « Devis attendu. » en genre « a-acheter » (erreur de lecture réelle, montrée cadenassée dans Changé par l'IA).
LEÇON PROPOSÉE : aucune
