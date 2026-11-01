# Tri du pilote : relecture du code et critique du port (01.11, nuit)

Sources : `RELECTURE.md` (R1 à R10) et `../../critique/VERDICT-port.md` (C1 à C21). La règle reste la même : une proposition perdue est
permise, une fausse écriture ne l'est pas, et dans le doute on n'écrit rien. On suit la règle n° 1 : la maquette r2b reprise telle quelle.
Les corrections se font dans cet ordre, puis on rejoue G3 à G8 et chaque défaut corrigé reçoit sa capture côte à côte.

## Possède étendu (pour ce seul changement)
- `src/ui/NumberInput.tsx` et `src/ui/numericInput.ts` : une prop facultative `fractionDigits`, transmise à `formatDecimal`, pour
  l'affichage hors frappe. Le défaut ne change pas et aucun autre appelant n'est touché ; les tests de `numericInput` et de `NumberInput`
  restent verts, avec un test neuf. Seul le Total de la dépense la passe, avec 2 (C3, R3).

## À corriger

### Argent et vérité
- **R1** : le prix « x/kg avec mouture » ne s'affiche que si `latestBrewPrices` l'écrira. Il faut donc :
  - un malt relié (`stockAction !== 'none'`) ;
  - une mouture de genre `service` ;
  - un `toCents` positif.

  Le mot « avec mouture » est affiché. Un test passe par l'écran, `savePurchase` puis le catalogue, avec un malt relié et un malt non relié.
  Même condition pour l'aperçu « lu 2,30 → 2,40 /kg » du tableau des moutures (C16), qui est rétabli.
- **R10 (D229)** : un geste ne fait jamais **monter** le statut. Le titre est le pire du statut de départ et du recalcul. Le recalcul peut
  donc faire descendre le statut (une valeur tapée crée un point) mais jamais le faire monter jusqu'à « vérifié ». C'est la chip finale
  qui dit « points revus » (T1). Deux tests : un « — » sur la TVA quand `ht-tva-ttc` est le seul point, et une valeur fausse tapée.
- **R5** : dans le pied, le doublon exact passe avant S8. `similarChoice` est lié à l'`id` de l'achat signalé et remis à zéro quand
  celui-ci change.
- **C8** : l'état 8 montre le tableau « Ce document / Déjà au registre » (N°, Date, Commande, Total). Le bouton « Même achat : rattacher
  le justificatif » passe par le même `attachToExisting(id)` que le doublon exact, avec les mêmes gardes (`attachable`, `proofAttached`,
  `proofSent`). Sans justificatif à rattacher, il dit « Même achat · ne rien enregistrer ». Le bouton dit toujours où va le fichier.
  Deux tests : avec un fichier et sans fichier.
- **R6** : la garde de T6 vaut aussi pour le choix « Créer un nouvel article » du plateau. Un nom déjà présent au stock, comparé par
  l'identité du produit (`readProductLabel(…).name` normalisé, `src/services/ingredientIdentity.ts`), donne « Relier ». Test.
- **C4** : le nom de l'article neuf est écrit par le service (`purchaseEntry.ts`, `name: line.description`), qui n'est pas au Possède. Le
  bouton garde le vrai nom écrit. Son nettoyage, comme « bis » et « CH », relève de S6 (D215, D216) et RESULTAT le dit. On ajoute le ⇄ de
  la maquette, « Relier à Target α 11,8 », qui fait le même geste que « Relier ».
- **C10** :
  - l'état 5 reçoit « Relire » et « Saisir à la main », par la relecture qui existe déjà (dis laquelle) ;
  - aucune date n'est montrée comme lue : la date par défaut s'affiche « aujourd'hui · par défaut », puisqu'elle sera écrite, et non
    « — » ;
  - plus de placeholder d'exemple, et plus de doublon « Justificatif prêt » / « Voir le justificatif ».
- **C20** : promettre « tu peux fermer » seulement si le code prouve que fermer pendant `saving` ne perd rien. Sinon, rien n'est
  promis. On ajoute la taille, « 0,7 Mo ».

### Ce qu'il lit
- **C1 (bloquant)** : « C'est la date » se lit (même style que « Rattacher les 5 »), et « Autre date » s'y ajoute.
- **C7** : le panneau Payé est la carte de la maquette :
  - « payé le · supposée 27.04 », à côté de « facture 27.04 » ;
  - la mention lue ;
  - « Moyen · E-Finance (lu) » ;
  - « C'est la date » et « Autre date ».

  Le formulaire complet (mois, raccourcis, moyen) reste monté, caché par une classe, et s'ouvre par « Autre date ». Les tests hors Possède
  restent verts sans modification.
- **C2, R4** : une table `relation → phrase` (« Bases N + R : imprimé 110,40 · lignes 86,50 (+23,90) », « Base N … », « TVA : colonne
  2,80 · N + R 4,15 »), avec un libellé neutre pour une clé inconnue, jamais la clé. Les tuiles sont nommées par leur provenance
  (« colonne MWST · lu », « N + R »).
- **C5** : au repos, une ligne montre le nom de l'article relié, ou à défaut `readProductLabel(description).name`. L'imprimé tel quel reste
  dans le plateau. C'est un affichage seul : la description écrite ne change pas.
- **C6** : le compte de la preuve fait 23 (toutes les catégories) et la phrase d'aide est retirée. Les lectures s'affichent « 2/2 ». La
  ligne « page vue / page coupée » n'apparaît que si l'indice existe.
- **C9** : l'état 1 suit la maquette : le fichier, sa taille, ses pages, une seule ligne d'étape, et les lignes en squelette. Règlement et
  « Pour quoi ? » ne sont modifiables pendant la lecture que si un test prouve que la fin de la lecture n'écrase pas une valeur tapée.
  Sinon, ils sont montrés verrouillés, et RESULTAT le dit.
- **C11** : à 1280, la colonne gauche reste en vue (collante) et la bande collante ne couvre que le ticket.
- **C12** : les tuiles TVA et Payé portent les numéros 1 et 2. On garde les chips 3 et suivantes, aux libellés de la maquette : « mouture
  ×5 +1,50 », « Target α », « Sabro unité ». Aucune chip ne double une tuile.
- **C14** : plus de chevron sur chaque ligne ; c'est la ligne entière qui s'ouvre.
- **C15** : la barre du bandeau est colorée par lien (relié, nouveau, service), avec les jetons de l'app et en suivant le thème.
- **C19** : l'icône d'en-tête est un document, nommé « Changer le fichier ».
- **C21** : le nom du fichier du reçu passe sur deux lignes, et la tuile TVA garde ses valeurs une fois la chip réglée.
- **R7** : « Champs corrigés : … » revient dans la preuve.
- **R8** : « À revoir » dit la valeur gardée.
- **R2** : les tests manquants :
  - le lien et le prix de mouture contre le service ;
  - « À revoir » avec N points ;
  - l'absence d'`IntersectionObserver` ;
  - les panneaux toujours montés ;
  - « Relier » ou « Créer » ;
  - un geste ne fait pas monter le statut ;
  - une valeur tapée n'est jamais écrasée.

  Chacun commence par un rouge de comportement, ou « absent » s'il est neuf.

## Écarts acceptés (RESULTAT les dit)
- C13 : pas de chip Hallertauer CH, faute de source. L'origine lue relève de S6.
- C17 : pas de bases à l'échelle tant que la grille en mots n'est pas juste ; à faire si les tours le permettent, après tout le reste.
- C18 : pas d'en-tête éditable (greffe z2b).
- « Voir 380001 » (T9), les trois étapes de lecture, le second bouton « Remplacer ».
- R9 : `voisinDe` recopie la règle de `stockLineMatching.ts:188-189`, et la lecture reste seule. L'exposer dans le service relève de S6.
