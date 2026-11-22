OK — za4 corrigée : gestes 44 px en encre, pompe justifiée, nœud sur le rail

Fichiers écrits (tous dans le périmètre de la voie) :
- `work/missions/2026-11-14-materiel/v2/za4/` :
  - `parts.html` et `etat.html` (assemblé) ;
  - `NOTE.md` ;
  - 7 captures `za4-*.png`.
- `work/missions/2026-11-14-materiel/voies/v2-za4/` :
  - `transforme.mjs` : construit `parts.html` depuis la base zq1, par remplacement de lignes numérotées, sans
    remplacement de chaîne (L26) ;
  - `build.mjs` : copie de `p2-z1/build.mjs`, pointée sur `v2/` ;
  - `RESULTAT.md`.

Critères :
- G1 : `VARIANTE OK`.
- Captures : `node socle/capt.mjs v2 repos,geste,traiter,ajout,vide,repos-1280 za4` donne `za4 : 7 images`, puis `CAPTURES OK`.
- Exigences transversales, mesurées par puppeteer à 390 × 844 :
  - 59 mots au premier écran (zq1 : 61 au même compteur) ;
  - 0 texte sous 12 px ;
  - 0 cible sous 24 px ;
  - 0 `type="number"` et 0 ressource distante ;
  - zone due de 224 px sur 844, soit 27 %, sous le tiers.
- Tests : sans objet (maquettes statiques).

Captures, toutes ouvertes (390 tactile, 1280, clair et cave) :
- `work/missions/2026-11-14-materiel/v2/za4/za4-repos-390.png`
- `work/missions/2026-11-14-materiel/v2/za4/za4-geste-390.png`
- `work/missions/2026-11-14-materiel/v2/za4/za4-traiter-390.png`
- `work/missions/2026-11-14-materiel/v2/za4/za4-ajout-390.png`
- `work/missions/2026-11-14-materiel/v2/za4/za4-vide-390.png`
- `work/missions/2026-11-14-materiel/v2/za4/za4-repos-cave-390.png`
- `work/missions/2026-11-14-materiel/v2/za4/za4-repos-1280.png`

Prédiction : « Là je respire : je vois ce que je fais maintenant, le reste attend sans me crier dessus. »

Limites :
- `controle-choix.mjs` n'a pas été lancé : zq1 n'est pas au registre `ecrans.json` (choix ouvert, D123).
- La comparaison avec la maquette s'est faite à l'œil, capture contre capture zq1.

DÉCISION À PRENDRE : la règle du « prochain geste ». Ici : le geste faisable maintenant qui sert au prochain brassin, puis le
plus ancien. La pompe en panne est donc en ligne simple, pas en carte. L'autre lecture, qui met la panne d'abord, est une
variante possible.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune

## Correction 15.11
- P1 à P4 de VERDICT-V2 corrigés dans transforme.mjs, puis parts.html, etat.html et les 7 captures refaites. Toutes les captures ont été ouvertes : repos, cave, traiter, geste, ajout, vide, 1280.
- capt.mjs : za4 : 7 images, CAPTURES OK.
- Mesures puppeteer :
  - gestes de ligne : 44 px, couleur encre rgb(17,17,17) ;
  - point de la panne : 10 px ;
  - centre du nœud du héros : 48, comme le rail et les lignes (68 à 1280) ;
  - premier écran : 60 mots (traiter : 39) ;
  - 0 texte sous 12 px ;
  - zone due : 230 px sur 844, soit 27 %.
- Écart : la sous-ligne dit « fuit · attend la pièce ». Avec « au raccord », on passait à 62 mots, au-dessus du plafond de 60.
- Tests : sans objet.
- Prédiction : « Ça c'est bien : une chose à faire, le reste attend. »
- DÉCISION À PRENDRE : panne en tête ou pH-mètre (doute du critique) ; l'échange tient en une ligne de transforme.mjs.
- CONNAISSANCE : aucune. LEÇON PROPOSÉE : aucune.
