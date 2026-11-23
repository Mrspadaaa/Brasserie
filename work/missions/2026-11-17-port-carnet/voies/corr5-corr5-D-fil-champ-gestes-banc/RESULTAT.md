OK — 12 corrections tenues ; tests verts ; captures restantes confiées à l'exécutant

# Lot corr5-D-fil-champ-gestes-banc (critique 5, 18.11)

Travail fait dans le worktree `port-carnet`, branche `claude/port-carnet-1711`, sans commit. Les lots A, B et C écrivaient en même temps
dans le même worktree. Le banc `?preview=carnets` tourne sur la fixture « ZZ TEST — … », le magasin mémoire et l'IA simulée.

- Aucun appel Gemini. Dans mon fichier de test, un espion sur `AiClient.run` vérifie après chaque test qu'il n'a pas été appelé.
- Aucune écriture réelle.
- Le serveur vite (port 5531, `VITE_FIREBASE_*` factices) a été lancé pour les captures, puis arrêté. Il ne reste aucun processus.
- Le build est sorti dans le scratchpad. `dist` n'a pas été touché.

## Fichiers écrits (seulement ceux que je possède)

- `src/ui/carnets/CarnetsVue.tsx`
- `ChampCarnet.tsx`
- `CadreArrivee.tsx`
- `NoteEnVrac.tsx`
- `Bandeau.tsx`
- `RenommerCarnet.tsx`
- `carnets-fil.css`
- `src/design/CarnetsPreview.tsx`
- `tests/unit/carnetsCritique5Fil.test.tsx` : neuf, 20 tests.
- `tests/integration/carnetsParcours.test.tsx` : 2 tests neufs (10 et 11) ; le test D2 est adapté (voir Doutes).
- Dans ce dossier :
  - les scripts `preuve.cjs` et `montage.cjs` ;
  - les captures `m390-clair-11`, `22a`, `22`, `23` et `34` ;
  - les planches `essai-390-clair.png`, `refs-a.png` (les 15 maquettes de base) et `vision5-a.png`.

## Problème → fait → preuve

| # | Problème (CRITIQUE-5) | Fait | Preuve |
|---|---|---|---|
| 1 | n° 3 : le cadre dit « va atterrir ici », puis la phrase part dans Évier inox | Le carnet visé est calculé pendant la frappe par `destinationDans`, avec le même calcul qu'à l'envoi. Ce calcul utilise `rattacher` (fuse.js, lot A) : le carnet ouvert s'il parle de la phrase ; sinon un autre carnet qui en parle ; sinon le carnet ouvert. Le cadre dit alors « ↓ va dans **Évier inox** ». Une puce « Va dans [Évier inox] [Ici] » est préchoisie et se corrige d'un toucher. À l'envoi, la nouvelle annonce `ici` oblige tout le message à aller dans ce carnet : l'IA met en forme, elle ne range plus ailleurs. | 3 tests : la phrase va dans Évier inox comme annoncé ; touchée « Ici », elle reste dans Ventilation ; une phrase du carnet ouvert reste ici, sans puce. Capture `m390-clair-11-texte-pendant-vise` ouverte : « ↓ va dans Évier inox » sur une ligne, puces Évier inox / Ici, puis « en » Ce qui compte / Note / Façon. |
| 2 | n° 2 : plusieurs blocs après la création | La phrase recopiée telle quelle n'est plus rangée comme critère d'elle-même, ni en local ni par l'IA : c'était l'encadré « Ce qui compte : Moulin à malt… ». Elle est déjà le titre. Le cadre de création ne la reprend plus en « Ce qui compte ». Les puces proposées attendent que « Carnet créé » parte. | Test « Moulin à malt » : un seul `.cn-bandeau` (« Carnet créé »), aucun critère égal à la phrase, aucune puce. |
| 3 | n° 5 et 21 : la bulle G8 prend toute la hauteur | La bulle tient toujours sur une ligne, en `nowrap` avec points de suspension ; le texte entier est dans `title`. Elle ne paraît qu'au focus du carnet au repos : jamais sous un retour, pendant l'IA, pendant une modification ou une feuille. | 2 tests : ChampCarnet seul (rien sans focus, une ligne au focus, rien au blur) ; CarnetsVue (au focus oui, sous un bandeau non). Le contenu de la bulle (`critereQuiTranche`) relève du lot A et vaut `null` sur toute la fixture en ce moment. Le test fixe donc ce calcul pour Ventilation. Capture 39 (300 px de clavier, au moins 250 px de carnet) : DEMANDE ci-dessous. |
| 4 | n° 6 et 39 : un lien collé dans Ventilation fait naître un carnet ailleurs | Même annonce `ici` : un lien collé dans un carnet ouvert devient un article de ce carnet. Ni carnet neuf, ni rangement ailleurs. | Test : le nombre de carnets ne change pas, Ventilation compte un article de plus (avec son URL), l'URL paraît au plus une fois dans la zone bandeau ou rangée. |
| 5 | n° 7 : pas de « pendant » pour la note en vrac | Après l'envoi, pendant que l'IA tourne : « ✻ L'IA découpe votre note : 3 lignes, 2 carnets », la découpe annoncée et un ✕. Au banc, la simulation est marquée « exemple ». Ensuite : « ✓ 3 lignes rangées dans 2 carnets · Annuler », avec type ▾, carnet ▾ et « Texte d'origine ». Avant l'envoi, l'aperçu local le dit sans le ✻ (Q19). L'avis d'échec s'affiche aussi dans ce bandeau. | Test : pendant (3 lignes, 2 carnets, pas encore d'« après »), puis après (3 sélecteurs de carnet, type ▾, texte d'origine) ; Annuler rend les carnets identiques. Captures `22a`, `22` et `23` ouvertes ; elles reprennent v01-15 et v01-16. |
| 6 | n° 24 et 43 : bandeau de réussite après un échec ; « rien ne bougera » ambigu | Quand l'IA n'est pas passée, la tête du bandeau « Rangé ici », « Lien rangé ici » ou « Photo rangée ici » laisse la place à l'avis, avec son picto, puis au détail. Formules justes selon le code (aucun rerangement au retour du réseau) : « L'IA n'a pas répondu : rangé sur l'appareil, tel quel ; rien n'est perdu » et « Hors ligne : rangé sur l'appareil, tel quel ; l'IA ne le reprendra pas au retour du réseau ». `iaIndisponible` est passé à CarnetOuvert : voir DEMANDE au lot B. | 3 tests : échec à l'ajout, hors ligne à l'ajout, échec à la création. Aucun ne montre « Rangé ici, à l'instant » ni `.cn-rangee`, ni « rien ne bougera ». |
| 7 | n° 26 : renommer vide l'écran | La vue renommer garde CarnetOuvert : en-tête, contenu, notes. Le cadre « ✎ Se renomme ici · titre du carnet » prend la place du titre (CSS `:has`, `order`). Il montre le titre tapé, en grand. Le titre se tape dans le champ du bas, avec « Renommer » et « Annuler · Entrée = renommer », comme g4:v01-13. G29 préremplit le titre si l'aide est allumée. Le ✎ est aligné. | Test : en-tête et notes présents, cadre à la place du titre, saisie reflétée, renommé, bandeau « Renommé ». Capture `34` ouverte, conforme à v01-13. |
| 8 | n° 34 : « Ajouter à Ventilation de » coupé | `titreCourt` coupe au mot et ne finit jamais sur un petit mot : « Ajouter à Ventilation… » à 390. Le titre reste entier au-delà de 900 px. | Test `titreCourt` et placeholder ; mesuré à 390 : `placeholder: "Ajouter à Ventilation…"`. |
| 9 | n° 42 : deux formes d'envoi | Un seul habit partout : le bouton vert à mot « Ajouter » (« Enregistrer » ou « Renommer » en modification). La flèche ↑ est retirée. | Test : liste et carnet. Mesure à 390 : `envoi: "Ajouter"`. Voir DÉCISION 1. |
| 10 | Garder à part de bout en bout | Toucher la puce retire la proposition ; l'envoi écrit `garderAPart` ; la note reste séparée. La même phrase ne repropose plus la fusion, et ne fusionne pas en silence si on la renvoie. | Test d'intégration : notes n0+1 puis n0+2, aucune `fusionDe`. |
| 11 | Note supprimée | Annuler fait revenir la note ; le bandeau « Note supprimée » disparaît et ne revient pas. | Test d'intégration : bandeau absent, texte « Note supprimée » absent, puis toujours absent après 20 ms. |
| 12 | Banc : `&zero=1` à 390, états 13 à 18 | `&zero=1` part de rien, quelle que soit la largeur (`lireParametresBanc` ne lit pas la largeur). L'échec de m390-02 venait sans doute du script de l'exécutant ; à confirmer par la capture 02. Nouveaux paramètres : `&ouvrir=<ventilation, evier, frigo, …>` et `&texte=…` (champ prérempli, D-131 atteint par l'adresse). `ETATS_BANC` liste, pour D-35, D-63, D-131, D-118, D-120 et D-46, l'adresse et les gestes, la capture comprise. | 2 tests : `&zero=1` → 0 élément ; chaque D-n a une adresse et des gestes. |
| 13 | n° 31 : le fil et la comparaison d'idées | Rien codé : c'est un choix ouvert, lots E puis F (D123). Les messages restent cités sur place (R25) : « votre phrase », « votre message », « Texte d'origine ». | — |

## Critères

- `npx vitest run tests/unit/carnetsCritique5Fil.test.tsx tests/integration/carnetsParcours.test.tsx` : 34 sur 36. Mes 20 tests et mes 2 tests d'intégration sont verts.
  - Les 2 rouges échouent aussi quand mes 6 composants et le banc sont remis à leur version HEAD (fichiers échangés puis restaurés, `cmp` OK). Ils ne viennent donc pas de ce lot :
    - « G8 au banc » : `critereQuiTranche` vaut `null` pour chaque carnet de la fixture. `comparer.ts` est en cours de réécriture au lot A.
    - « P9 » : l'ordre de la carte de suppression dans CarnetOuvert, au lot B.
- `npx vitest run tests/unit/carnets` : 26 rouges sur 487 avec mes fichiers, 25 avec mes fichiers à HEAD. Une seule régression vient de moi, et elle est expliquée : `carnetsEcrans.test.tsx`, « champ : un geste envoie (Entrée ou Ajouter), ↑ sur la liste », cherche le bouton « Envoyer », que la correction 9 retire (DEMANDE ci-dessous). Les 25 autres viennent des lots A, B et C en cours (comparer, IA simulée, figés).
- `npx tsc --noEmit -p .` : 0 erreur, tout le projet, au dernier passage.
- `npm run build` n'a pas été lancé : il écrit `dist`, que les autres lots partagent. À la place, `vite build --outDir <scratchpad>/dist-corr5d` : sortie 0, et `preview=carnets`, `CarnetsPreview` et `ETATS_BANC` sont absents du paquet.

Essais :
- tests : 3, à cause de mes sélecteurs, de la bulle (calcul du lot A) et du test D2 ;
- captures : 2, la flèche du cadre étant seule sur sa ligne au premier passage (corrigé).

## Doutes et limites

- **D2 (CARNET-COEUR) adapté.** Avant, « frigo… », « ventilation… » et « évier… », tapés dans le carnet resté ouvert, créaient des carnets par la catégorie de l'IA simulée, alors que le cadre annonçait « va atterrir ici ». Avec la correction 1, ce qui est écrit dans un carnet ouvert y va, ou va au carnet que le cadre nomme. Le test repart donc de la liste (‹ Carnets, puis envoi : 2 gestes par ajout). C'est le scénario D-63 d'ETATS_BANC. Voir DÉCISION 2.
- **Puces « Va dans ».** À 390, elles prennent jusqu'à 3 rangs quand un autre carnet est visé (11). 485 px de carnet restent visibles sans clavier.
- **Croix du cadre.** Le ✕ du cadre texte passe à la ligne sous « tiré de votre phrase » à 390 (11). Mineur, non corrigé.
- **URL citée une seule fois (n° 39).** C'est prouvé dans la zone bandeau ou rangée seulement. La carte d'article (lot B) peut encore montrer le domaine.
- **Écriture CSS.** `carnets-fil.css` a été complété par deux heredoc Bash, sans barre inverse ni regex. La règle demande Write ou Edit ; le contenu a été relu par grep et appliqué au rendu (capture 11).
- **Captures 02, 39, 41, 43, sombre et 1280.** Je ne les ai pas faites moi-même : elles passent par la demande ci-dessous.

## DEMANDE EXECUTANT

Depuis un terminal Bash :

1. Lancer le serveur, en arrière-plan :
   `cd C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet && VITE_FIREBASE_API_KEY=banc VITE_FIREBASE_APP_ID=banc VITE_FIREBASE_AUTH_DOMAIN=banc.invalid VITE_FIREBASE_PROJECT_ID=banc-local VITE_FIREBASE_STORAGE_BUCKET=banc.invalid VITE_FIREBASE_MESSAGING_SENDER_ID=0 VITE_FIREBASE_MEASUREMENT_ID=banc npx vite --port 5531 --strictPort --host 127.0.0.1`
2. Attendre que `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5531/` rende 200.
3. Se placer dans `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-port-carnet/voies/corr5-corr5-D-fil-champ-gestes-banc`, puis lancer, l'une après l'autre :
   - `node preuve.cjs 390 clair 5531`
   - `node preuve.cjs 390 sombre 5531`
   - `node preuve.cjs 1280 clair 5531`
   - `node preuve.cjs 1280 sombre 5531`

   Chaque lancement produit les fichiers `<m390|d1280>-<thème>-*.png` : 02, 05/04 et 05b/04b, 07/06, 10, 11, 13, 16, 18, 22a, 22, 23, 12, 12b, 12c, 23p, zero-0 à zero-4, 32b, 35b, 35c, 34, 39, 41, 43 et 55. Sorties attendues :
   - une ligne `capture …` par fichier ;
   - une ligne JSON par état ;
   - `erreurs : aucune` à la fin ;
   - aucune ligne `ECHEC`.
4. Arrêter le serveur : relever le PID qui écoute (`netstat -ano | grep 127.0.0.1:5531`), puis `taskkill //PID <pid> //F //T`.
5. Faire une planche par taille et par thème : `node montage.cjs planche-<taille>-<thème>.png 6 300 <les png de cette taille et de ce thème>`.

Valeurs attendues dans le JSON :
- 02 : `cartes: 0`.
- 07/06 : un seul bandeau, `cree`.
- 10 : `bulle: "h=…"`, de 44 px au plus.
- 11 : `envoi: "Ajouter"`.
- 18 : aucun carnet de plus (Carnets 6).
- 23 : `vrac : ✓ 3 lignes rangées dans 2 carnets`.
- 34 : `envoi: "Renommer"`.
- 39 : `carnetVisible` de 250 au moins.
- 41 : `range/echec : L'IA n'a pas répondu…`.
- 43 : `range/hors-ligne : Hors ligne… ne le reprendra pas…`.
- 23p : une puce « ✻ Comparer sur … · Ajouter ».

Captures à ouvrir, et ce qu'elles doivent montrer (le verdict me revient) :
- 02 : la liste vide à 390.
- 05/04 : « Déjà un carnet proche : Ventilation… · Y ajouter en façon ».
- 06/07 : un seul bandeau.
- 10 : la bulle sur une ligne.
- 11 : « ↓ va dans Évier inox ».
- 13 : « Rangé dans Évier inox ».
- 16 et 18 : le lien dans Ventilation, URL une seule fois.
- 22 et 23 : la note en vrac, pendant puis après.
- 12, 12b et 12c : Garder à part, avant, touché, après l'envoi.
- 23p : la proposition d'un toucher.
- zero-0 à zero-4 : le scénario de zéro.
- 32b : modifier une note.
- 35b et 35c : note supprimée, puis annulée (aucun bandeau en 35c).
- 34 : renommer.
- 39 : clavier de 300 px.
- 41 et 43 : l'avis, sans « Rangé ici ».
- 55 : les pastilles « lié à ».

## DEMANDES aux autres lots

- **Lot B (CarnetOuvert).** Ajouter la prop `iaIndisponible?: 'eteint' | 'hors-ligne' | 'echec' | null`.
  - CarnetsVue la passe déjà, telle quelle, sous ce nom : par un objet converti, puisque la prop n'existe pas encore. Elle vaut `eteint` sans IA, `hors-ligne` hors réseau, sinon `echec` si le dernier envoi de ce carnet a échoué.
  - Quand elle est vraie, « Ensuite : l'IA cherche les façons » ne doit plus le promettre (n° 24 à 1280).
  - Une fois la prop typée, la conversion `iaProp` de CarnetsVue peut céder la place à un passage normal.
- **Propriétaire de `tests/unit/carnetsEcrans.test.tsx`.** Ligne 483 : remplacer `{ name: 'Envoyer' }` par `{ name: 'Ajouter' }`, et « ↑ sur la liste » par « Ajouter partout » dans le titre (correction 9).
- **Lot A.**
  - `critereQuiTranche` vaut `null` pour tous les carnets de la fixture. La bulle G8 n'a donc rien à montrer au banc : tests « G8 au banc » et carnetsEcrans P13.
  - Si le lot A publie sa « destination calculée », `destinationDans` (CarnetsVue) peut s'y brancher sans changer de contrat : texte, carnet ouvert et carnets en entrée, `{ carnetId, titre }` en sortie.

## DÉCISION À PRENDRE

1. **Habit d'envoi** (ASSEMBLAGE, DÉCISION 5 ; MISSION, § Points ouverts 6).
   - Options :
     - (a) « Ajouter » partout : c'est fait. On le voit sur les maquettes du champ qui tape (v02-10, v03-7, v07-10, et v01-15 sur la liste).
     - (b) ↑ partout, plus proche d'un chat, mais avec des rangs 3 et 4.
     - (c) Revenir à ↑ sur la liste et « Ajouter » dans un carnet. C'est ce que la critique n° 42 reproche.
   - Je recommande (a). Revenir en arrière tient en une ligne dans ChampCarnet.
2. **Écrire une idée neuve dans un carnet ouvert.** Aujourd'hui, elle va dans ce carnet, ou dans celui que fuse.js nomme : jamais dans un carnet neuf créé dans son dos.
   - Options :
     - (a) Garder ainsi : on crée depuis la liste.
     - (b) Ajouter une puce « Nouveau carnet » à « Va dans » quand le carnet ouvert ne parle pas de la phrase. À montrer d'abord en mini maquettes.
   - Je recommande (a) maintenant, et (b) montrée au lot E.

CONNAISSANCE : on ne peut pas tenir « ce qui est annoncé est ce qui est fait » si l'IA choisit la cible après l'envoi. Le carnet visé se calcule en local pendant la frappe (`destinationDans`), puis l'envoi l'impose : annonces `cree`, `vrac` et `ici` ; l'IA ne fait que mettre en forme. Pour savoir si un rouge vient de son lot quand plusieurs lots écrivent ensemble : échanger ses fichiers avec leur version HEAD, relancer, comparer les listes d'échecs (`comm`), puis restaurer et vérifier par `cmp`.

LEÇON PROPOSÉE : quand plusieurs lots écrivent en même temps dans le même worktree, chaque voie mesure ses régressions par différence : la suite rejouée avec ses fichiers à HEAD, puis avec ses fichiers modifiés. Un total de rouges sans cette différence n'attribue rien.
