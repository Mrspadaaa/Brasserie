# Revue du plan e-port, triée par le pilote (01.11, nuit)

Deux relecteurs neufs ont rendu `REVUE-conception.md` et `REVUE-pret.md` ; les preuves et le détail y restent. « corrigée » veut dire que
l'auteur corrige PLAN.md selon la colonne « Correction attendue », précisée par la Raison quand le pilote tranche, avant toute ligne de
code. Règle de la voie : une proposition perdue est permise, une fausse écriture ne l'est pas. Dans le doute, rien.

**Ce que le pilote tranche (à recopier dans PLAN.md, § 10)**
- **T1, le statut** (Prêt 1, Conception 4) : `recalcul` n'est passé à `statutDeLecture` que si la lecture porte des `points` (format
  l1). Une lecture sans `points` (ancien format, cache d'avant le déploiement) va sans recalcul : c'est le plancher de l2, `disputed`,
  donc « Lecture à confirmer ». Il n'y a jamais de « vérifié » sans points. Dans `expenseSheet.test.tsx:86-90` (Possède), les cas
  anciens checked, corrected et disputed attendent « Lecture à confirmer », et unavailable ou undefined « Vérification incomplète »,
  avec la raison écrite dans le test. On y ajoute les cas du nouveau format : aucun point qui pèse donne « Lecture vérifiée » ; un point
  qui pèse donne « à confirmer ». Un geste du brasseur ne change jamais le statut : seul le recalcul le change. La chip « tout réglé »
  dit « points revus », pas « lecture vérifiée ».
- **T2, la largeur à 1280** (Prêt 2) : `src/ui/ModalShell.tsx` entre au Possède pour une seule prop facultative `size?: 'lg' | 'xl'`.
  Le défaut `lg` est inchangé ; aucun autre appelant ne change, et les tests du `ModalShell` restent verts.
- **T3, la source des chips** (Conception 1, Prêt 8) : une table complète `code → chip`, prise sur `PESE_PAR_CODE`. Chaque point qui
  pèse a sa chip, la TVA est reconnue par son code et non par l'`enjeu`, et un code inconnu qui pèse reçoit une chip générique. La
  fixture n'est jamais écrite à la main : c'est la sortie du vrai rapprochement du serveur, `functions/src` importé comme le fait déjà
  le client, appliqué aux deux lectures simulées de d1. Un script de la voie l'écrit une fois en JSON. L'unité illisible de Sabro est
  simulée dans la lecture et dite comme telle. L'écran n'ajoute aucune règle d'appariement : un « voisin » ou un article proche ne vient
  que de `matchStockLine` ou d'`ingredientIdentity`. Une chip de r2b sans source est absente de l'app, et l'écart est dit dans RESULTAT.
- **T4, Confirmer avec une unité à préciser** (Conception 2) : le pied reste cliquable, jamais grisé ; il peut refuser avec sa raison.
  Si `validatePurchase` refuse, rien n'est écrit. Le clic va sur la ligne (`focusIssue`) et le pied dit « 1 unité à préciser ».
  L'interrupteur « Mettre en stock : non » ou le choix de l'unité règle le point. G7 joue ce geste.
- **T5, le reçu qui reste** (Conception 3, décision 1) : la feuille ne reste ouverte que s'il y a un reçu Drive à montrer. Sinon elle se
  ferme comme aujourd'hui. `tests/unit/depense/raccord/ecran-recu.test.tsx` entre au Possède pour ce seul changement : `onClose` n'est
  plus appelé à l'enregistrement, il l'est à « Terminé ».
- **T6, l'article neuf** (décision 2) : il porte le vrai nom, jamais « bis » ni « CH ». D215 et D216 ne sont pas tenues dans cette voie ;
  elles relèvent de la voie S6, et RESULTAT le dit. « Créer » est refusé quand le nom normalisé (`ingredientIdentity`) est celui d'un
  article du stock : c'est alors « Relier ».
- **T7, les 100 mots** (décision 3, Conception 10) : d'abord le repli (b), ensuite des textes plus courts. Le repli (a) n'est pas fait, car
  il défait la correction n° 1 du critique. G7 imprime la mesure. Au-delà de 100, le pilote tranche sur cette mesure.
- **T8** : les sélecteurs des scripts d'émulateur (décision 4) sont acceptés ; RESULTAT les liste et le pilote les met à jour.
  G1 (décision 5) est accepté.
- **T9, l'ordre et la coupe** (Prêt 9) :
  1. l'état, le statut et les témoins ;
  2. `ExpenseSheet`, le bandeau, le ticket et le pied ;
  3. les panneaux Payé, TVA et preuve, la mouture et S8 ;
  4. G7.

  Si les tours manquent, tombent dans cet ordre : la bande collante, « Voir 380001 », les deux libellés Finances, la grille à 1280.
  RESULTAT dit ce qui est tombé. Les tests tiennent en 5 ou 6 fichiers.
- **G5** : le pilote y ajoute `tests/integration/financeQuickActions.test.tsx` et `tests/integration/fix114.test.tsx` (Conception 6).
  Ils sont rejoués sur HEAD avant le code.

## Conception

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | bloquant | Les chips ne viennent que de `enjeu === 'argent'` : la TVA (`enjeu: 'info'`) et onze codes qui pèsent n'ont pas de chip ; la fixture écrite à la main le cache | une table `code → chip` complète sur `PESE_PAR_CODE` ; fixture issue du vrai rapprochement | corrigée | T3 |
| 2 | bloquant | « Confirmer toujours actif » contredit `validatePurchase`, qui refuse l'unité vide de Sabro | trancher le geste | corrigée | T4 |
| 3 | bloquant | Le reçu qui reste ferait échouer `equipmentProjects.test.tsx:21,101-102` (hors Possède) | rester ouvert seulement avec un reçu Drive | corrigée | T5 |
| 4 | majeur | Statut et chips se contredisent après un geste | un geste ne change jamais le statut ; « points revus » | corrigée | T1 |
| 5 | majeur | « À revoir » est une liste fixe et oublie la TVA incohérente gardée, l'unité à préciser, le voisin | « À revoir » reprend les chips ouvertes à l'enregistrement, avec la valeur gardée ; test à N points | corrigée | même source que les chips (T3) |
| 6 | majeur | `financeQuickActions` et `fix114` rendent l'écran et ne sont pas inventoriés | rejeu sur HEAD, ajout à G5, nommés au tableau | corrigée | G5 étendu par le pilote |
| 7 | majeur | L'affichage du lien de mouture vient de `surchargeOf` ; le service écrit selon `millingParentIndex` | dériver de `millingParentIndex(lines,i) >= 0 && surchargeOf === parent.id` ; « avec mouture » ; rien si le malt n'est pas relié ; test contre `latestBrewPrices` | corrigée | rien d'affiché qui ne sera pas écrit |
| 8 | majeur | La coche « 6 × 2,30 = 13,80 ✓ » est un second calcul | le plateau lit `lineMathCheck([item])` ; `toCents` pour tout autre calcul | corrigée | une seule source pour une règle |
| 9 | majeur | Des indices `ScanHint` n'ont pas de place (total déduit, date absente…) | une ligne par indice dans « Rien ne se perd » ; « calculé » sur le total déduit ; date absente visible | corrigée | aucun déduit montré comme lu |
| 10 | majeur | Le repli (a) défait la correction n° 1 du critique | ordre (b) puis textes | corrigée | T7 |
| 11 | majeur | S8 réutilise l'état du doublon exact (`duplicateConfirmed`, sortie du pied) | état d'écran séparé (`similarChoice`), jamais `duplicateConfirmed` ; un S8 ne bloque jamais l'enregistrement ; dire l'effet de chaque bouton ; S8 visible même avec un doublon exact | corrigée | un signal n'écrit rien et ne change pas la clé de marqueur |
| 12 | majeur | Le chemin `enregistrer` simulé resterait dans le bundle | `const apercu = import.meta.env.DEV ? props.apercu : undefined`, `import type` seulement ; G3 : `grep dist/` sur la fixture et le nom de la fonction simulée | corrigée | — |
| 13 | détail | L'interrupteur garde l'ancien `stockRef` | poser `stockRef` explicitement au retour à « oui » | corrigée | — |
| 14 | détail | « Envoi au Drive » s'affiche pendant tout `saving` | seulement s'il y a un fichier et pas encore de reçu ; sinon « Enregistrement… » ou « Confirmation… » | corrigée | — |
| 15 | détail | « Envoi ✓ » s'allume à la lecture locale du fichier | « Fichier prêt », ou une seule étape « Lecture » avec son temps réel | corrigée | — |
| 16 | détail | Deux boutons « Changer » quand le panneau est ouvert | le second s'appelle « Remplacer le fichier » | corrigée | — |
| 17 | détail | `IntersectionObserver` : sa racine, et son absence dans jsdom | racine = le conteneur défilant ; garde ; test jsdom sans plantage | corrigée | — |
| 18 | détail | « Achats de autres frais » | « Achats divers non projetés » ; `brassage` reste en minuscules | corrigée | — |
| 19 | détail | Où vit le `summary` de `[data-purchase-lines]` | `details[data-purchase-lines] open` enveloppe le ticket, avec un `summary` visible et court, compté dans les mots | corrigée | même correction que Prêt 5 |

## Prêt à coder

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | bloquant | `statutDeLecture` avec ou sans recalcul ne tient pas les 5 cas de `expenseSheet.test.tsx:86-90` ; risque d'un faux « vérifié » | trancher | corrigée | T1 |
| 2 | bloquant | La grille à 1280 est impossible dans `ModalShell` (`sm:max-w-lg`) | trancher | corrigée | T2 |
| 3 | majeur | Le panneau Payé doit rester monté fermé (tests à `getByRole`) | panneaux toujours montés, cachés par une classe CSS, sans `hidden` ni style en ligne ; test | corrigée | — |
| 4 | majeur | Les remarques sont repliées dans la preuve, alors que le test veut qu'elles soient visibles après « Détails de la lecture » | les remarques sont dépliées quand la preuve s'ouvre ; la chip porte `aria-label="Détails de la lecture"` | corrigée | rien n'est caché sous deux touchers |
| 5 | majeur | Structure exacte de `details[data-purchase-lines]` et de son `summary` | la décrire (`open`, sans `data-purchase-options`, le `summary` qui porte « n proposée(s) par la lecture, à vérifier ») | corrigée | — |
| 6 | majeur | Les moutures sont des `article[data-purchase-line]` comptés par position | chaque ligne du brouillon, mouture comprise, est un `article[data-purchase-line]` avec un seul `summary` direct | corrigée | — |
| 7 | majeur | G7 n'atteint pas l'écran : `QuickActionModal` n'est monté qu'au clic | le script clique le bouton d'action puis « Facture » (sélecteurs nommés) et attend `body.dataset.apercu` ; le crochet vit avant `if(!isOpen)` ; dire ce que fait `startWithScan` | corrigée | — |
| 8 | majeur | Les 6 chips de R1 n'ont pas de source dans la fixture | lister les chips de la fixture avec leur source | corrigée | T3 |
| 9 | majeur | 150 tours ne suffisent pas sans ordre ni coupe | budget par bloc, ordre, coupe | corrigée | T9 |
| 10 | majeur | Libellés, `id` et rôles doublés (`TVA source (CHF)`, `role="alert"`, `role="status"`) | aucun doublon : le panneau TVA sans `id` ni libellé repris ; l'erreur de lecture est l'`alert` existant ; l'envoi n'est pas un `status` | corrigée | — |
| 11 | détail | `ScanHint` du total et portée de `form` | dire où vivent les indices ; `form` englobe le corps | corrigée | — |
| 12 | détail | Des témoins rouges pour une mauvaise raison | « module absent » pour les fonctions pures ; un rouge de comportement pour les tests qui rendent l'écran ; séparer les cas déjà verts | corrigée | — |
| 13 | détail | Pas de crochet `data-*` pour traduire `verifier-retouches.mjs` | tableau « crochet → équivalent maquette » au § 2 | corrigée | — |
