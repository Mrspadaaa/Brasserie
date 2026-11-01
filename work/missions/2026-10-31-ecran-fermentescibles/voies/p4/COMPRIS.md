# Compris : voie p4 (r4d, les gestes sur la ligne)

## Objectif
Je livre `v3/r4d/etat.html`, copie de `v2/r4c/etat.html`. Sur la ligne, je rends possibles modifier une masse, retirer une ligne et ajouter un ingrédient, sans passer par le plateau. Toucher le nom d'une ligne ouvre son détail (le plateau de r4c). Le reste de r4c ne change pas.

## Écrit dans
- `work/missions/2026-10-31-ecran-fermentescibles/v3/r4d/`
- `work/missions/2026-10-31-ecran-fermentescibles/voies/p4/RESULTAT.md`

## Fini quand
- G1 : les quatre gestes (modifier, retirer, ajouter, détail au nom) passent au repos et en `#replie`, à 390 et à 1280 (`GESTES OK`).
- G2 : le témoin négatif r4c échoue toujours (`ECHOUE OK`).
- G3 : la page se rend sans erreur (`PAGE OK`).
- G4 : 80 mots au plus au premier écran (`MOTS OK`).
- G5 : le cadre commun tient, couleurs mises à part comme r4c (`COMMUN OK`).
- G6 : contraste (`CONTRASTE OK`).
- G7 : hauteur (`HAUTEUR OK`).
- G8 : les captures se refont sans erreur (`CAPTURES OK`).
- Il faut aussi `v3/r4d/NOTE.md` et `RESULTAT.md` au format de l'agent.

## Ne fait pas
- Ne pas toucher `v2/r4c/`, ni rien en dehors de `v3/r4d/` et de `voies/p4/RESULTAT.md`.
- Ne pas modifier VOIE.md ni GATES.md.
- Ne pas changer ce que r4c garde : ticket, plateau clair, piste, carte des repères, teinte en dégradé, OG « — », sucre en ligne, fermentabilité par famille, alerte du lactose, « Créer « X » », ajout à 0 sans surbrillance, annexe des états.
- Ne pas corriger les deux notes de t3 (carte des repères qui se replie seule, piste d'OG sans curseur).
- Pas de `type="number"`, pas de dialogue de confirmation au retrait, pas de tableau de boutons dans la liste.
- Pas de push, pas de déploiement, pas d'appel Gemini réel.

## Doutes
- Le texte des deux notes de t3 n'est pas dans VOIE.md ; je ne sais que ce qu'il ne faut pas corriger.
- « Entrée valide » : la consigne ne dit pas comment valider une masse au téléphone sans la touche Entrée (sortie du champ ou autre).
- Le délai de 6 secondes d'« Annuler », le 24 px du retrait et « un nouveau retrait remplace le précédent » sont dans la consigne, mais je ne sais pas si G1 les vérifie : je n'ai pas lu l'en-tête de `controle-gestes-ligne.mjs`.
- Les captures (`r4d-repos`, `r4d-replie`, `r4d-masse-pendant`, `r4d-retrait-apres`, `r4d-detail`, `r4d-1280`) sont listées dans VOIE.md, mais GATES.md ne vérifie que G8 (la capture se fait sans erreur). Qui les ouvre et les regarde n'est pas écrit dans GATES.md.
- Le doublon (« pils ») : la consigne dit qu'il mène à la masse de sa ligne, pas ce qu'il advient de la saisie faite dans le champ d'ajout.
- Je suppose que `v2/r4c/etat.html`, `NOTE.md` et `capturer.mjs` existent (dépendance t3).
