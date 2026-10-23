OK — mesure-performance.mjs (×4/×6, 6 témoins), maquette mesurée, optimisations classées par gain mesuré

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/mesure-performance.mjs` (le contrôle ; option `--profil` en plus)
- `work/refonte-frontend/v4/tournoi/outils/temoins/perf-rapide/etat.html` (passe)
- `work/refonte-frontend/v4/tournoi/outils/temoins/perf-lent/etat.html` (le toucher bloque le fil 300 ms : échoue par `toucher`)
- `work/refonte-frontend/v4/tournoi/outils/temoins/perf-lent-glisser/etat.html` (40 ms bloquées par mouvement de doigt : `glisser`)
- `work/refonte-frontend/v4/tournoi/outils/temoins/perf-lent-chargement/etat.html` (script de 3 s avant le premier écran : `chargement`)
- `work/refonte-frontend/v4/tournoi/outils/temoins/perf-immobile/etat.html` (la poignée ne bouge pas : `glisser`, « le geste n'a rien déplacé »)
- `work/refonte-frontend/v4/tournoi/outils/temoins/perf-vide/etat.html` (aucun `[data-ecran]` : `chargement`, rien de mesuré = échec)
- Rien écrit ailleurs. Fichiers de travail dans le dossier temporaire de la session. `controle-rail.mjs`, les témoins `rail-parcours-*` et la maquette n'ont pas été touchés.

## Critères
- G1 `perf-rapide` : `PERF OK (1 page, ×4)`, code 0.
- G2 : `ECHOUE OK (toucher, code 1)`. Ligne : `toucher perf-lent : 311 ms > 100 ms (pont-suite, froid, ×4)`.
- Les autres témoins échouent chacun par leur mot (rejoués avec `systeme.mjs echoue`) : `perf-lent-glisser` par `glisser` (médiane 42 ms), `perf-lent-chargement` par `chargement` (3,05 s), `perf-vide` par `chargement`, `perf-immobile` par `glisser`.
- G3 : `VERDICT ECHEC (PERF ECHEC (5 dépassements, ×4))`, code 0 de `verdict` (le contrôle a rendu ses mesures sans planter) ; le motif de G3 `ma-biere · … dryhopper · … VERDICT` est vérifié vrai. Le ×6 rend `VERDICT OK (PERF OK (4 pages, ×6, sans budget))`.
- G4 : `NOTE OK` (sections Mesures et Optimisations ; ×4, ×6, gzip présents).
- G5 : `CABLAGE OK`.
- Essais : G1 à G3 passés du premier coup à la fin ; le script a été corrigé 6 fois en cours de route par mes propres vérifications (voir Doutes), sans dépasser 3 essais par critère.

## Comment le contrôle mesure
`node …/mesure-performance.mjs <dossier> <id…> --page=etat.html [--cpu=4] [--profil]`. Chrome (puppeteer-core), 390 × 844, échelle 2, toucher réel par CDP (`Input.dispatchTouchEvent`), `emulateCPUThrottling`, réseau distant coupé, cache coupé, un contexte neuf par passage. Par page : un passage tracé (script, ponts, frise, fichiers), un passage par pont (3 au plus), deux glissers, au moins 3 chargements. Chaque entrée de l'en-tête dit sur quel processeur : ici un Intel Core i5-14600KF (rapide : ×4 n'en fait pas un Android moyen, voir « Ce qui ne se mesure pas »).
- chargement : navigation → un `[data-ecran]` visible hors `[inert]`, peint, fil principal libre. Médiane des chargements.
- toucher : `pointerup` (heure d'arrivée de l'entrée) → écran suivant peint. Premier toucher d'une session = froid ; retour du téléphone puis même pont = chaud (cache). La ligne affiche le plus lent ; « dont moteur » est l'union des appels de `mesures()` non servis par le cache pendant ce toucher.
- glisser : trois temps (−30 %, +30 %, retour), un point toutes les 16 ms, le doigt posé sur ce qui reçoit le toucher (le pouce). Durée d'une image qui a reçu un mouvement : image tenue (intervalle ≤ 25 ms) = travail du fil principal de l'horodatage de la frise d'images à la fin du rendu ; image ratée = l'intervalle entier. Le budget juge le premier geste (froid) ; le second (chaud) est rapporté. Un geste qui ne déplace rien (aria-valuenow et positions inchangés) est un échec.
- moteur à entrées changeantes (L20) : `lireBiere` sur 16 recettes différentes, `suggerer` sur 3 volumes, les 28 crans de la frise.
- `--profil` : profileur CDP sur le premier toucher et le premier glisser, fonctions les plus lourdes avec l'extrait du script (minifié).
- Poids : script et feuille de style bruts, gzip niveau 9, brotli qualité 11.

## Mesures
Build mesuré : `maquettes/parcours/assets/parcours.js` 1 554 182 octets et `style.css` 91 781 octets (modifiés 20:25 puis 20:31 le 23.10, même taille). **La page a changé sous moi** : mes premières mesures portaient sur le build de 18:22 (1 548 900 et 89 113 octets). Tout ce qui suit est rejoué sur le build de 20:25. La sortie du contrôle imprime désormais les fichiers lus avec leur date.

Budgets (×4 seulement) : toucher ≤ 100 ms ; glisser ≤ 16 ms en médiane, ≤ 33 ms au 95e centile ; écran utilisable ≤ 2,5 s. Chiffres en ms ; « dont moteur » entre parenthèses.

### Téléphone moyen (×4) — `PERF ECHEC (5 dépassements)`
| Écran | chargement | toucher froid → écran suivant | toucher chaud | glisser p50 / p95 (froid) | script (éval + analyse) | tas |
|---|---|---|---|---|---|---|
| ma-biere | 565 | 782 vers Suggérer (490) ; 743 vers Substituer (544) ; 159 vers Levure (21) | 100 à 151 | 2,4 / 6,8 | 188 + ~65 | 7,4 Mo |
| suggerer | 1 348 | 281 vers Comparer (11) | 99 à 135 | pas de frise | 182 + ~56 | 8,8 Mo |
| comparer | 601 | 362 vers Dryhopper (119) | 104 à 111 | pas de frise | 186 + ~60 | 7,9 Mo |
| dryhopper | 660 | 138 vers Levure (34) | 57 à 63 | **13,9 / 121** | 182 + ~61 | 8,1 Mo |

Dépassements : `toucher` ma-biere 782, suggerer 281, comparer 362, dryhopper 138 (tous des touchers froids) ; `glisser` dryhopper p95 121 ms (3 images ratées sur 100). Chargement : tous sous 2,5 s.

### Téléphone bas de gamme (×6) — rapporté, sans budget
| Écran | chargement | toucher froid (dont moteur) | toucher chaud | glisser p50 / p95 (froid) | script (éval) |
|---|---|---|---|---|---|
| ma-biere | 906 | 1 343 Substituer (947) ; 1 309 Suggérer (828) ; 200 Levure | 68 à 238 | 3,1 / 17,6 | 311 |
| suggerer | 2 092 | 468 Comparer (19) | 170 à 174 | pas de frise | 299 |
| comparer | 965 | 637 Dryhopper (286) | 185 à 267 | pas de frise | 307 |
| dryhopper | 1 049 | 230 Levure (53) | 92 à 101 | 47,4 / 193 (12 images ratées) | 302 |

### Poids (les mêmes sur toutes les pages : un seul paquet)
- Script : 1 518 Ko brut, 339 Ko gzip, 278 Ko brotli. Feuille de style : 95 Ko brut, 18 Ko gzip, 15 Ko brotli.
- Deux familles de polices Google sont demandées par une feuille bloquante dans `<head>` : coupées ici (réseau distant), non comptées.
- Calcul, pas une mesure : en « 4G lente » (1,6 Mb/s) le script prend ~1,4 s en brotli, ~1,7 s en gzip, ~7,6 s sans compression.

### Moteur, entrées qui changent à chaque appel (×4, médiane des trois pages à 1 appel froid près)
- `lireBiere` : 7 à 8 ms par recette différente (premier appel 9 à 11 ms). Le 1,1 ms de p7 était un recalcul sur le processeur de bureau non ralenti : ×4 donne le même ordre (1,1 ms × 4 ≈ 4,4 ms, plus des recettes plus lourdes).
- `suggerer`, 9 candidats du stock : médiane 71 ms (premier appel 74 à 146 ms), soit ~7,9 ms par candidat. **Extrapolation non mesurée** : 318 variétés ≈ 2,5 s à ×4, contre les 0,4 s estimés par p7 (318 × 1,2 ms à ×1).
- Frise de Dryhopper, 28 crans, premier passage : 90 à 96 ms (3,3 ms par cran).
- Pendant un glisser dans Dryhopper : 17 recalculs hors cache (médiane 4,8 ms) et ~190 appels servis par le cache ; au second glisser, 0 recalcul. Le p95 du glisser chaud (113 à 144 ms) est aussi mauvais que le froid : il vient donc du rendu, pas du moteur.

### Bruit
Machine partagée avec d'autres sessions. Sur le build de 18:22, Dryhopper donnait p50 13 / 17 / 24 / 33 ms et p95 99 / 145 ms selon les rejeux ; sur le build de 20:25 trois rejeux donnent p50 13,8 à 13,9 ms et p95 119 à 135 ms. Ma bière : p95 de 16 à 54 ms sur l'ancien build, 6 à 8 ms sur le nouveau (la frise a été modifiée entre les deux ; je n'ai pas cherché la cause). Les verdicts à moins de 30 % d'un budget sont à rejouer ; la ligne « passage par passage » les montre.

## Optimisations
Classées par gain estimé, chaque gain tiré d'une mesure citée. Coûts : faible (< 1 h), moyen (une demi-journée), élevé (plus).

1. **Préchauffer le moteur pendant que le brasseur lit l'écran (idle, ou Web Worker).** Mesure : toucher froid contre chaud, même pont. Ma bière → Substituer 743 contre 100 à 105 ms ; Ma bière → Suggérer 782 contre 127 à 151 ms ; Comparer → Dryhopper 362 contre 104 à 111 ms. Le moteur compte 490 à 544 ms de ces deux touchers lents (et 119 ms du troisième). Gain : jusqu'à ~640 ms sur les deux touchers les plus lents, sans toucher au calcul. Coût : moyen (lancer par morceaux `remplacants` et `suggerer` après la première peinture, ou les mettre dans `hopSolver.worker.ts` comme le prévoit p7). Réserve : ça ne réduit pas le travail, seulement sa place ; un Worker libère aussi le fil pendant le calcul.
2. **`hopDescriptorEvidence` au premier appel : 47 % d’un toucher.** Profil du toucher Ma bière → Substituer : une seule fonction (`cn` dans le script, `parcours.js:349`) pèse 417 ms sur 880 ms échantillonnés ; avec ses deux voisines 480 ms. Elle correspond à `hopDescriptorEvidence` de `functions/src/hopExtrapolationCore.ts` (lignes 35 à 57) : un cache existe mais est indexé par l'identité d'un tableau `terms` (`Map<string[], …>`) ; il ne sert que si l'appelant repasse le même tableau. **Hypothèse non vérifiée** : les appelants en passent un neuf à chaque fois. Gain possible : ~400 ms sur le toucher Substituer (743 → ~340 ms). Coût : faible à moyen (clé de cache par contenu, ou index précalculé).
3. **Mettre en cache les formateurs de nombres.** Profil du glisser Dryhopper : `vt` (le `fr` de `prototypes/houblons-v4/src/engine/pouvoir.ts:192`, un `toLocaleString('fr-CH', …)` par appel) 442 ms et `Ae` (`parcours/src/commun/nombres.ts:3`) 85 ms sur 2 501 ms échantillonnés, soit 21 %. Dans le toucher Comparer → Dryhopper : `vt` 132 ms sur 536 (25 %). Même schéma dans `dryhopper/mesures.ts:29` et `comparer/valeurs.ts:33`. Gain : ~130 ms sur ce toucher (362 → ~230), et ~20 % du travail JS du glisser Dryhopper (le p95 de 121 ms y baisse ; de combien, je ne l'ai pas rejoué). Coût : faible (un `Intl.NumberFormat` par jeu d'options, quatre sites). Mieux : ne pas fabriquer le texte d'une hypothèse ou d'une source qui n'est pas affichée (coût moyen, touche le moteur).
4. **Rendu des écrans d'arrivée.** Même chaud, sans moteur : 99 à 151 ms (Suggérer, Substituer, Comparer → Dryhopper), à la limite du budget de 100 ms. Un coupable mesuré : une fonction de `parcours.js:459` (`window.innerHeight − s.height − s.offsetTop`, lecture de mise en page forcée au montage) pèse 19 à 33 ms dans chaque toucher profilé (6 à 10 %). Gain : 20 à 30 ms par toucher. Coût : faible (le lire dans une image d'animation, ou `100dvh`). Pour passer sous 100 ms de façon sûre : afficher d'abord l'écran sans ses parties lourdes puis compléter (`startTransition`), coût moyen ; gain non mesurable avant d'essayer, et il change ce que mesure « premier rendu de l'écran suivant ».
5. **Le paquet de script : le découper par route et charger les JSON à la demande (B9).** Mesure : évaluation 182 à 188 ms + analyse du programme 55 à 82 ms à ×4 (311 ms d'évaluation à ×6), sur un chargement de 565 à 660 ms ; soit jusqu'à ~250 ms (40 %) à gagner sur l'ouverture, et 600 Ko de JSON qui ne servent pas à l'écran d'ouverture (chiffre de p7, non remesuré). Gain réseau (calcul) : sans effet sur le brotli de 278 Ko si tout se charge quand même, important si seul l'écran d'ouverture charge. Coût : moyen (`import()` par route, JSON en `fetch` mis en cache). Priorité basse : le budget de chargement tient déjà à ×4 et ×6.
6. **`suggerer` sur 318 variétés : garde-fou, pas un gain d'aujourd'hui.** La maquette n'en calcule que 9 (71 ms). L'extrapolation (≈ 2,5 s à ×4) impose un Worker et un préfiltre (stock, rôle) avant de passer au catalogue entier. Coût : moyen. Précédent : `src/ui/hopIndex/hopSolver.worker.ts`.
7. **Servir en brotli et vérifier l'hébergement.** Brotli : 278 Ko contre 1 518 Ko bruts (−82 %). À vérifier sur l'hébergement réel, non vérifié ici. Coût : faible si c'est la configuration par défaut.
8. **Écran Suggérer à l'ouverture directe : 1 348 ms contre 565 à 660 ms ailleurs** (×6 : 2 092 ms). Le calcul des 9 candidats a lieu au montage (« longues tâches au chargement : bloquant 1 085 ms »). Même remède que le n° 1 (calcul hors du montage) ; gain ~700 ms sur cette ouverture.
- Écarté par la mesure : **précalculer les 28 crans de la frise** (ARCHITECTURE.md et p7 le proposent). Le glisser chaud (crans déjà en cache) a le même p95 que le froid (113 à 144 ms contre 119 à 135 ms) : le coût est dans le rendu, pas dans le calcul des crans.

## Ce qui ne se mesure pas ici
- Un vrai téléphone : GPU, raster, compositeur et mémoire limitée ne sont pas vus (Chrome de bureau sans GPU ; seul le fil principal est mesuré). `emulateCPUThrottling` multiplie le temps de ce processeur rapide ; un Android moyen peut être plus lent ou plus rapide que « ×4 » selon la charge (mémoire, throttling thermique). iOS (WebKit) n'est pas couvert.
- Le réseau : le chargement est lu depuis le disque ; les polices Google et la latence ne sont pas comptées. Le temps de transfert du script est un calcul, pas une mesure.
- La batterie et la chaleur : aucune mesure ici.
- Le premier lancement réel (cache du navigateur vide, service worker, hors ligne) et la mémoire sur une session longue (le tas est lu après un ramasse-miettes en fin de passage seulement, 7 à 9 Mo).
- L'app : la maquette n'est pas l'app. Le montage dans la page recette (B1 à B3), Dexie et Firestore changeront ces chiffres ; le contrôle devra être rejoué dans l'app avec la même commande, un dossier d'écrans et un identifiant par état.

## Doutes et limites
- Le script a été corrigé en cours de route par ses propres vérifications : le glisser de Ma bière se posait au milieu d'une piste qui ne reçoit pas le toucher (le geste annulé par le navigateur : 6 images mesurées au lieu de 100) ; le doigt est maintenant posé sur le pouce, et un geste qui ne déplace rien échoue (témoin `perf-immobile`). Des échappements de barre oblique inverse écrits par un outil d'édition avaient aussi été perdus dans deux expressions (séparateur de milliers, extrait du script) : corrigés, `systeme.mjs cablage` ne trouve plus de caractère de contrôle.
- « Durée d'image » : définition à moi (image tenue = travail du fil principal, image ratée = intervalle entier), car l'intervalle brut de 16,7 ms à 60 Hz dépasse toujours le budget de 16 ms. À valider par le pilote.
- Le budget `toucher` juge le plus lent des touchers, froid compris, et le glisser juge le premier geste après l'ouverture : c'est strict, et les quatre écrans échouent par `toucher` pour cette raison (voir DÉCISION).
- Variabilité : voir « Bruit ». Chaque ligne repose sur 2 à 5 chargements et 1 à 2 glissers par page ; ce n'est pas une statistique.
- `suggerer`/`comparer`/`ma-biere` ont été joués par leur seul pont (3 ponts au plus par page, un seul sur suggerer, comparer et dryhopper) ; les boutons sans `data-role="pont-…"` ne sont pas touchés.

## DÉCISION À PRENDRE
Question : que juge le budget « toucher ≤ 100 ms » : le retour visuel d'un toucher, ou l'écran suivant entièrement rendu à froid ?
- Option A (actuelle) : l'écran complet, à froid, le plus lent ; échoue partout (138 à 782 ms) tant que le moteur n'est pas préchauffé.
- Option B : deux budgets, « premier retour visuel ≤ 100 ms » et « écran complet ≤ 1 s » (le modèle RAIL sépare les deux) ; nécessite que l'écran montre d'abord une version légère, donc un geste de conception sur chaque écran.
- Option C : ne juger que le chaud et rapporter le froid ; masque ce que le brasseur vit au premier toucher.
Recommandation : A pour l'instant, avec les optimisations 1 à 4, puis B quand un écran sait se montrer en deux temps. Le pilote tranche (aucun choix de goût).

## Autres
CONNAISSANCE : à ×4 sur un Core i5-14600KF, la maquette met 7 à 8 ms par `lireBiere` d'entrée différente, 71 ms pour `suggerer` sur 9 candidats (~7,9 ms par candidat), 90 à 96 ms pour les 28 crans de la frise à froid ; chargement 565 à 660 ms (1 348 ms pour l'ouverture directe de Suggérer) ; les `toLocaleString('fr-CH')` du moteur pèsent 21 % du travail JS d'un glisser dans Dryhopper. À verser dans [[cout-calcul-moteur]] avec la date du 23.10 et le build de 20:25.
LEÇON PROPOSÉE : mesurer une page que quelqu'un d'autre reconstruit en parallèle fausse les comparaisons sans que rien ne l'indique : relever la taille et la date des fichiers lus au début et à la fin de la mesure (le contrôle les imprime maintenant) et rejouer si elles changent. La maquette a été reconstruite deux fois pendant cette voie (18:22 → 20:25 → 20:31).
