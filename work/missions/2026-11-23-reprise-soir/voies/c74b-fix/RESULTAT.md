ECHEC — c74bRegles.test.tsx : 15 rouges sur 50 (41 au départ) ; reste R95 fil ancien, R96 Planning/Résolu, C73-2/3/6 ; 2 conflits avec c53/c58/c59/c61/c67

# RESULTAT c74b-fix (25.11)  —  " Tests 15 failed | 143 passed (158)"

## Plan (règle -> endroits -> correctif) et état
- R92 champ replié : carnets.css (.cn-champ 41 px, bande 53 px, photo/micro 34 px). VERT (5/5).
- R93 (B d'abord) : tableauRegles.paliersDe lit « Poids » (73,8 CHF/kg comme la fiche), classerAuKilo classe dès UN kilo connu, TableauCarnet « à relire » + rang « ? » sans base, alpha.nomAlpha (houblon dont le nom ne dit pas le %), prixChoisi (jamais 0,10 en À venir), Choisir.articleHonnete. VERT (10/10). Aucune écriture : recalcul à l affichage.
- R94 : alpha.fourchetteSerree (« 10–15 »), tableau sans chasse fixe, Choisir : prix dit une fois, « pourquoi » = base du prix au kilo, 8 lignes de valeurs + « + n autres valeurs » replié. VERT sauf 4 (voir conflits).
- R95 : filRegles.texteDuFil (lien court domaine + titre), 1re bulle = titre masquée. VERT (liens, titre). ROUGE : rangement proposé d un fil ancien (option, Résolu, tâche) : NON FAIT (voir limites).
- R96 : analyseLocale.analyserLigne (écart « 4 CHF de plus » = note, constat jamais critère). VERT (fonction + 3 gestes). ROUGE : proposition Résolu ; carnet importé du Planning (budget hors Critère, Quand, À faire).
- R97 : tacheDatee « semaine du 14 décembre » VERT ; C73-4 dédoublonnage des notes VERT ; C73-5 « Balance neuve » + jeton piste VERT. ROUGE : C73-2 (tuile 620), C73-3 (essayé), C73-6 (bandeau hors ligne).

## CONFLITS entre tests (je n ai pas modifié de test)
1. R94 « α une fois » (c74b : Brau 13,6 ; Motler 10–15 ; fiche sans « 10 - 15 ») contre c53 R16, c59 R38, c61 R45, carnetsFix28Fiche, qui exigent « Alpha » en tête de la GRILLE de la fiche. J ai gardé les vieux tests verts : la grille garde Alpha. DÉCISION À PRENDRE : retirer Alpha de la grille quand la tête de fiche le dit (maquette D451 : alpha en gros) et mettre à jour les 18 vieux tests. Recommandation : oui, c est sa plainte du 25.11.
2. R94 Offre vide (c74b : le corps ne réclame pas 100 %) contre c58 R34 (prix à droite, flex 1 1 100 %). CSS gardé à 100 % ; DÉCISION : une autre mise en page des gestes (grille) à dessiner.
3. R97 C73-3 « essayé » : le filtre « écartées seulement » casse c67 C67-10 ; non gardé.

## Limites / non fait (tours épuisés)
- Rangement proposé d un fil ancien (R95) : à écrire = fonction pure rangementPourFilAncien(doc, messages) (options « Autre … : », Résolu, tâche par genreLocal) + carte « Ranger ? » ; écriture seulement sur son geste. Aucune écriture sur ses données dans ce qui est livré.
- Import du Planning (R96) : voir carnetDeTache (scripts/planning-vers-carnet) : critère budget -> « Budget 850 CHF », Quand = date du Planning.
- Pas de registre BUGS (C74B -> corrigé en local) ni controle-liste-compacte confirmé : le contrôle a tourné en arrière-plan, sortie non lue. Pas de capture : à voir en ligne.
- tsc racine : 2 erreurs connues seulement ; functions : 0.
DÉCISION À PRENDRE : voir CONFLITS 1 et 2.
CONNAISSANCE : le Bash de ce poste perd les barres inverses dans un script node : utiliser Edit.
LEÇON PROPOSÉE : aucune
