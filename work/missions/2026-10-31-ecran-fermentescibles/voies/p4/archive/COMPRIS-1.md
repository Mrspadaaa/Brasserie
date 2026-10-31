# Compris — voie p4 (r4d, les gestes sur la ligne)

## Objectif
Produire `v3/r4d/etat.html`, copie de `v2/r4c/etat.html`, où modifier une masse, retirer une ligne et ajouter un ingrédient se font directement sur la ligne, sans ouvrir le plateau ; toucher le nom d'une ligne ouvre son détail (le plateau de r4c). Tout le reste de r4c reste identique.

## Écrit dans
- `work/missions/2026-10-31-ecran-fermentescibles/v3/r4d/` (dossier : copie de r4c, puis `etat.html`, `NOTE.md`, `capturer.mjs` adapté, captures)
- `work/missions/2026-10-31-ecran-fermentescibles/voies/p4/RESULTAT.md`

## Fini quand
- G1 : les quatre gestes (modifier, retirer, annuler, ajouter/doublon) passent au repos et en `#replie`, à 390 et à 1280 ; le contrôle `controle-gestes-ligne.mjs` affiche `GESTES OK`.
- G2 : le témoin négatif, la même vérification sur `v2/r4c/etat.html`, échoue toujours (`ECHOUE OK`).
- G3 : la page se rend sans erreur (`verifier-page.mjs`, `PAGE OK`).
- G4 : au plus 80 mots au premier écran (`MOTS OK`).
- G5 : le cadre commun d'Identité tient, couleurs exceptées comme r4c (`COMMUN OK`).
- G6 : contraste conforme (`CONTRASTE OK`).
- G7 : hauteur conforme (`HAUTEUR OK`).
- G8 : `capturer.mjs` se relance sans erreur, rien de tronqué (`CAPTURES OK`).
- Le livrable est `NOTE.md` (gestes un par un, capture de chacun, sorties des contrôles, phrase prédite du brasseur) et `RESULTAT.md` ; la réponse finale est une ligne `OK — r4d : …` ou `ECHEC — …`.

## Ne fait pas
- Ne touche pas `v2/r4c/` ; ne modifie ni `VOIE.md` ni `GATES.md`.
- Ne change pas le ticket, le plateau clair, la piste, la carte des repères, la teinte en dégradé, l'OG « — » tant qu'un potentiel manque, le sucre en ligne, la fermentabilité par famille, l'alerte du lactose, « Créer « X » », l'ajout à 0 sans surbrillance, ni l'annexe des états hors du premier écran.
- Ne corrige pas les deux notes de t3 (carte des repères qui se replie seule, piste d'OG sans curseur).
- Pas de `type="number"`, pas de liste en tableau de boutons (pas de cockpit), pas de dialogue de confirmation au retrait.
- Pas de captures autres que celles listées (D207) ; n'écrit nulle part ailleurs.

## Doutes
- « Ancre » (repos « sans ancre », `#replie`) : je comprends un fragment d'URL, mais le texte ne le dit pas explicitement.
- Durée de « Annuler » : « quelques secondes », sans chiffre.
- Taille et forme exactes de la cible de retrait : « 24 px au moins, discret » ; l'aspect visuel n'est pas décrit.
- Les « deux notes de t3 » et le contenu de « ticket », « plateau clair », « carte des repères » : je ne les connais que par leur nom ; le détail est dans `v2/r4c/`, que je n'ai pas ouvert.
- Le contenu exact de `NOTE.md` (la « phrase prédite du brasseur ») et du passage « doublon mène à la masse de sa ligne » : pas de format donné.
- G2 : la forme `systeme.mjs echoue "GESTES ECHEC" -- …` ; je ne sais pas ce que `echoue` vérifie exactement.
- Le plafond de tours de la voie est 40 ; le test de compréhension a 10 tours. Rien à faire de ce côté.
- Je n'ai pas lu les fichiers cités (`capturer.mjs`, `controle-gestes-ligne.mjs`, `VERDICTS-v2.md`, `NOTE.md` de r4c) : seulement VOIE.md et GATES.md, comme demandé.
