# Vérification mobile, dépenses et Drive — 9 septembre 2026

## Résultat

- Vues principales allégées : tableau de bord, production, finances, stocks et clients. Navigation mobile compacte ; recherche, filtres et détails secondaires s’ouvrent à la demande. Les filtres actifs restent signalés.
- À 390 × 844 px, la première recette commence à 173 px : quatre cartes complètes et le début de la cinquième sont visibles. Les vues consultées à 320 × 740 px n’ont pas de débordement horizontal.
- Contrôle des sous-vues : journal, coûts, prévisions, projets, annuel, matériel, courses, fûts, houblons et leurs sections, impôt sur la bière, tarifs, atelier et adaptation de volumes. Les écrans secondaires sans données dans le banc ont été vérifiés à vide ; les listes principales ont des exemples représentatifs.
- Ajout de dépense : photo/fichier → lecture automatique → informations essentielles modifiables → un bouton de confirmation. Pas d’achat, de mouvement de stock ou de fiche matériel créé avant cette confirmation. Les doutes de lecture restent visibles, y compris lorsque Drive se reconnecte automatiquement.
- La navigation revient sur le sous-onglet de production choisi, y compris après rechargement. Les raccourcis du tableau de bord peuvent toujours cibler les brassins.

## Vérifications

Suite complète : **3 171 tests réussis**. Après les derniers ajustements de reprise de facture et deux nouveaux cas, la sélection concernée passe avec **42 tests réussis**. Compilation TypeScript, build de production, contrôle d’absence des accès locaux de test : réussis. Aucun appel Gemini payant pendant cette passe.

Contrôle visuel dans le navigateur de l’application, avec dépôt isolé et facture synthétique : import réel par le sélecteur de fichiers, lecture simulée, affichage du total/règlement/confirmation ; lecture des détails et filtres ; restauration de la navigation ; affichage ordinateur à 1280 × 900 px. Aucune erreur console observée dans la vérification finale. Les factures et données de production ne sont pas modifiées par le banc.

Les captures sont conservées dans le dossier de visualisation du 9 septembre, sous `mobile-review`, notamment `recettes-390.png`, `depense-depart-320.png`, `depense-lecture-320.png`, `brassins-desktop.png` et les contrôles des autres vues.

## Drive et publication

`driveAuthorization` est déployée dans `europe-west6`. Sa configuration publique répond HTTP 200 ; une récupération de jeton sans session répond HTTP 401. Le secret serveur réutilise le client Google Firebase existant. Les autorisations de renouvellement sont chiffrées et absentes des exports métier. Aucun original supplémentaire n’est stocké dans Firestore par ce mécanisme.

L’échange de code Google, le contrôle d’identité, le renouvellement après expiration/401 et les erreurs de révocation sont vérifiés avec des réponses contrôlées. Le consentement du compte réel et le statut de publication Google nécessitent une connexion interactive ; voir [connexion Drive](../drive-connexion.md). Une première autorisation est nécessaire pour les sessions datant d’avant cette mise à jour.

La version frontend est publiée sur `https://brasserie-l-affinee.web.app/`. Le bouton de connexion Google charge ses dépendances et s’active sans erreur console. La fenêtre OAuth n’est pas exposée par le navigateur de vérification : la fin du consentement réel n’a pas été certifiée. La console Google Auth Platform exige aussi une connexion interactive ; son statut Audience reste à contrôler.
