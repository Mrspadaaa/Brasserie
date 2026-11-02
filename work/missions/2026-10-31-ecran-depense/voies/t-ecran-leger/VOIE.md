# Voie t-ecran-leger — test d'écran léger avant le déploiement (D363, D342, D344)

Agent : `critique` (Fable), neuf. Plafond : 15 tours. Tu ouvres les images par lots de six, en un seul message.

## Pourquoi léger
Mots du brasseur (SPEC-BRASSEUR, 02.11, soir) : « Allège les test, passe à l'implémentation, puis teste Legé puis testé bout en bout sur la vrai app ».
Le vrai test viendra après, sur l'app en ligne. Ici : 12 captures, la question D344, rien d'autre.

## La question (D344)
Pour chaque capture : « combien et quels problèmes il y a ? », en liste numérotée. Regarde comme le brasseur : est-ce pratique, à sa
place, est-ce que ça réagit juste ? Calibrage : `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`.

## Les captures
Version à déployer : **SHA**. Elle porte son ticket Bauhaus (lot g, g7-reste) et le port de son choix pu4d pour le détail d'une
ligne ouverte (`voies/p-port-pu4d/RESULTAT.md`), avec la greffe de pa1d : sur une ligne hors stock, « article — · hors stock + Suivre au stock ».
Sa maquette : `plateau/v3/pu4d/pu4d-*.png` ; la greffe : `plateau/v3/pa1d/pa1d-c.png`.

Au banc : `C:/Users/mrspa/AppData/Local/Temp/deploy-hosting-qr/work/missions/2026-10-31-ecran-depense/voies/g1-audit/`, dossiers `leger-*`.
Choisis-en **12** : deux thèmes, 390 et 1280, 8 états au moins (repos, puces, plié, déplié, plateaux ouverts de plusieurs genres, regroupé,
rétabli). Au moins 6 plateaux, chacun côte à côte avec la capture pu4d du même cas.
Copie-les dans `work/missions/2026-10-31-ecran-depense/avant-deploiement/SHA/`, renommées `<largeur>-<groupe>-<thème>-<n>.png`
(les noms d'origine portent ses produits).

## À voir en particulier
1. Le plateau ouvert reprend pu4d : même ordre, mêmes champs, rien de l'ancien formulaire en plus (D346).
2. Ligne hors stock : « Suivre au stock » présent (D361).
3. Unités : la pièce offerte (D353) ; aucun menu déroulant dans le plateau (D350).
4. Le détail ne nomme aucune autre ligne (D355).
5. Regrouper discret, Rétablir présent (D357). Détail égal au total (D358).

**Bloquant** : une régression contre la version en ligne, ou ce qui empêche d'enregistrer juste une dépense. Un défaut déjà en ligne, non
aggravé, se compte et se nomme sans bloquer.

## Rendre
`avant-deploiement/SHA/VERDICT.md`, au format que lit `node scripts/agents/controle-avant-deploiement.mjs SHA` :
`Version : SHA` sur sa ligne ; le tableau `| capture | thème | largeur | état | problèmes | bloquants |` (une rangée par capture copiée,
thème `clair`/`sombre`, largeur `390`/`1280`, nombres) ; la liste numérotée sous le tableau ; `Bloquants : <n>`.
Pas de « Pilote : vu ». Aucune valeur de ses pièces : ni article, ni fournisseur, ni montant.

Une ligne : `OK — <n> captures, <n> problèmes, <n> bloquants` ou `ECHEC — <raison>`.
