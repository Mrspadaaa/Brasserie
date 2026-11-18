# Pastille « 24 » contre « 5 à commander » (Stocks, ST8 et Q21) : 3 mini maquettes, 16.11

Base : la vue `s-stk-repos` (sous-onglets, chiffre clé du calendrier fb, ligne « ensuite ») et la barre du bas b1r.
Les données sont des exemples : 24 articles, dont 5 avant S49, 6 datés de S50 à S52 et 13 au seuil sans brassin.
Chaque `proto.html` se joue seul. Le bouton « Voir l'état vide » montre l'état vide.
Les états se rejouent avec `?etat=repos|geste|vide` et `&theme=cave`.
Commande : `node build.mjs`, puis `node capt.mjs . repos,geste,vide v1 v2 v3`. Sortie : CAPTURES OK, aucune police sous 14 px.

- **v1 · Un seul chiffre** : la pastille passe de 24 à 5, en bleu comme le chiffre clé, et compte la même chose : ce qui manque à un brassin avant S49. Les 19 autres sont repliés dans une rangée ambre « 19 au seuil, pas pressés ». Geste : un toucher la déplie. Captures : `v1/v1-repos-390.png`, `v1/v1-geste-390.png`, `v1/v1-vide-390.png`.
- **v2 · Vingt-quatre cases** : la pastille 24 ne change pas (ST8 « inchangée »). Sous le 5, une barre de 24 cases montre 5 cases bleues et 19 ambre, avec « même total que la pastille (24) ». Geste : toucher une part filtre la liste et la commande. Captures : `v2/v2-repos-390.png`, `v2/v2-geste-390.png`, `v2/v2-vide-390.png`.
- **v3 · Un horizon commun** : un réglage « S49 · 6 sem. · Tout » s'applique au chiffre clé et à la pastille à la fois (5, 11 ou 24). Un histogramme par semaine encadre la période comptée. Geste : toucher « Tout » fait passer les deux chiffres à 24. Captures : `v3/v3-repos-390.png`, `v3/v3-geste-390.png` (`-cave-` pour le thème sombre), `v3/v3-vide-390.png`.

Défauts connus, non bloquants pour un choix :
- le bouton + flottant (repris de la base) passe sur les quantités quand la liste défile ;
- à l'état vide de v1, « 0 rien ne presse » et « Rien à commander » se répètent.
