# Fiche d'un houblon, au long appui (voie p1-ma-biere ; reprise g1, 23.10)

## Base

- g1, la fiche de la base v4.10 qu'il a choisie (« la v1 est la meilleure ») : `base/consolide/fiche.html`, capture
  `base/captures/consolide-fiche-390.png` ; la fiche courte type Citra cryo (« Ça c'est très bien ») :
  `fils13-carte-fiche/captures/g1-fiche-citra-390.png`.
- Inventaire : `work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-fiche.json` (12 éléments).

## Reprise

- g1-feuille : repris — la feuille de l'app (Sheet), presque pleine, le haut de la page assombri, « × » rond en haut à droite
- g1-titre : repris — le nom du houblon en titre de la feuille, avec ⊙ quand son α vient d'un lot
- g1-alpha : repris — « α 9,5–16 % » en gros (plage des fiches), « lot 13 % » à côté et sa jauge dans la plage
- g1-usage : repris — l'usage en mots dans une pastille (« double usage »)
- g1-bande : repris — la bande des 12 familles en couleur, en tête du bloc gris
- g1-familles : repris — le bloc gris : picto au trait (D93), nom, « 2/4 », et les mots des fiches dessous
- g1-premier : repris — « nommé en premier » sur la famille que les fiches citent en premier
- g1-sans-famille : repris — « sans famille : gingembre, resiny », avec la part « autres » dessinée au-delà de 25 % (D100)
- g1-non-decrites : repris — « 5 non décrites : Noyau, Pépins, Baies, Melon, Végétal »
- g1-radar : repris — le grand radar légendé : chaque axe nommé avec « 2/4 », les inconnus « ? » hachurés, les flèches de sa demande
- g1-demande : repris — « + Floral 2/4 − Résineux 2/4 » sous le radar, lu dans la visée de l'onglet Ma bière (état commun)
- g1-actions : repris — en pied, ♡ et ⊘ (son goût), et « Comparer » (ajoute le houblon à la comparaison et l'ouvre)

## Idées reprises

- α du lot balisé `data-role="alpha" data-source="lot"` : c'est le premier α de la fiche (D93 B3) ; la plage est la
  lecture en gros, comme g1.
- La demande et les flèches suivent la visée posée dans l'onglet Ma bière (bannir, −, +).

## Écarts

- Les familles portent leur picto au trait au lieu du carré de couleur de g1 : D93 (« ça suit pas la Baseline »).
- « ‹ » ajouté à gauche de l'α (fermeture demandée par le contrat de la voie), en plus de « × » et Échap.
- La table des IBU par moment n'y est pas (« Inutile »), ni « Ajouter à 10′ » (« palace holder ? »).

## Pour l'app

- Emploi depuis un autre écran : `<Fiche houblon={cle} />` (export par défaut de `index.tsx`, fermée par le retour),
  ou `useFiche()` : `<span {...f.appui(cle, onCourt)} {...f.nom(cle)}>` puis `{f.rendu}`.
- `Sheet` devrait accepter des attributs `data-*`, une largeur maximale et une cible de focus initiale. La maquette
  les pose sur la feuille après son ouverture : `data-role="fiche"`, cadre de 768 px à l'ordinateur (D10), focus sur la
  fiche et non sur « × ». Le « click » qui suit un appui long est avalé (350 ms) pour ne pas refermer la feuille.
- Les goûts s'écriront dans Dexie (préférences du brasseur) ; les mots des fiches viendront du catalogue réel.
