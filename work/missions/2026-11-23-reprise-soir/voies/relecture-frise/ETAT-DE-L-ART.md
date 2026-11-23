# État de l'art — gestes de la frise (23.11.2026)

Problème type : glisser-déposer 1D d'un élément sur un axe temporel, pincer/zoomer, poignées de bord, auto-scroll. Données : registre npm, API GitHub (pushed_at), bundlephobia (gzip min), le 23.11.2026. Les dates npm viennent du registre ; la tactilité vient de la doc des paquets, non testée sur appareil.

| Bibliothèque | Licence | gzip | Dernière version (npm) | Dernier commit | Tactile | Rendu imposé | Remplacerait chez nous |
|---|---|---|---|---|---|---|---|
| @use-gesture/react 10.3.1 | MIT | ~8,9 ko | 2024-03-21 | 2024-07-15 (> 6 mois) | oui (pointer events, pinch, drag) | non (hook) | pointer events maison : drag, pinch |
| @dnd-kit/react 0.5.3 | MIT | ~33 ko | 2026-10-31 | 2026-10-31 | oui (PointerSensor, empêche le scroll au toucher) | non (hooks) | drag d'une barre, auto-scroll ; pas de pinch, 1D libre mal adapté (dépose sur cibles) |
| vis-timeline 8.5.6 | Apache-2.0 ou MIT | ~122 ko (+ ~77 Mo dépaquetés) | 2026-10-26 | 2026-11-23 | oui (hammerjs) | oui (DOM, CSS maison à écraser) | tout, mais notre dessin serait perdu |
| react-calendar-timeline 0.30.0-beta.4 | MIT | n.m. | 2025-10-29 (bêta) | 2026-11-18 | partiel | oui | tout, rendu imposé |
| gantt-task-react 0.3.9 | MIT | n.m. | 2022-07-10 | 2024-08-12, archivé | faible | oui | rien : abandonné |
| frappe-gantt 1.2.2 | MIT | n.m. | 2026-02-25 | 2026-06-18 | souris surtout | oui (SVG) | rien : rendu imposé |
| react-zoom-pan-pinch 4.4.0 | MIT | ~17,8 ko | 2026-11-19 | 2026-11-23 | oui (pinch, pan) | non, mais transforme un conteneur CSS | zoom : mauvais fit (zoom visuel, pas zoom d'échelle date ; texte et graduations flous ou étirés) |
| @visx/drag 4.0.0 | MIT | ~1,8 ko | 2026-06-11 | 2026-06-22 | oui (touch + mouse) | non | un hook de drag fin, ce que le code maison fait déjà |
| @visx/zoom 4.0.0 | MIT | n.m. | 2026-06-11 | 2026-06-22 | oui | non | zoom d'une matrice 2D, pas d'échelle de temps |
| Bryntum, DHTMLX Gantt (pour mémoire) | commerciale (DHTMLX a une édition GPL) | lourd | maintenus | — | oui | oui | tout, rendu imposé, licence payante |

n.m. = non mesuré. Les autres chiffres de poids sont bundlephobia, l'API ayant répondu seulement pour cinq paquets.

## Lecture

- Aucune bibliothèque ne fournit les poignées de période, le zoom de 3 semaines à 4 ans sur échelle de dates, le toucher de graduation et l'auto-scroll sans imposer leur rendu. Les complètes (vis-timeline, react-calendar-timeline, frappe-gantt, gantt-task-react, Bryntum, DHTMLX) imposent le dessin : exclues par la règle n° 1 du brasseur.
- @use-gesture est la seule qui couvre drag + pinch sans rendu. Mais elle n'est plus publiée depuis 03.2024 et son dépôt est inactif depuis 07.2024 : elle ne passe pas le critère « commit < 6 mois » (remède : hors critère, mais stable à 8,9 ko).
- @dnd-kit/react est maintenue (0.5.x, encore en pré-1.0, API mouvante) et gère le tactile et le scroll, mais son modèle est « glisser vers une cible » ; une barre qui change de date en continu n'y entre pas naturellement, et l'auto-scroll de la nouvelle version n'est pas documentée dans les sources trouvées.
- react-zoom-pan-pinch et @visx/zoom zooment une transformation visuelle, pas une échelle d3 de dates : incompatible avec nos graduations nettes et les paliers de 3 semaines à 4 ans.
- Le zoom d'échelle (d3-scale + d3-time) reste la méthode standard pour l'axe : c'est déjà la nôtre.

## Recommandation

Garder le maison. Aucune bibliothèque maintenue ne remplace le cœur (échelle de dates, poignées, cadrage par graduation, auto-scroll aux bords) sans imposer son rendu ou son modèle. Gain nul, coût réel : migration des gestes, nouvelle dépendance pré-1.0 (dnd-kit) ou non maintenue (use-gesture).

Seule option à garder en réserve : @use-gesture/react (~8,9 ko gzip) pour le pincer à deux doigts, si le pincer maison s'avère fragile en test sur téléphone. Le coût : un hook par geste, `touch-action: none` sur la frise, ré-écriture du pincer et vérification sur appareil. À ne faire que sur un défaut de pincer constaté, non par principe. Puis refaire cette étude si le dépôt reste inactif.

À corriger au besoin dans le maison sans bibliothèque : `touch-action`, `setPointerCapture`, `pointercancel`, et `requestAnimationFrame` pour l'auto-scroll.

## Sources

- https://registry.npmjs.org/ (versions, dates, licences, 23.11.2026)
- https://api.github.com/repos/pmndrs/use-gesture, clauderic/dnd-kit, visjs/vis-timeline, namespace-ee/react-calendar-timeline, MaTeMaTuK/gantt-task-react, frappe/gantt, BetterTyped/react-zoom-pan-pinch, airbnb/visx (pushed_at)
- https://bundlephobia.com/ (poids gzip)
- https://www.npmjs.com/package/@use-gesture/react
- https://github.com/clauderic/dnd-kit
- https://github.com/visjs/vis-timeline
