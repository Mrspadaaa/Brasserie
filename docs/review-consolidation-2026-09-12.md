# Consolidation et fluidité — 12 septembre 2026

Cette passe réunit les travaux de densité mobile sur les stocks, clients, tarifs,
production, matériel, fûts, réglages et jour de brassage, ainsi que les évolutions
de l’atelier eau et du simulateur NOLO. Elle complète la
[revue de création de recette](review-creation-recette-2026-09-12.md).

## Réunion des travaux

L’inventaire a couvert les 13 copies Git et 1 885 fichiers des anciennes copies.
Les 82 variantes restantes ont été confrontées à leur historique : aucun correctif
utile absent de la copie commune n’a été identifié. Réimporter ces anciennes
versions aurait notamment régressé la lecture de justificatifs, les autorisations
Drive et les budgets. La fusion `origin/main` apporte un lien d’historique dont
le contenu est déjà intégré. Aucun ancien travail n’a été supprimé.

Les tâches eau/HCO₃ et NOLO, reprises pendant cette consolidation, sont intégrées
dans la même livraison. Le contrôle final calcule une empreinte des fichiers avant
et après les vérifications pour détecter une modification concurrente.

## Réactivité

Le JavaScript nécessaire au démarrage passe de 4,95 à 2,58 Mo, soit une baisse
de 47,9 % ; compressé en gzip, il passe de 1,27 à 0,57 Mo (−55,1 %). Cette
comparaison porte sur les imports statiques initiaux, avant l'ouverture des
vues chargées à la demande.

- Les vues lourdes et conversations se chargent à leur ouverture. Leurs états de
  chargement et d’échec gardent les commandes de fermeture ou de navigation.
  Les modales déjà ouvertes restent montées lorsqu’elles sont fermées, comme
  auparavant, pour conserver leur état sans charger leur code au démarrage.
- La recherche universelle reste montée dès le démarrage : Ctrl+K/⌘K doit ouvrir
  la recherche immédiatement et placer le focus dans le champ sur ordinateur.
- Le stockage importe directement les références scientifiques NOLO légères,
  sans charger les catalogues de levures et leurs outils d’analyse.
- Modifier le nom d’une recette ne relance plus le calcul automatique de son eau.
  Changer le volume le relance toujours : le test couvre ce contrôle positif.
- Le renommage avec NOLO actif conserve aussi la proposition sans relancer sa
  préparation ; le nom courant est conservé quand elle est appliquée. Sur le
  parcours local vérifié, 21 saisies ont réagi en 5,7 à 10,2 ms, sans tâche longue
  ni erreur enregistrée. Ce sont des mesures de première réaction en laboratoire.
- Le curseur sulfate/chlorure n’émet qu’une résolution par graduation pendant
  le geste. Le premier appui d’un nouveau geste reste pris en compte, même en
  mode manuel. Le résultat réel conserve son propre repère.

Le protocole compare des builds de production avant/après, sur le même navigateur
et les mêmes données synthétiques. Il mesure la fermeture des imports statiques,
les tâches longues, la frappe et la première réaction des interactions. Cette
dernière peut être un état de chargement : elle ne mesure pas le chargement complet
d’une vue, ni l’INP réel des utilisateurs.

## Corrections confirmées dans le navigateur

| Besoin | Contrôle et représentation | Résultat vérifié |
|---|---|---|
| Corriger un tarif | Saisie décimale compacte, erreur liée au champ, marge calculée | `abc`, Tab et Ctrl+Entrée ne sauvegardent pas l’ancien montant ; `2,50` corrige et se conserve. |
| Adapter une recette au volume | Volume avec pas de réglage et aperçu proportionnel | Effacement réel et texte illisible masquent les résultats ; correction, `+` et réinitialisation rétablissent le calcul. |
| Retrouver un fût ancien | Filtre d’état et fiche conservant son contenu | L’état manquant reste consultable ; le choix explicite d’un état préserve bière, brassin, date et notes. |
| Lire le stock utile | Quantité, niveau et réserve dans la description accessible | Des articles homonymes ne reçoivent pas une couverture inventée ; la correction d’inventaire est persistée. |
| Comprendre l’acide | HCO₃ par eau près des doses, moyenne distinguée sur le graphique | Les doses manuelles sont conservées et le retour aux doses calculées reste explicite. |
| Préparer les volumes d’eau | Totaux calculés avant l’arrondi d’affichage | Le récapitulatif et la recette sauvée conservent les mêmes litres d’osmosée et de réseau. |
| Construire une recette NOLO | Procédé, levures adaptées, réglages préremplis et plage d’alcool | Une consigne effacée bloque l’application ; correction, renommage, application et sauvegarde conservent la plage 0,31–0,45 % du pilote local. |
| Lire les pesées au zoom | Tableau défilant au clavier, recommandation repliable sur plusieurs lignes | Toutes les colonnes restent accessibles à 200 % ; aucun mot n’est coupé dans la recommandation. |
| Travailler au brassage | Mesurer, Note et action de phase se replient selon leur contenu | Aucun chevauchement à 200 % ; mesure et note se retrouvent dans le journal. |

## Vérification et preuves

Les captures ont été prises et regardées, téléphone d’abord, dans des cadres de
320, 375, 430 et 1280 px. Les parcours ont été joués avec clics, saisie, Tab,
Ctrl+K, Entrée, Échap, flèches du curseur, glissement du ratio, fermeture,
correction et enregistrement. Les vues différées finances, tableau de bord,
recette, création, jour de brassage, réglages, journal, connexions et compagnon
ont été réellement ouvertes.

Captures de contrôle :

- [Tarif invalide, 375 px](validation/unified-release-2026-09-12/after-tarif-invalid-375.png)
- [Volume effacé, 320 px](validation/unified-release-2026-09-12/after-volume-empty-320.png)
- [Fût à état inconnu, 375 px](validation/unified-release-2026-09-12/after-keg-unknown-375.png)
- [Stocks homonymes, 320 px](validation/unified-release-2026-09-12/after-stock-homonyms-320.png)
- [Récapitulatif eau à 200 %, 320 px](validation/unified-release-2026-09-12/after-water-summary-zoom-320.png)
- [Actions de brassage à 200 %, 320 px](validation/unified-release-2026-09-12/after-brewday-zoom-320.png)
- [Consigne NOLO effacée, 375 px](validation/unified-release-2026-09-12/after-nolo-invalid-375.png)
- [Totaux d’eau cohérents, 375 px](validation/unified-release-2026-09-12/after-water-totals-375.png)
- [Ratio à 200 %, 1280 px](validation/unified-release-2026-09-12/after-ratio-zoom-1280.png)

La publication suit `DEPLOY.md` : types application et fonctions, build,
génération et contrôle des règles, unités, brassage, eau, prompts et suite complète
de tests. Après publication, les empreintes du HTML et de tous les fichiers
`dist/assets`, y compris les vues différées, sont comparées aux fichiers servis.

Limites : données locales synthétiques ; mode tactile simulé pour les contrôles,
sans clavier de téléphone physique, ralentissement CPU ou réseau mobile. Les
mesures de laboratoire ne garantissent pas une absence absolue de latence sur
tous les appareils. Elles ne remplacent pas des mesures terrain.
