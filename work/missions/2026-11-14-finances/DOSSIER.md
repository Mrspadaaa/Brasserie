# Dossier de conception — filtre « du … au … » dans Opérations v6a (14.11)

Lu à la place des sources (D207). Mission : `work/missions/2026-11-14-finances/MISSION.md`.

## Ses mots (mot pour mot)
- 09.11, sur v5a : « Beaucoup mieux mais plus compact les lignes, mais quasiment parfait ».
- 10.11 : « Lignes serrées / v6a / v5a à − 12 % ; « ✓ Payé » reste à 24 px, le minimum. / Ça ressemble pas tellement à la mini maquettes ??? »
- 10.11 : « Pourquoi je peux pas changer de mois ? Je veux !! »
- 10.11 (Opérations en ligne, « Toutes les dates · Archives comprises ») : « Toujours pas la bonne vue et je peux pas fitré pour une intervalles de temps précis »
- 10.11 : « Les filtre de ce type sont super super pratique à ne pas enlever » (lignes-tâches qui ouvrent le journal filtré : acquis).
- 14.11 : « … avec la création de mini maquettes (non jouable) SANS FABLE ».

## La base, reprise telle quelle (règle n° 1)
`ref/v6a/etat.html` (copie fidèle de « Lignes serrées v6a »), `ref/v6a/NOTE.md`, image `ref/v6a/v6a-page.png`.
Copier etat.html dans ta variante et **n'ajouter que le filtre de dates** : rangées, piles, couleurs, mots, « ✓ Payé » 24 px, « + pièce »
sous le montant, mois ‹ ›, recherche, Par date, Filtres, Doublons, Apport ou prélèvement privé, Archives, IA : inchangés.
Ce qu'il voit aujourd'hui en ligne (à battre) : `analyse/cap/ops-390-clair.png` et `analyse/cap/ops-plage-390-clair.png` (« … » ouvre
du « novembre 2026 » au « novembre 2026 » : des mois, pas des jours).

## Ce qu'on cherche
Une plage **précise du jour au jour** (ex. du 3 au 17 nov., ou du 15 oct. au 10 nov. à cheval sur deux mois), qu'on pose vite au pouce,
qui se voit après le geste (le graphe et la liste ne montrent que la plage ; les montants payé · à payer · dépensé suivent), et dont on
revient au mois d'un toucher. Le mois ‹ › reste le geste premier : la plage ne doit pas le cacher ni l'alourdir au repos.

## Deux états par variante (non jouable : images statiques)
1. **repos** : novembre comme v6a, l'accès à la plage visible (ou évident) ;
2. **après le geste** : une plage posée. Données : celles de v6a. Toutes les opérations de v6a datent du 9 nov., le loyer est à payer le
   25 nov., le retard date de déc. 2025. Plage conseillée « du 1er au 15 nov. » : le loyer sort de la plage (à payer 0,00 dans la plage,
   dépensé recalculé, à écrire juste) ; ou une plage à cheval, à toi de dire ce qui change. Montre aussi, si ta variante a un état
   intermédiaire (feuille, calendrier ouvert), cet état à la place du repos ou en troisième image.

## Exigences transversales (L05, recopiées)
- Peu de texte au premier plan ; détails à un toucher ([[pas-de-cockpit]]). Au style de l'app : DESIGN.md (polices, couleurs, rayons) ;
  v6a en donne déjà le vocabulaire.
- Saisie au téléphone : jamais `type="number"` ; une date se pose au toucher (sélecteur natif `input type=date`, calendrier, frise) ;
  cibles ≥ 44 px pour le geste principal, 24 px minimum ailleurs (« ✓ Payé » reste 24 px).
- Inconnu ≠ 0 ; aucun montant inventé hors des données v6a.
- Les lignes-tâches filtrantes restent (acquis 10.11).
- Boosters (skill `boosters-ux`) : plage, frise, pastille, bascule, édition sur place ; dis lesquels tu emploies.
- Classes préfixées par l'id de ta variante (`s1a-…`), script en fonction immédiate (L26).
- État de l'art : un calendrier à plage se dessine comme react-day-picker (mode range), pas une invention.

## Livrables par variante `<id>` (dans ton dossier de voie)
- `<id>/etat.html` autonome (polices locales ou système, aucun appel réseau), les états côte à côte ou l'un sous l'autre ;
- `<id>/<id>-repos.png` et `<id>/<id>-apres.png`, 390 px de large, échelle 2, rendus par
  `node scripts/agents/verifier-page.mjs <etat.html> --captures <préfixe>` ou ton propre puppeteer (`.claude/skills/webapp-testing`) ;
- `<id>/NOTE.md` (12 lignes au plus) : idée en une phrase, chaleur, geste joué au doigt, boosters, ce qui casse.
Ouvre chaque image avant de rendre (L12). Juge-la comme lui : « combien et quels problèmes ? ».

## Skills à charger d'abord
`boosters-ux`, `impeccable`, `ui-design-system` (exigés par le brasseur le 10.11 : « utilise les ux, ui booster »).
