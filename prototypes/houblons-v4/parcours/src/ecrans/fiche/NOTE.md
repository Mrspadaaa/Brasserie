# Fiche d'un houblon, au long appui (voie p1-ma-biere ; reprise g1, 23.10)

## Base

- g1, la fiche de la base v4.10 qu'il a choisie (« la v1 est la meilleure ») : `base/consolide/fiche.html`, capture
  `base/captures/consolide-fiche-390.png` ; la fiche courte type Citra cryo (« Ça c'est très bien ») :
  `fils13-carte-fiche/captures/g1-fiche-citra-390.png`.
- Inventaire : `work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-fiche.json` (12 éléments).

## Reprise

- g1-feuille : repris — la feuille de l'app (Sheet), presque pleine, le haut de la page assombri, « × » rond en haut à droite
- g1-titre : repris — le nom du houblon en titre de la feuille, avec ⊙ quand son α vient d'un lot
- g1-alpha : repris — « α 11–14 % » en gros (la fiche la plus récente, Hopsteiner 2025, comme g1), « lot 13 % » à côté,
  la réglette de g1 (chaque fiche sur 0–25 %, mon lot en trait) ; la note d'honnêteté sous l'α (cryo : « α : plages de
  Citra en pellets ; la fiche du cryo manque. » ; lot hors de toutes les plages : « Mon lot … : hors des plages de ses fiches. »)
- g1-usage : repris — l'usage en mots dans une pastille (« double usage »)
- g1-bande : écarté — D130 : la matrice de flb5b, son choix du 24.10 au soir, remplace le bloc gris et sa bande ; les familles citées se lisent au radar, et les non décrites dans la ligne des pictos « ? »
- g1-familles : repris — devenu la matrice de flb5b (D130, Matrice.tsx) : ses mots en lignes avec le picto au trait de leur
  famille et sa couleur (D93), « 2/2 » (rien à une seule fiche, jamais « 1/1 »), « classé » pour la ligne « Familles
  déclarées » de Hopsteiner ; lui puis ses quatre remplaçants de u4 en colonnes ; « 1 seule fiche : Beer Maverick » dans le coin
- g1-premier : écarté — D130 : flb5b ne dit plus « nommé en premier » ; il compte dans l'ordre des lignes (le premier nommé d'abord), et D115 visait déjà cette liste (« cette vue est vraiment pas terribles »)
- g1-sans-famille : repris — les mots hors des 12 familles en lignes, marqués ◇, en tête quand ils lui sont propres ; le
  bandeau « Lui seul : vin blanc, raisin, groseille à maquereau, sauvignon blanc » (data-role="hors-16d") ; la part
  « autres » dessinée à sa part réelle dans le coin de la grille (D100, « autres 83 % »)
- g1-non-decrites : repris — la ligne de flb5b sous le radar : le picto de chaque famille non décrite et un « ? » à sa couleur
  (aria-label « 10 non décrites : Floral, … »)
- g1-radar : repris — le grand radar légendé : chaque axe nommé avec « 2/4 », les inconnus « ? » hachurés, les flèches de sa
  demande ; l'échelle à 2 fiches au moins (une famille d'une seule fiche ne touche pas le bord) ; toucher un sommet ou son
  secteur ouvre la bulle de g1 (« Melon : ses fiches ne le décrivent pas, inconnu (ce n'est pas zéro), posé au centre »)
- g1-demande : repris — « + Floral 2/4 − Résineux 2/4 » sous le radar, lu dans la visée de l'onglet Ma bière (état commun) ;
  « 1 seule fiche » et « inconnu » comme la fiche courte de Citra cryo
- g1-actions : repris — en pied, ♡ et ⊘ (son goût : « Aimer Nugget », « Remettre neutre : Aimer Nugget »), et « Comparer »
  (ajoute le houblon à la comparaison et l'ouvre)

## Reprise D130

La liste sous le radar devient la matrice de flb5b (« La matrice nettoyée », work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/flb5b/,
captures flb5b-premier-ecran.png et flb5b-motueka.png). Ses mots (24.10, soir) : « Partie sur celle ci, elle met parcontre en
avant qqch qu'il faut ajouter à plusieurs endroits. Les type spéciaux des houblons hors 16d ! C'est très important surtout dans
la comparaison !!!! ». Registre : fiche = g1, liste sous le radar = flb5b.

- Reprise telle quelle : le bandeau noir « Lui seul : … » (ses mots que ses quatre remplaçants ne disent pas, ni générique ni
  nom de famille ; data-role="hors-16d" data-houblon="<clé>") ; la grille : colonnes égales de 38 px, « lui » entre deux
  règles noires, l'en-tête fermé par un trait noir, noms des remplaçants verticaux en 11 px et leur score ; rond noir et
  « 2/2 » pour lui (rond plus petit quand toutes ses fiches ne le disent pas), « classé » pour une catégorie de Hopsteiner ;
  un seul gris (#8a8f9c) pour les remplaçants : rond plein, il le dit ; rien, il ne le dit pas ; ◇ hors des 12 familles ;
  sept lignes au plus, puis les « classé » ; la ligne des familles non décrites en pictos « ? » au-dessus.
- Données (donnees-matrice.ts) : familyWords du moteur, traduit (étiquettes françaises de Beer Maverick du catalogue, puis la
  table de flb5b pour les mots de Hopsteiner) ; ordre de flb5b (fiches qui le disent, premier nommé, rareté au catalogue) ;
  colonnes : les quatre premiers remplaçants de lireRemplacants (u4, D35), au moment de son ajout s'il est dans la recette,
  sinon sans moment (contexte « défaut » du moteur). Recompté : Nelson Sauvin, lui seul : vin blanc, raisin, groseille à
  maquereau (2/2), sauvignon blanc (1/2), fruité 2/2, agrumes et épicé classés, comme flb5b ; Motueka, lui seul : mojito
  (2/2), zeste de citron (1/2), comme flb5b ; Nugget : ananas, gingembre, géranium, litchi.
- Écart de données : flb5b prenait les remplaçants de pack-fiches.json (substitution v1 sans style : Nelson Sauvin →
  Boomerang 91, Herkules 89, Phoenix 88, Pacific Jade 87 ; Motueka → Buzz Bullets 94, Shaddock, Cascade, Southern Sublime) ;
  la fiche prend ceux de Substituer au style de la recette (D35) : Boomerang 91, Herkules 89, Phoenix 87, CTZ 84 ; Cascade
  88, Taiheke 86, Mandarina Bavaria 82, Pilot 82. « Lui seul » est le même.
- Ajouts : la légende de flb5b (son « ? » d'en-tête) passe derrière un « ? » de 24 px dans le coin de la grille, dépliée sous
  le bandeau ; la part « autres » (D100) et « 1 seule fiche : … » (g1) vont dans ce coin, vide chez flb5b.
- Non repris de flb5b, hors de la liste (le reste de g1 ne change pas, VOIE r14) : l'en-tête « type 10 », la lentille « au
  style · 16D / absolu », le petit radar à zone 16D, la bande des houblons en bas (navigation de sa maquette).

## Pied de flu2b et fiche exhaustive (D132)

Ses mots (24.10, soir) : « La matrice nettoyée flb5b · de flb5 est très bien mais le footer doit être aussi avec tout ces
informations comme 4 · Les cartes de famille · flu2b. Attention car la carte du houblons doit bien contenir de façon
exhaustive TOUTES ses informations. » ; puis « Le footer est top » (pied de flu2b) et « C'est pas exhaustif sur les infos du
houblons » (sous le pied de flb5b).

- Le pied, celui de flu2b (captures flu2b-nugget.png, flu2b-nelson.png) : ♡ ⊘ à gauche, « Comparer » à droite, un filet,
  puis quatre pastilles grises sans bord « Styles › · Huiles › · Sources › · Substituts › » (32 px dessinés, 44 px sous le
  doigt). Il reste fixé en bas de la feuille ; la section touchée se déplie dans le flux, sous la matrice (Replis.tsx).
  Chez flu2b ses quatre boutons étaient inertes : leur contenu est celui de g1 (D124), complété ci-dessous.

### Inventaire : chaque champ du dépôt et sa place (pack-fiches.json, Nugget et Nelson Sauvin ; lu en direct dans le moteur)

| Champ | Où dans la fiche |
| --- | --- |
| key, name | titre de la feuille (⊙ si l'α vient d'un lot) |
| origin | Sources › « Origine : États-Unis » |
| aliases (catalogue : NUG, 7005-194 ; NSN, 85-03-06) | Sources › « alias » |
| form (catalogue, stock) | Sources › « forme : ? » (inconnue dans le dépôt) |
| usage[].styles, source | Styles › étiquettes et « Crosby Hops, … » |
| usage[].roles | vide dans le dépôt pour ces deux houblons |
| role.value, role.source | pastille « double usage » (au premier plan), sa règle en title |
| alpha.sources (BM 2023, HS 2025) | α en gros (Hopsteiner 2025, comme g1) et réglette ; Sources › chaque fiche datée |
| alpha.retenu (lot, from) | « lot 13 % » à côté de l'α ; note « hors des plages » ; Sources › « α mon lot : 13 %, fiche de stock » |
| alpha.divergence, beta.divergence | Sources › « α : fiches recouvrantes ; β : fiches recouvrantes » |
| beta.sources | Sources › β de chaque fiche datée |
| huiles.totale.sources, divergence | Huiles › « totale, Beer Maverick 2023 / Hopsteiner 2025 » et « Huile totale : fiches recouvrantes » |
| huiles.composants (myrcène, humulène, caryophyllène, linalol) | Huiles ›, avec leur source |
| farnesene null, farneseneRaison | Huiles › « farnésène : Publié par Beer Maverick, non importé dans le dépôt. » |
| hsThiol (catalogue : faible ; forte) | Huiles › « thiols, Hopsteiner : classe forte » |
| aromes[] (sources/of, authors, level) | radar (chaque axe « 2/4 », inconnus « ? » hachurés) ; Sources › auteurs de chaque famille |
| aromes[].mots | matrice (D130) : ses mots en lignes, picto et couleur de leur famille, « 2/2 » |
| aromes[].premier | Sources › « · 1er chez Hopsteiner » ; ordre des lignes de la matrice |
| familles sans fiche (sources 0) | ligne des pictos « ? » sous le radar |
| motsSansFamille | matrice : lignes ◇, bandeau « Lui seul : … » (hors-16d), part « autres 83 % » (D100) |
| descripteurs.beerMaverick | Sources › « Descripteurs Beer Maverick » ; mots de la matrice |
| descripteurs.hopsteiner, cites | Sources › chaque texte, tel qu'écrit (langue source), avec son auteur ; « classé » dans la matrice pour « Familles déclarées » |
| substituts null, substitutsRaison | Substituts › « Scores de Beer Maverick non importés » |
| substitutsCalcules | matrice (4 colonnes) et Substituts › (8) : le calcul de u4 en direct (D35), au style de ma recette ; pas la liste figée du pack |
| stock.grams, etat | icône de stock à côté de l'usage (en stock) ; Sources › « mon stock : 100 g » ou « épuisé » |
| stock article, α lu sur l'article | Sources › « article : Houblon Nelson Sauvin 9.6% » ; « α mon lot : 9,6 %, lu sur l'article » |
| stock.libre (par scénario) | le scénario de la maquette seul : « mon stock » moins « dans ma recette » ; les autres scénarios (S4, S5) ne sont pas dans la maquette |
| dansRecette | Sources › « dans ma recette : 46 g à 60′, 59,7 IBU » (état commun de la recette) ; « non » sinon |
| ibuParGramme (b60) | Sources › « IBU par gramme à 60′ : 1,3 » (le moteur, ma recette : 20 L, DI 1,066, ébullition 60 min) |
| ibuParGramme (autres moments) | écarté : la table des IBU par moment, « Inutile » (sa base) ; seul 60′ demandé (D132) |
| gout.aime, exclu | ♡ ⊘ du pied |
| url des fiches | non montrées : les noms et années des sources les disent ; à brancher dans l'app (liens) |

## Idées reprises

- Le pied de g1 (D124, rendu par la voie r3) : Styles › · Huiles › · Sources › · Substituts ›, repliés, un seul déplié à la fois
  (Replis.tsx) : styles d'un fournisseur ; huile totale et composants avec leur source ; α et β de chaque fiche datée, mon lot,
  origine, auteurs de chaque famille, descripteurs ; remplaçants à 60′ (8, comme g1) du même calcul que Substituer
  (`remplacants`, en stock d'abord : les 6 premiers sont ceux de u4) et le pont « Remplacer Nugget › » vers Substituer.
  Lecture des fiches : sources.ts (catalogue du moteur en direct, rien de recopié).
- α du lot balisé `data-role="alpha" data-source="lot"` : c'est le premier α de la fiche (D93 B3) ; la plage est la
  lecture en gros, comme g1.
- La demande et les flèches suivent la visée posée dans l'onglet Ma bière (bannir, −, +).

## Écarts

- Fermeture (p6, D109, 24.10) : une seule croix ronde de 44 px, icône de 20 px à l'encre, en haut à droite de la
  feuille (`data-role="retour"`, comme g1-feuille « × rond en haut à droite ») ; le nom en titre, en gras, comme g1. Le
  « ‹ » de la voie p1 est retiré : il refermait la fiche comme « × » (`onFermer`), sans revenir d'une fiche à une
  précédente (une fiche s'ouvre sur l'écran qu'elle couvre, jamais sur une autre fiche). Si un jour une fiche en ouvre
  une autre (un remplaçant cité), le retour se garderait sans second bouton : le retour du téléphone et Échap
  dépileraient la fiche (une entrée d'historique par fiche), la croix fermerait tout.

- D115 (23.10, soir, « Mettre le radargraph avant, cette vue est vraiment pas terribles. À revoir... ») : le radar
  et sa demande (« + Floral 2/4 − Résineux 2/4 ») passent avant le bloc des familles, entiers dans le premier écran
  à 390 × 844 (radar 189–530 px, liste dès 617 px). Rien d'autre ne bouge ; la liste elle-même (« nommé en
  premier », mots anglais) a été revue en variantes (fils24-fiche-liste) : il a choisi flb5b (D130, « Reprise D130 » ci-dessus).

- Les familles portent leur picto au trait au lieu du carré de couleur de g1 : D93 (« ça suit pas la Baseline »).
- La table des IBU par moment n'y est pas (« Inutile »), ni « Ajouter à 10′ » (« palace holder ? »).
- Les étiquettes de Styles et des descripteurs sont des puces séparées (g1 les collait : « West Coast IPANEIPASession IPA »).
- La bulle du radar se déclenche aussi sur le secteur entier de la famille (un sommet inconnu est posé au centre, trop
  petit sous le doigt).

## Pour l'app

- La tête de la fiche est une surcharge de la maquette, dans `Feuille` (`src/commun/Cadres.tsx`) et `src/commun/feuille.css` :
  `Sheet` (src/ui/Sheet.tsx, non modifié) reçoit `className="pq-feuille"` ; le CSS restyle son « × » (44 px rond, icône
  20 px à l'encre, fond cave-900) et son titre (22 px gras), sans filet sous la tête ; `Feuille` marque le bouton
  `data-role="retour"` et son icône `data-role="fermer-fiche"` une fois la feuille montée dans son portail. À
  l'intégration : une option de `Sheet` (`closeVariant="round"`, ou la croix commune des outils) et un titre de feuille
  plus grand, au lieu du CSS et des attributs posés après coup.

- Emploi depuis un autre écran : `<Fiche houblon={cle} />` (export par défaut de `index.tsx`, fermée par le retour),
  ou `useFiche()` : `<span {...f.appui(cle, onCourt)} {...f.nom(cle)}>` puis `{f.rendu}`.
- `Sheet` devrait accepter des attributs `data-*`, une largeur maximale et une cible de focus initiale. La maquette
  les pose sur la feuille après son ouverture : `data-role="fiche"`, cadre de 768 px à l'ordinateur (D10), focus sur la
  fiche et non sur « × ». Le « click » qui suit un appui long est avalé (350 ms) pour ne pas refermer la feuille.
- Le voile de la feuille : la pile d'inertie de PageShell pose `inert` sur le voile de vaul (un enfant du corps hors du
  dialogue) ; le toucher tombait sur `<html>` (la feuille se fermait quand même, par « toucher hors »). La fiche retire
  `inert` du voile et lui rend le toucher (`data-etat="etat-fiche-fermer-fond"`). À l'intégration : exclure le voile d'un
  Sheet de la pile (src/pages/PageShell.tsx), plutôt que ce retrait.
- La croix : son icône de 20 px prend un trait de 1,6 (1,33 px rendu, comme les icônes de 16 px ; D83 S4) ; feuille.css lui
  donne 2,25 : à aligner à l'intégration.
- Les goûts s'écriront dans Dexie (préférences du brasseur) ; les mots des fiches viendront du catalogue réel.

## `--sans=mots,fiche,legende` sur la route fiche (pilote, 24.10 soir, D49)
La route fiche est Ma bière avec la feuille ouverte au chargement. Trois contrôles de COMMUN y échouent par construction, dès HEAD.
`mots` compte Ma bière sous la feuille (194 mots). `fiche` (D25/D49) attend une fiche fermée à ouvrir. `legende` prend le premier
bouton de légende, celui de Ma bière. Le geste de la fiche est couvert par ETATS (16/16) et `controle-fiche` (FICHE OK 1/1).
Reste ouvert : rendre ces trois contrôles conscients d'une feuille ouverte.
