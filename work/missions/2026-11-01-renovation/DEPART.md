# Rénovation de la brasserie — point de départ (01.11, nuit)

Écrit par le pilote de la mission Dépense (`2026-10-31-ecran-depense`), qui passe la main. Une session par écran (D207) : cette
mission se mène dans sa propre session.

## Sa demande
Mot pour mot dans `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, § « La vue TVA, et la rénovation d'abord » ; décision D259
(`work/refonte-frontend/decisions.md`). En bref : « j'ai plus besoin d'outil de prédictions, vu d'ensemble, panification et autres car
la brasserie est en grande rénovation, et il me manque encore beaucoup de choses et j'ai pas beaucoup de temps à consacrer à ça et pas
non plus un gros budget ». Ses exemples : installation de la hotte, installation du 2ᵉ évier, armoire extérieure, seconde passe sur
les sols, création du site web vitrine. Les outils de prix, de vente et de ROI sont « pour après » (il ne vend pas encore beaucoup).

## Ce que l'app a déjà (lu dans le code, 01.11)
- **Projets de matériel** : Finances › Prévisions › « Projets de matériel » (`src/components/tabs/FinancesTab.tsx:158`,
  `src/ui/finance/UpgradeWorkspace.tsx`, `UpgradeSheet.tsx`). Un projet est un `FinancialPlan` de `source: 'equipment'`
  (`financialPlans`), avec `EquipmentUpgrade` (`src/domain/finance/types.ts:112`) :
  - quand : `timing` Bientôt / Ensuite / Plus tard, et une date au mois ou au jour ;
  - où il en est : `stage` Idée / À étudier / Devis en cours / Prêt à acheter ;
  - combien : achat + livraison + installation (`upgradeBudget`), estimation ou devis, ou « À estimer » ;
  - un but (`purpose`), une référence de devis ;
  - « Inclure dans les prévisions » (statut `active`) ; « Noter l'achat » ouvre la Nouvelle dépense (intention matériel) ;
  - l'avancement réel : factures liées contre budget prévu (`upgradeProgress`, `src/domain/finance/upgrades.ts:52`).
- **Évolution de la brasserie** (`UpgradeAnalytics`, dans la Synthèse de Finances) : budgets retenus, projets retenus et idées.
- **Prévisions** (`src/domain/finance/forecast.ts`) : échéances sur 30, 90 ou 365 jours, solde projeté, avec ou sans les projets
  de matériel (`FinancesTab.tsx:184`).
- **Labo créatif** (`src/components/CreativeLabTab.tsx`, `CreativeItem`, `src/types/index.ts:882`) : idées de matériel, de
  recettes, d'événements, de prix et de prospects ; une idée de matériel devient un projet (`mergeUpgradePlans`).
- Aucun outil de tâches, de temps, d'ordre ou de dépendances entre travaux.

## Ce qu'il y a dans ses données (lecture seule, 01.11)
- Un seul projet de matériel : un système de brassage « Plus tard », « Prêt à acheter », budget connu.
- Aucun de ses chantiers (hotte, évier, armoire, sols, site) n'est saisi nulle part.
- Le Labo créatif contient quelques idées (matériel, événement, recette, prospect). Rien de ses données ne va dans une maquette : les
  maquettes utilisent ses chantiers cités (ses mots) et des montants fictifs.

## Ce qui manque, en première lecture (à confirmer par le jury)
1. Le modèle ne connaît que l'achat de matériel. Une seconde passe sur les sols ou un site vitrine sont des chantiers : du temps, des
   étapes, peut-être des achats, peut-être aucun.
2. Rien ne dit **dans quel ordre** faire les chantiers, ni ce qui en bloque un autre (sols avant armoire ? hotte avant brassage ?).
3. Rien ne compte **son temps** : il en a peu ; un chantier coûte des heures autant que des francs.
4. La prédiction de trésorerie existe (Prévisions), mais elle ne répond pas à « quand pourrai-je me payer la hotte ? », ni à « quand
   aurai-je fini ? ».
5. L'outil est enfoui (Finances › Prévisions › second onglet) ; la vue d'ensemble demandée n'a pas de place à elle.

## Marche proposée
1. Jury de cadrage, niveau normal (skill `jury` : Brasseur en Fable, Contradicteur et Premiers principes en Opus), sur un dossier de
   3 000 mots au plus. Questions qui comptent ici : J2 (un geste, un outil : vue d'ensemble, ordre, temps ou argent ?), J5 (Projets
   de matériel : à étendre, pas à doubler ; règle « finir ou brancher plutôt qu'ajouter une couche »), J7 (hors ligne, téléphone,
   peu de temps), J10 (premier plan), J16 (un modèle de chantier touche-t-il le schéma Firestore ? → ACCORD).
2. Entonnoir allégé (D204) : 12 à 16 v0 en 3 ou 4 séries, trois chaleurs, données fictives écrites dans chaque brief (L05 : le
   01.11, une série a pris des noms réels faute de cette ligne), puis le tri du critique, une passe 2 et une page neuve datée.
3. Rien de l'app n'est modifié avant son choix (règle n° 1).

## Contraintes
Données réelles en lecture seule ; schéma Firestore inchangé sans son accord ; aucun déploiement, push ni PR sans accord ; pas de
serveur dans `C:/Users/mrspa/Documents/Brasserie` ; la mission Dépense garde ses fichiers (ne pas toucher `src/ui/depense/**`,
`src/ui/finance/ExpenseSheet.tsx`, `InvoiceScanReview.tsx`, `ModalShell.tsx`, en cours de port non commité).
