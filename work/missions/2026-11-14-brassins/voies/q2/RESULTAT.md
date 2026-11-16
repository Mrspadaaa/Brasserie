OK — liste des brassins (e6a) et feuille Filtrer (e6c) portées, branchées, testées, capturées côte à côte.

# q2 — résultat (15.11)

## Fichiers
- `src/ui/production/liste/` : `listeModel.ts`, `ListeBrassins.tsx`, `CarteBrassin.tsx`, `FeuilleFiltres.tsx`, `liste.css` ; `ProductionCatalog.tsx` (liste des brassins), `ProductionTab.tsx` ligne 193 (accordée par le pilote : plus de `PhraseReponse` sur la liste, qui porte sa phrase e6a).
- `tests/unit/port-q2-liste.test.tsx` (18 tests), `tests.txt`, `INVENTAIRE.md`, `banc.mjs`, `journal.json`, `captures/` (17 PNG : e6a repos / repos-bas / geste / vide, e6c repos / geste / vide / défile en 390 clair ; repos en 390 cave, 1280 clair, 1280 cave).

## Critères
- G1 : `TSC OK`. G2 : `TESTS OK` (18/18). G3 : `CAPTURES OK`. G4 : `HORS ? src/components/tabs/ProductionTab.tsx` — c'est la ligne 193 accordée par le pilote (décision 1) ; tout le reste est dans la voie.
- Tests existants rejoués, tous verts sans adaptation : productionCatalog (13), rxCartes (6), port-p6-bilan-plus (10), batchMissingTargets (1), batchNombresFr (5), compactProduction (14), mobileDailyViews (6).
- Banc : `BANC OK 17 captures`, aucun geste sans effet, aucune erreur de page. Essais : une passe de captures, une retouche, deux rejeux.

## Écarts vus (D344) : 8 trouvés, 5 corrigés, 3 restants
Corrigés : (1) `--ebc-copper`/`--ebc-gold` n'existent pas dans l'app : barres « cond. », points, étoile favorite et tuiles invisibles → `--lst-cuivre`, `--lst-or` ; (2) « Tous » noir au repos (la maquette : gris) ; (3) vide e6a : la ligne tri/période n'existe pas dans la maquette, masquée ; (4) « Tout effacer » de la feuille bleu → texte normal ; (5) feuille à 94 % de hauteur → 80 % comme la maquette, et largeur bornée en 1280. La carte Archives du vide se voit avec un brassin rangé (fixture ZZ-006).
Restants, non bloquants :
1. Typographie : le texte de l'app est ~15 % plus large que celui de la maquette (police) ; « Chercher dans Archives » passe sur 2 lignes à 390.
2. Titre du panneau du vide e6c : « Ces critères s'excluent : retire-en un » (la maquette : « Le Stout est conditionné : retire un critère », phrase propre à son cas) ; ordre des deux boutons « Retirer » selon le tri des critères.
3. Anneau de focus sur le × de la feuille dans les captures : focus programmatique du `Sheet` partagé (hors voie) ; invisible au toucher. Les bandes de familles de houblons n'apparaissent pas avec les houblons fictifs « ZZ » (inconnus de l'index) ; elles sont chargées pour les vrais.

## ACCORD / écarts de donnée
- « F1 · 24 L » : volume seul (pas de nom de cuve sur `Batch`) ; « Garde 2 °C » : « Garde froide » ; « Écoulée/vendue » : « Terminé » ; « depuis le 03.11 » : volume ; « 30 × 33 cl · fût 20 L » : ce que `packaging` porte, sinon « n L conditionnés » ; « Mesures manquantes » = OG/FG absentes ; phrase « F1 et garde » : « fermentation et garde ».
- Tuile et puce « Notes à compléter » gardées (le filtre `tasting` existait) : 7 tuiles au lieu de 6.
- Alcool d'un brassin en cuve : valeur provisoire (point en pointillé).
- Retirés : « Annulés », « Comparer » (recettes seules), ligne « n fiches dans Archives », bandeau « Vue filtrée · … ».

## DÉCISION À PRENDRE
Période de l'application : `ProductionTab` filtre encore par la période de l'en-tête avant la liste ; « Toutes » de la feuille ne peut pas élargir au-delà (la feuille l'écrit sous les segments quand l'en-tête limite). Option recommandée : le pilote fait passer à `ProductionCatalog` tous les brassins et la période, et la liste applique `batchesVisiblesSousPeriode` (ou le sur-filtre local) elle-même. Hors de ma voie.

CONNAISSANCE : `--ebc-copper` et `--ebc-gold` n'existent pas en variables CSS (seulement `-texte` et les hex de `tailwind.config`) : un port qui copie `rgb(var(--ebc-copper))` d'une maquette obtient du transparent, sans erreur. Le `Sheet` de l'app plafonne à 94 dvh ; `className` permet `lg:max-w-xl lg:mx-auto` et un `max-height` plus fort.
LEÇON PROPOSÉE : aucune
