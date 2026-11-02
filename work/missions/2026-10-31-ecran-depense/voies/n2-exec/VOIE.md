# Voie n2-exec — la série mécanique de n2 (build, sonde, bout en bout, captures)

Agent : `executant` (Haiku). Plafond : 40 tours. Aucun commit, aucun déploiement, aucun appel réseau hors localhost, Gemini
toujours simulé. Aucune autre voie n'écrit dans `src/` pendant la tienne.

## Ce que tu fais
Exécute, dans l'ordre, la section « DEMANDE EXECUTANT » de `../n2-pages/RESULTAT.md` (points 1 à 4). Elle donne chaque commande
et le résultat attendu. Règles en plus :
- Une commande à la fois. Jamais vitest et le banc ensemble (la garde mémoire du banc coupe sous 2,2 Go libres).
- Le banc dure plusieurs minutes : lance-le en arrière-plan avec sa sortie dans un fichier, puis attends par une boucle courte
  sur ce fichier (`until grep -q … ; do sleep 20; done`, 15 min au plus). Jamais `( … ) &` dans une commande d'arrière-plan.
- Sonde E0 : si démarrer l'émulateur seul échoue deux fois, écris « Sonde E0 : non jouée — <raison> » et continue.
- Le seul changement de code permis : la qualité 0.55 du canvas lourd dans `casePages` (`scripts/check-invoice-journey-emulator.mjs`),
  et seulement si une page lourde dépasse 4 Mo. Rien d'autre dans `src/`, `scripts/`, `functions/`, `tests/`.
- Ouvre chaque capture demandée en image (Read) avant de la décrire (L12) ; décris ce que tu vois, côte à côte avec sa référence.

## Possède
`work/missions/2026-10-31-ecran-depense/voies/n2-exec/**`, `work/missions/2026-10-31-ecran-depense/voies/n2-pages/bout/**`.
Ne modifie pas `../n2-pages/RESULTAT.md` : tout ce que tu trouves va dans `RESULTAT.md` de ce dossier.

## Rendre
`RESULTAT.md` ici : les sorties (exit du build ; code HTTP et corps de la sonde ; par groupe et par largeur, les lignes `OK`/`KO`
du rapport et le compte `hmr update|page reload` ; les mesures `assemblage-pages-cpu-x4-ms` et `pages-lourdes-octets` ; les
captures décrites et leurs écarts). Puis une ligne `N2-EXEC OK — …` (build vert, 0 KO partout, 0 hmr) ou `N2-EXEC ECHEC — …`.
