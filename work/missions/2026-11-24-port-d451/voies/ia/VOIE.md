# Voie ia — l'IA de rangement range un problème, étiquette le fil, propose sans écrire ailleurs (port D451, voie 2)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md, ../../PLAN.md (§ Ce que l'IA de rangement lit et écrit, § Risques 4 et 5), puis DOSSIER.md.
- Prérequis : voie domaine commitée (types `etiquettes`, `rattache`, `propositions` étendues).

## Économie
- Mécanique : aucune.
- Gestes : sans écran ; la carte « rangé pour toi » est rendue par la voie liste.
- IA réelle : aucune dans les tests ordinaires. Un seul test réel facultatif, lancé à la main, 8 rangements au plus
  (0,10 CHF), journalisé dans work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl ; seulement si les functions sont
  déployées par le pilote avec accord ; sinon, rien de réel.

## À faire
1. Plan court en tête de RESULTAT.md : chaque champ neuf du schéma, sa garde client, son repli local, son test.
2. Serveur : schéma et consigne étendus (champs nullables) ; contexte compact étendu, borné.
3. Client : `lireReponse` garde ; `contexteModele` ; IA simulée ; repli local ; règle MESSAGE-RESTE-DANS-SON-CARNET dans
   `destinationDans` (proposition « Rattacher à … ? » au lieu d'une écriture).
4. Mesure : longueur de sortie et du contexte sur 5 messages simulés (journal de la voie) ; estimation du coût, « estimé ».

## Critères
- tsc racine et functions/ : aucune erreur neuve ; tests/unit/carnetsIASuivi*.test.ts verts ; carnetsIA, carnetsRangement,
  carnetsRattacher, c64Regles (C64-8) et c48..c64Regles verts ; `npm run build` vert ; `git status --short` propre hors
  Possède ; commit par chemins ; fin « PRÊT <hash> ».

OWNS : functions/src/carnetIA.ts ; src/domain/carnets/ia.ts, iaSimulee.ts, analyseLocale.ts ; src/ui/carnets/rangement.ts,
rangementCarnets.ts, envoiRegles.ts ; neufs tests/unit/carnetsIASuivi*.test.ts ; assertions D451 des tests existants ; ton
dossier de voie. Ne touche pas modele.ts, operations.ts ni les .tsx. Ne déploie rien.

## Tenue
- RESULTAT.md tenu au fil.
- Tests : npx vitest run <fichiers> --reporter=dot > work/missions/2026-11-24-port-d451/voies/ia/tests.log 2>&1; tail -5 …/tests.log
