ECHEC — G2/G3 : 3 appuis de l'étape joués sous la fiche ouverte (contrat, hors Possède) ; 13/16 OK

Voie r3-fiche, 24.10. La fiche g1 et la fiche courte de Citra cryo rendues avec tous leurs états de fiche : pied
Styles · Huiles · Sources · Substituts, α de la fiche la plus récente (11–14 %, Hopsteiner 2025), notes d'honnêteté de
Citra cryo, bulle des sommets du radar. Les 13 états qui se jouent dans la fiche passent. Les 3 qui échouent se
déclenchent sur une carte de l'étape. Sur `fiche/etat.html`, cette carte est sous la fiche ouverte, et elle appartient à r1.

## Fichiers écrits (Possède seulement ; `git status` vérifié)
- `prototypes/houblons-v4/parcours/src/ecrans/fiche/FicheHoublon.tsx` : α le plus récent et son libellé de source, réglette g1, note de l'α, familles dans l'ordre de la bande (sans « 1/1 »), « 1 seule fiche : … », « nommé en premier » comme g1, ♡ ⊘ avec les mots de g1, `data-etat` (feuille, croix, voile, goûts, Comparer), voile qui reprend le toucher, trait de la croix.
- `…/fiche/Replis.tsx` (neuf) : les quatre replis et leur contenu, dont les remplaçants tirés de `remplacants` du moteur et le pont « Remplacer › ».
- `…/fiche/sources.ts` (neuf) : ce que chaque fiche dit d'un houblon, lu en direct dans le catalogue du moteur (`hopRef`, `describeFamilies`).
- `…/fiche/RadarFiche.tsx` : bulle au toucher ou au survol, une cible par secteur, échelle à 2 fiches au moins, pas de « 1/1 ».
- `…/fiche/fiche.css`, `…/fiche/jeu.mjs` (gestes « sources depliees », « substituts du meme calcul »), `…/fiche/NOTE.md`.
- `prototypes/houblons-v4/maquettes/parcours-fiche/**` (construction et `captures/`).
- Scripts de travail : `%TEMP%\r3fiche\` (sonde, captures, appui).

## États rendus (data-etat, capture « après », planche côte à côte avec la capture choisie)
Chaque planche `-cote.png` met côte à côte `capture_choisie` (g1) et la maquette. Je les ai toutes ouvertes en image.
Dossier : `prototypes/houblons-v4/maquettes/parcours-fiche/captures/`.
- etat-fiche-ouverte · data-etat sur la feuille · OK · capture `etat-fiche-ouverte-cote.png` · « α 11–14 % lot 13 % », aria « (Hopsteiner 2025) », 7 familles, Épicé seul « nommé en premier » (au lieu de 9,5–16, 8 familles et 4 « premier » sur 5345f6ad).
- etat-fiche-bas · groupe « Détail de la fiche » · OK · `etat-fiche-bas-cote.png` (absent sur 5345f6ad).
- etat-fiche-styles · bouton « Styles › » · OK · `etat-fiche-styles-cote.png` · West Coast IPA, NEIPA, Session IPA ; Crosby Hops.
- etat-fiche-huiles · « Huiles › » · OK · `etat-fiche-huiles-cote.png` · totale BM 2023 0,9–3,3, Hopsteiner 2025 1,5–3 mL/100 g ; myrcène 48–59 % ; humulène ; caryophyllène ; farnésène non importé ; linalol 0,8–1 %, Hopsteiner.
- etat-fiche-sources · « Sources › » · OK · `etat-fiche-sources-cote.png` · α BM 2023 9,5–16, α Hopsteiner 2025 11–14, α mon lot 13, β des deux, origine et base d'IBU, auteurs de chaque famille, descripteurs.
- etat-fiche-substituts · « Substituts › » (aria « Ouvrir les remplaçants de Nugget ») · OK · `etat-fiche-substituts-cote.png` (et `-cave.png`) · 8 remplaçants à 60′ : Nelson Sauvin 86, Galaxy 85, Idaho 7 93, Sabro 93, Altus 99 ?, Magnat 99, Trident 99 ?, Yeoman 99 ; pont « Remplacer Nugget › ».
- etat-fiche-radar-sommet · secteur Melon · OK · `etat-fiche-radar-sommet-cote.png` · « Melon : ses fiches ne le décrivent pas, inconnu (ce n'est pas zéro), posé au centre ».
- etat-fiche-aimer / etat-fiche-exclure · ♡ / ⊘ · OK · `etat-fiche-aimer-cote.png`, `etat-fiche-exclure-cote.png` · « Remettre neutre : Aimer Nugget ».
- etat-fiche-comparer · « Comparer » · OK · `etat-fiche-comparer-cote.png` (Comparer r6a, D107).
- etat-fiche-fermer-croix · croix de 44 px · OK · `etat-fiche-fermer-croix-cote.png`.
- etat-fiche-fermer-fond · voile, point (195, 40) · OK · `etat-fiche-fermer-fond-cote.png`.
- etat-fiche-survol-1280 · posé par r1 sur sa carte · OK (pas de capture de ma part).
- etat-fiche-appui-long-carte, etat-fiche-appui-en-cours, etat-fiche-appui-long-citra · ECHEC au contrôle, faute de `data-etat`. Le geste a été joué avec les sélecteurs de p21a sur `ma-biere/etat.html` (`%TEMP%\r3fiche\appui.cjs`) :
  - la carte de Nugget, appui de 700 ms, puis doigt tenu 800 ms : la fiche de Nugget s'ouvre (81 mots, « Comparer » présent) ;
  - le 2e ajout rapide : la fiche de Citra cryo s'ouvre (85 mots, contre 103 sur g1 et 187 sur 5345f6ad). On y lit « α : plages de Citra en pellets ; la fiche du cryo manque. », « 1 seule fiche : Beer Maverick », « + Floral 1 seule fiche − Résineux inconnu » et « groseille à maquereau ».
  - Captures : `etat-fiche-appui-long-carte-cote.png`, `etat-fiche-appui-en-cours-cote.png`, `etat-fiche-appui-long-citra-cote.png`.

## Critères (sorties décisives, dernier passage)
- G1 : `CONSTRUIT OK (9 pages) → prototypes/houblons-v4/maquettes/parcours-fiche/`. Deux essais ont échoué sur des fichiers d'autres voies (substituer, suggerer, en cours d'écriture) ; la relance a suffi.
- G2 : `ETATS ECHEC (3/16)` : 13 OK. Les 3 états restants manquent leur `[data-etat]` : appui-long-carte, appui-en-cours, appui-long-citra.
- G3 : `CHOIX ECHEC`. Avec `REPRISE OK (12 repris)` et `FICHE-RADAR OK`, il reste trois échecs, aucun dans mes fichiers :
  - controle-etats (les 3 états ci-dessus) ;
  - controle-fiche D25, « un appui long sur « 60′ » n'ouvre pas de fiche » ;
  - controle-fiche-baseline, « l'appui long sur beermaverick-nugget n'ouvre pas de fiche ».
  Les deux derniers prennent le premier `[data-houblon]` visible de Ma bière. C'est désormais la poignée du rail de r1 (`span[data-role="glisser-moment"][data-houblon]`, Frise), et un appui long y règle le moment. Au départ de la voie, les deux passaient.
- G4 : `COMMUN ECHEC 1 contrôle(s)`, soit `S3, rayons hors échelle : 10px×1`. Ce rayon est celui de `.pq-mb-levure` (`ma-biere/rail.css`, r1), sous la fiche. J'ai corrigé dans la voie mes deux écarts :
  - S4 : la croix avait 2 épaisseurs de trait ;
  - SURVOL : « J'aime » ne se lisait qu'au survol, par `title`.
- G5 : `TEINTE OK 6/6`.
- G6 : `TYPES OK`.
- G7 : `NOTE OK`.
- Aussi : `jouer-parcours --etape=fiche` → `ETAPE OK (fiche)`, avec deux gestes neufs. L'un vérifie que la liste de la fiche est celle de `remplacants(…, 8)` et que ses 6 premiers sont ceux de Substituer. `SANS-FAMILLE OK`.

## Décisions
- DÉCISION : g1 titre l'α avec la fiche la plus récente (Hopsteiner 2025, 11–14 %), pas avec la plage la plus large. `aria-label` « Acides alpha 11–14 % (Hopsteiner 2025), mon lot 13 % », comme g1.
- DÉCISION : Substituts se déplie dans la fiche. g1 ouvrait la page u4, mais VOIE.md demande la liste et un pont. La liste compte 8 remplaçants comme g1, du même appel moteur que Substituer, « en stock d'abord » : l'ordre suit donc le moteur, pas le score seul. g1, lui, classait par score (Magnat, Yeoman, Sabro…). L'icône de stock dit pourquoi Nelson Sauvin passe devant Magnat. Le pont « Remplacer Nugget › » ouvre Substituer sans rien y changer.
- DÉCISION : la bulle du radar répond au toucher sur tout le secteur de la famille. Un sommet inconnu est posé au centre, trop petit pour le doigt. Le texte est celui de g1.
- DÉCISION : « Ajouter à 10′ » de la fiche courte reste retiré (« palace holder ? »), comme la table des IBU (« Inutile »).
- Le voile de vaul était `inert` : la pile de PageShell le pose. La fiche le retire et rend le toucher au voile, qui reste aria-hidden. Le geste ne change pas, la feuille se fermait déjà par « toucher hors ». À l'intégration, il vaut mieux exclure le voile de la pile.
- Retraits liés à ses refus plus récents : aucun nouveau. « Ajouter à 10′ » et la table des IBU restaient déjà retirés, voir ci-dessus.

DÉCISION À PRENDRE : les 3 états d'appui sur l'étape (`etat-fiche-appui-long-carte`, `-appui-en-cours`, `-appui-long-citra`) ont `route: "fiche"`. La page `fiche/etat.html` s'ouvre fiche ouverte : la carte de Nugget et l'ajout rapide de Citra cryo sont sous la feuille. De plus, Carte et Ajouter n'ouvrent pas de fiche sur la route fiche (`if (route.ecran !== 'fiche')`).
- Options :
  - (a) dans `choix/etats/fiche.json`, donner à ces trois états `"avant": ["etat-fiche-fermer-croix"]` ; r1 pose alors `data-etat` sur la carte de Nugget (ligne-houblon), sur un élément intérieur de cette carte pour `-appui-en-cours` (un élément ne porte qu'une valeur), et sur le 2e ajout rapide ;
  - (b) leur donner `"page_construite": "../ma-biere/etat.html"`, avec les mêmes `data-etat` posés par r1.
- Recommandation : (b), car la page de départ de ces gestes est l'étape.
- À surveiller : si r1 pose ces `data-etat` sans ce changement, le doigt tombe sur le voile, qui referme maintenant la fiche. « Nugget » et « Comparer » pourraient alors se lire sur Ma bière : un faux vert.

Prédiction : « Là c'est ma fiche, avec Sources et Substituts comme avant ; et Citra cryo dit enfin que le cryo n'a pas sa fiche. »

CONNAISSANCE : sous une feuille vaul, la pile d'inertie de PageShell rend `inert` le voile, enfant direct du corps hors du dialogue. `elementFromPoint` sur le fond assombri rend `<html>`. La feuille se ferme quand même, par le « toucher hors » de Radix. Un contrôle qui exige l'élément sous le doigt doit donc viser un voile rendu au toucher.

LEÇON PROPOSÉE : un état déclenché sur un autre écran (appui long sur une carte de l'étape) ne se rejoue pas sur la page de l'écran d'arrivée ouverte d'avance. Son `verif` porte la page de départ (`page_construite`) ou un `avant` qui la découvre, et le relevé le vérifie en jouant la maquette construite, pas seulement sa maquette choisie.
