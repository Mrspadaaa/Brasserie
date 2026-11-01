# Avis — regard Contradicteur (opus, 93 k jetons, 18 outils)

J1 — À corriger. La scène « au bureau, par moments volés » n'est dans aucun de ses mots. « pas beaucoup de temps à consacrer à ça » peut viser les travaux eux-mêmes, pas l'écran. Lecture étroite, signalée. — PILOTE — SPEC 01.11 ; L01.

J2 — Contre l'ordre comme facteur libre. Pour que l'ordre fasse bouger une date, il faut des durées, des heures par semaine et des prix ; au jour 1 tout est « à estimer » : rien ne réagit. La caisse ne prévoit aucune entrée : « pas avant mars » serait un chiffre inventé. — SOURCE — `forecast.ts:14` (la tendance ne suit que `chargesFixes`).

J3 — Confirmé. La question qu'on évite : pourquoi la hotte n'est-elle pas déjà dans Projets de matériel ? Mesurer d'abord le nombre de touchers pour atteindre l'outil, et la catégorie figée à « materiel » dans le formulaire. — MESURE — `UpgradeSheet.tsx:18`.

J4 — À corriger. Un récap de trois « à estimer » ne sert à rien au jour 1, son état réel. Réussite : ses cinq titres posés en moins d'une minute, et un récap utile dès qu'un seul prix est connu. — PILOTE — `upgrades.ts:49` (un projet inclus exige budget et date).

J5 — À compléter. L'Agenda du Bord est déjà une liste de tâches à cocher ; des étapes de chantier neuves la doubleraient. La catégorie `renovation` est déjà acceptée par la validation. — SOURCE — `DashboardTab.tsx:322` ; `upgrades.ts:42`.

J6 — Ajouter D14 (un inconnu affiché « null » ou 0) et D1 à D5. Une maquette remplie de montants fictifs cache l'état vide : le refus du « chiffre plausible » vaut aussi pour la maquette qu'il juge. — SOURCE — DEFAUTS-COURT ; PRODUCT.md.

J7 — Confirmé, la saisie avant la précision. Hors ligne : un client plus ancien rejette tout `version` différent de 1 ; donc des champs neufs, facultatifs, dans la version 1. — SOURCE — `upgrades.ts:43`.

J8 — À corriger. L'app dit déjà « Local et travaux » ; « Rénovation » donnerait deux noms à la même chose (D129, continuité). Ses mots : « grande rénovation ». Axe de variantes. — GOÛT — `FinanceForms.tsx:12`.

J9 — À corriger. Le modèle accepte déjà `renovation` ; seul le formulaire fige « materiel ». Hotte, évier et armoire tiennent déjà dans achat + livraison + installation. Manquent : les heures, l'ordre, un chantier sans achat. — SOURCE — `upgrades.ts:42` ; `types.ts:112`.

J10 — L'ancrage est faux : « un récap en haut comme sur le screen » visait la Nouvelle dépense (bandeau de r2b), pas une « vue Finances r1 ». Son goût pour un récap reste, mais aucune forme n'est choisie pour cet écran. — SOURCE — SPEC l. 897-898 ; D235.

J11 — Ajouter : la caisse inconnue (solde d'ouverture non confirmé, `cashCents` null) ; ce qui est déjà dépensé en « Local et travaux » ; un chantier fini hors de l'app. — SOURCE — `ledger.ts:104` ; `forecast.ts:152`.

J12 — Confirmé. Ajouter la Nouvelle dépense : « Noter l'achat » l'ouvre, en cours de port non commité dans une autre mission ; rien ne s'y touche. — SOURCE — DEPART.

J13 — Quatre approches ne font pas un entonnoir : 12 à 16 en 3 ou 4 séries (D204). La file réordonnée d'une main et la frise sans durées sont fragiles. Chaque variante se montre aussi au jour 1, presque vide. — GOÛT — M13 ; D204.

J14 — 1, 3 et 5 bons. 2 faux : le solde projeté ne compte ni entrées ni apports, et il est souvent null. 4 ajoute un second facteur libre : axe de variantes. 6 doit ajouter un état sans montant. — PILOTE — `forecast.ts:14, 152` ; L10.

J15 — Pour. « il me manque » se lit d'abord comme des choses à acheter ; trois de ses cinq exemples sont achat + installation. Le geste le plus court : un titre, tout le reste « à estimer ». — PILOTE — SPEC 01.11.

J16 — Confirmé, accord après son choix de maquette. Des champs facultatifs dans `financialPlans` changent quand même ses données réelles ; une nouvelle collection demande en plus des règles Firestore et leur déploiement. — ACCORD.

J17 — 1. Il ne saisit ni durées ni heures : la fin estimée reste vide. 2. Ses apports ne sont pas prévus : la date de paiement trompe. 3. L'outil existant était peut-être seulement introuvable. 4. L'endroit où vit l'écran. — CONSEIL.

J18 — La question qu'on évite : un écran neuf, ou rendre l'existant trouvable (catégorie, entrée depuis le Bord) et y ajouter heures et ordre ? Mesurer combien de ses cinq chantiers le modèle actuel tient déjà. — MESURE — CLAUDE.md « finir ou brancher ».

Phrase du brasseur : hors de mon regard.

LEÇON PROPOSÉE : un mot du brasseur cité dans un dossier se donne avec l'écran et la ligne de SPEC où il l'a dit (le 01.11, « récap en haut », Nouvelle dépense r2b, a été attribué à une « vue Finances r1 »). Une prédiction promise se vérifie sur ses entrées avant le dossier : la prévision ne connaît pas ses apports.
