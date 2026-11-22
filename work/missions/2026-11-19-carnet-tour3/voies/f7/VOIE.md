# Voie f7 — correction après la critique tour 2 des carnets (tour 2 sur 3), mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md` une fois, puis `../v5a/RESULTAT.md` § Problèmes (3, captures dans `../v5a/captures/` : les ouvrir).
Liste figée : n° 1 BLOQUANT (dans un carnet avec bulle G8 et un lien au presse-papier, la puce dit « Coller : e… » à 390 : le lien
doit rester lisible — sa largeur, pas une lettre ; voir 7160b51e8 et 29543e2a1), n° 2 (« Ventilation de la salle » tapé dans la liste :
« Nouveau carnet · arrive ici » encore annoncé au-dessus de « Ouvrir ce carnet » : une seule annonce, celle du carnet existant),
n° 3 (390, cadre d'arrivée : nom du carnet coupé, « Façon » coupée au bord).
Possède : src/ui/carnets/*, src/domain/carnets/*, CSS et tests des carnets. ÉCONOMIE : `grep -n` puis `sed -n` ; pas de fichier lu en entier.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `n° | verdict | commit | test | rouge→vert | état à capturer`.
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/f7/tests-rouge.txt` puis `> voies/f7/tests-vert.txt` ; à la fin
  `npx vitest run tests/unit/carnets* tests/integration/carnets* --reporter=dot > voies/f7/tests-final.txt` vert ; tsc.
- Captures 390 et 1280, clair et sombre, des 3 états (banc `../v4/rejeu5189.mjs` sur le port 5191), ouvertes, dans `voies/f7/captures/` ; serveur arrêté.
- Commit par chemins (tests non suivis compris), `git show --stat HEAD` vérifié. Plafond : à 150 k, `REPRISE : <fichier>`.
