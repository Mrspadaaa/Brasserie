# CAL-FRISE-PRIX : le cadre de période de la courbe, joué au doigt (21.11)

Plainte du brasseur (21.11, 17:26) : « l'action du temps sur le graph des prix fonctionne extrêmement mal ».

## Méthode

Il n'y avait ni Claude in Chrome (extension déconnectée) ni la session Google dans le navigateur intégré. Le jeu s'est donc fait sur un banc local.

- **Build** : le tag `en-ligne/2026-11-21-tour8` (5fb61c580), copié par `git worktree add --detach` dans `%TEMP%/tour8-src` et construit avec `scripts/parcours/vite.parcours.config.mjs`.
- **Données** : la fixture « ZZ TEST » `scripts/parcours/fixtures/calendrier.mjs`, avec la courbe et un solde de départ négatif.
- **Gestes** : Chrome sans écran, 390×844 tactile, `Input.dispatchTouchEvent`, pas de 16 ms ; l'état est relevé à chaque pas.
- **Fichiers** : script `frise-prix.mjs`, trace complète `trace.txt`, captures dans `captures/`, en 2× et regardées.

Au départ, la fenêtre va de S44 à S49 (« Nov. »). Le cadre occupe 68 à 322 px d'une courbe qui va de 12 à 378 px. La prise du début couvre 34 à 78 px, celle de la fin 312 à 356 px.

## Combien et quels problèmes ? 8

1. **Le cadre ne suit pas le doigt quand on le glisse** (G). Le doigt tient la poignée de début et avance de 60 px vers la droite. Le cadre reste fixe à 68–322 px à chaque pas, et la courbe défile dessous en sens inverse : « Emballage −45 » recule d'environ 40 px. Seule l'étiquette change, de S44–S49 à S45–S50. Captures `00-depart`, `g1-glisser-droite-pendant`.
2. **Étirer la fin : le bord saute et recule alors que le doigt avance** (G). Le doigt va de 341 à 370 px, par pas de 2 px. Le bord droit du cadre passe par 318 → 357,6 → 341,5 → 375 → 371,5 px : un cran d'une semaine, environ 40 px, puis il recule pendant que l'échelle se resserre. Capture `g3-fin-etirer-pendant`.
3. **Raccourcir la fin : le bord saute en avance du doigt** (D). Doigt à 318 px, bord à 290,3 px ; doigt à 284 px, bord à 258,5 px. Le bord bouge par semaine entière, sans rien suivre entre deux crans. Capture `g4-fin-raccourcir-pendant`.
4. **La poignée de début n'étire pas** (G). Tirée vers la gauche, elle déplace toute la fenêtre : S39–S44 devient S35–S40, toujours 6 semaines. Seule la fin change la durée, et rien ne le dit. Capture `g5-debut-vers-gauche-apres`.
5. **L'échelle change à chaque lâcher** (D). La vue se recale, et le cadre revient à 68–322 px quelle que soit la durée. À 5 semaines comme à 6 mois (26 semaines dans 254 px), ce que le doigt vient de poser part ailleurs. Capture `g9-avancer-fin-au-bord-apres`.
6. **Retard : la frise ne suit pas le geste** (D). Pendant le geste, les semaines sous la courbe (S44 … S49), les lignes et « confirmé S44–S49 » restent sur l'ancienne fenêtre jusqu'au lâcher. Exemple : l'étiquette dit S45–S50, la frise dit encore S44–S49. Capture `g1-glisser-droite-pendant`.
7. **Au bord, le défilement est trop rapide et le lâcher pose plus que ce qu'on a lu** (D).
   - Reculer, doigt tenu à 6 px : S33 → S19 en 1,25 s, environ 11 semaines par seconde. L'étiquette lue est S19–S23, le lâcher pose S18–S22.
   - Avancer, fin tenue au bord : de 5 semaines à 6 mois en 1,5 s. L'étiquette lue est S18–S41, le lâcher pose S18–S43.
   - Même saut d'une semaine quand le doigt s'arrête dans la bande du bord (g2 : S40–S45 lu, S39–S44 posé ; g5 : S36–S41 lu, S35–S40 posé).
   - Capture `g8-reculer-au-bord-pendant`.
8. **Le bandeau de synchronisation pousse la vue** (G). « Enregistrement sur le serveur… » (`src/ui/PersistenceStatus.tsx`, monté dans le flux en haut de `App.tsx:1249`, ni fixe ni superposé) pousse tout l'écran vers le bas dès qu'une écriture part. Avec « Actualiser » (`min-h-touch`), le décalage atteint 66 px selon le relevé du brasseur. Une fenêtre posée écrit la période, donc la courbe descend sous le doigt juste après le geste. Il n'est pas reproductible en local (dev-local n'a pas de serveur) : constat tiré du code et du relevé en ligne, à rejouer en ligne.

## Vérifiés justes

- Mauvais bord : un doigt posé 2 px dans le cadre près de chaque bord prend la bonne poignée (g6 début, g7 fin).
- Rechargement : la fenêtre S18–S43 et « 6 mois » tiennent.
- Aucune erreur de page.

## Doute (non compté)

- « −6 925 CHF à dépenser S43 ’27 » en tête de la courbe, alors que la fenêtre est S44–S49 2026. Le chiffre porte sur une semaine de l'an prochain, sans lien visible avec le cadre. À confirmer avec le brasseur : est-ce le point le plus bas de l'horizon ?

## Non rejoué

- Le vrai téléphone et le toucher réel du brasseur.
- Le thème sombre et le 1280.
- Les données réelles (le banc était local).
