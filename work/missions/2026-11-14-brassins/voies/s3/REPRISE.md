# Reprise s3 (série C — L'écart au prévu), arrêt à 200 k (hook)

## Fait
- 5 variantes HTML statiques autonomes, classes préfixées, script IIFE (`?etat=repos|geste|liste&theme=clair|cave`) :
  - `s3a/etat.html` — FROIDE « Seul l'écart parle » : grammaire z1 ; carte d'écart unique (°C cuve du jour « — », curseur m2
    pouce pointillé, bande 18,5–19,5, ±0,1, crayon) ; « Au plan » en sourdine (densité 1,018 + mini-jauge FG, FG 1,010–1,014
    « encore 0,004 », °C hier 19,1, alcool 5,8 % att. 71 % provisoires) ; À venir (dry hop J+6 Citra 100 g + Mosaic 80 g, J+7 21 °C,
    J+10 2 °C) ; Relevés du jour. Geste : °C posée 19,2 → l'écart se tait (chip « au plan », ligne verte dans Au plan), le dry hop
    monte en tête avec « Ajouté aujourd'hui ». Liste (tri Urgence) : « S'écartent du plan · 3 » (NEIPA °C du jour —, Pale Ale 6 j de
    retard, Pils FG stable depuis 06.11) avec bouton d'action par ligne ; « Suivent le plan · 2 » (Stout, Saison). 1280 : liste à
    gauche + fiche (media ≥ 900 px).
  - `s3b/etat.html` — TIÈDE « Le plan en filigrane » : frise SVG J0→J+11, plan de cuve en bandes (19 °C, 21 °C, flèche 2 °C garde),
    points réels (19,6 du 11.11 en ocre), point du jour pointillé ; piste densité 1,062→1,018 vers la bande FG ; drapeau dry hop J+6.
    Dessous : Relevés du jour (°C cuve Relever, Densité + °C échantillon), dry hop, J+7. Geste : curseur m2 ouvert sur place à 19,2,
    point du jour plein.
  - `s3c/etat.html` — TIÈDE « Prévu · Réel · Écart » (registre) : onglet BRASSIN, colonnes Prévu/Réel/Écart, groupes Relevés du
    jour / Depuis le levurage / À venir ; seule la colonne Écart se colore. Alcool prévu 6,3–6,8 % et atténuation dérivés de OG et
    bande FG × 131,25 (à dire dans la NOTE). Geste : ligne °C cuve dépliée, curseur à 19,2, écart « +0,2 = ». Liste (tri
    Fermenteur) : F1, F2, « — » (Pils, cuve inconnue), Hors cuve (Stout fût F-01, Saison) ; lignes prévu/réel.
  - `s3d/etat.html` — CHAUDE « La recette annotée » : la recette figée en feuille, gouttière J, marge du réel (✓, 19,6 cerclé) ;
    marque-page rouille « Aujourd'hui J+5 · 14.11 · levuré le 09.11 » avec le curseur m2 et « Densité + °C éch. ». Geste : dry hop
    « Ajouté aujourd'hui » → J+6 barré, J+5, cercle « 1 j d'avance », « stock −180 g », Annuler (l'écart naît du geste). 1280 :
    colonne Brassins à gauche + feuille.
  - `s3e/etat.html` — CHAUDE, axe × « prochain geste » (s2) « La pile des écarts » : « 1 écart » en 28 px, calendrier 12 cases
    (densité en haut, °C en bas, J+2 19,6 ocre « +0,6 », J+5 pointillé), jauge densité 1,005–1,065 (bande FG, OG creux), chips au
    plan ; en bas (zone du pouce) pile de cartes : devant, carte rouille °C cuve avec segment Cuve | Densité + °C éch. et curseur m2.
    Geste : « Au plan », carte suivante « Demain J+6 · dry hop » avec « Ajouté aujourd'hui · sortir du stock », bandeau Relevés du
    jour 19,2 °C Annuler.
- `capture.mjs` (dans s3/) : `node capture.mjs "s3a repos 390 clair; …"` → `<id>/<id>-<etat>-<largeur>-<theme>.png`.
- Captures déjà faites et regardées : s3a repos/geste/liste 390 clair (avant les derniers correctifs), s3b repos/geste, s3c
  repos/geste/liste, s3d repos/geste, s3e repos/geste (390 clair).

## Reste à faire (agent neuf ou exécutant)
1. Rejouer toutes les captures (derniers correctifs non capturés : s3c liste lignes prévu/réel enveloppées, « 4px » avant °C) :
   `cd work/missions/2026-11-14-brassins/voies/s3 && node capture.mjs "s3a repos 390 clair; s3a geste 390 clair; s3a liste 390 clair; s3b repos 390 clair; s3b geste 390 clair; s3c repos 390 clair; s3c geste 390 clair; s3c liste 390 clair; s3d repos 390 clair; s3d geste 390 clair; s3e repos 390 clair; s3e geste 390 clair; s3a repos 390 cave; s3d repos 390 cave; s3a repos 1280 clair; s3d repos 1280 clair"`
   puis ouvrir chaque PNG (surtout les deux cave et les deux 1280, jamais vus).
2. `node work/refonte-frontend/v4/tournoi/outils/controle-panel.mjs <les 12 captures 390 clair repos/geste>` → PANEL OK attendu
   (s3e a un vide de ~130 px entre chips et pile : voulu, zone du pouce).
3. `node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-11-14-brassins/voies/s3 s3a s3b s3c s3d s3e --page=etat.html --profil=sans-houblons --sans=mots` ; recopier les sorties dans chaque NOTE.
4. Écrire `s3a/NOTE.md` … `s3e/NOTE.md` : chaleur (s3a froide, s3b tiède, s3c tiède, s3d chaude, s3e chaude — axe × prochain geste),
   idée, liste baseline cochée (BRIEF-AUTEUR « Obligatoire »), boosters (`data-booster` : curseur-cuve, releve-densite,
   dryhop-ajoute, tri-ecart, tri-fermenteur, frise-plan, recette-annotee, calendrier-plan, jauge-fg, pile-ecarts), B1–B13 en v0,
   sorties des contrôles. Hypothèse à écrire : tolérance de silence ±0,5 °C autour de la consigne (non fixée par la recette ;
   réglable) — c'est elle qui colore 19,6 (11.11). Valeur 19,2 °C et dry hop « ajouté le 14.11 » = saisies simulées du geste.
5. CHECK de GATES.md (G1 SERIE OK, G2 ETATS OK, G3 HORS OK) ; `tests.txt` avec leurs sorties ; `RESULTAT.md`.
   Les deux meilleures (cave + 1280) retenues : s3a et s3d.
