OK — c56Regles 41/41 verts (R27 à R30), C56-1..6 et C50-5 corrigés en local 045e8ce2a ; 1 test périmé hors voie à ajuster (carnetsComparerPrix.test.ts:95)

# RESULTAT c56-fix

## Plan (par règle : endroit → correctif)
- R27 offre (C56-1) : FicheArticle ligne Offre → carnets.css : `.cn-offres .cn-offre-corps` en `flex-wrap: wrap`, `.cn-sp` en `flex: 1 1 0; min-width: min-content; overflow-wrap: break-word`, prix à droite (`margin-left: auto`). Le vendeur ne passe plus sous son plus long mot ; si lui et le prix ne tiennent pas ensemble, le prix descend ; un mot plus large que la ligne se coupe au lieu de couvrir le prix.
- R27 jauge (C56-2) : `Piste` du héros → la légende est dans le flux (`position: static`, `flex-wrap: wrap`), la piste grandit (`height: auto; min-height: 52px; padding-top: 24px`), la borne n'est plus `nowrap` ; « la plus haute des 2 » reste insécable (`cn-nowrap`), la borne qui descend se cale à droite. Rien ne change quand tout tient.
- R27 nombre + unité (C56-3) : nouveau `src/ui/carnets/insecable.tsx` : `Insec` entoure « chiffre espace unité » d'un `cn-nowrap` (le texte garde son espace ordinaire : données, recherche, tests de texte intacts) ; `liesParNbsp` (espace insécable) pour le titre de la liste, qui reste un seul nœud de texte. Posé sur : cellules de Comparer (`Mesure`, texte, en-tête de colonne), « Classé par », lien retour, valeurs de la grille Caractéristiques (Variantes), héros (libellé, valeur + unité, place), bornes de la jauge, fil d'Ariane (court et long), titre du carnet ouvert, titre dans la liste.
- R28 (C56-4) : `passerIA` (rangement.ts) → un appel `ok:false` ou qui lève est repris UNE fois après 400 ms (`repitMs`, réglable) avant « l'IA n'a pas répondu » ; ✕ et délai ne se reprennent pas ; au plus 2 appels.
- R28 (C56-5) : apercuCarnet.tsx + CarnetsVue.tsx → l'avis de l'aperçu (« rangé sur place ») se tait quand le bandeau de reprise porte déjà ce message en échec, en ligne : un seul avis, avec son Relire.
- R29 (C56-6) : `colonnesComparer` (Comparer.tsx) → la ligne du critère (`LIGNE_CRITERE`) se range juste APRÈS l'offre (prix, dispo, vendeur, pays, puis le critère, puis les caractéristiques dans l'ordre de la fiche).
- R30 (C50-5) : `compromisDe` (comparer.ts) → un critère sans valeur chez personne ne compte plus (= phrase « sans critère ») ; dernière sortie réécrite : « la 1re, <critère 242 L au lieu de 50 L> ; <prix>, la moins chère, <218 CHF de moins que la 2e> ; la 2e a le volume 4,06 m³ au lieu de 2,6 m³ » (écart de prix avec l'article voisin par le prix ; l'écart sur le critère chiffré, sinon sur la valeur chiffrée qui distingue). Nouveau `ecartPrixDit`. Comparer.tsx : un compromis d'IA qui recopie le tableau SANS dire l'écart cède au calcul local ; une phrase d'IA sans valeur du tableau (« la 1re gagne un mètre cube… ») reste (c48 R4 garde-fou).

## Fichiers écrits
src/ui/carnets : insecable.tsx (nouveau), carnets.css, Comparer.tsx, FicheArticle.tsx, ListeCarnets.tsx, CarnetOuvert.tsx, rangement.ts, apercuCarnet.tsx, CarnetsVue.tsx ; src/domain/carnets/comparer.ts ; work/missions/BUGS.md (lignes C56-1..6, C50-5) ; ce dossier (tests*.log). Commit de code 045e8ce2a. functions/ non touché.

## Critères
- `npx vitest run tests/unit/c56Regles.test.tsx` : 41 passed (28 rouges avant, 13 verts avant), `tests.log`.
- c48..c55Regles, c48RouvertE47E49, `tests/unit/carnets*` (tous), `tests/unit/proprietes`, + lot3CarnetOuvert, planning-atelier-avenir, integration/carnetEntreeUnique : 1263 passed | 3 skipped | 1 failed (`tests2.log`, `tests3.log`). Le seul rouge : `carnetsComparerPrix.test.ts` l.95, voir ci-dessous.
- tsc racine : 2 erreurs connues (seedData GanttTask, virtual:pwa-register), aucune neuve ; tsc functions/ : propre.
- `node scripts/agents/controle-bugs.mjs` : BUGS OK (2256 bugs, 509 ouverts).
- Essais : R27 jauge/offre/unités 2 essais (le 1er, espace insécable dans les textes, cassait `carnetsFix28Fiche` qui lit « 0,8 ml/100 g » à espace ordinaire → remplacé par le nowrap à l'affichage) ; R30 : 1 essai de plus pour concilier c48 R4 et le dernier test R30.

## Un test périmé (cité, non modifié : hors de mon Possède et de ma consigne)
`tests/unit/carnetsComparerPrix.test.ts` l.95, « un critère qui classe passe avant le volume et les dimensions, après le prix » : attend `colonnesComparer(t)[1]` = la colonne du critère. Avec dispo, vendeur, pays présents (fixture ventilation : « prix, dispo, vendeur, pays, tient 80 °C, débit »), c'est précisément ce que C56-6 et R29 interdisent (le critère coupait l'offre). Les deux ne peuvent pas être vrais. La règle de l'écran (sa plainte, R29) l'emporte ; l'intention du test (critère avant le volume et les dimensions, après le prix) reste vraie. Correctif d'une ligne pour le pilote : `expect(cols[1].critere || …)` → chercher le critère juste après la dernière colonne `__pays/__vendeur/__dispo` (`cols.findIndex(c => c.critere) === 1 + nombre de colonnes d'offre hors prix`).

## Doutes et limites
- Rien vu à l'écran (consigne : pas de captures locales) : jsdom ne mesure aucune boîte. À voir en ligne à 390 px : (1) ligne Offre avec « ggmgastro.com » : prix à droite, sur la même ligne ou dessous ; (2) légende de la jauge de la marmite n° 2 sur deux lignes, piste un peu plus haute (+ ~20 px), `Volume utile` et valeur du héros toujours côte à côte ; (3) Variantes et titres sans coupure entre nombre et unité ; (4) compromis du Comparer, phrase plus longue (une ligne de plus).
- C56-4 : la CAUSE du raté d'aiTask à 1,5 s n'est pas reproduite ici (rangement.ts attend 45 s) ; la reprise unique couvre un raté transitoire, pas une panne longue (deux échecs : l'avis, une seule fois). Si le cas revient en ligne : console ouverte à la création.
- Le compromis, avec critère, n'a plus la phrase de la maquette g01-8 (sa réponse « Oui » du 24.11, DOSSIER) ; le reste de Comparer inchangé. La « 2e » de la phrase est l'article voisin par le prix, pas forcément le 2e du tableau (le rang dit est le sien).
- Une valeur « distinguante » est choisie parmi les colonnes lues (groupeDeLigne : volume d'abord) ; si deux articles diffèrent surtout par la tension (230 V contre 400 V), la phrase dira la tension : valeur du tableau, rien d'inventé.

CONNAISSANCE : une mesure de boîtes ne prouve pas qu'un texte ne déborde pas (min-width: 0 sur un flex) ; une règle « nombre + unité » se tient à l'affichage par un nowrap local, pas par une espace insécable dans la donnée (les tests et la recherche lisent l'espace ordinaire).
LEÇON PROPOSÉE : aucune (un test d'une règle antérieure peut contredire une règle neuve : le chercher par grep des fonctions touchées avant de coder, ici `colonnesComparer` dans carnetsComparerPrix).
