# psc — le radar aux rayons X (chaude)

**Chaleur : chaude.** Forme libre : la pastille ne s'explique pas, elle montre. Un toucher sur « ~ simulé » passe le radar
aux rayons X : le radar pâlit, et ce qui le fabrique apparaît par-dessus.

## Base
Comparer de r6a rendu par la reprise r5, copié tel quel (`../assets/`). Seul ajout : `psc.js`, `psc.css` (classes `psc-`,
fonction immédiate, L26). Au repos, rien ne change (95 mots, comme r5).

## Au toucher
- Le radar pâlit à 42 %, en couleur (le simulé reste lisible) ; la pastille devient pleine.
- Aux quatre coins du radar, quatre jetons : **fiches**, **= 4 g/L**, **dry hop, 3 j**, **US-05** (dose et levure lues dans
  la ligne de contexte). Un flux pointillé coule de chacun vers le centre, où un rond noir « ~ » attend, immobile : **le moteur
  calcule**. Le flux coule une fois, puis s'arrête. Au pied du radar, dans sa zone : hachuré « pas mesuré en bière », puis
  la pastille noire « le mesuré » avec les pictos de Valeurs et Preuve et une flèche vers le bas.
- Dans le dock, **Valeurs** et **Preuve** sont cerclés : c'est là que vivent les vraies valeurs (fiches sourcées, linalol en bière, panel OSU). Les toucher ouvre leur feuille (`captures/psc-suite.png`).
- Un toucher n'importe où rend le radar ; Échap aussi (pris en capture : l'écran ne recule pas). Mouvement coupé si le
  téléphone demande moins d'animations.

## Ce qui tient
- Se comprend sans lire : les ingrédients entrent, le moteur sort le radar. « Simulé » devient une image, pas une phrase.
- 10 mots au toucher, le moins des trois.
- Le chemin vers le mesuré passe par le dock qu'il connaît déjà : rien de nouveau à apprendre.

## Ce qui casse
- Ne dit pas ce qui est mesuré ni pour quel houblon (Galaxy : rien) : il faut toucher Valeurs ou Preuve.
- Le radar à 42 % reste derrière les jetons : on lit le simulé, moins bien qu'au repos.

## Passe 2 (24.10, critique : REJET)
- Défaut : l'étiquette flottante « le mesuré ↓ » couvrait « ~1,3 » d'Idaho 7 dans la rangée « dry hop ». Elle est retirée. « Le
  mesuré » vit au pied du radar (le calque s'arrête à y 443,8, le tableau commence à 451,8 : rien sur le tableau), et
  le dock garde le seul cerclage.
- Le radar passe de 16 % en gris à 42 % en couleur. Le battement du « ~ » est coupé, et le flux ne boucle plus.

## Contrôles (24.10)
- `controle-commun.mjs … psa psb psc --page=etat.html --sans=mots` : **COMMUN OK** (les onze contrôles OK). `--sans=mots`
  vient de GATES : r5 compte déjà 95 mots au premier écran ; psc en compte 95.
- `capturer.mjs psc` : repos `false` → toucher `true` ; Échap → `false` ; Valeurs touché ouvre « Vraies valeurs et
  chimie » ; aucune erreur de page.
- `controle-panel.mjs` : PANEL ECHEC (ressemblance 0,96), attendu : trois copies de la même page par contrat.
- `controle-choix.mjs --ecran=comparer` (copie dans os.tmpdir, NOTE de r5) : CHOIX OK, rejoué après la passe 2.

Captures : `../captures/psc-repos.png`, `../captures/psc-toucher.png`, `../captures/psc-suite.png`.
