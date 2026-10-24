OK — moteur vérifié, entrées du lot 22 extraites et recalculées par D102 (G1 à G5 verts).

## Fichiers écrits
- work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/extraire-comparer.mjs
- work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/comparer-stout.json
- work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/ENTREES.md (48 lignes)
- work/missions/2026-10-22-reprise-lot21/voies/r6e-entrees/profils-regeneres.json.tmp
- work/missions/2026-10-22-reprise-lot21/voies/r6e-entrees/RESULTAT.md
Rien dans prototypes/ ; aucun autre fichier écrit.

## Critères (rejoués depuis la racine, après correction de D102 par le pilote)
- G1 : `npm --prefix prototypes/houblons-v4 run check:engine` → ENGINE-V4 OK (113 tests). PASSE.
- G2 : régénération puis `controle-entrees-lot22.mjs … --regenere=…` → ENTREES OK. PASSE.
- G3 : `systeme.mjs echoue "ENTREES ECHEC" -- … --temoin` → ECHOUE OK (ENTREES ECHEC, code 1). PASSE.
- G4 : `systeme.mjs note ENTREES.md --contient …` → NOTE OK. PASSE.
- G5 : git status sur prototypes/houblons-v4 vide → MOTEUR INTACT. PASSE.

## Essais
- G2 : 1 essai avant la correction du contrôle par le pilote, 1 essai après (OK). Extracteur et JSON inchangés.

## Ce qui reste douteux (pour le pilote)
2. α retenu hors des sources : Galaxy 17,2 contre 11–16 (Beer Maverick) ; Nelson Sauvin 9,6 contre 10–13 et 12–14 (Hopsteiner). Retenu « fiche de stock » pour Galaxy, « lu sur l'article » pour Nelson.
3. Matching des panels : « Idaho-7 » et « Cascade (récolte …) » rattachés par nom normalisé (tirets/espaces, parenthèses ignorées). E09 cite Cascade, Galaxy et Nelson Sauvin.
4. Rôle « double » issu de la règle v1 (prototype, à valider) pour Galaxy, Idaho 7, Nelson Sauvin.

CONNAISSANCE : pack-fiches `aromes[].mots` est une liste de groupes `{source, mots[]}` ; le nombre de mots se calcule sur `mots[].mots`, et le contrôle D102 compte les groupes.

LEÇON PROPOSÉE : un contrat qui compte « des mots » et un contrôle qui les compte autrement ont été écrits sans relire la forme d'une entrée. Cause : la forme de `aromes[].mots` n'a pas été lue avant d'écrire le contrôle. Règle : avant d'écrire une formule de comptage, lire une entrée réelle et écrire l'unité (mot, groupe, entrée) dans VOIE.md et dans le contrôle.
