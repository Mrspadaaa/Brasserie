# Générateur de p03 (baseline), copie de fils3-p02p03 au 18.10

- **Construire** : `node build.mjs` écrit p02 et p03 (9 pages) dans `ecran-1/fils3/` ; **une seule page** : `node build.mjs p03 index.html --out=<dossier>` (écrit `<dossier>/p03/index.html` ; sans `--out`, écrase `fils3`).
- **Assemblage** : `build.mjs` lit le pack (`prototypes/houblons-v4/data/pack-mini-protos.json`), fabrique `D` par scénario (S1, S4, S5 ; `VUES` dit quelle page prend quel scénario, partie, lentille, direction) et injecte dans `page.html` : CSS commun + `etape-pNN.css`, `const D`, `commun.js`, `etape-pNN.js`.
- **Étape** : `VARIANTE.etape(app)` dans `etape-p03.js` (lignes `lignePastille`, frise `frisette`, ajouts `rapidePastille`) ; pièces communes (`enTete`, `resume`, `levure`, `panLigne`, `apercu`, `bioEl`) dans `commun.js`.
- **Radar** : `radar(objet, series, o)` dans `commun.js` (svg `data-radar`, séries `data-serie` / `data-valeurs`) pour Suggestions et Comparer ; Ma bière est la classe `Biere` (même fichier, morphing Barres ↔ Radar, `P(i, v, t)`, `dessiner()`).
- **Bloc radar** : `data-composant="radar"` posé dans `partieBiere` (div `.bloc-lecture`), `partieSuggestions` et `partieComparer` (zones `.vue-voies`, `.vue-fiches`), seulement en lentille Radar ; rangées sous le radar : `rangeesSeries()`.
- **Nom d'un houblon** : toujours avec `data-houblon` (clé du pack via `cleDe(nom)`, table `D.cles` construite dans `build.mjs`) ; `nomsHoublons([...])` pour « A + B » ; lieux : `lignePastille` / `rapidePastille` (étape), `carteVoie`, `matriceVoies` (en-têtes svg), `enteteFiches`, `partieComparer` (candidats), `goutsLigne`, `partieBiere` (`.ctx-h`).
- **Barres** : `matriceVoies` (Suggestions, avant / après en crans), `matriceFiches` (Comparer, citations « N/M »).
- **Règles adaptatives** : nombre d'ajouts proposés selon le nombre de lignes, aperçu réduit si le modèle situe moins de 6 familles, citations seulement pour une famille au-dessus, stock discret (D23 : `stockEl`, `statutRapide`).
- **Vérifier** : `node vite.mjs p03 [page…]` (mesures rapides et captures dans `shots/`), puis `controle-lot.mjs` (seul juge).
- **Aucun chiffre calculé** hors sommes d'IBU et dose × IBU par gramme du pack ; les textes (phrases, voies, signaux) viennent du pack.
