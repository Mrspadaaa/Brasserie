# psb — la ligne des sources (tiède)

**Chaleur : tiède.** Forme imposée par VOIE.md : la pastille ouvre la ligne des sources. Un toucher sur « ~ simulé ⌄ »
déplie, sous la pastille, une ligne rangée comme le tableau de r6a : une colonne par houblon, aux mêmes x que les têtes.

## Base
Comparer de r6a rendu par la reprise r5, copié tel quel (`../assets/`). Seul ajout : `psb.js`, `psb.css` (classes `psb-`,
fonction immédiate, L26). Au repos : un seul signe ajouté, le chevron ⌄ dans la pastille (aucun mot ; 95 mots comme r5).
C'est l'écart à r5 : le chevron dit « ça se déplie » sans écrire ; à retirer si la pastille doit rester nue.

## Au toucher
- **~ calculé :** fiches · 4 g/L · dry hop, 3 j · US-05 (dose et levure lues dans la ligne de contexte).
- Puis, houblon par houblon (couleur de chaque houblon en haut de sa colonne, comme les têtes) :
  - **fiches** : le nombre de sources derrière le calcul : Cascade 8, Idaho 7 4, Galaxy 3. Compté dans la feuille
    « Vraies valeurs et chimie » de la même page (sources distinctes de α, β, huile, composés, 4MMP ; H3-71 est une ligne de
    H3 ou H27 selon `composes-houblon.json`, comptée avec elles).
  - **mesuré, en bière** — **linalol** : Cascade 57 µg/L (H12, à 2 g/L), Idaho 7 38 µg/L (E03, à confirmer), Galaxy :
    hachuré « rien ». **panel** : Cascade « OSU › » (H22), les autres hachurés « rien ».
  - Un houblon ajouté par « + » sans donnée connue ici prend un « ? » hachuré, jamais un zéro.
- Chaque mesure est une porte : le linalol ouvre Valeurs, « OSU › » ouvre Preuve ; **Vraies valeurs ›** ouvre Valeurs
  (`captures/psb-suite.png`).
- La ligne pousse le radar, elle ne le couvre pas. Refermer : la pastille (⌃) ou Échap (pris en capture : l'écran ne
  recule plus).

## Ce qui tient
- Il voit d'un coup ce qui est calculé et ce qui est mesuré, et pour qui : Galaxy n'a rien de mesuré, et ça se voit.
- Le nombre de fiches dit la solidité du simulé, colonne par colonne, aux mêmes places que le tableau.
- Honnêteté : « à confirmer », « à 2 g/L », l'inconnu hachuré.

## Ce qui casse
- Le plus de mots des trois au toucher (≈ 35), et le radar descend de 300 px tant que la ligne est ouverte.
- Les nombres (fiches, linalol) sont relevés de la feuille Valeurs, pas recalculés : dans l'app, ils viendraient de
  `valeurs.ts`.

## Contrôles (24.10)
- `controle-commun.mjs … psa psb psc --page=etat.html --sans=mots` : **COMMUN OK** (les onze contrôles OK). `--sans=mots`
  vient de GATES : r5 compte déjà 95 mots au premier écran ; psb en compte 95.
- `capturer.mjs psb` : repos `false` → toucher `true` ; Échap → `false` (avant correction, Échap faisait reculer vers
  Suggérer : corrigé) ; le pont ouvre « Vraies valeurs et chimie » ; aucune erreur de page.
- `controle-panel.mjs` : PANEL ECHEC (ressemblance 0,96), attendu : trois copies de la même page par contrat.
- `controle-choix.mjs --ecran=comparer` : voir RESULTAT.md de la voie.

Captures : `../captures/psb-repos.png`, `../captures/psb-toucher.png`, `../captures/psb-suite.png`.
