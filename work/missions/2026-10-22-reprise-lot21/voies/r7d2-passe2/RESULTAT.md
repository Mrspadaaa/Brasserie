OK — d8b, ruban de la stout : hachuré nommé, 12 barres au toucher, jours en bout de frise

## Fichiers écrits (Possède)
`work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe2/` :
- `d8/etat.html` ;
- `generer.mjs` et `socle.mjs` (données de la v0, pictos de la planche standard, stock, lot dans la fiche) ;
- `captures.mjs` ;
- `NOTE.md` ;
- `captures/` : 7 PNG, plus `geste-d8.json` ; `captures/travail/` : copies du générateur et scripts de
  retouche.

La v0 n'est pas touchée. Rien à la racine : `pistes-l5f.png` était déjà là.

## Ce qui a changé depuis la v0
- **Retouches du critique** :
  1. la part emportée est nommée (« emporté par la chaleur / par le CO₂ ») et dessinée famille par famille, à
     sa vraie longueur (centre à froid − centre au moment) ;
  2. stock en icône ajouté (α du lot et plage déjà là) ;
  3. un toucher sur un segment ouvre les 12 barres l5b, celle touchée en avant.
- **Greffes** :
  - « contre après », barres divergentes (g8), au repos sous les mini-rubans ;
  - allure de la levure sur le segment « actif » du rail (f5/g6) ;
  - chaîne « Ma bière → + Idaho 7 → Levure › » avec la levure en dernière étape, dont le texte suit le moment
    (b2) ;
  - « à cru, IBU ? » hachuré sur la jauge et sur une ligne d'IBU sous chaque étape (g1) ;
  - sauts 60′ / WP / actif / après et loupe ×3,2 (a1/b1) ;
  - jours au-delà de 2 j hachurés, « sans gain » (e2) ;
  - teneur du lot ID7-2573 dans la fiche (d5).
- **Dock refait** : rail par 5′ sur 14 crans, puis la frise, puis les jours 1 j à 7 j en bout (x3b réduit).
- **Retouches communes et passe 2** :
  - 77 mots ;
  - premier écran rempli jusqu'au dock ;
  - meilleur moment et piège nommés ;
  - conventions derrière le « ? » ;
  - picto « épicé » = cannelle et clou croisés de la planche standard (les 12 symboles en viennent).

## Sorties décisives
- G1 : `COMMUN OK`
- G2 : `d8 77 mots` · `MOTS OK`
- G3 : `UNE-QUESTION OK (1 groupe libre : moment)` (`--edition` ; 10 contrôles, tous du moment)
- G4 : `ACQUIS OK (4/4 : geste, frise, valeurs, levure)` (les quatre au repos)
- G5 : `PAGE OK (0 images chargées, 390 px, sans erreur)`
- Geste : de actif · 3 j à 45′, floral ~+22,1 → ~+5,4, IBU à cru → ≈ 150 ; 0 erreur ; largeur 390 dans les
  trois états.

## Captures ouvertes
Dans `serie-d/passe2/captures/` : d8-premier-ecran.png, d8-toucher-390.png, d8-60-390.png, d8-barres-390.png,
d8-absolu-390.png, d8-fiche-390.png et d8-390.png (page entière : elle tient dans un écran, identique au premier
écran).

## Prédiction
« Là on voit direct : à 60′ tout part en hachuré et c'est trop amer, en actif j'ai le floral et moins de
résineux, pas mal du tout. Mais les mini rubans et le contre après, ça fait un peu deux fois la même chose ? »

DÉCISION À PRENDRE : garder « contre après » au repos (comme ici), ou le remettre en bascule avec les
mini-rubans (moins de vide perdu, mais trois mots et un toucher de plus) ; c'est au brasseur de choisir sur
capture.

CONNAISSANCE : dans le moteur, « contre après » et « emporté » sont la même quantité au signe près (référence =
dry hop après, mêmes jours, US-05), sauf pour la levure. Une page qui montre les deux répète l'information ; seule
Pomona en actif les ferait différer.

LEÇON PROPOSÉE : sous Bash (Git Bash du poste), un script écrit par heredoc perd ses barres obliques inverses
(`<\/symbol>` devenu `</symbol>`, regex cassée). Le 23.10, une retouche du socle a échoué deux fois pour cette
raison. Faire : écrire tout code qui contient `\` avec l'outil Write ou Edit, jamais par heredoc Bash
([[poste-windows-msix]] le dit pour les commandes, pas pour les fichiers générés).
