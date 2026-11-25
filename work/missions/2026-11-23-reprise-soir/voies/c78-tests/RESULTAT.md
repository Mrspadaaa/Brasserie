TESTS ROUGES 34 rouges / 41 total (R107 3/8, R108 22/22, R109 9/11) — hash du commit des tests : voir `git log -1 -- tests/unit/c78Regles.test.tsx`

# RESULTAT c78-tests

## Fichiers écrits
- `tests/unit/c78Regles.test.tsx` : 3 blocs de règles, R107, R108, R109. tsc : 0 erreur sur ce fichier.
- `tests/fixtures/c78/chambre-froide-releve.json` : Chambre froide refait à la forme de `c75/houblons-citra.json`, avec les noms, valeurs et prix LUS en ligne (reel-78, `tous-sortie.json` C02 : noms de page « 1500 x 1200 mm - 2,6 m³ - groupe frigorifique inclus », 20 caractéristiques, 2 697,74 et 2 987,51 CHF TTC port offert, vendeur sans nom : domaine ggmgastro.com). Champ `_releve` : reconstruit, ids refaits ; photo, notes ZZ et fil perso omis. Aucune donnée personnelle.
- `voies/c78-tests/tests-rouge.log` : `npx vitest run tests/unit/c78Regles* --reporter=dot` → `Tests 34 failed | 7 passed (41)`.
- Aucun fichier de `src/` ni de `functions/` modifié par cette voie (`UpgradeWorkspace.tsx` était déjà modifié au départ). Le `.skip` du cas R4 de `c48Regles.test.tsx` existe déjà (CADUC c56-tests) : rien à ajouter.

## Pourquoi les tests de c77 étaient verts alors que l'écran était faux (faux verts)
1. **Document construit, pas lu.** Le Chambre froide de c77 avait des noms « Cellule froide 1800 x 1500 mm… » et un vendeur inventé « Gastro Held ». Le vrai nom (page du vendeur) commence par les dimensions : le nom court de c77-fix coupe donc sur « 1500 x ». Le bouton Choisir de Comparer était nommé par le vendeur inventé ; le vrai article n'a que son domaine. R75-3, R73-13 et R77-6 passaient pour cette raison.
2. **Une chaîne exacte au lieu de la règle.** « 2 697,74 dit au plus 2 fois » : l'écran le dit aussi « 2 698 » dans la réglette (3 fois). Ici le prix se compte sous toutes ses formes.
3. **Un test trop indulgent.** R75-6 de c77 tolérait chiffre + unité en chasse fixe : or « 2,6 m³ », « 230 V », « 2 697,74 CHF » sont ce qu'il a vu en chasse fixe espacée. Ici : aucune lettre dans un `.cn-mono`.
4. **La mise en page ne se mesure pas dans jsdom** (coupe « … », ligne qui passe à la ligne, bande vide). Ici elle se prouve par ce que le composant pose (élément insécable, règle CSS de coupe, appel de défilement). Le rendu à 390 px reste à voir en ligne.
5. **Le texte était normalisé.** `lu()` réunit toutes les espaces : l'espace fine U+202F des puces de prix (« 1 000 CHF ») paraissait normale. R78-7 lit le texte brut.

## Ce que chaque ligne teste (même document, même chemin d'écran que reel-78)
**R107 (R78-1, B)** : nom court de chaque article des documents réels (c75 + c78 + les deux noms lus en ligne) : ≤ 40 signes, ne finit pas par « x », « × » ou un tiret, garde un mot de la désignation ; par le tableau monté de Chambre froide : « 1500 x » rouge ; 2 noms courts distincts ; Houblons citra inchangé.
- Rouges : « 1800 x » et « 1500 x » à la fonction, « 1500 x » au tableau monté.
- Verts justifiés : « CITRA® (US) », « Citra 13.6% », « Autre fournisseur : en stock, 4 CHF de plus le sac. » (déjà ≤ 40 signes, gardes de non-régression) ; « deux noms courts distincts » (« 1500 x » ≠ « 1800 x » : distincts mais illisibles, c'est la garde qui interdit de les rendre identiques en corrigeant) ; tableau de Houblons citra (inchangé).

**R108 (R73/R75/R77 rouverts)**, un test par ligne, par CarnetsVue monté :
- R73-13 : bouton « Choisir » de Comparer (Chambre froide réel) dit « Choisir » nu : rouge.
- R73-9 : prix dit 3 fois au Choisir (« 2 697,74 », « 2 698 », « 2 697,74 ») : rouge.
- R73-10 : prix en gros sans élément insécable (« 2 697,74 CHF » en `.cn-mono.cn-prix-grand`) ; carte de l'autre article avec le nom entier de 68 signes (« 1800 x 1500 mm - 4,06 m³ - groupe frigorifique inclus ») : 2 rouges.
- R73-12 : deux « 1 » contraires entre le tableau et « Prix au m³ » : rouge.
- R75-3 : « 1500 x » au tableau : rouge.
- R77-6 : le prix « 2 697,74 CHF » est noyé dans « · à comparer · 2 697,74 CHF » : exigé : son propre élément (la coupe ne le tronque pas). Rouge (le test de c77 ne regardait que l'espace insécable).
- R75-6 : chasse fixe avec lettres au Choisir de Chambre froide (« 2 697,74 CHF », « 2,6 m³ »…), sur la fiche MotlerHops (« offre ↓ »), dans la phrase « Part dans À venir » (« ≈3,69 CHF »), dans Comparer (« 50 g »), dans la date des anciennes notes (« 20.11.2026 ») : 5 rouges.
- R73-31 : « Anciennes notes de l'Atelier » sous À faire et sous la cloche : 2 rouges (présentes au repos : l'endroit juste).
- R77-7 : un vendeur, deux noms : tableau « Brau », fiche « Brau- und Rauchshop », bouton « Choisir chez Brau », carte « Brau- und Rauchshop », Comparer « Brau- und Rauchshop » : rouge.
- R73-15 : toucher Quand n'amène rien à l'écran (aucun défilement), Houblons citra et Chambre froide : 2 rouges.
- R73-18 : à l'ouverture de Chambre froide, rien n'amène le titre en haut : rouge.
- R73-17 + R75-7 : fil de liens jamais lus (Frigo, simulé) : « galaxus.ch », « digitec.ch », « brack.ch » seuls, ni « non lu · Relire » ni produit : rouge. SIMULÉ : les URL réelles ne sont pas relevées (seuls les domaines le sont).
- R73-23 : Embouteillage (vrai document) : la bulle « À faire du 01.05.2027 au 01.07.2027 » redit ce que Quand dit : rouge.
- R75-8 : Embouteillage : Quand dit « 1 mai 2027 » (S17) ; la réglette dit « S26, 28 juin » : rouge.
- R73-24 : projet du Planning passé (Sol, SIMULÉ : dates 18 → 25.05.2026 sur la forme d'Embouteillage) : Quand « passé · S22 » et la tête « Dans À venir » : rouge. Les mots « Idée » et « En cours » de Sol ne sont pas reproduits (document absent des fixtures).

**R109 (R78-2 à R78-7)** :
- R78-2 : la ligne « 50 g » de « je prends » dit « offre ↓ », pas ≈73,8 : rouge.
- R78-3 : Comparer « vendu par 50 g » contre 50, 250 et 500 g de la fiche : rouge.
- R78-4 : « 6 différents » dont les arômes identiques (« · variété ») : 5 lignes réellement différentes : rouge.
- R78-5 : 2 rouges (règle CSS `.cnl-case span` en `text-overflow: ellipsis` ; largeur estimée 374 px contre ≈358 px). Vert justifié : le DOM porte déjà les mots entiers (« je cherche », « décidés », « notés », « résolus 2026 ») ; c'est la CSS qui coupe, jsdom ne la mesure pas.
- R78-6 : 3 rouges (Embouteillage « juin » 2027, Frigo « avr. » 2027, Extincteur « janv. » 2027 sans année). Vert justifié : la garde « une date de l'année en cours ne dit pas l'année ».
- R78-7 : « 1 000 CHF » et « 5 000 CHF » écrits avec U+202F : rouge (la capture C09-quand montre « 1000 CHF » sans espace visible).

## Doutes, limites, interprétations à relire
1. **Non testés (pas de prise dans jsdom ou donnée absente)** : R73-8 (bande vide du bloc Offre) et R73-14 (photo minuscule) : pure mise en page, à voir en ligne ; R73-19, R73-20, R73-21 (ZZ à retirer de ses données : une écriture, pas du code) ; R73-30 (ordre de la liste : DÉCISION ouverte, le critère « le plus récemment touché » mettrait quand même ses ZZ de 25.11 en tête) ; R73-23 pour les deux Jalons (documents absents).
2. **Interprétations de ma part** : R73-10 « nom court de la carte de l'autre article » (40 signes) ; R73-9 « au plus deux fois » ; R78-5 estimation de largeur (7 px par lettre, 9 px par chiffre) : un correctif qui ne change pas la règle CSS mais raccourcit les libellés passera ; R78-7 exige U+00A0 ou U+0020 : le correctif pourrait aussi donner à la puce une police qui rend U+202F ; R75-8 compare la date de Quand et la semaine du curseur de la réglette.
3. R77-6 : test plus strict que celui de c77 (élément propre du prix) ; le correctif peut donner à ce prix une classe `cn-nowrap` ou `…prix…`.
4. Chambre froide c78 : valeurs relevées dans les textes de reel-78, jamais le document Firestore lui-même (le cache `avant.json` ne contient que des empreintes).

CONNAISSANCE : aucune
LEÇON PROPOSÉE : une fixture « construite à la forme » d'un document réel doit reprendre CHAQUE champ lu à l'écran, noms de page compris ; inventer un vendeur ou préfixer un nom (« Cellule froide ») a fait passer trois règles au vert alors que le vrai document les violait. Et `lu()`/NFKC masque les espaces fines : lire le texte brut quand la règle est un caractère.
