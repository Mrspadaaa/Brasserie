# Voie g6-rejeu — son ticket Bauhaus rejoué sur le nouveau code (60a8c25f)

Agent : `executant` (Haiku). Plafond : 40 tours. Mécanique seulement : tu lances, tu attends, tu résumes. Aucun jugement d'écran.

## Contexte
- La copie de banc `C:/Users/mrspa/AppData/Local/Temp/deploy-hosting-qr` est détachée par le pilote sur **60a8c25f** (lot g : g2a, g2b, g5).
  `functions/lib` est reconstruit, `scripts/g-banc.mjs` est copié du worktree (mesure après les animations). Ne touche ni à son `git`, ni à
  son `source4-portable-bundle-manifest-01.json`.
- Les outils de g1 : `work/missions/2026-10-31-ecran-depense/voies/g1-audit/outils/` (worktree), mode d'emploi dans
  `voies/g1-audit/RESULTAT.md` § 6. Les sorties « avant » (b3ab392e) sont dans `deploy-hosting-qr/…/voies/g1-audit/avant-G1..G4/`.
- Un banc à la fois (ports fixes). Ne tue aucun processus qui n'est pas le tien.

## Ce que tu fais, dans l'ordre
1. `node work/missions/2026-10-31-ecran-depense/voies/g1-audit/outils/fabriquer-manifeste.mjs` (depuis le worktree) : recrée le manifeste
   de sa pièce hors Git.
2. `bash work/missions/2026-10-31-ecran-depense/voies/g1-audit/outils/groupes-g.sh apres scripts/g-banc.mjs` : G1 à G4, 390 et 1280.
   En arrière-plan si c'est long ; attends `groupes-fin-apres.txt`. Un groupe arrêté par la garde mémoire : relance ce groupe seul, deux
   fois au plus (`lancer-g.sh apres-G<n> <cas> 390,1280 "" scripts/g-banc.mjs`).
3. `node work/missions/2026-10-31-ecran-depense/voies/g1-audit/outils/resumer-mesures.mjs <deploy-hosting-qr>/work/missions/2026-10-31-ecran-depense/voies/g1-audit apres`
   et la même commande avec `avant`. Garde les deux sorties.
4. Les cas existants, groupes A à D seulement : `bash …/outils/groupes-existants.sh apres scripts/g-banc.mjs` (sans drive-fond).

## Possède
`work/missions/2026-10-31-ecran-depense/voies/g6-rejeu/**` (worktree) et `deploy-hosting-qr/work/missions/2026-10-31-ecran-depense/voies/g1-audit/apres*`.
Lecture seule ailleurs.

## Rendre
`voies/g6-rejeu/RESULTAT.md` : un tableau M1 à M13, avant | après (OK/KO et le nombre), le compte OK/KO de chaque groupe g et A à D, les
groupes arrêtés et pourquoi, et la liste des chemins des captures « après » (pas leurs valeurs). Aucune valeur de ses pièces.
Ligne 1 : `OK — M : <n> passés de KO à OK, <n> encore KO ; existants : <n> OK, <n> KO` ou `ECHEC — <raison>`.
