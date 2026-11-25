TESTS ROUGES 30 rouges / 40 total (voir le hash du commit dans la réponse)

# RESULTAT note-tests

## Fichiers écrits
- tests/unit/noteRegles.test.tsx (40 tests, blocs « N1 » à « N5 »)
- tests/fixtures/note/carnet.ts, frais-envoi.html, conditions-vente.html, guide-stockage.html
- ce dossier : tests-rouge.log (dot), tests-rouge.detail.log (verbose, 1er lancement : motif de chaque échec)
- Aucun fichier de src/ ni functions/ modifié par cette voie (le `git status` montre src/ui/finance/UpgradeWorkspace.tsx et des fichiers non suivis : déjà là au départ, d'autres sessions).
- Le seul .skip du cas R4 avec critère (tests/unit/c48Regles.test.tsx l. 253) porte déjà son critère (« CADUC (c56-tests, 24.11) … règle R30 ») : rien à changer.

## Ce que le port D451 a déjà (regardé avant d'écrire)
- `Rattache {carnetId, citation}` et `Etiquette` : rattachent un MESSAGE à un CARNET, jamais à un article (src/domain/carnets/modele.ts, operations.ts `remplacerRangement`).
- « ta note » : provenance sur la feuille NoteAiguillage et le fil (C67-8 ne concerne que « Piste : … »).
- Contexte IA : functions/src/carnetIA.ts `CarnetCompact.articles` = `{nom, valeurs?}` : ni id ni domaine ; aucun `articleId` dans le schéma ; aucun fait sur `Article`.
- Les gardes verts sont donc seulement ceux qui défendent contre un rattachement trop large (rien n'est rattaché aujourd'hui) et la consigne qui range une page sans prix en note.

## Sortie décisive
`npx vitest run tests/unit/noteRegles* --reporter=dot > …/tests-rouge.log` : Tests 30 failed | 10 passed (40), 1 fichier.
Par règle (rouges / total) : N1 4/7 · N2 7/7 · N3 5/5 · N4 3/6 · N5 11/15. Chaque règle a au moins un test rouge.
Les 10 verts, tous nommés « garde-fou (déjà juste, à garder juste) » : N1 ×3 (articleId inconnu, citation absente du texte, deux sites .fr), N4 ×3 (aucune lecture partie seule, une par forme de note), N5 ×4 (la consigne actuelle range les 3 pages sans prix en note ; conditions et guide ne posent aucun port).
Motifs des rouges vérifiés dans tests-rouge.detail.log : le champ du carnet, la feuille Articles, la fiche et Comparer se montent et se lisent ; les échecs sont bien « pas de ta note », « article sans id ni domaine dans le contexte », « page d'information devenue 3e article / 3e colonne de Comparer », « livraison de MotlerHops absente ».

## Essais
Un lancement de réglage (verbose), puis le lancement final : aucun test corrigé après coup à cause du code ; seul un nom de test a été précisé.

## Doutes et limites
- Le contrat que les tests posent (à lire avant de corriger) : le contexte porte `articles[].id` et `articles[].domaine` ; la ligne « note » de l'IA porte `articleId` + `citation` (sous-chaîne de la phrase) ; le fait se lit « ta note » + sujet (dispo, qualité, délai ; regex) + date « 24 nov » sur la carte de la feuille Articles, la fiche et la colonne de Comparer ; un bouton /annuler|retirer|détacher|enlever/ sur la fiche l'ôte sans supprimer la note ; la proposition dit « Vérifier la dispo chez MotlerHops » (ou le délai / la livraison) avec un bouton « Relire ».
- Non figé volontairement (À LUI, mini maquettes) : l'endroit exact du fait (badge, ligne, sous l'article) et le poids du doute sur le rang : aucun test ne lit un rang ni une place. Le texte exact « dispo douteuse · ta note, 24 nov. » est celui de la synthèse : les tests lisent « dispo », « douteu », « ta note », la date.
- N3 : ses mots sont cherchés sur la fiche. La note rangée dans le carnet garde le texte que l'IA lui donne (mise en forme) : ce n'est pas testé ici.
- N5 : la page « frais d'envoi » est lue par `lirePage` réelle sur la fixture HTML, puis le port (7,50 €) est posé à la main dans `livraison` : la lecture réelle d'une page sans produit n'est pas relevée (lirePage rend sans doute « illisible » sans nom ni prix). Le correctif devra faire passer le port de la page à l'article ; si `lirePage` ne le lit pas, ajouter l'extraction (IA sur le texte de la page) et mettre la fixture à jour.
- Le tableau de Comparer est lu par colonne : l'en-tête doit garder le nom lu (« CITRA® (US) » / « Hopfenpellets »).

## DEMANDE RELEVE
Aucune réponse réelle de l'IA n'existe pour ces cas (note rattachée à un article ; lien d'information). Les réponses de tests/fixtures/note/carnet.ts sont SIMULÉES (marquées dans le fichier). À relever, après le correctif du contrat (schéma `articleId`), avec accord de budget Gemini : 1) la note « le site français semble ne plus avoir de stock » dans un carnet de houblons aux 2 articles ; 2) le lien d'une page de frais d'envoi collé dans ce carnet. Coût à estimer avant envoi ; journal ia-journal.jsonl.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
