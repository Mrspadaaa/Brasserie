# Voie v7 — 4 constats des carnets non conclus (vision locale), mission 2026-11-19-carnet-tour3
Règles : `../../VISION.md` (lecture seule du code, port 5197, 390 tactile et 1280, chaque capture ouverte à petite échelle).
Bancs prêts : `../v2/` (scripts du rejeu v2), `../v5a/rejeu2.mjs` (port par `PORT_BANC`). Lignes : `LIGNES.md` (PCN-76, PCN-110, PCN-112, PCN-NOTE-4).
Ce que v2 n'a pas conclu (`../v2/RESULTAT.md`) : PCN-76 (note en vrac « sol » à 1280 : partie ou non ?), PCN-110 (ligne « lues sur la fiche… » sous la photo),
PCN-112 (phrase citée de la carte « Prochain brassin » après une note en vrac, chemin sans IA), PCN-NOTE-4 (liste vide et carnet à 390 et 1280).
Verdict : `corrige` / `present` (mot pour mot) / `ouvert-gemini`.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `id | verdict | observé (≤ 25 mots) | capture | taille`.
- Tests : aucun ; si un test est lancé, `--reporter=dot > voies/v7/tests.txt`.
- Captures 390 et 1280, ouvertes, dans `voies/v7/captures/` ; serveur arrêté (port 5197 libre, vérifié). Plafond 100 k. Réponse finale : une ligne.
