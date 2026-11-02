# Voie pp2 — plateau, passe 2 des 3 candidates (mêmes auteurs)

Agents : les auteurs des séries, repris par message. pu4 (série pu, Opus), pz2 (série pz, Fable), pa1 (série pa, Opus). Plafond : 60 tours
chacun. Brief inchangé : `../../BRIEF-PLATEAU.md` (les six cas, le téléphone d'abord, les deux thèmes, l'honnêteté, les interdits).

## Entrée
`plateau/critique/SYNTHESE.md` : § « Candidates » (tes trois retouches), § « Greffes » (celles qui nomment ta candidate), et la liste
« à corriger partout en passe 2 ». Le détail de ta série : `plateau/critique/<série>.md`.

## Ce que tu fais
1. Partir de ta v0 (`plateau/v0/<id>/`), sans la toucher. Écrire `plateau/v1/<id>b/` : `etat.html`, `NOTE.md`, captures.
2. Appliquer tes trois retouches et tes greffes. Appliquer partout :
   - un seul contrôle d'unité, des cases de 44 px quand elle manque ;
   - sûr = rien (D277) : aucun ✓ sur une valeur sûre, aucune question sur une ligne sûre ; le signal seulement en jaune, rouge, bleu ;
   - la mouture dite une fois ;
   - le bis proposé par défaut quand l'α diffère (D215), jamais « Relier » ;
   - « Stk » devient le mot du brasseur (pièce, sachet).
3. Captures, comme en v0 : les six cas à 390 × 844 en clair, un cas en sombre (`data-theme='cave'`), le cas b à 1280. Ouvre chacune
   avant de rendre (L12).
4. Contrôles du lot, une fois, sorties dans la NOTE : `controle-commun.mjs <etat.html> --profil=sans-houblons --sans-lignes`,
   `controle-contraste.mjs`, `node scripts/agents/verifier-page.mjs <etat.html> --min-images 0`. Aucun `type="number"`.

## Possède
`work/missions/2026-10-31-ecran-depense/plateau/v1/<id>b/**`. Lecture seule ailleurs.

## Rendre
`OK — <id>b : <ce qui a changé, en une phrase>`, et le chemin de la NOTE.
