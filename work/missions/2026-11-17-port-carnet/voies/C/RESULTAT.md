ECHEC — C4 : 98 à 125 mots au repos sur R01, R03 et R06, plus de 40 ; le figé en porte autant (décision 1)

Lot C, écrans et gestes du carnet d'idées. Le reste est tenu : C1 et C6 verts (42 sur 42), C2 en tableau ci-dessous, C5 tenu pour les
cibles. Le pilote tranche C4 et le reste de C5 (§ Décisions à prendre).

## Fichiers écrits (worktree port-carnet, rien hors de Possède)

`src/ui/carnets/` : `EtatIA.tsx`, `ChampCarnet.tsx`, `CadreArrivee.tsx`, `Bandeau.tsx`, `LigneRangee.tsx`, `ListeCarnets.tsx`,
`CarnetOuvert.tsx`, `CarteArticle.tsx`, `FicheArticle.tsx`, `Comparer.tsx`, `Choisir.tsx`, `NoteEnVrac.tsx`, `FeuilleNote.tsx`,
`RenommerCarnet.tsx`, `SupprimerCarnet.tsx`, `Photos.tsx`, `photo.ts`, `carnets.css`. Le test : `tests/unit/carnetsEcrans.test.tsx`.

- Le banc temporaire est hors dépôt, dans le scratchpad (`banc/banc.config.mjs`, `entree.tsx`, `mesurer.mjs`, captures `cap/`, `cap2/`).
- Le serveur Vite est arrêté : 0 écoute sur le port 5199.

**Contrat de props.**
- `EtatIA.tsx` déclare les formes lues (`CarnetV`, `ArticleV`, `AidesV`…). Elles sont calquées champ par champ sur `modele.ts`.
  `CarnetDoc` (lot A) s'y affecte sans conversion : le test l'écrit `const vue: CarnetV = ventil`, et tsc passe.
- `Comparer.tsx` prend `Tableau` de `comparer.ts` tel quel (`TableauV = Tableau`). La vue en tire les colonnes, le prix et la
  meilleure valeur, sans rien recalculer du rang.
- `CarnetOuvert` reçoit `liens` (forme de `LienCarnet`). `SupprimerCarnet` reçoit `liens` (forme de `LienQuiRetient`).
- Aucune vue ne lit de magasin. `carnets.css` est importé par `EtatIA.tsx`.

## Critères

- **C1** : `npx vitest run tests/unit/carnetsEcrans.test.tsx` → `Tests 42 passed (42)`.
  - Couvert : chaque figé (R01 à R07), K1 à K4 (regex de `maquettes.json`), « quoi ? », « Étape », aucune boîte (`dialog`), la
    garde C1 `\d+ façons? · \d+ articles?`, aucun « 0 » inventé.
  - Un cas tourne sur la vraie fixture du lot A : `fixtureCarnets` → `lireCarnet` → `tableau()`, rendu par Comparer,
    ListeCarnets et CarnetOuvert.
  - `npx tsc --noEmit` : aucune erreur dans `src/ui/carnets/*` (hors `CarnetsVue`, `rangement`) ni dans le test. Les erreurs
    restantes viennent du lot D en cours (`StocksTab` → `CarnetsVue` absent ; `recherche/modele.ts`, `DetailChose.tsx`).
- **C2** : tableau plus bas. Chaque greffe G1 à G37 a sa ligne, et R11, R14, R17, R19 et Photos nomment leur composant.
- **C3** : 8 captures prises à 390 en clair, sur le banc temporaire, avec la vraie fixture.
  - 3 ouvertes et comparées à leur figé : `liste` (g05-1), `ouvert` + clavier (i06-4), `comparer` (g01-8).
  - Défauts vus et corrigés :
    - l'œil de la veille passait à la ligne ;
    - le champ grandissait sur 3 lignes avec le placeholder long (il est tronqué au repos, il grandit à la frappe) ;
    - l'en-tête Articles était écrasé ;
    - les nombres n'étaient pas groupés (`1800` contre `2 600`).
  - Reste au critique : les vignettes sont un picto générique (pas de photo dans la fixture), et les titres « ZZ TEST — … »
    sont longs.
  - Le reste de la série est en DEMANDE EXECUTANT.
- **C4** :
  - Tenu :
    - plus petit texte 14 px partout ;
    - contraste minimal 5,27:1, sur « écarté » ;
    - cave : 5,7:1 ;
    - CARNET-CLAV : clavier simulé de 300 px, champ du bas à 536 px pour une limite de 544, dernière note de 396 à 456 px,
      les deux visibles.
  - Échoue : les mots au repos (premier écran, 390 × 844). Liste 125, carnet ouvert 123, comparer 98, vide 52, fiche 53,
    choisi 56, cartes 72 → décision 1.
- **C5** :
  - Tenu :
    - 0 cible sous 44 px sur les 8 écrans ;
    - rouge seulement sur Supprimer (feuille, cadre, carte de suppression) : 0 texte rouge ailleurs.
  - Reste : des voisines à moins de 8 px.
    - Les rangées empilées dans une même carte du figé (Embouteillage et Frigo, lignes d'articles) : décision 2.
    - Le contenu qui défile sous le champ collant. C'est un recouvrement, pas deux voisines.
- **C6** : dans `carnetsEcrans.test.tsx`, chacun vrai puis faux :
  - G11, G25, G26, G27, G33 ;
  - G26, G35, G36 au picto local `data-picto="local"`, sans ✻ ;
  - Suppression v2 : à venir / détacher, Supprimer grisé puis allumé ; réalisé : Archiver seul ; aucun « stock » ;
  - veille : fiche éteinte, puis « demandée · pas encore relevée » sans date ; carte « veille demandée » seul ;
  - G8 : bulle au focus, un toucher remplit « <critère> : » ;
  - G9 sous le cadre ;
  - G29 : prérempli, « ✻ proposé d'après « … » · avant : « … » », titre actuel quand l'aide est éteinte ;
  - pastilles : 0, 4 → 3 et « +1 », « supprimé », aperçu sans montant ;
  - G30, G32, G37 à la place de l'élément.

Essais : C1 3 (deux regex de test trop larges, puis une barre inverse perdue par `sed` dans le Bash, corrigée par Edit) ; C3 et C4
2 ; C5 2.

## C2 — inventaire (figés, bases de geste, greffes)

| Source | Élément visible | Place dans le code | État |
|---|---|---|---|
| R01 g05-1, i06-1 | Groupes « À comparer · Idée · Choisi · En veille » avec compte | ListeCarnets (`cn-groupe`) | porté |
| R01 | Vignette, titre, « Ensuite : … », « 2 façons · 5 articles · 👁 1 en veille », « dès 420 CHF » | ListeCarnets `CarteCarnet` | porté (« Ensuite » = 1re note à faire) |
| R01 | Idée sans article : phrase citée, « Coller un lien » | ListeCarnets (`onCollerLien`) | porté (g05-1 rang 1 ; « Chercher » de i06-1 non porté) |
| R01 | « pas encore d'article », « fournisseurs et prix : exemple » | ListeCarnets, en-tête du groupe | porté |
| R01 | Choisi : pourquoi court, « le 14 nov. · vendeur », prix | ListeCarnets | porté |
| R01 | « Dans À venir depuis le 16 nov. · Voir » | ListeCarnets (`onVoirAVenir`) | porté |
| R01 | En veille : « relue tous les 3 jours », « baisse le 13 nov. », prix barré, « inchangée » | ListeCarnets, En veille | non porté : R31, pas de relève ; « demandée · pas encore relevée » |
| R01 | En-tête L'Affinée, segments Stocks et Matériel, À venir · Carnets · Réalisés, + volant, barre d'onglets | — | lot D (StocksTab, App, + volant) |
| R01 | Champ « Une idée, un besoin… », 📷, 🎤 | ChampCarnet | porté (🎤 seulement si le navigateur dicte, R37) |
| R02 i02-2, i06-2 / R09 v03-2 | Titre « Carnets », phrase d'achat, carte fantôme « Évier inox, 2 bacs · exemple · votre premier carnet · ↓ arrive ici » | ListeCarnets `ListeVide` | porté |
| R02 i02-2 | « Votre premier carnet s'affichera ici », « Un carnet garde : objets, prix, choix », bulle verte « Écrivez ici… Entrée crée le carnet » | — | non porté : la base v03-2 prime (ASSEMBLAGE geste 1) |
| R02 i06-2 | Flèche « Écrivez ou collez ici » | — | non porté : refusée (D-108) |
| G1 v04-1 | Puces Frigo de garde · Ventilation de la salle · Évier pour les fûts, un toucher remplit | ListeCarnets `ListeVide` (`onExemple`) | porté |
| G2 v07-2 | « Aucun carnet encore. » en gras, « Une note en vrac marche aussi. » | ListeCarnets `ListeVide` | porté |
| R03 h05-3, i06-4 | « ‹ Carnets », pastille d'état, ···, titre | CarnetOuvert | porté (··· : Renommer, Supprimer l'idée) |
| R03 | Ce qui compte « proposé par l'IA : … » ou « tiré de votre phrase » | CarnetOuvert `ligneCritere` | porté |
| R03 | « Hotte ou extracteur ? », cartes de façon (prix de… à…, raison, pastille « capte la buée ») | CarnetOuvert, rubrique Façons | porté (question = « A ou B ? » si 2 façons) |
| R03 | « Le critère sépare les deux façons · Retenir la hotte » | CarnetOuvert (prop `separe`) | porté, texte d'IA s'il existe |
| R03 | Articles « 4 lus, 1 sans aperçu · Comparer côte à côte › », tableau par façon (rang, valeurs, prix, meilleur surligné) | CarnetOuvert `TableauArticles` | porté (3 colonnes au plus à 390) |
| R03 | Lien sans aperçu « ? … · Ouvrir ↗ » | CarnetOuvert, CarteArticle | porté (« page non lue ») |
| R03 | Rangée « Ajouter à … : quoi ? » (Article, Façon, Critère, Note), ✕ | — | non porté : refusée (D-114) |
| R12 v03-6 | ✎ près du titre, ··· par note, champ « Écrire, ou coller un lien… » | CarnetOuvert, ChampCarnet | porté (« Ajouter à <titre>… », G7) |
| R04 h03-5, h06-5 | Rang, photo, nom, vendeur · pays · dispo, prix, valeur du critère « 30–50 ppb · 1re », « O₂ non publié », écarté grisé avec raison | CarteArticle | porté |
| R04 | Bascule « Veiller » sur chaque carte | — | non porté sur la carte : déplacée dans la fiche (MISSION « Rangé derrière », R31) ; la carte dit « veille demandée » |
| R04 h06-5 | « À compléter · Lien sans aperçu · nom et prix à saisir · Compléter » | — | non porté : écran de lien à remplir refusé (D-117) ; « page non lue » à la place |
| R04 h03-5 | « Voir les 3 » vendeurs, « Vendeurs, prix et photos : exemple » | CarteArticle (pastille exemple) | partiel : le modèle n'a qu'un vendeur par article |
| R05 h01-6 | « ‹ Articles · <carnet> », « 1re sur 5 », photo « photo de la page collée », nom, façon et sa raison, « lien collé le … » | FicheArticle | porté |
| R05 | Mesure du critère « 40 ppb » et piste « la plus basse des 5 … 120 » | FicheArticle `Piste` | porté (prop `autresMesures`) |
| R05 | « 2 offres même machine » | FicheArticle, Offre | partiel : une offre (un vendeur par article) |
| R05 | Caractéristiques « lues sur la fiche du vendeur, 12 nov. » avec rang | FicheArticle | porté |
| R05 | « Surveiller prix et stock · tous les 3 jours · revu le 13 nov. » | FicheArticle | remplacé par le libellé de g5:v06-10 et « demandée · pas encore relevée » (R31, C6) |
| R05 | « Choisir · Brassage Romandie », « Part dans À venir : … avec le pourquoi » | FicheArticle (`onChoisir`) | porté (figé ; voir décision 3) |
| R06 g01-8 (+ v03-4, g05-8, h04-7, h06-7) | « Ce qui compte … · proposé par l'IA », « Côte à côte 3 · rangé par … », colonnes 1re, 2e, 3e, lignes de caractéristiques, meilleure surlignée | Comparer | porté |
| R06 | Écartés visibles à la fin avec raison (D-52), « moins bien partout » | Comparer | porté |
| R06 | « Compromis : … », « Valeurs annoncées par les vendeurs · exemple » | Comparer (`compromis`, `exemple`) | porté (compromis = texte d'IA s'il existe) |
| R06 v03-4 | « + Ajouter une caractéristique », « ✻ Proposer » | — | non porté : un geste hors du champ (R24, D-129) ; le champ et l'IA proposent |
| R06 | Champ « Ajouter à Embouteillage… » | ChampCarnet | porté |
| R07 g05-9 | Cadre pointillé : prix, vendeur, Ouvrir ↗, « Ses autres valeurs · place parmi les 5 », « Choisir chez … », « Écarter », « Part dans À venir … » | Choisir `ChoisirArticle` | porté, plus un champ « Pourquoi » prérempli |
| R07 g05-11, v03-7, v09-3 | « Choisi le 14 nov. », carte de l'article, « Pourquoi ce choix », phrase, ✓ critère, façon, fournisseur, ✕ écartés, « Valeurs annoncées… pas mesurées chez nous » | Choisir `choisi` | porté |
| R07 g05-11 | Pistes Oxygène et Prix dans « Pourquoi » | — | non porté (manque de tours) : à faire en reprise |
| R34 | Choix revu lisible (ADR) | Choisir « Choix d'avant · n » | porté |
| R32 | « Envoyer dans À venir » sur l'idée choisie seulement | Choisir, CarnetOuvert | porté |
| R10 v08-3 | « Nouveau carnet · Idée · ↓ arrive ici · <titre> », « ✻ Déjà un carnet proche : … · Y ajouter en façon » | CadreArrivee `creer` | porté |
| R10 v08-3 | « Vos carnets 4 » avec pastilles | ListeCarnets (sous le cadre, prop `enHaut`) | porté par la liste existante |
| R10 v08-3 | ↑ vert dans le champ | ChampCarnet `cn-envoi` | porté |
| G3 v07-3 | « Ce qui compte · … » tiré de la phrase pendant la frappe | CadreArrivee `creer.ceQuiCompte` | porté |
| G4 v04-2, v06-3 | « Aucun de vos 3 carnets n'en parle : nouveau carnet, votre phrase en titre » | CadreArrivee `raisonNeuf` | porté |
| R11 v04-4 | « ✓ Carnet créé, en tête des Carnets · ↺ Annuler » | **Bandeau** (`cree`) | porté |
| R11 | « « embouteillage » · votre phrase en titre » | **Bandeau** | porté |
| R11 | « Idée · 17 nov. », rubriques vides qui disent qui agit | **CarnetOuvert** | porté (Photos masquée vide) |
| R11 v04-4 | « Ensuite : l'IA cherche les façons » (encart jaune), points de progression « ●○○○ idée » | — | non porté : un état d'étape (K4) ; les rubriques vides le disent |
| R11 | Le carnet créé en tête | **ListeCarnets** (`enTete`) | porté |
| G5 v01-4 | Ce qui compte rempli d'emblée « tiré de votre phrase » | **CarnetOuvert** | porté (si le critère existe) |
| G6 v01-4 | « Le champ en bas range tout ici : une phrase, un lien collé, une photo » | **CarnetOuvert** (`vientDEtreCree`) | porté |
| G7 v03-10, v08-7 | « Ajouter à <titre>… » | **ChampCarnet** | porté |
| G8 v04-5, v07-7 | Bulle « Le critère « … » peut trancher entre A et B », un toucher remplit | ChampCarnet (`suggestion`) | porté, picto local (R44) |
| R13 v02-10 | Cadre « ↓ va atterrir ici · ✻ tiré de votre phrase · Ce qui compte : … · comparé sur … » | CadreArrivee `texte` | porté |
| R13 | Puces « Va dans » préchoisies, « Ajouter » | ChampCarnet (`vaDans`), « Ajouter » | porté |
| G9 v03-7 | « les articles seront rangés sur … au moins » | CadreArrivee (`consequence`) | porté, picto local |
| G10 v03-7 | ✕ dans le cadre | CadreArrivee | porté |
| G11 v08-8 | « Même chose que la note du 16 nov. : elles seront fusionnées · Garder à part » | CadreArrivee (`aides.doublon`) | porté |
| R14 v03-8 | « ✓ Rangé ici, à l'instant · Annuler » à sa place, phrase citée « votre phrase : « … » », « articles rangés sur : … » | **LigneRangee** (porte Bandeau `range`), placée par **CarnetOuvert** (`rangee`) | porté |
| G12 v08-7 | « Votre texte · Déplacer · Changer en note » | **LigneRangee** | porté |
| G13 v05-7 | La ligne du carnet visé s'éclaire : « Critère ajouté · Déplacer · Annuler · tiré de « … » » | **ListeCarnets** (`eclaire`) | porté |
| R15 v07-10 | Lien en chasse fixe, puce « Coller : plaque-froid.ch/echan… », « Ajouter » | ChampCarnet (`coller`) | porté (lecture du presse-papier : lot D) |
| G14 v03-9 | « ↓ Arrive ici, dans Articles · lien collé ✕ », « ✻ d'après le lien : … Nom, prix et photo se lisent à l'envoi » | CadreArrivee `lien` `avant` | porté |
| R16 v03-10 | « ✻ lecture de la page… », lien en clair, « rien d'affiché avant d'être lu » | CadreArrivee `lien` `lecture` | porté |
| G15 v01-9 | Carte en squelette | CadreArrivee `cn-squelette` | porté |
| G16 v02-12 | « Va atterrir ici · lien collé », « L'IA lit la photo… Ce qu'elle ne lit pas reste vide » | CadreArrivee (`depuisListe`) | porté |
| G17 v04-9 | « nom ✓ · photo ✓ · prix · stock · valeurs » | CadreArrivee (`lus`) | porté |
| G18 v06-9 | « l'IA cherche : nom, prix, photo, débit, °C max » | CadreArrivee (`cherche`) | porté |
| R17 v06-10 | « ✓ Article rangé ici, à l'instant · Annuler » | **LigneRangee** `article` (Bandeau) | porté |
| R17 | Carte complète : photo, nom, domaine · pays, exemple, valeurs, prix, « en stock » | **CarteArticle** `complete` | porté |
| R17 | « Veille du prix, tous les 3 jours » + bascule | **CarteArticle** `complete` | porté, éteinte à la naissance (R31) |
| R17 | « ✻ lu sur la page : nom, prix, photo, débit, °C · tient 80 °C : oui » | **CarteArticle** (`luSurPage`, `verdict`) | porté (picto « page », ou ✻ si IA simulée) |
| R17 | Carte rangée dans sa façon | **CarnetOuvert** (`rangee` article) | porté |
| G19 v03-11 | « Article rangé ici, dans Sur pieds » | **LigneRangee** (`faconNom`) via **CarnetOuvert** | porté |
| G19 v03-11 | Puce « fût couché : oui », « donc un fût de 30 L couché y entre » | **CarteArticle** (`verdict`) | partiel : le verdict ; la cote traduite en usage attend un champ de lot B |
| G20 v06-11 | Le tableau naît au 2e lien, « rangé par : … », rang 1 et 2 | **Comparer** et **CarnetOuvert** (`tableau`) | porté |
| G20 | « Pompe magnétique rangée, 2e · Annuler », « 2 façons nées des 2 articles » | **Bandeau** (`deuxieme`) | porté |
| G21 v06-14 | « Rangé dans Ventilation, à l'instant · Annuler », raison, « Déplacer » | **Bandeau** (`ailleurs`) | porté |
| R18 v01-15 | « ✻ L'IA découpe votre note : 3 lignes, 2 carnets », lignes typées, « → Évier inox », « Va dans : selon chaque ligne » | NoteEnVrac `pendant` | porté (menu ▾ « selon chaque ligne » rangé derrière : texte seul) |
| G22 v06-17 | Picto par type, achats en tête, « Rattaché à <carnet> · Autre carnet » | NoteEnVrac (`trierLignes`, `rattacheA`) | porté |
| G23 v02-19 | « 1 chose à faire et 1 note, pas d'achat », ligne sans carnet → « aucun carnet proche » | NoteEnVrac (`resumeVrac`, `neuf`) | porté |
| R19 v01-16 | « ✓ 3 lignes rangées dans 2 carnets · Annuler » | **NoteEnVrac** `apres` (Bandeau `vrac`) | porté |
| R19 | Puce de type ▾, puce de carnet ▾ par ligne | **NoteEnVrac** | porté |
| R19 | « › Texte d'origine » | **NoteEnVrac** (`details`) | porté |
| R19 | Sur la liste, « +2 · question, à acheter » | **ListeCarnets** (`ajouts`) | porté |
| R20 g4:v01-11 → v01-12 | ✎ ouvre « ✎ Se modifie ici · ✕ Supprimer », texte dans le champ, « Enregistrer » | CadreArrivee `modifier`, ChampCarnet (`libelleEnvoi`) | porté |
| R20 | « ✓ Note modifiée, à l'instant · Annuler », « modifiée » | Bandeau `modifiee`, CarnetOuvert `LigneNote` | porté |
| G24 g4:v03-11 | Feuille ··· : Modifier, Changer en façon, Changer en critère, Supprimer | FeuilleNote | porté |
| G25 v08-19 | « ✻ Ressemble à un critère · Passer en Ce qui compte » [Passer] | FeuilleNote (`aides.noteEnCritere`) | porté |
| G26 v08-21 | « … ne passerait plus · Passer en Ce qui compte » | Bandeau (`consequence`, `aides.consequence`) | porté, picto local |
| G27 v03-18 | « ✻ Même visite : la douchette · Regrouper » | CadreArrivee `modifier` (`aides.regrouper`) | porté |
| R21 g4:v02-14 → v01-13 | ··· → Renommer ; « ✎ Se renomme ici · titre du carnet », champ, « Renommer », « Annuler · Entrée = renommer » | RenommerCarnet | porté |
| G28 v03-6 | ✎ à côté du titre, accès direct | CarnetOuvert | porté |
| G29 v05-23 | Champ prérempli, « ✻ proposé d'après « … » · avant : « … » » | RenommerCarnet (`aides.renommerPropose`) | porté |
| G30 v08-25 | « ✓ Renommé · avant : Évier inox · Annuler » | Bandeau `renomme` | porté |
| R22 g4:v02-12 | ··· : Modifier, Supprimer en rouge | FeuilleNote | porté |
| G31 g4:v01-11 | « ✕ Supprimer » dans le cadre de modification | CadreArrivee `modifier` | porté |
| G32 v08-22, v04-24 | « Note supprimée · Annuler » à la place | Bandeau `note-supprimee`, placé par CarnetOuvert (`noteSupprimee`) | porté |
| G33 v05-25 | « ✻ doublon ? » sur la note | CarnetOuvert `LigneNote` (`doublons`, `aides.doublon`) | porté |
| R23 g4:v02-17 → v02-18 | « Supprimer le carnet … ? », « Il part avec 1 article, 1 photo, 2 façons et 1 note. La veille… s'arrête. », Supprimer en contour rouge, Garder en noir | SupprimerCarnet | porté |
| R23 v2 | « n liens le retiennent », un réglage par lien, Supprimer grisé puis allumé ; plan réalisé : Archiver seul | SupprimerCarnet | porté |
| R23 | Page grisée | CarnetOuvert (`grise`) | porté |
| G34 g4:v04-19 | Champ et + grisés | ChampCarnet (`desactive`) ; + volant : lot D | porté pour le champ |
| G35 v08-27 | « n articles en veille : les déplacer dans <carnet> · Déplacer » | SupprimerCarnet (`proche`) | porté, picto local |
| G36 v05-29 | « ni dans À venir, ni en commande » | SupprimerCarnet (n = 0) | porté, picto local |
| G37 v08-28 | « Carnet supprimé · <titre> · Annuler » à la place du carnet | ListeCarnets (`supprime`, Bandeau `carnet-supprime`) | porté (en tête de son groupe) |
| Photos (points ouverts 8) | Rubrique Photos masquée vide ; vignette « photo non lue » ; réduction 1 280 px, 150 ko | **Photos.tsx**, **photo.ts** (`reduirePhoto`, `dimensionsCible`) | porté ; photo par 📷 : **ChampCarnet** (`onPhoto`) |
| EtatIA | « ✻ L'IA met en forme… ✕ », échec, hors ligne, éteinte (rangé sur place) ; pictos ✻, local, page, exemple | EtatIA.tsx | porté |
| R25 | Le message cité sur place (titre, « votre phrase », Texte d'origine, lien en clair) | Bandeau, LigneRangee, NoteEnVrac, CadreArrivee, CarnetOuvert | porté ; le fil visible est le lot F |

D-n portés par ce lot :
- figés : D-10, D-16, D-17, D-18, D-25, D-77, D-96, D-97, D-99, D-101, D-102, D-103, D-104, D-75, D-58, D-59, D-106 ;
- gestes : D-7, D-15, D-19, D-27, D-79, D-111, D-113, D-122, D-128, D-129, D-130 à D-140, D-118 à D-121 ;
- comparer et choix : D-13, D-20, D-21, D-23, D-52 ;
- veille : D-28 ;
- un seul champ : D-35, D-53, D-54 ;
- règles d'écran : D-8 et D-29 (aucune étape), D-38, D-56, D-60, D-65, D-69, D-80, D-85 ;
- liens et suppression : D-39, D-46, D-47, D-47b, D-76 ;
- micro : D-83 ;
- D-141 et D-142 sous la forme du défaut R25.

D-65, D-69, D-80 et D-85 sont tenus côté vues (jetons de l'app, deux thèmes mesurés). L'habit complet (en-tête, segments) est au lot D.

## Doutes et limites

- Les captures viennent d'un banc temporaire. Il rend mes vues sans l'habit de l'app (en-tête, segments, + volant, onglets) : ils
  sont au lot D, dont `CarnetsVue.tsx` n'existait pas encore. La comparaison côte à côte avec l'habit est en DEMANDE EXECUTANT.
- Violet du ✻ (`--area-agenda-texte`). Les maquettes dessinent l'IA en violet, mais DESIGN.md interdit de détourner une couleur de
  rubrique. Un jeton `ia` dédié est à créer dans `themes.css` (hors Possède).
- `ListeCarnets` déduit « Ensuite : … » de la première note « à faire ». La maquette a un champ propre qui n'existe pas dans le modèle.
- La pastille de façon « à chercher » s'affiche pour une façon ouverte sans article. La façon retenue prend la pastille pleine
  verte avec sa raison, comme dans i06-4.
- Pas encore porté, faute de tours : les pistes Oxygène et Prix de « Pourquoi ce choix » (g05-11). Les données existent
  (`autresMesures`).

## DÉCISION À PRENDRE

1. **CARNET-LIS (40 mots) contre les figés.**
   - Le figé g05-1 porte lui-même environ 95 mots au premier écran, et i06-4 environ 110.
   - Couper revient à retirer des éléments du figé, contre la règle n° 1 et CARNET-MAIGRE.
   - Options :
     - a) garder le figé et lire CARNET-LIS comme « pas plus de mots que le figé » ;
     - b) replier (le groupe En veille, la ligne de pourquoi des Choisis) : il le verra ;
     - c) demander au brasseur.
   - Recommandation : a, avec le critique sur la capture.
2. **Q4 et les rangées d'une même carte.**
   - Les lignes empilées d'une carte du figé (deux Choisis, lignes d'articles) se touchent par leur bordure : 0 px.
   - Options :
     - a) accepter : chaque rangée prend toute sa ligne et le séparateur suffit ;
     - b) espacer de 8 px : cela change le dessin du figé.
   - Recommandation : a.
3. **« Choisir · <vendeur> » sur la fiche (figé h01-6)** contre « Choisir s'atteint depuis Comparer seulement » (« Rangé derrière »).
   J'ai gardé le figé, par la règle n° 1. Le pilote peut l'éteindre en ne passant pas `onChoisir`. Recommandation : garder.

## DEMANDE EXECUTANT

À lancer dès que le lot D a rendu `CarnetsVue.tsx` et le banc `?preview=carnets`, depuis
`C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`.

1. Lancer `npm run dev`. Ouvrir à 390 × 844, tactile, thème clair.
2. Capturer, puis ouvrir chaque capture côte à côte avec son image `p2:` ou `g5:` :
   - figés : captures 1, 2, 9, 25, 26, 27 et 28 du § Vérification de MISSION.md (R01 à R07) ;
   - gestes : captures 7, 10, 11, 13, 18, 23, 34, 35, 36 et 38 ;
   - en plus : 39, clavier `&keyboard=300`.
3. Lancer la mesure `node <scratchpad>/banc/mesurer.mjs <sortie> liste vide ouvert articles fiche comparer choisi
   "ouvert+keyboard=300"`, en remplaçant dans le script `http://localhost:5199/__banc?ecran=` par l'adresse du banc du lot D.
   Résultats attendus :
   - `minPx 14` ;
   - contraste ≥ 4,5 ;
   - `petites 0` ;
   - `rouges 0` ;
   - `clav.champVisible true` et `derniereNote.visible true`.
4. Arrêter le serveur et vérifier qu'aucun processus n'écoute plus.
5. Le critique juge ensuite en trois regards (R50).

CONNAISSANCE : le banc hors dépôt marche. Vite tourne avec `root` au worktree et une configuration dans le scratchpad. Ses alias
pointent `react`, `react-dom/client` et `lucide-react` vers le `node_modules` du worktree, et un middleware sert `/__banc`. Cela
capture des vues sans écrire hors de Possède, même quand le banc officiel n'existe pas encore.

LEÇON PROPOSÉE : un `sed` lancé dans le Bash pour changer une attente de test a perdu `\u` (`1\u202F200` est devenu `1202F200`).
Cela confirme la règle « code par Edit ». Elle vaut aussi pour une retouche d'une ligne dans un test, pas seulement pour le code.
