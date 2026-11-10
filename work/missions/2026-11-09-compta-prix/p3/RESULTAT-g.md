OK — Synthèse g5a–g5d et clôture g6 (g4a + 9 écrans), PAGE MOTS PANEL COMMUN OK

## Fichiers écrits
`p3/g5a` … `p3/g5d`, `p3/g6` : `etat.html` (statique, classes préfixées, états par ancre `:target`, aucun script), `NOTE.md`, captures. Outils de capture et de retouche dans le scratchpad de session (rien à la racine, rien dans `src/`, aucun commit).

| Id | Chaleur | Idée |
|---|---|---|
| g5a | froide | g3c dans la grammaire de c3a : « D'où / Où part », gain en nœud vert, carte noire 720,00 − 696,80 = +23,20, caisse en barre libre / à payer hachuré / en retard |
| g5b | tiède | g3a couché : deux barres à la même échelle, loupe ×10 sur l'écart +23,20 ; dettes en deux cartes (atelier 60,00 en retard = action primaire) |
| g5c | chaude | règle du mois (langue p2b) : dépenses en bandes jusqu'au seuil « pour tourner 696,80 », épingle « vendu 720,00 » ; 140 × 33 cl · 70 × 75 cl · 5 fûts (exemple) |
| g5d | chaude | miroir mai → déc. : entré au-dessus, dépensé dessous, pastille de résultat par mois ; « 1er mois gagné » |
| g6 | — | g4a en tête (piste 9 stations, 2 / 9), puis une question par étape : Tout est noté ? · Avec combien as-tu commencé ? · stock 1er janv. / 31 déc. · ce que ta cuve a perdu · qui doit quoi · pris pour toi · six questions · ce que tu recopies · ton dossier |

## Sorties décisives
- `verifier-page.mjs <etat.html> --captures … --min-images 0` : PAGE OK ×5.
- `mots-premier-ecran.mjs p3 g5a g5b g5c g5d g6 --page=etat.html --max=60 --sans-donnees --profil=sans-houblons` : 59, 59, 58, 60, 56 → MOTS OK.
- `controle-panel.mjs` (5 premiers écrans) : médiane 0,65, 0 sous 0,50, ressemblance 0,86, 0/10 paires presque identiques → PANEL OK.
- `controle-commun.mjs p3 g5a … g6 --page=etat.html --sans=mots,fiche --profil=sans-houblons` : COMMUN OK (après correction : rayons 12 → 10 px, contraste « rien vendu » et « gagné », traits d'icône 1,8 → 1,4). Limite : il ne juge que la tête de g6, pas les 9 étapes ouvertes par ancre (vues à l'œil).

## Captures (toutes ouvertes)
- Synthèse : `p3/g5x/g5x-haut.png`, `-page.png`, `-1280.png`, `-etat.png` (g5a et g5d : réponse IA « exemple » sourcée ; g5b : octobre « rien vendu », −28,00 ; g5c : décembre à venir, loyer prévu seul, « vendu ? »).
- Clôture : `p3/g6/g6-haut.png` (tête g4a), `g6-1280.png`, `g6-1-operations.png`, `g6-2-ouverture.png`, `g6-3-inventaires.png`, `g6-4-materiel.png`, `g6-5-dettes.png`, `g6-6-parts-privees.png`, `g6-7-verifications.png`, `g6-8-reporter.png`, `g6-9-dossier.png`.

## Corrections transversales tenues
7,51 CHF/L tout compris, 27 L nets ; grille 5,00 · 10,00 · 160,00 « exemple » (g5c) ; payé 296,80 ≠ à payer 400,00 (+ 60,00 en retard) ≠ dépensé 696,80, matériel 28,60 à part ; Gagné / perdus / Usure du matériel ; fournisseurs repliés ; couleurs et hachures nommées. Clôture : chiffres tirés de la fixture (ouverture 4 000,00 confirmée ; cuve 1 800,00 → 1 440,00 → 1 152,00, usure 288,00 ; payé sur l'année 538,40 = 213,00 + 325,40 ; dépensé 909,80) ; fortune 4 873,60 = 4 181,60 + 1 152,00 − 460,00, « + stock ? », provisoire ; codes FriTax 2025 montrés, 2026 « à confirmer » (problème 8).

Prédiction : il s'arrête sur g5c (« il me faut 697 pour tourner, 140 bouteilles ») et trouve dans g6 la clôture enfin lisible, étape par étape, avec g5a comme la Synthèse la plus sûre parce qu'elle parle comme c3a.

DÉCISION À PRENDRE : aucune pour la voie. Toujours ouvert (dessiné, pas tranché) : les joints 28,60 « Matériel / Petit achat » (g6-4) ; « pour tourner » de g5c = dépenses du mois, pas un point mort sur marge.
CONNAISSANCE : un état ajouté par script à une maquette doit avoir ses propres noms de classes : `g5a-src`, `-big`, `-bar` existaient déjà, l'état les a écrasés (la carte noire est passée de 40 à 32 px) ; vu sur la capture, corrigé par renommage (-esr, -ebg, -ebr).
LEÇON PROPOSÉE : aucune (cas de L26, déjà écrite).
