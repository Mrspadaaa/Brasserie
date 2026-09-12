# Finances de la brasserie

Le parcours est organisé autour de quatre vues : **Coûts**, **Journal**, **Prévoir** et **Annuel**. Les montants historiques sont conservés. Les nouvelles écritures utilisent des centimes entiers en CHF.

## Au quotidien

- **Ajouter une dépense** reste accessible au bas des vues Coûts et Journal. Un achat simple demande un montant, un libellé et son règlement. Le détail de la première ligne suit ces champs.
- **Matériel** prépare en plus la fiche de l’équipement, créée lors de la même validation. Une réparation se rattache au matériel existant. Dans Stocks, **Matériel déjà possédé** ajoute une fiche sans inventer une nouvelle dépense.
- Un justificatif peut être conservé sans lecture IA. Le bouton de lecture remplit un brouillon ; quantités, unités, montants, nature des lignes et doublons sont vérifiés avant la validation finale.
- Dans le Journal, noter les paiements réellement effectués, y compris les acomptes. Un paiement ancien sans date reste à confirmer.
- Un avoir peut réduire la facture restant à payer ou représenter un remboursement d’argent. Les apports et prélèvements privés affectent la trésorerie, sans devenir des ventes ou des frais.
- Une annulation conserve l’écriture, la pièce et ses mouvements. Un stock déjà consommé ne revient pas artificiellement en arrière.

## Conservation des factures

Dans le nouveau parcours d’achat, joindre un fichier prépare seulement le brouillon. **Enregistrer l’achat** écrit ensemble la transaction, les éventuels mouvements et paiements, et l’original dans Firestore. La fermeture du formulaire attend la confirmation de cette transaction par le serveur. Sans réseau, l’écriture peut rester en attente dans le cache persistant du navigateur ; ce statut n’est pas une confirmation serveur.

Les PDF et images, jusqu’à 4 Mo, sont encodés sans compression en base64 puis découpés en blocs de 400 000 caractères dans `financeDocuments`. La transaction contient leur référence, leur nom et leur type. Les règles prévues autorisent les comptes de la brasserie à créer et lire ces documents, mais pas à les remplacer ou les supprimer. Les originaux sont chargés à l’ouverture du justificatif. Le contenu des blocs et les gros états de clôture sont exclus des index automatiques ; aucune recherche ne porte sur ces champs.

La lecture IA est facultative : elle envoie le document à Gemini et remplit un brouillon. Les montants extraits et le cache d’analyse ne remplacent pas le fichier original. Une conversation de conseil reçoit un résumé financier, pas tous les PDF. Les anciennes écritures peuvent encore contenir leur justificatif directement dans `proofUrl`, ou un lien externe ; leur compatibilité ne garantit pas qu’un fichier externe reste disponible.

Dans **Paramètres → Sauvegardes**, la nouvelle copie complète utilise des ZIP d’environ **32 Mo par volume**, sans plafond global de 8 Mo. Les pages serveur restent petites et proviennent du même instant Firestore. Après avoir enregistré un volume sur l’appareil, préparer le suivant ; conserver tous les volumes ensemble. La copie serveur expire après 45 minutes : si nécessaire, recommencer une copie complète sans mélanger ses volumes avec les précédents. Les fichiers externes sont signalés ; leurs liens ne deviennent pas des originaux embarqués.

Pour restaurer, sélectionner **tous les ZIP de cette copie**. L’application vérifie l’ordre, les empreintes de chaque page, les références et les blocs des originaux avant d’afficher le résumé et le bouton final de restauration. Le serveur effectue ensuite ses propres contrôles avant toute modification métier. Chaque original et ses blocs, chaque facture et ses règlements, sont appliqués ensemble. Une interruption se reprend avec les mêmes fichiers, sans rejouer les groupes déjà confirmés. Le transfert temporaire reste disponible sept jours puis est nettoyé ; les factures enregistrées ne sont pas concernées par ce nettoyage.

Sur une base existante, la restauration préserve les stocks, produits finis, réservations et fûts actuels, ainsi que les brassins ayant des relevés ou consommations. Cela évite de recréer du stock consommé. Les registres immuables, paiements et clôtures figées restent protégés ; les autres fiches modifiables reprennent la version du fichier. Sur une base vide, toutes les fiches de la sauvegarde sont récupérées. Le résumé rappelle cette différence avant confirmation.

Les anciens fichiers JSON restent importables. L’ancien endpoint conserve ses limites pour compatibilité avec les versions précédentes ; l’interface utilise désormais le transfert par pages et volumes. Les limites particulières sont contrôlées avant restauration : 950 000 octets par fiche, et au plus 400 règlements sur une même facture dans un groupe atomique de 7 Mo maximum. Le dossier fiscal ZIP reste distinct de cette sauvegarde restaurable de toute l’application. La synchronisation et le nettoyage des transferts ne constituent pas une sauvegarde indépendante automatique : l’utilisateur doit enregistrer et conserver ses volumes.

## Ranger les anciennes années

Dans **Journal → Gérer les archives**, choisir une année terminée. Le récapitulatif indique les pièces à classer, les factures encore ouvertes et les règlements historiques à confirmer. Une seule confirmation classe l’exercice ; **Réintégrer** le remet dans le journal courant.

Le journal propose trois périmètres : **Courantes**, **Archives** et **Tout**. Les archives se consultent par année. La recherche porte sur toutes les pièces du périmètre avant l’affichage de pages de 50 opérations : aucun résultat n’est perdu derrière une limite des « dernières opérations ». Les filtres de catégorie et d’annulation sont regroupés dans **Plus de filtres**.

Les factures anciennes impayées restent dans le suivi courant. **À payer** et **À compléter** dans Courantes examinent tous les exercices, archives comprises. Archiver ne signifie jamais payer ni corriger une écriture. Une date invalide reste à traiter ; une nouvelle écriture antidatée, enregistrée après le classement, reste courante jusqu’au prochain archivage de l’année.

La recherche globale masque les pièces archivées par défaut. Cocher **Inclure les archives** pour les retrouver et ouvrir directement leur fiche. Les analyses de coûts sur une période choisie, le solde, les prix historiques d’ingrédients, les amortissements et les rapports annuels conservent l’historique complet. L’archivage est distinct d’une version annuelle figée.

Ce classement est enregistré séparément des écritures et accompagné d’un événement d’audit. Il se synchronise entre appareils et fait partie des sauvegardes complètes. Aucun justificatif, paiement ou montant n’est supprimé, déplacé ou réécrit. Il n’existe aucune purge automatique.

L’allègement porte sur les vues et le nombre de lignes rendues. Le registre complet reste chargé par l’application pour les calculs ; cet archivage ne constitue pas une pagination des lectures Firestore. Les justificatifs originaux sont déjà chargés individuellement. Une évolution du chargement devra conserver un accès complet explicite aux années et aux liens utilisés par les calculs.

## Préparer les prochains brassins

Le budget est accessible depuis une recette, un brassin ou Finances. Il distingue la valeur des ingrédients utilisés, les achats supplémentaires et le coût par litre conditionné. Les prix indiquent leur origine ; les conversions, réservations des brassins précédents et conditionnements d’achat entrent dans le calcul.

Les frais du brassin, les charges fixes et l’amortissement sont activés par défaut et restent réglables. Le temps personnel du propriétaire est exclu. Une charge déjà payée avec une facture récurrente peut être signalée pour éviter un deuxième décaissement. Les charges fixes annuelles excluent les frais déjà estimés par brassin.

Une estimation incomplète se conserve en brouillon. Une estimation complète peut devenir une prévision. Lorsqu’un budget de recette correspond à un brassin créé ensuite, le rapprochement est explicite.

La planification réserve les besoins ; elle ne déstocke pas. Les consommations sont confirmées au brassage puis pour les ajouts de fermentation. Les anciens brassins dont le déstockage est incertain demandent une vérification explicite.

## Trésorerie et prévisions

Renseigner dans **Mes repères financiers** le solde disponible au début d’une journée, avant ses paiements, et le début de l’historique complet. La prévision réunit factures restant à régler, charges récurrentes, achats de brassins et entrées d’argent saisies explicitement.

La tendance des dépenses courantes utilise la médiane de six mois complets au maximum, avec trois mois au minimum. Les engagements connus et les investissements sont distingués. Les ventes futures ne sont pas extrapolées automatiquement.

Relier une facture à la bonne échéance de sa prévision. Pour une facture mixte, préciser dans son détail le montant qui remplace cette prévision.

## Projets de matériel

**Finances → Projets** et **R&D → Matériel** ouvrent le même suivi. Le matériel en stock propose aussi **Préparer mes futurs équipements**. Les anciennes idées de matériel sont reprises avec leurs notes ; elles restent exclues des prévisions jusqu’à leur inclusion explicite. Les anciennes idées terminées apparaissent dans les projets réalisés.

Classer un besoin dans **Bientôt**, **Ensuite** ou **Plus tard** : une hotte, un fermenteur supplémentaire, un nouveau système de brassage. Le prix et la date peuvent rester vides. Le budget TTC réunit le prix, la livraison et l’installation chiffrés ; les devis et notes sont facultatifs et repliés. Un prix et un mois de paiement sont nécessaires pour cocher **Inclure dans mes prévisions**. La simulation positionne ce paiement au début du mois ; l’échéance de la facture prime ensuite.

**Prévoir** permet de comparer temporairement avec ou sans les projets retenus, sur la fenêtre choisie. La case de chaque projet modifie durablement son inclusion. Les analyses montrent les budgets retenus et les factures depuis le début du projet, séparément des dépenses de la période. Un projet plus lointain reste dans cette vue même s’il sort des douze mois de prévision.

**Noter l’achat** prépare le lien au projet et la fiche matériel, puis demande le véritable montant de la facture. La facture remplace la part correspondante du budget ; un acompte payé ne solde pas automatiquement le reste. Les factures mixtes demandent une affectation explicite dans le journal. Le suivi distingue facturé, payé et estimation encore non facturée.

**Archiver ce projet** le range sans le supprimer ; **Reprendre ce projet** le remet dans les idées exclues. **Marquer comme réalisé** arrête également le budget futur. Dans tous les cas, factures, paiements, avoirs et documents comptables restent conservés. Une intention seule ne crée ni dépense, ni matériel acquis, ni amortissement. Gemini reçoit les mêmes projets, leurs limites et les deux scénarios de prévision, sans nouvel appel automatique.

## Dossier annuel

Le dossier vise une raison individuelle à Fribourg en comptabilité simplifiée, sans TVA. Il réunit compte d’exploitation, flux d’argent, créances et dettes suivies, inventaires, amortissements, mouvements privés, références des justificatifs et éléments à vérifier.

Vérifier les inventaires d’ouverture et de clôture : matières premières, emballages, bière en cours et bière conditionnée. Le stock actuel ne remplace pas automatiquement celui du 31 décembre. Confirmer le traitement du petit matériel ou l’immobilisation ; pour les biens anciens, renseigner une valeur d’ouverture vérifiée. Les cessions et avoirs liés au matériel doivent être rapprochés.

Le parcours **Finances → Annuel** comporte trois étapes : **Préparer**, **Reporter**, **Dossier**. Le choix activité principale/accessoire, six contrôles adaptés au brasseur, les soldes de fin d’année et les corrections fiscales sont enregistrés avec la clôture. Une modification des comptes invalide les contrôles précédents. Le rapprochement compare banque et caisse avec la trésorerie du journal ; il ne crée aucune écriture pour masquer un écart. Un découvert bancaire est présenté dans les dettes. Les créances et dettes détaillent les tiers ouverts au 31 décembre, même si leur règlement survient l’année suivante.

Les corrections distinguent **Déjà pris en compte**, **Ajouter** et **Déduire**. Elles expliquent le passage du résultat comptable au revenu préparé, sans modifier le journal ni déduire deux fois un ajustement déjà intégré. Les cotisations sociales, prélèvements de bière et parts privées restent à documenter. Un projet de hotte ou de fermenteur n’entre jamais dans le résultat fiscal avant sa comptabilisation réelle.

Les rubriques vérifiées au 9 septembre 2026 sont celles des [instructions Fribourg 2025](https://www.fr.ch/media/57721), pages 8–9 et 22 : **1.210** (activité indépendante principale), **1.220** (accessoire), **3.570** (fortune mobilière de l’exploitation). Aucun code n’est automatiquement reconduit pour une autre année. Le montant de fortune doit être confirmé depuis l’annexe 05 avec une provenance ; le patrimoine net comptable ne le remplace pas, pour éviter de déclarer deux fois banques, titres ou dettes. Le système fournit les données de travail des annexes, mais ne remplit pas chaque ligne du formulaire officiel et ne calcule pas l’impôt personnel final.

**Télécharger le dossier avec justificatifs** fournit un ZIP : comptes PDF, classeur Excel, copie du rapport, originaux et index CSV/JSON avec taille et empreinte SHA-256. Les factures des années précédentes encore utiles au matériel ou aux soldes ouverts sont incluses. Pour un matériel sans facture liée, joindre un justificatif de coût ou de valeur de reprise en choisissant **Matériel ou valeur de reprise**. Les relevés bancaires, décomptes sociaux, inventaires signés et annexes remplies se joignent sans IA dans **Pièces complémentaires** et peuvent être consultés avant sauvegarde.

La récupération et la signature du format des fichiers sont contrôlées, pas leur lisibilité ni leur admissibilité fiscale. Les fichiers absents, corrompus, anciens originaux non figés et liens externes non téléchargés sont listés explicitement. Un dossier volumineux s’arrête après environ 64 Mo d’originaux par volume, puis propose de télécharger la suite sans omission. Tous les volumes sont nécessaires. Extraire le ZIP avant de joindre les pièces demandées dans FriTax ; la [FAQ officielle](https://www.fr.ch/impots/personnes-physiques/fritax/fritax-faq) indique 3 Mo par pièce transmise et une conservation en principe pendant dix ans. L’app accepte des originaux jusqu’à 4 Mo et ne les dégrade pas automatiquement.

Les brouillons restent modifiables. **Figer cette version** conserve le rapport, les corrections et les références des justificatifs indépendamment des changements ultérieurs. Les anciens originaux intégrés aux transactions sont copiés dans la collection documentaire immuable avant de figer leurs références ; les transactions restent intactes. Une ancienne clôture dépourvue de ces références exige une nouvelle version pour joindre ses fichiers actuels. Une sauvegarde confirmée depuis le serveur comprend les documents, contrairement à une simple copie du cache local.

Le dossier prépare la déclaration ; ses pièces et comptes restent à vérifier et signer. Références : [activité indépendante — Fribourg](https://www.fr.ch/impots/personnes-physiques/activite-independante), [notice AFC sur les amortissements](https://www.estv.admin.ch/dam/fr/sd-web/Qyxr5xBfdWDp/dbst-mb-a-1995-geschbetriebe-fr.pdf). L’impôt sur la bière affiché est une réserve estimative, distincte des sorties fiscales à déclarer à l’OFDF.

## Comprendre, prévoir et décider avec Gemini

Dans chaque vue des finances, le bouton d’aide prépare une question liée à la période, à l’horizon ou à l’exercice choisi. La question reste modifiable ; seule l’action **Envoyer** lance l’analyse. Les suggestions pour comprendre les dépenses, examiner les paiements, comparer un achat de matériel et préparer l’année restent disponibles dans les conversations déjà utilisées.

Gemini reçoit un résumé calculé avec les mêmes fonctions que l’application : dépenses et paiements distincts, dettes et créances, prévisions, budgets de brassins, prix documentés, matériel, amortissements et contrôles annuels. Les écritures archivées participent aux calculs. Les références des opérations et les limites de lecture accompagnent les chiffres ; les justificatifs complets ne sont pas transmis dans cette conversation.

Pour le matériel, un outil de calcul compare le coût TTC initial (achat, livraison, installation) aux économies annuelles et aux frais supplémentaires explicitement renseignés. Il calcule le retour simple, sans valoriser le temps du propriétaire ni inventer des ventes. Les hypothèses absentes doivent être demandées. L’impact immédiat sur le solde ne tient pas lieu de capacité de financement : les échéances futures restent à examiner.

Les corrections proposées n’écrivent pas dans les comptes. Les données incertaines, le montant des impôts personnels et les périodes absentes ne sont pas devinés. Le contexte annuel couvre l’année courante et la précédente ; les dépenses mensuelles couvrent douze mois. Le résumé est limité à 18 000 octets, avec une lecture plafonnée à 1 500 opérations et 3 000 paiements : si ces limites sont atteintes, l’analyse le signale et ne présente pas de solde complet.

## Lecture IA et vérification technique

La lecture des justificatifs partage les limites et la pause IA de l’application. Un document identique réutilise son résultat. Un scan utilise au plus deux générations : lecture, puis contrôle indépendant lorsque le matériel ou une ambiguïté le justifie. Les contrôles arithmétiques restent locaux et systématiques. Aucun modèle de secours ni recherche web n’est déclenché par le scan.

Formats acceptés : JPEG, PNG, WebP ou PDF, jusqu’à 4 Mo. Le contrôle serveur accepte les PDF dont il peut vérifier au plus quatre pages ; lorsqu’un PDF compressé ne permet pas ce contrôle, l’interface propose une image ou une saisie manuelle.

L’évaluation réelle est séparée des tests courants : `scripts/eval-expense-scan.mjs` traite un document synthétique avec deux générations maximum, 2 048 jetons de sortie par génération, puis vérifie le cache sans nouvel appel. Elle traverse le handler local, le budget partagé et Gemini, sans relance automatique. La [procédure](expense-scan-evaluation.md) précise les prérequis et la portée ; le [rapport d’exécution](expense-scan-evaluation.json) donne les appels et jetons effectivement observés.

La démonstration locale est disponible en développement avec `?dev-local&finance-demo`. Elle utilise des données fictives en mémoire et est éliminée de la compilation de production.
