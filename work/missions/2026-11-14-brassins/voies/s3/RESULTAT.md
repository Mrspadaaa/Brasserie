OK — v0 rendue (5 variantes) ; contrôles : PANEL ECHEC ; COMMUN ECHEC 2 ; corrections en passe 2

## Fait (source : REPRISE.md, § Fait)
- 5 variantes HTML statiques autonomes, classes préfixées `s3a-`…`s3e-`, script IIFE (`?etat=repos|geste|liste&theme=clair|cave`) :
  - s3a (froide) « Seul l'écart parle » ; s3b (tiède) « Le plan en filigrane » ; s3c (tiède) « Prévu · Réel · Écart » ;
    s3d (chaude) « La recette annotée » ; s3e (chaude, axe × prochain geste) « La pile des écarts ».
- Détail par variante : `s3?/NOTE.md` (écrits par f1 à partir de REPRISE.md).

## Fichiers écrits (f1, 14.11)
- Captures rejouées par `capture.mjs` (16) : `s3a…s3e` repos/geste 390 clair, `s3a` liste 390 clair, `s3c` liste 390 clair, `s3a`/`s3d` repos 390 cave, `s3a`/`s3d` repos 1280 clair. Sortie : `voies/f1/capture-s3.txt` (exit 0).
- `s3a/NOTE.md` … `s3e/NOTE.md` ; `tests.txt` ; ce RESULTAT.md.

## Ouvertes (Read) par f1
- `s3a/s3a-repos-390-cave.png` : rendu complet, thème cave, fiche NEIPA J+5 sans vide ni coupure.
- `s3d/s3d-repos-390-cave.png` : rendu complet, marque-page rouille et feuille recette, pas de coupure.
- `s3a/s3a-repos-1280-clair.png` : liste à gauche (Urgence) + fiche à droite, rendu complet.
- `s3d/s3d-repos-1280-clair.png` : colonne Brassins + feuille, rendu complet.
- Non rouvertes par f1 : les 12 autres captures 390 clair (repos/geste/liste), déjà regardées avant les derniers correctifs de s3c (liste lignes prévu/réel).

## Critères
- G1 SERIE OK ; G2 ETATS OK ; G3 HORS OK (sorties dans `tests.txt`, codes 0).
- Contrôles (`voies/f1/controles-s3.txt`) :
  - PANEL ECHEC : 10 captures, médiane 0,39 < 0,55 ; diversité 13 % de paires presque identiques (6/45).
  - COMMUN ECHEC 2 : couleurs ECHEC (s3a-e, 39° / 103° / 41°), standard ECHEC (rayons 3 px ×1 en s3a, s3d ; 6 px ×1 en s3e) ; contraste OK.

## Essais
- Captures : 1 passage (16 images). Contrôles : 1 passage chacun. Critères : 1 passage.

## Douteux
- REPRISE parle de « 12 captures 390 clair repos/geste » pour PANEL ; 10 existent (5 variantes × 2). Contrôle lancé sur les 10.
- Non ouvert : 12 captures 390 clair (voir ci-dessus).
- Corrections PANEL, COMMUN couleurs et standard : passe 2 (etat.html non modifié par f1).

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
