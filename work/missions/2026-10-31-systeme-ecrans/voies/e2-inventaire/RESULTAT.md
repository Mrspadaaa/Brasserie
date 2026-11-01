OK — inventaire de 85 écrans par script rejouable, tableau, ordre proposé, fiche Identité, 4 captures ouvertes

## Fichiers écrits
- `scripts/agents/inventaire-ecrans.mjs` : le script (`--verifier`, `--stdout`, sans option : écrit).
- `work/refonte-frontend/inventaire-ecrans.json` : 85 écrans, plus le détail de l'écran Identité (18 blocs).
- `work/refonte-frontend/INVENTAIRE-ECRANS.md` : lecture, tableau (généré, entre `<!-- TABLEAU -->` et `<!-- /TABLEAU -->`), constats, proposition d'ordre (entre `<!-- ORDRE -->` et `<!-- /ORDRE -->`, dont `--verifier` contrôle que chaque identifiant cité existe).
- `work/missions/2026-10-31-ecran-identite/inventaire-identite.md` : fiche détaillée de « Identité 1/7 », demandée par le pilote en cours de voie. Entièrement générée par le script (hors « Possède » de la voie, sur ordre du pilote).
- Dans la voie : `capturer.mjs`, `captures/` (4 PNG et `journal.json`), ce fichier.
- Rien écrit dans `src/` ni dans `ecrans.json`. `work/**` est ignoré par git : un commit demande `git add -f` par chemins (L17).

## Critères
- `node scripts/agents/inventaire-ecrans.mjs --verifier` : sortie
  `vues du code : 54 jetons, tous dans l'inventaire ; 85 écrans ; fichiers racine présents ; aucune entrée en double` puis `INVENTAIRE OK`.
  - Les 54 jetons viennent du code : 5 onglets de `App.tsx`, 14 composants chargés à la demande, 8 composants d'enveloppe et 4 états de `App.tsx`, 10 routes de `useFullScreenRoute.ts`, 7 étapes de l'assistant, 6 écrans de `QuickActionModal`.
  - Épreuves à l'envers faites sur une copie du script (supprimée) : un jeton retiré donne `vue absente de l'inventaire : etape:eau` et `identifiant en double` ; un fichier racine renommé donne `fichier racine absent` ; `INVENTAIRE ECHEC`, code 1. Une ancre de zone ou de bloc introuvable fait aussi échouer.
- Rejoué trois fois : `cmp` identique sur `inventaire-ecrans.json`, `INVENTAIRE-ECRANS.md` et `inventaire-identite.md` (« 3 SORTIES IDENTIQUES », puis « MEME_JSON » après chaque retouche). Pas d'horodatage dans les sorties.
- Captures : voir la section suivante.

## Captures (L12), 390 × 844, ouvertes en image
Procédure : copie de production `atelier-ecrans` (commit `ae7c7a8d`), `npm run dev -- --port 5631`, via `with_server.mjs`, `?dev-local`, `VITE_HOP_V4=on`, clés Firebase factices (`--env VITE_FIREBASE_*=fake…`, sans elles l'app répond « Impossible de charger la brasserie »), réseau hors localhost bloqué (0 requête bloquée). Les trois écrans sont tirés au hasard par le script : `finances-synthese`, `onglet-bord`, `brassins-volumes`.
- `captures/onglet-bord-390.png` : cinq cartes (Brassins « Aucun brassin en cuve. », Stocks « Stocks suffisants », Finances « Charges 0,00 CHF », Agenda « Marché d'Automne… », Échéances « 6 points à suivre · Fribourg / OFDF ). L'inventaire dit : onglet de lecture seule, cinq sections, états `chargé, vide, erreur`, renvoie vers brassins, stocks, finances. Concordant.
- `captures/finances-synthese-390.png` : sous-navigation Synthèse · Opérations · Prévisions · Annuel, titre « Situation financière », bascule Situation | Coûts, « Trésorerie : À compléter · Solde de départ à renseigner ». L'inventaire : vue `Synthèse (situation, coûts)`, zone `overview`, états `chargé, vide`. Concordant. Un inconnu y est dit « À compléter », pas 0 (conforme à PRODUCT.md).
- `captures/brassins-volumes-390.png` : sous-navigation Brassins · Recettes · Atelier · Volumes, bouton « Atelier Houblons V5.5 », carte vide « Aucune recette à adapter ». L'inventaire : `Adapter les volumes`, état `vide`, et la coque `onglet-brassins` porte le bouton V5.5. Concordant ; la capture montre aussi que sur mobile les libellés courts de `ViewNavigation` (« Atelier », « Volumes ») diffèrent des libellés accessibles (« Atelier R&D », « Adapter les volumes »), que l'inventaire donne tous deux.
- `captures/etape-identite-390.png` (en plus) : mêmes blocs que la capture du brasseur : en-tête « Identité 1/7 », fil, « Coller une recette trouvée », nom, style, volume 30 L, ébullition 60 min, « 3 L évaporés », NOLO, « Choix pour ce brassin », « Matériel du plan : Système 30L », puis un encadré « Volumes et matériel · À revoir » que la capture du brasseur ne montre pas (elle s'arrête au-dessus) et que la fiche a donc ajouté. Pas de bandeau Grain/OG (recette vide), pas de « Abandonner » (pas de brouillon) : conforme à la fiche.
- Un toast « Base initialisée avec 11 enregistrements. » couvrait l'en-tête dans la première série ; il vient de la graine locale du dev local (pas des données réelles). Les captures retenues viennent de la deuxième série, où il est parti (reste un voile gris pâle en haut, sans effet sur le contenu).

## Essais utilisés
- `--verifier` : 3 passages, un échec corrigé en cours de route (`lazy:HopToolLayer` non porté par une entrée) ; une ancre fausse (`IbuEnPlage` est dans `BrewWizard.tsx`, pas dans `MesuresWizard.tsx`) corrigée.
- Captures : 3 séries (variables Firebase absentes ; libellés mobiles d'aria-label ; chargement paresseux des onglets).

## Constats à connaître (tous dans les fichiers livrés)
- 4 modales non branchées (aucun import) : `EditBatchModal` (457 lignes), `EditStockItemModal` (283), `AddStockItemModal` (263), `ConfirmModal` (77).
- `QuickActionModal.tsx` : le menu ouvre `ExpenseSheet` par un retour anticipé (l.604) ; les écrans `matching` et `quick-expense` du modal sont probablement morts. **Non confirmé par un parcours Chrome** (marqué « à confirmer »).
- L'atelier Houblons V5.5 : plus de 8 000 lignes, encore atteignable, pas refait.
- Écran Identité, sur le profil de dev « Système 30L » : un volume par défaut égal à la capacité du fermenteur ouvre l'écran avec deux messages rouges ; chez le brasseur (24 / 30 L), rien de rouge. Un encadré « Volumes et matériel » double « Choix pour ce brassin ». `NumberInput` ignore la prop `pad` (le pavé intégré n'existe plus). Le taux d'évaporation retombe sur 10 % sans le dire. Trois composants de l'écran n'ont aucun test qui les vise (`BrewingStyleDetails`, `RecipeInstallationChoice`, `ThemeToggle`).

## Doutes et limites
- **Les états sont détectés par motifs dans le source** (ex. `Suspense` = « chargement ») : ils disent que le code existe, pas que l'état se voit. Vérifié en image sur 4 écrans seulement.
- **Les tests sont repérés par import ou par libellé** : 0 ne veut pas dire « aucun test », et un test qui passe par `App` n'est compté que s'il cite un libellé. Les entrées partageant un fichier (zones de `BrewWizard.tsx`, `ClientsTab.tsx`…) n'ont des tests que par libellé.
- **« Lien avec houblons »** reprend le registre (`ecrans.json`) pour les 7 écrans choisis ; `en partie` est mon jugement pour la fiche de recette, le jour de brassage, le compagnon, l'index de Stocks.
- **Les niveaux d'usage et de risque sont mes jugements**, tirés de PRODUCT.md (deux scènes d'usage) et du code ; ils servent la proposition d'ordre, que le brasseur tranchera.
- **Le nom français vient du code** (titres, libellés d'onglets) ; quelques noms d'entrées (« Brassins · Adapter les volumes ») sont mes assemblages « onglet · vue ».
- Les lignes d'un écran comptent ses composants propres : un composant partagé est compté chaque fois ; les totaux ne s'additionnent pas.
- L'arbre principal est modifié par d'autres voies : les nombres de tests ou de lignes peuvent bouger entre deux passages ; `--verifier` signale « JSON périmé » en simple avertissement (il ne fait pas échouer).
- Je n'ai pas lancé `npm test`, ni le build : voie sans changement de `src/`.
- Une commande de la voie a été faite par `node -e` pour une édition de `capturer.mjs` (contre la consigne du poste) ; sans effet (aucun remplacement n'a eu lieu), l'édition a été refaite avec l'outil Edit.

DÉCISION À PRENDRE : que faire des 4 modales non branchées, des 2 écrans probablement morts de `QuickActionModal` et de l'atelier Houblons V5.5 ? Options : (a) les garder tels quels et les écarter du programme ; (b) les masquer ; (c) les retirer après accord. Recommandation : (a) pour l'instant, avec une confirmation Chrome des deux écrans du modal avant toute suppression ; le pilote route (rien n'est supprimé sans son accord).

CONNAISSANCE : l'app lancée en copie avec `?dev-local` exige des variables `VITE_FIREBASE_*` factices (sans elles : « Impossible de charger la brasserie ») et affiche une graine locale de 11 enregistrements (profil « Système 30L ») ; sur ce profil, une recette neuve s'ouvre à 30 / 30 L avec deux messages rouges. À reporter dans `verification-locale` si le pilote le juge utile (la note ne le dit pas).

LEÇON PROPOSÉE : aucune
