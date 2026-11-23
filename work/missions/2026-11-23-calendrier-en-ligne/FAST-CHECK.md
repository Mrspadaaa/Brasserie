# Tests par propriétés (fast-check) des dates de la frise du Calendrier

Demande du brasseur : « regarde si c'est utile ». Verdict : **oui, à garder.** Deux défauts réels trouvés sur HEAD, le défaut T9-2 (étiquette d'année du cadre, vu à l'œil par le brasseur au tour 9) retrouvé tout seul sur le tag tour9, 7 défauts injectés sur 7 attrapés contre 3 sur 7 par les tests existants. Coût : 66 tests, 9,4 s de plus à la suite, une devDependency.

Code : worktree `port-carnet`, commit `89682342f` (tests + fast-check dans package.json et package-lock.json ; seuls les hunks de fast-check, le travail Playwright de l'autre agent reste hors du commit). Pas de push.

## 1. Fonctions pures recensées et invariants testés

Référence indépendante : `tests/unit/proprietes/_dates.ts` compte en jours depuis 1970 (algorithme de Hinnant) et applique la définition ISO 8601, sans jamais passer par `Date` ni par le fuseau.

| Fichier source | Fonctions | Invariants (propriété) |
|---|---|---|
| `src/domain/calendrier.ts` | `lundiDe`, `numeroSemaine`, `etiquetteS`, `etiquetteListe`, `jourLisible` | un lundi, jamais après le jour, ≤ 6 j avant, idempotent, constant dans la semaine ; numéro = référence ISO (exhaustif sur les 5 844 jours de 2020 à 2035, puis 1 000 tirages) ; 53 seulement en 2020, 2026, 2032 ; 28 déc. 2026 → 3 janv. 2027 = S53, 4 janv. 2027 = S1 ; le 4 janv. est toujours S1 ; +1 d'un lundi au suivant, retour à S1 après la dernière |
| idem | `ajouterJours`, `ecartJours`, `ecartSemaines`, `dimancheDe` | égal à la référence ; aller-retour ; additif ; aucun jour sauté ni doublé sur les 5 844 jours, un par un ; écart de semaines = écart des lundis / 7 |
| idem | `semainesDe`, `indexSemaine`, `fenetreSemaines` | longueur ; premier lundi = lundi d'aujourd'hui − passé × 7 ; pas de 7 j ; numéros ISO ; `jourMois` ; aujourd'hui à l'index `passe` ; numérotation S52/S53 → S1 exactement au changement d'année ; index = semaine qui contient le jour, `null` hors liste ou date illisible ; tronçon non vide, borné |
| idem | `dateDeSemaine` | « S{n}, lundi – dimanche mois » dit les vrais lundi et dimanche, quel que soit le jour reçu |
| idem | `anneeEnMois`, `indexMois` | mois entiers et contigus (aucun trou ni doublon) ; chaque semaine rangée dans le mois de son jeudi ; premier et dernier mois jamais vides ; 12 ou 13 mois pour 52 semaines |
| `src/ui/calendrier/echelle.ts` | `ajouterMois`, `echelleEffective`, `moisDeLaPeriode`, `uniteColonne`, `colonnesDeLAxe`, `cibleDuGlisse`, `lettreDuJour`, `estWeekEnd` | repli en fin de mois ; Jour ≤ 3 sem., Mois dès 13 et au-delà de 26, idempotente ; colonnes en semaines : étiquette S{n} = semaine ISO ; semaine dépliée : 7 jours à sa place, aucun jour perdu ; jours : consécutifs ; mois : entiers, contigus, 3 colonnes pour 13 semaines ; cible du glisser dans la colonne visée |
| `src/ui/calendrier/entete/alignement.ts` | `xDeDate`, `alignerSemaines`, `semaineSous` | x croît avec la date, début de colonne k à k × largeur, date dans sa colonne, en semaines x = jours / 7 × largeur ; bords croissants dans [0, largeur] |
| `src/ui/calendrier/entete/Fenetre.tsx` | `fenetreDePeriode`, `periodeDeFenetre`, `libelleDuree`, `libellePeriode`, `MOIS_MIN_SEMAINES` | fenêtre non vide, commence un lundi, reste dans l'horizon de 104 semaines ; `tout` et période passée : `null`, période qui touche l'horizon : jamais `null` ; plage dans l'horizon : du lundi du début au lundi de la fin ; CHV-4 : plage commencée avant l'horizon garde sa durée ; mois ≥ 4 sem. ; aller-retour `periodeDeFenetre` → `fenetreDePeriode` ; « N sem. » dit N, « 3 mois » = 13, « 6 mois » = 26, « An » ≥ 52 ; « Nov. », « T4 », « 2026 » seulement si la fenêtre est exactement celle de la période ; **fenêtre ≤ 52 sem. (FC-1)** |
| idem | `etiquetteCadre`, `joursSemaine`, `etiquetteRepos` | numéros de début et de fin = ceux des semaines ; une semaine seule se dit une fois ; **lue comme le brasseur (année absente = cette année), l'étiquette redonne l'année ISO exacte du début et de la fin** (courbe d'un an avant à un an après) ; une semaine seule dit ses vrais jours |
| idem | `vueDeFenetre`, `semainesDeVue` | début à 56 px du bord gauche, fin à 56 px du bord droit, quelle que soit la durée ; bords croissants dans [0, largeur], aucune semaine visible omise |
| `src/components/periode/periode.ts`, `src/ui/finance/operations/plage.ts` | `pas`, `peutPasser`, `glisser`, `duree`, `titreJours`, `bornes`, `serialiser`/`lire`, `jourSaisi`, `aujourdhuiISO` | reculer/avancer : la période suivante commence le lendemain de la fin (aucun jour perdu ni doublé), reculer puis avancer revient au départ dans les bornes (1.1.2000 → fin de la 52e semaine), la flèche s'éteint au bout de l'horizon, jamais au-delà ; `peutPasser` ⇔ `pas` change ; une plage glissée garde sa durée ; `titreJours` dit exactement ses deux bornes ; sérialisation sans perte ; `jourSaisi` juste sur les 5 844 jours |
| `src/ui/plageDate.ts` (D425) | `plageDate`, `ajouterAnnees` | epoque et dernier sont des lundis, dans l'ordre ; la valeur est toujours dans la plage (aucune date hors plage) ; aujourd'hui ± 5 ans toujours atteignable ; une valeur dans ± 5 ans ne déplace pas la plage ; repli du 29 févr. ; 12 mois = 1 an |
| fuseau | tout ce qui précède, plus `todayISO` | les 16 × 2 dimanches de changement d'heure ± 2 jours : semaine, lundi, index, numéro = référence ; une semaine à cheval sur un changement d'heure a 7 jours ; « aujourd'hui » = jour local à ± 14 h de minuit, changements d'heure compris ; en Europe/Zurich `aujourdhuiISO` = `todayISO` |

Générateurs : dates de 2020 à 2035 ; un quart des tirages tombe sur des jours pièges (fins d'année ± 5 j, 4 janvier, dimanches de changement d'heure ± 2 j, 29 févr., 28 déc. 2026 → 4 janv. 2027 en entier). 1 000 essais par propriété (`RUNS`), 200 pour la marche des flèches (40 pas par essai).

## 2. Résultats

| Cible | Fuseau | Résultat |
|---|---|---|
| HEAD `36a9891ab` + tests | Europe/Zurich | 66 passent (dont `FC-1` et `FC-2` en `it.fails`, donc le défaut est bien là) |
| idem | UTC, America/Los_Angeles, Pacific/Auckland, Asia/Kolkata | 65 passent, 1 ignoré (le test « barre = Calendrier à toute heure », propre à Zurich) |
| tag `en-ligne/2026-11-22-tour9` (`3cfbf196a`) | Europe/Zurich | 60 passent, **1 échoue : `etiquetteCadre`**, contre-exemple réduit `{ aujourd'hui: 2020-01-01, index 0, 1 semaine }` : début 2018-12-31 (semaine S1 de 2019), l'étiquette « S1 » se lit 2020 ; `plageDateD425` ne se charge pas (le fichier n'existe pas au tour 9) |

Le défaut du tour 9 retrouvé est celui que le brasseur a vu à l'œil (T9-2, « bute sur S47 » : « S47 – S52 2026 » se lit comme la fenêtre d'avant). fast-check le donne en un essai, réduit à une fenêtre d'une semaine ; HEAD le tient (propriété verte).

Temps, HEAD, Europe/Zurich : 9,4 s de mur pour les 5 fichiers (13,4 s de calcul, en parallèle) : `axeEchelles` 8,8 s (les 6 propriétés de colonnes recalculent 104 semaines à chaque essai), `semainesIso` 3,1 s, `fenetreFrise` 1,1 s, `fuseauHeureEte` 0,3 s, `plageDateD425` 0,2 s. Auckland (+13 h) : 14 s. Pour mémoire la suite entière compte ~300 fichiers ; ceci en ajoute 5.

## 3. Défauts trouvés

### FC-1 — « Exercice 2026 » donne une fenêtre de 53 semaines (au plus 52 attendues)

- Fonction : `fenetreDePeriode` (`src/ui/calendrier/entete/Fenetre.tsx:33-53`).
- Contre-exemple réduit par fast-check : `{ genre: 'dates', du: '2027-04-04', au: '2028-03-27' }` → 53 semaines ; sous forme du métier : `{ genre: 'annee', annee: 2026 }` → `{ du: '2025-12-29', semaines: 53 }`. Mesure : 294 plages de 365 jours sur 601 (début à ± 300 jours d'aujourd'hui) donnent plus de 52 semaines.
- Cause : le plafond de la fenêtre est l'horizon (`total − décalage`, 104 semaines), pas l'An. Le geste du cadre plafonne à 52 (`Fenetre.tsx:317`, T9-2 : « la fenêtre ne dépasse jamais l'An… un cadre plus long qu'elle »), la lecture d'une période de l'app ne le fait pas. Une année civile tient toujours dans 53 ou 54 lundis.
- Impact pour le brasseur : choisir « 2026 » dans la barre de période ou dans Finances règle une fenêtre de 53 semaines : le bouton dit « An », le cadre en couvre 53, l'An de la frise (`anneeEnMois(fenetre.du, min(52, …))`, `CalendrierTab.tsx:325`) en montre 52. Lu au code ; rendu non vérifié sur capture.
- Versé : `work/missions/BUGS.md`, FC-1. Non corrigé.

### FC-2 — l'axe en Mois perd le dernier mois de la fenêtre

- Fonction : `colonnesDeLAxe`, échelle Mois (`src/ui/calendrier/echelle.ts:97-111`, paquet F n° 4 / PC-140).
- Contre-exemples : « Exercice 2026 » → colonnes déc. 2025 … nov. 2026 (déc. 2026, un mois de factures et de ventes, absent) ; 13 semaines dès le 29 déc. 2025 → axe déc. 2025 … févr. 2026 alors que la fenêtre va jusqu'au 29 mars ; 26 semaines dès le 30 nov. 2026 → axe nov. 2026 … avr. 2027, fenêtre jusqu'au 30 mai.
- Mesure (frise réelle de 104 semaines, toutes les positions de départ) : fenêtres dont la fin dépasse la dernière colonne : 87 sur 92 à 13 semaines (jusqu'à 29 jours), 73 sur 79 à 26 semaines (jusqu'à 30 jours), 65 sur 65 à 40 semaines (37 jours), 48 sur 53 à 52 semaines (29 jours).
- Cause : les mois « touchés » sont comptés depuis le lundi de la première semaine (déc. pour la semaine du 29 déc.), puis on garde les `moisDeLaPeriode(n)` premiers. La règle de l'An (`anneeEnMois`) range une semaine dans le mois de son jeudi (ISO) : les deux règles se contredisent.
- Impact pour le brasseur : une chose posée dans le dernier mois de la fenêtre est dans le cadre mais hors de l'axe. À confirmer sur capture 390 ; et à trancher : PC-140 voulait « 3 mois = 3 colonnes », pas forcément perdre le dernier.
- Versé : `work/missions/BUGS.md`, FC-2. Non corrigé.

Les deux sont marqués `it.fails` dans la suite : ils passent tant que le défaut existe et cassent le jour où on le corrige (alors retirer `.fails`). Chacun a un exemple fixe (`examples`), donc le résultat ne dépend pas du hasard.

Rien trouvé (propriétés vertes sur HEAD, 1 000 essais, 5 fuseaux) : semaine ISO et années à 53 semaines, passage 2026-12-28 → 2027-01-04, `semainesDe`, mois de l'An, flèches ‹ › (aucun jour perdu, bornage à 52 semaines exact), plage D425, étiquette d'année du cadre, changements d'heure.

## 4. Ce que les tests existants ne couvraient pas

- Les tests écrits à la main prennent un exemple à la fois, souvent novembre 2026 : `fenetreDePeriode` y est joué avec `total` = 52 (`calendrierPeriodeFinances`, `calendrierEntete`), alors que la courbe de l'app pose 104 semaines ; aucune période « année » ni plage de 12 mois ; l'axe en Mois n'est joué que sur 6 semaines (`calendrierEchelle`).
- Défauts injectés dans une copie de HEAD, un à la fois, joués contre 295 tests existants du Calendrier (11 fichiers unit + 2 fichiers d'intégration) et contre les propriétés :

| Défaut injecté | Tests existants | Propriétés |
|---|---|---|
| année ISO prise au lundi (frontière d'année) | vu (1 échec) | vu (9 échecs) |
| `ajouterMois` sans repli en fin de mois | **non vu** | vu |
| mois de l'An rangés au lundi, non au jeudi | **non vu** | vu |
| fenêtre non bornée par l'horizon restant | **non vu** | vu |
| horizon des flèches décalé d'un jour | **non vu** | vu |
| `ajouterAnnees` sans repli du 29 févr. | vu (1 échec) | vu (1 échec) |
| `semainesDe` : passé compté en 6 jours au lieu de 7 | vu (7 échecs) | vu (5 échecs) |

Existants 3 sur 7, propriétés 7 sur 7. Un huitième défaut prévu (`dateDeSemaine`, dimanche +7) n'a pas pu s'injecter (le motif multi-ligne ne correspondait pas, fins de ligne CRLF) : non compté. Limite : seuls 13 fichiers existants du Calendrier ont été joués, pas la suite entière.

## 5. Limites

- Ce sont des fonctions pures. Les calculs enfouis dans les composants ne sont pas exportés, donc pas testés : `poser`/`poserDebut`/`deplacer` de `DureeFenetre` (le geste de la frise partagée ChoixDate), `defilerFenetre` et `voirEtendue` de `CalendrierTab`, la clamp de `Cadre` (`Fenetre.tsx:317`). Les extraire en fonctions pures permettrait de les tester pour peu de travail (proposition, pas faite : hors de mon périmètre).
- `aujourdhuiISO` (barre de période, `ChoixDate`) lit la date LOCALE de l'appareil, alors que le Calendrier lit `todayISO()` = Europe/Zurich. Identiques en Suisse (propriété verte), différentes quelques heures par jour sur un appareil réglé ailleurs. Non versé comme défaut (hors usage du brasseur), signalé.
- Aucune capture : FC-1 et FC-2 sont lus au code et à la fonction, pas sur l'écran.
- Les bornes de `fenetreFrise` supposent `total` = 104 (`NB_SEMAINES_COURBE + SEMAINES_PASSEES_MAX`, `useDonneesCalendrier.ts:115`) ; si ces constantes changent, `PASSE` et `TOTAL` en tête du fichier suivent.

## 6. Recommandation

Garder les tests : 5 fichiers, 10 s, aucune dépendance au réseau, aucune donnée réelle, seeds affichées à l'échec. Les deux défauts connus y sont figés en `it.fails`. Prochaine étape utile : trancher FC-1 et FC-2 (correction, ou décision écrite que l'axe en Mois perd son dernier mois), puis retirer les `.fails`.

Rejouer : `npx vitest run tests/unit/proprietes` (fuseau d'ailleurs : `TZ=Pacific/Auckland` posé par un script Node, pas par le Bash de ce poste qui perd `TZ` pour les noms à barre oblique).
