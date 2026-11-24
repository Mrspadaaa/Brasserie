# Dossier domaine (voie 1)

Sources : PLAN.md (prime) ; VERDICT § 4 « États et gestes » ; maquettes3/CADRAGE.md (cycle de vie, ce que fait l'IA, ce qui
reste au brasseur) ; maquettes3/src/v01.mjs (les données des 10 écrans : options, jetons, tâches, durées) ;
ETAT-DE-L-ART.md § 3 (états minimaux, fermeture par événement).

Code de départ :
- modele.ts : `lireDonneesCarnet` (l. 392-400) reconstruit l'objet et jette les clés inconnues : c'est le risque n° 1.
  `lireFacon` normalise `etat` ; `statutDe` (l. 447) ; `lireCarnets` cache les archivés (l. 454).
- operations.ts : patron `(etat, args) => Resultat` avec écritures et inverse ; `choisir`, `basculerVeille`,
  `planDepuisChoix`, `planAuCalendrier`, `etatSortie` (réalisé), `archiverCarnet`.
- domaines.ts : `DOMAINES`, `domaineDe`, `categoriePlanning` (note « (Planning, …) »), `plier`.
- carnetsStore.ts (lecture seule pour toi) : Firestore document par document, pas de Dexie.

Règles à coder (chacune un test) :
1. Passe-plat : une clé inconnue au carnet, à une façon, un article, une note, un message survit à la lecture et à une
   intention qui réécrit le document.
2. Dérivation sans `suivi` : archive → resolu ; choix ou option retenue → decide ; façon ou article → cherche ; sinon note.
   Genre : article ou choix → achat ; sinon idee. Aucune écriture produite par la lecture.
3. `changerEtat` : les 16 couples (dont un état vers lui-même : sans effet, sans événement) ; Rouvrir depuis Résolu.
4. Options : piste ↔ veille ↔ ecartee ↔ retenue, libres ; une seule retenue à la fois (retenir B remet A en piste et le
   dit dans l'événement) ; « écartée, 2e fois » compté dans l'historique ; `facon.etat` reste écrit (veille → ouverte).
5. `fermerParAchat` : état resolu, `resolu.par` achat, chaque option non retenue → ecartee avec sa raison gardée, sinon
   « pas pris » ; l'inverse rend exactement l'état d'avant (options comprises).
6. Veille : allumée seulement par une intention de lui (`origine: 'vous'`) ; sur une option à article, elle pose
   `article.veille` existante ; sans article : « veille demandée, sans lien à relever ».
7. Tâches : `aFaireDe` groupe Cette semaine (échéance ≤ dimanche courant, en retard compris, sans reproche), Fin du mois,
   Un jour (sans échéance) ; coût absent ≠ 0 ; total « ≈ » seulement sur les coûts connus, avec leur nombre.
   Une note du Planning « À faire du … au … » devient une tâche dérivée (lecture seule).
8. `arbreDe` : domaine › chemin[0] ; problèmes ouverts à plat sous leur domaine, autres genres repliés par sous-domaine,
   « À ranger » (ni domaine ni chemin), « Résolus <année> » ; ordre stable. Chemin proposé rapproché du vocabulaire (plié,
   distance d'édition ≤ 2).
9. `coupDOeil(carnets, annee)` : je cherche, décidés, notés (genre problème seulement), résolus dans l'année.
10. `filDe(c, messages)` : messages dont un effet ou une étiquette vise le carnet, notes sans message, événements ; tri par
    date ; regroupés par jour ; plus anciens repliables (« ▴ n notes du … au … »).
11. `pourquoiDe` : citations mot pour mot de ses messages liés à l'option retenue (étiquettes retenu, veille, achat,
    pourquoi), 2 au plus ; aucune → `null` (la question honnête s'affiche).
12. `dureeDe` (jours entre création et résolution), `avantApresDe` (1re photo, dernière après décision, sinon rien).
13. Plafonds : 200 événements (fusion des plus anciens changements d'état consécutifs), 12 photos (existant).

Tests : tests/unit/carnetsSuivi.test.ts (règles 1 à 6, 13), carnetsSuiviProjections.test.ts (7 à 12). Vitest seulement.
