OK — bandeau sur le rangement final, lien seul titré par son domaine, suppression visible et focalisée

Lot L1-fil-bandeau-suppression, correction 1 du port du carnet (17.11). Worktree `port-carnet`, branche `claude/port-carnet-1711`, sans commit.
Base : CRITIQUE-1.md absent ; constats tirés de vision-1 (numérotation du pilote, P1, P2, P3, P9).

## Fichiers écrits (tous dans « Possède »)

- `src/ui/carnets/rangement.ts` : `retourDuRangement(effets, { depuis, plusieursLignes })`, fonction pure : `cree` | `range` | `ailleurs` | `vrac` | null.
- `src/ui/carnets/CarnetsVue.tsx` : `retourDe` lit les effets finaux du message dans le magasin. Le retour local reste en réserve (`attente`) tant que l'IA tourne. Il paraît seulement si l'IA échoue ou si on coupe (✕). Après l'IA : carnet créé (on reste dedans, en tête), ou « Rangé dans … » (retour à la liste, rien « en tête »). Annuler défait l'écriture IA puis l'écriture locale. Le ✕ coupe l'envoi actif (`envoiActif`) même après le changement de vue. Avant : il visait un déroulé recréé, sans effet. La carte Supprimer passe dans le slot `bandeau` de CarnetOuvert. Le cadre est masqué pendant la suppression.
- `src/ui/carnets/Bandeau.tsx` : `cree.titreDe` (`phrase`, `page`, `site`, `ia`) ; seul `phrase` dit « votre phrase en titre ». `ailleurs` gagne la coche, `cite` (« votre message : « … » »), `article` (nom, domaine · pays, prix, « exemple ») et la raison de l'IA. Déplacer n'y est plus obligatoire.
- `src/ui/carnets/SupprimerCarnet.tsx` : au montage, `focus({ preventScroll })` puis `scrollIntoView({ block: 'nearest' })` ; `tabIndex={-1}`.
- `src/domain/carnets/modele.ts` : `domaineDuLienSeul`, `estLienSeul`. `titreDePhrase` rend le domaine quand la première ligne n'est qu'un lien, donc `carnetDepuisPhrase` aussi (R48). L'écriture du calendrier n'est pas touchée. Le motif du lien sans schéma est celui de `liensDuTexte`, puis `new URL`.
- Tests : `tests/unit/carnetsModele.test.ts` (+3, et 8 → 9 messages, voir Doutes), `tests/unit/carnetsRangement.test.ts` (+5), `tests/integration/carnetsParcours.test.tsx` (+5).
- Captures (13) et `journal-captures.txt` dans `captures/`.

## Problème → fait → preuve

- **P1** (lien collé depuis la liste, rangé dans Ventilation, bandeau « Carnet créé »)
  - Fait : le bandeau suit les effets finaux. Il dit « ✓ Rangé dans Ventilation de la salle de brassage, à l'instant · Annuler », avec l'article et le lien en clair. On revient à la liste, sans carte « créée » en tête (état 20, g5:v06-14). Annuler ramène les articles à 6 et le nombre de carnets d'origine, et retire le message.
  - Preuve : test « lien collé depuis la liste… Annuler défait le rangement réel », vert. Captures ouvertes : `m390-clair-p1-lien-liste-apres.png`, `m390-sombre-…` et `d1280-clair-…` (journal : `vue=liste | bandeau=✓ Rangé dans Ventilation…`).
- **P2** (« Carnet créé » sans carte quand l'IA range ailleurs)
  - Fait : la même règle s'applique à une phrase. « chambre froide pour garder 6 fûts » donne « ✓ Rangé dans Frigo de garde pour fûts ». Une idée neuve donne « ✓ Carnet créé, en tête des Carnets · Annuler » et « « doseur de sucre pour la refermentation » · votre phrase en titre », carnet ouvert (g5:v04-4). « Embouteillage » mis en majuscule par l'IA compte toujours comme sa phrase.
  - Preuve : tests « … Frigo existant » et « idée neuve… (R11) », verts ; `retourDuRangement` a 5 cas unitaires. Captures `m390-clair-p2-phrase-frigo-apres.png` et `m390-clair-p2-creer-apres.png` : texte relu au journal, images non ouvertes.
- **P3** (URL brute en titre pendant la lecture)
  - Fait : pendant la lecture, le titre est « exemple.invalid » et le lien reste en clair dans le cadre (g5:v03-10). Après lecture : le nom lu, sinon le domaine. Le bandeau dit alors « le site en titre », jamais « votre phrase en titre ». Avant l'envoi, depuis la liste, le cadre « Créer » dit pour un lien seul : « L'IA lit la page, puis range le lien dans le carnet qui en parle, sinon dans un nouveau, au nom de la page ».
  - Preuve : 3 tests du modèle (www., ponctuation, domaine nu, `St.Gallen`/`v1.2`/`e.g.` refusés, R48) et le test « IA en panne… le site en titre », verts. Captures ouvertes : `m390-clair-p3-lien-pendant.png` (titre exemple.invalid, cadre « lecture de la page… ») ; `m390-clair-p3-lien-apres.png` (journal : « · le site en titre »).
- **P9** (confirmation hors écran à 390)
  - Fait : la carte g4:v02-18 est placée sous le titre et la phrase, au-dessus de Ce qui compte. Elle prend le focus, défile dans la vue, et le reste est estompé.
  - Preuve : test « P9… » vert (carte enfant de `article.cn-ouvert`, entre `.cn-titre-ligne` et Ce qui compte, `activeElement` = carte, `scrollIntoView` appelé). Captures ouvertes : `m390-clair-p9-supprimer.png`, `m390-sombre-p9-supprimer.png` et `d1280-clair-p9-supprimer.png`. La carte va de 232 à 436 px sur 844 à 390, et de 226 à 389 px sur 800 à 1280, focus `cn-supprimer`.

## Contrôles

- `npx vitest run tests/unit/carnets* tests/integration/carnetsParcours.test.tsx` : 238 verts, 4 rouges, tous hors de mes fichiers. Les 4 rouges sont dans `carnetsComparer.test.ts` (cas 4 : un 6e article de Ventilation) et dans `carnetsOperations.test.ts` (3 cas : note ZZ-V-N2). Ils viennent du changement de `fixture.ts` par un autre lot (ZZ-MSG-V3, G29), pas de ce lot. Mes 3 fichiers de test sont verts : 16 rangement, modèle, 13 parcours.
- `npx tsc --noEmit -p tsconfig.json` : 0 erreur.
- Banc : vite dev sur le port 5291 avec une config Firebase factice (`demo-banc`, aucune donnée réelle, magasin mémoire), arrêté ensuite (« écoute restante: 0 »). Aucun build, aucun appel Gemini (IA simulée).
- Essais : P2 deux (« Embouteillage » ≠ « embouteillage » corrigé), les autres un. Captures en trois essais (networkidle, puis .env absent : config factice).

## Doutes et limites

- `carnetsModele.test.ts` passe de 8 à 9 messages : c'est la fixture changée par un autre lot. Si ce changement est retiré, remettre 8.
- G21 « Déplacer » n'est pas porté dans le bandeau « Rangé dans … » : il faudrait choisir le carnet d'arrivée. Le bouton paraît si `onDeplacer` est fourni.
- La raison « comme Ventilation » de v06-14 ne paraît que si l'IA la donne (`raisonCarnet`). L'IA simulée ne la donne pas pour un carnet existant, et rien n'est inventé.
- Banc en `ia=lent` : le retour arrive après environ 8 s (lecture plus rangement simulés). Normal au banc.

## Demande au lot L2 (carnets.css)

- À 390 comme à 1280, le titre et la phrase sont estompés derrière la carte de suppression ; g4:v02-18 les garde nets. Règle proposée : `.cn-grise > :not(.cn-supprimer):not(.cn-tete):not(.cn-titre-ligne):not(.cn-cite)`.
- `.cn-bandeau-article` (nom et prix de l'article dans « Rangé dans … ») n'a pas de style propre ; il hérite du padding de `.cn-bandeau > p`. Une vignette comme dans v06-14 serait à dessiner.

DÉCISION À PRENDRE : « Déplacer » dans le retour « Rangé dans … » (G21).
- Options : (a) une feuille « Déplacer vers… » avec la liste des carnets, plus « Nouveau carnet » ; (b) seulement « En faire un carnet à part » (rétablir le carnet local).
- Recommandation : (b), un toucher, réversible, sans écran neuf. Choix de geste du brasseur : à montrer en mini maquettes.

CONNAISSANCE : le banc `?preview=carnets` d'un worktree sans `.env` démarre avec des `VITE_FIREBASE_*` factices (projet `demo-banc`) passées à `npx vite` ; sans elles : « auth/invalid-api-key ».
LEÇON PROPOSÉE : un retour « après » d'un geste en deux temps (local puis IA) se calcule sur l'état final relu, jamais sur la première écriture ; et l'Annuler d'un envoi garde la chaîne des inverses.
