# Générateur de la version consolidée de l'étape Houblons (base de p2, 18.10)

- **Construire** : `node build.mjs` réécrit les 10 pages de `ecran-1/base/consolide/` depuis le pack (`prototypes/houblons-v4/data/pack-mini-protos.json` et `pack-fiches.json`) ; une seule page : `node build.mjs index.html --out=<dossier>`.
- **Assemblage** : `build.mjs` fabrique `D` par scénario (`VUES` : page → scénario, partie, lentille, direction, échelle) et l'injecte dans `page.html` avec `commun.js`, `etape-consolide.js` et `etape-consolide.css`.
- **Rail et glisser (D27, D28)** : `etape-consolide.js` ; ordre `ETAPES` (moments du pack, levure entre whirlpool et dry hop actif), carte `blocRail`, poignée `brancherGlisser` (Pointer Events), aperçu en direct `apercuGlisse`.
- **Moments** : `MOMENTS` dans `commun.js` (code du pack, type, libellé, crans sans libellé) ; IBU d'une ligne : `ibuLigne` / `ibuEl` (pack : `ibuParMoment`, « aucun IBU » à froid).
- **Carte de houblon (D29, D23 ter)** : `rapideLigne` (α `alphaEl`, rôle `roleEl`, arômes `miniProfil` = `data-role="aromes"`, stock `stockIcone` / `data-stock`) ; recette vide : `rapides.construction` (amérisants « ou », aromatiques) dans `build.mjs`.
- **Ma bière, détail (D31, D32)** : `partieBiere`, `ligneFamille`, `viserAbs`, `posPiste` dans `commun.js` (échelle du style ou absolue 0–3, `D.continu`, écart « ×2,8 », gestes `data-action`) ; radar : classe `Biere`.
- **Suggestions et Comparer** : `partieSuggestions`, `partieComparer` (inchangés, lot à venir) ; radar générique `radar()`, rangées `rangeesSeries()`.
- **Focus (D33)** : `rendre()` ne replace le focus qu'après une action au clavier ; le champ montre son focus par sa bordure.
- **Vérifier** : `node vite.mjs [page…]` (mesures rapides, captures dans `shots/`), `node glisser.mjs` et `node gestes-biere.mjs` (captures dans `base/captures/`), puis `controle-lot.mjs … --recette --rail --detail --palette` (seul juge).
- **Aucun chiffre inventé** : sommes d'IBU, dose × IBU par gramme et rapports d'écart viennent des champs du pack.
