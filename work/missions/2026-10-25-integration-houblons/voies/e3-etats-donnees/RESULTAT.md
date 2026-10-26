OK — 29 états mis à jour avec preuve ; ETATS OK (138/138) sur deeb4d23 ; un état rangé « en attente » (? →), un défaut ★ signalé

Rejeu fait sur la maquette reconstruite depuis deeb4d23 (s1 + t1), `prototypes/houblons-v4/maquettes/parcours-e3b` (dossier ignoré par git).

## Critères
- `controle-etats.mjs` (construite, deeb4d23) : `ETATS OK (138/138) ; 15 voulu(s) non rejoué(s) ; 1 en attente de son choix : etat-dryh-avant-inconnu (…)` (final-construite.txt). Avant la voie : ETATS ECHEC (29/139).
- `controle-etats.mjs --choisie` (témoin sur ses maquettes choisies) : `ETATS OK (138/138)` (final-choisie.txt). Inchangé : les maquettes choisies gardent leurs anciennes valeurs (`verif.choisie`).
- `controle-radar-base.mjs` : `RADAR-BASE OK (9 vues)`. `controle-fonctions-rail.mjs` : `FONCTIONS-RAIL OK (37/37)`, sur la même maquette.
- Aucun état mis à jour sans capture avant et après regardée et sans note : chaque état porte `verif.note` (raison + chemin de la paire de captures).

## Méthode (preuve)
- Base « avant » : commit 98fac6b2 reconstruit hors de l'arbre : `ETATS OK (139/139)`, captures dans `captures/avant/`. Idem sur 9639a114 (juste avant e2+d4) : 139/139. Sur ca7e1afd (e2+d4) : les mêmes 29 échecs. Cause : e2 (moteur de Substituer v2, D86) et d4 (descripteurs de 12 sources, D83). Ce commit ne touche aucun fichier de src/ui hors moteur et données.
- `captures/apres/` = HEAD d'avant deeb4d23 ; `captures/apres-s1t1/` = deeb4d23 ; `captures/paires/<id>.png` et `captures/paires-s1t1/<id>.png` = avant et après côte à côte (ouvertes une à une) ; `captures/zoom/` = deux recadrages ×3 (le ★).
- `maj.mjs` (29 états) et `maj2.mjs` (3 états, après deeb4d23) écrivent les valeurs ; `textes/<id>.txt` = texte lu après le geste (diagnostic, `etats-texte.mjs`).

## Classement des 29 échecs : tous « donnée », aucun « dessin » régressé
Pour chacun : mêmes blocs, même ordre, mêmes éléments ; seuls des mots, nombres ou noms de données diffèrent.

| États | Ce qui a changé (donnée) |
|---|---|
| etat-etape-analyse, etat-biere-repos | décompte « 6 au style · 5 non situées » → « 10 au style · 1 non située » (Noyau, Pépins, Baies, Végétal décrits par d4) ; attendu « non située » |
| etat-sugg-assembler, etat-acquis-q2b-suite-s5 | noms des candidats du moteur : Motueka + Hallertau Blanc / Galaxy, Boadicea à la place de Columbus |
| etat-fiche-appui-long-citra, etat-acquis-fiche-citra-cryo | le moteur ne propose plus « Citra cryo » parmi les ajouts rapides (Hallertau Blanc, Wild Wolf). La fiche courte est la même (paires regardées : radar, « Lui seul », matrice, Comparer, onglets) ; l'appui long se joue après avoir tapé « cit » dans « Ajouter — houblon… » (`avant: ["etape:etat-etape-champ-ajouter"]`) |
| 13 états de Substituer (repos, échelle, plage, face, α, aromes, radar, β, style, actions, lire, + huiles) | Magnat n'est plus premier (Yeoman 100, 37–50 g, α 12–16, β 4–5, « Ajouter Yeoman aux achats ») ; Helios remplace Zenia ; aucune plage hachurée ne reste (tous les candidats sont complets) : la ligne « Altus, Trident, Zenia vont de 78 à 99 », le paragraphe « La plage » et l'aria « plage, une composante inconnue » ne s'écrivent plus ; les douze familles sont décrites donc la note « Noyau, Pépins, Baies, Melon, Végétal : aucune des trois fiches… » disparaît (leurs lignes existent) ; « Fiches lues : Nugget 10, Yeoman 1, Nelson Sauvin 9 » |
| 12 états de Dryhopper | Idaho 7 décrit sur plus de familles : floral ~+29 (avant ~+22), ★ passe de 2 j à 1 j (« actif · 1 j »), la ligne « contre ★ » ajoute Baies, douze lignes de barres avec Noyau ~+15, Pépins ~0, Végétal ~+9 |

### Compte de mots (« 98 pour 96 », etat-dryh-repos)
Hausse due aux DONNÉES, pas à un texte ajouté : Pépins affiche « ~0 » et Végétal « ~+9 » là où il y avait « ? » (un « ? » n'est pas compté comme mot, un nombre oui) : +2. « ?→~+8 » (un mot) devient « ~+15 » (un mot) : 0. `max_mots` : 98 pour la construite, 96 gardé pour la choisie.

### Cas à part
- **etat-dryh-jour-1** : ★ est maintenant à 1 j, jour déjà choisi à l'ouverture, donc toucher « 1 j » ne changeait plus rien (« geste sans effet »). Rejoué depuis 7 j (`avant: ["etat-dryh-jour-7"]`) ; « contre ★ » ne s'écrit pas au moment ★ (`interdit`). Maquette choisie (★ à 2 j) : inchangée.
- **etat-dryh-avant-inconnu** : plus montrable. Aucune famille de la bière « avant » n'est inconnue avec Idaho 7 : « ? → » ne s'écrit plus. Rangé `attend_choix` (compté à part, nommé dans la dernière ligne du contrôle), pas supprimé ni affaibli.
- **etat-subst-plage** : garde « tout connu » et les nouveaux points ; la plage hachurée n'est plus jouée (voir DÉCISION).

## Après deeb4d23 (s1, t1) : trois états de plus lus autrement, dessin voulu
Rejeu sur la maquette reconstruite : un seul échec (etat-subst-beta), et deux états qui passaient par coïncidence (un nombre présent ailleurs dans la page). Notés « dessin voulu, pas une régression (s1, exigence du brasseur du 26.10 ; t1, D160) » dans `verif.note`, captures avant/après regardées (`captures/paires-s1t1/`) :
- etat-subst-beta : légende « une source chacun (Beer Maverick, Hopsteiner) » → « un par plage qui diffère (des sources d'accord n'en font qu'un, leurs noms au survol) » ; Nugget β 3–8.
- etat-subst-alpha : Nugget 9–16, Nelson Sauvin 10–14,5 (compléments de d4), un trait fin par plage.
- etat-subst-huiles : Nugget myrcène 27–60 (un trait par plage sous chaque barre).
- t1 : « fresh crushed herbs » → « herbes fraîches écrasées », « white grape » → « raisin blanc » dans les bandeaux « lui seul » : aucun attendu n'en dépend.
Les autres états de Substituer n'ont pas bougé de dessin.

## Fichiers écrits
- `work/refonte-frontend/v4/choix/etats/{etape,biere,fiche,suggerer,acquis,substituer,dryhopper}.json` : `verif.attendu` (nouvelles valeurs), `verif.choisie` (anciennes valeurs, jouées sur la maquette choisie), `verif.note` ; `comparer.json` inchangé.
- `work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs` (hors de mon « Possède », raison écrite en tête du fichier, effet nul sans les nouveaux champs) : (1) `verif.choisie` prend le pas sur `verif` en mode `--choisie` : sans cela, mettre à jour un attendu de donnée rendait le témoin positif rouge (la maquette choisie est une page statique aux données de son jour) ; (2) `avant` accepte « fichier:état » (un état d'un autre fichier), pour la fiche Citra cryo.
- Dans la voie : `maj.mjs`, `maj2.mjs`, `cotecote.mjs`, `zoom.mjs`, `etoile.mjs`, `etats-texte.mjs`, `textes/`, `captures/`, sorties `*.txt`.

## Essais
1 passe de classement, 1 de mise à jour (29 états : 138/138 du premier coup), 1 reprise après deeb4d23 (1 échec, 2 attendus affinés). Un défaut : mon premier rejeu `--choisie` n'était pas encore relancé après la mise à jour ; relancé, 138/138.

## DÉCISION À PRENDRE
1. **Défaut de dessin hors contrôle : ★ recouvert par l'anneau de la courbe.** Dryhopper à 1 j : floral ~+29 touche le haut du graphique, un cercle du trait du doigt est sous le centre du ★ (mesuré par `etoile.mjs` : `elementFromPoint` = `circle`, au lieu de `text.pq-dry-etoile` avant) ; le ★ du rail ne se voit plus quand le moment tenu est le meilleur (captures/zoom/etat-dryh-repos.png). Le mot ★ reste lu dans la pastille « ★ actif · 1 j », donc le contrôle ne le voit pas. Correction possible dans src/ui/hopIndex/dryhopper/index.tsx (hors de ma voie) : dessiner le ★ après les anneaux ou lui laisser sa place au-dessus du haut de l'échelle. Recommandation : corriger avant de montrer Dryhopper.
2. **Deux éléments choisis ne sont plus exercés par la fixture** : la plage hachurée de Substituer (code et légende présents, mais aucun candidat de Nugget à 60′ n'a de composante inconnue) et « ? → » de Dryhopper (etat-dryh-avant-inconnu). Options : une fixture ou un original qui les exhibe (Substituer d'un houblon peu décrit ; Dryhopper sur un houblon dont la bière « avant » a une famille inconnue), ou accepter. Recommandation : ajouter un état de Substituer sur un original peu décrit.

CONNAISSANCE : avec les descripteurs de d4, la fixture n'a plus d'inconnue (Substituer sans plage, Dryhopper sans « ? → ») ; un contrôle d'états qui compte sur ces cas doit se donner sa propre fixture.
LEÇON PROPOSÉE : un « attendu » mesuré sur une page choisie statique et rejoué sur une page construite aux données courantes doit être séparé dès l'origine (`verif.choisie`) ; sinon chaque changement de données rend le témoin positif ou la construite rouge. Et un nombre attendu peut passer par coïncidence : le chercher dans la zone de l'état, pas dans toute la page.
