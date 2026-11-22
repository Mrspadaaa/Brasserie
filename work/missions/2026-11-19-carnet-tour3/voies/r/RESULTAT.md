OK partiel — 39 lignes jugées sur rejeu de réponses enregistrées et code du tag ; 0 correctif dans mes possessions, correctifs attendus décrits.

Commit (port-carnet, branche claude/port-carnet-1711) : « Carnet tour 3 (r) : PCN-134, PCN-141, LR1-5, LR2-3, LR3-1 » — seuls `tests/unit/carnetsTour3R.test.ts` et `tests/unit/depense/rejeu-enregistre.test.ts`.
Aucune règle de mon périmètre (src/services/**, src/domain/finance/**) ne se montre fausse sur les lectures enregistrées ; ce qui gêne vient du vote serveur (`functions/src/invoiceVisionReview.ts`, hors de mon périmètre), du texte de Gemini, ou de `src/ui/depense/*` (f1).

## Méthode (rejeu, aucune valeur de pièce dans Git)
Les vraies réponses Gemini du banc (`Brasserie/work/finalisation-tickets-2026-10-08/H13-reels/<run>/raw/docN-tT-Csv8{1,2,3}.json`, hors Git) passent par `lireCsv8` de production (`functions/src/invoiceScanVote.ts`) avec les deux Flash-Lite puis la 3.8, comme en ligne. Runs : banc-robuste-1 et -2 (doc25, 12 tirages), banc-m9-payant et -t2 (doc2, 14, 15, 7). Script de mesure privé (scratchpad, non versé) ; le test versé `rejeu-enregistre.test.ts` rejoue les mêmes tirages (sauté si le dossier privé manque) et ne contrôle que des comptes.
Mesures (doc25, 12 tirages, 22 lignes) : 7 à 33 « findings » par tirage ; 12 « lignes non rapprochées » (1 par tirage) ; désaccords PESANTS par cellule : kind 61, montant de ligne 21, nom 21, référence 17, code TVA 8, prix 5, quantité 2 ; désaccords MUETS : quantité 130, montant 64. Aucun désaccord ne porte sur des noms identiques aux lettres près (0 sur 12 tirages ; le vote normalise déjà). Noms « barrés » (3.8 contre provisoire) : 0 à 5 par tirage ; ressemblance 5 % à 95 % (milieu : 11, 50, 53, 94 %) : ce sont de vraies lectures différentes de Gemini, pas des variantes de casse ou de ponctuation. Lignes « retirées » par la 3.8 : 8 sur 12 tirages, TOUTES avec quantité et prix absents et montant présent (forme 001) : les deux Flash-Lite ne les avaient lues que sur le montant.

## Les 29 lignes `ia`
id | verdict | commit | test | rouge→vert | écran touché
- TL-NOTE-2 | ouvert — non vérifiable sans Gemini (les bandes se rejouent sur réponse enregistrée : tests/unit/depense/lecture-d/ecran.test.tsx vert ; le geste « pièce réelle ZZ TEST puis Confirmer » reste à jouer en ligne) | — | lecture-d/ecran.test.tsx | sans correctif | non
- BT-NOTE-3 | ouvert — non vérifiable sans Gemini (facture réelle accordée par le brasseur) ; banc-lecture-facture.test.ts vert | — | banc-lecture-facture.test.ts | sans correctif | non
- M9-2 | ouvert — non vérifiable sans Gemini (date imprimée : doc7 et doc14 rejoués, date absente sur les deux : `date-absente` pèse, point honnête, jamais 0) | — | rejeu-enregistre.test.ts | sans correctif | non
- LR1-5 | ouvert — non vérifiable sans Gemini (barrés = lectures vraiment différentes, ressemblance 5 à 95 % ; 0 nom identique aux lettres près) ; correctif attendu côté f1, voir DÉCISION 1 | — | rejeu-enregistre.test.ts | sans correctif | oui (src/ui/depense/Ligne.tsx : barré)
- LR1-8 | ouvert — non vérifiable sans Gemini (VITRIFIC : quantité perdue = lecture Flash-Lite, montant seul) | — | rejeu-enregistre.test.ts | sans correctif | non
- LR1-NOTE-1 | ouvert — non vérifiable sans Gemini (nom traduit de travers ; pas de réponse enregistrée de ce ticket) | — | — | — | non
- LR1-NOTE-2 | ouvert — non vérifiable sans Gemini (noms OCR bruts ; banc-lecture-noms-fr.test.ts vert couvre la traduction sur réponse enregistrée) | — | banc-lecture-noms-fr.test.ts | sans correctif | non
- LR1-NOTE-3 | ouvert — non vérifiable sans Gemini (« BAC A en pièce / L ») | — | — | — | non
- LR1-NOTE-4 | ouvert — non vérifiable sans Gemini (sens du ⟳ bleu : affichage f1) | — | — | — | non
- LR2-2 | ouvert — non vérifiable sans Gemini pour la lecture (50,00 lu comme prix unitaire) ; côté app tenu : la rangée quantité attrape la ligne, lt3-ticket-quantite.test.ts vert | — | banc-k6/lt3-ticket-quantite.test.ts | sans correctif | non
- LR2-3 | ouvert — non vérifiable sans Gemini (doc14 : 2 tirages, 9 et 8 findings dont 13 points « unité absente » et des noms vraiment différents) ; « Voir le désaccord » vide = f1, voir DÉCISION 2 | — | rejeu-enregistre.test.ts | sans correctif | oui (f1)
- LR2-4 | ouvert — non vérifiable sans Gemini (« 16 lignes dont port » et « 17 lus » : comptages de la lecture ; doc14 rend 16 ou 17 lignes selon le tirage : 16, 17) | — | rejeu-enregistre.test.ts | sans correctif | non
- LR2-5 | ouvert — non vérifiable sans Gemini pour la variabilité ; le compte vient du vote serveur (DÉCISION 2) | — | rejeu-enregistre.test.ts | sans correctif | non
- LR2-6 | ouvert — non vérifiable sans Gemini : doc2 rend 1 ligne sans montant sur 6 à chaque tirage (4 sur 4) : l'app la compte « à remplir » (l'inconnu n'est jamais 0) ; la somme « verte » vient du total lu | — | rejeu-enregistre.test.ts | sans correctif | non
- LR2-7 | ouvert — non vérifiable sans Gemini : doc2 rend `kind` « other » sur les 6 lignes (4 tirages) ; le rangement en « Matériel » se fait dans `src/ui/depense/familles.ts` (f1) : aucune règle « vétérinaire » n'y existe (git grep vide) ; voir DÉCISION 3 | — | — | — | oui (f1)
- LR2-9 | ouvert — non vérifiable sans Gemini (même cause que LR1-8) | — | — | — | non
- LR2-11 | corrige (règle déterministe : controlesCroises.ts:154 `gesteManque`, selon l'écart d'articles de la lecture ; le geste change parce que la lecture change) ; test controlesCroisesP2.test.ts vert | non identifié (code ancien, ancêtre du tag) | tests/unit/finance/controlesCroisesP2.test.ts | sans correctif | non
- LR2-NOTE-1 | ouvert — non vérifiable sans Gemini (« vues par une seule lecture » : 3e lecture) | — | — | — | non
- LR2-NOTE-2 | present (côté lecture) : doc14 rend l'unité « Kg » en majuscule sur les 3 tirages ; `casseUnites` (src/ui/depense/etat.ts:177) met « kg » en « Kg » exprès, donc « Kg » est le choix d'affichage de l'app, pas un défaut de lecture | — | rejeu-enregistre.test.ts | sans correctif | non
- LR3-1 | ouvert — non vérifiable sans Gemini : les 8 lignes « retirées » du doc25 viennent des Flash-Lite avec montant seul (001) ; l'app ne peut pas inventer quantité ni prix ; test versé : chaque retirée garde son montant | — | rejeu-enregistre.test.ts | sans correctif | oui (f1, « Garder »)
- LR3-3 | ouvert — non vérifiable sans Gemini (voisine : `redresserDecalage` existe côté serveur, 12 tirages rejoués sans correction possible sur les lignes sans paire) | — | rejeu-enregistre.test.ts | sans correctif | non
- LR3-4 | ouvert — non vérifiable sans Gemini pour la variabilité ; DÉCISION 2 sur le compte | — | rejeu-enregistre.test.ts | sans correctif | non
- LR3-9 | ouvert — non vérifiable sans Gemini (le sous-groupe vient de `kind`, en désaccord 61 fois sur 12 tirages) ; DÉCISION 3 | — | — | — | non
- PCN-160 | ouvert — non vérifiable sans Gemini (le classement note ou critère vient de l'IA ; bf91d78e1 : la sorte rendue fait foi) ; carnetsEnLigne2.test.tsx, réponses enregistrées | — | — | — | non
- PCN-8 | ouvert — non vérifiable sans Gemini (contenu de la carte lu par lireLien) ; fixtures produit-ldjson.html, produit-og.html, page-sans-meta.html déjà au dépôt | — | — | — | non
- PCN-15 | ouvert — non vérifiable sans Gemini (règle « Moins de X » dans functions/src/carnetIA.ts:137 et banc corrigés ; la réponse de Gemini décide) | — | — | — | non
- PCN-44 | ouvert — non vérifiable sans Gemini | — | — | — | non
- PCN-50 | ouvert — non vérifiable sans Gemini (le 30 L vient de la réponse simulée du banc, git grep vide dans l'app) | — | — | — | non
- PCN-104 | ouvert — non vérifiable sans Gemini (la qualité du texte de l'IA ; le repli local reprend la phrase) | — | — | — | non

Note : PCN-160, 8, 15, 44, 50, 104 : je n'ai pas rejoué `tests/fixtures/carnets/en-ligne-2/reponses.json` ligne à ligne ; ces six restent `ouvert` faute de temps, pas faute de réponse enregistrée. À rejouer par un exécutant (DEMANDE EXECUTANT).

## Les 10 du lot d (code au tag en-ligne/2026-11-19-tour2)
- PCN-105 | corrige | c8bdcba49 « Port carnet : port des écrans retenus » (ancêtre du tag) ; CadreArrivee.tsx « lecture de la page » ; CRITIQUE-8 n° 12 | oui
- PCN-112 | en-ligne | le chemin IA est corrigé (57254e47c, CarnetsVue.tsx:702-707 : phrase citée = lignes de la note jointes par « \n ») ; le chemin local (`depuisLocale`) ne passe pas par cette ligne : à voir à l'écran. Parcours : liste peuplée, coller « Sachets de levure x2. Prochain brassage mardi. Tient 80 °C pour la hotte. », IA coupée, lire la phrase citée de la carte
- PCN-114 | corrige | e0073224e « correction tour 3 » (ancêtre) ; EtatIA.tsx:124 « L'IA range… » ; CRITIQUE-8 n° 21. Rendu 1280 et 390 : à revoir en ligne
- PCN-119 | en-ligne | aucune espace insécable dans le titre (git grep : seuls les milliers en ont) ; la coupure « 80 / °C » dépend de la largeur : à voir à 390 ; si présente, correctif f2 : lier la valeur et l'unité dans `titreDePhrase` / le rendu du titre
- PCN-122 | corrige | b3bb2d0fd « correction tour 5 » (ancêtre) ; Comparer.tsx `premierSansValeur` (« sans valeur à comparer, il ne range pas »)
- PCN-134 | en-ligne | le domaine rattache déjà : `rattacher('hotte murale à 1 200 m³/h au moins', carnets)` rend Ventilation (test carnetsTour3R.test.ts vert) ; le « 2e carnet hotte » venait du chemin de la liste (CarnetsVue.tsx, f2) : à rejouer en ligne : « Déjà un carnet proche », pas de 2e carnet
- PCN-135 | en-ligne | la reformulation en critère débit existe (axeLu, 21450270a) ; non rejoué à 1280 : titre et « Ce qui compte » après écriture depuis la liste
- PCN-141 | present (f2) | `parleDuBrassin` (analyseLocale.ts:244-251, 4e489acbb, ancêtre) range les lignes brassin dans « Prochain brassin » ; mais tous les carnets vivent dans Stocks › Matériel (StocksTab.tsx) : c'est ce rangement que le brasseur a vu. Test versé : la règle de reconnaissance tient. Décision : DÉCISION 4
- PCN-146 | present (f2) | CarnetsVue.tsx:738-780 : l'écriture locale part à l'envoi et l'IA la remplace (`remplacerRangement`) ; « Sol du local » est donc visible avant la confirmation : voulu par la critique 7 (« création anticipée »), contraire à ce que le brasseur a vu. Correctif attendu côté f2 : ne pas montrer en liste un carnet créé par une note en vrac tant que la découpe attend (ou le marquer provisoire), test carnetsEnLigne*.test.tsx
- PCN-155 | present (f2) | src/domain/carnets/modele.ts:298 `statutDe` : `carnet.articles.length > 0 ? 'research'` (lu ou non) ; correctif attendu : « À comparer » seulement avec au moins un article LU (champ lu/valeurs), test dans carnetsBanc.test.ts

## Tests
- tests-rouge.txt : aucun correctif dans mes possessions, donc aucun rouge.
- tests-vert.txt : 5 fichiers, 81 tests verts (rejeu-enregistre, carnetsTour3R, lt3-ticket-quantite, banc-lecture-noms-fr, controlesCroisesP2). `tsc` non relancé (fichiers de test seuls).

## Écrans touchés et état à montrer
Aucun écran touché. À capturer en `?dev-local` / en ligne : PCN-112, 119 (390), 134, 135 (1280), 141, 146, 155 (carnet).

## DÉCISIONS À PRENDRE
1. Barrés de la 3.8 (LR1-5, LR3-3) : f1 peut taire l'ancienne valeur quand la ressemblance des noms est ≥ 0,9 (le doc25 en compte 12 de 94 à 95 %, donc des variantes d'orthographe) — `src/ui/depense/finale.ts:199` (`memes` = égalité JSON stricte) ; test : ces 12 paires ne posent pas de « corrigée ». Recommandation : oui, avec `ressemblance` du serveur (déjà exportée).
2. Compteur de désaccords (LR2-3, LR2-5, LR3-4) : `functions/src/invoiceVisionReview.ts:418-428` pose un point PESANT dès qu'une cellule n'a pas de majorité, `kind` compris (61 sur 12 tirages = 5 par tirage). Recommandation : `kind` en désaccord sans majorité = muet (le client range par `familles.ts`), test sur les 12 tirages rejoués ; demande un déploiement de `aiTask` : à toi.
3. LR2-7 et LR3-9 : règle « actes vétérinaires / services » dans `src/ui/depense/familles.ts` (f1) plutôt que d'attendre `kind`. Recommandation : oui.
4. PCN-141 : un carnet « Prochain brassin » rangé dans Stocks › Matériel contredit son idée ; choix de goût : où vit ce carnet. Recommandation : le montrer au brasseur en mini maquettes.

DEMANDE EXECUTANT : rejouer `tests/fixtures/carnets/en-ligne-2/reponses.json` sur PCN-160, 8, 15, 44, 50, 104 : `npx vitest run tests/unit/carnetsEnLigne2.test.tsx tests/unit/carnetsEnLigne4.test.tsx tests/unit/carnetsBanc.test.ts --reporter=dot` ; attendu : tout vert ; noter pour chaque id le test qui le couvre.

CONNAISSANCE : le vote de production rejoué sur 12 tirages du doc25 montre ~11 points de désaccord pesants par tirage, dont 5 sur `kind` ; les noms barrés ne sont jamais identiques aux lettres près (vraies variantes de lecture, 5 à 95 % de ressemblance) ; les lignes remises « Garder » arrivent des Flash-Lite avec montant seul.
LEÇON PROPOSÉE : aucune
