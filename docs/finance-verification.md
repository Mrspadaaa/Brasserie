# Vérification de la refonte des finances

Vérification locale du 9 septembre 2026. Aucune écriture comptable ou donnée de stock réelle modifiée, aucune fonction ou règle déployée. L’essai Gemini décrit plus bas écrit uniquement son cache synthétique et sa consommation dans le compteur IA partagé.

## Résultats techniques

- Suite complète après ajout de l’archivage : **155 fichiers, 2 543 tests passants** (`npm test`).
- Application : compilation TypeScript, Vite et contrôle d’exclusion des documents privés réussis (`npm run build`). Le module de démonstration et ses données fictives sont absents des fichiers de production.
- Serveur : génération des ressources et compilation TypeScript réussies (`npm run build` dans `functions`).
- Règles : génération locale depuis le modèle, puis validation Firebase : **aucune erreur détectée**. Le validateur vérifie la syntaxe ; les accès concurrents n’ont pas été exécutés dans un émulateur Firestore, Java étant indisponible sur cette machine.
- Tests de régression : francs/centimes et dates, crédits et paiements partiels, prévisions sans double comptage, immobilisations et inventaires, clôture figée, réservations et déstockages successifs, justificatifs, scans, refus serveur et reprise après réponse perdue.
- Les simulations de session de brassage ont été adaptées à la confirmation de document désormais obligatoire. Deux scénarios supplémentaires vérifient l’attente et le refus avant le démarrage.
- Exports PDF : rapport annuel de 18 pièces fictives rendu en trois pages et inspecté ; facture de deux articles rendue sur une page et inspectée. Corrections de séparateurs et d’espacement revérifiées. Classeur XLSX contrôlé en mémoire par les tests (journal de 65 pièces, cellules numériques et références des justificatifs), sans inspection visuelle dans Excel.

Le build conserve des avertissements de taille de certains modules et d’imports Firebase à la fois statiques et dynamiques. L’export financier est chargé séparément ; une refonte générale du chargement de l’application reste en dehors de cette modification.

## Parcours vérifiés dans le navigateur

La démonstration `?dev-local&finance-demo` garde toutes les écritures en mémoire. Contrôles des quatre vues à **320, 375, 430, 768 et 1 440 pixels** : vingt combinaisons, sans débordement horizontal. Inspection visuelle complémentaire à 390 pixels ; saisies financières à 16 pixels. Budget contrôlé à 320 et 390 pixels. Taille normale du navigateur rétablie à la fin.

- Achat de matériel de 240.50 CHF : libellé et montant repris sur la ligne, récapitulatif, une seule validation et création de l’équipement.
- Achat à payer puis paiement partiel de 100 CHF : solde restant de 140.50 CHF.
- Nouvelle vérification après le contrôle atomique : achat intégralement payé confirmé et feuille refermée ; coûts augmentés exactement de 240.50 CHF.
- Budget : modification de l’énergie de 8 à 9 CHF, date choisie et estimation enregistrée ; achats prévus de 64.26 à 65.26 CHF et coût net de 7.51 à 7.55 CHF/L.
- Navigation, filtres du journal, vues de prévision et préparation annuelle vérifiés. Les tests d’intégration couvrent aussi la navigation au clavier, le rapprochement d’une facture récurrente et la conservation des chiffres d’une clôture figée.
- Aucun message d’erreur dans la console lors du dernier parcours navigateur.

## Comparaison visuelle avec le concept

| Point | Résultat vérifié et choix retenu |
| --- | --- |
| Palette | Charbon, surfaces brunes et accent doré conservés ; montants prioritaires en clair. |
| Navigation | Quatre vues Coûts, Journal, Prévoir, Annuel ; état actif visible, commandes utilisables au clavier. |
| Hiérarchie | Montant principal, ventilation puis détails ; lignes de dépenses lisibles et fournisseurs accessibles. |
| Typographie | Police de l’application conservée ; montants contrastés, formulaires à 16 px pour le mobile. |
| Actions | Boutons tactiles d’au moins 48 px dans l’espace financier. Ajout de dépense et de matériel accessible près du pouce ; espace prévu sous le contenu défilant. |
| Petits écrans | Sélecteur de mois empilé à 320 px ; budget et formulaires sans défilement horizontal. |
| Prévisions | Graphe correspondant à l’horizon choisi, légende explicite pour dépenses et solde, hypothèses consultables. |
| Dossier annuel | Résultat, inventaire, amortissements et points à vérifier restent distincts ; export et versions figées accessibles. |

Écarts intentionnels au concept : en-tête et marque existants conservés ; ajout rapide placé dans une barre basse pour le téléphone ; montants alimentés par les données plutôt que par les chiffres du concept. Les détails annuels et hypothèses de budget demandent davantage de défilement afin de rester lisibles et vérifiables.

## Complément : archivage par exercice

L’archivage et sa réintégration ont été exécutés dans la démonstration en mémoire. Une année de deux pièces comprend une facture payée et une facture encore ouverte : toutes deux restent consultables dans Archives, et l’impayée reste visible dans le suivi courant. La recherche globale ne retrouve la pièce payée archivée qu’après activation de son option explicite et ouvre sa fiche exacte.

Les tests couvrent aussi la reprise après confirmation incertaine, l’audit lié au classement, la sauvegarde/restauration des métadonnées, la pagination de 123 pièces, la recherche au-delà des 200 premières entrées, les pièces homonymes, les nouvelles écritures antidatées et la stabilité des calculs. Exemple de continuité : solde de 960 CHF, dette de 60 CHF, coût d’ingrédients de 12 CHF et achats manquants de 6 CHF inchangés après archivage. Un avoir de l’année suivante reste relié à son achat d’origine.

Affichage des archives contrôlé à 320, 375, 390, 430, 768 et 1 440 pixels, sans débordement horizontal ; gestionnaire inspecté à 320 et 390 pixels. Saisies visibles à 16 px. Filtres secondaires repliés et barre d’ajout masquée pendant la consultation des archives. Console sans erreur ni avertissement lors du dernier contrôle. Taille du navigateur rétablie ensuite.

L’archivage est un classement synchronisé et réversible. Il ne réduit pas le registre chargé dans le cache et ne modifie pas les limites existantes de sauvegarde. Les calculs qui nécessitent toutes les années conservent cette garantie. Validation des règles Firebase et compilations application/serveur réussies ; aucun déploiement et aucun classement de données réelles.

## Dernière passe : contexte Gemini, calculs et ergonomie

La suite complète a passé **159 fichiers et 2 616 tests**. Après les derniers ajustements de saisie et de présentation, **32 tests d’intégration financiers** et **46 tests d’intégration de contexte/relecture** ont été revérifiés sans réseau payant. Les compilations finales application et Functions passent. Les avertissements de taille des modules déjà décrits subsistent.

Gemini reçoit un résumé financier borné et sourcé, construit avec les calculs de l’application ; la relecture reçoit les mêmes consignes. Les contrôles couvrent les archives, les registres incomplets, les données inconnues, les rapports figés et la simulation de matériel avec hypothèses explicites. Le conseil financier réel n’a pas fait l’objet d’une génération dans cette passe ; seul le scan synthétique ci-dessous a utilisé Gemini.

Corrections vérifiées : relecture descriptive distincte d’une ambiguïté, amortissement inconnu non assimilé à zéro, année du brassin utilisée, origine manuelle d’un prix modifié, quantités d’eau et d’ajouts ajustées avec le volume, identité source conservée jusqu’à la création du brassin. L’estimation de douze mois inclut son dernier mois partiel ; écran, contexte et graphique utilisent la même fin exclusive. Une trésorerie incomplète ne produit plus de courbe de solde certaine.

Contrôles navigateur finaux : les quatre vues à 320, 375, 430, 768 et 1 440 px n’ont pas de débordement horizontal. Le budget a été contrôlé à 320, 390, 430, 768 et 1 440 px, avec saisies visibles à 16 px. L’assistant a aussi été contrôlé à cinq largeurs, sans envoi de question. Sa lecture d’historique refuse normalement la session de démonstration non authentifiée.

Le parcours matériel atteint le récapitulatif à partir du montant et du libellé, sans créer de transaction. Les liens facultatifs vers les prévisions sont repliés et les champs nommés. Les raccourcis Gemini préparent une question portant la période choisie, restent accessibles dans les conversations utilisées et ne génèrent rien à l’ouverture.

Sur le budget, le passage **30 L brassés / 27 L nets → 60 L / 54 L** conserve le rendement ; un zéro reste affiché comme zéro après sortie du champ et bloque Enregistrer/Prévoir. Les frais manuels restent inchangés avec un rappel de vérification après changement de volume ; l’estimation manuelle d’impôt est identifiée comme telle. Les détails de prix et charges annuelles sont repliés. Aucune nouvelle erreur console après le rechargement final ; les erreurs HMR temporaires liées à l’ajout du helper sont résolues. La taille normale du navigateur a été rétablie.

## Budget de test IA

Les contrôles locaux, les réponses simulées, le cache et les limites serveur restent dans la suite automatique. Les essais facturables sont séparés et exigent une exécution volontaire.

Le script réel utilise désormais un seul justificatif synthétique de matériel et réparation, deux requêtes maximum et 2 048 jetons de sortie par requête, puis contrôle le cache sans nouvelle génération. Il traverse le handler local, le budget partagé de l’application et le fournisseur réel. Il ne teste pas le transport HTTPS publié ni l’authentification Firebase du navigateur. Les jetons temporaires sont fournis en mémoire, les plafonds et la pause restent inchangés.

La [procédure](expense-scan-evaluation.md) décrit les garde-fous ; le [rapport JSON](expense-scan-evaluation.json) est la référence pour le statut réel, les requêtes, la consommation déclarée et les assertions. Un préflight ou un résultat uniquement issu du cache ne constitue pas une nouvelle mesure de qualité du fournisseur.

L’essai réel du 9 septembre 2026 a consommé deux appels et 1 802 jetons sur `gemini-3.5-flash-lite`. Quatorze assertions sur quinze ont réussi. Le contrôle restant a révélé un faux positif de comparaison : une note descriptive affirmative déclenchait un désaccord malgré des champs identiques. Le comparateur et le schéma de relecture ont été corrigés, puis vérifiés par des tests d’intégration sans réseau. Aucun appel payant supplémentaire n’a été effectué pour cette correction ; le rapport réel reste `failed` et son cache est inchangé.

## Préparation fiscale Fribourg — 9 septembre 2026

La suite complète passe : **164 fichiers, 2 672 tests**, sans génération IA. Les compilations de l’application et des Functions passent aussi. Les tests fiscaux couvrent notamment les corrections déjà comptabilisées, les pertes, les paiements à cheval sur deux années, les découverts bancaires, les contrôles devenus périmés, la confirmation explicite de la fortune et les originaux conservés lors du gel d’une version.

Le dossier ZIP est vérifié par des tests d’intégration : octets des originaux conservés, empreintes SHA-256, noms de fichiers sûrs, anciens justificatifs, fichiers absents ou invalides, reprise par volumes et annulation. L’archive ne certifie ni la lisibilité ni l’admissibilité fiscale des pièces.

Parcours navigateur effectué sur les données fictives de `?dev-local&finance-demo`, à 320, 390 et 1 440 px : préparation, report, choix de l’activité accessoire, ajout d’un PDF, aperçu, enregistrement et réouverture. Aucun débordement horizontal observé ni nouvelle erreur console. L’export affiche bien les pièces manquantes du jeu de démonstration. L’événement de téléchargement du navigateur intégré n’a pas été reçu par l’outil : la sauvegarde locale du ZIP n’est donc pas confirmée par cet essai UI ; son contenu et son intégrité sont contrôlés par les tests d’intégration.

Le PDF d’exemple a été généré et ses quatre pages rendues puis inspectées visuellement. La section FriTax commence sur une nouvelle page ; les tableaux, en-têtes répétés, montants et signatures restent lisibles.

Les codes vérifiés concernent les instructions officielles **2025** : revenu principal 1.210, accessoire 1.220 et fortune mobilière 3.570. Le montant de fortune doit venir de l’annexe 05 remplie et confirmée ; il n’est pas remplacé par le patrimoine net comptable. Les autres années restent préparatoires jusqu’à vérification de leurs instructions. Les annexes officielles et la déclaration personnelle ne sont pas remplies automatiquement. Aucun déploiement ni modification de données réelles durant cette passe.

## Vérification du stockage et de l’intégration Gemini

Relecture du parcours complet d’achat, du cache persistant, de la confirmation serveur, du contexte financier et du budget de scan. **105 tests ciblés passent** sur huit fichiers, sans appel payant : originaux, confirmation d’écriture, achats, relecture IA, budget de scan, contexte financier, archive fiscale et sauvegarde serveur. Cela ne constitue pas un essai de bout en bout du site déployé.

La configuration d’hébergement autorise désormais les aperçus PDF `blob:` dans `frame-src`, en conservant `object-src 'none'` et les autres restrictions. Les champs `financeDocuments.data`, `financialClosings.report` et `financialClosings.tax`, jamais utilisés comme filtres de recherche, sont exclus des index automatiques. Syntaxe JSON et cohérence de ces paramètres vérifiées ; hébergement et index non déployés. Références : [CSP frame-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-src), [exceptions d’index Firestore](https://firebase.google.com/docs/firestore/best-practices).

Limite identifiée lors de cette vérification, résolue dans la passe suivante : l’ancien export et la restauration globale JSON étaient plafonnés à 8 Mo. Le ZIP fiscal par volumes ne remplace pas une sauvegarde intégrale restaurable. Aucun contrôle des sauvegardes automatiques configurées dans le projet distant n’a été réalisé.

## Sauvegardes durables et originaux — 9 septembre 2026

La sauvegarde globale utilise désormais des volumes ZIP d’environ 32 Mo, avec des pages serveur de 3 Mo maximum, un instantané cohérent et une vérification SHA-256. L’import exige tous les volumes et vérifie les références et les originaux avant toute restauration métier. Les justificatifs et leurs blocs sont restaurés atomiquement ; un original existant différent bloque la restauration. Les stocks, réservations, fûts et brassins déjà engagés sont préservés dans une base existante. Les anciens fichiers JSON restent acceptés. Les sessions temporaires expirent et sont nettoyées côté serveur.

La suite complète a passé **169 fichiers et 2 711 tests**, sans appel IA. Après l’ajout du contrôle de collision d’originaux, les **36 tests serveur de sauvegarde** passent également. Compilations application/Functions et contrôles règles, unités, brassage, eau, prompts et absence de code de développement dans le bundle réussis.

Les **13 tests d’intégration du transfert** passent après la dernière correction de reprise. Une expiration confirmée libère la session locale pour une nouvelle restauration volontaire ; un simple délai réseau conserve son identité afin de reprendre sans doublon. La compilation finale de l’interface passe.

Deux contrôles réels ont été exécutés avec les émulateurs Auth/Firestore et les SDK Firebase, sur un projet de démonstration isolé. Le premier confirme l’enregistrement et la relecture de trois PDF synthétiques de 3,8 Mo chacun, l’absence de doublons au réessai, le refus des remplacements/suppressions et les protections des dossiers figés. Le second exerce le handler de transfert : **496 documents, 15 263 366 octets, 10 pages**, puis restauration complète avec comparaison des 496 documents et des trois PDF octet pour octet. Aucune écriture métier avant validation complète ; réessais sans doublon. Les émulateurs sont arrêtés après les contrôles. Aucun document réel modifié et aucune génération IA pendant ces tests.

Interface Sauvegardes vérifiée dans le navigateur à 320×740, 390×844 et 1 440×900 : lisibilité, navigation et absence de débordement ou d’erreur console. La sélection du ZIP synthétique est restée bloquée dans l’outil navigateur ; la validation complète de cet import n’a donc pas été observée par ce parcours UI. Le contenu et la restauration sont couverts par les contrôles ci-dessus. Le viewport a été rétabli.

**Publication réussie** via `npm run deploy`, dans l’ordre règles/index, Functions et Hosting. Le JavaScript téléchargé sur le site correspond octet pour octet au build local. Les en-têtes autorisent les aperçus PDF `blob:` et interdisent les objets intégrés. `transferBreweryData` et `aiTask` refusent les requêtes sans authentification avec HTTP 401. L’écran de connexion publié charge sans erreur console. Aucun parcours utilisateur authentifié de production et aucune restauration dans la base réelle n’ont été exécutés.

**Gemini réel : 15/15 contrôles réussis**, avec une nouvelle facture fictive de hotte et réparation, après publication. Deux générations, **1 945 jetons**, puis cache sans nouvelle génération. Le [rapport distinct v4](expense-scan-evaluation-v4.json) conserve les assertions et la consommation ; le rapport historique reste inchangé. Le test traverse le handler compilé avec le budget Firestore et le fournisseur réels, sans créer d’achat ni d’original dans la comptabilité. Aucun test de conseil financier supplémentaire.

Contrôle des métadonnées distantes après publication : Firestore Native/Standard à Zurich (`europe-west6`), protection contre suppression activée et récupération à un instant donné activée avec une conservation configurée de **604 800 secondes (7 jours)**. Les deux nouvelles Functions sont actives ; le nettoyage quotidien est activé dans le fuseau Europe/Zurich. Les quatre exemptions d’index attendues sont présentes. Ce contrôle n’a lu aucune facture et n’a déclenché aucune fonction. La récupération Firestore sur sept jours complète la copie ZIP volontaire ; elle ne constitue pas une archive indépendante de longue durée.
