# Voie etapes — porter son choix des étapes de lecture d'un lien (D448), plus dense

Lis d'abord : ../../COMMUN.md ; work/missions/maquettes-carnet/CHOIX.md (SON CHOIX, fait foi, écran par écran) ; ouvre CHAQUE image citée
(work/missions/maquettes-carnet/page/img/…) et les maquettes v01/v03/v05/v06.html utiles ; DEFAUTS-RECURRENTS lignes IA-ETAPES-VISIBLES et
CARNET-ETAPES-DENSE (work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md) ; .claude/rules/affinee-frontend.md ; docs/ui-compacte.md ; DESIGN.md (parties utiles).
Charge les skills boosters-ux et impeccable avant de dessiner.

Règle n° 1 : sa maquette choisie est la base, reprise telle quelle par écran ; rien d'ajouté qu'il n'a pas choisi, rien de retiré qu'elle a.
Plancher à enrichir pour la densité seulement : PLUS SERRÉ que les maquettes (ses mots : « ça manque un peu de compact, c'est pas assez dense »).

## À faire
1. Les 5 écrans de CHOIX.md dans le vrai Carnet (src/ui/carnets), dans le style de l'app (jamais celui d'un exemple) :
   Début = fusion v05+v06 ; Milieu = v03 ; Barre repliée = v01 plus compacte (l'app peut se fermer) ; Fin à la réouverture = fusion v01/v03/v05 ;
   Échec = fusion base+v03 avec bouton « Escalader » (relance avec `escalade:true`, voir contrat de MISSION.md). Pas le « Garder HT / Prendre TTC » de v06.
   Libellé de l'étape bloquée : « page bloquée, lue par Google ».
2. Le flux : `appelsReels.lire` passe par `AiClient.runFlux` (src/services/aiClient.ts) avec un jeton tiré par l'app (16–64 car. [A-Za-z0-9_-]),
   gardé sur l'appareil tant que la lecture n'est pas finie ; à la réouverture, rappel `{jeton, reprise:true}` et affichage de l'état
   (fin retrouvée, ou étapes en cours). Format serveur : functions/src/lecturesLiens.ts (ne pas le modifier). Retire le TODO de rangement.ts.
3. Banc : `lireLienSimule` (src/domain/carnets/iaSimulee.ts) émet les étapes une à une (lent, douteuse, bloquée, échec) pour `?preview=carnets`.
4. T26-4 (BUGS.md) : un lien introuvable (lien mort) → statut « introuvable » dit, sans article gardé dans la liste ni dans le compte, sans
   suggestion de déplacement. Test rouge d'abord sur la version actuelle, puis vert.
5. Contrôle `scripts/controles/controle-etapes-dense.mjs` : mesure à 390 (banc local) la hauteur de la barre repliée et des lignes d'étape contre
   docs/ui-compacte.md ; doit ÉCHOUER sur work/missions/maquettes-carnet/v01.html (barre repliée) et PASSER sur l'app.

## Critères (le pilote les rejoue)
- `npx tsc --noEmit -p .` → 0 erreur ; `npx vitest run tests/unit/carnets` (et tes nouveaux tests) → verts.
- `node scripts/controles/controle-etapes-dense.mjs` → « OK » sur l'app, « KO » sur v01.html (témoin négatif).
- Captures à 390 (serveur `npm run dev` ou banc `?preview=carnets`, Chrome 9222) de chacun des 5 écrans + T26-4, chacune posée côte à
  côte avec l'image de sa maquette choisie (planche PNG dans ton dossier `captures/`), toutes ouvertes ; liste « écarts avec la maquette » = 0 non voulu.
- Aucun appel Gemini réel dans cette voie.

OWNS : src/ui/carnets/** sauf FicheArticle.tsx et fiche-article.css ; src/domain/carnets/** ; src/services/aiClient.ts ; src/design/CarnetsPreview.tsx ;
tests/unit/ (fichiers carnets que tu crées ou touches) ; scripts/controles/controle-etapes-dense.mjs ; ton dossier de voie. maxTurns 120.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre) : après chaque étape finie, une ligne (fait, preuve, commit).
- Tests : sortie écrite dans un fichier, jamais dans le contexte : `npx vitest run <fichiers> --reporter=dot > voies/etapes/tests.log 2>&1; tail -5 voies/etapes/tests.log`.
