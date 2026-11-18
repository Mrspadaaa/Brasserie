# Finances › Caisse : le calendrier fb réglé sur l'argent (m1, m2, m3), 16.11

On arrive par l'onglet Finances de la barre, sans bascule de mode. Le composant est le même que le calendrier général : comme le +, il change d'action principale selon l'endroit. L'onglet Calendrier reste à part, dans la barre.

Prototypes cliquables :
- `m1/proto.html`, `m2/proto.html`, `m3/proto.html` ;
- source : `src/` ; assemblage : `node build.mjs` (→ PROTO OK).

Socle repris de `2026-11-16-calendrier/fb9/p1/proto.html`, que je n'ai pas modifié :
- la palette clair et cave ;
- les pictos ;
- le moteur d'argent (`serie`, `flux`, `deCote`, `courbe`) ;
- la fixture de 40 choses.

J'y ai ajouté trois choses d'argent, toutes marquées exemple : la facture Malterie (−312, S49), la facture à encaisser du Café du Pont (+215, S48) et le devis étiquettes (−260, S50, non compté).

Moteur commun : caisse 4 180 · exemple, ventes +120 par semaine · exemple. Le plus serré tombe à 76 en S24, au lieu de 173 dans fb9, à cause de ces trois ajouts.

Commun aux trois variantes :
- la même barre du bas, Finances allumé ;
- le même + volant de fb (« + S47 »). Son menu met d'abord « Sur Finances » (Dépense, Encaisser, Devis reçu, Achat à prévoir), puis « Partout » (Écriture libre, Lancer un brassin, Créer une recette, Compagnon). C'est b1r revu : flottant, les actions communes gardées ;
- la même fiche d'une chose : montant au doigt (curseur et boutons ±10), effet sur le plus serré, semaine du paiement en puces, geste principal (Payé, Encaissé, Accepter le devis), lien vers Opérations, pièce jointe ;
- les mêmes sous-onglets de Finances : Caisse, Opérations, Annuel.

## Les trois variantes
- **m1 (froide) — la caisse au-dessus de la frise ; chaque chose porte son argent.**
  - En haut, le grand chiffre de la caisse, puis la courbe de fb avec son pinceau et « au plus serré 76 ».
  - Sous chaque semaine, une colonne bleue montre le libre en fin de semaine (f1, « Caisse et semaines »).
  - Quatre voies d'argent : Factures, Entrées, Achats, Brassins. Chaque barre porte son montant ; son nom s'affiche quand elle couvre 3 semaines ou plus.
  - Codes des barres : hachurée = mis de côté, pointillée = devis non compté, anneau rouge = en retard.
- **m2 (tiède) — la frise filtrée sur l'argent, en miroir sous la courbe de caisse, sur le même axe (t1b2 « La frise sous la caisse », kh1r « on voit mieux les conséquences »).**
  - Fenêtre de 3 mois ; les flèches ‹ › décalent de 3 mois.
  - Les entrées sont au-dessus de l'axe, les sorties au-dessous, et la hauteur de chaque barre est son montant.
  - Les 3 plus gros mouvements portent leur nom et leur montant. Le mois du plus serré a son titre en gras.
  - L'axe est resserré sur la plage réelle (3 000 à 7 000, chiffré), en reprenant kx2r1 : « bien voir les petites différences ».
  - Quatre pastilles filtrent : Factures, Ventes, Achats, Brassins. La courbe pointe alors leurs semaines, et une ligne donne leur somme.
- **m3 (chaude, greffe) — la frise devient la cascade de la caisse.**
  - Les semaines descendent ; chaque chose pousse la caisse de sa longueur, vers la gauche ou vers la droite.
  - L'épine bleue est la courbe de fb tournée d'un quart de tour. Le total de fin de période est en bas.
  - Glisser une rangée change son montant en direct, et toute la cascade suit. Toucher ouvre la fiche.
  - Le plus serré, en tête, est un bouton qui saute à sa semaine.
  - La cascade et le moteur concordent semaine par semaine : un écart s'écrit en erreur de console, et il y en a 0.

## Touchers et frappes (rejeu `capt.mjs`, états cliqués dans la page)
| Tâche | m1 | m2 | m3 | Clavier |
|---|---|---|---|---|
| Voir la caisse et le plus serré | 0 | 0 | 0 | non |
| Payer une facture (Brewferm, échue) | 2 (barre, Payé) | 2 | 2 | non |
| Encaisser une vente attendue | 2 (barre, Encaissé) ou 3 (+, Encaisser, puce) | 2 ou 3 | 2 ou 3 | non |
| Saisir une dépense habituelle | 3 (+, Dépense, puce « Hopfen −140 ») | 3 | 3 | non |
| Saisir une dépense nouvelle | 3 (+, Dépense, Scanner), puis l'écran Dépense actuel | 3 | 3 | lecture de la pièce |
| Accepter un devis | 2 (barre pointillée, Accepter) ; « si accepté : 76 → −184 » avant de toucher | 2 | 2 | non |
| Changer un montant ou un budget | 2 (barre, glisser le curseur) | 2 | **1** (glisser la rangée) | non |
| Déplacer une échéance | 2 (barre, puce de semaine) | 2 | 2 | non |
| Prévoir un achat mis de côté | 3 (+, Achat à prévoir, puce) | 3 | 3 | non |
| Filtrer sur un type d'argent | voies toujours visibles | 1 (pastille) | s.o. | non |
| Changer de période | 1 (toucher la courbe) | 1 (flèche) ou 1 (plus serré) | 1 (courbe) ou 1 (plus serré) | non |
| Régler caisse et ventes (hypothèses) | 2 (exemple, ±) | 2 | 2 | non |
| Annuler le dernier geste | 1 (Annuler) | 1 | 1 | non |
| Journal, éditer, annuler, archiver, pièce | 2 (Opérations, ligne) | 2 | 2 | non |
| TVA, coûts, clôture | 1 (Annuel) | 1 | 1 | non |

Champs de saisie au repos et dans chaque état capturé : 0. `type="number"` : 0.

## Fonctions de Finances couvertes (INVENTAIRE.md § 1), et où elles vivent
| Fonction de l'app | Où, dans m1 à m3 |
|---|---|
| Synthèse : situation, caisse | Le grand chiffre et la courbe de Caisse. La Synthèse se fond dans Caisse ; rien ne se perd. |
| Synthèse : seuil TVA | Annuel, jauge « Seuil TVA » (38 400 sur 100 000 · exemple). |
| Synthèse : Coûts (`CostComposition`, mois) | Annuel, « Coûts par mois » (matières, énergie, loyer). |
| Opérations : journal, éditer, annuler, archiver, pièce | Sous-onglet Opérations, inchangé (plage « du … au »). La fiche d'une chose y mène. |
| Prévisions : frise, horizon, récurrences | C'est Caisse : courbe et frise. Horizon par le pinceau (m1, m3) ou les flèches (m2). Loyer mensuel « par mois · chaque 1er ». |
| Projets (`UpgradeWorkspace`) : achats à venir, mise de côté | Achats hachurés (m1, m2) ou rangées hachurées de la cascade (m3) ; + › Achat à prévoir. |
| Factures à payer (`dueDate`), retards | Voie Factures (m1), pastille Factures (m2), rangées à picto (m3). Anneau rouge si échue ; Payé en 2 touchers. |
| Devis (« Devis et besoin ») | Barre pointillée non comptée. Accepter ou Refuser, avec l'effet montré avant ; + › Devis reçu (scanner). |
| Dépense et scan (`ui/depense/`, `ExpenseSheet`) | + › Dépense : « Scanner la pièce » ouvre l'écran Dépense actuel, inchangé, ou une puce d'habitué paie sans clavier. |
| Ventes (`InvoiceSheet`, saisie rapide vente) | + › Encaisser (ventes attendues) ; Encaissé depuis la fiche. |
| Budgets de brassin (`BrewBudgetSheet`) | Brassins (voie, pastille ou rangée), montant au doigt dans la fiche. La recette et la cuve restent dans Brassins (lien de la fiche). |
| Échéances fiscales (impôt sur la bière, OFDF) | Sur la frise comme Papiers fixes (`ro`, date fixe). |
| Annuel : clôture, versions, immobilisations | Sous-onglet Annuel, inchangé (« Préparer la clôture »). |
| Solde et caisse d'ouverture | Toucher le grand chiffre ou « exemple » : caisse aujourd'hui et ventes par semaine, en ±. |
| `CreativePricing`, `FinanceAssistant` | Restent dans Clients › Prix et marges, et dans le Compagnon (+ › Partout). |

Rien n'est retiré :
- Prévisions et Projets deviennent la vue Caisse ;
- la Synthèse se répartit entre Caisse (situation, caisse) et Annuel (seuil TVA, coûts) ;
- Opérations et Annuel restent tels quels.

Aucune maquette choisie ne couvre ces vues (`ecrans-app.json` : la dépense est `ouvert`, le reste n'a aucun choix). L'écran Dépense n'est pas touché : la variante l'ouvre seulement.

## Mesures (`journal-390.txt`, 390 × 844, clair et cave)
- **Mots au repos, nombres joints** (« 4 180 » compte pour un) : m1 40, m2 37, m3 40. **Découpe brute** du compteur `mots-premier-ecran` (« 4 180 » compte pour deux) : m1 42, m2 41, m3 43.
  - Les deux comptes incluent la barre du bas, la pastille « 24 » et « + S47 ».
  - Écart voulu : la limite de 40 est tenue sur le compte en nombres joints. En découpe brute, elle est dépassée de 1 à 3 mots, à cause des espaces fines des milliers.
- **Plus petit texte visible** : 14 px dans tous les états, 3 variantes × 8 états × 2 thèmes. Les 11 px de la pastille de fb et les 12 px de sa barre sont passés à 14 px.
- **Captures** : `capt.mjs`, copie de `p8/capt.mjs` adaptée à `proto.html`.
  - États capturés pour chaque variante : repos, action, ouverture, plus, depense, hyp, annuel, ops, en clair et en cave. Sortie : CAPTURES OK, 0 erreur de page.
  - m1 : action = Brewferm payé, caisse 4 180 → 4 094, courbe inchangée car c'était prévu ; ouverture = la fiche du devis.
  - m2 : action = la pastille Factures, −1 978 sur la fenêtre, 6 mouvements ; ouverture = la fiche du Marché de Noël.
  - m3 : action = le devis accepté, le plus serré passe de 76 à −184 et devient rouge ; ouverture = la fiche des Bouteilles de Noël.
- **Captures ouvertes** : montages `mN/cap/mont-mN.png` (repos, action, ouverture, repos cave) et `m1/cap/mont-autres.png` (annuel, ops, depense, hyp cave).
- **`controle-panel`** :
  - repos des trois : remplissage médian 0,64, 0 sous 0,50, mais ressemblance 0,93 ≥ 0,90 → **PANEL ECHEC** ;
  - cause : la même base imposée par le brief (sous-onglets, barre, +, grand chiffre). Je ne l'ai pas forcé.
- Non joués : `controle-commun` et `controle-choix`. Ces vues ne sont pas au registre des choix : c'est une exploration.

## Boosters UX (boosters-ux)
- caisse : le grand chiffre, un toucher règle les hypothèses (lire, ajuster).
- pinceau (m1, m3) : toucher la courbe déplace la fenêtre de 6 semaines (choisir).
- libre-semaine (m1) : colonnes sous S47 à S52 ; un toucher affiche « fin S49 · 3 786 » (lire).
- filtre-argent (m2) : la pastille réduit le miroir et pointe les semaines sur la courbe (comparer).
- miroir (m2) : la hauteur est le montant, le haut et le bas sont le sens (lire).
- cascade (m3) : glisser une rangée change son montant, puis toute la suite et le plus serré (ajuster).
- aller-au-plus-serre (m2, m3) : saute à la semaine du plus serré (suivre).
- fiche : curseur de montant, puces de semaine, effet avant et après (ajuster, déclencher).
- Couleur : elle accompagne toujours un nom, un picto ou un signe. Le rouge est réservé au retard et au passage sous 0.

## Prédiction
- m2 : « Là je vois ce qui entre et ce qui sort sous ma caisse. »
- m3 : « La cascade, c'est fort : j'accepte le devis et je vois tout tomber. Mais les petites rangées sans nom… »
- m1 : « C'est mon calendrier, en argent. »
