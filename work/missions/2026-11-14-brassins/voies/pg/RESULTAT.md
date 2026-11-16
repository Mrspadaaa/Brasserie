OK — page de choix brassins : passe 2 (4), panel v0 (15), PAGE OK, 56 images

## Fichiers écrits
- `work/missions/2026-11-14-brassins/page/index.html` (écrit à la main, Write).
- `work/missions/2026-11-14-brassins/page/img/` : 56 PNG copiés (ref-fiche, ref-liste ; s1e2, s1g, s2a2, s3b2 × six ; s1a à s3e × repos et geste), noms courts.
- `work/missions/2026-11-14-brassins/voies/pg/tests.txt`, `verif-haut.png`, `verif-page.png`, `verif-ordinateur.png` (verifier, thème sombre du système), `verif-clair-390.png`, `verif-clair-1280.png` (thème clair forcé, capture ad hoc hors verifier).
- `work/missions/2026-11-14-brassins/voies/pg/RESULTAT.md`.

## Critères
- G1 : `node scripts/agents/verifier-page.mjs ... --page-lot --captures .../voies/pg/verif` → `PAGE OK (56 images chargées, lisible à 390 et 1280 px, sans erreur)`, sortie 0.
- G2 : `CONTENU OK` (19 ids présents, `id="a-choisir"`, aucun « fable »), sortie 0.
- Captures ouvertes : `verif-haut.png` (390 sombre), `verif-ordinateur.png` (1280 sombre), `verif-clair-390.png` (clair). En une ligne : en-tête et #a-choisir dans le premier écran, rangée « Aujourd'hui » lisible, passe 2 avec vignettes serrées ; rien ne déborde.

## Essais
1 essai par critère, passés au premier coup (G1 et G2).

## Ce qui reste douteux
- La source citée par la voie (`outils/pages/2026-11-10-onglet-finances/index.html`) n'existe pas : seul son `img/` est là. La feuille de style et la visionneuse ont été écrites neuves (tokens clair et sombre, `<dialog>` pour l'agrandissement).
- Le clic sur une vignette (ouverture du `<dialog>`) n'a pas été joué dans Chrome ; seul le rendu fixe est vérifié.
- Vignettes à 390 : trois par rangée, environ 115 px ; elles ne sont lisibles qu'en grand (contrat du verifier, `data-vignette`).
- « Note du critique » de passe 2 : c2 ne donne pas de note sur 5, seulement un verdict et un nombre de bloquants. La ligne donne ce verdict.
- Réserves de passe 2 tirées de `c2/VERDICT.md` (non bloquantes, une ligne par variante) ; elles ne sont pas rejugées après c2f. Pour s2a2 : les 4 points de MONTRER.
- Notes du panel v0 : chiffres repris de `t1/SYNTHESE.md § Classement` ; les phrases courtes sont des résumés de moi.
- Un thème cave à part (forcé `data-theme="dark"`) n'est pas capturé séparément : le sombre du verifier joue ce rôle.
- `tests.txt` et les PNG de `voies/pg/` sont sous `/work/missions/**` (gitignore) : `git add -f` si besoin.

CONNAISSANCE : aucune

LEÇON PROPOSÉE : une voie qui cite une source de style doit vérifier son existence avant de la donner à l'exécutant. Ici `2026-11-10-onglet-finances/index.html` manquait ; règle : `ls` de la source dans le VOIE.md, ou la retirer.
