OK — 8 concepts passe 2 (Synthèse g3a–g3d, Annuel g4a–g4d), PAGE MOTS PANEL COMMUN OK

## Fichiers écrits
`p2/g3a` … `p2/g4d` : `etat.html` (statique, classes préfixées), `NOTE.md`, captures `<id>-haut.png`, `<id>-page.png`, `<id>-1280.png`, `<id>-etat.png` (état utile, ouvert par `etat.html#etat`, en CSS `:target`, sans script de geste). Outils de capture et de comptage dans le scratchpad de session (rien à la racine, rien dans `src/`).

| Id | Chaleur | Idée |
|---|---|---|
| g3a | froide | g1b affinée : entré contre dépensé, loyer hachuré « à payer » dans la colonne, gain relié à sa pastille, ✦ Pourquoi ? |
| g3b | tiède | le mois en trois opérations (langue c1c) : 720,00 − 696,80 = +23,20 ; 4 181,60 − 460,00 = 3 721,60 ; 202,77 ÷ 27 L = 7,51 |
| g3c | chaude | flux : où sont allés les 720,00 ; le filet vert est le gain ; matériel venu de la caisse, à part |
| g3d | chaude | sur 100 CHF vendus : 56 loyer, 9 électricité, 26 brassage, 6 nettoyage, 3 gagnés |
| g4a | froide | l'année à la même échelle : trou rouge −477,80 au-dessus de la colonne verte, stock « ? » dedans |
| g4b | tiède | −477,80 et deux barres, puis la clôture en route de 7 stations, « sûr à 2/7 » |
| g4c | chaude | la perte en bouteilles : ≈ 190 × 33 cl (prix exemple 5,00, il te reste 2,52), ≈ 26 / semaine |
| g4d | chaude | la balance de l'année : elle penche ; stock « ? » à peser au 31 déc. |
Annuel : les tuiles par mois de g2c sont partout un **outil d'analyse** à un toucher, dessinées ouvertes dans `<id>-etat.png` (janv.–avr. « rien noté » hachuré, plus de « 0 » ; déc. « à venir »).

## Sorties décisives
- `verifier-page.mjs <etat.html> --captures … --min-images 0` : PAGE OK ×8.
- `mots-premier-ecran.mjs p2 g3a … g4d --page=etat.html --max=60 --sans-donnees --profil=sans-houblons` : 60, 57, 60, 54, 59, 59, 60, 46 → MOTS OK.
- `controle-panel.mjs` (8 premiers écrans) : médiane 0,64, 0 sous 0,50, ressemblance 0,87, 0/28 paires presque identiques → PANEL OK.
- `controle-commun.mjs p2 g3a … g4d --page=etat.html --sans=mots,fiche --profil=sans-houblons` : COMMUN OK (mots joués à part ; fiche : aucun houblon).
- Captures ouvertes : les 8 `-haut`, `g3a/g3b/g3c/g3d/g4a/g4d-etat`, `g3a-1280`, `g4c-1280`.

## Corrections transversales tenues
7,51 CHF/L tout compris, 27 L nets ; grille d'exemple 33 cl 5,00 ; payé / à payer / dépensé nommés (nov. : payé 325,40 · à payer 400,00 · matériel 28,60 à part) ; Gagné / Perdu / Dépensé / Il te reste / Usure du matériel ; fournisseurs repliés ; décimales constantes. Les chiffres annuels viennent de la fixture (`financeDemo.ts`) : mai–oct. = petits achats 43,00 à 28,00 (`DEMO-H1..6`), usure 288,00 = 20 % de 1 440,00 (`DEMO-IMMO`), électricité 68,00 (`DEMO-T5`) ; ils ne sont donc pas « exemple ». Hors fixture et marqué : prix 5,00, réponses IA.

Prédiction : il s'arrête sur g4c (« 190 bouteilles ») et g3d (« 3 francs sur 100 ») parce qu'il y lit sa question sans compter ; g3a lui paraîtra la plus sûre à porter.

DÉCISION À PRENDRE : aucune. Rappel de la v0, toujours ouvert : les joints de cuve (28,60, `category:'materiel'`) sont mis « à part » ; un petit achat de matériel serait peut-être une charge du mois (seuil à fixer).
CONNAISSANCE : `mots-premier-ecran.mjs` compte comme mots les glyphes isolés (›, ·, ÷, ✦, ?) et tout texte du premier écran caché sous la barre fixe (une annexe à 200 px sous une page courte tombe dans les 844 px) ; mettre les glyphes en `::before` et l'annexe hors du premier écran.
LEÇON PROPOSÉE : aucune.
