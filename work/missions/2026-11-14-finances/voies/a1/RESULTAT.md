OK — Annuel : travaux non classés hors du ferme, segment hachuré « à classer », tête « ? » en attente, renvoi à l'étape 4.

## Fichiers
- `src/ui/finance/annuel/calculs.ts` : `piecesAClasser`, `resultatEnAttente`, `colonnesAnnee(report, aClasser)` (ferme séparé de l'à classer). `perteAvantStock` inchangé.
- `src/ui/finance/annuel/Tete.tsx` : « ? / CHF : résultat en attente », puce « À classer 5 500,00 » (renvoi étape 4), segment hachuré par pièce (bouton, renvoi étape 4), colonne à l'échelle (ferme + à classer).
- `src/ui/finance/annuel/Etapes.tsx` : étape 4 liste les pièces à classer avec [Matériel] (fiche préremplie, existante) et [La pièce] (journal filtré) ; étape 3 : plus de « perte de −70,40 » ferme en attente.
- `src/ui/finance/annuel/Etapes2.tsx` : étape 8, revenu « ? » (renvoi étape 4) au lieu du chiffre « avant stock » en attente.
- `src/ui/finance/annuel/piecesAClasser.test.ts` (6 tests), `voies/a1/` : `controle-annuel.mjs`, `capturer.mjs`, `vitest.a1.config.ts`, `temoin-head.txt`, `apres.txt`, `tests.txt`, `cap/`, `planche.html`.
- Domaine, Synthèse, Opérations, CSS : non touchés (styles en ligne, classes `ann-` existantes).

## Constat qui change la voie (à lire)
Sur le banc `reel`, `piecesNonClassees(report)` est VIDE : REEL-T1 porte un `finance` (lignes vides), donc `annual.ts:133` (`!tx.finance && …`) ne la signale pas. Sonde faite : `missing` = justificatifs, trésorerie, inventaires seulement. Le diagnostic y1 (« alerte + unclassifiedCapital ») ne vaut que pour une pièce sans `finance`. S'appuyer sur `piecesNonClassees` seul aurait laissé le −70,40 intact. Règle UI posée : « à classer » = dépense de catégorie `renovation` (ou matériel sans `finance`), sans ligne `equipment`, sans fiche au registre, année en cours, part pro appliquée ; plus les alertes du domaine pour mettre la tête en attente. Le petit achat de matériel avec `finance` reste le « Petit achat » de g6 (joints 28,60) : pas hachuré (test annuelEcran l.102 inchangé).

## Critères
- G1 `controle-annuel.mjs 3000` : `ANNUEL OK` (10 vérifications : plus de « CHF perdus » ; « résultat » + « à classer » dits ; segment « Local et travaux » hachuré, bouton, 5 500,00 ; « Dépensé + usure » 265,40 ; segment et puce ouvrent l'étape 4 ; Matériel et La pièce offerts).
- G2 `lire.mjs temoin-head.txt "ANNUEL ECHEC" TEMOIN` : `TEMOIN OK` (code d'avant : 9 KO sur 10).
- G3 `vitest-lu.mjs tests.txt` : `VITEST OK`, mais PAS avec la commande du contrat : `npx vitest run src/ui/finance src/domain/finance` renvoie « No test files found » (la config racine ne charge que `tests/`, et les noms ne contiennent pas ces chemins). `tests.txt` vient de `npx vitest run --config work/missions/2026-11-14-finances/voies/a1/vitest.a1.config.ts --no-color --reporter=dot` : 5 fichiers, 75 tests (mon test + annuelCalculs, annuelEcran, autres `annuel*`, periodeSynthese).
- `npx tsc --noEmit` : aucune erreur hors `functions/`.
- Essais : 1 par critère. Captures ouvertes : `cap/planche-390.png` (g6 tête, g6 étape 4, app 390 clair, 390 cave, étape 4), `ann-1280-clair`, `ann-1280-cave`, `etape4-1280-cave`. Non ouvertes une à une : `etape4-1280-clair`, `ann-390-*` seuls (couverts par la planche).

## Doutes et limites
- Aucune façon de dire « c'est une charge » : [La pièce] ouvre le journal, mais une pièce sans ligne ne peut pas se passer en charge depuis l'écran ; elle reste « à classer » jusqu'à la fiche matériel. Écrire un traitement exige le domaine ou `TaxWorkspace` (hors de ma voie).
- La piste (`etapesPiste`, bâtie dans `TaxWorkspace`) ne voit pas les pièces à classer : l'étape 4 peut y paraître « prête » avec une fiche confirmée et une autre pièce à classer. Fix : passer `transactions` à `materielPret` (TaxWorkspace, hors voie).
- Étape 8 : la ligne « ventes − dépensé − usure » garde `operatingExpensesCents` (arithmétique du domaine, 5 765,40).
- Le segment hachuré est dessiné en styles en ligne : `annuel.css` est un fichier voisin du dossier possédé, je ne l'ai pas modifié.
- 390 : deux puces empilées (À classer, Stock) au-dessus de « Entré » ; lisible sur la planche, un peu haut.

DÉCISION À PRENDRE : où ranger les petits achats de matériel avec `finance` (joints) ? Options : (a) comme maintenant, « Petit achat » de g6, jamais à classer ; (b) comme la Synthèse (`materiel` et `renovation` à part), donc hachurés aussi. Recommandation : (a), sinon une pièce de 28,60 bloque la tête. Et pour classer une pièce « charge » : accepter une action `ecrire`/traitement dans le domaine (voie à ouvrir).

CONNAISSANCE : sur le banc `reel`, REEL-T1 est classée « charge » par le domaine (a un `finance`) ; l'alerte `annual.ts:133` ne vise que les pièces sans `finance` : le −70,40 n'était pas signalé par `piecesNonClassees`.
LEÇON PROPOSÉE : un diagnostic qui cite une alerte du domaine se vérifie par la sonde sur le banc avant de bâtir le correctif dessus (la voie a1 a trouvé `missing` sans l'alerte).
