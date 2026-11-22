OK — za2 : zq1 apaisée par l'ordre, le calme en tête, le dû dans un tiroir

Fichiers écrits (OWNS seulement) :
- `work/missions/2026-11-14-materiel/v2/za2/parts.html` : source de la variante ;
- `work/missions/2026-11-14-materiel/v2/za2/etat.html` : page assemblée, autonome, préfixe `za2-`, aucun « ZZ- » ni « {{ » restant ;
- `work/missions/2026-11-14-materiel/v2/za2/NOTE.md` ;
- `work/missions/2026-11-14-materiel/v2/za2/za2-*.png` : 7 captures ;
- `work/missions/2026-11-14-materiel/voies/v2-za2/build.mjs` : copie de `p2-z1/build.mjs`. Elle lit `v2/<id>/parts.html` et y
  reprend tels quels, depuis `v1/z/zq1/parts.html` en lecture seule, le CSS, la fiche du pH-mètre, la colonne droite du
  1280 et la feuille d'ajout.

Critères :
- G1 : `VARIANTE OK`.
- Mots : `mots-premier-ecran.mjs … v2 za2 --page=etat.html --sans-lignes --profil=sans-houblons --max=60` donne 60 mots,
  `MOTS OK`. Avec `--sans-coquille` : `MOTS OK`. zq1, mesurée par la même commande : 73 mots.
- Mesuré dans Chrome, dans les 5 états à 390 :
  - aucun texte sous 12 px ;
  - aucune cible sous 24 px ;
  - gestes à 44 px (le tiroir fermé fait 60 px) ;
  - aucun `type="number"` ;
  - 38 `data-booster`.
- `git status` : rien hors de OWNS (les fichiers non suivis de `src/data/hopSources` sont antérieurs à la voie).
- Tests : sans objet (maquettes statiques).

Captures, toutes ouvertes et regardées : `work/missions/2026-11-14-materiel/v2/za2/` contient `za2-repos-390.png`,
`za2-traiter-390.png`, `za2-geste-390.png`, `za2-ajout-390.png`, `za2-vide-390.png`, `za2-repos-cave-390.png` et
`za2-repos-1280.png`. Corrigés après le premier regard :
- coche alignée sur l'axe du rail (390 et 1280) ;
- échelle passée de 5 à 5,5 px/j pour réduire le blanc ;
- état de la fiche raccourci, qui débordait sur deux lignes ;
- cuve ajoutée après la coupure dans l'état traiter.

Prédiction : « Là je respire : je vois d'abord que tout va bien, et mes 4 trucs à faire m'attendent en bas sans me crier
dessus. » Risque : un toucher de plus pour faire un geste depuis le repos.

DÉCISION À PRENDRE : aucune. Le tiroir ouvert par défaut est la variante voisine, à montrer si le toucher en plus lui coûte.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
