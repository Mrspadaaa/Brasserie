OK — r4d : masse, retrait annulable, ajout et détail sur la ligne ; 16/16 gestes

- Fichiers écrits : `v3/r4d/etat.html`, `v3/r4d/capturer.mjs`, `v3/r4d/NOTE.md`, 6 captures `v3/r4d/r4d-*.png`, ce RESULTAT.md.
  `v2/r4c/` non touché. Rien hors du périmètre (le dossier `work/missions/**` est ignoré par git).
- Critères (rejoués depuis la racine, 31.10) :
  - G1 `controle-gestes-ligne.mjs … --etats=,replie` : GESTES OK (16)
  - G2 témoin r4c : ECHOUE OK (GESTES ECHEC, code 1)
  - G3 `verifier-page.mjs` : PAGE OK (0 images chargées, 390 px, sans erreur)
  - G4 `mots-premier-ecran.mjs` : r4d 76 mots, MOTS OK
  - G5 `controle-commun.mjs --sans=couleurs` : COMMUN OK
  - G6 `controle-contraste.mjs` : CONTRASTE OK (pire 4,85:1)
  - G7 `controle-hauteur.mjs` : HAUTEUR OK (1,04 écran)
  - G8 `capturer.mjs` : CAPTURES OK (sans erreur)
- Captures (390) : `v3/r4d/r4d-repos.png`, `r4d-replie.png`, `r4d-masse-pendant.png`, `r4d-retrait-apres.png`, `r4d-detail.png` ;
  (1280) `r4d-1280.png`. Toutes ouvertes.
- Prédiction : « Là c'est bon : je tape direct sur le chiffre, je vire avec la croix et je peux revenir ; le plateau, je le garde
  ouvert, replié ça fait vide. »

DÉCISION À PRENDRE : la frappe remplace la masse d'avant (le champ se vide au toucher, l'ancienne valeur reste en gris en indication) ;
c'est ce qui fait « 1 toucher, 2,5, Entrée ». Si le brasseur préfère compléter le chiffre existant (curseur au bout), c'est une ligne
(le `focusin` de `kg-ligne`).

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
