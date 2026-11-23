**Q1, périmètre et forme.** Le coût doit suivre la taille de chaque vue, pas une règle unique.
- **Dryhopper a1** reçoit l'entonnoir complet. C'est un écran ouvert (`ecrans.json`), on a déjà eu trois passes, et les 56 v0 ont été jugées « vraiment moins quali » (M14). Il faut donc environ 10 agents de série, un critique, puis les passes 2 et 3, soit 15 agents et une journée environ. Le garde est `controle-panel.mjs` (PANEL OK) avant le tri.
- **La liste de la fiche et la pastille « ~ simulé »** sont deux composants, pas deux écrans. Un seul lot commun suffit : un concepteur Opus, le critique, 2 à 3 mini maquettes par vue, posées dans une vraie carte (L25). Il faut deux contrôles, chacun écrit pour échouer d'abord sur la version actuelle (L13) :
  - fiche : « nommé en premier » répété et mots anglais, alors que la capture `p22-fiche-cascade-liste.png` montre « black currant » ;
  - pastille : un toucher doit rendre quelque chose de visible, alors qu'aujourd'hui on n'a qu'un `title` (D122).
- **Hors lot :**
  - l'entrée de l'analyse, car A, B et C attendent sa réponse ;
  - Levure, car aucun commentaire de lui n'en parle.

**Q2, Substituer.** Son choix « plus du u4 » sert de base (règle n° 1). La « porte » est une construction du conseil. La capture `p22-substituer-repos.png` montre déjà une table « Nugget épinglé », proche de u4. Le premier geste est de mettre, dans le même artefact, u4 en fil de fer et la porte actuelle côte à côte. C'est au brasseur de trancher. Rien n'entre dans `parcours/` tant que le registre marque l'écran « ouvert » (D123).

**Q3, ordre.** Le parallèle est possible, parce que les fils de fer sont des artefacts HTML et que r1 à r5 écrivent dans `parcours/src/ecrans/**`. Chaque voie déclare ses fichiers (OWNS, L17) et aucune n'écrit dans `ecrans.json`, que les reprises modifient. Le calendrier :
- Dryhopper part tout de suite : il ne fait partie d'aucune reprise.
- La fiche et la pastille attendent les captures de r3 et r5. La version 5345f6ad est celle qui a régressé : la prendre pour base reproduirait les pertes.

**Q4, les mots imprécis.** Leur ancrage est `#frame` (`fils-2026-10-24.json`) : l'élément visé est perdu. Pour ne rien lui demander par écrit, on ajoute au même artefact un bandeau de vignettes (les parties candidates de la base v4.9, puis chaque graphe avec une ligne de lecture). Il touche celle qui le gêne. C'est une question posée en mini maquettes, pas en mots, et elle ne bloque rien.

Position : autre voie : entonnoir complet pour Dryhopper seul, tout de suite ; un lot court commun pour la fiche et la pastille après r3 et r5 ; Substituer et les mots imprécis montrés dans le même artefact, au brasseur de trancher.

LEÇON PROPOSÉE : un commentaire ancré sur `#frame` perd son endroit. À la réception, noter l'élément touché (capture et sélecteur) avant de répondre « je m'en occupe ». Sources : fils 0cd4fb46, de0e8403 et bce5b403.
