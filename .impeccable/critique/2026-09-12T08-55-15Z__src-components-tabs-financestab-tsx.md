---
target: Revue frontend UX finances
total_score: 20
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 4
target_identity: "file:C:\\Users\\mrspa\\Documents\\Brasserie\\src\\components\\tabs\\FinancesTab.tsx"
target_fingerprint: "sha256:d94add6c5f9fad41993b6820d59b6247615ab5298612c9093b2e58f72fed8227"
target_path: "C:\\Users\\mrspa\\Documents\\Brasserie\\src\\components\\tabs\\FinancesTab.tsx"
timestamp: 2026-09-12T08-55-15Z
slug: src-components-tabs-financestab-tsx
---
# Revue UX des finances — L’Affinée

Method: dual-agent (A: /root/finance_ux_a · B: /root/finance_ux_b), avec vérification indépendante du parent dans le navigateur. 12 septembre 2026. Mode Operate. Références : AGENTS.md, PRODUCT.md, DESIGN.md et docs/ui-compacte.md. Audit uniquement, aucun code applicatif modifié et aucune opération financière valide enregistrée.

Rectificatif du 12 septembre, après transmission des nouvelles consignes communes : la densité utile sur mobile et la nouvelle échelle compacte remplacent les anciens minima. Les observations de parcours et les captures restent valables ; les appréciations de taille ci-dessous ont été corrigées. Ce rectificatif documentaire n'est ni une modification de l'interface ni une nouvelle campagne de tests.

Le manque de clarté vient surtout de l’organisation et des parcours : les écrans demandent au brasseur de comprendre les modules avant de répondre à « combien j’ai, combien je dois payer et que dois-je faire maintenant ? ». L’identité charbon chaud et le vocabulaire métier conviennent à L’Affinée. Le travail prioritaire consiste à rendre les réponses et les actions visibles au bon endroit.

## Cinq priorités

1. **P1 — Il manque une vue de situation financière.** Une première ouverture affiche Journal sur téléphone et Coûts sur ordinateur. La trésorerie est dans Prévoir, repliée sur téléphone. L’entrée devrait montrer le solde connu ou son état incomplet, les montants à payer et à encaisser, puis les prochaines actions. Références : src/components/tabs/FinancesTab.tsx:52 et :138.
2. **P1 — Une prévision incomplète paraît trop rassurante.** Dans les données locales initiales, le premier plan affiche 0 CHF et « Aucune échéance prévue ». Plus bas, le bloc replié explique que 32 paiements historiques sont exclus et que le solde manque. Afficher « Prévision incomplète » dans le bloc principal, distinguer engagements renseignés et estimation totale, avec les boutons qui permettent de compléter les données. Références : FinancesTab.tsx:138, :142, :145 ; captures A 08 et 09.
3. **P1 — Le journal fait perdre le contexte.** Recherche, état, archives et période sont superposés ; le mois se trouve à deux niveaux d'ouverture sur téléphone. « Tout », « Toutes » et « Toutes les dates » désignent des filtres différents. Un aller-retour par Coûts réinitialise réellement le filtre À payer : les deux opérations filtrées redeviennent sept opérations dans le jeu fictif. Garder période et filtres actifs visibles dans une barre compacte, rendre la recherche accessible en un geste, préserver les filtres entre vues et proposer « Voir toutes les opérations » dans l'état vide. Références : src/ui/finance/TransactionJournal.tsx:35, :98, :115 ; FinancesTab.tsx:135.
4. **P1 — Les boutons ne mènent pas directement à l’action annoncée.** « Enregistrer une vente » ouvre le menu général. « Dépense Express (sans justificatif) » demande ensuite de choisir encore « Saisir sans justificatif ». Les cartes de saisie manuelle et vente ne sont pas accessibles par Tab ; le menu laisse le focus hors du dialogue. Ouvrir directement le bon formulaire, proposer une seule fois Photo/Fichier/Manuel et utiliser des boutons avec une gestion correcte du focus. Références : src/components/QuickActionModal.tsx:544, :653, :694 ; src/ui/finance/ExpenseSheet.tsx:40 ; src/ui/ModalShell.tsx:98.
5. **P2 — Les données à compléter ne deviennent pas une liste de tâches claire.** « Mes repères financiers » cache la mise en route du solde. Annuel annonce 47 points à compléter dans les données locales, sans indiquer la première tâche qui débloque le reste. Séparer la mise en route de la clôture, puis regrouper les points par action : confirmer des paiements, saisir l’inventaire, vérifier le matériel. Références : src/ui/finance/FinanceForms.tsx:22 ; src/ui/finance/TaxWorkspace.tsx:65.

## Organisation proposée

| Entrée | Réponse attendue |
|---|---|
| Vue d’ensemble | Argent disponible, à payer, à encaisser, points à traiter et aperçu de la période. |
| Opérations | Saisir et retrouver achats, ventes, paiements et justificatifs. |
| Prévisions | Échéances, charges récurrentes, prochains brassins et projets de matériel. |
| Bilan et impôts | Préparer, reporter et constituer le dossier annuel. |

Les coûts par catégorie et par brassin restent accessibles depuis la vue d'ensemble et les brassins. Les projets sont regroupés avec la planification. Cette organisation est une recommandation de revue, pas une interface déjà modifiée.

La composition doit rester compacte : une synthèse en lignes avec montants alignés et unité proche, une période courte avec raccourcis, les catégories en filtres et les détails depuis la ligne concernée. Éviter une grande carte par chiffre. Utiliser Reading pour les lectures, DateField pour les dates et SegmentedControl quand quelques options courtes doivent être comparées. Après le choix explicite d'un achat manuel, ouvrir directement le formulaire ; pour une entrée sans mode préchoisi, Photo/Fichier/Manuel peut se sélectionner dans un seul contrôle compact. Une petite courbe répond à une question d'évolution ; un tableau répond mieux à la comparaison de montants exacts. Les lacunes de données doivent rester visibles dans les résumés repliés.

## Points à conserver

La distinction « Paiement à confirmer / À compléter » est honnête et utile ; elle doit apparaître au même niveau que les montants qu’elle limite. Le formulaire montant puis motif constitue une bonne base. Les liens des catégories vers le journal et le parcours annuel Préparer → Reporter → Dossier sont pertinents.

## Finition et accessibilité

Les textes secondaires et commandes de 12/13 px sont admis selon leur rôle : leur seule taille n'est plus un défaut. Les nombreuses commandes dessinées à 48 px occupent en revanche trop de place au regard de la nouvelle échelle : petites actions répétées 24 px, commandes courantes 28 px, champs/actions principales 32 px, en-têtes/pieds 36 px et navigation basse 40 px hors zone de sécurité. Les commandes doivent pouvoir grandir pour un libellé long ou le zoom ; le texte saisi reste à 16 px. Il n'y a pas de minimum universel de cible à 44/48 px. Les contrôles observés doivent être jugés sur leur usage, leur activation effective et l'absence de chevauchement.

La capture mobile de Prévoir montre aussi une grande zone d'état vide et plusieurs rangées de commandes alors que les données manquantes sont sous le premier écran : compacter cet ensemble doit faire remonter l'information utile. Le jaune sert à trop de rôles simultanés. Le bouton + recouvre des morceaux de lignes et certains contrôles ; sur Projets, deux + correspondent à des actions différentes. Les montants passent du point à la virgule selon l'écran. Après correction d'un achat vide, les anciennes erreurs restent affichées jusqu'à la validation suivante. Sur le rendu tactile, le nom accessible du champ « Pour quoi ? » reprend son exemple au lieu de son libellé. Ces constats de parcours et d'accessibilité restent indépendants de l'ancienne règle de taille.

Références : src/ui/finance/finance.css:18, :25, :40, :61 ; src/ui/ViewNavigation.tsx:63 ; src/ui/TextInput.tsx:129 ; src/ui/finance/ExpenseSheet.tsx:89.

## Repère heuristique indicatif : 20/40

| Heuristique | /4 | Repère |
|---|---:|---|
| Visibilité de l’état | 2 | Limites moins visibles que les montants. |
| Vocabulaire métier | 2 | Bons formulaires, navigation abstraite. |
| Contrôle et sorties | 3 | Annuler/Fermer utiles ; focus et reprise à améliorer. |
| Cohérence | 2 | Entrées et chemins différents selon le contexte. |
| Prévention des erreurs | 2 | Validation présente, certains défauts préremplis ambigus. |
| Reconnaissance | 1 | Trop de contexte à retrouver dans les replis. |
| Efficacité | 2 | Recherche utile, étapes de saisie répétées. |
| Hiérarchie et sobriété | 2 | Priorités financières insuffisantes. |
| Correction des erreurs | 2 | Messages explicites mais peu ciblés et périmés. |
| Aide | 2 | Explications présentes, guidage initial insuffisant. |

Ce score est un jugement de conception, pas une étude statistique d’utilisabilité. Pour Gaëtan au bureau, la difficulté consiste à trouver une réponse financière commune ; sur téléphone avec une attention interrompue, ce sont les étapes répétées et les filtres perdus. Une première utilisation peut montrer un journal vide malgré un historique rempli. Une première réussite devrait être de retrouver une opération ou de confirmer la donnée qui débloque la synthèse.

## Preuves et limites

Les cinq vues ont été ouvertes et les captures examinées à 320, 375, 430 et 1280 px. Les états vides et remplis, recherche, filtres, détail d’opération, paiement rempli puis annulé, saisie manuelle vide/erreur/remplie puis fermée, exclusion d’un projet dans la prévision, budget et étapes annuelles ont été joués. Les états profonds ont surtout été vérifiés à 375 px. Aucune écriture réelle, aucun scan, Drive, export ou clavier de téléphone physique vérifiés. Aucun débordement horizontal de page dans les vingt vues générales ; pas d’exception JavaScript ni d’écran d’erreur Vite observés. Les appels du compagnon getBrewerActivity renvoient 401 dans le mode de démonstration sans compte réel ; la console n’est donc pas présentée comme entièrement propre.

URL : http://127.0.0.1:3012/?dev-local et jeu fictif /?dev-local&finance-demo. CUA pour l’observation native ; Playwright pour les contextes Chrome tactiles isolés, le plugin Browser dédié étant absent. Aucun serveur lancé pour cette revue ; serveur Vite préexistant conservé. Overlays Impeccable non injectés, API native read-only.

Le détecteur retourne 65 signaux bruts : 19 couleurs, 21 tailles de texte, 22 rayons et 3 avertissements de bordure. Les signaux de taille ne constituent pas des infractions : les textes de 12/13 px sont désormais admis selon leur rôle. Le soulignement de l'onglet annuel est un faux positif ; le blanc du document et le noir d'une ombre ne prouvent aucun défaut de lecture. Les contrastes ciblés mesurés dépassent 4,5:1 ; cela ne constitue pas un audit WCAG complet. Ces 65 signaux ne sont pas 65 problèmes UX distincts.

Évaluations sources et captures : finance-ux/a/assessment-a.md et finance-ux/b/result.md dans le dossier de preuves de cette tâche. Première correction recommandée : vue d’ensemble et accès directs à saisir un achat, retrouver une opération et noter un paiement.
