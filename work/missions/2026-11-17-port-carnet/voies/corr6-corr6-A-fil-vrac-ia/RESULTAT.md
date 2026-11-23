OK — note en vrac découpée par objet, type tenu, critère remplacé ; 15 points couverts, 2 relais à C
<!-- LOT corr6-A-fil-vrac-ia · worktree port-carnet, HEAD b3bb2d0fd, sans commit · 18.11 -->

## Fichiers écrits (tous dans « Possède »)
- Source : `src/ui/carnets/CarnetsVue.tsx`, `rangement.ts`, `NoteEnVrac.tsx`, `Bandeau.tsx`, `CadreArrivee.tsx`, `ChampCarnet.tsx`,
  `LigneRangee.tsx`, `carnets-fil.css` ; `src/domain/carnets/analyseLocale.ts`, `iaSimulee.ts`, `ia.ts`, `rattacher.ts`, `operations.ts`.
- Tests : `tests/unit/carnetsCritique6Fil.test.tsx` (nouveau, 29 tests). Tests mis à jour selon la règle (défaut corrigé, jamais
  désactivé) : `carnetsCritique4Donnees` (P20, garde inchangée), `carnetsCritique4Fil` (titre stocké), `carnetsCritique5Donnees` (g35),
  `carnetsCritique5Fil` (titre stocké, hors ligne, titreCourt « … », « › Texte d'origine »), `carnetsIA` (puces proposées exclues, carnet
  par objet, besoin en titre), `carnetsOperations` (P11b prouvé sans unité), `carnetsRangement` (carnet par objet), `carnetsParcours`.
- Preuve : `preuve.cjs`, `montage.cjs`, captures `m390-clair-22a…`, `22b`, `23`, `22c`, `23c`, `26`, `27b`, `28b`, `29b`,
  `cote-a-cote-v01-15-16.png` (dans ce dossier).

## Problème → fait → preuve
1. **n° 1, note en vrac** → `planVrac` : une ligne sans carnet proche ouvre le carnet de son **objet** (`objetDe` : « Sol local », « Pompe »,
   jamais la note), deux lignes d'un même objet le partagent, le brassin (levure, brassage…) va dans « Prochain brassin » (G23).
   `decouper` coupe aussi une ligne de phrases étiquetées (« Pour le bac : … . Pour la hotte : … »), d'où la note 390 sur une ligne.
   Jours de la semaine en mots vides (« …, jeudi » rattaché à Évier). Le carnet neuf garde ses lignes pour phrase (sa carte ne cite plus la
   levure). Après : la puce dit le carnet seul (v01-16), « › Texte d'origine ». iaSimulee découpe pareil.
   → test 1 (6 cas) ; captures 22b, 23 ouvertes : « ✻ L'IA découpe votre note : 3 lignes, 2 carnets », puis « ✓ 3 lignes rangées dans
   2 carnets · Annuler », levure et brassage dans Prochain brassin, Sol local seul ; 22c/23c : note 390 → 3 lignes, 3 carnets
   (bac → Évier, « tient 80 °C » → Ventilation, pompe → « Pompe »). Côte à côte ouvert : `cote-a-cote-v01-15-16.png`.
2. **n° 2, type** → `genreDEtiquette` (« Ajoute : » = achat) partagée par l'aperçu et iaSimulee ; `PIECES` lit « sachets » ; à
   l'envoi, le type annoncé s'applique (ecrireIA vrac). → test 2 : pendant = après, 1 achat sur 3 lignes.
3. **n° 3, critère** → `critereARemplacer` (operations) : sa valeur (vous, locale ou source phrase) remplace le critère IA de même
   caractéristique ou même unité, passe en tête ; Annuler rend l'ancien. → test 3 (Évier : « assez profond pour un fût » remplacé, Annuler).
4. **n° 4 et 5, 390** → `onRetenirFacon` branché (Choisir sur la façon). Au banc 390 tactile, `elementFromPoint` au centre :
   « Comparer côte à côte », « Retenir la hotte », la ligne « Choisi… Pourquoi » sont libres (aucun calque) ; data-vue = comparer,
   choisir, choisir. → test 4 ; capture 27b ouverte (tableau g01-8, meilleure valeur surlignée, « classées par… »).
5. **n° 9, D-35** → iaSimulee propose les caractéristiques de la catégorie en puces (`propose`) dans un carnet neuf ; `ia.ts` et
   `operations.ts` les gardent pour un carnet neuf ; aucun fournisseur inventé (garde B7 inchangée). → test 5 (exemple marqué, un toucher).
6. **n° 11** → la promesse « se lisent à l'envoi » se tait sans lecture possible ; les adresses `exemple.invalid/<famille>-n` se lisent
   (hotte-2 = 2e hotte, pompe-2). → test 6, dont G20 (le 2e lien fait naître le tableau).
7. **n° 12** → `rangDuLien` (tableau + placesDe) : « 1re de sa façon, devant … » ; Bandeau et LigneRangee le disent. → test 7.
   **Relais lot C** : `CarnetOuvert.tsx` l. 450 doit passer `rang={r.rang}` à `LigneRangee`, et `RangeeV` gagner `rang?: string`
   (CarnetsVue le fournit déjà par `Object.assign`). Sans cela, rien ne s'affiche.
8. **n° 13** → lien seul depuis la liste : carnet « Pompe pour le moût », critère « Supporter le moût chaud » (source ia, sans nombre
   inventé), l'article garde « Pompe de transfert inox ». → test 8. **Écart** : le prompt serveur (`functions/src/carnetIA.ts`) ne demande
   pas de titrer par le besoin ; hors lot, à écrire puis § Accords.
9. **n° 14** → dans mes composants, la phrase est citée une fois (LigneRangee) ; le bandeau « Rangé ici » ne la cite pas. → test 9.
   Les autres citations éventuelles sont dans `CarnetOuvert.tsx` (lot C) : à juger sur la capture 13.
10. **n° 24** → avis « Hors ligne : rangé sur l'appareil, tel quel » ; de retour en ligne, « De retour en ligne : 1 message rangé tel quel ·
    Ranger maintenant » (`rangement.reprendre`). → test 10.
11. **n° 26** → `titreCourt` finit par « … », jamais au milieu d'un mot ; le placeholder mesure le champ (`measureText`) : à 390, 154 px,
    « Ajouter à ZZ TEST… » au banc (le titre stocké garde sa marque, décision du pilote ; sans marque : « Ajouter à Évier inox… »). → test 11,
    capture 26 ouverte.
12. **n° 29** → `.cn-vadans` sur un rang (défile au besoin), titre court sur la puce, entier en aria-label. → test 12 (pas de capture 11).
13. **n° 35** → `aucunCarnetNEnParle` : 0 « Aucun carnet encore », 1 « Votre seul carnet n'en parle pas ». → test 13.
14. **n° 31** → `carnetProche` : même catégorie ET même besoin (qualifiants du titre communs). Salle de brassage ↛ cave de garde. → test 14.
15. **Décisions** → prix (5 formes CHF, EUR si écrit : déjà justes, test) ; Garder à part de bout en bout ; Annuler une suppression de
    note ; `titreSansBanc` retiré de CarnetsVue (titre stocké partout) ; source du critère lue par `sourceDuCritere` dans CadreArrivee. → test 15.

## Critères
- (a) `npx vitest run tests/unit/carnetsCritique6Fil.test.tsx` : **29 passed**.
- (b) suite carnets : **715 passed, 6 failed**. Les 6 (G8 `critereQuiTranche` ×4, R06 « rangé par » ×2) viennent des autres lots :
  rejoués sur HEAD + leurs fichiers sans les miens (copie hors git), ils échouent aussi. `grep .skip|.todo|.fails|xit(` : rien.
- (c) `npx tsc --noEmit -p .` : 0.
- (d) mes fichiers seuls sont les miens ; `git status` liste aussi ceux des lots B et C (comparer, fixture, CarnetOuvert, Choisir…).
- (e) captures 390 tactile clair ouvertes : 22b, 23, côte à côte, 27b, 26. 28b et 29b prises, vérifiées par data-vue, non ouvertes.
- Essais : (a) 4, (b) 4, (c) 1, (e) 2. Vite (port 5641, `VITE_FIREBASE_*` fictifs, Google coupé) arrêté : 0 écoute.

## Doutes et limites
- La carte « Prochain brassin » dit « +2 · à acheter » : `texteAjouts` de `ListeCarnets.tsx` (lot B ou C) ne compte pas les notes.
  Pour « +1 à acheter · 1 note » : compter par genre (`ORDRE_GENRES` sans 'note').
- G35 au banc : l'option `g35` de la fixture donne « Ventilation de la cave de garde », un autre besoin ; G35 ne s'y montre plus. La
  fixture (autre lot) doit donner une 2e idée du même besoin (« Ventilation de la salle, 2e idée »).
- La gaine de la note de la fixture n'a aucun mot commun avec Ventilation : elle ouvre « Gaine alu ». Le vrai modèle peut mieux faire,
  mais l'annonce locale prime (annoncé = appliqué).
- Incident : un `git worktree prune` lancé pour la mesure par différence a touché les métadonnées partagées du dépôt principal. Il a été
  refusé sur 5 entrées. D'autres entrées périmées (dossiers déjà absents) ont pu être retirées. Aucun fichier de travail n'a été touché.

DÉCISION À PRENDRE : « ajouter le sel » (sels de brassage) doit-il aller dans « Prochain brassin » ? Options : (A) non, objet à part
(actuel) ; (B) oui, ajouter les sels (sel, gypse, chlorure) au lexique du brassin. Recommandation : B, au lot suivant, sur sa parole.

## DEMANDE EXECUTANT
Banc : `cd port-carnet && VITE_FIREBASE_PROJECT_ID=demo-banc-carnet VITE_FIREBASE_API_KEY=banc-sans-cle VITE_FIREBASE_AUTH_DOMAIN=demo-banc-carnet.firebaseapp.com VITE_FIREBASE_APP_ID=1:1:web:banc npx vite --port 5641 --strictPort --host 127.0.0.1 &`
1. `node <ce dossier>/preuve.cjs 1280 clair 5641 22` puis `… 1280 sombre 5641 22` → `d1280-<thème>-22b-vrac-pendant.png` (= 17) et
   `-23-vrac-apres.png` (= 18). Attendu : « 3 lignes, 2 carnets », puis « ✓ 3 lignes rangées dans 2 carnets », levure dans Prochain brassin.
2. Avec le script du lot D, à 390 tactile clair : 09 (carnet ouvert), 10 (bulle G8), 13 (Évier : « fond de bac 38 cm minimum » → en tête,
   phrase citée une fois), 14b et 15b (Ventilation : coller `exemple.invalid/hotte-140`, puis `exemple.invalid/hotte-2` → carte v06-10,
   puis le rang dans le bandeau, si le lot C a branché `rang`), 19b (liste : coller `exemple.invalid/pompe-inox`, puis dans le carnet
   `exemple.invalid/pompe-2` → « Pompe pour le moût », tableau), 12b (Ventilation : taper « attendre l'avis du ferblantier sur la hotte »,
   600 ms → « Garder à part »), 35 (`&hors-ligne=1`, ajouter une note, puis sans le paramètre : « Ranger maintenant »), et 11 (puces « Va
   dans » sur un rang).
3. Ouvrir chaque capture, puis arrêter vite (0 écoute sur 5641).

CONNAISSANCE : au banc, la note en vrac se découpe par objet (`objetDe`) ; le brassin a son carnet (« Prochain brassin ») ; une valeur à lui
remplace le critère IA de même axe (`critereARemplacer`). Le placeholder se mesure (`measureText`).
LEÇON PROPOSÉE : une mesure « par différence » se fait dans une copie hors git (`git archive` + jonction node_modules), jamais par
`git worktree add/prune` : chemins trop longs sous Windows et métadonnées partagées par toutes les sessions.
