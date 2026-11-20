# Voie dc1 (tour 2, dc1b)
- DC-1 | ouvert | — | accord requis : reprise de l'angle après le gel du brasseur ; lignes PERDUES corrigées (commit 07ea7ebaf : graine 1 82 → 14, graine 2 0, fixes 0) ; reste ouvert : 14 lignes perdues (pied de h0065, graine 1) et 41 (graine 1) / 24 (graine 2) coupes SILENCIEUSES dues surtout à l'angle ; angle gelé sans commit (décision du brasseur)

## Fait (commité)
Commit 07ea7ebaf « la boîte du papier suit un texte pâli (projection des rangées) » : `src/services/decoupe.ts` + `tests/unit/bugs-dc1-DC-1.test.ts`.
Banc (`construire-banc.mjs` depuis l'arbre courant, `pieges/controler.mjs`, sans Gemini) :

| Pièces | silencieuses | signalées | perdues | rognées |
|---|---|---|---|---|
| Graine 1 avant (HEAD + 365e5f16) | 43 | 8 | 82 | 2 |
| Graine 1 après | 41 | 8 | 14 (h0065, pied centré) | 1 (h0065) |
| Graine 2 avant | 24 | 1 | 0 | 0 |
| Graine 2 après | 24 | 1 | 0 | 0 |
| 11 fixes après | 0 | 0 | 0 | 0 (DÉCOUPE OK) |

Aucune pièce déjà juste n'a changé (pièces coupées « avant » : 0 perdue, 0 rognée). Rien de pire ajouté.
`tests.txt` : 6 fichiers, 85 tests verts (DC-1 + d381 + lo2).

## Angle : étude commencée, GELÉE, aucun changement de code
Aucune modification de `decoupe.ts` pour l'angle ; seuls des scripts d'étude (non commités) existent : `etude-angle.ts/.mjs`, `diag-colonnes.mjs`.
Mesure (angle estimé contre `params.rot` du générateur, graine 1, 200 pièces, `estimerAngle` appelé sur d'autres cartes au même recadrage) :
- carte nette `ink` (actuel) : erreur moyenne 0,092°, 12 pièces > 0,35°, 4 > 1° ;
- carte sensible `coupe` : 0,061°, 5 pièces > 0,35°, 2 > 1° ; moitié paire 0,043° (2 > 0,35°), moitié impaire 0,080° (3 > 0,35°). Pièces encore fausses : h0016 (−1,75 → 0), h0130 (1,28 → 0), h0170 (0,98 → 0,4), h0077 (0,76 → 0,4), et h0145 pire (0 → −0,4 : un pli, que `ink` écartait) ;
- `coupe` sans longs traits horizontaux : pire (0,093°, 12) : ôter les traits longs retire aussi les lignes de texte floues ; écarté.
- Cause restante (h0016, h0130) : le score par colonne à 0° est maximal ou presque (h0016 : colonne 0 plein texte, masse 79 k, plateau 1,03 de −1,5° à −1° contre 1,000 à 0°, colonne 1 idem ; h0130 : plateau 1,04 de 0,75° à 1,25°). Écart faible entre le bon angle et 0° → la règle « sans gain net sur 0°, rendre 0 » et la somme brute des colonnes (une colonne dense domine) sont les pistes : médiane des angles par colonne pondérée, ou gain exigé plus bas. Non essayé.
- Piste à reprendre (agent neuf) : changer `ink` en `coupe` dans l'appel d'`analyser` (gain mesuré 12 → 5) en traitant le pli (h0145) à part, puis estimer l'angle par médiane pondérée des colonnes ; réglage sur la moitié paire, jugement sur l'impaire, graine 2 entière, 11 fixes (L20).
- Risque noté : un gain sur l'angle peut changer le plan de découpe de pièces aujourd'hui justes ; rejouer tout le banc.

## Pied de h0065 (14 lignes) : non traité (hors gel)
Les 4 derniers blocs échouent (texte centré). Piste dans la version précédente : bande dont les deux groupes de colonnes oscillent fortement ET bien plus que le bruit du fond mesuré sur les blocs vides.

## Signalement (point 4 de la demande)
Non fait : les 41 / 24 coupes silencieuses restent silencieuses (la bande de contrôle (a) attrape 12/12 les doublons à montant mais pas les 13 désignations tranchées sur la graine 2).

DÉCISION À PRENDRE : aucune de plus ; le brasseur a gelé l'angle. DC-1 ne peut être « corrigé » (exigence : 0 perdue et 0 silencieuse sur les deux graines) qu'après la reprise ci-dessus.

Tests : `npx vitest run` des 6 fichiers qui importent `services/decoupe` → 85 passés, 0 échoué.
Captures : aucune (pas d'écran touché).
CONNAISSANCE : sur ces tickets flous, estimer l'angle sur la carte sensible (`coupe`) plutôt que sur la carte nette réduit les angles faux de 12 à 5 sur 200 pièces ; ôter les longs traits horizontaux de la carte sensible retire aussi les lignes floues.
LEÇON PROPOSÉE : aucune
