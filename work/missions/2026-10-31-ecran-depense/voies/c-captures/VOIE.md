# Voie c-captures — plusieurs captures pour une seule dépense (D273b) : une page de choix en mini maquettes

Agent : `concepteur` (Opus). Plafond : 60 tours. Critique Fable après la voie (e-t10), puis le pilote publie. Aucun code de l'app modifié,
aucun commit, aucun déploiement, aucun serveur Vite dans le dépôt. Possède : `work/missions/2026-10-31-ecran-depense/choix-captures/**`.
Avant de concevoir : `.claude/rules/affinee-frontend.md`, `DESIGN.md`, `docs/ui-compacte.md` (parties utiles) ; skills `boosters-ux`, `impeccable`.
Reprends la forme de la page déjà acceptée `work/missions/2026-10-31-ecran-depense/choix-nom/` (index.html, outils/, maquettes/ : sa feuille
de style, sa visionneuse, ses vignettes « = B » grisées, son en-tête court) et son verdict `critique/VERDICT-c-nom.md` : ne refais pas ses défauts.

## La question (un seul facteur, L10)
Une commande en ligne arrive souvent en **plusieurs captures d'écran** (2 à 4) ou une facture papier en plusieurs photos. Comment le
brasseur donne-t-il ces pages à **une seule** dépense ?

## Ses mots (SPEC-BRASSEUR, mot pour mot)
- 02.11 : « Choix encore ouverts : D273b (…) et D261c. Montre moi ».
- 01.11 : « les tests local sont très loin de la vérité » (D273b : le banc lisait trois captures comme trois images, l'app n'en accepte qu'un).
- 01.11 : « C'est pas du tout compacte, comme demandé » ; « Pas besoin d'afficher autant ».

## Les faits (pilote, 02.11)
- Aujourd'hui : « Nouvelle dépense » montre « Choisir le document — PDF ou image, ou dépose le fichier ici » ; un seul fichier
  (`accept="image/jpeg,image/png,image/webp,application/pdf"`, pas `multiple`), plus deux boutons photo (`capture="environment"`).
  Pour trois captures, il doit lui-même en faire un PDF de trois pages. Ce PDF est lu moins bien que les trois images (doc10 : 9/12 en
  ligne contre 11/12 au banc, la 3.8 coupée par sa limite de sortie).
- Quelle que soit l'option, le moteur enverra les pages comme des images séparées (comme le banc) et gardera au Drive un seul justificatif :
  ce n'est pas l'objet du choix. Le choix porte sur le **geste** et ce que l'écran montre des pages.
- L'écran Dépense actuel (rangées, bandes, pied « Catégorie / Papier / ✓ Confirmer ») est sa base (f3) ; seules l'entrée des pages et la
  trace des pages dans l'en-tête changent d'une option à l'autre.

## Les options à montrer (chacune : l'entrée, pendant l'ajout, puis la dépense lue)
- **A — aujourd'hui (référence, `data-reference`)** : un seul fichier ; trois captures demandent un PDF fait ailleurs.
- **B — « + page » après la première** : la première capture ou photo choisie, une rangée de vignettes apparaît avec « + page » ; la lecture
  part quand il touche « Lire » (ou après un court délai sans nouvelle page : à dire si tu le proposes).
- **C — plusieurs d'un coup** : le sélecteur accepte plusieurs images en une fois (`multiple`) ; elles deviennent les pages, dans l'ordre
  des fichiers, réordonnables par glisser ; la lecture part tout de suite.
- **D — mode pages à l'appareil photo** : photo, « + page », « Terminer » (comme un scanner) ; pour une facture papier en plusieurs feuilles.
Tu peux en ajouter une si une vraie alternative manque (par exemple B et C ensemble), en le disant. Rien d'autre ne varie.
Pour la dépense lue : une trace compacte des pages (« 3 pages » ou trois vignettes minuscules dans l'en-tête), qui s'ouvre au toucher.

## La forme de la page et les contrôles
Comme `choix-nom` : `choix-captures/index.html`, maquettes HTML à 390 px capturées en PNG (`img/`), valeurs fictives, fournisseurs fictifs,
aucune valeur des captures réelles. Regarder pour l'aspect seulement `voies/f3-rangees/captures/` et `voies/f3-rangees/bout/F/` (données
réelles : rien n'en est recopié).
1. `node work/refonte-frontend/v4/tournoi/outils/controle-page-choix.mjs work/missions/2026-10-31-ecran-depense/choix-captures/index.html --min=3` → `PAGE-CHOIX OK`.
2. `node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-depense/choix-captures/index.html --page-lot --captures work/missions/2026-10-31-ecran-depense/choix-captures/controle` → `PAGE OK` ; ouvre chaque capture (L12).
3. `controle-choix` : l'écran Dépense n'est pas dans `ecrans.json` ; le dire dans RESULTAT.

## Retour
`choix-captures/RESULTAT.md`, puis une ligne `C-CAPTURES OK — <n> options — choix-captures/index.html` ou `C-CAPTURES ECHEC — <raison>`.
