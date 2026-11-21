# AMELIO-workflow : Carnet → achat → Calendrier → caisse → facture → Parc → entretien (21.11)

Regard : expert en workflow (préfixe AMW). Analyse seulement, aucun code. Complète CHASSE-workflow.md (défauts CRW-1 à 7, pistes W1 à W3) sans les recopier : ici, ce qui devrait arriver tout seul, de bout en bout.
Règles : REGLES.md (R1 à R12), filtre GAIN.md.

## Méthode et limites
- Preuves : lecture du code du worktree `port-carnet` (e26a46f36) : `domain/carnets/{operations,modele,comparer}.ts`, `domain/finance/{upgradeForecast,materielFutur,realiseSansAchat,forecast,types}.ts`, `domain/equipment/{schedule,actions,expenses}.ts`, `types/index.ts` (EquipmentItem), `services/purchaseEntry.ts`, `ui/finance/TransactionDetails.tsx`.
- Aucun banc Chrome rejoué. Gestes : **estimés** sur le code (sauf chaînes C et E d'ANALYSE-acheter : mesurées, 9 et 6 gestes). Fréquences : **estimées** (achat de matériel : quelques fois par an ; 15 carnets, 0 réalisé).
- Honnêteté de fréquence : le matériel s'achète rarement. Un gain tient donc surtout par l'erreur évitée (donnée fausse ou oubliée des mois plus tard) et par la ressaisie supprimée, pas par le nombre de gestes.

## La chaîne et ce qui est déjà en place (code)
| Maillon | Existe | Manque (prouvé dans le code) |
|---|---|---|
| Carnet → article | `lireLien` : nom, photo, dispo, un prix | pas de champ prix (CRW-2), devise `EUR` lue mais jamais convertie : `planDepuisChoix` ne tient `budgetKnown` que pour `CHF` |
| Choix → À venir | `planDepuisChoix` : plan `draft`, `date: ''`, `amountCents` 0 si inconnu | sans date, le plan n'entre pas dans la prévision (`upgradeForecast`, `estPose`) |
| À venir → Calendrier / caisse | `buildForecast`, `effetProjet`, `mesurerAchat` (caisse avec/sans, meilleur mois, usure au litre) | rien n'appelle ça depuis le choix du carnet ; le brasseur doit aller dans À venir |
| Facture → plan | liste déroulante « Rattacher à une prévision » (`TransactionDetails.tsx` l. 125), `planAllocatedCents` | aucune suggestion : choix à la main parmi tous les plans ; aucun rapprochement par vendeur ou montant |
| Facture → Parc | `purchaseEntry` : ligne `equipmentAction: 'new'` crée un `EquipmentItem` (nom, catégorie, date, prix) | l'objet naît sans rythme, sans garantie, sans lien au carnet ni au plan (`sourceCarnetId` reste sur le plan seul) |
| Parc → entretien | `equipment/schedule` : rythme (jour, semaine, mois, brassin), statut, `lastDone` ; Calendrier lit les échéances | le rythme se saisit à la main (`NewEquipment`, liste « aucun / mois / … ») ; aucun préréglage par type d'appareil, sauf étalonnage (`calibrationPreset`) |
| Parc → actif comptable | `FinancialAsset` (usure, catégorie) | créé séparément ; `actifLiePourProjet` retrouve l'actif du projet mais rien ne le crée depuis la facture |

Racine commune : chaque maillon est correct isolément, mais **aucune donnée ne traverse** (prix, date, vendeur, garantie, rythme). Le brasseur est le convoyeur.

## Idées

### AMW-1 : le plan naît daté et chiffré dès « Choisir » (prix estimé, date par horizon)
- Règle : R1, R2, R4. Reprend W1 + W2 de CHASSE-workflow, élargi : même geste pose le plan dans la prévision et le montre à la caisse.
- Aujourd'hui : Choisir (2-3) → ouvrir À venir (1-2) → ouvrir le plan, taper date et budget (4-5) → voir la caisse (1). **≈ 9 gestes**, 3 écrans. Si oublié : le plan reste « draft » à 0 CHF, invisible partout.
- Visé : Choisir → ligne « Dans À venir · dans 3 mois · 4 900 CHF estimé · caisse fin de mois −4 900 · Changer » (horizon en puces `aujourd'hui / 1 / 3 / 6 mois`). **3 gestes**, 1 écran, −66 %.
- Gain : ressaisie (date, prix) supprimée ; erreur impossible (achat décidé mais absent de la caisse). Fréquence : à chaque choix, soit quelques fois par an. Coût : **petit** (valeurs par défaut dans `planDepuisChoix`, calcul `effetProjet` déjà là). Donnée : prix de l'article (AMW-2), `moisAchat`.
- Classe : **vrai gain**. Forme à montrer : oui, une ligne d'effet sous « Choisir » (mini maquettes).

### AMW-2 : prix rendu en CHF (EUR, port, TVA, douane), pas le prix affiché
- Règle : R4 (le réglage montre ce qu'il change), R5 (rien deux fois).
- Constat : les boutiques allemandes publient en EUR HT ou TTC ; `PrixLu.devise` distingue CHF/EUR mais `planDepuisChoix` met `budgetKnown: false` pour tout EUR. Un EUR ne devient donc jamais un budget, et la comparaison (04) ne peut pas classer un article suisse contre un allemand : c'est le cœur du choix d'un brasseur suisse.
- Aujourd'hui : calculer à la main (cours, port, TVA 8,1 %, douane, formulaire import) : **6 à 10 gestes hors app** + risque d'oubli de TVA ou de port. Visé : un prix EUR saisi ou lu → « ≈ 5 120 CHF rendu (cours du jour, port 380 €, TVA import 8,1 %) · à confirmer » : **2 gestes** (saisir le prix, ajuster le port si connu).
- Gain : erreur évitée (écart de 15 à 25 % entre prix affiché et rendu, d'après ordre de grandeur TVA + port ; **non mesuré**, à valider sur 2 offres réelles). Fréquence : chaque comparaison avec une boutique étrangère. Coût : **moyen** (cours, règle port/TVA par pays : donnée `pays` déjà lue ; TVA suisse sur l'importation à retenir comme `estimate`). Donnée : prix, devise, `pays`, port (souvent absent de la page : champ à saisir).
- Piège : ne rien inventer. Cours et TVA sont des paramètres dits, le résultat est marqué « estimé » (R2). Douane réelle (tarif, droit de timbre) : **hors périmètre**, à ne pas promettre.
- Classe : **vrai gain**. Forme : oui, la ligne « rendu » (prix → +port → +TVA → total) est un choix de présentation.

### AMW-3 : « Ce qui compte » posé par le brasseur en un geste, sans attendre l'IA
- Règle : R3, R6. Constat CRW-7 : lignes vides « l'IA le proposera ». Piste 3 du pilote.
- Aujourd'hui : écrire un message pour que l'IA propose un critère (3-4 gestes + attente), ou rien si hors ligne. Visé : puces de critères usuels pour la catégorie (prix, volume, porte, puissance, bruit, garantie) en **1 toucher chacune**, avec seuil modifiable (`comparer` sait déjà évaluer des seuils : `MOINS_MIEUX`, `aRevoirSi`).
- Gain : indépendance de l'IA (hors ligne, coût Gemini), 3 gestes évités par critère, ×4 critères. Fréquence : chaque carnet neuf. Coût : **petit** à **moyen** (puces issues des critères déjà dans `analyseLocale`).
- Classe : **vrai gain** (hors ligne). Forme : non, geste standard d'ajout de critère déjà dessiné ; à vérifier au doigt.

### AMW-4 : « Est-ce que ça entre ? » : place et porte comparées automatiquement
- Piste 4. Les dimensions sont déjà dans le titre (1800 × 1500 mm). Visé : une fois pour toute la brasserie (largeur de porte, hauteur sous plafond, surface libre) saisie dans un réglage, l'article affiche « passe la porte : non (90 cm) ».
- Aujourd'hui : comparer à l'œil à un mètre ruban : **0 geste app**, mais erreur coûteuse (chambre froide livrée qui ne passe pas la porte) ; le critère « porte » existe déjà (`LIGNE_PORTE`) mais se saisit par article.
- Gain : erreur évitée de valeur élevée, fréquence **très faible** (un achat volumineux par an). Donnée : dimensions de l'espace (nouvelle donnée, une fois). Coût : **moyen** (réglage + parseur de dimensions).
- Classe : **nice to have** pour l'instant ; **vrai gain** si les 15 carnets contiennent plusieurs gros équipements (chambre froide, cuve, chaudière). Ne pas construire avant de savoir si le critère « porte » comme seuil modifiable (AMW-3) suffit.

### AMW-5 : le rapprochement facture → plan proposé, pas cherché
- Règle : R1, R8 (suggérer selon le contexte). Reprend et remplace W3, qui l'écartait faute de fréquence : le gain ici est l'erreur, pas les gestes.
- Constat : la liste « Rattacher à une prévision » liste tous les plans de même sens ; rien n'indique le bon. Sans rattachement, la caisse compte **deux fois** (plan prévu + facture) et `realiseSansAchat` oblige à une confirmation WFA-12. Ce sont les maillons qui, ratés, faussent la courbe de caisse.
- Aujourd'hui (chaîne C+E mesurées) : photo → lecture → Finances → ouvrir la dépense → déroulant → choisir le plan → Réalisé : **9 + 6 = 15 gestes**, vendeur et montant retapés. Visé : à la fin de la lecture, bandeau « C'est l'achat de Chambre froide (Frigo-Plus, 4 900 CHF prévu) ? Oui / Non » quand vendeur ou montant à ±15 % correspondent : **1 toucher** (−90 %), plan marqué réalisé et soldé par la facture.
- Gain : erreur impossible (double compte, plan jamais soldé), ressaisie supprimée. Fréquence : chaque achat de matériel. Coût : **moyen** (score vendeur/montant sur les plans `source: 'equipment'` ouverts ; le rattachement lui-même existe). Donnée : `vendeur` du plan (déjà posé par `planDepuisChoix`), montant, date.
- Classe : **vrai gain**. Forme : oui, bandeau de proposition (mini maquettes : emplacement et mots du « Non »).

### AMW-6 : la facture crée le bien au Parc avec ce que le carnet sait
- Règle : R1, R5.
- Constat : `purchaseEntry` crée l'`EquipmentItem` à partir de la ligne seule : nom de ligne de facture (« Art. 48211 »), catégorie par défaut « Brassage », état « Neuf ». Le titre du carnet, la photo, les dimensions, le vendeur et le « pourquoi » du choix ne passent pas ; `sourceCarnetId` est sur le plan, pas sur l'objet. Le commentaire de `liensQuiRetiennent` le dit : « aucune donnée ne relie le parc au carnet ».
- Aujourd'hui : renommer l'objet, choisir catégorie, ajouter notes (**4 à 6 gestes** par objet) ; sinon un bien nommé comme la ligne de facture, introuvable au Parc. Visé : si la ligne est rattachée au plan (AMW-5), l'objet naît avec le nom du carnet, sa catégorie, la photo et un lien « Pourquoi ce choix ». **0 geste.**
- Gain : ressaisie supprimée, mémoire du « pourquoi » gardée (un brasseur qui rouvre son parc dans deux ans). Fréquence : chaque bien acheté. Coût : **petit** une fois AMW-5 là (champ `sourceCarnetId` sur `EquipmentItem`, comme sur le plan). Donnée : déjà dans le carnet.
- Classe : **vrai gain** (ressaisie). Ne pas confondre avec doublon : voir AMW-9.

### AMW-7 : rappel d'entretien et garantie posés à la naissance du bien
- Règle : R1 (une action pose toutes ses suites sûres), R2 (précision de la saisie), R7 (pousser l'existant).
- Constat : le Parc sait déjà calculer échéances, retards et brassins depuis l'entretien (`equipmentStatus`, `nextDueAfter`), et le Calendrier les affiche. Mais un bien neuf naît **sans rythme** : « sans échéance », donc aucun rappel, tant que le brasseur n'ouvre pas la fiche. Aucun champ garantie n'existe sur `EquipmentItem` (grep : zéro `garantie`/`warranty` dans `types` et `equipment`) ; la fixture du carnet cite pourtant « pas de garantie sur le compresseur » comme **critère de choix**.
- Aujourd'hui : ouvrir le bien, régler le rythme (3-4 gestes, la liste « aucun / mois / … »), noter la garantie en notes libres (2-3 gestes), rien au Calendrier. **≈ 6 gestes, souvent jamais faits.** Visé : à la création du bien, rythme proposé selon le type (chambre froide : dégivrer chaque 6 mois ; compresseur : contrôler chaque 12 mois ; réfractomètre : étalonner, déjà `calibrationPreset`), « Oui / Changer » en un toucher ; garantie = date d'achat + durée du critère « garantie » du carnet, rappelée au Calendrier 1 mois avant l'échéance. **1 geste.**
- Gain : oubli rendu impossible (une garantie perdue à 2 ans = plusieurs centaines à milliers de francs ; un compresseur non entretenu), 5 gestes évités. Fréquence : chaque bien, quelques fois par an. Coût : **moyen** (champ `warrantyUntil`, tableau de rythmes par type : donnée du métier à écrire une fois, marquée « proposé »). Pas d'IA nécessaire.
- Classe : **vrai gain** (rappel d'entretien) ; garantie : vrai gain si le brasseur la note dans le carnet, sinon **nice to have**. Forme : oui (où voir « garantie » sur la fiche du Parc et du Calendrier).

### AMW-8 : date de livraison attendue posée au Calendrier
- Piste 2. Constat CRW-5 : aucun état « commandé ». Le plan a une date d'achat, pas de date de réception.
- Aujourd'hui : noter dans le Calendrier « réception chambre froide » à la main (**3-4 gestes**), le plus souvent jamais. Visé : un toucher « Commandé » sur le plan → date de réception = aujourd'hui + délai de l'article (`dispo` déjà lu : « 4 semaines »), jalon posé au Calendrier, et à la réception « Reçu ? » propose AMW-5 et AMW-6.
- Gain : date juste au Calendrier pour préparer l'emplacement et l'électricien (ça se prépare 1 à 2 semaines avant), oubli évité. Fréquence : achat de matériel, rare. Donnée : `dispo` souvent textuelle (« en stock », « 2-3 semaines ») : lue ou saisie ; **non mesuré** : à vérifier sur les 15 carnets combien portent un délai chiffré.
- Coût : **moyen** (état « commandé » nouveau, analyse du délai). Classe : **nice to have** seul ; **vrai gain** s'il est le déclencheur de AMW-5/6/7 (un geste « Commandé » → toute la chaîne se prépare). À décider avec AMW-5.

### AMW-9 : doublon avec le parc ou le stock
- Piste 8. `doublons.ts` compare des notes entre elles, pas des idées contre le Parc. Visé : « Tu as déjà : Réfractomètre Brix (Parc, entretenu le 05.11) » à l'ajout d'un article de même nature.
- Gain : erreur d'achat évitée (rare, 1 fois sur 30 idées ?). Coût : **petit à moyen** (Jaccard déjà dans `doublons.ts`). Classe : **nice to have** : sans mesure de fréquence. Utile surtout pour les consommables (joints, vannes, tuyaux) vs stock ; le brasseur n'équipe pas souvent en doublon.

### AMW-10 : budget du carnet contre la caisse : « quand puis-je payer ? »
- Piste 5. **Existe déjà dans le code** : `mesurerAchat` donne « meilleur mois » (`meilleurMois`), caisse du mois d'achat, point bas ; `effetProjet` donne caisse avec/sans projet ; le bandeau « caisse fin de mois » d'À venir (8 mois) le montre. Ce qui manque est le branchement : le carnet n'affiche rien de ça au moment du choix (AMW-1 le résout) ni sur la fiche de l'article.
- Gain : **pousser l'existant** (R7) : afficher « meilleur mois : mars (caisse mini 1 200 CHF) » dans la ligne d'AMW-1 plutôt que créer une vue. Coût : **petit** (appel de fonctions existantes). Classe : **vrai gain**, fusionné dans AMW-1 (pas une idée séparée).

### AMW-11 : électricité 230/400 V, consommation, coût d'usage
- Piste 9. `analyseLocale` reconnaît déjà kW, W, « consommation » comme critère (`MOINS_MIEUX`), donc le **comparatif** existe. Ce qui manque : coût annuel d'électricité = kW × heures × tarif, et alerte « nécessite du 400 V : électricien ».
- Gain : erreur évitée réelle pour un gros appareil (installation triphasée non prévue : plusieurs centaines à milliers de CHF) ; fréquence très faible. Le coût d'usage entre dans `usureParAn` / coût du litre seulement avec heures d'utilisation (donnée non existante).
- Classe : alerte « 400 V » : **nice to have** utile (1 seule ligne, tirée de la fiche) ; coût d'usage au litre : **écarté** (donnée d'heures absente, chiffre inventé).

### AMW-12 : occasion (Ricardo, Anibis) et plusieurs vendeurs pour le même article
- Piste 6. Aujourd'hui un article = un lien = un vendeur ; la même chambre froide à deux prix est **deux articles**, dont la comparaison traite deux objets différents.
- Gain : comparer le même modèle chez plusieurs vendeurs (EUR/CHF, port) est exactement le cas d'AMW-2. Occasion : état et garantie (critère AMW-7). Coût : **moyen à gros** (nouveau modèle article → offres). Classe : **nice to have** ; à reconsidérer seulement si le brasseur le demande après AMW-2. Un « même article ? » proposé à l'ajout (comme doublons) serait la version petite.

## Liens avec les autres écrans
- **Calendrier** : reçoit déjà les plans datés et les échéances d'entretien. Manque : jalon « réception » (AMW-8), rappel de garantie (AMW-7). Rien d'autre à ajouter : tout ce qui y arrive vient de données posées ailleurs (R1).
- **Finances** : la caisse prévue dépend de la date et du prix du plan : AMW-1 évite un plan à 0 ; AMW-5 évite le double compte facture + plan ; AMW-6 prépare l'actif et l'usure (`actifLiePourProjet`) : l'actif comptable pourrait être proposé à la même confirmation (nom, prix, date, catégorie déjà connus).
- **Stock** : deux sorties (consommable vs bien). Un article du carnet qui est un consommable (joints, tuyaux) devrait aller au stock, pas au Parc : `purchaseEntry` sépare déjà `stockAction` et `equipmentAction` ; la proposition suit la catégorie du carnet (AMW-6).
- **Bord** (page d'accueil) : un rappel « 2 achats en attente de réception » ou « garantie finit dans 1 mois » est la seule place valable, mais **seulement** si AMW-7/8 existent ; sinon rien (R10, pas de gimmick).

## Récapitulatif
| # | Idée | Gestes avant → après | Fréquence (estimée) | Coût | Classe |
|---|---|---|---|---|---|
| AMW-1 | Plan daté et chiffré dès Choisir, effet caisse dit | ≈ 9 → 3 | quelques fois par an | petit | **vrai gain** |
| AMW-2 | Prix rendu CHF (EUR, port, TVA) | 6-10 hors app → 2 | chaque comparaison étrangère | moyen | **vrai gain** |
| AMW-3 | « Ce qui compte » en un toucher | 3-4 par critère → 1 | chaque carnet | petit-moyen | **vrai gain** |
| AMW-4 | « Ça entre ? » (porte, place) | 0 → 0, erreur évitée | très faible | moyen | nice to have |
| AMW-5 | Rapprochement facture → plan proposé | 15 → 1 | chaque achat de matériel | moyen | **vrai gain** |
| AMW-6 | Bien au Parc né du carnet | 4-6 → 0 | chaque bien | petit (après AMW-5) | **vrai gain** |
| AMW-7 | Rythme d'entretien et garantie posés | ≈ 6 (souvent jamais) → 1 | chaque bien | moyen | **vrai gain** |
| AMW-8 | Commandé → réception au Calendrier | 3-4 → 1 | rare | moyen | nice to have (vrai si déclencheur de 5-7) |
| AMW-9 | Doublon avec Parc ou stock | 0 | rare | petit-moyen | nice to have |
| AMW-10 | Budget carnet contre caisse | (fusionné dans AMW-1) | | petit | vrai gain (fusion) |
| AMW-11 | 230/400 V, coût d'usage | 0 | très faible | petit / gros | alerte 400 V : nice to have ; coût d'usage : écarté |
| AMW-12 | Occasion, plusieurs vendeurs | n.d. | rare | moyen-gros | nice to have |

## Écartés, avec raison
- Coût d'usage électrique au litre (AMW-11) : données d'heures absentes, chiffre inventé.
- Suivi de livraison chez le transporteur : fréquence trop basse, donnée hors app (déjà écarté en CHASSE-workflow).
- Calcul de la douane réelle (tarif, droits) : dépend de la position tarifaire, non lisible depuis un lien ; ne pas promettre. Seule la TVA import est un ordre de grandeur honnête.
- Vue unique « toute la chaîne » : refusée par lui (pe2, pe5). Les idées ci-dessus sont des mécanismes (donnée qui traverse), pas un écran.

## Chaîne cible (gestes comptés)
Estimé aujourd'hui, idée → bien au Parc avec rappel : ≈ 25 (CHASSE-workflow) + 9 (À venir) + 6 (Parc, rythme, notes) = **≈ 40 gestes, 5 ressaisies** (prix, date, vendeur, nom, rythme).
Visé avec AMW-1, 2, 5, 6, 7 : **≈ 10 gestes, 0 ressaisie** (idée, lien, choisir, « Commandé », photo de facture, « Oui, c'est l'achat », « Oui, entretien proposé »). Estimation, à jouer au doigt avant toute maquette.

## À vérifier au doigt avant maquette
1. L'EUR : `lireLien` rend-il `prixCentimes` en EUR sur une vraie boutique allemande, et que fait la comparaison ?
2. Combien des 15 carnets citent une garantie ou un délai chiffré (AMW-7, AMW-8) ?
3. Le rattachement facture → plan dans le flux de photo (pas seulement la fiche de la dépense) : est-il proposé ailleurs ?
4. AMW-2 : un prix rendu réel d'une offre allemande contre le prix affiché (écart mesuré), pour valider le gain.

## Choix de forme à montrer en mini maquettes
AMW-1 (la ligne d'effet sous Choisir), AMW-2 (ligne « rendu »), AMW-5 (bandeau « c'est l'achat de… ? »), AMW-7 (rappel et garantie sur la fiche du Parc). Le reste : sans maquette.
