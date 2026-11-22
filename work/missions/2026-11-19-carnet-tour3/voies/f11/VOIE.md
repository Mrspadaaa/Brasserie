# Voie f11 — 4 derniers constats des carnets (vision v7), mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md` une fois, puis `../v7/RESULTAT.md` (captures `../v7/captures/` : les ouvrir). ÉCONOMIE : `grep -n` puis `sed -n`.
Liste figée : PCN-110 (« lues sur la fiche du vendeur » jamais affichée : aucun code ne pose `luLe` ; la poser quand un lien est lu, et l'afficher
comme sa maquette) ; v7-1 (« Comparer sur le température mini » : accord de l'article avec le nom de la caractéristique ; règle générale, pas une
liste au cas par cas : le genre vient du lexique des caractéristiques ou la tournure évite l'article) ; v7-2 (vignette réduite à une lettre « R »
pour le carnet né de la note « sol » : un objet dessiné comme les autres) ; v7-3 (citation de « Prochain brassin » coupée « Sachets de levure x2.… » à 390).
Possède : src/ui/carnets/*, src/domain/carnets/*, CSS et tests des carnets.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `id | verdict | commit | test | rouge→vert | capture`.
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/f11/tests-rouge.txt` puis `> voies/f11/tests-vert.txt` ; à la fin
  `npx vitest run tests/unit/carnets* tests/integration/carnets* --reporter=dot > voies/f11/tests-final.txt` vert ; tsc.
- Captures 390 et 1280, clair et sombre, des 4 états (bancs de `../v7/`, `PORT_BANC=5199`), OUVERTES avant de conclure, dans `voies/f11/captures/` ; serveur arrêté.
- Commit par chemins, `git show --stat HEAD` vérifié. Plafond : à 150 k, `REPRISE : <fichier>`.
