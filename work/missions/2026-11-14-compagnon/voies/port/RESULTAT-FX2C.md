OK — fx2c : limites, plafond, conversations portés sur p2a ; tests, tsc, noms, build PORT OK ; captures cave et 1280 non refaites.

Worktree `C:/Users/mrspa/AppData/Local/Temp/compagnon-p2a`. Serveur Vite **3014 encore lancé** (à arrêter à la fin ; port libre à vérifier).
Banc : `work/missions/2026-11-14-compagnon/voies/port/banc-fx2c.mjs` (`limites plafond conversations menu repartir` ; `TOUT=1` = 390 clair, 390 cave, 1280 clair) ; captures dans `voies/port/fx2c/`. URL `?preview=brew&view=assistant` (view=brassage n'a pas BrewerActivity ni le bouton flottant).

## Fichiers modifiés (non commités)
- `src/ui/BrewerBudget.tsx` : en-tête « ← Limites IA » (`cmp-tete-l`, prop `entete`, `BrewerBudget` repliable passe `entete={false}`), « Questions aujourd’hui »/« questions » (limites et plafond), repliable « Limites quotidiennes et par question » retiré (DAILY/PER_QUESTION/cap supprimés ; les limites par question et jetons sont envoyées inchangées), note « Limite atteinte » en dernier, notice après la suspension, carte « Le budget repart » via `moisDuBudget` (mois du serveur, sinon jour de l’usage, sinon rien), pied `cmp-pied cmp-pied-l`, exports `PLACEHOLDER_PLAFOND`, `BandeauPlafond`.
- `src/ui/BrewerActivity.tsx` : flèche « Retour au fil » + titre visible `cmp-tete-l`, ligne « Repartir à zéro · nouvelle conversation › » (confirmation nommée, `api.reset`, puis ouvre le compagnon), `origine` lue dans `detail.scope` de l’événement `brewer-inbox-open`, sinon portée de l’écran, sinon pas de ligne ; statut « Réponse prête · attention/urgent » (de `job.turn.advice.level`) ; « Échec · rien compté » seulement si `estPlafondAtteint(error.code)`.
- `src/ui/companion/limites.css` : `.cmp-in` 72×36, mono 18 px 700 ; pied `cmp-pied-l` en ligne ; en-tête du Sheet réduit au × (`.cmp-root:not(.cmp-une) > header`, `.cmp-conv-sheet > header`, titre sr-only) ; feuille à 94dvh (100dvh au bureau) ; `cmp-lim` min-height ; `cmp-pause` ; poignée masquée sur `.cmp-conv-sheet`.
- `src/ui/companion/conversations.css` : pied sur une ligne (texte 13 px à gauche, bouton plein à droite), confirmation sans filet.
- `tests/integration/companionFx2c.test.tsx` (nouveau, **jamais lancé**).

## Tests (fin de passe)
- `brewerBudget.test.tsx` : libellé « Questions aujourd’hui » ; le test des limites par question est remplacé par « plafond du jour hors bornes (blur, ramené à 1000) et aucun champ par question » ; `expandAdvanced` retiré.
- `companionFx2c.test.tsx` : pas de bouton `/Compagnon :/` (la pastille n’existe que s’il y a un travail en cours ou non lu) ; la feuille s’ouvre par l’événement `brewer-inbox-open` (BrewerChat l’envoie avec `detail.scope`, ligne 834) : le test l’envoie. « 4 sur 120 » corrigé en « 4 sur 1 000 » (valeur par défaut, pas celle du banc). 23/23 verts ; `controle-port` tests, tsc, noms, build : PORT OK.
- Reste (non fait ici) : captures cave 390 et 1280, câblage `PLACEHOLDER_PLAFOND` et `<BandeauPlafond />` dans BrewerChat.

## Reste à faire (dans l’ordre)
1. `tests/integration/brewerBudget.test.tsx` : remplacer `findByText('Appels aujourd’hui')` par `'Questions aujourd’hui'` (ligne ~46) ; supprimer `expandAdvanced` (ligne 27) et le test « règle aussi les limites par question… » (le repliable n’existe plus ; couvert par le dernier test de companionFx2c).
2. Lancer : `npx vitest run tests/integration/companionFx2c.test.tsx tests/integration/brewerBudget.test.tsx tests/integration/brewerNavigation.test.tsx tests/integration/companionComposants.test.tsx` dans le worktree ; corriger (dans fx2c : le mock Sheet de companionFx2c ne rend pas `footer` pour le titre… à vérifier ; `job.turn` peut ne pas survivre à `brewerJobs.merge` : sinon passer par `brewerJobs` ou retirer l’assertion et le dire).
3. `node work/missions/2026-11-14-compagnon/outils/controle-port.mjs noms|tsc|tests` depuis la racine partagée (tsc d’un autre groupe peut être rouge).
4. Captures `TOUT=1 node …/banc-fx2c.mjs limites plafond conversations menu repartir` : ouvrir cave 390 et 1280 clair, côte à côte avec `work/refonte-frontend/v4/outils/pages/2026-11-14-compagnon/img/p2a-limites.png`, `p2a-plafond.png`, `p2a-conversations.png`. Vérifier : sur 1280 (panneau 460 px, `.cmp-root` fixé à 100dvh), `cmp-lim` et pied bien en bas ; `cmp-pied-l` colle au bas en défilant.
5. Commit par chemins (message français + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`), arrêter Vite 3014.

## Défauts, statut (sur 390 clair, capture ouverte)
**limites** : 1 corrigé (flèche + « Limites IA » 16 px 700, sans sous-titre ; capture vue) ; 2 corrigé ; 3 corrigé (36 px, mono 18 px 700 centré, mesuré) ; 4 corrigé + banc (la fixture du banc n’avait pas `month` ; la carte s’affiche maintenant même sans, via `day`) ; 5 corrigé (retiré ; **le réglage des limites par question et en jetons n’existe plus dans l’interface** : à signaler au pilote) ; 6 corrigé (pied fixe, filet, Annuler à gauche, Enregistrer noir à droite) ; 7 corrigé (note en dernier) ; 8 banc (« Me notifier » éteint : l’enregistrement push échoue au banc, d’où un message rouge parasite sur la capture).
**plafond** : 1 banc fait (capture `plafond-390-clair.png` du vrai cadre : bulle gardée, barre ambre 15,00/15 CHF, « 4 sur 120 questions », 15 → 20 CHF, curseur, Plus tard / Relever, Régler toutes les limites, budget qui repart, réponses prêtes) ; 2 **impossible dans mes fichiers** : le placeholder et la ligne « ⏸ Une nouvelle question sera gardée ici » vivent dans `BrewerChat.tsx` (fx2b/pilote). Fournis : `PLACEHOLDER_PLAFOND` et `<BandeauPlafond />` exportés de `BrewerBudget.tsx`. Câblage à faire : `placeholder={budgetResume(status).atteint ? PLACEHOLDER_PLAFOND : …}` et `<BandeauPlafond />` dans `avant` de `PiedSaisie`.
 Défauts vus hors de ma part, sur la capture plafond : message rouge « Budget IA du mois atteint. » et boutons « Relancer l’analyse » / « Reformuler » sous le cadre (BrewerWorkCard dans `BrewerChat.tsx`), absents de la maquette ; la saisie fait 66 px de haut (commun 4, fx2b ?).
**conversations** : 1 corrigé ; 2 corrigé (ligne + confirmation ; **demande un câblage hors de mes fichiers** : `BrewerChat.ouvrirConversations` doit envoyer `new CustomEvent('brewer-inbox-open', { detail: { scope } })`, sinon la ligne ne se montre que pour une conversation de la portée de l’écran ; le banc simule le détail) ; 3 dérivé de `job.turn.advice.level` (seulement quand le tour est gardé sur l’appareil) ; 4 dérivé en partie : « rien compté » seulement pour les codes de plafond de budget ; pour les autres échecs, le serveur ne dit pas si un coût a été compté → « Échec · à relancer » gardé (impossible, dit) ; 5 banc (fixture : j’ai mis Brassin 30/29, mais la capture reste de ma fixture) ; 6 corrigé ; 7 corrigé (feuille 94dvh, 793 px de haut sur 844) ; 8 menu ⋯ capturé (`menu-390-clair.png`) : seulement « Supprimer » ; la maquette montre aussi « 🔔 Me notifier » par conversation : **absent, aucune notification par conversation dans l’app** (impossible, dit) ; bascule éteinte = banc.

## Doutes
- `.cmp-root:not(.cmp-une) > header` suppose que seule la vue Limites n’a pas `cmp-une` (vrai dans BrewerChat à ce jour).
- Hauteur du pied de limites au bureau 1280 non vue.
- Tests de companionFx2c jamais exécutés.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
