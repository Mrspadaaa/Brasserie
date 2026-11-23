# Création de recette — corrections vérifiées

12 septembre 2026. Tous les constats de la revue initiale sont traités. Références appliquées : PRODUCT.md, DESIGN.md et docs/ui-compacte.md. La priorité reste la densité utile sur téléphone.

| Besoin du brasseur | Correction livrée | Vérification |
| --- | --- | --- |
| Enregistrer des valeurs valides | Validation commune à Suivant, raccourcis, enregistrement et lancement ; erreur liée au champ, champ révélé et focalisé. Une valeur effacée reste absente. | Nom vide, volume effacé et eau d’empâtage effacée refusés puis corrigés dans le navigateur ; tests des quantités, températures et durées. Les zéros explicitement autorisés restent utilisables. |
| Retrouver son travail après interruption | Brouillon local complet, propre au compte et à chaque création, recette, duplication ou idée. Reprise après fermeture, Échap, retour et rechargement ; abandon explicite. | Parcours réels de fermeture/reprise, annulation puis confirmation d’abandon, rechargement et isolation entre duplication et nouvelle recette. |
| Savoir si la sauvegarde a abouti | Attente de la confirmation de la version exacte ; conservation du brouillon sur refus. Pendant l’attente, la saisie est désactivée et Fermer reste disponible. Une ancienne confirmation ne supprime pas une reprise modifiée. | Refus et confirmation retardée pilotés dans le banc local ; ancienne sauvegarde résolue après réouverture ; 21 tests de confirmation avec le vrai module de dépôt et le SDK simulé. |
| Voir ce qui manque avant de brasser | Pastille du nombre d’ingrédients à commander dans Stock fermé ; tableau Ingrédient / Disponible / Nécessaire dans le détail. | Trois manques visibles dès le premier écran à 320 × 568 ; tableau ouvert et fermé au clavier. Les cas suffisants, vides et incomplets sont couverts par les tests. |
| Saisir les houblons immédiatement | Sélection du moment, ajout et quantités avant l’atelier facultatif ; résumé IBU et détail « Comparer et simuler les houblons ». | Cascade saisi puis scénario 22,3 → 30 IBU, 35 → 47,2 g, appliqué à la recette. Les contrôles et l’atelier restent accessibles. |
| Parcourir rapidement la recette | Noms courts dans le rail mobile avec défilement local ; résumés compacts et informations longues pouvant revenir à la ligne. | Lignes simples de 30 px, bordures comprises, contre 50 px avant ; intervalles de 4 px. En-tête avec rail ≈ 65,5 px, pied ≈ 37 px. Vérification à 320, 375, 430 et 1280 px. |
| Comprendre les réglages de levure | Première application cohérente avec les données effectivement reprises ; détection conservée des modifications ultérieures. | Première application à 20 g sans fausse alerte ; modification réelle à 25 g signalée ; retour à 20 g supprimant cette divergence. 69 tests dédiés passent. |
| Utiliser le clavier et lire les états | Arrière-plan inerte, focus contenu puis restitué, panneaux imbriqués compatibles ; onglets d’eau reliés aux panneaux et focus suivant la sélection. Contraste du badge Garde corrigé. | Tab/Maj+Tab, Échap, import et onglets testés ; contraste calculé du badge 10,35:1 contre 4,30:1. 10 tests d’accessibilité et 18 de sécurité du wizard passent. |
| Lire les valeurs sans ambiguïté | Virgules dans les mesures, récapitulatif, prévisualisation d’import, eau, sels, acides et libellés de dosage. Calculs et export structuré inchangés. | Décimales vérifiées dans les champs, diagnostics, tableau des additifs et import local. Export copié, relu et repris avec ses ingrédients, paliers et traitement d’eau. |
| Corriger une erreur sans perdre l’accès aux actions | Alertes d’écriture dans le flux du wizard, sans bandeau superposé à l’en-tête ; messages identiques dédupliqués. États asynchrones de relecture annoncés. | Erreur d’écriture visible avec focus, fermeture et nouvelle tentative ; succès puis ouverture de la recette ; lancement de LOT-002 dans le banc local. Annonce de relecture vérifiée en intégration. |
| Agrandir le texte | Mesures réparties sur plusieurs lignes si nécessaire ; grille des volumes adaptative. | Racine du texte portée à 200 % dans le banc à 320 px ; valeurs et unités examinées, sans chevauchement. Ce contrôle ne simule pas un zoom natif du navigateur. |

## Preuves visuelles

Captures produites et réellement examinées avec les outils de navigateur :

- [Récapitulatif final — 320 px](validation/recipe-frontend-2026-09-12/18-final-320.png)
- [Récapitulatif final — 375 px](validation/recipe-frontend-2026-09-12/17-final-375.png)
- [Récapitulatif final — 430 px](validation/recipe-frontend-2026-09-12/19-final-430.png)
- [Récapitulatif final — ordinateur](validation/recipe-frontend-2026-09-12/20-final-1280.png)
- [Ajouts de houblons prioritaires](validation/recipe-frontend-2026-09-12/09-houblons-ajouts-prioritaires-375.png)
- [Refus d’enregistrement, brouillon conservé](validation/recipe-frontend-2026-09-12/07-refus-enregistrement-brouillon.png)
- [Confirmation en attente](validation/recipe-frontend-2026-09-12/15-confirmation-en-attente-375.png)
- [Dosages français](validation/recipe-frontend-2026-09-12/13-sels-doses-francaises-375.png)
- [Import local prévisualisé](validation/recipe-frontend-2026-09-12/14-import-francais-375.png)
- [Texte agrandi à 200 %](validation/recipe-frontend-2026-09-12/11-recap-texte-200-320.png)

Les mesures finales sont conservées dans le dossier local de preuves de la vérification. L’inspection finale du document ne relève ni débordement de la vue ni erreur applicative capturée.

## Contrôles techniques et portée

- 23 suites ciblées passent : wizard, saisies, édition, import/export, affichage des quantités, accessibilité, stock, levure, eau et confirmation d’enregistrement. Les vérifications des trois contributions ont été réexécutées par l’intégration.
- `npm run build` passe avec TypeScript et Vite. Le contrôle de frontière des tests locaux et l’audit des saisies passent également.
- Les captures initiales et le rapport initial sont conservés pour comparaison. La clôture des constats est documentée ici ; la commande de clôture Impeccable de cette installation Windows a renvoyé un code d’échec sans diagnostic et n’est pas présentée comme réussie.
- Les changements préexistants des autres travaux ont été conservés. La revue et ses vérifications ont précédé la publication demandée séparément.
- Le banc utilise les composants applicatifs avec des adaptateurs et données de test locaux. Le téléphone physique, son clavier virtuel, un lecteur d’écran et le serveur Firebase réel n’ont pas été testés. Aucune requête IA externe n’était nécessaire.
- Serveurs QA arrêtés et taille du navigateur restaurée après les contrôles.

## Préparation de publication

La checklist de `DEPLOY.md` est exécutée sur une copie isolée contenant les corrections de recette et leurs composants partagés. Le contrôle des unités a également conduit à utiliser `Units.format` pour les masses dans le planning de houblonnage à cru, le guide de levure du brassin et le sélecteur de fruit NOLO. Les captures ci-dessus utilisent exclusivement les données du banc local.

La validation finale de cette copie passe : **247 suites et 3 754 tests**, types application et Functions, build, règles, unités, brassage, eau, schémas IA et exclusion des données privées du bundle. La suite complète utilise quatre workers pour éviter la contention des tests de saisie. Les attentes anciennes des tests de navigation financière, de décimales et de quantité de levure absente ont été alignées sur le comportement actuel.

Le contrôle de cohérence a également corrigé l’alimentation des références levure : choix, simulation et solveur utilisent le même catalogue fabricant. Un guide désactivé reste désactivé ; une référence personnelle vide, contradictoire ou invalide reste prioritaire. Les tests des anciens diagnostics rejouables sont conservés. La copie destinée à la publication a été ouverte à 320, 375 et 1280 px, avec import, lancement et inspection des masses dans les trois vues corrigées.
