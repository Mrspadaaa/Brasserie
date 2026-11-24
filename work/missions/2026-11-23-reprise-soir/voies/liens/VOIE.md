# Voie liens — petits défauts de la lecture des liens (T25-8, T26-1, T26-2, T26-3) et option escalade

Lis : ../../COMMUN.md ; lignes T25-8, T26-1, T26-2, T26-3 de work/missions/BUGS.md ; work/missions/2026-11-23-carnet-en-ligne/tour26/RAPPORT.md et
ses captures L6-fiche.png, L1-fiche.png, B6-fiche.png ; REPRISE-FIX.md de la branche claude/fix-t25 si utile (`git show claude/fix-t25:<chemin>`).
Code : functions/src/lireLien.ts, lienIA.ts, carnetIA.ts, lienBloquee.ts ; src/ui/carnets/FicheArticle.tsx. Banc : `npx tsx scripts/banc-liens.ts`
(63 liens ; voir son en-tête pour le mode sans IA).

## À faire
1. T25-8 / T26-1 (Galaxus) : libellés de caractéristiques en français (table des clés connues ; ou l'IA déjà appelée les rend en français
   dans le même appel, aucun appel en plus) ; longueur du câble jamais présentée comme dimension ; Volume 242 l repris (« Nutzvolumen Gesamt »).
2. T26-2 : « Non publié par le vendeur : Volume » seulement si le volume a un sens pour l'article (jamais pour un houblon, une levure, un
   consommable) ; si la page le donne, il est repris.
3. T26-3 (photo brouwland absente, sans mention) : si la photo n'est pas lisible (page bloquée lue par Google), le dire sur la fiche (« photo non lue »).
4. Option `escalade` (contrat de MISSION.md) : `context.escalade === true` → lecture neuve, étape IA directement en Hydrogen (modèle fort),
   détail d'étape « modèle fort » ; coût réservé avant envoi comme l'existant. Test unitaire (IA simulée). Si le passage du champ exige
   functions/src/ai.ts ou lecturesLiens.ts, fais le changement minimal (une ligne qui transmet `escalade`) et signale-le dans RESULTAT.md.
Chaque défaut : test rouge sur le code actuel (fixture de la vraie page, anonymisée si besoin, tirée du banc), puis correction, puis vert.

## Critères
- `cd functions && npx tsc --noEmit` et `npx vitest run` des tests touchés → verts ; `npx tsc --noEmit -p .` à la racine → 0 erreur.
- Banc sans IA : aucun recul sur les 63 liens (nom, prix, photo) par rapport aux résultats du 23.11 ; chiffres avant/après dans RESULTAT.md.
- Appels Gemini réels : 0 de préférence ; au plus 6 liens rejoués avec IA (≤ 0,10 CHF), estimés avant, journalisés.

OWNS : functions/src/** (lecturesLiens.ts et ai.ts : changement minimal seulement) ; functions/test* ; src/ui/carnets/FicheArticle.tsx ;
src/ui/carnets/fiche-article.css ; ton dossier de voie. maxTurns 100.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre) : après chaque étape finie, une ligne (fait, preuve, commit).
- Tests : sortie écrite dans un fichier, jamais dans le contexte : `npx vitest run <fichiers> --reporter=dot > voies/liens/tests.log 2>&1; tail -5 voies/liens/tests.log`.
