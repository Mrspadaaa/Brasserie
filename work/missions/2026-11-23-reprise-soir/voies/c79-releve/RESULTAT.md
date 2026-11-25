RELEVE 12 carnets ; EXA encore là 9/11 9c0e91e0e8d28c54

# RESULTAT c79-releve : vrais documents des carnets ZZ des EXA, au tour 79 (25.11)

- Où : https://brasserie-l-affinee.web.app, paquet servi `index-BrnEjugj.js` (tour 79, c78-fix). Service worker contourné. Chrome de débug 9222, onglet à moi, 390 × 844 au toucher ; fin par page.close() puis disconnect.
- Tests : sans objet (relevé et test d'écran en lecture seule). Le DOSSIER prime sur le VOIE.md : aucune ligne n'est versée à BUGS.md, aucun geste qui écrit.
- Lecture seule : la garde bloque tout POST de fonction ou d'IA et toute écriture Firestore. Bilan : 0 écriture tentée, file `mutations` d'IndexedDB à 0 avant et après, 0 appel IA. Les seuls POST bloqués sont ceux de l'app au chargement (syncFinancialLedger, getBrewerActivity). Les gestes qui écrivent restent refusés par la garde. Les seules touches jouées ouvrent des vues : la liste, un carnet, la feuille ⋯ (fermée par Échap), la bande Résolus, Le fil et l'onglet À faire.
- Données identiques : oui. Cache Firestore relu avant et après, 4 162 documents, empreinte `9c0e91e0e8d28c54` les deux fois, 0 document modifié.

## Fixtures : tests/fixtures/c79/<nom>.json
- Format : { _releve, carnet, messages, articles, taches, propositions, plan }.
- Les 12 carnets : les 11 du tableau d'exemples-a cités par un EXA, plus la pompe, que citent EXA-3 et EXA-4.
- Anonymisation : 152 ids remplacés par des alias stables, communs aux 12 fichiers (`CARNET-c79-nn`, `MSG-`, `NOTE-`, `ART-`, `CRIT-`, `FACON-`, `TACHE-`, `EVT-`). Aucun champ de personne, d'email ou d'uid.
- Aucun document de ses carnets n'est versé : ses deux carnets touchés par nos phrases n'apparaissent que comme alias (`CARNET-c79-06` pour Chambre froide, `CARNET-c79-14` pour le Planning). Aucun plan lié.

| Fichier | msg | notes | art. | crit. | façons | tâches | état |
|---|---|---|---|---|---|---|---|
| zz-pompe-qui-chauffe | 4 | 3 | 0 | 0 | 0 | 0 | problème · résolu |
| zz-malt-pilsner-en-rupture | 5 | 3 | 0 | 0 | 1 | 0 | problème · résolu |
| zz-trop-de-vapeur-au | 9 | 4 | 2 | 0 | 2 | 0 | problème · décidé |
| zz-co2-qui-baisse-vite | 5 | 4 | 0 | 0 | 1 | 0 | problème · décidé |
| zz-frigo-de-garde-en | 5 | 1 | 0 | 0 | 0 | 0 | problème · je cherche |
| zz-levure-lente-a-demarrer | 5 | 1 | 0 | 1 | 1 | 0 | problème · résolu |
| zz-inspection-electrique-fusible | 5 | 3 | 1 | 0 | 0 | 0 | problème |
| zz-ecoulement-qui-fuit | 6 | 6 | 0 | 0 | 0 | 0 | problème · je cherche |
| zz-assurance-a-renouveler | 5 | 4 | 0 | 0 | 0 | 1 | mémo · noté |
| zz-fete-de-la-biere | 4 | 1 | 0 | 0 | 0 | 0 | idée |
| zz-ranger-la-cave | 4 | 3 | 0 | 0 | 0 | 1 | mémo · noté |
| zz-odeur-de-soufre-dans | 4 | 4 | 0 | 0 | 0 | 1 | problème · décidé |

## Chaque EXA au tour 79 (captures 390 ouvertes, dans cap/)

1. **EXA-1 (B) : tient encore.** Testé sur 4 carnets : vapeur, CO2, écoulement et soufre (E03, E04, E08, E12-feuille). Dans la feuille ⋯ d'une note, « Modifier » est à y −1 et « Changer en façon » à y 51, cachés sous « Tout » et « Carnets 32 » (`elementFromPoint`). Seuls « Changer en critère », « Déplacer » et « Supprimer » restent touchables.
2. **EXA-2 (B) : tient encore, prouvé par le code et la donnée, pas par le geste.** Supprimer écrit, donc le geste n'a pas été rejoué.
   - Code du tour 79 : `supprimerLigne` (operations.ts:563), inchangé depuis 1d5cb0cfa. Il retire le message entier quand il ne lui reste plus d'effet, sans avertir (ecransCarnet.tsx:250).
   - Donnée : la bulle « Fûts déplacés dans la chambre froide en attendant. » est affichée dans le fil du frigo ZZ (E05-haut, sans ⋯). Sa note vit pourtant dans son carnet « Chambre froide » (`depuis` = frigo, effet = Chambre froide). La supprimer là-bas l'effacerait du frigo, sans avertissement.
   - La note « À sentir… » d'origine n'existe plus ni dans le frigo ni dans le soufre. Seule reste la copie mêlée du 25.11, décrite en EXA-8.
3. **EXA-3 (m) : non rejouable.** Le malt a été refait à la main au tour 78 : il est maintenant Problème · Résolu, retenu « Autre fournisseur · +4 CHF le sac » (F02-haut). L'état ancien format n'existe plus en ligne ; il est dans tests/fixtures/c75/zz-malt-pilsner.json. Ce qui reste vrai dans la donnée : `taches` est vide, donc « Brassin du 3 déc. à décaler » n'a jamais été proposé en tâche.
4. **EXA-4 (m) : tient encore, sur la levure.** Les 4 autres carnets ont été nettoyés à la main. La levure garde le critère né d'une phrase « réhydrater la levure, ensemencer à 18 °C. » (origine « locale », `caracteristique` température). Ce critère n'est affiché nulle part et aucune carte Reclasser n'est proposée (F06-haut).
5. **EXA-5 (m) : tient encore.**
   - CO2 : la façon s'appelle « Pistes : joint du couvercle, raccord gaz ou régulateur. » (E04-haut).
   - Vapeur : « Pourquoi Plutôt un steam condenser sur la cuve : la vapeur est condensée à l'eau froide. plutôt que Première idée : un humidificateur dans la salle. ? » (E03-haut).
6. **EXA-6 (m) : tient encore.** Ces bulles n'ont pas de ⋯ :
   - CO2 « Pistes : … » (E04-haut) ;
   - écoulement « Pistes : joint du siphon… » et « Estimation 150 CHF (exemple). » (E08-haut) ;
   - fête « Liste : tireuse… » et « Budget 1 500 CHF… » (E10-haut) ;
   - soufre, la bulle mêlée (E12-haut) ;
   - frigo « Le 21 nov.… », « Fûts déplacés… » et « Technicien… » (E05-haut).
7. **EXA-7 (m) : tient encore.** La carte Résolu de la levure montre le picto de frigo devant « Pistes : levure sèche… · pas pris ». Le remède « Monté à 19 °C, la fermentation démarre le lendemain. » n'y est pas (F06-haut), alors que la pompe a son « Fermé : … ».
8. **EXA-8 (B) : non rejouable en lecture seule** (Ajouter écrit). Le brouillon ne traîne plus : le champ est vide dans les 11 carnets ouverts, et « va atterrir » n'apparaît nulle part. La séquelle reste dans la donnée : le message « ZZ TÀ sentir à nouveau dans 2 semaines, avant la mise en fût.EST — ranger la cave » est rangé en deux notes du soufre (« Ranger la cave » et « À sentir… »), et le soufre l'affiche toujours (E12-haut).
9. **EXA-9 (B) : tient encore.** La donnée de la tâche « Sentir à nouveau avant la mise en fût » porte `echeance` 2026-11-23 et `precision` « semaine ». La liste la range sous « Cette semaine », sans date. Le carnet soufre ne montre ni la tâche ni sa date (E12-haut).
10. **EXA-10 (m) : tient encore.** On lit « Pourquoi … ? Tes notes ne le disent pas » à trois endroits :
    - CO2, alors que le fil dit « Test à l'eau savonneuse : bulles au raccord gaz. » (E04-haut) ;
    - vapeur (E03-haut) ;
    - malt **Résolu**, alors que la façon porte `raison` « en stock » (F02-haut). La vue Résolus affiche aussi « pourquoi : tes notes ne le disent pas ».
11. **EXA-11 (B) : tient encore.** Les deux tâches portent `echeance` 2026-11-30 et `precision` « mois » : « Ranger la cave le samedi 6 déc. au matin » et « Renouveler l'assurance avant le 31 décembre ». La liste À faire les range sous « Fin du mois ». Aucune date sur la ligne, et la tâche n'est pas visible dans le carnet (E09-haut, E11-haut).

**Encore là : 9 sur 11** (1, 2, 4, 5, 6, 7, 9, 10, 11). EXA-3 et EXA-8 ne sont pas rejouables en lecture seule ; leurs séquelles sont décrites ci-dessus.

## Doutes, non comptés
- D1 : deux de nos phrases de test restent dans ses carnets.
  - « Fûts déplacés dans la chambre froide en attendant. », tapée dans le frigo ZZ le 24.11, est une note de son carnet Chambre froide.
  - « Achat prévu fin du mois. », tapée dans la vapeur ZZ, est une note de son carnet Planning « Achat brasserie… ». C'est la famille C64-8 / R73-20, toujours là.
  - Les retirer est une écriture dans ses carnets : à décider par le pilote.
- D2 : la vue Résolus répète le titre du carnet en « problème » (malt, levure, pompe).
- D3 : « Résolus en 2026 · le dernier en vert » met en vert le même picto, celui de la levure, dans le malt comme dans la levure (F02, F06).

## Fichiers
- Fixtures : `tests/fixtures/c79/*.json` (12).
- Scripts (`outil-cache.mjs` et `releve.mjs` pour le cache, `outil`, `garde`, `liste`, `nav`, `deplier` repris d'exemples-a avec « Ajouter », « Envoyer » et « À faire » refusés en plus, `ecran*.mjs` pour les captures) et captures `cap/` : sur le disque dans ce dossier, hors Git (ignorés par .gitignore : dépôt public).

LEÇON PROPOSÉE : la garde d'un test d'écran filtre par libellé, et un libellé de navigation peut commencer par un mot interdit (« Résolus 2026 : ouvrir la relecture », l'onglet « À faire 9 »). Avant de toucher par CDP brut, vérifier l'`aria-label` exact de la cible, plutôt que d'élargir la garde.
