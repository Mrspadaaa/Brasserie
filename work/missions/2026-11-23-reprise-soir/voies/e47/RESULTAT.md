OK — E47-1..5 et C46-5 corrigés en local (052e89cb7) : sur commande, unité de colonne, libellés, références, essentiel d'abord, centimes. PRÊT À METTRE EN LIGNE 052e89cb7

# RESULTAT e47

## Plan (cause, fichier, correctif)
- E47-1 (m) : `stockStatus` (brewerSuppliers) classe PreOrder/BackOrder en `out_of_stock`, d'où « rupture ». Correctif dans `functions/src/lienProduit.ts` (hors brewerSuppliers, partagé) : nouvel état `sur-commande` (schema.org PreOrder/BackOrder, ou « Auf Bestellung » avec un délai écrit à côté) et `dispoDelai` (« expédié sous 28 jours », mots de la page ; rien si la page n'en écrit pas). Chaîne : `carnetIA.ts` (type), `lireLien.ts`, `src/ui/carnets/lignesRegles.ts` (« sur commande · expédié sous 28 jours »).
- E47-2 (m) : les longueurs écrites d'un bloc (« 143,5 cm », « 370 mm ») n'avaient pas d'`unite` : la colonne ne convertissait rien. `src/domain/carnets/longueurs.ts` : `separerUnite` (nombre + unité, noms de longueur seulement) et `uniteDeColonneLongueur` (la plus lue ; à égalité le cm). Branchés dans `comparer.ts` (`valeurPropre`, `colonnesLues`).
- E47-3 : table `functions/src/lienLibelles.ts` : « Gesamtabmessungen mit Motor » → « Dimensions avec moteur » ; plus Herstellernummer, Kältemittel, Genaue Farbbezeichnung, Materialgruppe, Türanschlag, Leistungsaufnahme, Ursprungsland (visibles dans les fiches Galaxus du banc).
- E47-4 : `lienLibelles.ts` (`estIdentifiant` : valeur recopiée, espaces de milliers retirés) et `src/ui/carnets/EtatIA.tsx` `texteSelonNom(nom, texte, brut)` (4 appelants : Comparer, FicheArticle, CarteArticle ×2). « 40.003 » reste « 40.003 ».
- E47-5 : (a) doublon Capacité/Volume de même valeur fusionné (`traduireValeurs`) ; (b) `prioriserValeurs` (appelé dans `lireLien.enFrancais`) : essentiel d'abord, numéros, marque, emballage, adaptateur en dernier, ordre de la page sinon ; (c) lecture manquante : `lienPlateforme.ts` accepte un groupe « specifications » de Galaxus à 1 ou 2 lignes (Leistung : 104 kWh, Energiedeklaration : classe E étaient écartés sous 3 lignes) ; `lienProduit.ts` `essentielsDeLaPage` lit la matière (« Edelstahl AISI 304 » → « Acier inox AISI 304 ») et l'induction (« Nicht für Induktion geeignet » → « non ») quand une ligne ENTIÈRE le dit, hors nav et pied de page.
- C46-5 : `UpgradeWorkspace.tsx` (`chf0` exporté, ligne « francs » de la carte) et `Courbe.tsx` (`sgExact` pour le montant d'une chose nommée, « mis de côté ») passent par `francsExacts` du domaine : 79,95 reste 79,95, 80 reste 80. Solde, écarts de semaine et échelle gardent les francs entiers (autres écrans importent `sg`).

## Preuves
- Tests : `tests/unit/carnetsE47.test.ts`, 17 tests. Rouge LANCÉ sur le code d'avant : `tests-rouge.log` = 14 échecs sur 17 (3 passaient déjà : OutOfStock/InStock, serveur ne groupe pas les références, ordre des colonnes). Le test E47-2 a été resserré après (cellules « 143,5 » / « 37 », unité de colonne « cm ») ; vert : `tests.log`, 17 sur 17.
- Banc des liens sans IA (`npx tsx scripts/banc-liens.ts --etiquette e47-avant|e47-apres`, mesures `banc-liens/mesures/e47-*.json`, 63 liens) : tous les taux identiques (nom 58/63, prix 52/56, photo 56/59, caractéristiques 35/48, livraison 15/23, HT 9/9), 0 invention avant et après, aucun champ en recul (`diff.cjs`). Changements de lecture : n° 30 et 31 (brewstore) « rupture » devient « sur commande · 10 jours / 28 jours » ; n° 59 (KS240L) gagne classe E, 104 kWh, puissance, tension ; n° 16, 17, 18, 58, 60 gagnent classe énergétique et consommation ; matière lue sur 21, 31, 38, 40 ; induction « non » sur 31.
- Écart découvert au banc : n° 39 passait « sur commande » à cause de « Vorbestellungen » dans un bandeau de boutique. Corrigé : le texte seul ne vaut « sur commande » qu'avec « Auf Bestellung / sur commande » ET un délai d'expédition écrit.
- tsc racine : 2 erreurs connues (GanttTask, virtual:pwa-register), aucune neuve ; tsc functions : 0.
- Tests touchés verts : `tests/unit/carnets` (45 fichiers, 685 tests, dont ceux de libellés, liens, Comparer) ; 15 fichiers Calendrier/finance/courbe + `tests/unit/proprietes` : 22 fichiers, 283 tests ; 21 fichiers qui importent UpgradeWorkspace ou la courbe : 185 tests. Logs : `tests-larges.log`, `tests-proprietes.log`, `tests-finance.log`.
- Registre : E47-1..5 et C46-5 « corrigé en local 052e89cb7 » ; `node scripts/agents/controle-bugs.mjs` : BUGS OK (2220 bugs, 516 ouverts).
- Commit code : 052e89cb7 (chemins seulement, y compris `functions/src/` : **aiTask à déployer par le pilote**, la lecture des liens y tourne).

## Doutes et limites
- E47-2, « colonne stable » : je n'ai pas pu reproduire le saut Volume → Hauteur sans l'app en ligne. Ce que je sais : une colonne par nom, `groupeDeLigne` met toujours Volume (2) avant Hauteur (3) ; le saut vu venait sans doute de la colonne Hauteur ajoutée (2e article lu) ou du défilement du tableau. Les unités sont réglées ; la stabilité de l'ordre reste à revoir en ligne sur le Comparer à trois articles.
- E47-5 : une partie de la sélection (classe E, 104 kWh) dépend des pages en ligne. Le banc rejoue les pages capturées le 23.11 : « Réf. du fabricant » et « adaptateur secteur » du test en ligne ne s'y retrouvent pas (ils venaient de l'IA, non rejouée ici). Je range ces numéros en dernier sans les retirer.
- Anciens articles déjà rangés dans les carnets : leur ordre de caractéristiques ne change pas (le tri se fait à la lecture du lien) ; la référence et les unités de Comparer se corrigent à l'affichage.
- Les montants à centimes s'étendent aux titres de la carte « Caisse en fin de mois » de À venir (`chf0`) : un solde à centimes s'y écrira avec ses centimes.
- Pas de capture locale (consigne) : la preuve visuelle est à faire en ligne par le pilote et le critique, après déploiement de l'app et de aiTask.

## Fichiers écrits
functions/src/{carnetIA,lienLibelles,lienPlateforme,lienProduit,lireLien}.ts ; src/domain/carnets/{comparer,longueurs}.ts ; src/ui/carnets/{CarteArticle,Comparer,EtatIA,FicheArticle,lignesRegles}.ts(x) ; src/ui/finance/UpgradeWorkspace.tsx ; src/ui/calendrier/entete/Courbe.tsx ; tests/unit/carnetsE47.test.ts ; banc-liens/mesures/e47-{avant,apres}.json ; lignes E47 et C46-5 de work/missions/BUGS.md ; ce dossier.
(Scripts de travail dans ce dossier : dump.ts, emb.ts, ctx.mjs, ctx2.mjs, vis.mjs, diff.cjs.)

## Essais
Un essai par critère, sauf trois reprises : la règle « sur commande » par le texte (faux positif n° 39, corrigé), l'ordre des caractéristiques déplacé de `traduireValeurs` vers `prioriserValeurs` (deux tests existants attendaient l'ordre d'entrée), 6 libellés allemands ajoutés (un test Galaxus existant n'admet aucun libellé allemand).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : Galaxus publie ses caractéristiques par groupes `specifications` dont les petits (1 à 2 lignes : Leistung, Energiedeklaration) étaient écartés par le seuil de 3 lignes de `valeursEmbarquees` ; c'est là que vivent la classe énergétique et les kWh/an. Un texte « Vorbestellungen » dans un bandeau de boutique n'est pas un article sur commande.
LEÇON PROPOSÉE : aucune
