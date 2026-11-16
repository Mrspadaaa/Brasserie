OK — s1 et s3 finies : 10 NOTE, tests.txt, captures s3 rejouées ; contrôles ECHEC, passe 2

## Suivi (une ligne par série et par CHECK)
- s1 G1 SERIE OK ; s1 G2 ETATS OK ; s1 G3 HORS OK — sorties dans `voies/s1/tests.txt`.
- s3 G1 SERIE OK ; s3 G2 ETATS OK ; s3 G3 HORS OK — sorties dans `voies/s3/tests.txt`.
- s1 PANEL ECHEC (médiane 0,45) ; COMMUN ECHEC 3 (couleurs, contraste, standard) — `controles-s1.txt`.
- s3 PANEL ECHEC (médiane 0,39) ; COMMUN ECHEC 2 (couleurs, standard ; contraste OK) — `controles-s3.txt`.

## Fichiers écrits
- `voies/s1/s1a…s1e/NOTE.md` (5) ; `voies/s3/s3a…s3e/NOTE.md` (5).
- `voies/s1/tests.txt`, `voies/s3/tests.txt`, `voies/s1/RESULTAT.md` (ligne 1 et passe f1), `voies/s3/RESULTAT.md` (créé depuis REPRISE).
- `voies/f1/capture-s3.txt`, `voies/f1/controles-s1.txt`, `voies/f1/controles-s3.txt`, `voies/f1/RESULTAT.md`.
- `etat.html` : aucun modifié (interdit par la VOIE). Captures s3 : 16 rejouées (`capture.mjs`).

## Ouvert / douteux
- Captures s3 ouvertes : 4 sur 16 (2 caves, 2 1280). Les 12 autres 390 clair non rouvertes.
- Sur le texte de la VOIE, « captures 390 tactile et 1280, clair et cave… rejouées et ouvertes » : à compléter par le pilote ou une relecture.
- Baseline cochée : sources seules, « non dit » quand absent ; les écarts et hypothèses sont ceux des sources.
- Corrections (contraste, couleurs, standard, densité) : passe 2.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
