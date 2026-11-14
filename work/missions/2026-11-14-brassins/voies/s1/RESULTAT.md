OK — v0 rendue (5 variantes) ; contrôles : PANEL ECHEC ; COMMUN ECHEC 3 ; corrections en passe 2

## REPRISE (état au 14.11, agent concepteur s1 arrêté par le hook à 202 k)

### Fait
- 5 variantes, `etat.html` statique chacune (classes préfixées `s1x-`, script en IIFE, états par `?etat=repos|geste|liste&theme=clair|cave`) :
  - **s1a** (froide) « La courbe en tête » : en-tête z1, carte courbe densité + bande FG + jalons sur l'axe (dry hop J+6, repos J+7–9,
    garde J+10) + °C cuve face à la consigne en marches ; « Relevés du jour » (°C cuve, densité, dry hop) ; geste = feuille m2 °C de la
    cuve à 19,2 (piste 15–23, bande 18–20) ; liste = cartes-cuves à mini-courbe pleine largeur (Pils : seule la partie connue).
  - **s1b** (tiède) « Les jours en colonne » : un jour par rangée (J0 à J+10), la courbe de densité descend dans les rangées vers la
    colonne FG ; jalons dans leurs rangées ; °C cuve /consigne à droite ; geste = densité 1,015 relevée DANS la rangée J+5 (curseur m2
    aligné sur la colonne FG) ; liste = « Mes cuves » par fermenteur physique (F1, F2, cuve non dite, F-01) sur un calendrier commun.
  - **s1c** (tiède, une des deux meilleures) « Le densimètre dans la courbe » : la colonne J+5 est une piste verticale de l'OG à la bande ;
    geste = pouce posé à 1,015 dans la courbe, bulle ±0,001, barre Enregistrer ; °C cuve en cases par jour ; cave et 1280 faits.
  - **s1d** (chaude) « Le cadran des jours » : la densité s'enroule vers l'anneau FG au centre ; anneau extérieur = consigne par phase,
    °C cuve par jour ; geste = dry hop ajouté (goutte déplacée J+6 → J+5, déstockage Citra 100 g, Mosaic 80 g, Annuler).
  - **s1e** (chaude, A + B, l'autre meilleure) « La courbe pointe le geste » : épingles ①–④ sur l'axe (J+5, J+6, J+7, J+10), cartes
    de geste en escalier sous la courbe ; geste = °C cuve 19,2 relevée dans la carte ① ; cave et 1280 faits.
- Captures (16) : `s1?/s1?-repos-390-clair.png`, `-geste-390-clair.png` ×5 ; `s1a`, `s1b` `-liste-390-clair.png` ;
  `s1c`, `s1e` `-repos-390-cave.png` et `-repos-1280-clair.png`. Toutes ouvertes (planches) ; s1d refaite après correction des
  pastilles d'historique (non rouverte).
- Script de capture : `capturer.mjs` (dans s1/, puppeteer-core du dépôt principal) : `node capturer.mjs [ids]`.

### Sorties des contrôles (à corriger)
- `controle-panel.mjs` repos + listes (7) : PANEL ECHEC — remplissage médian 0,45 (< 0,55 ; s1a-liste 0,33, s1b-liste 0,34,
  s1c-repos 0,38, s1a-repos 0,45) ; ressemblance 0,92 (≥ 0,90). Sur 12 (avec gestes) : médiane 0,53, doubles 3 % (repos~geste).
  Piste : poser des masses tonales distinctes par variante (fond panneau pleine largeur sous les courbes, bandeau sombre…), remplir
  le bas des listes ; lire `fill` de `outils/controle-panel.mjs` pour savoir ce que « fond » veut dire avant de corriger.
- `controle-commun.mjs work/missions/2026-11-14-brassins/voies/s1 s1a s1b s1c s1d s1e --page=etat.html --profil=sans-houblons --sans=mots` :
  COMMUN ECHEC 3 — couleurs (2 teintes franches, 3 voulues : ajouter un repère, ex. cuivre Production plein), contraste (s1a « — »
  3,77:1 : passer en `--t1` ; s1d « repos 21° » 1:1 : texte posé sur l'arc cuivre plein, le sortir ; s1e axe J0–J+12 et « 4 » 4,3:1
  sur le fond `--pn` : `--t1`), standard (s1c rayons 8 px ×9 → 10 px ; icônes 2 épaisseurs de trait → une seule).
- GATES G1 et G2 : NOTE.md manquantes (à écrire : chaleur, idée, baseline cochée, gabarit boosters-ux, écarts : s1c piste verticale
  au lieu d'horizontale, raison = le relevé part de la courbe). G3 : rien écrit hors de la mission (à rejouer).
- `tests.txt` à écrire (sorties des CHECK).

### Reste à faire
1. Corriger contraste, standard, couleurs ; densifier pour PANEL OK ; recapturer (`node capturer.mjs`) et rouvrir.
2. Écrire `s1a/NOTE.md` … `s1e/NOTE.md` (chaleurs : s1a froide, s1b tiède, s1c tiède, s1d chaude, s1e chaude).
3. Rejouer G1–G3, écrire `tests.txt`, réécrire ce RESULTAT.md (ligne 1 OK).

## Passe f1 (14.11, exécutant)
- Point 1 non fait : `etat.html` interdit à f1 ; contraste, couleurs, standard et densité sont en passe 2 (VOIE f1).
- Point 2 fait : `s1a/NOTE.md` … `s1e/NOTE.md` écrits (chaleurs : s1a froide, s1b tiède, s1c tiède, s1d chaude, s1e chaude).
- Point 3 fait : G1 SERIE OK, G2 ETATS OK, G3 HORS OK ; sorties dans `tests.txt` ; contrôles rejoués dans `voies/f1/controles-s1.txt`.
- Captures s1 non refaites par f1 (aucune modification d'`etat.html`) ; `s1d-repos-390-clair.png` non rouverte depuis sa refonte.

Prédiction : s1c et s1e le frappent (« le relevé part de la courbe », « je vois quoi faire et quand ») ; s1d jugée jolie mais lente à lire.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
