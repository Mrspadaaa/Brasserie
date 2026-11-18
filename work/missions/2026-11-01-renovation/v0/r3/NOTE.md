# r3 — Rénovation : la brasserie en plan (chaude)

- **Chaleur** : chaude (forme libre), dans la langue de l'app : tête teintée comme une carte du Bord, lignes, feuille du bas.
- **Axes** : place = un écran à lui, ouvert depuis le Bord (« ‹ Bord ») ; forme = vraie vue figurée, la brasserie en plan, chaque
  manque à sa place ; mot = « Rénovation » ; argent = une enveloppe qu'il fixe, contre laquelle les prix se posent ; temps = les
  heures par manque ; étapes = cases à cocher dans le manque ouvert.
- **L'idée** : le numéro du repère sur le plan **est** la place dans la suite : avancer un manque dans la liste renumérote le plan.
- **Une question** (L10) : seul facteur libre, l'ordre (flèche ↑) ; le plan dit où, la liste dit quand.

## Aucune zone muette (D259)
Chaque zone porte son nom : Brassage, Lavage, Fermentation, Accueil, Extérieur, En ligne, « vitrine de la rue », « sol entier ».
Les objets existants sont pleins (cuve, évier, cuves de fermentation) ; ce qui manque est en pointillé (hotte, 2ᵉ évier, armoire) ;
le sol entier est hachuré tant que la seconde passe n'est pas faite (vert une fois faite). Le site vitrine n'a pas de place
physique : il vit dans une zone « En ligne », hors du local.

## Ce qui vient de la base
En-tête, barre du bas et +, teinte et rayon des cartes du Bord, feuille du bas, « Noter l'achat », pastilles. Plancher enrichi :
le plan, le repère numéroté, l'enveloppe, les étapes, l'ajout « Où ? Touche une zone du plan, ou Noter sans lieu ».

## Honnêteté et risque
- Le plan est un schéma que le brasseur pose lui-même (zones nommées, à ajuster) ; ce n'est pas le relevé de son local. Au jour 1,
  les repères sont placés là où il les a touchés en notant ; un manque noté sans lieu irait sous le plan. **Risque** : dessiner un
  plan réel coûte un geste de plus ; à vérifier s'il le veut.
- Argent : rien au jour 1. Ensuite « Prix connus 4 480,00 CHF +1 à estimer » et « Enveloppe à fixer » ; `caisse` : enveloppe
  5 000,00 → « libre 520,00 » et sa jauge. Dépassé : repère rouge, « dépassé +152,40 ». Fait hors de l'app : sans montant.

## Boosters UX (boosters-ux)
- `plan` — lire ; SVG du local ; toucher un repère sélectionne sa rangée (r3-geste-repere-armoire).
- `suite` — choisir ; flèche ↑ ; le repère change de numéro sur le plan (r3-geste-avancer-evier).
- `enveloppe` — régler ; puce « Enveloppe à fixer » (r3-geste-enveloppe-a-fixer).
- `etapes`, `cause`, `noter-achat` — dans la feuille (état `ouvert`, armoire : « Bloqué par ① Seconde passe sur les sols »).
- `noter` — déclencher ; champ en bas, puis zones du plan en surbrillance (état `ajout`).
- B1 OK (7 marqués, 3 gestes) ; B2 OK (le plan domine) ; B6 12 / 14 / 16 (le plan à 1280 est plafonné à 480 px) ; B7 OK après
  halo blanc sous les noms de zone (4,09:1 avant).

## Contrôles
Voir `../r-RESULTAT.md`.
