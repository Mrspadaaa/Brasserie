OK — C48-1..6, E47-5 (rouvert), E49-1 corrigés en local : 28 + 16 tests verts, banc sans recul, 0 invention — PRÊT À METTRE EN LIGNE 0b47f7450

# RESULTAT c48-fix

Commit code : `0b47f7450` (par chemins). Registre : 8 lignes passées à « corrigé en local 0b47f7450 » (C48-1..6, E47-5, E49-1), `controle-bugs.mjs` → `BUGS OK : 2221 bugs, 511 ouverts, 202 sources`. Aucun appel Gemini, aucun déploiement, rien touché dans src/domain/stock, src/ui/stock, finance, calendrier.

## Plan et correctifs (par règle)
- **R1 prix lu + « Relire »** : `functions/src/lienProduit.ts` — repli `prixDuBloc` (1er bloc price/prix/preis du document, hors panier, barré, produits liés, navigation ; jamais une fourchette « CHF 4.00 – CHF 285.00 ») quand rien n'est lu sous le titre (prix avant le titre, ou à plus de 700 caractères). Interface : `BoutonRelire.tsx` (nouveau), prop `onRelire` sur `FicheArticle` (à côté de « Poser le prix ») et `Comparer` (sous le « ? » hachuré) ; câblé dans `ecransCarnet.tsx` (`relire` : relit la page par `appels.lire`, éteint ou hors ligne : le dit) ; nouvelle opération `relireArticle` (`operations.ts`) : le prix lu n'entre que si l'article n'a pas le sien, valeurs « page » rafraîchies, celles du brasseur jamais touchées, Annuler par l'inverse standard. Jamais automatique.
- **R2 libellés entiers** : `enteteCourt` → `nomCourt` (mots entiers, 3 mots / 24 signes, abréviation à point ≤ 4 lettres seulement pour un mot de plus de 14 lettres) ; largeur de colonne mesurée sur l'en-tête aussi (`data-tete`) ; `tbody th` de Comparer et `.cn-classee-carac` sans `break-word` ni ellipse ; valeur de colonne en insécables, mesure à plusieurs termes un terme par ligne (`ValeurCarnet`).
- **R3 un seul classement** (décision (a)) : `teteDeClassement` (Comparer.tsx), une fonction pour la chaîne de Comparer et la phrase « Classés par ce qui compte » de la feuille Articles. La chaîne dit critère(s), puis « Prix » si le prix classe (le vrai tri) ; la ligne Prix reste épinglée comme dans la maquette (l'épingle suit la ligne épinglée).
- **R4 compromis** (décision (b)) : `compromisDe` — sans critère : ni valeur du tableau ni candidat « moins cher » ; seulement « la 1re, la moins chère : X de moins que la 2e ; aucun critère ne les départage », sinon rien. Avec critère : phrase de g01-8 inchangée. `Comparer.tsx` : un compromis (IA ou calculé) sans critère qui recopie une cellule du tableau (`recopieLeTableau`) n'est pas montré ; l'IA qui récite cède la place au calcul local.
- **R5 l'essentiel d'abord** : `lienProduit.ts` — lecture jusqu'à 60 lignes, plafond de 24 pris par `retenir` (`lienLibelles.ts`) : l'ordre de la page est gardé, seules les lignes essentielles coupées prennent la place des numéros puis du reste ; puces sans libellé lues (température, tension, fluide R-xxx, refroidissement) ; volume en m³ du titre (`lienPlateforme.ts`) ; nom « Température » sans « de » ; `ESSENTIEL` connaît mode de fonctionnement, énergie, fluide, réfrigérant, refroidissement ; `lienIA.ts` : fusion et plafonds par `retenir`, consigne de l'IA (l'essentiel d'abord).
- **E47-5 rouvert** : `modele.valeursEnFrancais` met l'essentiel d'abord à la LECTURE de l'article (fiche, résumé de la carte, colonnes lues en profitent, quel que soit l'ordre gardé : page ou Firestore) ; « Couleur exacte » qui répète « Couleur » est fusionnée (autre valeur : gardée) ; « Est probablement équipé d'un adaptateur secteur » (`estSupposition`) n'est plus gardé (lecture, fusion, IA).
- **E49-1** : `enteteCourt` dit la grandeur et l'unité (« Hauteur cm ») ; une unité qui dit déjà la grandeur (m³/h, CHF, dB, kWh, bar…) reste seule.

## Sorties décisives
- `npx vitest run tests/unit/c48Regles.test.tsx` : 28 sur 28 (21 rouges au départ). `tests/unit/c48RouvertE47E49.test.tsx` : lancé ROUGE avant correctif (10 rouges sur 13, `tests-rouge2.log`), puis 16 sur 16 (13 + 3 gardes du repli de prix).
- `npx vitest run tests/unit/c48* tests/unit/carnets* tests/unit/proprietes tests/unit/lienNavigateur.test.ts tests/unit/banc-lecture-noms-fr.test.ts` : 57 fichiers, 867 tests verts (`tests-large.log`).
- `npx tsc --noEmit -p .` (racine) : 2 erreurs connues seulement (seedData `GanttTask`, `virtual:pwa-register`) ; `functions/` : aucune.
- Banc `npx tsx scripts/banc-liens.ts --etiquette c48` (avant : `c48-avant`) : tableau par lien IDENTIQUE ligne à ligne (63 liens), taux inchangés (prix 52/56, caractéristiques 35/48, nom 58/63…), `inventions: 0`. Deux reculs vus en cours de route, corrigés avant le commit : lien 35 (fourchette « CHF 4.00 – CHF 285.00 » lue comme 4 CHF par mon repli) et lien 62 (Poids d'expédition coupé par un tri qui passait avant le plafond ; d'où `retenir`).

## Tests adaptés (caducs, cités)
1. `c48Regles.test.tsx`, R4, « compromisDe, un critère Volume et deux prix » : l'ancien test exigeait qu'aucune valeur du tableau ne soit redite ; décision (b) du pilote : la phrase de la maquette g01-8 reste avec un critère. Remplacé par l'assertion de cette phrase (« la 2e, 2 495,60 CHF, soit 268,05 CHF de moins que la 1re ; le volume 2,6 m³ au lieu de 4,06 m³ »). Commentaire dans le test.
2. `carnetsE47.test.ts`, « matière et induction passent avant l'adaptateur secteur… » : demande du pilote (E47-5 rouvert) : la supposition « Est probablement équipé d'un adaptateur secteur » n'est plus gardée ; test adapté (absente, numéro d'article en dernier).

## Doutes et limites
- Aucune capture locale (consigne de la voie) : la mise en page à 390 px (en-têtes de 2 lignes, valeur « un terme par ligne », « Relire » sous le « ? », chaîne « Classé par ») reste à voir en ligne par le critique ; jsdom ne mesure rien.
- La page réelle ggmgastro n'a pas été rejouée (pas de HTML) : le correctif R1 couvre les deux causes plausibles (prix avant le titre, loin sous le titre) et le tri/relecture ; la capture de la vraie page reste à faire en ligne.
- « Relire » appelle la lecture standard (`appels.lire`, cascade avec IA Flash-Lite si un champ manque) : un coût de l'ordre du millième de franc par geste, journalisé par `aiTask`. Pas d'escalade Neon.
- `prixSousTitre` (existant) lit encore le premier montant d'une fourchette quand elle est dans les 700 caractères sous le titre ; seul mon repli la refuse. Non touché (hors règle, banc inchangé) ; à surveiller.
- Le tri de `valeursEnFrancais` change l'ordre des clés de `a.valeurs` à la lecture (aucune écriture dans le carnet) ; les colonnes « lues » de Comparer gardent le groupage de `groupeDeLigne`.
- Lignes identiques repliées de Comparer (C48-5, 10 sur 12) : hors voie, décision (c) du pilote.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : sur la lecture des liens, un plafond de caractéristiques se prend sur la liste TRIÉE (`retenir`), jamais dans l'ordre de la page ; l'ordre à l'écran se règle à la lecture de l'article (`valeursEnFrancais`), pas à l'écriture : les articles déjà gardés en profitent sans migration.
LEÇON PROPOSÉE : un repli de lecture ajouté à un banc de 63 liens se rejoue sur tout le banc avant le commit (deux reculs attrapés ainsi : fourchette lue comme prix, plafond qui coupait un champ vérité).
