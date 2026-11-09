OK — totaux faux en rouge, gestes honnêtes, rangées sans chevauchement, un seul bouton « Documents » ; 3 024 tests verts, captures ouvertes

## Fichiers écrits
- `src/ui/finance/controlesCroises.ts` : `estTotalFaux`, `CLES_TOTAUX`, `gesteMontants`, `montantDeLaLigneManquante`, `resumeDuBloc`, champs `resume`, `ligneSuspecte`, `photo` ; renvoi `montants` supprimé ; « Articles lus » : valeur « 5 · 2 rabais » + note « annoncé par la lecture ».
- `src/ui/finance/controlesCroisesVue.tsx` : rouge `alert` (cadre, « ! », écart, geste, en-tête), `data-dp-ton`, rangées en `flex-wrap`.
- `src/ui/finance/ExpenseSheet.tsx` : `surRenvoi` (manquante → ajoute la ligne ; plus de focus recherche), `ajouterManquante(montant?)`, `surDocuments`, sélecteur unique, `MESSAGE_DEPOT`, `sansUnDocument`, en-tête par `resumeDuBloc`.
- `src/ui/depense/Pages.tsx` : `EntreeFendue` remplacé par `EntreeDocuments` (un bouton, picto `Files`).
- Tests adaptés ou ajoutés : `tests/unit/finance/controlesCroisesD2.test.ts` (+11), `tests/unit/depense/pages/{entree,entree-reelle,rangee,parcours,alleger,cadre}`, `tests/unit/depense/{depenseTotaux,g7/ecran-g7,raccord/changer-fichier}`, `tests/integration/{depenseTotaux,depensePiece,financeQuickActions}`.
- Voie : `banc/` (banc s1 + `bauhaus-piege`, `bauhaus-piege-confirme`, `bauhaus-un-manque`, `pharmacie-2pages`, `entree`, `entree-saisie`), `capturer-p1.mjs`, `console-p1.txt`, `tests.txt`, `captures/` (PNG + 16 montages clair | cave).

## Ce qui a changé
1. **Rouge.** Une rangée `articles`, `somme` ou `paye` en écart est rouge `alert` (cadre, « ! », écart, geste) ; l'en-tête « À vérifier » aussi dès qu'une l'est. Désaccord des lectures, Qté × prix, « Prix connus », TVA restent ambre (vu en capture : copie, tâche, pharmacie).
2. **Renvois.** « Ajouter la ligne manquante » ajoute la ligne, ouverte, focus sur son libellé (seul champ focalisé), montant = le manque si l'écart d'articles est −1 (vu : 74,45 sur `bauhaus-un-manque`), vide sinon (31 comptées : vide ; tâche, 6 manquent : vide). Compte concordant et somme fausse : « Ouvrir la ligne suspecte » (la ligne de « Prix connus », `bauhaus-copie` : ligne 1 ouverte, aucun champ focalisé) sinon « Comparer à la photo » (justificatif ouvert, `bauhaus-piege` et `-confirme`), sans justificatif « Voir la liste ». Plus de « plus grosse ligne » ni de « Vérifier les montants ».
3. **Pharmacie.** « Articles lus 5 · 2 rabais » avec « annoncé par la lecture » en note ; la rangée passe à la ligne au lieu de chevaucher (mesure `chevauchements []` sur 24 vues, 390 et 1280) ; en-tête « À vérifier · 1 désaccord de lecture » ; pour les contrôles de la pièce l'en-tête dit « Prix connus 1 ligne à revoir ».
4. **« Documents ».** Un bouton, un sélecteur `application/pdf,image/*`, `multiple`, sans `capture` (mesuré en Chrome). Un fichier → `attach` ; plusieurs images → pages (`ajouterPages`) ; un PDF parmi plusieurs → refusé et dit, rien lu. Même règle au dépôt et à « Changer ». Discret : « Joindre des documents ». « Photographier le ticket » et « Saisir sans justificatif » restent.

## Critères
- `npx tsc --noEmit -p .` : sortie vide.
- Tests (`tests.txt`) : `Test Files 232 passed | 1 skipped (233)` ; `Tests 3024 passed | 4 skipped (3028)` ; zéro rouge. `tests/integration/financeQuickActions.test.tsx` : 7 verts (rejoué à part).
- `npm run build` : « built in 14.46s », contrôles DRAPEAUX OK.
- Captures Chrome réel (puppeteer-core, Vite :5199 lancé puis arrêté), 390 tactile (tap) et 1280 (clic), clair et cave, 6 cas + 2 entrées, TOUTES ouvertes (montages clair | cave) : repos, après chaque pastille rouge, entrée. `document.activeElement` après chaque toucher (console-p1.txt) : bouton touché, ou `TEXTAREA`/`INPUT[Libellé ligne N]` après « Ajouter la ligne manquante », jamais un autre champ.
- L13 : les assertions changées (« Vérifier les montants », focus recherche, deux boutons, « annoncé » dans la valeur, ambre du drapeau) ont échoué sur le nouveau code avant adaptation (9 rouges relevés) ; les tests ajoutés visent les nouveaux exports. Je n'ai pas rejoué HEAD (ni stash, ni commit interdits).

## Essais
Un essai par point. Détours : apostrophes perdues par le Bash du poste dans mes scripts de réécriture de tests (corrigées par `String.fromCharCode`), faux positif de mon détecteur de chevauchement (1 relance), banc pharmacie sans la TVA du 2ᵉ ticket (1 relance), 2 relances complètes des captures (en-tête « Prix connus 1 ligne à revoir »).

## Défauts de la capture pharmacie : traités et non touchés
- Traités : chevauchement « Articles lus » ; en-tête « Lectures · 2 pages ».
- Non touchés (ma lecture) :
  - pastille « ! 7 lignes » : juste, un désaccord pèse sur la lecture ; rien à corriger.
  - barre du bas (« … prix unitaire … désaccord », Garder/Voir) : c'est le pied qui dit le pire point (D277), fixe, il masque le bas de la liste et coupe son texte (`Pied.tsx`, non lu en détail). Pas un défaut sûr : changer sa hauteur ou son texte est un geste de conception ; piste : texte d'une ligne (« ligne 6 : prix unitaire ? ») et réserve de défilement égale à sa hauteur.
  - « Autres 6 · 4 pièces » : exact (6 lignes dont 2 rabais) mais l'écart 6/4 déroute ; piste : « Autres 6 · 4 pièces · 2 rabais ».
  - la chip « 1 à contrôler » répète la rangée « Lectures · 1 désaccord » juste au-dessus ; piste : la retirer quand la rangée est là.
- Banc : `nPagesLues` n'est pas appliqué par `applyOutcome` du banc (la rangée dit « Lectures » et non « Lectures · 2 pages ») ; l'en-tête est couvert par un test unitaire (`resumeDuBloc`).

## Limites
- Le justificatif du banc est une image cassée (« Justificatif source ») : ouverture vérifiée (`justificatifOuvert: true`), pas son contenu.
- Les messages `src/services/pagesJustificatif.ts` et `geminiScanner.ts` nomment encore « Un document » (hors de ma possession) : l'écran les réécrit en « Documents » (`sansUnDocument`). À changer à la source un jour.
- « Prix connus » sans stock chiffré : « Comparer à la photo » (la photo est le seul recours) ; vrai sur le ticket BAUHAUS en ligne tant que le stock n'a pas ses prix.
- Pas de Gemini ni de donnée réelle ; banc anonymisé (« Brico Fictif SA », « Sun Store Fictive SA »).

DÉCISION À PRENDRE : aucune bloquante. Option : retirer la chip « 1 à contrôler » quand la rangée « Lectures » la double (recommandé, hors contrat ici).

CONNAISSANCE : une ligne ajoutée à la main avec le montant du manque fait passer « Somme ≠ imprimé » au vert (« Somme = imprimé + ajouté ») ; l'écart d'articles reste rouge tant que la ligne n'est pas lue (vu sur `bauhaus-un-manque`, 1280). Le Bash du poste mange les `\'` des scripts de réécriture : passer par Edit/Write.

LEÇON PROPOSÉE : aucune.
