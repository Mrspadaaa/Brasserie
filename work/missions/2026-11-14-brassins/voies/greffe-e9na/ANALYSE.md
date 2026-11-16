# Greffe e9na : analyse (16.11, nuit)

## Question
e9na couvre-t-elle une vue de l'Atelier qui n'existe pas en ligne, ou en remplace-t-elle une sans toucher aux autres ?

## Ce que montre l'Atelier en ligne (`CreativeLabTab.tsx` = tag `en-ligne/2026-11-15-atelier-lot8`)
Un seul écran « Atelier R&D », trois onglets (`nc-seg`) :
1. **Matériel** : `UpgradeWorkspace` (À venir, courbe de caisse fin de mois : kh1r / kyh1 passe 3).
2. **Carnet** : `NoteCarnet` (ks4 : fil de notes, compositeur, rangement IA) ; ses filtres Bières, Contacts, À faire ouvrent `vueBieres`, `ContactsView`, `TodoTimeline`.
3. **Tarifs** : `TarifsFrise` (kxc passe 3, frise des prix pratiqués) ; sous la frise, les idées de tarif gardées et « Réfléchir à mes projets ».

## Ce qu'est e9na (NOTE.md, `Ecrire.tsx` et le CreativeLabTab d'avant l'option B)
e9na est un **Atelier entier**, pas une vue à part : « le carnet que l'IA range ». Un compositeur « Noter en vrac » (`Ecrire`), des tiroirs Bières · Tarifs · Contacts · À faire dans un même carnet, un seul fil de `NoteCarte`, les fiches `FicheIdee` / `FicheContact`, l'essai de prix à curseur (`EssaiPrix`, `CurseurPrix`, « curseur m2 sur le prix de la 33 cl »), et le Matériel **renvoyé vers Rénovation** (« Projets de matériel : dans Rénovation »).

## Correspondance, vue par vue

| Vue en ligne | Ce qu'e9na en fait | Conséquence |
| --- | --- | --- |
| Carnet `NoteCarnet` (ks4) | remplacé par `Ecrire` + fil `NoteCarte` : même fonction (noter en vrac, l'IA range, valider), autre écran | **remplacée** |
| Filtre Contacts `ContactsView` (kc1) | tiroir Contacts + `FicheContact` | **remplacée** |
| Filtre À faire `TodoTimeline` (kd4) | tiroir « À faire » dans le même fil | **remplacée** |
| Filtre Bières `vueBieres` | tiroir Bières + `FicheIdee` (statut en pastille, plus d'avancement) | **remplacée** |
| Tarifs `TarifsFrise` (kxc) | `EssaiPrix` à curseur | **remplacée** |
| Matériel `UpgradeWorkspace` (kh1r/kyh1) | lien « dans Rénovation », plus d'onglet | **retirée de l'Atelier** |
| `NoteCarnet` rangement IA (ks4) | refait dans `Ecrire` + `rangerIA.ts` (lecture locale en repli) | refait ; pas gardés : note brute enregistrée d'abord, note rangée au retour du réseau, case « Convertir en client » (fusion-lot8, doutes) |

Aucune vue d'e9na n'est neuve : toutes ses fonctions (idées, tarifs, contacts, à faire, matériel, noter en vrac) existent déjà en ligne sous un autre dessin. Il n'y a pas de vue libre où la poser.

## Réponse
e9na **ne peut pas se poser sans retirer ou changer** : le Carnet ks4, la frise Tarifs kxc, ContactsView, TodoTimeline et l'onglet Matériel kh1r/kyh1. Or l'ordre donné est de ne rien en retirer, et ces écrans reprennent eux aussi des choix du brasseur (règle n° 1 : aucun ne passe devant l'autre sans lui).

Tenter de coexister (e9na ajouté à côté, par exemple un 4e onglet « Noter en vrac ») donnerait deux carnets, deux rangements IA et deux fiches de contact pour les mêmes données : ce serait une couche parallèle, pas une greffe, et ce n'est pas ce que e9na a été choisie pour être. **Rien n'est greffé.** Les fichiers e9na restent sur disque, ni rendus ni supprimés ; les tests unitaires qui les rendent restent verts.

## Les deux options à montrer au brasseur (en mini maquettes, artefact neuf)
- **Option 1 : l'Atelier en ligne reste.** Matériel (kh1r/kyh1), Carnet ks4, Tarifs kxc tels quels ; e9na est abandonnée ou gardée pour plus tard. Rien ne change pour lui. Perd : e9na (choisie le 15.11, « Atelier : e9na »).
- **Option 2 : e9na remplace l'Atelier.** Carnet unique à tiroirs, essai de prix à curseur, Matériel renvoyé vers Rénovation. Perd : la frise des prix kxc (passe 3), les écrans Contacts kc1 et À faire kd4, et l'onglet Matériel kh1r/kyh1 (courbe de caisse, À venir). Ce que la fusion avait déjà fait ; l'état d'avant l'option B, rangement IA rebranché inclus.
- (Variante intermédiaire, à dessiner si il la veut : e9na pour le Carnet seul, ks4 retiré, en gardant les onglets Matériel et Tarifs en ligne ; elle remplace tout de même le Carnet ks4 et ses filtres, donc elle demande aussi son choix.)

Recommandation : montrer les options 1 et 2 côte à côte avec les captures d'e9na et de l'Atelier en ligne (390), et la variante intermédiaire si elle l'intéresse ; ne rien mettre en ligne avant sa réponse. L'option 1 est la plus prudente et réversible.

On attend le matin.
