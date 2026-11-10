OK — 5 concepts passe 3 : Prix c5a–c5b (c4a + c4e greffé), rangement e2a–e2c ; PANEL en écart

## Fichiers écrits (voie c seulement)
`p3/c5a/`, `p3/c5b/`, `p3/e2a/`, `p3/e2b/`, `p3/e2c/` : chacun `etat.html` (classes et globales préfixées, statique), `NOTE.md`, `<id>-haut.png`, `<id>-page.png`, `<id>-etat2.png` (et `e2a-etat3.png`), `<id>-1280.png`. Ce fichier.
Scripts hors dépôt (scratchpad) : `cap-c3.mjs` (1280 + une image par état), `planche-c3.mjs`, `tout-c3.sh`.
Rien dans `src/`, aucun commit. `git status` montre des fichiers `src/domain/finance/*`, `tests/unit/*` et `PLAN-METIER.md` modifiés ou neufs : pas de cette voie (autre session ou voie).

| id | écran | chaleur | idée | état 2 |
|---|---|---|---|---|
| c5a | Prix | froide | c4a tel quel ; son aiguille 5,00 descend dans une carte noire posée sur la pente de l'année (même échelle) : 9 162,72, + 0,10 → + 363,60 /an | la carte touchée : c4e en feuille (4,50 · 5,00 · 6,00 ; 75 cl ≤ 8 048,00 /an ; fûts ≤ 1 652,40 /an) |
| c5b | Prix | tiède | un seul graphe : la règle de c4a est le sol de la pente de c4e ; un point lu à gauche (2,52 /bouteille) et à droite (9 162,72 /an) ; les titres d'axe sont la bascule | lu « par an » : l'axe droit s'allume, le chiffre en tête devient l'année |
| e2a | Rangement | froide | e1b affiné : onglet Argent = réponse du brassin (202,23, 41/40) + trois portes avec l'image de c3a, p2b, c4a/c5 | 2 : liste des brassins avec colonnes litre / reste (tous les prix d'un coup, planifié compris) ; 3 : Prévisions en reflet « ‹ Pale Ale » |
| e2b | Rangement | tiède | l'onglet Argent du brassin planifié est une frise : achats 57,42 avant le 20 nov., impôt 6,84 à la sortie de cave, ventes 405,00 (exemple) ; « ✓ dans Prévisions » ; houblon, levure « à compléter » | Prévisions reçoit le brassin en un bloc avec la même frise en petit |
| e2c | Rangement | chaude | aucun onglet : chaque brassin porte une étiquette de prix kraft (litre, reste ; à payer pour le planifié ; « ? » hachuré) ; impôt de l'année en pied de liste | l'étiquette ouverte sur place en feuille : 202,23, puis c3a, p2b, c4a/c5 en image |

Corrections transversales tenues : 7,51 CHF/L seul en tête ; grille 5,00 · 10,00 · 160,00 « exemple » ; payé 0,83 / à payer 2,38 / année 4,30 nommés (c3a) ; 27 L nets ; reste du brassin 202,23 partout (plus de 204,12) ; « mince » dit « ⅓ exemple » ; hypothèse « si 1 200 L en 33 cl » écrite sous chaque chiffre annuel ; inconnu = « ? », « ≤ », hachures ; aucun IBAN ; couleurs nommées.

## Sorties décisives
- `verifier-page.mjs --min-images 0` ×5 : PAGE OK (390 px, sans erreur). `cap-c3.mjs` : 1280 débord 0 ×5, erreurs 0, texte < 12 px : 0.
- `mots-premier-ecran.mjs p3 c5a c5b e2a e2b e2c --page=etat.html --profil=sans-houblons --sans-donnees --max=60` : c5a 60 · c5b 60 · e2a 60 · e2b 58 · e2c 54 → MOTS OK (premier passage : c5a 65, c5b 64, e2a 61, e2b 69, corrigés).
- `controle-commun.mjs p3 … --sans=mots` : COMMUN OK (premiers passages : contraste c5b 9, e2a 1, e2b 2, e2c 1 ; couleurs e2c 2 teintes ; tous corrigés).
- `controle-panel.mjs` (5 `-haut.png`) : **PANEL ECHEC** — remplissage médian 0,48 (0,55 visé), e2a 0,41, e2b 0,47, e2c 0,48 ; ressemblance 0,88 ; 1 paire ≥ 0,95 (e2b ~ e2c). Lecture : les trois rangements sont des écrans de placement (cartes blanches, chrome Brassins commun) ; c5a et c5b passent le plancher. Un essai d'agrandissement (viz, frise, cartes) a fait passer la médiane de 0,46 à 0,48 seulement ; densifier davantage voudrait du contenu inventé (recette, dates).
- `type="number"` : 0.

## Captures (toutes ouvertes)
`p3/c5a/c5a-haut.png`, `c5a-etat2.png`, `c5a-1280.png` ; `p3/c5b/c5b-haut.png`, `c5b-etat2.png` ; `p3/e2a/e2a-haut.png`, `e2a-etat2.png`, `e2a-etat3.png` ; `p3/e2b/e2b-haut.png`, `e2b-etat2.png` ; `p3/e2c/e2c-haut.png`, `e2c-etat2.png`. Les `-page.png` et les autres `-1280.png` n'ont pas été rouvertes (mêmes frames, débord 0 mesuré).

## Prédiction
Pour le prix, il prendra c5a (« c'est c4a, et l'année est juste dessous ») et trouvera c5b plus malin mais plus dur à lire ; pour le rangement, e2c (« le prix sur le brassin, sans onglet ») ou e2b pour le brassin planifié.

DÉCISION À PRENDRE : (1) l'impôt du brassin diffère entre deux écrans choisis : p2b dit 26,6 L conditionnés → 6,74 CHF, c3a et la correction « 27 L nets » donnent 6,84 CHF. J'ai pris 6,84 partout ; un seul volume conditionné à fixer au port. (2) Les 64,26 « à payer » du brassin comprennent l'impôt 6,84 (frais de c3a : énergie 8,00 + nettoyage 3,00 + emballage 24,00 + impôt 6,84 = 41,84). La prévision du brassin planifié se coupe donc en 57,42 avant le brassage et 6,84 à la sortie de cave (e2a, e2b) : à confirmer avec la voie p (p4a–p4d), qui dessine le même cas.
CONNAISSANCE : dans c3a, les 41,84 de frais incluent l'impôt bière 6,84 ; « à payer avant le brassage » vaut donc 57,42, pas 64,26. Le reste annuel d'un prix se lit sur la même droite que celui de la bouteille, à l'échelle × 3 636 (1 200 L ÷ 0,33 L) : c'est ce qui permet de fusionner c4a et c4e en un graphe.
LEÇON PROPOSÉE : aucune.
