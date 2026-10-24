# e5, passe 2 : « on gagne / on paie » (série E, la frise ; tiède)

Page : `e5/etat.html`, générée par `generer.mjs` sur `socle2.mjs`. Le socle est une copie de `../socle.mjs` avec les
pictos de la planche standard, l'α du lot suivi de la plage, un départ à « actif · 2 j » et la flèche du retour en CSS.
`captures.mjs` joue le geste et écrit `captures/geste-e5.json` (0 erreur). La v0 (`../e5`) n'est pas modifiée. Les
retouches scriptées sont dans `captures/travail/` (retouche2 à 4, avec la copie du générateur avant chacune).

Question : « Quand ajouter Idaho 7 ? ». Seul le moment est libre : le curseur des 16 postes, plus les jours de contact
au bout de la frise. Fixés dans le contexte : Idaho 7 (α 12,7 %, fiches 9,5–14,9, mixte, en stock), 4 g/L, US-05,
Stout 16D.

## Passe 2

Chaque greffe reçue (tri/SYNTHESE.md, « Greffes ») :
- **Dock-profil** (e1) : chaque colonne de la frise porte sa hauteur de floral ; dessous, l'orangé dit « trop amer ».
- **Loupe des moments voisins** (a1, b1) : sous le doigt, les cinq voisins à 58 px le pas, contre 13,6 px sur la frise
  (×4,3) ; chacun porte son nom (60′, 55′…) et son floral (≈+4…).
- **« trop amer » en orangé sur l'IBU** (a8) : sur la colonne touchée, sur la jauge et dans la réponse.
- **Le jury sur 15, en ronds creux puis pleins** (c6) : à l'après, 3 ronds gris (sans houblon) et 8 violets (8,1),
  sur 15. Lafontaine 2018, Cascade 3,86 g/L.
- **« le CO₂ emporte ~−6 résineux »** (d1, d2) : à l'actif, la ligne « CO₂ et levure : ~−6 résineux » est calculée
  (résineux de l'actif moins celui de l'après, mêmes jours). Le chiffre dépend d'une convention du moteur (le
  myrcène retrouvé à l'actif vaut la moitié de l'après, H33, perte non chiffrée), dite derrière le « ? ».
- **« le meilleur : actif · 2 j »** (g4, g1) : un bouton qui apparaît dès qu'on s'écarte du meilleur moment et qui
  y ramène.
- **Hachure « IBU à cru ? »** (g1) : sous les colonnes de l'actif et de l'après, et dans la jauge (« ≈60 IBU +? »).
- **« 1 j sans gain » hachuré** (e2) : au bout de la frise, les jours 3, 5 et 7 sont hachurés, car le simulé sature
  dès 2 j.
- **Le texte de la levure suit le moment** (g1, g4), calculé avant d'être dessiné (M07) : à l'actif « Pomona agrumes
  ~+13 » (13,9 → 26,9) ; ailleurs « rien ne change ici » (Pomona et US-05 donnent le même centre).
- **La mesure suit le moment** (c7, d1, et c5 pour « jamais mesuré ») :
  - ébullition : Sharp 2014, « cuit, herbacé » au panel ;
  - whirlpool : « jamais mesuré » sur fond hachuré ;
  - actif : McCabe 2023, Idaho 7 au levurage, linalol 38 µg/L, à vérifier ;
  - après : le jury de Lafontaine 2018.

Retouches du critique :
1. **α du lot puis plage des fiches** (D87) : « α 12,7 % 9,5–14,9 mixte ».
2. **Les 12 barres l5b à un toucher, sous la frise** : le bouton « 12 familles › » ouvre les barres de la carte pour le
   moment touché, face à la zone 16D, avec Pépins et Melon hachurés. « Face à ta stout » reste en tête.
3. **Loupe ×3 sous le doigt et pas de 5′ lisible** : loupe ×4,3 ; 13 colonnes d'ébullition de 60′ à 0′, une graduation
   tous les 5′, plus longue à 60′, 30′ et 10′. Le contrôle des acquis joue le pas au clavier : 60′, 55′, 50′…

Retouches communes : une seule unité, les points (~+22) ; 76 mots au premier écran (95 avant retouche) ; le meilleur et
le piège nommés (bouton du meilleur, « trop amer ») ; la levure en dernière étape (forme de la v0), son texte suivant
le moment ; les conventions derrière le « ? » (interpolation de 55′ à 15′, 5′ et 0′, IBU du whirlpool estimée, CO₂).

Mots : les séparateurs « · » et « : » et les flèches « › » sont dessinés en CSS, et non écrits comme des mots. La
réponse dit l'amertume seulement quand elle est trop forte : la jauge, juste dessous, la donne toujours.

Sorties décisives (rejouées après la dernière retouche, `captures/travail/gates.txt`) :
- `controle-commun --sans=mots` : COMMUN OK ;
- `mots-premier-ecran --max=80` : 76 mots, MOTS OK ;
- D98 `controle-une-question --edition` : UNE-QUESTION OK (1 groupe libre : moment), 2 contrôles (le moment, les jours) ;
- D99 `controle-acquis --outil=dryhopper` : ACQUIS OK (4/4 : geste, frise, valeurs, levure), tous au repos ;
- `verifier-page` : PAGE OK (390 px, sans erreur).

Geste joué (`captures/geste-e5.json`) :
- au départ : actif · 2 j, « Face à ta stout : floral ~+22 · résineux ~+14 », ≈60 IBU +? ;
- doigt glissé vers la gauche : 50′, « floral ≈+4 · trop amer », trop amer ≈157 IBU, mesure Sharp 2014 ;
- touché au bout des jours : actif · 7 j ;
- après · 3 j : floral ~+23, résineux ~+20, végétal ~+10, le jury de Lafontaine.

Captures ouvertes :
- `captures/e5-premier-ecran.png` (au repos) ;
- `captures/e5-390.png` (page entière) ;
- `captures/e5-toucher-390.png` (doigt posé à 50′, loupe ouverte) ;
- `captures/e5-apres-390.png` (le jury) ;
- `captures/e5-leve-390.png` et `captures/e5-familles-390.png` (le panneau des 12 familles).

## Baseline

Reprise (plancher à enrichir) :
- **y1b** :
  - le moment glissé par tranches de 5′ ;
  - « Face à ta stout » en une ligne ;
  - la jauge d'amertume de la stout (base Nugget 60, zone 16D 50–70, l'ajout en orangé s'il est trop amer, hachuré à
    cru) ;
  - le dock sous le pouce : la frise est le curseur, au bas de l'écran, avec la loupe.
- **x3b réduit, en fin de frise** : les jours de contact au bout, 1 à 7 j, hachurés au-delà de 2 j.
- **La levure en dernière étape**, comme dans la v0 : « 2 Levure › », placée après toutes les étapes, avec l'effet de
  Pomona quand il existe.
- **Les acquis** :
  - code couleur des arômes ; barres l5b à un toucher ;
  - au style par défaut et absolu, la zone du style toujours visible (bande rose de la frise, zone grise des barres) ;
  - pictos au trait de la planche standard, dont « épicé » cannelle et clou croisés (choisi le 23.10) ;
  - α du lot puis plage des fiches, rôle en mot (« mixte »), stock en icône ;
  - légende derrière le « ? » ;
  - appui long ou survol long sur Idaho 7 : la fiche (silhouette, α, arômes sourcés 1/1, geste « Goûter dans ma
    stout ») ;
  - honnêteté : « ~ » simulé, « ≈ » interpolé ou estimé et pâli, hachuré pour l'inconnu, « IBU à cru ? », une mesure
    sourcée par moment, « jamais mesuré » au whirlpool.

Écarts, chacun avec sa raison :
- **Les 12 barres l5b ne sont pas au premier plan** : elles s'ouvrent à un toucher, comme le demandait le critique, car
  la frise gagner/payer est la réponse. Au repos, elles feraient passer l'écran à plus de 100 mots.
- **Pas de radar m4/h4** : l'outil répond au moment, pas à la silhouette. Le radar reste dans la fiche.
- **a2b n'est pas dans Dryhopper** : la levure est fixée (D98). Son effet est dit dans l'étape 2 (« Pomona agrumes
  ~+13 » à l'actif, calculé).
- **« second houblon puis » de y1b est absent** : un seul facteur libre.
- **Le dock n'est pas fixé à l'écran** comme celui de y1b : la frise occupe le bas du premier écran, sous le pouce, et
  la page tient sans défiler (fin du contenu à 81 % de la hauteur).
- **Pas de bouton d'édition dans le contexte** (D98 b, admis) : la dose et la levure restent fixées pour cette question.
