# Générateur de la version consolidée de l'étape Houblons (base de p2, 18.10)

- **Construire** : `node build.mjs` réécrit les 11 pages de `ecran-1/base/consolide/` depuis le pack (`pack-mini-protos.json`, `pack-fiches.json`) ; une seule page : `node build.mjs index.html --out=<dossier>` ; une variante de recette (S1E120) hérite de sa recette de base (S1).
- **Assemblage** : `build.mjs` fabrique `D` par scénario (`VUES` : page → scénario, partie, lentille, direction, échelle ; `tablesDe` : tables d'IBU du houblon à sa dose) et l'injecte dans `page.html` avec `commun.js`, `etape-consolide.js` et `etape-consolide.css`.
- **Durée d'ébullition et moments (D36, D37)** : `EBU`, `construireMoments`, `changerEbu`, `momentBorne`, `mom`, `quand`, `quandLong` dans `commun.js` ; rien n'est figé, 5 à 240′ par 5.
- **IBU (pack, tablesIbu)** : `ibuLigne` (ébullition par 5′, premier moût selon la durée, whirlpool °C × min, dose / dose de la table) et `ibuEl` (« aucun IBU » à froid, « IBU à recalculer » sans table).
- **Rail et glisser (D27, D34, D35)** : `etape-consolide.js` ; `repere` (graduation `data-etape`), `blocRail` (carte), `brancherGlisser` (Pointer Events ; la carte change d'`order` CSS sans quitter le document), `apercuGlisse`, `reglagesMoment` (whirlpool, jour de dry hop), réglage de durée en tête du rail.
- **Carte de houblon (D29, D23 ter)** : `rapideLigne`, `alphaEl`, `roleEl`, `miniProfil` (`data-role="aromes"`), `stockIcone` ; recette vide : `rapides.construction` dans `build.mjs`.
- **Ma bière (D31–D33)** : `partieBiere`, `ligneFamille`, `viserAbs`, `posPiste` ; radar : classe `Biere` ; Suggestions, Comparer : `partieSuggestions`, `partieComparer`, `radar()` (inchangés).
- **Focus (D33)** : `rendre()` ne replace le focus qu'après une action au clavier.
- **Vérifier** : `node vite.mjs [page…]` (mesures rapides) ; `node glisser.mjs` (geste à 60′ et 120′), `node ebullition.mjs` (200′ puis 45′), `node gestes-biere.mjs` : captures dans `base/captures/` ; puis `controle-lot.mjs … --recette --rail --detail --palette` (seul juge).
- **Aucun chiffre inventé** : la page lit les tables du pack et ne fait que des sommes, des mises à l'échelle de dose et le rapport d'écart.
