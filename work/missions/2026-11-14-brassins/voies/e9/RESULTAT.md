OK — Atelier R&D : 4 mini maquettes (froide, 2 tièdes, chaude), repos, geste, tarifs

## Variantes
| id | chaleur | idée | geste montré |
|---|---|---|---|
| e9a | froide | Atelier remis d'aplomb : avancement en piste à toucher, tarifs aux curseurs | idée Lager au miel notée (toast Annuler) |
| e9b | tiède | Le chemin des idées : bandes Idées → Recherche → Validée → En cuve (ses vrais brassins) ; tarifs en marge au litre | prix du fût glissé 150 → 170 |
| e9c | tiède (ma meilleure) | Le fil des semaines : idées, contacts, tâches, marché sur une frise datée ; tarif en ticket de caisse | feuille « Noter » (type, titre, style, mois au toucher) |
| e9d | chaude | Envie contre effort : carte à quatre quadrants, idées posées au doigt ; tarif en bouteille qui se remplit | Lager au miel posée dans « à lancer » |

## Fichiers écrits (tous dans `voies/e9/`)
- `capture.mjs` ; `e9a/` à `e9d/` : `etat.html`, `NOTE.md`, PNG ; `tests.txt`.

## Critères (sortie dans `tests.txt`)
- G1 : `SERIE OK` · G2 : `ETATS OK` · G3 : `HORS OK`
- controle-panel : remplissage médian 0,74, ressemblance moyenne 0,75, 0/6 paires presque identiques → `PANEL OK`
- capture.mjs : 0 `type="number"`, 0 bouton sous 40 px au premier écran, aucun débord ni erreur JS.
- Tests : aucune suite Vitest (rien dans `src/`).

## Captures (toutes ouvertes, en planches de 3 à 4 par variante)
- `e9a/e9a-{repos,geste,tarifs}-390-clair.png`
- `e9b/e9b-{repos,geste,tarifs}-390-clair.png`
- `e9c/e9c-{repos,geste,tarifs}-390-clair.png`, `e9c/e9c-repos-390-cave.png`, `e9c/e9c-repos-1280-clair.png`
  (le 1280 a été regardé avant la dernière retouche CSS, mineure : bouton de la frise masqué au profit de la fiche à droite)
- `e9d/e9d-{repos,geste,tarifs}-390-clair.png`

## Prédiction
« Enfin un atelier qui me dit quoi faire : la frise avec le marché de Noël, je comprends en trois secondes ; la bouteille des tarifs, j'aime. »

## Limites
- Skills `impeccable` et `ui-design-system` non chargés (contexte) ; `boosters-ux` chargé et suivi.
- Contacts et À faire ne sont dessinés qu'à travers e9c (frise) et e9d (tuiles) ; leur vue propre reste à dessiner en passe 2.
- Écarts de modèle à trancher : e9c « brasser avant » (date d'idée) et tarif lié à un événement ; e9d champs envie et effort.

DÉCISION À PRENDRE : aucune hors contrat (les écarts de modèle se tranchent au choix du brasseur).
CONNAISSANCE : `CreativePricing` ne compare pas les formats ; ramenée au litre, la marge du fût (3,75 CHF/L, chiffres fictifs) se lit contre la bouteille (10,30) — un angle que l'écran actuel ne montre pas.
LEÇON PROPOSÉE : aucune
