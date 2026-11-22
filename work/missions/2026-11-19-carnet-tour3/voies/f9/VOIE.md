# Voie f9 — derniers problèmes des carnets (après la critique tour 3), mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md` une fois, puis `../v6/RESULTAT.md` § Problèmes (3, captures `../v6/captures/` : les ouvrir).
Liste figée, chacun prouvé seul :
1. VALEUR FAUSSE (priorité) : une fois le choix fait, le carnet affiche « Critère : Moins de condensation au plafond » au lieu de
   « tient 80 °C, puis le débit » : le critère affiché doit être celui du carnet (voir f5d n° 8, 29543e2a1/67e82dbbf, et 0b30c6775).
2. ILLISIBLE : Choisir à 390, « sous votre minimum de 1 500 m³/h » écrit par-dessus « Gastro-Lüftung ».
3. Comparer à 390 : un glissé du doigt décale toute la page de 67 px et coupe le titre (débordement horizontal de la page : seul le
   tableau défile, la page jamais).
Possède : src/ui/carnets/*, src/domain/carnets/*, CSS et tests des carnets. ÉCONOMIE : `grep -n` puis `sed -n`.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `n° | verdict | commit | test | rouge→vert | capture`.
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/f9/tests-rouge.txt` puis `> voies/f9/tests-vert.txt` ; à la fin
  `npx vitest run tests/unit/carnets* tests/integration/carnets* --reporter=dot > voies/f9/tests-final.txt` vert ; tsc.
- Captures 390 tactile (et 1280 pour le n° 1), clair et sombre, des 3 états avec le banc de `../v6/` (port 5196), OUVERTES avant de conclure,
  dans `voies/f9/captures/` ; pour le n° 3, mesurer `document.scrollingElement.scrollWidth <= innerWidth` après un glissé. Serveur arrêté.
- Commit par chemins, `git show --stat HEAD` vérifié. Plafond : à 150 k, `REPRISE : <fichier>`.
