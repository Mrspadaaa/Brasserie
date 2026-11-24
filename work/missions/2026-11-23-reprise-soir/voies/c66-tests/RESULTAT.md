TESTS ROUGES 30/40 (R51 3, R52 4, R53 5, R54 4, R55 4, m 10) — hash dans la réponse finale

# RESULTAT c66-tests

## Fichiers écrits
- `tests/unit/c66Regles.test.tsx` (40 tests, un `describe` par règle : « R51 » à « R55 », puis les m C65-4/C66-7, C65-6/C66-6, C66-8).
- `tests/fixtures/c66/carnets.json` (pellets Hopfenmarkt + MotlerHops, lien MotlerHops seul, fiche à doublons). Brau n'y est pas : le test le tire de la vraie page lue (`tests/fixtures/c64/brau-citra-136.html.gz`) par `relireArticle`, donc l'article tel que l'app le garde.
- `voies/c66-tests/tests-rouge.log` (sortie `--reporter=dot`). Aucun fichier de `src/` ni `functions/` écrit par la voie (les `M src/ui/carnets/*` du `git status` sont d'avant). Le `.skip` du cas R4 de `c48Regles` est inchangé : aucune des règles R51..R55 ne le touche.

## Sortie décisive
`npx vitest run tests/unit/c66Regles* --reporter=dot` : `Tests 30 failed | 10 passed (40)`. Aucune erreur de montage ni de syntaxe : les 30 échecs sont des `AssertionError` sur le comportement.

## Rouges par règle (cause lue dans le log)
- R51, geste par `CarnetsVue` monté (carnet ouvert → pastille « Articles » → Retirer sur la carte glissée → Annuler) : 3/3 rouges. L'Annuler (« Article retiré · … · Annuler », « Rangé dans … · Annuler ») est monté dans `article.cn-page`, sous le voile de la feuille. Règle testée : Annuler dans la feuille, ou feuille fermée, ou monté hors de la page (portail). Le test « l'article revient » cliquerait Annuler ; il échoue avant, sur la position.
- R52 : 4/4 rouges. Carte Brau « ? CHF/kg » ; tableau cellule « ? » ; « Selon la quantité » à 1 kg : « Hopfenmarkt 62 | MotlerHops ≈40 | Brau ? » ; fiche « je prends » : seulement 5 kg et 20 kg (ni au gramme ni 1 kg).
- R53 : 5 rouges (carte 1re, rang 1 du tableau, colonne ① de Comparer : tous Hopfenmarkt ; bouton Choisir de Comparer ; test d'ensemble). Verts (justes dans le code actuel) : case verte CHF/kg du tableau, ligne verte de « Selon la quantité », barres, ✓ de la ligne CHF/kg, compromis : tous disent MotlerHops. C'est l'incohérence même du C66-3 : trois surfaces disent Hopfenmarkt, cinq disent MotlerHops.
- R54 (geste : FicheArticle monté, bouton cliqué) : 4 rouges. « Part dans À venir : … 6,70 CHF » (attendu 62,20) ; bloc Offre « 6,70 CHF » ; à 5 kg idem ; MotlerHops : « ≈4 CHF rendu » (le sachet de 50 g) au lieu du kilo. Verts : le bouton dit « Choisir · Hopfenmarkt, 1 kg » et se touche ; la ligne cochée du « je prends » est 1 kg à 62,20.
- R55 : 4 rouges. Une seule ligne égale (Origine ×3) non repliée ; α : aucun ✓ sur le meilleur (13,6) ; une seule ligne cochée (CHF/kg) ; ligne « Conditionnement g | 100 | 50 | ? ». Verts : deux lignes égales et plus se replient déjà (« 2 identiques ▸ pellets, États-Unis »), le ✓ du CHF/kg.
- m : C65-4/C66-7 2 rouges (carte lue, variante `complete` : « ≈3 CHF » + « 50 g · 73,80 CHF/kg » ; attendu ≈4, `PrixTexte converti`) ; C65-6/C66-6 6 rouges (récolte ×3 dont « Ernte », alpha ×2, bêta ×2, forme ×2, pays ×2, conditionnement ×2) + 1 « Ernte en allemand » ; C66-8 1 rouge (« Collier de serrage… » devient un critère, IA refusée).
- 10 verts au total, tous des garde-fous : ils fixent ce qui est déjà juste pour qu'un correctif ne le défasse pas.

## Essais
Boucle courte : 5 relances. Corrections de mes propres tests : (1) `statut="validated"` cachait le bouton Choisir de Comparer, mis à `research` ; (2) fixture : dispo de Brau « sur commande », sinon la ligne Disponibilité (identique) faisait croire à 2 lignes égales et masquait le cas « une seule ligne égale » ; (3) la carte lue est la variante `complete` ; (4) « Ernte » se juge sur les intitulés `dt`, le texte collé n'a pas de limite de mot.

## Doutes et limites
- R51 : jsdom ne charge ni CSS ni empilement. « Visible au-dessus de la feuille » est jugé sur la structure (dans la feuille, feuille fermée, ou monté hors de `article.cn-page`). Un correctif par un autre moyen (z-index seul, bandeau fixe en CSS) passerait quand même pour « derrière ». La capture en ligne reste le juge.
- ✓ de R55 : jugé sur la classe `cn-meilleur` (`carnets-decider.css` : `td.cn-meilleur::before { content: "✓ " }`), pas sur le glyphe.
- DÉCISION À PRENDRE : R55 « une seule ligne égale se replie » contredit le commentaire du code (« un seul égal ne se replie pas », `Comparer.tsx` l. 508). J'ai suivi BUGS.md C66-5 (« Origine États-Unis ×3 en ligne ») et la maquette v01. Si le pilote garde « 2 identiques au minimum », il retire ce seul test ; recommandation : garder (v01 replie dès qu'il y a une ligne égale).
- DÉCISION À PRENDRE : C66-7 contre D447 (`PrixTexte converti` : la fiche complète garde le converti nu « ≈3 »). Le test suit BUGS.md (un seul prix du sachet, ≈4). Recommandation : suivre le BUGS, le brasseur a dit « le même partout ».
- Récolte (C66-5 « le meilleur coché sur chaque ligne ») : non testée (deux 2025 à égalité, une inconnue : le ✓ sur « 2025 » de v01 n'a pas de règle écrite). Seules les lignes chiffrées (CHF/kg, α) sont exigées.
- La fiche Brau « je prends » : le test exige « au gramme » et « 1 kg … 80 » ; 5 kg et 20 kg ne sont pas exigés (ils existent déjà, tirés de la page).

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
