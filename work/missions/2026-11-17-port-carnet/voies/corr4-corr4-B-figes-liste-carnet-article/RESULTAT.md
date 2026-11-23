OK — figés liste, carnet, articles : 14/14 dans mes fichiers ; 26b au banc attend une prop du conteneur

# Lot corr4-B — figés liste, carnet ouvert, articles (18.11)

Worktree `port-carnet` (branche `claude/port-carnet-1711`), pas de commit. Aucun build (dist intact), aucun Gemini, aucune donnée réelle.
Banc : vite dev sur le port 5397, avec des `VITE_FIREBASE_*` fictifs et les hôtes Google coupés ; serveur arrêté après chaque série
(0 écoute sur 5397).

## Fichiers écrits

- `src/ui/carnets/pictos.tsx` (neuf) : `pictoDe(...mots)`, `PictoObjet`, `VignetteObjet`, `libellePicto`. Ils sont exportés pour C et D.
- `src/ui/carnets/ListeCarnets.tsx`, `CarnetOuvert.tsx`, `CarteArticle.tsx`, `FicheArticle.tsx`, `Photos.tsx`, `carnets.css`.
- `tests/unit/carnetsCritique4Figes.test.tsx` (neuf, 25 tests) et `tests/unit/carnetsEcrans.test.tsx` (adapté).
- Captures et script : `voies/corr4-corr4-B-figes-liste-carnet-article/captures.mjs` et `cap/` (40 png, `journal.txt`).

## Problème → fait → preuve

| # | Problème (CRITIQUE-4) | Fait | Preuve |
|---|---|---|---|
| 1 | Même cube partout | `pictos.tsx` : une photo si l'objet en a une ; sinon un picto déduit, dans l'ordre, du nom, de la façon puis du carnet (hotte, ventilateur, évier, tireuse, frigo, pompe, moulin, embouteillage, fût, cuve, mesure). Le générique ne vient qu'en dernier recours. Il sert dans la liste, les lignes du tableau, les cartes, la fiche, le choisi du carnet et les rangées en veille. R30 tient : le picto est un dessin, il ne change aucun champ | tests P1 (Ventilation→hotte, Évier→évier, Frigo→frigo, Embouteillage→embouteillage, 4 distincts ; aucun « objet » sur la liste) et R30 (mêmes rubriques pour Évier et Frigo) ; captures 01, 09, 25, 18, 26b |
| 2 | Liste vide ≠ i02-2 | Cadre pointillé « Votre premier carnet · s'affichera ici / Nouveau carnet · Idée », puis « Un carnet garde » et ses 3 lignes. Bulle verte collée au champ, flèche vers lui : « Écrivez ici un besoin : un frigo, une ventilation, un évier… / Entrée crée le carnet. Une note en vrac marche aussi. » G1 : les 3 puces touchables sont dans la bulle. Pendant la frappe, le cadre du geste remplace le cadre pointillé et la bulle se retire | tests P2 ; capture 02-390-clair (ouverte : bulle juste au-dessus du champ) et 02-390-sombre |
| 3 | « dès 180 CHF » | `prixDe` : le plus bas prix en lice. On écarte les façons écartées et les articles écartés au choix, d'après `tableau()` (lignes `ecarte`), et un lien non lu ne compte pas. Devise toujours écrite | test « dès 420 CHF » ; journal 01 : VU « 420 », « dès », « CHF » ; capture 01 |
| 43 | Ligne sur 2 lignes, pastille beige, « 0 façon » | `compte()` n'écrit rien de nul ; `.cn-compte-ligne` sans retour, en 14 px ; pastilles de groupe vertes (g05-1). L'en-tête du carnet garde la teinte d'i06-4 | test ; mesure 01 à 390 : « 3 façons · 6 articles · 1 en veille », h = 18 px (une ligne), scrollWidth = clientWidth (205 px) ; capture 01 |
| 11 (B) | « +2 · question, à acheter » absent | `texteAjouts` (ordre de g5:v01-16) et `ajoutsDuMessage(carnets, messageId)` : les genres des notes nées d'un message. Nouvelle prop `messageRecent` ; `ajouts` reste | test P11 sur la fixture ; **branchement du conteneur demandé** (plus bas) |
| 11 (genre) | Toute ligne dite « note » | Chaque note du carnet porte son genre, en mot (`.cn-genre-mot`) et en picto teinté : panier pour à acheter, liste pour à faire, ? pour question, ampoule pour conseil | test « chaque note porte son genre et son picto » |
| 5, 38 | Tableau ≠ h05-3 | Dès le 2e article, les façons vivent dans le tableau. Chacune a son nom, « 1 450 à 2 600 CHF » et sa pastille sur le critère (« tient 80 °C » pleine / « ne tient pas 80 °C »). La façon écartée garde sa raison, à la fin. Chaque ligne : rang (le 1er en vert), vignette, nom sur 2 lignes au plus, « CH · en stock », œil « veille demandée », « moins bien partout ». Colonnes : la valeur qui classe et le prix, en-têtes courts avec l'unité (« m³/h », « CHF »), sur une ligne. Les cartes de façons du dessus ne paraissent plus quand le tableau existe | tests P5 ; mesure 09 à 390 : noms [2,2,2,2,2,1] lignes, en-têtes 18 px (une ligne) ; captures 09 clair et sombre (ouvertes) |
| 5 (fin) | « Retenir la hotte » absent | `separationDe` (calcul local avec `passe()` de comparer.ts) : le 1er critère qui laisse passer une seule façon en lice. Ici : « Le critère sépare les deux façons : seule la hotte tient 80 °C. · Retenir la hotte », picto local, jamais ✻. Si la prop `separe` (texte de l'IA) existe, elle prime et porte ✻ | tests ; journal 09 : VU « Retenir la hotte », « tient 80 °C », « ne tient pas 80 °C » |
| 6 | Lien non lu classé | Il ne se classe jamais. On lit `Tableau.aRelire` (contrat de C), sinon on le déduit sur place. Les rangs sont recomptés sans lui (1 à 4). Sous le tableau : « ? · Lien sans aperçu · exemple.invalid/v5 · à relire · Ouvrir ↗ ». C'est pareil dans la feuille des cartes | test P6 ; journal 09 : VU « à relire » |
| 12 | État R04 absent | On y arrive comme dans h03-5 : toucher « Articles » (en-tête de la rubrique, ⌄) ouvre la feuille « Articles · 6 · 2 façons · Fermer / Classés par ce qui compte : le débit ». Une carte par article : rang sur la photo ou le picto, nom, vendeur · pays, « 2 600 CHF en stock », valeur du critère en gros (« 1 800 m³/h »), réglette, « Veiller » avec sa bascule. Viennent ensuite l'écarté (grisé, « non publié ») et le lien à relire. « exemple » est dit une fois au pied | test P12 (bascule → `onVeille('ZZ-V-A1', true)`) ; journal 25 : VU ; captures 25-390-clair, 25-1280-clair (ouvertes) |
| 8, 40 | Carte après lien muette | Variante `complete` (v06-10) : picto ou photo 72 px, nom, « domaine · pays · exemple », valeurs lues chiffrées (« 2 000 m³/h » ; un nombre lu en texte est regroupé), « 1 980 CHF » et la dispo en pastille. Puis la veille, puis « lu sur la page : nom, prix, débit · **tient 80 °C : oui** ». Le verdict n'est écrit qu'une fois : il est retiré des valeurs et de la liste lue. Toute carte d'article dit sa devise | tests P8, P40 ; journal 18 : VU « CHF », « lu sur la page », « exemple » ; capture 18-390-clair (ouverte, avant le correctif « 2000 » → « 2 000 ») |
| 13 | Fiche ≠ h01-6 | Photo de la page, ou le picto en grand dans le cadre photo. Héros du critère : valeur en gros et piste, « la plus haute des 4 » ou « la plus basse des 5 », d'après `placesDe(tableau(carnet))`. Offres de la même machine (« 2 offres · même machine », la moins chère d'abord, CHF, Ouvrir ↗). Caractéristiques avec leur rang (« 1re », « 2e »), seulement sur une valeur qui classe. « Choisir · <vendeur> » en vert. Veille R31 inchangée | tests P13 ; capture 26b-390-clair (ouverte) : photo-picto, CHF, Choisir vert. **Le héros et les rangs n'y sont pas** : le conteneur ne passe pas encore `carnet` (plus bas) |
| 27 | En-tête Créer · après réduit | Tout juste créé (`vientDEtreCree`, état Idée) : en tête « ●○○○ idée », puis l'encadré entier « Idée · 18 nov. / Ensuite : l'IA cherche les façons ». Les rubriques suivent en lignes, comme g5:v04-4, dont **« Photos · aucune »**. g5:v04-4 la montre, et seulement dans cet état : ailleurs, la rubrique vide reste masquée (« Rangé derrière ») | tests P27 (les deux cas) ; journal 07 : VU ; capture 07-390-clair (ouverte ; points corrigés ensuite : le 1er est bleu) |
| 21 | Photo sans trace | `Photos` : vignette de chaque photo rangée et étiquette « non lue » posée dessus, tant que le document ne dit pas `lue: true`. aria « Photo du 18 nov., non lue » | test P21. Si la photo n'arrive pas dans `carnet.photos`, le manque est en amont (geste photo, autre lot) |

Ce qu'a vu g5:v04-4 (P27, demandé) : en tête « ‹ Carnets · ●●●● idée · ··· », le titre, l'encadré beige « Idée · 17 nov. /
Ensuite : l'IA cherche les façons », le bandeau « ✓ Carnet créé, en tête des Carnets · ↺ Annuler », « « embouteillage » · votre
phrase en titre », puis cinq lignes à filet : Ce qui compte · rien encore : l'IA le proposera ; Façons · aucune : l'IA les cherche ;
Articles · aucun : collez un lien ; **Photos · aucune** ; Notes · aucune.

## Critères

- (a) `npx vitest run tests/unit/carnetsCritique4Figes.test.tsx tests/unit/carnetsEcrans.test.tsx` : **2 fichiers, 79 tests verts**.
  `carnetsEcrans` : j'ai adapté 4 assertions aux changements des lots voisins, sans affaiblir la règle. NoteEnVrac : le type ▾ est
  devenu un `select`. SupprimerCarnet : G35 est découpé en `<b>`. Fixture : « Moins de condensation » (critique 15). libellé
  d'écarté : « écarté : … ». Toute la suite `tests/unit/carnets*` : 403/404. Le seul échec est hors de mon lot :
  `carnetsCorrection1Integration` « libellé d'écarté », qui suit le nouveau `libelleEcarte` du lot C.
- (b) `npx tsc --noEmit -p tsconfig.json` : 0 erreur.
- (c) 40 captures, 7 états × 390 tactile et 1280 × clair et sombre, plus les pleines pages de 18, 25 et 26b. Le journal donne
  VU pour chaque texte attendu, aucun ABSENT, aucune `pageerror`. J'ai ouvert : 01-390-clair, 02-390-clair (avant et après le
  correctif de la bulle), 02-390-sombre, 07-390-clair, 09-390-clair, 09-390-sombre, 18-390-clair, 25-390-clair, 25-1280-clair et
  26b-390-clair. Le côte à côte se fait avec les maquettes ouvertes au départ (g05-1, i06-1, i02-2, i06-2, h05-3, i06-4, h03-5,
  h06-5, h01-6, v04-4, v06-10). Le rejeu final et l'ouverture des autres captures passent à l'exécutant.

Essais : pictos 2 (tireuse avalée par « becs », puis « pression » retirée) ; ligne de compte 2 (double espace) ; bulle de la
liste vide 3 (le fond qui défile s'arrête au haut du champ : `bottom: 14px`) ; banc 2 (`.env` absent : Firebase fictif).

## Doutes et limites

- **26b au banc** : le héros (« la plus haute des 4 »), le rang des caractéristiques et les 2 offres ne paraissent que si
  `CarnetsVue` passe `carnet`. Les tests les prouvent ; la capture 26b ne pourra les montrer qu'après branchement.
- **« Retenir la hotte »** : aucune opération « retenir une façon » n'existe dans `operations.ts`. Le bouton appelle
  `onRetenirFacon(faconId)` si le conteneur la donne, et ouvre Comparer sinon (là où vit Choisir).
- **Prix barré (h01-6)** : il n'est pas montré. Il demande un prix d'avant, que seule la relève donne, et la relève attend
  l'accord (R31). Rien n'est inventé.
- **Rang d'une caractéristique** : il ne se dit que pour une valeur qui classe (plus ou moins). Une valeur lue dont le sens est
  inconnu (la cadence dans la fixture) ne reçoit pas de « 2e » inventé.
- La pastille de façon nie un critère oui-non par son verbe (« ne tient pas 80 °C »). Un critère chiffré sans verbe dit
  « hors critère ».
- 18 : la photo des liens simulés n'existe pas, donc la carte montre le picto.

## DEMANDE INTÉGRATION (conteneur `CarnetsVue.tsx`, lot D ou pilote)

1. `<FicheArticle … carnet={ouvert.carnet as never} onOffre={id => setVue({ sorte: 'article', id: ouvert.id, articleId: id })} />`.
   Héros, rangs et offres de 26b en dépendent.
2. `<ListeCarnets … messageRecent={retour?.bandeau.sorte === 'vrac' ? retour.messageId : null} />`. Ou bien `ajouts`, pour P11 (B).
3. `<CarnetOuvert … onRetenirFacon={…} />` quand une opération « retenir une façon » existera (lot A). Sans elle, le bouton ouvre
   Comparer.

## DEMANDE EXECUTANT

Après le branchement 1 (et 2 si fait), depuis `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` :
1. `VITE_FIREBASE_PROJECT_ID=demo-banc-carnet VITE_FIREBASE_API_KEY=banc-sans-cle VITE_FIREBASE_AUTH_DOMAIN=demo-banc-carnet.firebaseapp.com VITE_FIREBASE_APP_ID=1:1:web:banc npx vite --port 5397 --strictPort &`
2. `node C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-port-carnet/voies/corr4-corr4-B-figes-liste-carnet-article/captures.mjs 5397`
3. Arrêter vite : `netstat -ano | grep ":5397 " | grep LISTENING` → `taskkill //PID <pid> //F //T`. Attendu ensuite : 0 écoute.
Sortie attendue : `cap/journal.txt` ne contient que des VU, aucune ligne ABSENT, aucune `pageerror`. La mesure 01 donne `h` ≈ 18 et
`sw` = `w`. La mesure 09 donne des noms ≤ 2 et des en-têtes de 18. 40 png dans `cap/`.
Captures à ouvrir côte à côte : 01 (g05-1), 02 (i02-2), 07 (v04-4), 09 (h05-3), 18 (v06-10), 25 (h03-5), 26b-plein (h01-6 : héros
« la plus haute des 4 », « 1re sur 4 », Choisir vert), aux deux tailles et dans les deux thèmes. Me renvoyer la liste « combien et
quels problèmes ? ».

DÉCISION À PRENDRE : que fait « Retenir la hotte » ? (a) Passer la façon en `retenue` et l'autre en `ecartee` avec la raison du
critère : une opération neuve du lot A, avec son inverse. (b) Ouvrir Comparer sur la façon retenue, comme aujourd'hui. (c) Aller
droit à Choisir avec le 1er de la façon. Ma recommandation : (a). C'est ce que dit le bouton, le carnet passe d'un toucher à
« façon retenue », et Annuler défait. Choisir reste dans Comparer (R07).

CONNAISSANCE : dans `CarnetsVue`, la zone qui défile s'arrête au haut du champ : le champ vit hors d'elle. Un élément collé au champ
(sticky) prend donc `bottom` ≈ 12 à 14 px, et non `--cn-champ-h`. Le banc `?preview=carnets` de port-carnet ne démarre qu'avec des
`VITE_FIREBASE_*` fictifs, déjà notés en corr3.

LEÇON PROPOSÉE : un lot d'écrans figés qui dépend d'une prop du conteneur nomme ce branchement dans son brief, ou possède le
conteneur. Ici, 26b ne peut pas être prouvé au banc par le lot qui l'a corrigé.
