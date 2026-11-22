# Recontrôle 1 : as/cal.html et cal-paysage.html (17.11)

Critique calibré (portrait v2). Les 19 points de CRITIQUE.md ont été rejoués au doigt (puppeteer-core, `Input.dispatchTouchEvent`), en 390 × 844 tactile et en 844 × 390, thème clair, plus 2 captures en cave. Script : copie de `src/jouer.mjs` vers `cap/recontrole1/`. 0 erreur de page sur les 19 parcours.
J'ai ouvert les 56 captures de `cap/recontrole1/`, puis 4 zooms à 3× (`z-*.png`). Je les ai comparées côte à côte avec page14/img (c5-b, f5-b, c3-a).
Comme demandé, COMPACT, G3 et G5 ne sont pas jugés. Un défaut que la base `se/z2s.html` montre aussi n'est pas compté : c'est le cas de la pose F3, dont les cases pointillées chevauchent « Fêtes » (`z-f3-se.png`, identique).

## Les 19 points, rejoués

| # | Verdict | Ce que je vois |
|---|---|---|
| 1 | corrigé | f1-a pendant : la tête « 113 · S24 » reste, avec l'axe 4 000 / 5 000, « −540 » en rouge et S51 en pointillé. L'étiquette « S51 · 14 déc. · lâcher ici » est sous le doigt (p, l). |
| 2 | corrigé | La courbe zoomée est calée sur les colonnes : 6 en portrait, 13 en paysage. S51 éclairé au même x. |
| 3 | corrigé | « si tu lâches en S51 : 5 064 → 4 524 » est dans la légende, hors du tracé. |
| 4 | corrigé | f4-b : « 15 déc. → 11 janv. · Prête 18 janv. », identique dans les deux sens. |
| 5 | corrigé | c3-a : S24, Ventes +128, la semaine −192, en portrait comme en paysage. |
| 6 | corrigé | c3-a portrait : une seule courbe. La tête « 113 CHF à dépenser · S24 » reste seule au-dessus. |
| 7 | corrigé | f5-a Retirer : « −1 067 CHF · S24 » en rouge. ±, 6 sem., ⏲2 et ⛶ restent dans l'écran. |
| 8 | corrigé | Après Retirer, « Hotte −900 » et « Frigo −1 800 » sont nets. |
| 9 | corrigé | f5-a paysage : le menu s'ouvre sous la barre Marché de Noël, la pointe sur la barre. |
| 10 | corrigé | f5-a portrait : le menu est ancré à x 89 et laisse visibles les + et les noms, comme f5-b. |
| 11 | partiel | Les noms d'événements sont sur fond. Les noms de rangées restent barrés par les traits de mois : le « s » final de « Brassins » (`z-c1d-noms-haut.png`). |
| 12 | corrigé | Barres fines, plusieurs par ligne quand il y a la place, montant seul faute de place, comme c5-b. Ventes au-dessus du pli. |
| 13 | partiel | La bulle ne couvre plus le point cerclé. Le reste est détaillé plus bas. |
| 14 | corrigé | f6-b : fantôme hachuré à S47 pendant et après, retiré par Livrer. |
| 15 | corrigé | f4-b : icônes houblon, cuve et fût sur les étapes, trait pointillé de la barre au panneau. |
| 16 | corrigé | f2-a : « Livrer le 22 déc. » et « Annuler » côte à côte ; l'alerte fait 121 px. |
| 17 | corrigé | « 15 déc. → 11 janv. » |
| 18 | corrigé | f1-a paysage : plus de lettres barrées ; le nom a un fond. |
| 19 | corrigé | c3-a paysage : l'axe va de « déc. » à « oct. », sans mois coupé. |

Sens métier : rien d'absurde.
- Retirer le Marché de Noël (+1 180) fait passer le creux de 113 à −1 067 (113 − 1 180).
- Décaler la Blonde de S47 à S48 donne « S47 4 032 → 4 180, la suite inchangée » (+148).
- Blonde à 35 j : du 16 nov. au 21 déc.
- Porter : 5 semaines, du 14 déc. au 18 janv.

## Restes (encore vrais)
- **13** c2-b : en portrait, le trait du curseur barre « Embouteil|leuse ». L'anneau du point mange le « −900 » de Hotte (« −90( »). La bulle couvre « S47 – S52 », « 1 140 mis de côté » et « Six fûts inox −1 080 ». En paysage, le curseur barre « Six fûts inox » et la bulle cache « Embouteilleuse −2 800 » et le « +1 » de « Mariage +1 100 ».
- **11** c1-d année : les traits de mois barrent encore les noms de rangées, notamment le « s » de « Brassins ». Les noms d'événements, eux, sont propres.

## Nouveaux problèmes, les plus graves d'abord
1. **c1-d année portrait, une barre a disparu (bloquant)** : « Marché de printemps +910 — » pointe vers le vide. Aucune barre au bout du trait ; elle est cachée sous l'étiquette blanche, ou absente (`z-c1d-fetes.png`). On ne sait pas quand tombe le marché.
2. **c2-b, écart à sa maquette** : après le lâcher, « 6 sem. » / « 3 mois », ⏲2, ⛶ et ± disparaissent, tant qu'on ne touche pas ailleurs (mesuré : `visibility: hidden`). Dans c3-a, ⏲2 et ⛶ restent visibles pendant la lecture.
3. **f5-a, écart à f5-b** : le menu ajoute des sous-titres absents de sa maquette (« visible, rangée masquée », « sur la courbe », « 6 rangées masquées », « un trait les relie »). Il est donc plus haut : 274 px contre 220 dans f5-b. « Dupliquer en S51 » perd la durée : « +1 180 » au lieu de « +1 180 · 2 j ».
4. **f6-b après** : dans la Blonde décalée, la piste des étapes est réduite à un court tronçon collé à gauche, alors que la barre couvre 4 semaines. Le texte « dès 23 nov. · prête 21 déc. » prend la place. Dans f2-a, la piste reste entière.
5. **f6-b pendant, portrait** : l'étiquette « S48 · 23 nov. · lâcher ici » couvre le nom « Porter d'hiver », dont on ne voit plus que « −176 ».

## Doutes, non comptés
- f4-b : le + volant chevauche « −540 » du malt en portrait (« −54( ») et le coin du panneau en paysage. Le bouton flotte comme dans la base.
- f1-a paysage pendant : le fantôme est presque entièrement couvert par la barre glissée, qui dure 3 semaines. Seuls ses bords pointillés dépassent.

## Phrase prédite
« Là c'est bon : je vois où je lâche et le Porter a les mêmes dates dans les deux sens. Mais il manque la barre du Marché de printemps sur l'année, et quand je lis la courbe mes boutons du haut disparaissent. »

Note : 7,5 / 10
