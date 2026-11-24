# Dossier modele — test par modèle de la frise rouge

- Relecture indépendante (voies/relecture-frise/RESULTAT.md : lis ses sections contre-exemple et verdict) : ETAT_RUNS=200 rouge dès la 5e suite sur fd27f22e5 : I1 « 5 ans » ≠ cadre 269,6 sem., graine -2119159308. Aucune des 26 fonctions de l'inventaire perdue.
- Cœur : src/ui/calendrier/cadre/etat.ts (réducteur), useCadre.ts ; src/domain/calendrier/temps.ts (d3). Test : e2e/calendrier/etat-coherent.spec.ts ; Playwright dans la copie lot-cal (node_modules complets ; avance-la d'abord : `git -C ../lot-cal merge --ff-only claude/refonte-houblons-v4`).
- Aussi ouverts au registre (BUGS.md) : T32-1 « l'en-tête de période ne suit plus la frise », T29-6 « barre tenue au bord posée hors du cadre et hors de vue », reste de T29-2, T29-8.
- Objectif du brasseur : « ce que j'avais avant mais robuste, fonctionnelle et sans bug ».
