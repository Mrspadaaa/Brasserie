OK — figés h05-3, h01-6, g05-1 rapprochés : 15 points sur 15, comptes unifiés, captures ouvertes

# Lot corr6-C : figés carnet ouvert, liste, article (critique 6, 18.11)

Worktree `port-carnet` (branche `claude/port-carnet-1711`, HEAD `b3bb2d0fd`), sans commit, sans build (dist intact). Gemini n'a jamais
été appelé, je n'ai touché à aucune donnée réelle, et je n'ai pas fait de stash. Vite dev tournait sur le port 5437, avec des
`VITE_FIREBASE_*` factices et les hôtes Google coupés. Il est arrêté : `netstat` ne montre plus aucune écoute sur 5437.

## Fichiers écrits (tous dans mon périmètre)
- `src/domain/carnets/comptes.ts` (neuf) : `comptesCarnet`, `pluriel`, `accord`, `texteComptes`.
- `src/ui/carnets/CarnetOuvert.tsx`, `ListeCarnets.tsx`, `SupprimerCarnet.tsx`, `FicheArticle.tsx`, `carnets.css`.
- `src/domain/carnets/fixture.ts` : `PHOTO_BANC_HOTTE` (sur ZZ-V-A2) et `NOTE_EN_VRAC_BANC`. `src/design/CarnetsPreview.tsx` :
  `ETATS_BANC` (14b, 15b, 19b, note en vrac).
- Tests : `carnetsCritique6Figes.test.tsx` (neuf, 15 tests). Mis à jour : `carnetsCritique4Figes`, `carnetsCritique5Figes`,
  `carnetsEcrans` (assertions qui figeaient l'ancien rendu).
- Voie : `captures.mjs`, `cap/` (12 captures et leurs journaux).
- modele.ts n'a pas changé : `sourceDuCritere` et `titreNeufDe` restent tels quels.

## Problème → fait → preuve
1. **n° 8, h05-3.**
   - Fait : une seule ligne « Articles 6 ⌄ · Comparer › » ; le bouton contient le texte « Comparer », donc `/Comparer/` le
     trouve. « ? Lien sans aperçu · à relire · Ouvrir ↗ » est dans le tableau, au pied des façons en lice, avant la conclusion.
   - Fait : à 390, marge de 12 px comme h05-3 et tableau resserré. Le nom tient sur 2 lignes au plus (clamp). La ligne dit
     « DE · délai 4 sem. · ⊙ veille », comme h05-3 ; « veille demandée » reste en `title`.
   - Preuve : test 1. Mesure 09 à 390 : `articlesHauteur 30` (une ligne), `retenirBas 728 < hautChamp 733`, façons à 281 et
     455, `lignesParNom [2,1,1,2,2]`. Captures 09-390-clair et -sombre ouvertes, à côté de h05-3 : deux façons, le lien et
     « Retenir la hotte » sont à l'écran.
2. **n° 14, g5:v03-8.**
   - Fait : le critère tout juste rangé ne s'écrit que dans sa ligne rangée. Il ne figure ni dans la ligne Critère, ni dans une
     sous-liste. « Tous les critères » est supprimé : le dépliant ne montre que les critères absents de la ligne.
   - Fait : la phrase n'est pas recitée quand elle est le critère, et la phrase du carnet ne l'est pas quand la ligne rangée la
     cite déjà.
   - Preuve : test 2.
3. **n° 15.**
   - Fait : `comptesCarnet` est la seule source des chiffres : façons en lice, écartée à part, articles lus et sans aperçu dans
     un même total. La liste, le carnet ouvert et la suppression la lisent.
   - Preuve : test 3 sur la fixture, qui donne partout « 2 façons · 6 articles », « 2 façons à comparer · Articles 6 » et
     « 6 articles, 2 façons, 1 façon écartée et 3 notes ». Captures 01, 09 et 36 (journal : `VU [36] « 2 façons, 1 façon
     écartée »`).
4. **n° 16, v04-4.**
   - Fait : l'encadré « Idée · Ensuite… » et les points ●○○○ sont supprimés. Restent le bandeau « ✓ Carnet créé · Annuler » et
     « votre phrase en titre » du lot A, et la pastille « Idée · 18 nov. ».
   - Preuve : test 4. Mesure 05 à 1280 : `{"encadre":false,"points":false}`. Captures 05-1280-clair et -sombre ouvertes.
5. **n° 32.**
   - Fait : l'état n'a plus qu'une forme, la pastille. Sur h05-3, « 2 façons à comparer » en tient lieu.
   - Preuve : test 5.
6. **n° 20, h01-6.**
   - Fait : `PHOTO_BANC_HOTTE` est un SVG en URL de données : image locale, sans réseau, simulée. Elle est posée sur la Hotte
     murale, un article d'exemple. La légende dit « photo de la page collée · exemple ». Sans photo, le picto reste le repli.
   - Preuve : test 6. Captures 26-390-clair et -sombre ouvertes : la photo est là.
7. **n° 33, h01-6.**
   - Fait : `filArianeCourt` coupe le titre sur un mot (« Articles · ZZ TEST — Ventilation… »). À 1280, le titre est entier ;
     le nom complet est dans l'`aria-label`.
   - Fait : à 390, mise en page h01-6 : photo à 104 px, valeur et réglette côte à côte. La veille et son état tiennent sur une
     ligne.
   - Preuve : test 7. Mesure 26 : `filHauteur 44` (une ligne) ; veille en bas à 640 et « Choisir · Gastro Lüftung » à 691,
     sous le champ à 733 : les deux sont au-dessus du pli.
8. **n° 22.**
   - Fait : choisir Renommer ferme le menu, que ce soit par le menu, par ✎, par Échap ou d'un toucher ailleurs.
   - Preuve : test 8. Mesure 25 à 1280 : `{"menuOuvert":false,"cadre":true}`. Captures 25-1280 ouvertes.
9. **n° 28.**
   - Fait : `pluriel` est appliqué partout dans mes fichiers (Façons, feuille des cartes, ligne d'état, suppression).
   - Preuve : test 9, qui rend « 1 façon ».
10. **n° 30, R25.**
    - Fait : la phrase citée s'écrit « votre phrase : « … » ». Le texte qui flottait venait de `CarnetOuvert`, pas de
      CarteArticle, qui ne cite aucune phrase.
    - Preuve : test 10.
11. **n° 31.**
    - Fait : la suppression accorde : « 1 article en veille : le déplacer », « 2 articles… les déplacer ».
    - Preuve : test 11.
12. **n° 34.**
    - Fait : la mention devient « 1 critère sans valeur à comparer ⌄ », à la suite de la ligne Critère. Le compte est figé tant
      qu'un cadre de geste est posé, c'est-à-dire pendant que l'IA range.
    - Preuve : test 12 (rerender avec un cadre, puis sans).
13. **Provenance et titre.**
    - Fait : `provenanceCritere` lit `sourceDuCritere` (lot A). Exceptions : `locale` et `page` sans source, et l'exemple du
      banc, qui reste « proposé par l'IA ». Le h2 rend le titre stocké.
    - Preuve : test 13 (« ZZ TEST — Ventilation de la salle de brassage »).
14. **Doute, pompe.**
    - Fait : `NOTE_EN_VRAC_BANC` donne « Pour la pompe : 3 m³/h ». Elle figure dans `ETATS_BANC`.
    - Preuve : test 14 (débit entre 2 et 5 m³/h). La note à « 1 800 m³/h » avait été tapée par l'exécutant ; elle ne vient
      d'aucun fichier.
15. **Banc.**
    - Fait : `exemple.invalid/hotte-140` est connue de la lecture simulée. 14b et 15b la collent ; 19b colle pompe-inox puis
      pompe-magnetique (G20). `&zero=1` part vide.
    - Preuve : test 15. Aucun paramètre lu par carnetsBanc n'a changé.

## Critères
- (a) `carnetsCritique6Figes.test.tsx` : 15 tests sur 15 au vert.
- (b) Suite carnets (`tests/unit/carnets*` et `port-q3` à `port-q5`) : 554 réussis, 7 en échec sur 561. Aucun ne vient de mes
  fichiers ; ils viennent des lots qui travaillent en même temps :
  - `carnetsEcrans.test.tsx:207` et `:229` (R06) : ils attendent « rangé par : tient 80 °C d'abord… », mais Comparer.tsx (autre
    lot) écrit désormais « classées par ». Je ne les ai pas réécrits : c'est le choix de ce lot.
  - `carnetsEcrans.test.tsx:726` (P13, G8) : la bulle n'apparaît pas, parce que `critereQuiTranche` (comparer.ts, lot A, en
    cours) rend `null`. Même cause pour `carnetsCritique5Donnees.test.ts:143` et `:304`.
  - `carnetsCritique5Donnees.test.ts:232` (découpe de la note en vrac) et `carnetsCritique5Fil.test.tsx:82` (« Rangé dans
    Évier inox ») : rangement et fil, autres lots.
  - Le grep de `.skip`, `.todo`, `.fails` et `xit(` ne rend rien.
- (c) `tsc --noEmit` : 0 erreur. Au premier passage, `operations.ts` signalait `sourceDuCritere` inconnu (lot A) ; c'est corrigé
  depuis.
- (d) `git status` : mes fichiers sont ceux listés plus haut. Les autres modifications appartiennent aux lots parallèles
  (comparer, rangement, CarnetsVue, LigneRangee…) et à `source4-portable-bundle-manifest-01.json`, déjà modifié avant moi.
- (e) Captures ouvertes, à côté de leur maquette :
  - 390 clair et sombre : 09 contre h05-3, 26 contre h01-6, 01 contre g05-1.
  - 1280 clair et sombre : 05 contre v04-4, sans encadré ; 25, menu fermé.
  - En plus : 36 (suppression, mêmes comptes).
- Essais : n° 8 en 3 essais (Retenir à 815, puis 740, puis 728 < 733) ; n° 33 en 2 essais (Choisir à 735, puis 691). Les
  autres ont tenu au premier essai.

## Doutes et limites
- h05-3 ne montre ni le segment « À venir · Carnets · Réalisés » ni l'en-tête de l'app. Dans l'app, l'en-tête et les deux
  segments de Stocks prennent environ 30 px de plus que le banc. « Retenir la hotte » n'y tiendrait sans doute pas à 390 sans
  défiler. C'est à vérifier dans l'app (`?dev-local`, lot D).
- La ligne 4 (« Extracteur centrifuge en ligne », puis « moins bien que la 3e sur tout ») occupe encore 4 lignes : nom sur 2
  lignes, texte du lot A sur 2 lignes.
- Le placeholder « Ajouter à ZZ TEST — \ » est coupé dans le champ (n° 26, lot D, hors de mon contrat).
- À 390, la réglette du héros est plus étroite ; la légende passe en 13 px pour que « 1 800 la plus haute des 4 » et « 1 100 »
  ne se chevauchent pas.
- La photo simulée est claire en thème sombre, comme une vraie photo de page.

DÉCISION À PRENDRE : faut-il masquer, sur le carnet ouvert à 390, le segment « À venir · Carnets · Réalisés », comme h05-3 qui
ne l'a pas ? Options : A, le garder (état actuel, l'app telle quelle) ; B, le masquer quand un carnet est ouvert (lot D,
CarnetsVue). Je recommande B : c'est la maquette figée, et cela laisse de la place pour « Retenir » dans l'app réelle.

DEMANDE EXECUTANT (lot D) :
1. Lancer, depuis `port-carnet` :
   `VITE_FIREBASE_PROJECT_ID=demo-banc-carnet VITE_FIREBASE_API_KEY=banc-sans-cle VITE_FIREBASE_AUTH_DOMAIN=demo-banc-carnet.firebaseapp.com VITE_FIREBASE_APP_ID=1:1:web:banc npx vite --port 5437 --strictPort &`
2. Depuis ce dossier de voie : `node captures.mjs 5437 09,26,01,36 1280 clair,sombre`. Attendus dans la sortie :
   - `retenirVisible` et `choisirVisible` ;
   - `VU [01] « 2 façons · 6 articles »`.
3. Puis `node captures.mjs 5437 05,25 390 clair,sombre`. Attendus : `"encadre":false,"points":false` et `"menuOuvert":false`.
4. Au banc, gestes d'`ETATS_BANC` :
   - 14b et 15b : coller `https://exemple.invalid/hotte-140` dans Ventilation. Attendu : la carte v06-10, « tient 80 °C : oui ».
   - 19b : depuis la liste, `…/pompe-inox`, puis `…/pompe-magnetique`. Attendu : le tableau naît.
   - États 22 et 23 : taper `NOTE_EN_VRAC_BANC` (« … Pour la pompe : 3 m³/h. »), jamais 1 800 m³/h.
5. Ouvrir chaque capture `cap/*-1280-*.png` et `cap/05-390-*`, `cap/25-390-*`, puis arrêter vite (0 écoute sur 5437).

CONNAISSANCE : vite dev, dans le worktree port-carnet, exige des `VITE_FIREBASE_*` factices. Sans eux, l'écran affiche
« Impossible de charger la brasserie » (auth/invalid-api-key). Le défilement du banc se fait dans un `div` qui défile, pas dans la
fenêtre : `window.scrollTo(0,0)` ne remonte pas, il faut remettre `scrollTop` à 0 sur les éléments.

LEÇON PROPOSÉE : avant de juger « au-dessus du pli » à 390, mesurer `bottom` de l'élément contre le haut du champ (`getBoundingClientRect`) ;
la capture seule a trompé deux fois (un défilement résiduel cachait le fil d'Ariane sous le segment).
