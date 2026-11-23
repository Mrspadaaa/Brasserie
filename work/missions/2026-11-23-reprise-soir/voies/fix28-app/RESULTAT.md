OK — T28-1, 2, 3, 4, 6, 10, 11, 15, 17 corrigés côté app ; 22 tests verts, tsc sans erreur neuve

PRÊT À METTRE EN LIGNE 96f65ee02

## Fichiers écrits
- Domaine : `src/domain/carnets/prixUnitaire.ts` (neuf), `comparer.ts`, `comptes.ts`, `lecture.ts`, `operations.ts` (`marquerIntrouvable`).
- UI : `src/ui/carnets/lectureRegles.ts` (neuf), `rangement.ts`, `rangementCarnets.ts`, `CarnetsVue.tsx`, `apercuCarnet.tsx`, `LectureLien.tsx`, `Bandeau.tsx`, `bandeauxCarnet.tsx`, `PrixPastille.tsx`, `lecture-lien.css`.
- Test : `tests/unit/carnetsFix28App.test.ts` (22 tests, règles de calcul et d'état seulement ; aucun test d'écran local).
- Non touché : `FicheArticle.tsx` (autre voie ; il était déjà modifié dans l'arbre, je ne l'ai pas committé).

## Un constat, une ligne (fait, test)
- T28-1 : `LectureGardee` et `LectureEnCours` gardent `carnetId` (null = collé depuis la liste) ; `passerIA` l'utilise pour l'IA (`contexteModele`, `lireReponse`, repli) et le passe à `ecrireIA` (4e argument) ; sans carnet gardé (ancienne lecture), le carnet du message (`depuisDuMessage`). Après rechargement l'annonce « ici » est refaite à partir de ce carnet. Tests : 4 (suivi, reprise depuis la liste, ancienne lecture, null).
- T28-2 : `deplier` (barre repliée) ouvre le carnet du lien (`carnetAOuvrirDepuisBarre`) ; la carte de fin, vue d'ailleurs, nomme l'article et le carnet (« dans « X » »). Test : règle de cible.
- T28-3 : cause = la carte fermée par « Compléter » laissait passer l'avis générique « L'IA n'a pas répondu » ; supprimé pour un lien mort. « Compléter » rend l'article mais le marque `introuvable` (`marquerIntrouvable`, jamais « lecture… ») et ouvre sa fiche. Tests : 2.
- T28-4 : pendant une relecture « IA plus forte », la carte d'échec reste, titre « Relecture · IA plus forte », étape « Relu par une IA plus forte » qui tourne (temps), bouton « Relecture… » éteint ; après : « Toujours introuvable », étape non lue, pas de second Escalader. Tests : règle du bouton, états posés par `escalader`.
- T28-6 : `prixUnitaire.ts` : quantité lue dans le nom (g, kg, ml, cl, dl, L ; « 5 x 100 g » et « 20 g/L » refusés, inconnu jamais 0). Tri, `domine`, intitulé « le prix au kilo » : au CHF/kg quand ≥ 2 offres disent leur quantité. Pastille : quantité à côté du prix ; `detailPrix` (carte et fiche) : « 1 kg · 72,50 CHF/kg ». Tests : 5 (Mosaic 100 g = Citra 1 kg ; tableau réel Hallertau/Citra/Mosaic).
- T28-10 : `fin` posée à la fin du rangement (pages + IA), `debut` pris au collage (avant l'écriture locale). Tests : 2.
- T28-11 : `sansArticleEnLecture` : l'article `a-lire`/`en-cours` du message dont la lecture tourne n'est ni compté ni montré (liste, carnet, feuilles : `carnets` et `tous` de `CarnetsVue` sont filtrés). Tests : 2.
- T28-15 : `bandeauNommantLeCarnet` : sur la liste (ou hors du carnet) « Rangé ici » devient « Rangé dans X » ; « Déjà dans « X » ». Tests : 2.
- T28-17 : `ecrireLocal` rend `dejaRange` (tous les effets du message sont des articles `existant`) ; `derouler` s'arrête là : ni lecture, ni IA, ni jeton ; bandeau « Déjà dans ce carnet » immédiat, sans faux « IA éteinte ». Tests : 2.

## Sorties décisives
- `npx tsc --noEmit -p .` : seulement les 2 erreurs connues (seedData, pwa-register).
- `npx vitest run tests/unit/carnetsFix28App.test.ts` : 22/22 (`tests.log`).
- `npx vitest run tests/unit/carnets* lot11Carnet lot3CarnetOuvert port-q4-carnet` : 42 fichiers, 589 tests verts (`tests-large.log`).
- Essais : 2 sur le fichier de test (réponse IA vide refusée par le garde ; format « 72,5 » → « 72,50 »), aucun critère à 3.

## Doutes et limites (à regarder en ligne)
1. T28-4 : la cause exacte des « 30 s sans rien » n'a pas pu être reproduite sans écran ; la carte, l'étape et le bouton éteint sont posés sur l'état `en-cours` + `escalade`. À confirmer par le pilote en ligne.
2. T28-3 : « Compléter » ouvre la fiche de l'article (nom, prix à saisir) ; elle appartient à une autre voie : si elle ne laisse pas saisir le nom d'un article `introuvable`, c'est là que ça se règle.
3. T28-6 : le rang « 1er pour le prix » et la règlette de `Choisir` (placeSur, valeurs en centimes affichés) lisent encore le prix affiché : non touchés (la règlette montre des prix, pas des prix au kilo). Le classement du tableau, la dominance et l'intitulé sont, eux, au kilo.
4. T28-11 : pendant la lecture, un carnet neuf né d'un lien seul paraît sans article sous la carte des étapes (« collez un lien ») ; l'article revient à l'arrivée du résultat.
5. T28-1 : si le message a lui-même été écrit dans un carnet supprimé depuis, `connu()` retombe sur le comportement d'avant.
6. Les « tests rouges avant » : les règles neuves n'existaient pas (modules, champs et arguments absents) ; pas rejoué sur HEAD (pas de stash).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : le fichier `rangement.ts`/`rangementCarnets.ts` etc. est en CRLF : un remplacement multi-lignes échoue en silence sur `\n` ; normaliser avant.
LEÇON PROPOSÉE : aucune
