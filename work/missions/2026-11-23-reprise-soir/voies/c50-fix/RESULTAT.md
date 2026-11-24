OK — C50-1..4, 6..9 corrigés en local : 55 tests c50 sur 57 verts (2 tests faux cités) ; c48, carnets*, proprietes verts ; PRÊT À METTRE EN LIGNE ca6152092

# RESULTAT c50-fix

## Plan (par règle : où, et le correctif)
- **R6 (C50-1, bloquant)** — une seule vérité de « lu ». `functions/src/lienFusion.ts` (nouveau, module pur partagé lecture + affichage) : familles de synonymes (`memeCaracteristique` : Capacité = Volume = Contenance ; Température = Plage de température ; Tension = Branchement électrique ; etc.). `comparer.ts` : `valeursLuesDe` (valeurs fusionnées, mémorisées), `trouverValeur` (nom exact, sinon synonyme), `valeurPropre` retrouve la valeur sous un synonyme et convertit un volume (m³, L, dl, cl, ml) comme elle convertissait une longueur ; `colonnesLues` ne fait pas une 2e colonne d'un synonyme du critère. Trois endroits qui disaient « non publié » : fiche (`FicheArticle.tsx` `manque` : la cellule du tableau fait foi), Comparer (« Aucune valeur lue » : la cellule existe maintenant), feuille Articles (`CarteClassee` reçoit la cellule du tableau ; liste `CarteArticle` : `mesureCritere` cherche aussi le synonyme).
- **R7 (C50-2)** — `TableauCarnet.tsx` `colonnesCarnet` : critère qui classe d'abord, sinon la colonne qui DISTINGUE les articles (volume avant dimensions : `rangDeDecision`), la 1re seulement si aucune ne distingue ; la feuille Articles partage cette fonction.
- **R8 (C50-3, C50-6)** — lecture : `traduireValeurs` appelle `fusionnerCaracteristiques` (synonymes de même valeur réunis, « Température de » + « jusqu'à » → « 0 à 8 °C » ; deux valeurs différentes restent deux). Affichage des articles déjà rangés : même fonction dans `valeursLuesDe` (fiche, Comparer, tableau, feuille). Unité : `mesureNormalisee` (« 242 l » → 242 + « L ») à l'affichage seulement (les acquis T25-8/T28-13 gardent « 242 l » à la lecture) ; `compromisDe` ne redit plus l'unité ; Comparer : l'unité se dit une fois dans l'en-tête de ligne (maquette g01-8), la cellule la garde en texte caché pour le lecteur d'écran.
- **R9 (C50-4)** — `lienFusion.ts` `rangDeDecision` + `trierParDecision` : ordre fixe (température, volume, matière, énergie, tension, froid, dimensions, performance, porte, couleur), noms connus départagés par leur nom, jamais par la page. Lecture : `prioriserValeurs` (rang existant, puis ce rang). Fiche : critère d'abord, puis ce rang. Comparer garde l'ordre de ses groupes (CRB-14, test existant).
- **R10 (C50-7)** — `CarteArticle.tsx` `valeursLues` : « Induction : non ».
- **R11 (C50-8, C50-9)** — `carnets.css` : pied de la carte classée `flex-wrap: wrap`, « Veiller » + interrupteur groupés (`.cn-classee-veille`, à droite), réglette `flex: 1 1 56px` ; ligne Offre : disponibilité courte et « prix ? » en `cn-nowrap`, gestes (Poser le prix, Relire, Ouvrir) groupés dans `.cn-offre-gestes`, ligne qui passe à la ligne.

## Fichiers écrits
functions/src/lienFusion.ts (nouveau), functions/src/lienLibelles.ts ; src/domain/carnets/comparer.ts, modele.ts (`valeursEnFrancais` : une plage reste un texte) ; src/ui/carnets/CarteArticle.tsx, FicheArticle.tsx, FeuilleCartes.tsx, TableauCarnet.tsx, Comparer.tsx, carnets.css ; BUGS.md (8 lignes C50 : « corrigé en local ca6152092 », BUGS OK) ; ce dossier (tests.log, tests-large.log, tests-tout.log, banc.log). Hors OWNS, produit par la commande du critère : work/missions/2026-11-23-carnet-en-ligne/banc-liens/mesures/c50.json.

## Sorties décisives
- `npx vitest run tests/unit/c50Regles.test.tsx` : **55 verts, 2 rouges** (avant : 50 rouges). Les 2 rouges sont des tests faux, cités ci-dessous.
- `npx vitest run carnets lien lot c48 c50 lire Lien proprietes` : 1125 verts, 3 rouges = les 2 ci-dessus + `tests/integration/carnet/lot7-champ-choisir.test.tsx` (L-44, voir ci-dessous : déjà rouge, hors voie). c48Regles, carnets*, lien*, proprietes : verts.
- Suite complète (`npx vitest run`, tests-tout.log) : 13249 verts, 6 rouges : les 2 tests faux de c50, lot7-champ-choisir (déjà rouge), et 3 hors voie qui ne touchent pas le carnet : `recipePersistence` (écriture Firestore simulée), `rejeu-649b/virgule-transversale` (src/domain/stock/murAutres.ts, src/ui/atelier/EssaiPrix.tsx, src/ui/WaterRadar.tsx), `stock/murDonnees` (stock : autre session).
- `tsc --noEmit` racine : 2 erreurs connues (seedData GanttTask, virtual:pwa-register), aucune neuve ; `functions/` : 0 erreur.
- Banc des liens `--etiquette c50` : identique à c48 (caractéristiques 35/48, nom 58/63, prix 52/56, 0 invention, aucun champ en recul).

## Tests qui me paraissent faux (non modifiés)
1. `c50Regles.test.tsx` R6 « feuille Articles : jamais non publié, et la valeur lue de chaque article se dit », cas 1 et cas 2 (lignes 103-115 et 151). `texte()` met tout en minuscules (`norm` → `toLowerCase`) alors que les attendus sont `/8\s?°C/`, `/10\s?°C/`, `/0\s?à\s?8\s?°C/`, `/2\s?à\s?10\s?°C/` avec un « C » majuscule : le texte rendu est « 0 à 8 °c » (relevé dans le message d'échec : « …1article agrossiste-exemple.testen stockchf ? saisir0 à 8 °ctempératureveiller2article b…2 à 10 °c… »). La valeur « 0 à 8 °C » et « 2 à 10 °C » est bien dite par la feuille et jamais « non publié » ; aucun code ne peut faire matcher ces regex. Correction du test : `/…°c/i` ou `/…°c/` sur le texte en minuscules.
2. Hors voie : `tests/integration/carnet/lot7-champ-choisir.test.tsx` L-44 attend « 2 495,6 CHF » ; l'app dit « 2 495,60 CHF » (règle T30-12 : deux décimales dès qu'il y en a). Rouge avant cette voie (code de Choisir.tsx non touché).

## Essais
Plusieurs lancements de c50Regles (50 → 11 → 2 rouges) ; deux retours de conception après la grande série : (1) à la lecture, « 242 l » reste tel quel (acquis T25-8, T28-13, T25-6 le disent) : l'unité se normalise à l'affichage seulement ; (2) l'ordre de la décision ne s'applique pas à Comparer (test CRB-14 : ordre de la page dans chaque groupe) mais à la fiche et à la lecture.

## Doutes et limites
- **Rien vu en rendu** (consigne : pas de capture locale). R11 est une correction de structure (retour à la ligne, groupes) : à voir en ligne à 390 px, interrupteur « Veiller » entier avec « Dimensions intérieures (L x P x H) » et valeur de 21 signes ; ligne Offre avec et sans « Relire ». Comparer : l'en-tête de ligne perd l'unité quand la cellule la porte déjà (« Température » + « 0 à 8 °C »), sinon elle reste dans l'en-tête comme sur g01-8.
- Une unité qui ne se convertit pas (autre qu'une longueur ou un volume) laisse la cellule vide et dit « Aucune valeur lue » : le cas « autre unité » de R6 n'est couvert que pour les longueurs et les volumes (m³, L, dl, cl, ml).
- La fusion garde « Tension 230 V » et « Branchement électrique 400 V » séparés (valeurs différentes) ; les articles déjà rangés à Firestore ne sont pas réécrits (fusion à la lecture du carnet, `valeursEnFrancais`).
- La colonne du tableau du carnet sans critère peut être « Dimensions intérieures » si elle distingue seule ; le volume passe d'abord quand il distingue.
- Rien déployé, aucun appel Gemini.

CONNAISSANCE : une valeur « lue » a deux portes (`lireCarnet` → `valeursEnFrancais` pour les carnets réels ; `valeursLuesDe` pour un article brut) ; la fusion des synonymes vit dans `functions/src/lienFusion.ts`, importable de `src/` comme `lienLibelles.ts`.
LEÇON PROPOSÉE : aucune

Commit du code : ca6152092 (par chemins). Registre : `node scripts/agents/controle-bugs.mjs` → BUGS OK.
